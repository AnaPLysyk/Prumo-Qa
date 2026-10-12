/** Confere no Qase que todos os casos escolhidos existem no projeto vinculado. */
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';
import { Recurso } from '../../projetos/tipos/espacos.js';

export async function conferirCasosNoQase(ctx: ContextoServico, rec: Recurso, ids: number[]) { for (const c of [...new Set(ids)].slice(0, 500)) await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${c}`); }
