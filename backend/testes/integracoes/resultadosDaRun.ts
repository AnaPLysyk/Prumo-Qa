/** Lê os resultados já registrados numa run do Qase (até 1.000). */
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';
import { Recurso } from '../../projetos/tipos/espacos.js';
import { itensDaPaginaQase } from './itensDaPaginaQase.js';

export async function resultadosDaRun(ctx: ContextoServico, rec: Recurso, runId: number) {
  const todos: Record<string, unknown>[] = [];
  for (let off = 0; off < 1000; off += 100) { const p = itensDaPaginaQase(await ctx.ler(`/v1/result/${codificarParaUrl(rec.chave)}?run=${runId}&limit=100&offset=${off}`)); todos.push(...p.entities); if (p.entities.length < 100) break; }
  return todos;
}
