/** Publica um comentário num ticket do projeto Jira vinculado, depois de confirmar que o ticket é desse projeto. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { Recurso } from '../../projetos/contratos.js';
import { PartesDoAdaptador, obj } from '../tipos/adaptador.js';
import { cabecalhosDoServico } from './cabecalhosDoServico.js';
import { consultarNoServico } from './consultarNoServico.js';
import { ErroServico } from './ErroServico.js';

export async function publicarComentarioNoTicket(a: PartesDoAdaptador, r: Recurso, ticket: string, adf: unknown): Promise<{ id: string }> {
  if (a.c.servico !== 'jira' || !a.c.token) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  if (!/^[A-Z][A-Z0-9_]*-\d+$/.test(ticket)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  await consultarNoServico(a, r, 'ticket', {}, ticket);
  let resposta: unknown;
  try { resposta = await a.escrita({ servico: 'jira', instancia: a.c.instancia, caminho: '/rest/api/3/issue/' + codificarParaUrl(ticket) + '/comment', headers: cabecalhosDoServico(a.c), corpo: JSON.stringify({ body: adf }) }); }
  catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_UNAVAILABLE'); }
  try { return { id: z.string().regex(/^\d{1,20}$/).parse(obj.parse(resposta).id) }; } catch { throw new ErroServico('SERVICE_RESPONSE_INVALID'); }
}
