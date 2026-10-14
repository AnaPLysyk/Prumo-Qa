/** Formato da configuração geral dos agentes da plataforma, decidida só na Administração. */
import { z } from 'zod';

/**
 * Vale para todos os projetos deste computador, inclusive o servidor MCP: agente desligado não responde no chat nem
 * aparece nas políticas do MCP; IA externa desligada impede delegar ao Claude Code ou ao Codex. O Prumo Orchestrator
 * nunca é desligado (é quem conversa); a orquestração só decide se ele combina vários agentes numa resposta.
 */
export const agentesDaPlataformaSchema = z.object({
  version: z.literal(1), desligados: z.array(z.string().min(1).max(40)).max(16), iaExterna: z.boolean(), orquestracao: z.boolean(),
  alteradoEm: z.string().datetime().nullable(), por: z.string().max(200).nullable()
}).strict();

export type AgentesDaPlataforma = z.infer<typeof agentesDaPlataformaSchema>;

export const agentesDaPlataformaPadrao: AgentesDaPlataforma = { version: 1, desligados: [], iaExterna: true, orquestracao: true, alteradoEm: null, por: null };
