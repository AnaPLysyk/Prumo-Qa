/** Formato do contrato proposto e as regras que reconhecem tecnologias, pastas e scripts numa pasta nova. */
import { Manifesto } from '../../compartilhado/tipos/projeto.js';

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
