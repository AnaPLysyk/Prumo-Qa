/** Canal contextos:mcp: Escolher se os contextos do projeto são disponibilizados ao agente de IA conectado por MCP. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { permitirContextosNoMcp } from '../regras/operacoesDoContextoDaPasta.js';

export const contextosMcp: TratadorDoCanal<'contextos:mcp'> = async (a, janela) => {
  if (a.habilitar && !(await confirmarNoWindows(janela, 'Disponibilizar ao agente de IA', 'Disponibilizar os contextos deste projeto ao agente de IA conectado?', 'O texto dos contextos (até 4000 caracteres cada, com segredos mascarados) passará a ser retornado pelas ferramentas MCP e poderá ser processado pelo provedor da IA conectada. Contextos adulterados nunca são enviados. Você pode desabilitar a qualquer momento.', 'Disponibilizar'))) return { canceled: true };
  return { canceled: false, ...(await permitirContextosNoMcp(a.root, a.habilitar)) };
};
