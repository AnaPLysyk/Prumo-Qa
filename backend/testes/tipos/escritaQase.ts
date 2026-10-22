/** Tipos de publicação Qase, Jira e casos — arquivos relacionados agrupados para manutenção. */
import { z } from "zod";

// ── escritaQase ──
/**
 * Escritas controladas no Qase TestOps (API v1, qase-tms/specs). O projeto é o código vinculado (rec.chave).
 * Rotas: POST /case|suite|plan|run/{code}, PATCH /case/{code}/{id}, POST /run/{code}/{id}/complete, POST /result/{code}/{run}/bulk,
 * POST /attachment/{code} (multipart, campo file[]), POST /case/{code}/external-issue/attach. Criação de caso, run e plano é
 * idempotente (busca por título e marcador); resultados levam o marcador no comentário e são conferidos relendo a run.
 * Não existe PASS sem execução: resultados só entram com status vindo de uma execução ou de declaração humana explícita.
 */
export const id = z.number().int().positive().max(999999999999);

export const ticket = z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/);

const campoInt = z.number().int().min(0).max(100);
/** IDs de sistema do Qase: severidade 0 a 6, prioridade 0 a 3, status 0 a 2, comportamento 0 a 3, camada 0 a 3. */
const severidadeQase = z.number().int().min(0).max(6), prioridadeQase = z.number().int().min(0).max(3), statusDoCaso = z.number().int().min(0).max(2), comportamentoQase = z.number().int().min(0).max(3), camadaQase = z.number().int().min(0).max(3);

/** Valores de campos personalizados do Qase: chave = ID do campo, valor sempre texto escalar (exigência da API). */
const camposPersonalizados = z.record(z.string().regex(/^\d{1,12}$/), z.string().trim().min(1).max(2000)).refine(c => Object.keys(c).length <= 30, 'campos demais');

export type Pagina ={ entities: Record<string, unknown>[]; total?: number; filtered?: number };

/** `formato` 'bdd' usa `palavra` (Dado, Quando, Então, E, Mas); 'normal' é ação + resultado esperado. */
const passo = z.object({ acao: z.string().trim().min(1).max(2000), esperado: z.string().max(2000).default(''), dados: z.string().max(2000).default(''),
  formato: z.enum(['normal', 'bdd']).default('normal'), palavra: z.enum(['Dado', 'Quando', 'Então', 'E', 'Mas']).optional() }).strict().refine(p => p.formato !== 'bdd' || !!p.palavra, 'passo BDD precisa da palavra (Dado, Quando, Então, E ou Mas)');

export const criarSuite = z.object({ titulo: z.string().trim().min(2).max(255), descricao: z.string().max(4000).default(''), paiId: id.optional() }).strict();

export const esquemaCaso = z.object({
  titulo: z.string().trim().min(3).max(255), descricao: z.string().max(8000).default(''), preCondicoes: z.string().max(4000).default(''), posCondicoes: z.string().max(4000).default(''),
  passos: z.array(passo).max(50).default([]), suiteId: id.optional(), prioridade: prioridadeQase.optional(), severidade: severidadeQase.optional(), tipo: campoInt.optional(),
  /** Campos de sistema do Qase: status 0 ativo, 1 rascunho, 2 obsoleto; comportamento e camada são os IDs do próprio Qase. */
  status: statusDoCaso.optional(), comportamento: comportamentoQase.optional(), camada: camadaQase.optional(), instavel: z.boolean().optional(),
  automacao: z.enum(['manual', 'a-automatizar', 'automatizado']).default('manual'), tags: z.array(z.string().regex(/^[A-Za-z0-9_.-]{1,40}$/)).max(10).default([]), ticket: ticket.optional()
}).strict();

/** Edição de suíte existente do Qase: só título e descrição (a árvore de suítes não é reorganizada pelo Prumo). */
export const editarSuite = z.object({ suiteId: id, titulo: z.string().trim().min(2).max(255).optional(), descricao: z.string().max(4000).optional() }).strict()
  .refine(p => p.titulo !== undefined || p.descricao !== undefined, 'nada para alterar');

/** Apagar suíte do Qase: só pela confirmação nativa e só se ela estiver vazia (sem casos e sem suítes filhas). */
export const apagarSuite = z.object({ suiteId: id }).strict();

export const editarCaso = z.object({ casoId: id, titulo: z.string().trim().min(3).max(255).optional(), descricao: z.string().max(8000).optional(), preCondicoes: z.string().max(4000).optional(), posCondicoes: z.string().max(4000).optional(), passos: z.array(passo).max(50).optional(), prioridade: prioridadeQase.optional(), severidade: severidadeQase.optional(), tipo: campoInt.optional(), status: statusDoCaso.optional(), comportamento: comportamentoQase.optional(), camada: camadaQase.optional(), instavel: z.boolean().optional(), tags: z.array(z.string().regex(/^[A-Za-z0-9_.-]{1,40}$/)).max(10).optional(), automacao: z.enum(['manual', 'a-automatizar', 'automatizado']).optional() }).strict().refine(p => Object.keys(p).length > 1, 'nenhuma alteração');

export const associarTicket = z.object({ casoId: id, ticket }).strict();

export const criarDefeito = z.object({ titulo: z.string().trim().min(3).max(255), resultadoAtual: z.string().trim().min(3).max(8000), severidade: z.number().int().min(1).max(20), marcoId: id.optional(), campos: camposPersonalizados.default({}) }).strict();

// severidade: IDs das opções do campo de sistema "severity" do Qase

/** Mudança de status de defeito: `versao` é o updated_at lido, para não sobrescrever uma alteração feita no Qase depois da leitura. */
export const statusDefeito = z.object({ defeitoId: id, status: z.enum(['in_progress', 'resolved', 'invalid']), versao: z.string().min(10).max(40) }).strict();

export const criarPlano = z.object({ titulo: z.string().trim().min(3).max(255), descricao: z.string().max(4000).default(''), casos: z.array(id).min(1).max(1000) }).strict();

export const criarRun = z.object({ titulo: z.string().trim().min(3).max(255), descricao: z.string().max(4000).default(''), casos: z.array(id).min(1).max(1000), planoId: id.optional(), marcoId: id.optional(), ambienteId: id.optional(), autoteste: z.boolean().default(false) }).strict();

export const completarRun = z.object({ runId: id }).strict();

const statusQase = z.enum(['passed', 'failed', 'blocked', 'skipped', 'invalid']);
/** Resultado de cada passo do caso (a API do Qase aceita passed, failed e blocked por passo), na ordem dos passos. */
const resultadoDoPasso = z.object({ status: z.enum(['passed', 'failed', 'blocked']), comentario: z.string().max(2000).default('') }).strict();

export const resultado = z.object({ casoId: id, status: statusQase, tempoMs: z.number().int().min(0).max(31536000000).optional(), comentario: z.string().max(2000).default(''), passos: z.array(resultadoDoPasso).max(100).optional(), stacktrace: z.string().max(4000).optional(), anexos: z.array(z.string().regex(/^[a-f0-9]{16,64}$/)).max(10).optional(),
  /** Caminhos de evidência que o envio sobe como anexos do resultado. Só vale o que estiver nas pastas de evidência do projeto (o chamador interno define as raízes; a página não consegue autorizar outras). */
  arquivos: z.array(z.string().min(1).max(600)).max(10).optional() }).strict();

export const publicar = z.object({ runId: id, resultados: z.array(resultado).min(1).max(200) }).strict();

export const anexar = z.object({ arquivo: z.string().min(1).max(500) }).strict();

// ── comentarioJira ──
/**
 * Comentário de resultado de QA no Jira, uma das escritas remotas do produto.
 * - Texto estruturado montado só com dados locais da execução (contagens, motivo, referência da evidência);
 * - nunca afirma aprovação do ticket inteiro nem altera status/workflow;
 * - manual: prévia + confirmação nativa feitas pelo processo principal; agendada: política prévia (ticket+tipo+validade+limite);
 * - idempotente: registro local por (execução, ticket) + marcador pesquisável no próprio comentário.
 */
export interface PublicadorJira {
  comentarJira(espacoId: string, ticket: string, adf: unknown): Promise<{ id: string; vinculoId: string; conexaoId: string }>;
  procurarComentarioJira(espacoId: string, ticket: string, marcador: string): Promise<string | null>;
}

export const rotulo: Record<string, string> = { smoke: 'Smoke', regressao: 'Regressão', 'validacao-ticket': 'Validação por ticket', k6: 'Desempenho (k6)' };

export type Comentario = { texto: string; adf: unknown; marcador: string };

export const registroPub = z.object({
  chave: z.string().max(120), trabalhoId: z.string().uuid(), espacoId: z.string().uuid(), ticket: z.string().max(40), modo: z.enum(['MANUAL', 'AGENDADO']),
  estado: z.enum(['PREPARADO', 'PUBLICADO', 'FALHA', 'BLOQUEADO']), tentativas: z.number().int(), textoSha256: z.string().length(64), texto: z.string().max(8000),
  vinculoId: z.string().uuid().optional(), conexaoId: z.string().uuid().optional(), comentarioId: z.string().max(40).optional(), politicaId: z.string().uuid().optional(), consumida: z.boolean().default(false),
  publicadoEm: z.string().datetime().optional(), ultimaTentativa: z.string().datetime().optional(), erro: z.string().max(80).optional(), criadoEm: z.string().datetime()
}).strict();

export type Pub = z.infer<typeof registroPub>;

export const registro = z.object({ version: z.literal(1), itens: z.array(registroPub).max(1000) }).strict();

export type Registro = z.infer<typeof registro>;

// ── repositorioLocal ──
export const dadosCasoLocal = esquemaCaso.omit({ suiteId: true, ticket: true });

export const entradaCasoLocal = z.object({
  espacoId: z.string().uuid(), id: z.string().uuid().optional(),
  dados: dadosCasoLocal, suiteLocalId: z.string().uuid().nullable().optional(),
  requisito: z.string().max(500).optional(), risco: z.string().max(300).optional()
}).strict();

/** Remoção de um caso do Prumo: só do computador, nunca do Qase. */
export const entradaRemoverCaso = z.object({ espacoId: z.string().uuid(), id: z.string().uuid(), remover: z.literal(true) }).strict();

/** Remoção de uma suíte do Prumo: só do computador. Suítes filhas e casos sobem para a suíte pai; nada é apagado junto. */
export const entradaRemoverSuite = z.object({ espacoId: z.string().uuid(), id: z.string().uuid(), remover: z.literal(true) }).strict();

export const entradaSuiteLocal = z.object({
  espacoId: z.string().uuid(), id: z.string().uuid().optional(), titulo: z.string().trim().min(2).max(255),
  descricao: z.string().max(4000).default(''), paiId: z.string().uuid().nullable().optional()
}).strict();

const casoLocalSchema = z.object({
  id: z.string().uuid(), numero: z.number().int().positive().optional(), espacoId: z.string().uuid(), tipo: z.literal('caso'), origem: z.literal('PESSOA'),
  titulo: z.string().min(3).max(255), dados: dadosCasoLocal, requisito: z.string().max(500),
  risco: z.string().max(300), suiteLocalId: z.string().uuid().nullable(),
  referenciasLegadas: z.object({ ticket: z.string().max(40).optional(), suiteId: z.number().int().positive().optional() }).strict().optional(),
  criadaEm: z.string().datetime(), atualizadaEm: z.string().datetime()
}).strict();

const suiteLocalSchema = z.object({
  id: z.string().uuid(), espacoId: z.string().uuid(), titulo: z.string().max(255), descricao: z.string().max(4000),
  paiId: z.string().uuid().nullable(), criadaEm: z.string().datetime(), atualizadaEm: z.string().datetime()
}).strict();

export const repositorioLocalSchema = z.object({
  version: z.literal(1), casos: z.array(casoLocalSchema).max(1000), suites: z.array(suiteLocalSchema).max(100),
  /** Próximo número P-n de cada projeto; só cresce, então o número de um cenário removido nunca é dado a outro. */
  numeracao: z.record(z.string().uuid(), z.number().int().positive()).optional()
}).strict();

export type CasoLocal = z.infer<typeof casoLocalSchema>;

export type RepositorioLocal = z.infer<typeof repositorioLocalSchema>;
