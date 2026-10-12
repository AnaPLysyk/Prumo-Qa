/** Prepara a mensagem de erro para a janela: segredos mascarados e o código do erro na frente. */
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';

/** Mensagem mascarada com o código do núcleo na frente (ErroQa guarda o código fora da mensagem). */
export function mensagemComCodigo(err: unknown): string {
  const msg = mascarar((err as Error)?.message ?? String(err)); const codigo = (err as { codigo?: unknown })?.codigo;
  return typeof codigo === 'string' && /^[A-Z][A-Z0-9_]{2,63}$/.test(codigo) && !msg.startsWith(codigo) ? codigo + ': ' + msg : msg;
}
