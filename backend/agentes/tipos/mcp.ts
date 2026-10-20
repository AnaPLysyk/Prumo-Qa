/** O que cada ferramenta do servidor MCP recebe (servidor, projeto, projeto do Prumo, respostas padronizadas) e as marcas de leitura e rascunho. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Projeto } from '../../compartilhado/projeto/contratos.js';
import type { espacoDaRaiz } from '../../projetos/servicoProjetos.js';

export type RespostaMcp = { content: { type: 'text'; text: string }[]; isError?: boolean };

export type MeiosDoServidorMcp = {
  servidor: McpServer;
  /** Reabre o contrato da pasta a cada chamada e recusa se a identidade do projeto mudou. */
  projeto: () => Promise<Projeto>;
  /** Projeto do Prumo que usa esta pasta (ou null). */
  espaco: () => ReturnType<typeof espacoDaRaiz>;
  /** Transforma o resultado em resposta MCP; erro vira mensagem mascarada. */
  resposta: (fn: () => Promise<unknown>) => Promise<RespostaMcp>;
  /** Confere a política da IA neste projeto antes de executar (POLICY_BLOCKED se bloqueada). */
  guarda: (capacidade: string, fn: () => Promise<unknown>) => Promise<RespostaMcp>;
  /** Nome declarado pelo cliente de IA (não é autenticação). */
  cliente: () => string | undefined;
};

export const somenteLeitura = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
export const rascunhoLocal = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };
export const avisoDeRascunho = 'Proposta salva como RASCUNHO local. Nada foi enviado ao Jira, Qase ou GitHub: só uma pessoa revisa e publica, pela janela do Prumo.';
