import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { mascarar } from './projeto.js';
import { consultarAtividades, calcularMetricas, descreverAchados, ferramentas, type Evento } from './atividades.js';
import { consultarEvidencias } from './evidencias.js';
import { prepararConexao } from './conexoes.js';
import { projetoVinculado, listarVinculos, adicionarVinculo, removerVinculo } from './vinculos.js';

/**
 * Adaptador entre a interface e o núcleo. Não tem regra de qualidade própria: cada função
 * valida o argumento, exige projeto vinculado e delega a atividades/evidencias/conexoes.
 * É puro Node (sem Electron) para ser testado sem janela.
 */
const estados = ['STARTED', 'OK', 'NOT_VERIFIED', 'PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'ERROR'] as const;
export const filtroSchema = z.object({
  tool: z.enum(ferramentas).optional(), state: z.enum(estados).optional(),
  since: z.string().datetime().optional(), until: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(200)
}).strict();
export type Filtro = z.input<typeof filtroSchema>;
const base = () => process.env.PRUMO_DATA_DIR;

/** `consolidado`: o último evento da operação; se ainda for o início, nenhum término foi observado. */
function apresentar(e: Evento, consolidado = false) {
  return { operationId: e.operationId, at: e.at, phase: e.phase, tool: e.tool, origin: e.origin, client: e.client, clientIdentity: e.clientIdentity,
    state: consolidado && e.phase === 'start' ? 'SEM_TERMINO_OBSERVADO' : e.state, durationMs: e.durationMs, input: e.input, summary: e.summary, findingsText: descreverAchados(e) };
}
function filtrar(eventos: Evento[], f: z.output<typeof filtroSchema>) {
  return eventos.filter(e => (!f.tool || e.tool === f.tool) && (!f.state || e.state === f.state) && (!f.since || e.at >= f.since) && (!f.until || e.at <= f.until));
}

export const projetos = () => listarVinculos(base());
export const vincular = (raiz: string) => adicionarVinculo(raiz, base());
export const desvincular = (raiz: string) => removerVinculo(raiz, base());

export async function visao(raiz: string) {
  const p = await projetoVinculado(raiz, base());
  const h = consultarAtividades(p, base()); const m = calcularMetricas(h);
  const ultimaMcp = h.activities.filter(e => e.origin === 'MCP').at(-1);
  return { project: { id: p.manifesto.id, name: p.manifesto.name, root: p.raiz, capabilities: Object.keys(p.manifesto.commands), readOnly: p.manifesto.execution.readOnly },
    metrics: m, directory: h.directory, lastMcpClient: ultimaMcp?.client ?? null,
    connection: 'Última chamada observada; o Prumo não comprova sessão ativa nem a identidade real do cliente.' };
}
export async function logs(raiz: string, filtro: Filtro = {}) {
  const f = filtroSchema.parse(filtro); const p = await projetoVinculado(raiz, base());
  const h = consultarAtividades(p, base());
  return { events: filtrar(h.events, f).slice(-f.limit).map(e => apresentar(e)), problems: h.problems, complete: h.complete };
}
export async function historico(raiz: string, filtro: Filtro = {}) {
  const f = filtroSchema.parse(filtro); const p = await projetoVinculado(raiz, base());
  const h = consultarAtividades(p, base());
  return { activities: filtrar(h.activities, f).slice(-f.limit).reverse().map(a => apresentar(a, true)), problems: h.problems, complete: h.complete,
    notice: 'Recomendações são orientações do Prumo. Ele não observa se a IA as aplicou.' };
}
export async function evidencias(raiz: string, jobId?: string) {
  const p = await projetoVinculado(raiz, base());
  const r = await consultarEvidencias(p, jobId);
  return { status: 'status' in r ? r.status : undefined, reason: 'reason' in r ? r.reason : undefined, trust: 'trust' in r ? r.trust : undefined,
    results: r.results.map(e => ({ jobId: e.jobId, capability: e.capability, status: e.status, reason: mascarar(e.reason), startedAt: e.startedAt, endedAt: e.endedAt,
      executed: e.executed, exitCode: e.exitCode, evidenceScope: e.evidenceScope, cases: e.cases.map(c => ({ id: c.id, status: c.status })), evidencePath: e.evidencePath,
      stdout: mascarar(e.stdout).slice(0, 4000), stderr: mascarar(e.stderr).slice(0, 4000) })) };
}
/** Propõe a configuração; nada é alterado aqui. */
export async function conexoes(raiz: string) {
  const p = await projetoVinculado(raiz, base());
  return (['codex', 'claude'] as const).map(c => { const x = prepararConexao(p, c); return { client: c, name: x.name, installed: x.installed, destination: x.destination, command: x.command, configuration: x.configuration, notice: x.notice, automatic: c === 'codex' && x.installed && !x.manualOnly }; });
}
/** Exporta o histórico bruto do projeto (somente campos do esquema, sem texto livre). */
export async function exportarLogs(raiz: string) {
  const p = await projetoVinculado(raiz, base());
  const h = consultarAtividades(p, base());
  return JSON.stringify({ exportedAt: new Date().toISOString(), project: p.manifesto.id, events: h.events, problems: h.problems }, null, 2);
}

/** Documentos da Ajuda: lista fixa, lidos da pasta do aplicativo. O nome nunca vem da interface em formato livre. */
export const documentosAjuda = ['01-o-que-e.md', '02-como-funciona.md', '03-instalar.md', '04-vincular.md', '15-contextos.md', '05-conectar-ia.md', '06-sem-ia-e-com-ia.md', '07-resultados.md', '08-metricas-e-logs.md', '09-problemas.md', '10-perguntas.md', '11-privacidade.md', '12-seguranca.md', '13-termos.md', '14-sobre.md'] as const;
export function ajuda(pasta: string, versao: string) {
  return documentosAjuda.map(arq => {
    const texto = fs.readFileSync(path.join(pasta, arq), 'utf8').replaceAll('{{VERSAO}}', versao);
    return { id: arq.replace(/\.md$/, ''), title: /^# (.+)$/m.exec(texto)?.[1] ?? arq, body: texto };
  });
}

// ---- Contextos persistentes (marco 2.4). Toda regra está em contextos.ts; aqui só se exige projeto vinculado. ----
import * as ctx from './contextos.js';
const projeto = (raiz: string) => projetoVinculado(raiz, base());
export const contextosListar = async (raiz: string, filtro: ctx.Filtro = {}) => ctx.listarContextos(await projeto(raiz), filtro);
export const contextosObter = async (raiz: string, id: string) => ctx.obterContexto(await projeto(raiz), id);
export const contextosSalvar = async (raiz: string, a: { id?: string; substituir?: boolean; dados: unknown }, por: string) => {
  const p = await projeto(raiz);
  if (!a.id) return ctx.criarContexto(p, a.dados, por);
  return a.substituir ? ctx.substituirContexto(p, a.id, a.dados, por) : ctx.editarContexto(p, a.id, a.dados, por);
};
export const contextosAprovar = async (raiz: string, id: string, por: string) => ctx.aprovarContexto(await projeto(raiz), id, por);
export const contextosDesatualizar = async (raiz: string, id: string, por: string) => ctx.desatualizarContexto(await projeto(raiz), id, por);
export const contextosConflito = async (raiz: string, id: string, por: string, outroId?: string) => (outroId ? ctx.marcarConflito(await projeto(raiz), id, outroId, por) : ctx.resolverConflito(await projeto(raiz), id, por));
export const contextosExcluir = async (raiz: string, id: string) => ctx.excluirContexto(await projeto(raiz), id);
export const contextosMcp = async (raiz: string, habilitar: boolean) => ctx.gravarConfig(await projeto(raiz), habilitar);
