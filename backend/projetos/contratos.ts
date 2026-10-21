/** Lógica e contratos de projetos: operações relacionadas no mesmo módulo. */
import { Manifesto } from "../compartilhado/projeto/contratos.js";
import { z } from "zod";
import { ferramentas } from "../logs/contratos.js";

/**
 * Pasta sem qa.project.json: detecta a stack só pelos arquivos da raiz (sem recursão, sem executar nada, sem
 * seguir links) e monta um contrato v2 conservador para a pessoa aprovar. Comandos só para npm, com scripts que existem
 * no package.json; as demais stacks ficam somente leitura até o executor aceitá-las. Nada é gravado aqui sem aprovação:
 * gravarContratoProposto é chamado pelo aplicativo depois da confirmação nativa.
 */
export type Stack = { id: string; nome: string; evidencias: string[]; comandoNativo: string; executavelPeloPrumo: boolean };

export type PropostaContrato = { raiz: string; manifesto: Manifesto; stacks: Stack[]; observacoes: string[] };

export const STACKS: { id: string; nome: string; arquivos: RegExp; comando: string; executavel: boolean }[] = [
  { id: 'node', nome: 'Node.js (npm)', arquivos: /^package\.json$/i, comando: 'npm test', executavel: true },
  { id: 'python', nome: 'Python', arquivos: /^(pyproject\.toml|requirements(-dev)?\.txt|setup\.py|setup\.cfg|pytest\.ini|tox\.ini|Pipfile)$/i, comando: 'pytest', executavel: false },
  { id: 'go', nome: 'Go', arquivos: /^go\.mod$/i, comando: 'go test ./...', executavel: false },
  { id: 'maven', nome: 'Java (Maven)', arquivos: /^pom\.xml$/i, comando: 'mvn test', executavel: false },
  { id: 'gradle', nome: 'Java/Kotlin (Gradle)', arquivos: /^(build|settings)\.gradle(\.kts)?$/i, comando: 'gradle test', executavel: false },
  { id: 'dotnet', nome: '.NET', arquivos: /\.(sln|csproj|fsproj|vbproj)$/i, comando: 'dotnet test', executavel: false },
  { id: 'rust', nome: 'Rust (Cargo)', arquivos: /^Cargo\.toml$/i, comando: 'cargo test', executavel: false },
  { id: 'php', nome: 'PHP (Composer)', arquivos: /^composer\.json$/i, comando: 'composer test', executavel: false },
  { id: 'ruby', nome: 'Ruby (Bundler)', arquivos: /^Gemfile$/i, comando: 'bundle exec rspec', executavel: false }
];

export const DOCUMENTACAO = /^(docs?|documentation|wiki|readme(\.\w+)?|agents\.md|claude\.md|contributing\.md|changelog\.md)$/i;

export const TESTES = /^(tests?|testes|__tests__|specs?|e2e|cypress|playwright|integration|qa)$/i;

export const CODIGO = /^(src|app|apps|lib|libs|pkg|cmd|internal|packages|server|client|api|web|frontend|backend|scripts|main)$/i;

export const SCRIPT = /^(test|tests|build|lint|typecheck|type-check|check|e2e)([:_-][\w:-]*)?$/i;

export const EXIGE_REVISAO = /e2e|integration|deploy|release|publish|migrat|seed|db/i;

/** Serviço exigido (pelo vínculo do projeto) para cada tipo de referência remota. */
export const servicoDaReferencia:Partial<Record<z.infer<typeof referencia>['tipo'],Servico>>={jira:'jira','jira-bug':'jira',qase:'qase','qase-run':'qase','qase-defeito':'qase',github:'github','github-pr':'github','github-commit':'github'};

const servicos=['jira','qase','github'] as const;

export const servicoSchema=z.enum(servicos);

export type Servico=z.infer<typeof servicoSchema>;

export const identidadeRecurso=z.object({id:z.string().min(1).max(100),chave:z.string().min(1).max(200),nome:z.string().min(1).max(200),instancia:z.string().url().max(300),contaId:z.string().min(1).max(200),tipoId:z.enum(['id_api','codigo_api'])}).strict();

export type Recurso=z.infer<typeof identidadeRecurso>;

export const vinculoSchema=z.object({id:z.string().uuid(),servico:servicoSchema,conexaoId:z.string().uuid(),recurso:identidadeRecurso,validadoEm:z.string().datetime(),estado:z.enum(['VALIDO','INDISPONIVEL','SEM_PERMISSAO','DESATUALIZADO','SEM_CREDENCIAL']),campoAceite:z.string().regex(/^customfield_\d+$/).optional(),desligado:z.boolean().default(false)}).strict();

export const dadosEspaco=z.object({nome:z.string().trim().min(1).max(200),descricao:z.string().max(1000).default('')}).strict();

const referencia=z.object({tipo:z.enum(['jira','qase','caso-local','ticket-local','contexto','automacao','execucao','evidencia','jira-bug','qase-run','qase-defeito','github','github-pr','github-commit']),id:z.string().min(1).max(200),vinculoId:z.string().uuid().optional(),origem:z.string().min(1).max(500)}).strict();

export const associacaoSchema=z.object({de:referencia,para:referencia,justificativa:z.string().trim().min(1).max(1000)}).strict();

export const evento=z.object({at:z.string().datetime(),acao:z.enum(['CRIADO','EDITADO','PASTA','VINCULADO','REMOVIDO','VALIDACAO','ASSOCIADO','CONSULTA','ESCRITA']),servico:servicoSchema.optional(),vinculoId:z.string().uuid().optional(),codigo:z.string().regex(/^[A-Z_]+$/).optional()}).strict();

const espacoSchema=z.object({id:z.string().uuid(),nome:z.string().max(200),descricao:z.string().max(1000),criadoEm:z.string().datetime(),pastaLocal:z.string().max(1000).optional(),raizContextos:z.string().max(1000),manualAtivo:z.boolean().default(true),vinculos:z.array(vinculoSchema).max(3),relacoes:z.array(associacaoSchema.extend({id:z.string().uuid(),at:z.string().datetime(),estado:z.literal('VINCULADO'),origemRegistro:z.enum(['DECLARADO_PELO_USUARIO','REGISTRADO_PELO_PRUMO'])})).max(500),historico:z.array(evento).max(1000)}).strict();

export type Espaco=z.infer<typeof espacoSchema>;

export const registro=z.object({version:z.literal(1),espacos:z.array(espacoSchema).max(200)}).strict();

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

/**
 * Vínculos locais: apenas a lista de raízes que a pessoa escolheu abrir no aplicativo.
 * O contrato continua sendo o qa.project.json do projeto; nada dele é copiado para cá.
 */
export const arquivoSchema = z.object({ version: z.literal(1), projects: z.array(z.object({ root: z.string().min(1).max(1000), addedAt: z.string().datetime() }).strict()).max(200) }).strict();

export type Situacao = {
  root: string; state: 'INTEGRADO' | 'SEM_MANIFESTO' | 'MANIFESTO_INVALIDO' | 'PASTA_AUSENTE';
  id?: string; name?: string; capabilities?: string[]; readOnly?: boolean; message: string; instructions?: string;
};

export const instrucoesManifesto = 'Vincule a pasta pelo aplicativo: o Prumo detecta a stack, mostra o qa.project.json proposto e só cria o arquivo se você aprovar. Para escrever à mão: schemaVersion 2, context (documentation, tests, code), commands e execution.requireApproval=true. Contrato existente nunca é sobrescrito; veja Ajuda › Como vincular.';
