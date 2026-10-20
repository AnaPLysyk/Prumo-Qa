/** Entrada padrão e respostas JSON seguras das ferramentas do protocolo MCP. */
import { mensagemComCodigo } from '../../compartilhado/erros.js';
import { RespostaMcp } from '../tipos/mcp.js';

/** Erros são devolvidos como resultado MCP, com código preservado e segredos mascarados. */
export async function respostaDaFerramentaMcp(
  executar: () => Promise<unknown>
): Promise<RespostaMcp> {
  try {
    const dados = await executar();
    return { content: [{ type: 'text' as const, text: JSON.stringify(dados) }] };
  } catch (erro) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: mensagemComCodigo(erro) }]
    };
  }
}

/** Texto curto da pessoa ou padrão explícito, com limite de 300 caracteres. */
export const valorOuPadrao = (valor: string | undefined, padrao: string) =>
  valor && valor.trim() ? valor.trim().slice(0, 300) : padrao;
