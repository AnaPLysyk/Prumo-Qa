/** Prepara a mensagem de erro para a janela e para o MCP: segredos mascarados e o código do erro na frente. */
import { mascarar } from '../seguranca/mascarar.js';

/** O ErroQa guarda o código fora da mensagem; aqui ele volta para a frente, uma vez só. */
export function mensagemComCodigo(err: unknown): string {
  const msg = mascarar((err as Error)?.message ?? String(err)); const codigo = (err as { codigo?: unknown } | null)?.codigo;
  return typeof codigo === 'string' && /^[A-Z][A-Z0-9_]{2,63}$/.test(codigo) && !msg.startsWith(codigo) ? codigo + ': ' + msg : msg;
}
