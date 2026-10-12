/** Confere que o id pedido é um número (até 15 dígitos) e o prepara para ir no endereço; senão recusa. */
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ErroServico } from './ErroServico.js';

export function idNumericoDaConsulta(id?: string) {
  if (!id || !/^\d{1,15}$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  return codificarParaUrl(id);
}
