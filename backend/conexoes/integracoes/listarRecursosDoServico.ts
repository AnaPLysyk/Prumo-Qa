/** Lista, página por página, os projetos (Jira, Qase) ou repositórios (GitHub) que a conta enxerga. */
import { z } from 'zod';
import { parametrosDaUrl } from '../../compartilhado/texto/parametrosDaUrl.js';
import { PartesDoAdaptador, objetos, paginaQase } from '../tipos/adaptador.js';
import { paginaSchema } from '../tipos/transporte.js';
import { ErroServico } from './ErroServico.js';
import { lerComCredencial } from './lerComCredencial.js';
import { recursoDaResposta } from './recursoDaResposta.js';

export async function listarRecursosDoServico(a: PartesDoAdaptador, pagina: z.input<typeof paginaSchema> = {}) {
  const p = paginaSchema.parse(pagina);
  try {
    let entries: Record<string, unknown>[], total: number | undefined, next: string | number | null;
    if (a.c.servico === 'jira') { const r = z.object({ values: objetos, total: z.number().int().nonnegative(), isLast: z.boolean().optional() }).parse(await lerComCredencial(a, '/rest/api/3/project/search?' + parametrosDaUrl({ startAt: p.offset, maxResults: p.limite }))); entries = r.values; total = r.total; next = p.offset + entries.length < total ? p.offset + entries.length : null; }
    else if (a.c.servico === 'qase') { const r = paginaQase.parse(await lerComCredencial(a, '/v1/project?' + parametrosDaUrl({ offset: p.offset, limit: p.limite }))); entries = r.result.entities; total = r.result.filtered ?? r.result.total; next = p.offset + entries.length < total ? p.offset + entries.length : null; }
    else { const r = objetos.parse(await lerComCredencial(a, '/user/repos?' + parametrosDaUrl({ per_page: p.limite, page: Math.floor(p.offset / p.limite) + 1, sort: 'full_name' }))); entries = r; next = r.length === p.limite ? p.offset + r.length : null; }
    return { recursos: entries.map(e => recursoDaResposta(a.c, e)), total, proxima: next, consultadoEm: new Date().toISOString(), cache: false, origem: a.c.instancia };
  } catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_RESPONSE_INVALID'); }
}
