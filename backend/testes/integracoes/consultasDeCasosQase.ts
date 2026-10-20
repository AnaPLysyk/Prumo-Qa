/** Reúne consultas de casos qase da funcionalidade, mantendo cada operação identificável pelo nome. */
import { ContextoServico } from "../../conexoes/tipos/adaptador.js";
import { Recurso } from "../../projetos/contratos.js";
import { listarNoQase } from "./listarNoQase.js";
import { codificarParaUrl } from "../../compartilhado/texto.js";

export const acharCasoNoQase = async (ctx: ContextoServico, rec: Recurso, p: { titulo: string; suiteId?: number }) =>
  (await listarNoQase(ctx, rec, 'case', { search: p.titulo, ...(p.suiteId ? { suite_id: p.suiteId } : {}) })).find(c => tituloComparavel(String(c.title)) === tituloComparavel(p.titulo) && (p.suiteId === undefined || Number(c.suite_id) === p.suiteId));

export async function conferirCasosNoQase(ctx: ContextoServico, rec: Recurso, ids: number[]) { for (const c of [...new Set(ids)].slice(0, 500)) await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${c}`); }

/** Simplifica um título (espaços e minúsculas) para comparar casos. */

export const tituloComparavel = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
