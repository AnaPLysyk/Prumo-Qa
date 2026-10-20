/** Clientes de IA conhecidos (Codex, Claude), ferramentas MCP esperadas e formato dos registros de teste de integração. */
import { z } from 'zod';
import { prepararConexao } from '../ia/conectarIa.js';

export const clientes = ['codex', 'claude'] as const;

export type Cliente = typeof clientes[number];

export type Plano = ReturnType<typeof prepararConexao>;

export const tools = ['contexto_projeto', 'revisar_cobertura', 'executar_validacao', 'consultar_evidencias', 'listar_politicas', 'propor_caso', 'propor_bug', 'propor_aprendizado'];

const digest = z.string().regex(/^[a-f0-9]{64}$/);

export const registroSchema = z.object({
  id: z.string().uuid(), client: z.enum(clientes), rootHash: digest, projectHash: digest, manifestHash: digest,
  configurationHash: digest, at: z.string().datetime(), durationMs: z.number().finite().nonnegative(),
  state: z.enum(['VALIDADO', 'ERRO']), code: z.enum(['PROTOCOL_OK', 'PROTOCOL_FAILED']),
  handshake: z.boolean(), tools: z.array(z.enum(tools as [string, ...string[]])).max(tools.length), read: z.boolean(),
  origin: z.literal('sdk-protocolo')
}).strict();

export type Registro = z.infer<typeof registroSchema>;

export const claudeConfigSchema=z.object({mcpServers:z.record(z.unknown()).default({}),projects:z.record(z.object({mcpServers:z.record(z.unknown()).default({}),disabledMcpjsonServers:z.array(z.string()).max(200).default([])}).passthrough()).default({})}).passthrough();
