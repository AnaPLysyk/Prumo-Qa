/** Erros padronizados: código estável para a UI e mensagens seguras para janela e MCP. */
import { mascarar } from './seguranca/mascarar.js';

/** Permite diferenciar o código contratual da mensagem explicativa. */
export class ErroQa extends Error {
  constructor(public codigo: string, mensagem: string) {
    super(mensagem);
  }
}

/** Interrompe uma operação usando seu código de erro. */
export function falharCom(codigo: string): never {
  throw new Error(codigo);
}

/** Reapresenta o código na mensagem quando necessário e sempre mascara segredos. */
export function mensagemComCodigo(erro: unknown): string {
  const mensagem = mascarar((erro as Error)?.message ?? String(erro));
  const codigo = (erro as { codigo?: unknown } | null)?.codigo;

  return typeof codigo === 'string' &&
    /^[A-Z][A-Z0-9_]{2,63}$/.test(codigo) &&
    !mensagem.startsWith(codigo)
    ? codigo + ': ' + mensagem
    : mensagem;
}
