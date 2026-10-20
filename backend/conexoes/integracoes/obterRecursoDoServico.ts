/** Lê de novo um projeto ou repositório pelo id, para conferir que o vínculo continua apontando para o mesmo recurso. */
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { PartesDoAdaptador, itemQase } from '../tipos/adaptador.js';
import { ErroServico } from './ErroServico.js';
import { lerComCredencial } from './lerComCredencial.js';
import { recursoDaResposta } from '../integracoesFormatos.js';

export async function obterRecursoDoServico(a: PartesDoAdaptador, id: string) {
  try {
    const caminho = a.c.servico === 'jira' ? '/rest/api/3/project/' + codificarParaUrl(id) : a.c.servico === 'qase' ? '/v1/project/' + codificarParaUrl(id) : '/repositories/' + codificarParaUrl(id);
    const r = await lerComCredencial(a, caminho);
    return recursoDaResposta(a.c, a.c.servico === 'qase' ? itemQase.parse(r).result : r);
  } catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_RESPONSE_INVALID'); }
}
