/** Publicação e criação de runs Qase — arquivos relacionados agrupados para manutenção. */
import path from "node:path";
import { executarOperacao } from "../../conexoes/escrita/executarOperacao.js";
import { Auxiliar } from "../../conexoes/tipos/operacao.js";
import { RegistroOperacao } from "../../conexoes/tipos/operacoesExternas.js";
import { obterEspaco } from "../../projetos/banco/projetos.js";
import { alterarRunLocal, obterRunLocal } from "../banco/runs.js";
import { Dep, paraQase, CASO_LOCAL_MIN, RunLocal } from "../tipos/runLocal.js";

// ── publicarRunLocal ──
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
    alterarRunLocal(runLocalId, r => { for (const c of r.casos) if (enviados.has(c.casoId)) c.publicado = true; const completos = r.casos.every(c => c.resultado && c.resultado.status !== 'NOT_RUN'); const tudoPublicado = r.casos.every(c => !c.resultado || c.resultado.status === 'NOT_RUN' || c.publicado); r.estado = completos && tudoPublicado ? 'PUBLICADA' : 'PARCIAL'; r.confirmadaNoQase = reg.estado === 'CONFIRMADA'; r.publicacoes.push({ em: (d.agora ?? (() => new Date()))().toISOString(), estado: reg.estado, enviados: enviados.size, operacaoId: reg.id }); r.publicacoes = r.publicacoes.slice(-200); }, d.base);
    return { operacao: reg, publicados: enviados.size };
  }
  return { operacao: reg, publicados: 0 };
}

// ── criarRunNoQase ──
const numeroDoId = (v?: string) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };

/** Parâmetros da operação qase.criar_run a partir da run local: os mesmos na prévia confirmada e no envio. */
export const parametrosDaRunQase = (run: RunLocal) => ({ titulo: run.titulo, casos: run.casos.map(c => c.casoId), ...(run.planoId ? { planoId: run.planoId } : {}), ...(run.marcoId ? { marcoId: run.marcoId } : {}), ...(run.ambienteQaseId ? { ambienteId: run.ambienteQaseId } : {}) });

/** Cria a run no Qase (operação externa com confirmação). Criar não executa nada nem registra resultado. */
export async function criarRunNoQase(d: Dep, runLocalId: string, o: { confirmado: boolean }): Promise<RegistroOperacao & { reutilizada: boolean }> {
  const run = obterRunLocal(runLocalId, d.base); if (run.runIdRemoto) throw new Error('RUN_ALREADY_CREATED');
  if (run.casos.some(c => c.casoId >= CASO_LOCAL_MIN)) throw new Error('RUN_HAS_LOCAL_CASES: esta run tem casos que só existem neste computador; o Qase não os conhece. Crie os casos no Qase e prepare outra run.');
  const reg = await executarOperacao(d.executor, run.espacoId, 'qase.criar_run', parametrosDaRunQase(run), { base: d.base, confirmado: o.confirmado, agora: d.agora });
  const id = reg.estado === 'CONFIRMADA' || reg.estado === 'ENVIADA' ? numeroDoId(reg.remoto?.id) : null; if (id) alterarRunLocal(runLocalId, r => { r.runIdRemoto = id; r.estado = 'CRIADA'; r.confirmadaNoQase = reg.estado === 'CONFIRMADA'; }, d.base);
  return reg;
}
