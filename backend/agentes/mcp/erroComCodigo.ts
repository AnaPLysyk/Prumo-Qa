/** Preserva o código contratual do erro na resposta MCP, com a mensagem e os segredos mascarados. */
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';

export function erroComCodigo(err: unknown): string {
  const mensagem = mascarar((err as Error)?.message ?? String(err));
  const codigo = (err as { codigo?: unknown } | null)?.codigo;
  return typeof codigo === 'string' && /^[A-Z][A-Z0-9_]{2,63}$/.test(codigo) && !mensagem.startsWith(codigo) ? codigo + ': ' + mensagem : mensagem;
}
