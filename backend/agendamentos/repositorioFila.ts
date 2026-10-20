/** Persistência de agendamentos: operações relacionadas no mesmo módulo. */
import { z } from "zod";
import { gravarLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { lerLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { LIMITE, Registro, registro, Trabalho, trabalhoSchema, ResultadoTrabalho, resultadoSchema, NovoTrabalho, ESPERA_BASE_MS } from "./tipos/fila.js";
import { randomUUID } from "node:crypto";

export const lerFila = (base?: string): Registro =>
  lerLocal<Registro>(
    'fila.json',
    registro as unknown as z.ZodType<Registro>,
    { version: 1, trabalhos: [] },
    base
  );

export const gravarFila = (registroFila: Registro, base?: string) => {
  // Preserva sempre pendências e execuções; limita apenas o histórico concluído.
  if (registroFila.trabalhos.length > LIMITE) {
    const ativos = registroFila.trabalhos.filter(
      trabalho => trabalho.estado === 'PENDENTE' || trabalho.estado === 'EXECUTANDO'
    );
    const finalizados = registroFila.trabalhos
      .filter(trabalho => trabalho.estado !== 'PENDENTE' && trabalho.estado !== 'EXECUTANDO')
      .sort((primeiro, segundo) => primeiro.criadoEm.localeCompare(segundo.criadoEm))
      .slice(-(LIMITE - ativos.length));

    registroFila.trabalhos = [...finalizados, ...ativos];
  }
  gravarLocal('fila.json', registro.parse(registroFila), base);
};

export function obterTrabalho(id: string, base?: string) {
  const trabalho = lerFila(base).trabalhos.find(item => item.id === id);
  if (!trabalho) throw new Error('JOB_NOT_FOUND');
  return trabalho;
}

export function mudarTrabalho(id: string, alterar: (trabalho: Trabalho) => void, base?: string) {
  const fila = lerFila(base);
  const trabalho = fila.trabalhos.find(item => item.id === id);
  if (!trabalho) throw new Error('JOB_NOT_FOUND');

  alterar(trabalho);
  trabalhoSchema.parse(trabalho);
  gravarFila(fila, base);
  return trabalho;
}

export const definirEstadoJiraDoTrabalho = (id: string, jira: Trabalho['jira'], base?: string) =>
  mudarTrabalho(id, trabalho => {
    trabalho.jira = trabalhoSchema.shape.jira.parse(jira);
  }, base);

export const fecharTentativa = (
  trabalho: Trabalho,
  estado: 'CONCLUIDA' | 'ERRO' | 'INTERROMPIDA',
  iso: string,
  codigo?: string
) => {
  const tentativa = trabalho.log.at(-1);
  if (tentativa && tentativa.fim === null) {
    tentativa.fim = iso;
    tentativa.estado = estado;
    if (codigo) tentativa.codigo = codigo;
  }
};

export const registrarBatimento = (id: string, base?: string, agora = new Date()) =>
  mudarTrabalho(id, trabalho => {
    if (trabalho.estado === 'EXECUTANDO') {
      trabalho.heartbeat = agora.toISOString();
    }
  }, base);

export const concluirTrabalho = (id: string, resultado: ResultadoTrabalho, base?: string, agora = new Date()) => mudarTrabalho(id, t => { const iso = agora.toISOString(); t.estado = 'CONCLUIDO'; t.resultado = resultadoSchema.parse(resultado); t.terminadoEm = iso; t.heartbeat = null; fecharTentativa(t, 'CONCLUIDA', iso); }, base);

/** Idempotente: a mesma chave nunca vira dois trabalhos. Retorna `criado:false` se já existir. */
export function enfileirar(n: NovoTrabalho, base?: string, agora = new Date()): { trabalho: Trabalho; criado: boolean } {
  const r = lerFila(base); const existente = r.trabalhos.find(t => t.chave === n.chave); if (existente) return { trabalho: existente, criado: false };
  if (r.trabalhos.filter(t => t.estado === 'PENDENTE').length >= 200) throw new Error('QUEUE_FULL');
  if (n.origem === 'AGENDA' && r.trabalhos.some(t => t.rotinaId === n.rotinaId && (t.estado === 'PENDENTE' || t.estado === 'EXECUTANDO'))) throw new Error('QUEUE_ALREADY_ACTIVE');
  const iso = agora.toISOString();
  const t: Trabalho = trabalhoSchema.parse({ id: randomUUID(), chave: n.chave, rotinaId: n.rotinaId, espacoId: n.espacoId, tipo: n.tipo, capability: n.capability, ambiente: n.ambiente, ticket: n.ticket, origem: n.origem, slot: n.slot,
    estado: 'PENDENTE', tentativas: 0, maxTentativas: n.maxTentativas ?? 3, criadoEm: iso, disponivelEm: iso, iniciadoEm: null, heartbeat: null, terminadoEm: null, resultado: null, erro: null, log: [], jira: { estado: 'NAO_APLICAVEL' } });
  r.trabalhos.push(t); gravarFila(r, base); return { trabalho: t, criado: true };
}

/**
 * Falha de infraestrutura (rede, serviço indisponível, runner ausente): retenta com espera crescente até o limite.
 * Falha de teste não passa por aqui: é um resultado (FAIL), registrado em `concluir`, e não se repete.
 */
export const falharPorInfraestrutura = (id: string, codigo: string, motivo: string, retentavel: boolean, base?: string, agora = new Date()) => mudarTrabalho(id, t => {
  const iso = agora.toISOString(); fecharTentativa(t, 'ERRO', iso, codigo); t.heartbeat = null;
  if (retentavel && t.tentativas < t.maxTentativas) { t.estado = 'PENDENTE'; t.erro = codigo; t.disponivelEm = new Date(agora.getTime() + ESPERA_BASE_MS * 2 ** (t.tentativas - 1)).toISOString(); return; }
  t.estado = 'ERRO'; t.erro = codigo; t.terminadoEm = iso; t.resultado = resultadoSchema.parse({ status: 'ERRO_INFRA', motivo: motivo.slice(0, 600) });
}, base);

export const listarTrabalhos = (base?: string) => lerFila(base).trabalhos;

/** Pega o próximo trabalho elegível. No máximo um em execução por projeto e um no total (concorrência 1). */
export function pegarProximoTrabalho(base?: string, agora = new Date(), bloquear: (t: Trabalho) => boolean = () => false): Trabalho | null {
  const r = lerFila(base); if (r.trabalhos.some(t => t.estado === 'EXECUTANDO')) return null;
  const t = r.trabalhos.filter(x => x.estado === 'PENDENTE' && Date.parse(x.disponivelEm) <= agora.getTime() && !bloquear(x)).sort((a, b) => a.disponivelEm.localeCompare(b.disponivelEm))[0];
  if (!t) return null;
  const iso = agora.toISOString(); t.estado = 'EXECUTANDO'; t.tentativas += 1; t.iniciadoEm = iso; t.heartbeat = iso; t.terminadoEm = null; t.erro = null;
  t.log.push({ n: t.tentativas, inicio: iso, fim: null, estado: 'EXECUTANDO' }); t.log = t.log.slice(-10); gravarFila(r, base); return t;
}

/** Início do worker: trabalho EXECUTANDO sem batimento recente foi interrompido (fechamento, queda, suspensão). Nunca vira PASS. */
export function recuperarInterrompidos(base?: string, agora = new Date(), limiteMs = 120000) {
  const r = lerFila(base); let n = 0; const iso = agora.toISOString();
  for (const t of r.trabalhos) {
    if (t.estado !== 'EXECUTANDO') continue; if (t.heartbeat && agora.getTime() - Date.parse(t.heartbeat) < limiteMs) continue;
    fecharTentativa(t, 'INTERROMPIDA', iso, 'INTERRUPTED'); t.heartbeat = null; n++;
    if (t.tentativas < t.maxTentativas) { t.estado = 'PENDENTE'; t.erro = 'INTERRUPTED'; t.disponivelEm = iso; }
    else { t.estado = 'ERRO'; t.erro = 'INTERRUPTED'; t.terminadoEm = iso; t.resultado = { status: 'ERRO_INFRA', motivo: 'Execução interrompida (aplicativo fechado, queda ou suspensão) e sem tentativas restantes.' }; }
  }
  if (n) gravarFila(r, base); return n;
}

/** Registra um slot que não será executado (PERDIDO/SUBSTITUIDO) sem confundir com execução. Idempotente pela chave. */
export function registrarPerdido(n: NovoTrabalho, motivo: string, base?: string, agora = new Date()) {
  const r = lerFila(base); if (r.trabalhos.some(t => t.chave === n.chave)) return;
  const iso = agora.toISOString();
  r.trabalhos.push(trabalhoSchema.parse({ id: randomUUID(), chave: n.chave, rotinaId: n.rotinaId, espacoId: n.espacoId, tipo: n.tipo, capability: n.capability, ambiente: n.ambiente, ticket: n.ticket, origem: n.origem, slot: n.slot,
    estado: 'PERDIDO', tentativas: 0, maxTentativas: 1, criadoEm: iso, disponivelEm: iso, iniciadoEm: null, heartbeat: null, terminadoEm: iso, resultado: { status: 'NOT_RUN', motivo }, erro: null, log: [], jira: { estado: 'NAO_APLICAVEL' } }));
  gravarFila(r, base);
}
