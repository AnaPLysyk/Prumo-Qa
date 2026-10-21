/** Formato de uma conta de Jira, Qase ou GitHub (sem a credencial) e dos dados para adicioná-la. */
import { z } from 'zod';
import { servicoSchema } from '../../projetos/contratos.js';
import type { cofreCredenciais } from '../banco/credenciais.js';
import type { Protetor } from './adaptador.js';
import type { TransporteEscrita, TransporteServico } from './adaptador.js';

export const conexaoEntrada=z.object({servico:servicoSchema,nome:z.string().trim().min(1).max(100),instancia:z.string().max(300).optional(),usuario:z.string().email().max(200).optional(),token:z.string().min(1).max(6000).regex(/^[^\x00-\x1f]+$/)}).strict();

export const contaSchema=z.object({id:z.string().uuid(),servico:servicoSchema,nome:z.string().max(100),instancia:z.string().url(),usuario:z.string().max(200).optional(),contaId:z.string().min(1).max(200),identidade:z.string().max(200),criadaEm:z.string().datetime(),validadaEm:z.string().datetime(),ativa:z.boolean(),autenticacao:z.enum(['token','oauth']).optional(),nuvem:z.string().uuid().optional()}).strict();

export type Conta=z.infer<typeof contaSchema>;

/** O que uma conexão OAuth guarda no cofre (em JSON): acesso, renovação e vencimento do acesso em milissegundos. */
export const credencialOAuthSchema=z.object({acesso:z.string().min(1).max(4000),renovacao:z.string().min(1).max(2000).optional(),expiraEm:z.number().int().positive().optional()}).strict();

export type CredencialOAuth=z.infer<typeof credencialOAuthSchema>;

/** Renova o acesso pelo serviço do Prumo (que guarda o segredo do aplicativo); devolve a credencial nova. */
export type RenovadorOAuth=(servico:z.infer<typeof servicoSchema>,renovacao:string)=>Promise<CredencialOAuth>;

/** Revoga a autorização no provedor, quando ele permite; falha não impede remover a conta. */
export type RevogadorOAuth=(servico:z.infer<typeof servicoSchema>,acesso:string)=>Promise<void>;

export const registro=z.object({version:z.literal(1),contas:z.array(contaSchema).max(100)}).strict();

/** O que todas as ações da tela Conexões recebem: proteção de credenciais, transporte de leitura e escrita, pasta de dados e o cofre. */
export type ContextoDosServicos = { protetor: Protetor; transporte: TransporteServico; escrita: TransporteEscrita; base?: string; cofre: ReturnType<typeof cofreCredenciais>; renovar?: RenovadorOAuth; revogar?: RevogadorOAuth };
