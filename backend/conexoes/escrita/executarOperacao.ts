/** Executa uma operação externa confirmada, uma de cada vez por chave, sem duplicar. */
import { chaveDaOperacao } from './chaveDaOperacao.js';
import { executarOperacaoUmaVez } from './executarOperacaoUmaVez.js';
import { operacaoPorId } from './catalogoOperacoes.js';
import { Executor, OpcoesOperacao, RegistroOperacao, emCurso } from '../tipos/operacoesExternas.js';

export async function executarOperacao(ex: Executor, espacoId: string, operacaoId: string, bruto: unknown, o: OpcoesOperacao = {}): Promise<RegistroOperacao & { reutilizada: boolean }> {
  const op = operacaoPorId(operacaoId); if (!op) throw new Error('OPERATION_UNKNOWN: operação desconhecida.');
  const fila = `${o.base ?? ''}|${chaveDaOperacao(espacoId, op.id, op.schema.parse(bruto))}`;
  const atual = (emCurso.get(fila) ?? Promise.resolve()).catch(() => undefined).then(() => executarOperacaoUmaVez(ex, espacoId, operacaoId, bruto, o));
  emCurso.set(fila, atual);
  try { return await atual; } finally { if (emCurso.get(fila) === atual) emCurso.delete(fila); }
}
