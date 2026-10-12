/** Procura um caso com o mesmo título (e suite) no Qase. */
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';
import { Recurso } from '../../projetos/tipos/espacos.js';
import { listarNoQase } from './listarNoQase.js';
import { tituloComparavel } from './tituloComparavel.js';

export const acharCasoNoQase = async (ctx: ContextoServico, rec: Recurso, p: { titulo: string; suiteId?: number }) =>
  (await listarNoQase(ctx, rec, 'case', { search: p.titulo, ...(p.suiteId ? { suite_id: p.suiteId } : {}) })).find(c => tituloComparavel(String(c.title)) === tituloComparavel(p.titulo) && (p.suiteId === undefined || Number(c.suite_id) === p.suiteId));
