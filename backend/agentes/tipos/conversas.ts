/** Formato das conversas antigas do chat (até a 2.9) e seus limites. */
import { z } from 'zod';

/**
 * Conversas do chat, gravadas SOMENTE neste computador (escolha da pessoa, 2.9): pergunta, agente escolhido, fontes e
 * resposta, para o Cérebro mostrar os ramos de conversa e permitir testes controlados. Um arquivo por projeto,
 * limitado; segredos conhecidos são mascarados; a pessoa pode apagar tudo. Nada sai da máquina.
 */
export const registro = z.object({
  versao: z.literal(1), id: z.string().uuid(), em: z.string().datetime(), agente: z.string().regex(/^[a-z0-9-]{1,40}$/),
  pergunta: z.string().max(400), linhas: z.array(z.string().max(6000)).max(20), fontes: z.array(z.object({ rotulo: z.string().max(60), aba: z.string().max(40) }).strict()).max(10),
  modo: z.enum(['LOCAL', 'CLAUDE', 'CODEX']), estilo: z.enum(['amigavel', 'direto', 'tecnico'])
}).strict();

export type RegistroConversa = z.infer<typeof registro>;

export const limitesConversa = { registros: 1500, bytes: 4 * 1024 * 1024 } as const;
