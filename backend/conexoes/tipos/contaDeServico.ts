/** Formato de uma conta de Jira, Qase ou GitHub (sem a credencial) e dos dados para adicioná-la. */
import { z } from 'zod';
import { servicoSchema } from '../../projetos/tipos/espacos.js';

export const conexaoEntrada=z.object({servico:servicoSchema,nome:z.string().trim().min(1).max(100),instancia:z.string().max(300).optional(),usuario:z.string().email().max(200).optional(),token:z.string().min(1).max(6000).regex(/^[^\x00-\x1f]+$/)}).strict();

export const contaSchema=z.object({id:z.string().uuid(),servico:servicoSchema,nome:z.string().max(100),instancia:z.string().url(),usuario:z.string().max(200).optional(),contaId:z.string().min(1).max(200),identidade:z.string().max(200),criadaEm:z.string().datetime(),validadaEm:z.string().datetime(),ativa:z.boolean()}).strict();

export type Conta=z.infer<typeof contaSchema>;

export const registro=z.object({version:z.literal(1),contas:z.array(contaSchema).max(100)}).strict();
