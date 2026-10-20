/** Requisições HTTP dos serviços conectados, com credenciais, limites e falhas padronizadas. */
import { ErroServico } from './ErroServico.js';
import { requisitarServico } from './requisitarServico.js';
import { TransporteEscrita, TransporteServico } from '../tipos/transporte.js';
import { PartesDoAdaptador, itemQase } from '../tipos/adaptador.js';
import { cabecalhosDoServico } from './cabecalhosDoServico.js';
import { codificarParaUrl } from '../../compartilhado/texto.js';
import { recursoDaResposta } from '../integracoesFormatos.js';

/** Limita a 12 MB o envio e delega as rotas permitidas ao transporte do serviço. */
export const enviarAoServico: TransporteEscrita = pedido => {
  if (pedido.corpo.length > 12 * 1024 * 1024) {
    throw new ErroServico('SERVICE_WRITE_BLOCKED');
  }
  return requisitarServico(
    { ...pedido, timeoutMs: pedido.timeoutMs ?? 30000 },
    pedido.metodo ?? 'POST',
    pedido.corpo,
    pedido.tipoConteudo ?? 'application/json'
  );
};

/** Toda leitura HTTP usa GET, independentemente do serviço. */
export const lerDoServico: TransporteServico = pedido =>
  requisitarServico(pedido, 'GET');

/** A ausência de credencial nunca vira consulta anônima. */
export async function lerComCredencial(adaptador: PartesDoAdaptador, caminho: string): Promise<unknown> {
  if (!adaptador.c.token) throw new ErroServico('CREDENTIAL_UNAVAILABLE');

  try {
    return await adaptador.transporte({
      servico: adaptador.c.servico,
      instancia: adaptador.c.instancia,
      caminho,
      headers: cabecalhosDoServico(adaptador.c)
    });
  } catch (erro) {
    if (erro instanceof ErroServico) throw erro;
    throw new ErroServico('SERVICE_UNAVAILABLE');
  }
}

/** Busca o recurso remoto pelo caminho oficial de GitHub, Jira ou Qase. */
export async function obterRecursoDoServico(adaptador: PartesDoAdaptador, id: string) {
  try {
    const caminho = adaptador.c.servico === 'jira'
      ? '/rest/api/3/project/' + codificarParaUrl(id)
      : adaptador.c.servico === 'qase'
        ? '/v1/project/' + codificarParaUrl(id)
        : '/repositories/' + codificarParaUrl(id);

    const resposta = await lerComCredencial(adaptador, caminho);
    const recurso = adaptador.c.servico === 'qase'
      ? itemQase.parse(resposta).result
      : resposta;
    return recursoDaResposta(adaptador.c, recurso);
  } catch (erro) {
    if (erro instanceof ErroServico) throw erro;
    throw new ErroServico('SERVICE_RESPONSE_INVALID');
  }
}
