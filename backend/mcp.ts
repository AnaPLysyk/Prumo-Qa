/** Porta de entrada do servidor MCP iniciado pelo cliente de IA: liga o projeto informado na configuração e conversa por stdio. */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { pathToFileURL } from 'node:url';
import { criarServidor } from './agentes/mcp/criarServidor.js';
import { mascarar } from './compartilhado/seguranca/mascarar.js';

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const raiz=process.argv[2];
  if(!raiz){ console.error('Uso: node dist/mcp.js <raiz-absoluta-autorizada>');process.exitCode=1; }
  else { try { const s=await criarServidor(raiz,process.argv[3]); await s.connect(new StdioServerTransport()); } catch(err){console.error(mascarar((err as Error).message));process.exitCode=1;} }
}
