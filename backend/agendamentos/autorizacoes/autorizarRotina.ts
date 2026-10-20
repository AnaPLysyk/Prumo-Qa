/** Autorização de rotinas e acesso delegado — arquivos relacionados agrupados para manutenção. */
import { estadoDaAutorizacao, abrirEspacoDeAutorizacoes } from "./estadoERevogacao.js";
import { gravarAutorizacoes, lerAutorizacoes } from "../banco/autorizacoes.js";
import { MAX_VALIDADE_DIAS, AutorizacaoExecucao, EscopoAutorizado, MAX_USOS, Solicitador, execSchema } from "../tipos/autorizacoes.js";
import { randomUUID } from "node:crypto";
import { Projeto } from "../../compartilhado/projeto/contratos.js";
import { solicitarAprovacao } from "../../testes/servicoAprovacao.js";
import { obterRotina } from "../banco/agenda.js";
import { capacidadeDoK6, escopoDoK6, localizarK6 } from "../servicoK6.js";
import { capacidadesDaRotina } from "../regras/cicloDaRotina.js";
import { ExecutavelK6 } from "../tipos/k6.js";
import { ErroQa } from "../../compartilhado/erros.js";
import { carregarProjeto } from "../../compartilhado/projeto/carregarProjeto.js";
import { escopoDeCapability } from "../../testes/regras/executarValidacao.js";
import { obterEspaco } from "../../projetos/banco/projetos.js";
import { Delegada } from "../../testes/tipos/autorizacoes.js";

// ── politicasDaAutorizacao ──
/** Consome um uso se existir política vigente que cubra a operação e a run. Sem política: null (a operação agendada fica BLOQUEADA). */
export function consumirPoliticaEscrita(espacoId: string, operacao: string, run: number, base?: string, agora = new Date()) {
  const r = lerAutorizacoes(base); const p = r.escritas.find(x => x.espacoId === espacoId && x.operacao === operacao && estadoDaAutorizacao(x, agora) === 'VIGENTE' && x.runs.includes(run)); if (!p) return null; p.usos += 1; gravarAutorizacoes(r, base); return p;
}

/** Consome uma publicação da política que cobre ticket+tipo. Retorna null se nenhuma cobrir. */
export function consumirPublicacao(espacoId: string, ticket: string, tipo: string, base?: string, agora = new Date()) {
  const r = lerAutorizacoes(base); const p = r.publicacoes.find(x => x.espacoId === espacoId && estadoDaAutorizacao(x, agora) === 'VIGENTE' && x.tickets.includes(ticket) && (x.tipos as string[]).includes(tipo));
  if (!p) return null; p.usadas += 1; gravarAutorizacoes(r, base); return p;
}

/** Verifica (sem consumir) se a política cobre ticket e tipo. */
export function politicaCobre(espacoId: string, ticket: string, tipo: string, base?: string, agora = new Date()) {
  return lerAutorizacoes(base).publicacoes.find(p => p.espacoId === espacoId && estadoDaAutorizacao(p, agora) === 'VIGENTE' && p.tickets.includes(ticket) && (p.tipos as string[]).includes(tipo)) ?? null;
}

export const validadeDaAutorizacao = (dias: number, agora: Date) => { if (!Number.isFinite(dias) || dias <= 0 || dias > MAX_VALIDADE_DIAS) throw new Error('AUTH_VALIDITY_INVALID'); return new Date(agora.getTime() + dias * 86400000).toISOString(); };

// ── autorizarEscopo ──
/** Pede o consentimento humano nativo para este escopo exato e só então grava a autorização. */
export async function autorizarEscopo(p: Projeto, espacoId: string, capability: string, ambiente: string, escopo: EscopoAutorizado, opcoes: { dias: number; maxUsos: number }, base?: string, solicitar: Solicitador = solicitarAprovacao, agora = new Date()): Promise<AutorizacaoExecucao> {
  if (!Number.isInteger(opcoes.maxUsos) || opcoes.maxUsos < 1 || opcoes.maxUsos > MAX_USOS) throw new Error('AUTH_USES_INVALID');
  const validaAte = validadeDaAutorizacao(opcoes.dias, agora);
  const aprovado = await solicitar({ projectId: p.manifesto.id, root: p.raiz, capability, scopeHash: escopo.scopeHash, command: escopo.command, expiresAt: new Date(agora.getTime() + 120000).toISOString() });
  if (!aprovado || aprovado.scopeHash !== escopo.scopeHash) throw new Error('HUMAN_APPROVAL_REQUIRED');
  const a: AutorizacaoExecucao = { id: randomUUID(), espacoId, projectId: p.manifesto.id, capability, ambiente, scopeHash: escopo.scopeHash, criadaEm: agora.toISOString(), validaAte, maxUsos: opcoes.maxUsos, usos: 0, aprovadoPor: aprovado.subject, metodo: aprovado.method, revogadaEm: null };
  const r = lerAutorizacoes(base); r.execucoes = abrirEspacoDeAutorizacoes(r.execucoes, x => estadoDaAutorizacao(x, agora) === 'VIGENTE'); if (r.execucoes.length >= 300) throw new Error('AUTH_LIMIT');
  // Uma autorização vigente por (espaço, capability, ambiente): a nova substitui (revoga) a anterior, sem acumular poderes.
  for (const x of r.execucoes) if (x.espacoId === espacoId && x.capability === capability && x.ambiente === ambiente && !x.revogadaEm) x.revogadaEm = agora.toISOString();
  r.execucoes.push(execSchema.parse(a)); gravarAutorizacoes(r, base); return a;
}

// ── autorizarRotina ──
/** Pede ao broker nativo o consentimento para cada automação da rotina (escopo exato) e grava as autorizações. */
export async function autorizarRotina(rotinaId: string, opcoes: { dias: number; maxUsos: number }, solicitar: Solicitador, base?: string, exe?: ExecutavelK6 | null) {
  const r = obterRotina(rotinaId, base); const e = obterEspaco(r.espacoId, base);
  if (!['smoke', 'regressao', 'validacao-ticket', 'k6', 'run-qase'].includes(r.tipo)) throw new ErroQa('AUTH_NOT_REQUIRED', 'Este tipo de rotina só lê dados e não precisa de autorização de execução.');
  if (!e.pastaLocal) throw new ErroQa('PROJECT_FOLDER_REQUIRED', 'Vincule uma pasta de automação ao projeto antes de autorizar execuções.');
  const p = await carregarProjeto(e.pastaLocal); const criadas = [];
  if (r.tipo === 'k6') {
    const k = exe ?? (await localizarK6().then(c => (c ? { executable: c } : null))); if (!k || !r.k6) throw new ErroQa('RUNTIME_MISSING', 'k6 não encontrado no PATH.');
    criadas.push(await autorizarEscopo(p, e.id, capacidadeDoK6(r.k6), r.ambiente, await escopoDoK6(p, r.k6, r.ambiente, k), opcoes, base, solicitar));
  } else {
    const caps = capacidadesDaRotina(r, base); if (!caps.length) throw new ErroQa('NO_VERIFIED_LINK', 'Não há automação associada a esta rotina.');
    for (const c of caps) criadas.push(await autorizarEscopo(p, e.id, c, r.ambiente, await escopoDeCapability(p, c), opcoes, base, solicitar));
  }
  return criadas.map(a => ({ id: a.id, capability: a.capability, validaAte: a.validaAte, maxUsos: a.maxUsos }));
}

// ── autorizacaoDelegada ──
/** Delegada para o executor. Consome um uso de forma atômica ao reconhecer o escopo; qualquer divergência devolve null (BLOCKED). */
export function autorizacaoDelegada(espacoId: string, ambiente: string, base?: string, agora = () => new Date()): Delegada {
  return async ({ scopeHash, capability }) => {
    const r = lerAutorizacoes(base); const t = agora();
    const a = r.execucoes.find(x => x.espacoId === espacoId && x.capability === capability && x.ambiente === ambiente && x.scopeHash === scopeHash && estadoDaAutorizacao(x, t) === 'VIGENTE');
    if (!a) return null; a.usos += 1; gravarAutorizacoes(r, base);
    return { subject: a.aprovadoPor, method: 'delegada:' + a.metodo, scopeHash, at: t.toISOString() };
  };
}
