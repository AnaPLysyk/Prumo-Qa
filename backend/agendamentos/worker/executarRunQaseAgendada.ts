/** Rotina "run do Qase": executa as automações dos casos e só publica no Qase com política vigente para a run; senão os resultados ficam locais. */
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';
import { Executor } from '../../conexoes/tipos/operacoesExternas.js';
import { executarValidacao } from '../../execucoes/regras/executarValidacao.js';
import { obterRunLocal } from '../../testes/banco/obterRunLocal.js';
import { publicarRunLocal } from '../../testes/integracoes/publicarRunLocal.js';
import { executarRunLocal } from '../../testes/regras/executarRunLocal.js';
import { autorizacaoDelegada } from '../autorizacoes/autorizacaoDelegada.js';
import { ResultadoTrabalho, Trabalho } from '../tipos/fila.js';
import { Rotina } from '../tipos/rotina.js';
import { EstadoDoWorker } from '../tipos/worker.js';

export async function executarRunQaseAgendada(e: EstadoDoWorker, t: Trabalho, r: Rotina): Promise<ResultadoTrabalho> {
  const runLocal = obterRunLocal(r.runLocalId!, e.base); if (!runLocal.runIdRemoto) return { status: 'BLOCKED', motivo: 'RUN_NOT_CREATED: a run ainda não foi criada no Qase.' };
  const manual = t.origem === 'MANUAL'; const executor = e.d.servicos as unknown as Executor | null | undefined;
  const dep = { executor: executor ?? { comContexto: async () => { throw new ErroServico('SERVICE_UNAVAILABLE'); } }, base: e.base, agora: e.agora };
  await executarRunLocal(dep, runLocal.id, { executar: e.d.executar ?? executarValidacao, modo: manual ? 'MANUAL' : 'AGENDADO', delegada: (espacoId, ambiente) => autorizacaoDelegada(espacoId, ambiente, e.base, e.agora), signal: e.abort.signal });
  let pub = 'não houve resultado para publicar';
  if (executor) { const p = await publicarRunLocal(dep, runLocal.id, { confirmado: false, origem: 'AGENDADO' }); pub = p.operacao?.estado === 'BLOQUEADA' ? 'publicação no Qase BLOQUEADA (sem política vigente para esta run); resultados mantidos localmente' : p.publicados ? `${p.publicados} resultado(s) publicado(s) no Qase` : pub; }
  const f = obterRunLocal(runLocal.id, e.base); const rs = f.casos.map(c => c.resultado?.status ?? 'NOT_RUN');
  const conta = { pass: rs.filter(x => x === 'PASS').length, fail: rs.filter(x => x === 'FAIL').length, blocked: rs.filter(x => x === 'BLOCKED').length, notRun: rs.filter(x => x === 'NOT_RUN').length };
  const status = conta.fail ? 'FAIL' : conta.blocked ? 'BLOCKED' : conta.pass ? 'PASS' : 'NOT_RUN';
  const detalhes = f.casos.filter(c => c.resultado?.status === 'FAIL').slice(0, 5).map(c => `${c.casoId}: ${c.resultado!.comentario}`.slice(0, 300)).join('\n');
  return { status, motivo: `Run "${f.titulo}" (Qase #${f.runIdRemoto}): ${conta.pass} PASS, ${conta.fail} FAIL, ${conta.blocked} BLOCKED, ${conta.notRun} NOT_RUN; ${pub}.`.slice(0, 600), contagem: conta, ...(detalhes ? { detalhes } : {}) };
}
