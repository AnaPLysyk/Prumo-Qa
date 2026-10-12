/** Lista casos, runs, planos ou suites do projeto Qase com filtros. */
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';
import { Recurso } from '../../projetos/tipos/espacos.js';
import { itensDaPaginaQase } from './itensDaPaginaQase.js';

export async function listarNoQase(ctx: ContextoServico, rec: Recurso, tipo: 'case' | 'run' | 'plan' | 'suite', filtros: Record<string, string | number>, max = 100) {
  const q = new URLSearchParams({ limit: String(Math.min(max, 100)), offset: '0' }); for (const [k, v] of Object.entries(filtros)) q.set(k, String(v));
  return itensDaPaginaQase(await ctx.ler(`/v1/${tipo}/${codificarParaUrl(rec.chave)}?${q}`)).entities;
}
