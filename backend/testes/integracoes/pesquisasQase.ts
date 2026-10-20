/** Consulta casos, páginas e resultados de execuções na API do Qase. */
import { ContextoServico } from "../../conexoes/tipos/adaptador.js";
import { Recurso } from "../../projetos/contratos.js";
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { z } from "zod";
import { Pagina } from "../tipos/escritaQase.js";
import { ErroServico } from "../../conexoes/integracoes/configuracaoDosServicos.js";

export const acharCasoNoQase = async (ctx: ContextoServico, rec: Recurso, p: { titulo: string; suiteId?: number }) =>
  (await listarNoQase(ctx, rec, 'case', { search: p.titulo, ...(p.suiteId ? { suite_id: p.suiteId } : {}) })).find(c => tituloComparavel(String(c.title)) === tituloComparavel(p.titulo) && (p.suiteId === undefined || Number(c.suite_id) === p.suiteId));

export async function conferirCasosNoQase(ctx: ContextoServico, rec: Recurso, ids: number[]) { for (const c of [...new Set(ids)].slice(0, 500)) await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${c}`); }

/** Simplifica um título (espaços e minúsculas) para comparar casos. */

export const tituloComparavel = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

export const itensDaPaginaQase = (v: unknown): Pagina => z.object({ result: z.object({ entities: z.array(z.record(z.unknown())), total: z.number().int().nonnegative().optional(), filtered: z.number().int().nonnegative().optional() }).passthrough() }).passthrough().parse(v).result;

export async function resultadosDaRun(ctx: ContextoServico, rec: Recurso, runId: number) {
  const todos: Record<string, unknown>[] = [];
  for (let off = 0; off < 1000; off += 100) { const p = itensDaPaginaQase(await ctx.ler(`/v1/result/${codificarParaUrl(rec.chave)}?run=${runId}&limit=100&offset=${off}`)); todos.push(...p.entities); if (p.entities.length < 100) break; }
  return todos;
}

/** Limite finito: se houver mais registros, a operação de escrita não pode assumir ausência de duplicata. */
export async function listarNoQase(ctx: ContextoServico, rec: Recurso, tipo: 'case' | 'run' | 'plan' | 'suite' | 'defect', filtros: Record<string, string | number>, max = 1000) {
  const teto = Math.min(Math.max(1, Math.trunc(max)), 2000);
  const itens: Record<string, unknown>[] = [];
  let offset = 0;
  while (offset < teto) {
    const limite = Math.min(100, teto - offset);
    const q = new URLSearchParams({ limit: String(limite), offset: String(offset) });
    for (const [k, v] of Object.entries(filtros)) q.set(k, String(v));
    const pagina = itensDaPaginaQase(await ctx.ler(`/v1/${tipo}/${codificarParaUrl(rec.chave)}?${q}`));
    const informados = pagina.filtered ?? pagina.total;
    if ((informados !== undefined && informados > teto) ||
        pagina.entities.length > limite ||
        (pagina.entities.length === 0 && informados !== undefined && offset < informados)) {
      throw new ErroServico('SERVICE_RESPONSE_INVALID');
    }
    itens.push(...pagina.entities);
    offset = itens.length;
    if (informados !== undefined) {
      if (offset >= informados) return itens;
      if (pagina.entities.length !== limite) throw new ErroServico('SERVICE_RESPONSE_INVALID');
    } else if (pagina.entities.length < limite) {
      return itens;
    }
  }
  // Não liberar criação/reconciliação se o serviço não permitiu pesquisar todos os registros.
  throw new ErroServico('SERVICE_RESPONSE_INVALID');
}
