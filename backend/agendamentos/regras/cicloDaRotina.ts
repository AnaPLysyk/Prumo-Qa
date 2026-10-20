/** Operações e consulta da agenda — arquivos relacionados agrupados para manutenção. */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Rotina, evento, DadosRotina, dadosRotinaSchema, rotinaSchema } from "../tipos/rotina.js";
import { gravarAgenda, lerAgenda, alterarRotina, listarRotinas } from "../banco/agenda.js";
import { capacidadeDoK6 } from "../servicoK6.js";
import { obterEspaco } from "../../projetos/banco/projetos.js";
import { obterRunLocal } from "../../testes/banco/runs.js";
import { ErroQa } from "../../compartilhado/erros.js";
import { carregarProjeto } from "../../compartilhado/projeto/carregarProjeto.js";
import { estadoDaAutorizacao } from "../autorizacoes/estadoERevogacao.js";
import { lerAutorizacoes } from "../banco/autorizacoes.js";
import { listarTrabalhos } from "../banco/fila.js";
import { proximoHorario } from "../servicoHorarios.js";

// ── cicloDaRotina ──
// ── cicloDaRotina ──
/** Anota a ação e preserva somente os últimos 200 eventos. */
export function anotarNaRotina(rotina: Rotina, acao: z.infer<typeof evento>['acao']) {
  rotina.historico.push({ at: new Date().toISOString(), acao });
  rotina.historico = rotina.historico.slice(-200);
}

export function criarRotina(dados: DadosRotina, base?: string, agora = new Date()): Rotina {
  const validado = dadosRotinaSchema.parse(dados);
  const agenda = lerAgenda(base);
  if (agenda.rotinas.length >= 200) throw new Error('SCHEDULE_LIMIT');
  if (validado.frequencia.tipo === 'unico' && Date.parse(validado.frequencia.em) <= agora.getTime()) {
    throw new Error('SCHEDULE_IN_THE_PAST');
  }
  const rotina: Rotina = {
    ...validado,
    id: randomUUID(),
    estado: 'ATIVA',
    ancora: agora.toISOString(),
    ultimoSlot: null,
    criadaEm: agora.toISOString(),
    historico: []
  };
  anotarNaRotina(rotina, 'CRIADA');
  agenda.rotinas.push(rotinaSchema.parse(rotina));
  gravarAgenda(agenda, base);
  return rotina;
}

/** Mantém o projeto original e reinicia os horários após edição. */
export function editarRotina(id: string, dados: DadosRotina, base?: string, agora = new Date()) {
  const validado = dadosRotinaSchema.parse(dados);
  return alterarRotina(id, rotina => {
    if (validado.espacoId !== rotina.espacoId) {
      throw new Error('SCHEDULE_PROJECT_IMMUTABLE');
    }
    Object.assign(rotina, validado);
    rotina.ancora = agora.toISOString();
    rotina.ultimoSlot = null;
    if (rotina.estado === 'CONCLUIDA') rotina.estado = 'ATIVA';
    anotarNaRotina(rotina, 'EDITADA');
  }, base);
}

// ── operacoesDaRotina ──
export function definirPausaGlobal(pausado: boolean, base?: string) {
  const agenda = lerAgenda(base);
  agenda.pausaGlobal = pausado;
  gravarAgenda(agenda, base);
  return pausado;
}

export const desativarRotina = (id: string, base?: string) =>
  alterarRotina(id, rotina => {
    rotina.estado = 'DESATIVADA';
    anotarNaRotina(rotina, 'DESATIVADA');
  }, base);

export function excluirRotina(id: string, base?: string) {
  const agenda = lerAgenda(base);
  if (!agenda.rotinas.some(rotina => rotina.id === id)) {
    throw new Error('SCHEDULE_NOT_FOUND');
  }
  agenda.rotinas = agenda.rotinas.filter(rotina => rotina.id !== id);
  gravarAgenda(agenda, base);
  return { excluida: true };
}

/** Marca o horário tratado; uma rotina única passa ao estado concluída. */
export function marcarHorarioTratado(id: string, slot: number, base?: string) {
  return alterarRotina(id, rotina => {
    const anterior = rotina.ultimoSlot ? Date.parse(rotina.ultimoSlot) : 0;
    rotina.ultimoSlot = new Date(Math.max(slot, anterior)).toISOString();
    if (rotina.frequencia.tipo === 'unico') {
      rotina.estado = 'CONCLUIDA';
      anotarNaRotina(rotina, 'CONCLUIDA');
    }
  }, base);
}

export const pausarRotina = (id: string, base?: string) =>
  alterarRotina(id, rotina => {
    if (rotina.estado === 'ATIVA') {
      rotina.estado = 'PAUSADA';
      anotarNaRotina(rotina, 'PAUSADA');
    }
  }, base);

export const retomarRotina = (id: string, base?: string, agora = new Date()) =>
  alterarRotina(id, rotina => {
    if (rotina.estado === 'PAUSADA' || rotina.estado === 'DESATIVADA') {
      rotina.estado = 'ATIVA';
      rotina.ultimoSlot = agora.toISOString();
      anotarNaRotina(rotina, 'RETOMADA');
    }
  }, base);

// ── validacaoDaRotina ──
export function capacidadesDaRotina(r: Rotina, base?: string): string[] {
  if (r.tipo === 'smoke' || r.tipo === 'regressao') return r.capability ? [r.capability] : [];
  if (r.tipo === 'k6') return r.k6 ? [capacidadeDoK6(r.k6)] : [];
  if (r.tipo === 'run-qase') { try { return [...new Set(obterRunLocal(r.runLocalId!, base).casos.map(c => c.capability).filter((c): c is string => !!c))]; } catch { return []; } }
  if (r.tipo === 'validacao-ticket') { const e = obterEspaco(r.espacoId, base); return [...new Set(e.relacoes.filter(x => x.de.tipo === 'jira' && x.de.id === r.ticket && x.para.tipo === 'automacao').map(x => x.para.id))].slice(0, 5); }
  return [];
}

/** Valida o que o esquema sozinho não vê: projeto existe, pasta de automação, capability declarada e vínculos exigidos. */
export async function validarRotina(dados: DadosRotina, base?: string) {
  const d = dadosRotinaSchema.parse(dados); const e = obterEspaco(d.espacoId, base);
  if (d.tipo === 'run-qase') { const run = obterRunLocal(d.runLocalId!, base); if (run.espacoId !== d.espacoId) throw new ErroQa('RUN_PROJECT_MISMATCH', 'A run pertence a outro projeto.'); if (!run.runIdRemoto) throw new ErroQa('RUN_NOT_CREATED', 'Crie a run no Qase antes de agendá-la.'); }
  if (['smoke', 'regressao', 'validacao-ticket', 'k6', 'run-qase'].includes(d.tipo) && !e.pastaLocal) throw new ErroQa('PROJECT_FOLDER_REQUIRED', 'Este tipo de rotina executa testes e precisa de uma pasta de automação vinculada ao projeto.');
  if (d.capability && e.pastaLocal) { const p = await carregarProjeto(e.pastaLocal); if (!Object.hasOwn(p.manifesto.commands, d.capability)) throw new ErroQa('CAPABILITY_NOT_ALLOWED', `A capability "${d.capability}" não está declarada no contrato do projeto.`); }
  if (d.tipo === 'consulta-jira' && !e.vinculos.some(v => v.servico === 'jira')) throw new ErroQa('JIRA_LINK_REQUIRED', 'Vincule um projeto Jira antes de agendar consultas.');
  if (d.tipo === 'analise-mudancas' && !e.vinculos.some(v => v.servico === 'github')) throw new ErroQa('GITHUB_LINK_REQUIRED', 'Vincule um repositório GitHub antes de agendar a análise de mudanças.');
  return d;
}

// ── consultaDaAgenda ──
export function listarAgenda(espacoId?: string, base?: string, agora = new Date()) {
  const trab = listarTrabalhos(base); const aut = lerAutorizacoes(base);
  return listarRotinas(base).filter(r => !espacoId || r.espacoId === espacoId).map(r => {
    const meus = trab.filter(t => t.rotinaId === r.id && t.estado !== 'PERDIDO'); const ultimo = meus.filter(t => t.terminadoEm).sort((a, b) => b.terminadoEm!.localeCompare(a.terminadoEm!))[0];
    const caps = capacidadesDaRotina(r, base);
    const autorizacoes = caps.map(c => { const a = aut.execucoes.filter(x => x.espacoId === r.espacoId && x.capability === c && x.ambiente === r.ambiente).sort((p, q) => q.criadaEm.localeCompare(p.criadaEm))[0]; return { capability: c, estado: a ? estadoDaAutorizacao(a, agora) : 'AUSENTE', id: a?.id ?? null, validaAte: a?.validaAte ?? null, usos: a ? `${a.usos}/${a.maxUsos}` : null }; });
    const proximo = r.estado === 'ATIVA' ? proximoHorario(r, agora.getTime()) : null;
    return { ...r, proximaExecucao: proximo ? new Date(proximo).toISOString() : null, ultimaExecucao: ultimo ? { id: ultimo.id, em: ultimo.terminadoEm, estado: ultimo.estado, resultado: ultimo.resultado?.status ?? null, motivo: ultimo.resultado?.motivo ?? ultimo.erro } : null,
      permissoes: permissoesDaRotina(r, base), autorizacoes, erros: meus.filter(t => t.estado === 'ERRO' || t.resultado?.status === 'ERRO_INFRA' || t.resultado?.status === 'BLOCKED').slice(-5).map(t => ({ id: t.id, codigo: t.erro ?? t.resultado?.status, motivo: t.resultado?.motivo ?? '' })) };
  });
}

export function listarPermissoes(espacoId?: string, base?: string, agora = new Date()) {
  const a = lerAutorizacoes(base);
  return { execucoes: a.execucoes.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoDaAutorizacao(x, agora) })), publicacoes: a.publicacoes.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoDaAutorizacao(x, agora) })),
    // Políticas de escrita agendada (resultados no Qase): visíveis para poderem ser revogadas, não só expirar.
    escritas: a.escritas.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoDaAutorizacao(x, agora) })) };
}

/** O que a rotina pode fazer, em palavras simples, para a pessoa conferir antes de autorizar. */
export function permissoesDaRotina(r: Rotina, base?: string) {
  const caps = capacidadesDaRotina(r, base); const p: string[] = [];
  if (r.tipo === 'consulta-jira') p.push('Lê tickets do Jira vinculado ao projeto (somente leitura).');
  else if (r.tipo === 'analise-mudancas') p.push('Lê commits do repositório GitHub vinculado (somente leitura). Não dispara execuções.');
  else if (r.tipo === 'run-qase') p.push(caps.length ? `Executa localmente ${caps.map(c => `"${c}"`).join(', ')} (automações dos casos da run) e tenta publicar os resultados na run do Qase. Só publica com uma política de publicação aprovada para essa run; sem ela, os resultados ficam locais.` : 'A run não tem automação associada: nada será executado.');
  else if (r.tipo === 'k6') p.push(`Executa o k6 oficial contra ${r.k6?.alvo} (${r.k6?.usuarios} usuário(s) virtual(is), ${r.k6?.duracaoSegundos}s) com o script ${r.k6?.script}.`);
  else if (caps.length) p.push(`Executa localmente ${caps.map(c => `"${c}"`).join(', ')}, comando já declarado no contrato do projeto. Nenhum comando novo pode ser criado pela agenda.`);
  else p.push('Não há automação associada: nada será executado.');
  if (r.ticket) p.push(`Ticket associado: ${r.ticket}. Comentário no Jira só com política de publicação aprovada.`);
  return p;
}
