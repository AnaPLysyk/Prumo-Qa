/** Publica no Qase os resultados ainda não enviados e confere relendo a run. */
import path from 'node:path';
import { executarOperacao } from '../../conexoes/escrita/executarOperacao.js';
import { Auxiliar } from '../../conexoes/tipos/operacao.js';
import { RegistroOperacao } from '../../conexoes/tipos/operacoesExternas.js';
import { obterEspaco } from '../../projetos/repositorio.js';
import { alterarRunLocal } from '../banco/armazenamentoDeRuns.js';
import { obterRunLocal } from '../banco/armazenamentoDeRuns.js';
import { Dep, paraQase } from '../tipos/runLocal.js';

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
