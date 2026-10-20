/** Formato de um projeto do Prumo ("espaço"): vínculos com serviços, relações, histórico e limites. */
import { z } from 'zod';

/** Serviço exigido (pelo vínculo do projeto) para cada tipo de referência remota. */
export const servicoDaReferencia:Partial<Record<z.infer<typeof referencia>['tipo'],Servico>>={jira:'jira','jira-bug':'jira',qase:'qase','qase-run':'qase','qase-defeito':'qase',github:'github','github-pr':'github','github-commit':'github'};

const servicos=['jira','qase','github'] as const;

export const servicoSchema=z.enum(servicos);

export type Servico=z.infer<typeof servicoSchema>;

export const identidadeRecurso=z.object({id:z.string().min(1).max(100),chave:z.string().min(1).max(200),nome:z.string().min(1).max(200),instancia:z.string().url().max(300),contaId:z.string().min(1).max(200),tipoId:z.enum(['id_api','codigo_api'])}).strict();

export type Recurso=z.infer<typeof identidadeRecurso>;

export const vinculoSchema=z.object({id:z.string().uuid(),servico:servicoSchema,conexaoId:z.string().uuid(),recurso:identidadeRecurso,validadoEm:z.string().datetime(),estado:z.enum(['VALIDO','INDISPONIVEL','SEM_PERMISSAO','DESATUALIZADO','SEM_CREDENCIAL']),campoAceite:z.string().regex(/^customfield_\d+$/).optional()}).strict();

export const dadosEspaco=z.object({nome:z.string().trim().min(1).max(200),descricao:z.string().max(1000).default('')}).strict();

const referencia=z.object({tipo:z.enum(['jira','qase','caso-local','ticket-local','contexto','automacao','execucao','evidencia','jira-bug','qase-run','qase-defeito','github','github-pr','github-commit']),id:z.string().min(1).max(200),vinculoId:z.string().uuid().optional(),origem:z.string().min(1).max(500)}).strict();

export const associacaoSchema=z.object({de:referencia,para:referencia,justificativa:z.string().trim().min(1).max(1000)}).strict();

export const evento=z.object({at:z.string().datetime(),acao:z.enum(['CRIADO','EDITADO','PASTA','VINCULADO','REMOVIDO','VALIDACAO','ASSOCIADO','CONSULTA','ESCRITA']),servico:servicoSchema.optional(),vinculoId:z.string().uuid().optional(),codigo:z.string().regex(/^[A-Z_]+$/).optional()}).strict();

const espacoSchema=z.object({id:z.string().uuid(),nome:z.string().max(200),descricao:z.string().max(1000),criadoEm:z.string().datetime(),pastaLocal:z.string().max(1000).optional(),raizContextos:z.string().max(1000),vinculos:z.array(vinculoSchema).max(3),relacoes:z.array(associacaoSchema.extend({id:z.string().uuid(),at:z.string().datetime(),estado:z.literal('VINCULADO'),origemRegistro:z.enum(['DECLARADO_PELO_USUARIO','REGISTRADO_PELO_PRUMO'])})).max(500),historico:z.array(evento).max(1000)}).strict();

export type Espaco=z.infer<typeof espacoSchema>;

export const registro=z.object({version:z.literal(1),espacos:z.array(espacoSchema).max(200)}).strict();
