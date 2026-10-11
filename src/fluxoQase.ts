import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { lerLocal, gravarLocal } from './armazenamentoLocal.js';
import { obterEspaco } from './espacos.js';
import { carregarProjeto } from './projeto.js';
import { executarOperacao, type Executor, type RegistroOperacao } from './operacoesExternas.js';
import { criarProposta } from './propostas.js';
import type { Delegada, executarValidacao } from './execucao.js';
import type { Evidencia } from './evidencias.js';
import type { Auxiliar } from './operacoesTipos.js';

/**
 * Fluxo real de QA com o Qase (2.9): casos -> plano/run -> execução autorizada das automações associadas -> resultados verificáveis ->
 * publicação -> releitura da run. Uma "run local" guarda o que o Prumo sabe e observou; nada aqui afirma execução que não houve:
 *  - run criada NÃO é run executada;
 *  - caso manual sem resultado declarado pela pessoa fica sem resultado (NOT_RUN) e não é publicado;
 *  - PASS só existe com execução real (ou declaração humana explícita, marcada MANUAL);
 *  - automação que cobre vários casos sem mapeamento por cenário não decide o resultado de nenhum deles.
 * A associação caso -> automação vem das relações declaradas (qase -> automacao); "capability#cenario" liga ao cenário do runner.
 */
const statusLocal = z.enum(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN']);
const resultadoSchema = z.object({ status: statusLocal, origem: z.enum(['EXECUCAO', 'MANUAL']), granularidade: z.enum(['CENARIO', 'RODADA', 'DECLARADO']), evidenciaId: z.string().uuid().optional(), comentario: z.string().max(2000).default(''), tempoMs: z.number().int().min(0).optional(), por: z.string().max(200).optional(), em: z.string().datetime() }).strict();
const casoSchema = z.object({ casoId: z.number().int().positive(), titulo: z.string().max(255), capability: z.string().max(80).nullable(), casoRunner: z.string().max(100).nullable(), resultado: resultadoSchema.nullable(), publicado: z.boolean() }).strict();
const runSchema = z.object({
  id: z.string().uuid(), espacoId: z.string().uuid(), titulo: z.string().max(255), ambiente: z.string().max(40), runIdRemoto: z.number().int().positive().nullable(), planoId: z.number().int().positive().nullable(),
  estado: z.enum(['PREPARADA', 'CRIADA', 'EXECUTADA', 'PARCIAL', 'PUBLICADA']), confirmadaNoQase: z.boolean(), criadaEm: z.string().datetime(), atualizadaEm: z.string().datetime(), casos: z.array(casoSchema).min(1).max(500),
  execucoes: z.array(z.object({ capability: z.string().max(80), evidenciaId: z.string().uuid(), status: statusLocal, em: z.string().datetime() }).strict()).max(200),
  publicacoes: z.array(z.object({ em: z.string().datetime(), estado: z.string().max(20), enviados: z.number().int(), operacaoId: z.string().uuid() }).strict()).max(200)
}).strict();
export type RunLocal = z.infer<typeof runSchema>;
const registro = z.object({ version: z.literal(1), itens: z.array(runSchema).max(300) }).strict();
type Registro = z.infer<typeof registro>;
const ler = (b?: string) => lerLocal<Registro>('runs-qase.json', registro as unknown as z.ZodType<Registro>, { version: 1, itens: [] }, b);
const gravar = (r: Registro, b?: string) => gravarLocal('runs-qase.json', registro.parse(r), b);
export const listarRunsLocais = (espacoId?: string, b?: string) => ler(b).itens.filter(r => !espacoId || r.espacoId === espacoId).sort((a, c) => c.criadaEm.localeCompare(a.criadaEm));
export function obterRunLocal(id: string, b?: string) { const r = ler(b).itens.find(x => x.id === id); if (!r) throw new Error('RUN_NOT_FOUND'); return r; }
function alterar(id: string, fn: (r: RunLocal) => void, b?: string, agora = new Date()) { const reg = ler(b); const r = reg.itens.find(x => x.id === id); if (!r) throw new Error('RUN_NOT_FOUND'); fn(r); r.atualizadaEm = agora.toISOString(); runSchema.parse(r); gravar(reg, b); return r; }

/** Automação declarada para um caso do Qase: relação (qase:<id>) -> (automacao:<capability>[#cenário]) feita pela pessoa. */
export function automacaoDoCaso(espacoId: string, casoId: number, b?: string): { capability: string; casoRunner: string | null } | null {
  const e = obterEspaco(espacoId, b); const rel = e.relacoes.find(r => r.de.tipo === 'qase' && r.de.id === String(casoId) && r.para.tipo === 'automacao'); if (!rel) return null;
  const [capability, cenario] = rel.para.id.split('#'); return capability ? { capability, casoRunner: cenario || null } : null;
}
export function prepararRunLocal(espacoId: string, d: { titulo: string; ambiente: string; casos: { casoId: number; titulo: string }[]; planoId?: number }, b?: string, agora = new Date()): RunLocal {
  obterEspaco(espacoId, b); if (!d.casos.length) throw new Error('RUN_WITHOUT_CASES');
  const t = agora.toISOString(); const vistos = new Set<number>();
  const casos = d.casos.filter(c => !vistos.has(c.casoId) && vistos.add(c.casoId)).map(c => { const a = automacaoDoCaso(espacoId, c.casoId, b); return { casoId: c.casoId, titulo: c.titulo.slice(0, 255), capability: a?.capability ?? null, casoRunner: a?.casoRunner ?? null, resultado: null, publicado: false }; });
  const run = runSchema.parse({ id: randomUUID(), espacoId, titulo: d.titulo.trim().slice(0, 255), ambiente: d.ambiente, runIdRemoto: null, planoId: d.planoId ?? null, estado: 'PREPARADA', confirmadaNoQase: false, criadaEm: t, atualizadaEm: t, casos, execucoes: [], publicacoes: [] });
  const reg = ler(b); reg.itens.push(run); gravar(reg, b); return run;
}

type Dep = { executor: Executor; base?: string; agora?: () => Date };
const parseId = (v?: string) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };
/** Cria a run no Qase (operação externa com confirmação). Criar não executa nada nem registra resultado. */
export async function criarRunNoQase(d: Dep, runLocalId: string, o: { confirmado: boolean }): Promise<RegistroOperacao & { reutilizada: boolean }> {
  const run = obterRunLocal(runLocalId, d.base); if (run.runIdRemoto) throw new Error('RUN_ALREADY_CREATED');
  const reg = await executarOperacao(d.executor, run.espacoId, 'qase.criar_run', { titulo: run.titulo, casos: run.casos.map(c => c.casoId), ...(run.planoId ? { planoId: run.planoId } : {}) }, { base: d.base, confirmado: o.confirmado, agora: d.agora });
  const id = reg.estado === 'CONFIRMADA' || reg.estado === 'ENVIADA' ? parseId(reg.remoto?.id) : null; if (id) alterar(runLocalId, r => { r.runIdRemoto = id; r.estado = 'CRIADA'; r.confirmadaNoQase = reg.estado === 'CONFIRMADA'; }, d.base);
  return reg;
}

function aplicarEvidencia(run: RunLocal, capability: string, ev: Evidencia, agora: string) {
  const mesmos = run.casos.filter(c => c.capability === capability && c.resultado?.origem !== 'MANUAL'); const semCenario = mesmos.filter(c => !c.casoRunner);
  for (const c of mesmos) {
    const base = { origem: 'EXECUCAO' as const, evidenciaId: ev.jobId, em: agora };
    if (c.casoRunner) {
      const x = ev.cases.find(k => k.id === c.casoRunner);
      c.resultado = x ? { ...base, status: x.status, granularidade: 'CENARIO', comentario: x.evidence.slice(0, 1500) } : { ...base, status: ev.status === 'BLOCKED' ? 'BLOCKED' : 'NOT_RUN', granularidade: 'RODADA', comentario: ev.status === 'BLOCKED' ? ev.reason.slice(0, 500) : `Cenário "${c.casoRunner}" não foi reportado pelo runner.` };
    } else if (ev.status === 'BLOCKED') c.resultado = { ...base, status: 'BLOCKED', granularidade: 'RODADA', comentario: ev.reason.slice(0, 500) };
    else if (semCenario.length === 1 && (ev.status === 'PASS' || ev.status === 'FAIL')) c.resultado = { ...base, status: ev.status, granularidade: 'RODADA', comentario: `Rodada da automação "${capability}" terminou como ${ev.status}; o runner não reportou cenários individuais.` };
    else c.resultado = { ...base, status: 'NOT_RUN', granularidade: 'RODADA', comentario: `MAPEAMENTO_AUSENTE: a automação "${capability}" cobre ${semCenario.length} casos sem mapeamento por cenário; nenhum resultado individual foi inferido.` };
    c.publicado = false;
  }
}
export type Execucao = { executar: typeof executarValidacao; modo: 'MANUAL' | 'AGENDADO'; delegada?: (espacoId: string, ambiente: string) => Delegada; signal?: AbortSignal };
/** Executa uma vez cada automação associada (somente as autorizadas) e distribui os resultados. Casos manuais ficam como estão. */
export async function executarRunLocal(d: Dep, runLocalId: string, x: Execucao) {
  const run = obterRunLocal(runLocalId, d.base); const e = obterEspaco(run.espacoId, d.base); const agora = d.agora ?? (() => new Date());
  const caps = [...new Set(run.casos.filter(c => c.capability && c.resultado?.origem !== 'MANUAL').map(c => c.capability!))];
  if (!caps.length) return { executadas: [] as { capability: string; status: string; evidenciaId: string }[], semAutomacao: run.casos.length };
  if (!e.pastaLocal) throw new Error('PROJECT_FOLDER_REQUIRED: vincule a pasta de automação para executar.');
  const projeto = await carregarProjeto(e.pastaLocal); const executadas: { capability: string; status: string; evidenciaId: string }[] = [];
  for (const cap of caps) {
    if (x.signal?.aborted) break;
    const ev = await x.executar(projeto, cap, x.modo === 'MANUAL', x.modo === 'AGENDADO' ? x.delegada?.(run.espacoId, run.ambiente) : undefined, x.signal);
    alterar(runLocalId, r => { aplicarEvidencia(r, cap, ev, agora().toISOString()); r.execucoes.push({ capability: cap, evidenciaId: ev.jobId, status: ev.status, em: agora().toISOString() }); r.execucoes = r.execucoes.slice(-200); if (r.estado === 'CRIADA' || r.estado === 'PREPARADA' || r.estado === 'PUBLICADA') r.estado = r.estado === 'PREPARADA' ? 'PREPARADA' : 'EXECUTADA'; }, d.base);
    executadas.push({ capability: cap, status: ev.status, evidenciaId: ev.jobId });
  }
  return { executadas, semAutomacao: run.casos.filter(c => !c.capability).length };
}
/** Resultado declarado pela pessoa (caso manual). Marcado MANUAL e com o nome de quem declarou; nunca sobrescreve resultado de execução. */
export function declararResultadoManual(runLocalId: string, casoId: number, r: { status: 'PASS' | 'FAIL' | 'BLOCKED'; comentario: string }, por: string, b?: string, agora = new Date()) {
  return alterar(runLocalId, run => {
    const c = run.casos.find(k => k.casoId === casoId); if (!c) throw new Error('RUN_CASE_NOT_FOUND'); if (c.resultado?.origem === 'EXECUCAO' && c.resultado.status !== 'NOT_RUN') throw new Error('RESULT_FROM_EXECUTION: já existe resultado de execução.');
    c.resultado = { status: r.status, origem: 'MANUAL', granularidade: 'DECLARADO', comentario: r.comentario.slice(0, 2000), por, em: agora.toISOString() }; c.publicado = false;
  }, b, agora);
}
const paraQase = { PASS: 'passed', FAIL: 'failed', BLOCKED: 'blocked' } as const;
/** Publica os resultados ainda não publicados (nunca NOT_RUN) e relê a run no Qase. */
export async function publicarRunLocal(d: Dep, runLocalId: string, o: { confirmado: boolean; origem?: 'MANUAL' | 'AGENDADO'; anexarEvidencia?: boolean; aux?: Auxiliar }) {
  const run = obterRunLocal(runLocalId, d.base); if (!run.runIdRemoto) throw new Error('RUN_NOT_CREATED: crie a run no Qase antes de publicar.');
  const pendentes = run.casos.filter(c => c.resultado && c.resultado.status !== 'NOT_RUN' && !c.publicado); if (!pendentes.length) return { operacao: null as RegistroOperacao | null, publicados: 0 };
  const e = obterEspaco(run.espacoId, d.base); const raiz = e.pastaLocal ? path.join(e.pastaLocal, '.prumo', 'evidencias') : null; const aux: Auxiliar = o.aux ?? { arquivosAutorizados: [], raizesDeEvidencia: raiz ? [raiz] : [] };
  const resultados: { casoId: number; status: 'passed' | 'failed' | 'blocked'; comentario: string; anexos?: string[] }[] = [];
  for (const c of pendentes.slice(0, 200)) {
    const r = c.resultado!; const item: (typeof resultados)[number] = { casoId: c.casoId, status: paraQase[r.status as 'PASS' | 'FAIL' | 'BLOCKED'], comentario: `Prumo QA (${r.origem === 'MANUAL' ? 'declarado por ' + (r.por ?? 'pessoa') : 'execução'}${r.granularidade === 'RODADA' ? ', escopo da rodada' : ''}): ${r.comentario}`.slice(0, 1900) };
    if (o.anexarEvidencia && r.evidenciaId && r.status !== 'PASS' && raiz) {
      const anexo = await executarOperacao(d.executor, run.espacoId, 'qase.anexar', { arquivo: path.join(raiz, `${r.evidenciaId}.json`) }, { base: d.base, confirmado: o.confirmado, origem: 'MANUAL', aux, agora: d.agora });
      if (anexo.estado === 'CONFIRMADA' && anexo.remoto?.id) item.anexos = [anexo.remoto.id];
    }
    resultados.push(item);
  }
  const reg = await executarOperacao(d.executor, run.espacoId, 'qase.publicar_resultados', { runId: run.runIdRemoto, resultados }, { base: d.base, confirmado: o.confirmado, origem: o.origem ?? 'MANUAL', runPolitica: run.runIdRemoto, aux, agora: d.agora });
  if (reg.estado === 'CONFIRMADA' || (reg.estado === 'ENVIADA' && reg.aviso === 'NOT_CONFIRMED')) {
    const enviados = new Set(resultados.map(r => r.casoId));
    alterar(runLocalId, r => { for (const c of r.casos) if (enviados.has(c.casoId)) c.publicado = true; const completos = r.casos.every(c => c.resultado && c.resultado.status !== 'NOT_RUN'); const tudoPublicado = r.casos.every(c => !c.resultado || c.resultado.status === 'NOT_RUN' || c.publicado); r.estado = completos && tudoPublicado ? 'PUBLICADA' : 'PARCIAL'; r.confirmadaNoQase = reg.estado === 'CONFIRMADA'; r.publicacoes.push({ em: (d.agora ?? (() => new Date()))().toISOString(), estado: reg.estado, enviados: enviados.size, operacaoId: reg.id }); r.publicacoes = r.publicacoes.slice(-200); }, d.base);
    return { operacao: reg, publicados: enviados.size };
  }
  return { operacao: reg, publicados: 0 };
}
/** Rascunhos de bug para cada falha da run (um por caso), com ticket Jira de origem quando houver relação declarada. Nada é publicado. */
export function propostasDeBugs(runLocalId: string, b?: string) {
  const run = obterRunLocal(runLocalId, b); const e = obterEspaco(run.espacoId, b); const criadas = [];
  for (const c of run.casos.filter(k => k.resultado?.status === 'FAIL')) {
    const rel = e.relacoes.find(r => r.de.tipo === 'jira' && r.para.tipo === 'qase' && r.para.id === String(c.casoId)); const origem = rel?.de.id;
    try { criadas.push(criarProposta({ espacoId: run.espacoId, tipo: 'bug', origem: 'PRUMO', dados: { resumo: `[Prumo QA] Falha: ${c.titulo}`.slice(0, 255), descricao: `Caso do Qase: ${c.casoId}\nRun do Qase: ${run.runIdRemoto ?? '(ainda não criada)'}\nAmbiente: ${run.ambiente}\nResultado: ${c.resultado!.status} (${c.resultado!.granularidade === 'RODADA' ? 'escopo da rodada' : 'cenário'})\nEvidência local: ${c.resultado!.evidenciaId ?? '—'}\n\n${c.resultado!.comentario}`, ...(origem && /^[A-Z][A-Z0-9_]*-\d+$/.test(origem) ? { origem } : {}), rotulos: ['prumo-qa', 'regressao'] }, falhaDeOrigem: { runLocalId, casoId: c.casoId } }, b)); } catch (er) { if (!/DUPLICATE_PROPOSAL/.test((er as Error).message)) throw er; }
  }
  return criadas;
}
