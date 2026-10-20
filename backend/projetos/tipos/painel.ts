/** Filtros aceitos pelas telas Logs e Histórico e a lista de documentos da Ajuda. */
import { z } from 'zod';
import { ferramentas } from '../../logs/tipos/atividade.js';

/**
 * Adaptador entre a interface e o núcleo. Não tem regra de qualidade própria: cada função
 * valida o argumento, exige projeto vinculado e delega a atividades/evidencias/conexoes.
 * É puro Node (sem Electron) para ser testado sem janela.
 */
const estados = ['STARTED', 'OK', 'NOT_VERIFIED', 'PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'ERROR'] as const;

export const filtroSchema = z.object({
  tool: z.enum(ferramentas).optional(), state: z.enum(estados).optional(),
  since: z.string().datetime().optional(), until: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(200)
}).strict();

export type Filtro = z.input<typeof filtroSchema>;

/** Documentos da Ajuda: lista fixa, lidos da pasta do aplicativo. O nome nunca vem da interface em formato livre. */
export const documentosAjuda = ['01-o-que-e.md', '02-como-funciona.md', '03-instalar.md', '04-vincular.md', '17-plataforma.md', '18-agendamentos.md', '18-agendamentos.en.md', '19-testes-e-integracoes.md', '19-testes-e-integracoes.en.md', '20-assistente-e-agentes.md', '20-assistente-e-agentes.en.md', '21-acesso-e-permissoes.md', '21-acesso-e-permissoes.en.md', 'SERVICOS.md', '15-contextos.md', '16-suporte.md', '05-conectar-ia.md', '06-sem-ia-e-com-ia.md', '07-resultados.md', '08-metricas-e-logs.md', '09-problemas.md', '10-perguntas.md', '11-privacidade.md', '12-seguranca.md', '13-termos.md', '14-sobre.md'] as const;
