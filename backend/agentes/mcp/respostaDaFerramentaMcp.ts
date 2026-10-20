/** Executa uma ferramenta MCP e devolve o resultado em JSON; se der erro, devolve a mensagem com segredos mascarados. */
import { mensagemComCodigo } from '../../compartilhado/erros/mensagemComCodigo.js';
import { RespostaMcp } from '../tipos/mcp.js';

export async function respostaDaFerramentaMcp(fn: () => Promise<unknown>): Promise<RespostaMcp> {
  try { const data = await fn(); return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] }; }
  catch (err) { return { isError: true, content: [{ type: 'text' as const, text: mensagemComCodigo(err) }] }; }
}
