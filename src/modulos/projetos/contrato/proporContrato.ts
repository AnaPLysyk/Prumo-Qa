/** Detecta tecnologias da pasta e propõe um qa.project.json seguro, sem gravar arquivos. */
import fs from 'node:fs';
import path from 'node:path';
import { manifestoSchema, sensivel, type Manifesto } from '../../../projeto.js';

/**
 * 2.10.2: pasta sem qa.project.json. Detecta a stack só pelos arquivos da raiz (sem recursão, sem executar nada, sem
 * seguir links) e monta um contrato v2 conservador para a pessoa aprovar. Comandos só para npm, com scripts que existem
 * no package.json; as demais stacks ficam somente leitura até o executor aceitá-las. Nada é gravado aqui sem aprovação:
 * gravarContratoProposto é chamado pelo aplicativo depois da confirmação nativa.
 */
export type Stack = { id: string; nome: string; evidencias: string[]; comandoNativo: string; executavelPeloPrumo: boolean };
export type PropostaContrato = { raiz: string; manifesto: Manifesto; stacks: Stack[]; observacoes: string[] };

const STACKS: { id: string; nome: string; arquivos: RegExp; comando: string; executavel: boolean }[] = [
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
const DOCUMENTACAO = /^(docs?|documentation|wiki|readme(\.\w+)?|agents\.md|claude\.md|contributing\.md|changelog\.md)$/i;
const TESTES = /^(tests?|testes|__tests__|specs?|e2e|cypress|playwright|integration|qa)$/i;
const CODIGO = /^(src|app|apps|lib|libs|pkg|cmd|internal|packages|server|client|api|web|frontend|backend|scripts|main)$/i;
const SCRIPT = /^(test|tests|build|lint|typecheck|type-check|check|e2e)([:_-][\w:-]*)?$/i;
const EXIGE_REVISAO = /e2e|integration|deploy|release|publish|migrat|seed|db/i;

const idDe = (s: string) => { const b = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 76); return /^[a-z]/.test(b) ? b : 'p-' + (b || 'projeto'); };

/** Lê só a raiz da pasta escolhida. Links, itens sensíveis e pastas geradas (node_modules, dist…) ficam de fora. */
function entradasRaiz(raiz: string) {
  return fs.readdirSync(raiz, { withFileTypes: true }).filter((d) => !d.isSymbolicLink() && !sensivel(d.name)).map((d) => ({ nome: d.name, pasta: d.isDirectory() }));
}

export function proporContrato(raizInformada: string): PropostaContrato {
  const raiz = fs.realpathSync(raizInformada);
  if (fs.existsSync(path.join(raiz, 'qa.project.json'))) throw new Error('CONTRACT_EXISTS: a pasta já tem qa.project.json; o Prumo não sobrescreve o contrato.');
  const itens = entradasRaiz(raiz).sort((a, b) => a.nome.localeCompare(b.nome));
  const stacks: Stack[] = STACKS.map((s) => ({ s, ev: itens.filter((i) => !i.pasta && s.arquivos.test(i.nome)).map((i) => i.nome) })).filter((x) => x.ev.length)
    .map(({ s, ev }) => ({ id: s.id, nome: s.nome, evidencias: ev.slice(0, 5), comandoNativo: s.comando, executavelPeloPrumo: s.executavel }));
  const pastaOuArquivo = (re: RegExp) => itens.filter((i) => re.test(i.nome)).map((i) => i.nome).slice(0, 50);
  const documentation = pastaOuArquivo(DOCUMENTACAO);
  const tests = itens.filter((i) => i.pasta && TESTES.test(i.nome)).map((i) => i.nome);
  // Maven/Gradle guardam testes em src/test: entra como testes quando existe de fato.
  if (fs.existsSync(path.join(raiz, 'src', 'test')) && !fs.lstatSync(path.join(raiz, 'src', 'test')).isSymbolicLink() && fs.statSync(path.join(raiz, 'src', 'test')).isDirectory()) tests.push('src/test');
  const code = [...itens.filter((i) => i.pasta && CODIGO.test(i.nome)).map((i) => i.nome), ...stacks.flatMap((s) => s.evidencias)].filter((v, i, a) => a.indexOf(v) === i).slice(0, 50);
  const observacoes: string[] = [];
  let nome = path.basename(raiz); const commands: Manifesto['commands'] = {}; const bloqueados: string[] = [];
  if (stacks.some((s) => s.id === 'node')) {
    let pkg: { name?: unknown; scripts?: Record<string, unknown> } = {};
    try { const st = fs.statSync(path.join(raiz, 'package.json')); if (st.size <= 262144) pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8')); } catch { observacoes.push('package.json ilegível: nenhum comando proposto.'); }
    if (typeof pkg.name === 'string' && pkg.name.trim()) nome = pkg.name.trim().slice(0, 200);
    for (const [script, valor] of Object.entries(pkg.scripts ?? {})) {
      if (typeof valor !== 'string' || !SCRIPT.test(script) || !/^[\w:-]+$/.test(script) || Object.keys(commands).length >= 10) continue;
      const cap = idDe(script); if (commands[cap]) continue;
      commands[cap] = { executable: 'npm', args: ['run', script], cwd: '.', env: {}, requiredFiles: [], requiredEnv: [] };
      if (EXIGE_REVISAO.test(script)) bloqueados.push(cap);
    }
    if (!Object.keys(commands).length) observacoes.push('Nenhum script de teste, build ou lint no package.json: o contrato fica somente leitura.');
    if (bloqueados.length) observacoes.push(`Bloqueados até revisão (podem tocar banco, servidor ou publicar): ${bloqueados.join(', ')}.`);
  }
  for (const s of stacks.filter((x) => !x.executavelPeloPrumo)) observacoes.push(`${s.nome}: o Prumo lê o código e os testes; executar "${s.comandoNativo}" pelo Prumo ainda não é suportado (planejado para a 2.11).`);
  if (!stacks.length) observacoes.push('Nenhuma stack conhecida na raiz: o contrato fica somente leitura, com as pastas encontradas.');
  if (!tests.length) observacoes.push('Nenhuma pasta de testes encontrada na raiz.');
  const somenteLeitura = !Object.keys(commands).length;
  const manifesto = manifestoSchema.parse({
    schemaVersion: 2, id: idDe(nome.replace(/^@[^/]+\//, '')), name: nome,
    context: { documentation, tests: tests.slice(0, 50), code },
    commands,
    execution: { requireApproval: true, blockedByDefault: bloqueados, environment: 'host', readOnly: somenteLeitura, envAllowlist: [], timeoutMs: 300000, maxOutputBytes: 1048576 }
  });
  return { raiz, manifesto, stacks, observacoes };
}

