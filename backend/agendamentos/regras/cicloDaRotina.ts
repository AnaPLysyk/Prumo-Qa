/** cicloDaRotina: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { Rotina, SlotVencido, evento, DadosRotina, dadosRotinaSchema, rotinaSchema } from "../tipos/rotina.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { gravarAgenda, lerAgenda, alterarRotina, listarRotinas } from "../banco/agenda.js";
import { capacidadeDoK6 } from "../servicoK6.js";
import { obterEspaco } from "../../projetos/banco/projetos.js";
import { obterRunLocal } from "../../testes/banco/runs.js";
import { ErroQa } from "../../compartilhado/erros.js";
import { carregarProjeto } from "../../compartilhado/projeto/carregarProjeto.js";
import { estadoDaAutorizacao, lerAutorizacoes } from "../banco/autorizacoes.js";
import { listarTrabalhos } from "../banco/fila.js";

// --- servicoHorarios ---
/** Diz a data e o dia da semana de um instante num fuso horário. */

function dataNoFusoHorario(instante: number, zona: string) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  const p = Object.fromEntries(f.formatToParts(new Date(instante)).filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
  const dias = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return { ano: Number(p.year), mes: Number(p.month), dia: Number(p.day), semana: dias.indexOf(String(p.weekday)) };
}

/** Slots (instantes UTC) estritamente depois de `depois` e até `ate`, em ordem. Limitado para nunca gerar laço longo. */
export function horariosEntre(r: Pick<Rotina, 'frequencia' | 'fuso' | 'ancora'>, depois: number, ate: number, limite = 2000): number[] {
  const f = r.frequencia; const saida: number[] = [];
  if (ate <= depois) return saida;
  if (f.tipo === 'unico') { const t = Date.parse(f.em); if (t > depois && t <= ate) saida.push(t); return saida; }
  if (f.tipo === 'intervalo') {
    const passo = f.minutos * 60000; const ancora = Date.parse(r.ancora);
    let k = Math.max(1, Math.floor((depois - ancora) / passo) + 1);
    for (; saida.length < limite; k++) { const t = ancora + k * passo; if (t > ate) break; if (t > depois) saida.push(t); }
    return saida;
  }
  // diário e semanal: percorre dias de parede no fuso (a partir de um dia antes, por causa de deslocamentos de fuso)
  const inicio = dataNoFusoHorario(depois - 86400000, r.fuso);
  let dia = Date.UTC(inicio.ano, inicio.mes - 1, inicio.dia);
  for (let i = 0; i < 4000 && saida.length < limite; i++, dia += 86400000) {
    const d = new Date(dia); const semana = d.getUTCDay();
    if (f.tipo === 'semanal' && !f.dias.includes(semana)) continue;
    const t = instanteLocal(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), f.hora, r.fuso);
    if (t > ate + 86400000 * 2) break;
    if (t > depois && t <= ate) saida.push(t);
    if (t > ate && dia > ate + 86400000 * 2) break;
  }
  return [...new Set(saida)].sort((a, b) => a - b);
}

/**
 * Decide o que fazer com os slots vencidos desde o último tratado. Política:
 * - dentro da tolerância: executa;
 * - fora da tolerância e PULAR: registra PERDIDO (nunca executa "atrasado" sem decisão);
 * - EXECUTAR_UMA_VEZ: executa só o mais recente; os demais ficam SUBSTITUIDO.
 */
export function horariosVencidos(r: Rotina, agora: number): SlotVencido[] {
  if (r.estado !== 'ATIVA') return [];
  const base = r.ultimoSlot ? Date.parse(r.ultimoSlot) : Date.parse(r.ancora);
  const slots = horariosEntre(r, base, agora, 500); if (!slots.length) return [];
  const tolerancia = r.toleranciaMinutos * 60000; const ultimo = slots[slots.length - 1]!;
  return slots.map(slot => {
    const atrasado = agora - slot > tolerancia;
    if (r.politicaPerdido === 'EXECUTAR_UMA_VEZ') return slot === ultimo ? { slot, executar: true } : { slot, executar: false, motivo: 'SUBSTITUIDO' as const };
    return atrasado ? { slot, executar: false, motivo: 'PERDIDO' as const } : { slot, executar: true };
  });
}

/** Converte data e hora de parede num fuso (ex.: 08:00 em São Paulo) no instante exato, tratando horário de verão. */

/** Calcula quantos minutos um fuso horário está adiantado ou atrasado num instante (considera horário de verão). */

function desvioDoFuso(instante: number, zona: string) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: zona, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(f.formatToParts(new Date(instante)).filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]));
  return Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!, p.second!) - Math.floor(instante / 1000) * 1000;
}

/** Converte data+hora de parede no fuso para o instante UTC. Horário repetido (fim do verão): primeira ocorrência. Horário inexistente (salto): avança para depois do salto. */
export function instanteLocal(ano: number, mes: number, dia: number, hhmm: string, zona: string): number {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  const parede = Date.UTC(ano, mes - 1, dia, h, m, 0);
  const candidatos = [...new Set([desvioDoFuso(parede - 86400000, zona), desvioDoFuso(parede + 86400000, zona)])].map(o => parede - o);
  const validos = candidatos.filter(c => c + desvioDoFuso(c, zona) === parede);
  return validos.length ? Math.min(...validos) : Math.max(...candidatos);
}

export function proximoHorario(r: Pick<Rotina, 'frequencia' | 'fuso' | 'ancora' | 'ultimoSlot'>, agora: number): number | null {
  const base = Math.max(r.ultimoSlot ? Date.parse(r.ultimoSlot) : Date.parse(r.ancora), Date.parse(r.ancora));
  const tentativa = (janela: number) => horariosEntre(r, Math.max(base, agora - 1), agora + janela, 1)[0] ?? null;
  const f = r.frequencia;
  if (f.tipo === 'unico') { const t = Date.parse(f.em); return r.ultimoSlot && Date.parse(r.ultimoSlot) >= t ? null : t; }
  // Se existe slot vencido e ainda não tratado, ele é o "próximo" (será tratado pela política de perdidos).
  const vencido = horariosEntre(r, base, agora, 1)[0];
  if (vencido !== undefined) return vencido;
  return tentativa(f.tipo === 'intervalo' ? f.minutos * 60000 + 1000 : 8 * 86400000);
}

// --- cicloDaRotina ---
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
