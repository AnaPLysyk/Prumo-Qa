/** Cria no Qase a run correspondente à run local, depois da confirmação. */
import { executarOperacao } from '../../conexoes/escrita/executarOperacao.js';
import { RegistroOperacao } from '../../conexoes/tipos/operacoesExternas.js';
import { alterarRunLocal } from '../repositorioRuns.js';
import { obterRunLocal } from '../repositorioRuns.js';
import { CASO_LOCAL_MIN, Dep, RunLocal } from '../tipos/runLocal.js';

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
