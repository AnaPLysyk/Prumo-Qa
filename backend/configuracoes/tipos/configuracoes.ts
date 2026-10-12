/** Formato das preferências da pessoa (tema, idioma, avisos, IA) e seus valores padrão. */
import { z } from 'zod';

export const versaoTxt = z.string().regex(/^\d+\.\d+\.\d+$/);

// 2.9: configuração do assistente. A delegação a IA externa só muda por autorizarDelegacao (confirmação nativa).
export const nomeIa = z.string().trim().min(1).max(40).regex(/^[\p{L}\p{N} ._-]+$/u);

export const iaSchema = z.object({ nome: nomeIa, estilo: z.enum(['amigavel', 'direto', 'tecnico']), voz: z.string().max(120).nullable(), lerRespostas: z.boolean(), delegacao: z.object({ claude: z.boolean(), codex: z.boolean() }).strict() }).strict();

export const iaPadrao = { nome: 'Prumo', estilo: 'amigavel' as const, voz: null, lerRespostas: false, delegacao: { claude: false, codex: false } };

export const preferenciasSchema = z.object({
  version: z.literal(1),
  verificarAoIniciar: z.boolean(), som: z.boolean(), silenciar: z.boolean(),
  // 2.8: arquivos antigos (sem estes campos) continuam válidos e recebem os padrões.
  tema: z.enum(['claro', 'escuro', 'sistema']).default('sistema'), idioma: z.enum(['pt-BR', 'en']).default('pt-BR'),
  iniciarComWindows: z.boolean().default(false), notificarAgenda: z.boolean().default(true),
  versaoVisualizada: versaoTxt.nullable(),  // última versão disponível que a pessoa já viu/reconheceu
  versaoNotificada: versaoTxt.nullable(),   // última versão para a qual o aviso (e o som) já foram emitidos
  disponivel: z.object({ versao: versaoTxt, notas: z.string().max(4000) }).strict().nullable(), // última release mais nova que a instalada (dado público do GitHub)
  ultimaConsulta: z.string().datetime().nullable(),
  // 2.10.1: arquivos antigos não têm o campo e recebem o padrão ligado (a 2.9 gravava verificarAoIniciar=false sem escolha da pessoa).
  avisoAutomatico: z.boolean().default(true),
  ia: iaSchema.default(iaPadrao)
}).strict();

export type Preferencias = z.infer<typeof preferenciasSchema>;

export const padrao: Preferencias = { version: 1, verificarAoIniciar: false, som: false, silenciar: false, tema: 'sistema', idioma: 'pt-BR', iniciarComWindows: false, notificarAgenda: true, versaoVisualizada: null, versaoNotificada: null, disponivel: null, ultimaConsulta: null, avisoAutomatico: true, ia: { ...iaPadrao, delegacao: { ...iaPadrao.delegacao } } };

/** Campos que a interface pode alterar diretamente. As versões só mudam por ações específicas abaixo. */
export const alteracaoSchema = z.object({ verificarAoIniciar: z.boolean().optional(), avisoAutomatico: z.boolean().optional(), som: z.boolean().optional(), silenciar: z.boolean().optional(), tema: z.enum(['claro', 'escuro', 'sistema']).optional(), idioma: z.enum(['pt-BR', 'en']).optional(), iniciarComWindows: z.boolean().optional(), notificarAgenda: z.boolean().optional(), ia: z.object({ nome: nomeIa.optional(), estilo: z.enum(['amigavel', 'direto', 'tecnico']).optional(), voz: z.string().max(120).nullable().optional(), lerRespostas: z.boolean().optional() }).strict().optional() }).strict();
