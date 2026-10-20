/** Ciclo das runs e publicação — arquivos relacionados agrupados para manutenção. */
import { carregarProjeto } from "../compartilhado/projeto/carregarProjeto.js";
import { obterEspaco, listarEspacos } from "../projetos/banco/projetos.js";
import { alterarRunLocal, obterRunLocal, gravarRunsLocais, lerRunsLocais } from "./banco/runs.js";
import { Dep, Execucao, RunLocal, runSchema } from "./tipos/runLocal.js";
import { Evidencia } from "./tipos/evidencia.js";
import { listarRotinas } from "../agendamentos/banco/agenda.js";
import { listarTrabalhos, obterTrabalho } from "../agendamentos/banco/fila.js";
import { Trabalho } from "../agendamentos/tipos/fila.js";
import { Espaco } from "../projetos/contratos.js";
import { FiltroExecucoes, filtroExecucoes } from "./tipos/evidencia.js";
import { randomUUID } from "node:crypto";
import { ErroServico } from "../conexoes/integracoes/ErroServico.js";
import { politicaCobre } from "../agendamentos/autorizacoes/autorizarRotina.js";
import { publicacaoDoTrabalho } from "./banco/publicacoes.js";
import { montarComentario } from "./regras/propostasDeBugs.js";

// ── servicoExecucoes ──
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
    alterarRunLocal(runLocalId, r => { aplicarEvidencia(r, cap, ev, agora().toISOString()); r.execucoes.push({ capability: cap, evidenciaId: ev.jobId, status: ev.status, em: agora().toISOString() }); r.execucoes = r.execucoes.slice(-200); if (r.estado === 'CRIADA' || r.estado === 'PREPARADA' || r.estado === 'PUBLICADA') r.estado = r.estado === 'PREPARADA' ? 'PREPARADA' : 'EXECUTADA'; }, d.base);
    executadas.push({ capability: cap, status: ev.status, evidenciaId: ev.jobId });
  }
  return { executadas, semAutomacao: run.casos.filter(c => !c.capability).length };
}

const repositorioDoEspaco = (espaco: Espaco | undefined): string | null =>
  espaco?.vinculos.find(vinculo => vinculo.servico === 'github')?.recurso.chave ?? null;

const duracaoDoTrabalho = (trabalho: Trabalho): number | null =>
  trabalho.iniciadoEm && trabalho.terminadoEm
    ? Math.max(0, Date.parse(trabalho.terminadoEm) - Date.parse(trabalho.iniciadoEm))
    : null;

export function listarExecucoes(filtros: FiltroExecucoes = {}, base?: string) {
  const filtro = filtroExecucoes.parse(filtros);
  const rotinas = new Map(listarRotinas(base).map(rotina => [rotina.id, rotina]));
  const espacos = new Map(listarEspacos(base).map(espaco => [espaco.id, espaco]));

  const execucoes = listarTrabalhos(base).filter(trabalho =>
    (!filtro.espacoId || trabalho.espacoId === filtro.espacoId) &&
    (!filtro.rotinaId || trabalho.rotinaId === filtro.rotinaId) &&
    (!filtro.ticket || trabalho.ticket === filtro.ticket) &&
    (!filtro.estado || trabalho.estado === filtro.estado) &&
    (!filtro.resultado || trabalho.resultado?.status === filtro.resultado) &&
    (!filtro.since || trabalho.criadoEm >= filtro.since) &&
    (!filtro.until || trabalho.criadoEm <= filtro.until) &&
    (!filtro.repositorio || repositorioDoEspaco(espacos.get(trabalho.espacoId)) === filtro.repositorio)
  );

  execucoes.sort(
    (a, b) => (b.slot ?? b.criadoEm).localeCompare(a.slot ?? a.criadoEm)
  );

  return {
    total: execucoes.length,
    execucoes: execucoes.slice(0, filtro.limite).map(trabalho => {
      const rotina = rotinas.get(trabalho.rotinaId);
      const espaco = espacos.get(trabalho.espacoId);
      return {
        id: trabalho.id,
        rotinaId: trabalho.rotinaId,
        rotina: rotina?.nome ?? '(rotina excluída)',
        espacoId: trabalho.espacoId,
        projeto: espaco?.nome ?? '(projeto removido)',
        repositorio: repositorioDoEspaco(espaco),
        tipo: trabalho.tipo,
        capability: trabalho.capability ?? null,
        ambiente: trabalho.ambiente,
        ticket: trabalho.ticket ?? null,
        executor: trabalho.origem === 'AGENDA' ? 'Prumo (agenda)' : 'Prumo (manual)',
        origem: trabalho.origem,
        slot: trabalho.slot,
        criadoEm: trabalho.criadoEm,
        inicio: trabalho.iniciadoEm,
        termino: trabalho.terminadoEm,
        duracaoMs: duracaoDoTrabalho(trabalho),
        estado: trabalho.estado,
        resultado: trabalho.resultado,
        tentativas: trabalho.log.map(tentativa => ({
          n: tentativa.n,
          inicio: tentativa.inicio,
          fim: tentativa.fim,
          estado: tentativa.estado,
          codigo: tentativa.codigo ?? null
        })),
        erro: trabalho.erro,
        jira: trabalho.jira,
        evidenciaId: trabalho.resultado?.evidenciaId ?? null,
        pastaLocal: espaco?.pastaLocal ?? null
      };
    })
  };
}

/** Automação declarada para um caso do Qase: relação (qase:<id>) -> (automacao:<capability>[#cenário]) feita pela pessoa. */
function automacaoDoCaso(espacoId: string, casoId: number, b?: string): { capability: string; casoRunner: string | null } | null {
  const e = obterEspaco(espacoId, b); const vinculo = e.vinculos.find(v => v.servico === 'qase'); const rel = e.relacoes.find(r => r.de.tipo === 'qase' && r.de.id === String(casoId) && r.de.vinculoId === vinculo?.id && r.para.tipo === 'automacao'); if (!rel || !vinculo) return null;
  const [capability, cenario] = rel.para.id.split('#'); return capability ? { capability, casoRunner: cenario || null } : null;
}

export function prepararRunLocal(espacoId: string, d: { titulo: string; ambiente: string; casos: { casoId: number; titulo: string }[]; planoId?: number; marcoId?: number; ambienteQaseId?: number }, b?: string, agora = new Date()): RunLocal {
  obterEspaco(espacoId, b); if (!d.casos.length) throw new Error('RUN_WITHOUT_CASES');
  const t = agora.toISOString(); const vistos = new Set<number>();
  const casos = d.casos.filter(c => !vistos.has(c.casoId) && vistos.add(c.casoId)).map(c => { const a = automacaoDoCaso(espacoId, c.casoId, b); return { casoId: c.casoId, titulo: c.titulo.slice(0, 255), capability: a?.capability ?? null, casoRunner: a?.casoRunner ?? null, resultado: null, publicado: false }; });
  const run = runSchema.parse({ id: randomUUID(), espacoId, titulo: d.titulo.trim().slice(0, 255), ambiente: d.ambiente, runIdRemoto: null, planoId: d.planoId ?? null, marcoId: d.marcoId ?? null, ambienteQaseId: d.ambienteQaseId ?? null, estado: 'PREPARADA', confirmadaNoQase: false, criadaEm: t, atualizadaEm: t, casos, execucoes: [], publicacoes: [] });
  const reg = lerRunsLocais(b); reg.itens.push(run); gravarRunsLocais(reg, b); return run;
}

// ── servicoPublicacao ──
export const codigoDoErroDePublicacao = (e: unknown) => e instanceof ErroServico ? e.codigo : (e as Error)?.message?.match(/^[A-Z_]{3,60}/)?.[0] ?? 'JIRA_PUBLISH_FAILED';

/** Trabalhos agendados concluídos com ticket e política que cubra: prepara o registro; senão marca a razão (nunca publica sem política). */
export function elegivelParaPublicar(t: Trabalho, b?: string, agora = new Date()): 'SIM' | 'NAO_APLICAVEL' | 'SEM_POLITICA' {
  if (t.estado !== 'CONCLUIDO' || !t.ticket || (t.resultado?.status !== 'PASS' && t.resultado?.status !== 'FAIL')) return 'NAO_APLICAVEL';
  if (t.jira.estado === 'PUBLICADO') return 'NAO_APLICAVEL';
  return politicaCobre(t.espacoId, t.ticket, t.tipo, b, agora) ? 'SIM' : 'SEM_POLITICA';
}

/** Prévia: nada é gravado nem enviado. */
export function prepararPublicacao(trabalhoId: string, b?: string) {
  const t = obterTrabalho(trabalhoId, b); const c = montarComentario(t, obterEspaco(t.espacoId, b).nome);
  const existente = publicacaoDoTrabalho(t.id, b);
  return { ticket: t.ticket!, texto: c.texto, estado: existente?.estado ?? 'NAO_PUBLICADO', comentarioId: existente?.comentarioId ?? null };
}

/** Diz se vale tentar publicar de novo (tempo esgotado, serviço fora ou limite de consultas). */

export const publicacaoPodeRepetir = (cod: string) => ['SERVICE_TIMEOUT', 'SERVICE_UNAVAILABLE', 'SERVICE_RATE_LIMIT'].includes(cod);
