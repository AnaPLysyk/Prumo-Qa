/** Monta a consulta no Jira (tickets com filtros, campos, um ticket ou seus comentários); ticket de outro projeto é recusado. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto.js';
import { parametrosDaUrl } from '../integracoesFormatos.js';
import { Recurso } from '../../projetos/contratos.js';
import { jqlDeTickets } from '../../tickets/integracoesJira.js';
import { OperacaoServico, PartesDoAdaptador, PlanoDaConsulta, obj } from '../tipos/adaptador.js';
import { Filtros } from '../tipos/leituras.js';
import { paginaSchema } from '../tipos/transporte.js';
import { ErroServico } from './ErroServico.js';
import { lerComCredencial } from './requisicoes.js';
import { saidaDaConsulta } from '../integracoesFormatos.js';

export async function planoDaConsultaJira(a: PartesDoAdaptador, r: Recurso, operacao: OperacaoServico, p: z.output<typeof paginaSchema>, id?: string, campoAceite?: string, filtros?: Filtros): Promise<PlanoDaConsulta | { pronto: ReturnType<typeof saidaDaConsulta> }> {
  const fields = 'id,key,summary,description,issuetype,status,priority,assignee,reporter,labels,created,parent,subtasks,updated,issuelinks,project' + (campoAceite ? ',' + campoAceite : '');
  if (operacao === 'tickets') return { endpoint: '/rest/api/3/search/jql?' + parametrosDaUrl({ jql: jqlDeTickets(r.id, filtros), fields, maxResults: p.limite, nextPageToken: p.cursor }), colecao: 'issues', envelope: 'jira-cursor' };
  if (operacao === 'campos') return { endpoint: '/rest/api/3/field', envelope: 'array' };
  if (operacao !== 'ticket' && operacao !== 'comentarios') throw new ErroServico('SERVICE_WRITE_BLOCKED');
  if (!id || !/^[A-Z][A-Z0-9_]*-\d+$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  const detalhe = obj.parse(await lerComCredencial(a, '/rest/api/3/issue/' + codificarParaUrl(id) + '?' + parametrosDaUrl({ fields })));
  if (String((obj.parse(detalhe.fields).project as { id?: unknown })?.id) !== r.id) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  if (operacao === 'ticket') return { pronto: saidaDaConsulta(a.c, detalhe, undefined, r, '/rest/api/3/issue/' + codificarParaUrl(id)) };
  return { endpoint: '/rest/api/3/issue/' + codificarParaUrl(id) + '/comment?' + parametrosDaUrl({ startAt: p.offset, maxResults: p.limite }), colecao: 'comments', envelope: 'jira-offset' };
}
