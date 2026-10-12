/** Código do erro de um serviço externo (ou CREDENTIAL_UNAVAILABLE quando o erro não veio do serviço). */
import { ErroServico } from '../integracoes/ErroServico.js';

export function codigoDoErroDeServico(e: unknown) {
  return e instanceof ErroServico ? e.codigo : 'CREDENTIAL_UNAVAILABLE';
}
