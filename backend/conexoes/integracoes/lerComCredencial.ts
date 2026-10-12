/** Faz uma leitura (GET) no serviço com a credencial da conta; sem credencial recusa, e qualquer falha que não seja do serviço vira SERVICE_UNAVAILABLE. */
import { PartesDoAdaptador } from '../tipos/adaptador.js';
import { cabecalhosDoServico } from './cabecalhosDoServico.js';
import { ErroServico } from './ErroServico.js';

export async function lerComCredencial(a: PartesDoAdaptador, caminho: string): Promise<unknown> {
  if (!a.c.token) throw new ErroServico('CREDENTIAL_UNAVAILABLE');
  try { return await a.transporte({ servico: a.c.servico, instancia: a.c.instancia, caminho, headers: cabecalhosDoServico(a.c) }); }
  catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_UNAVAILABLE'); }
}
