// Garante a organização do backend: pasta por tela, controlador por lógica, funções públicas sem colisões
// e a primeira linha explicando em português o que o arquivo faz. Cada teste lista TODOS os arquivos com problema.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const raiz = 'backend';
const telas = ['inicio', 'projetos', 'tickets', 'testes', 'agendamentos', 'metricas', 'logs', 'conexoes', 'agentes', 'suporte', 'ajuda', 'configuracoes', 'atualizacoes', 'administracao', 'login', 'voz'];
const apoio = ['aplicativo', 'terminal', 'compartilhado'];
const entradas = ['aplicativo.ts', 'cli.ts', 'mcp.ts'];
// Tabela única de dados de propósito: o catálogo reúne todos os canais e ferramentas num só lugar.
const tabelas = ['backend/aplicativo/api/catalogoDeContratos.ts'];
const arquivos = fs.readdirSync(raiz, { recursive: true }).map(String)
  .filter((n) => n.endsWith('.ts') && !n.split(/[\\/]/).includes('node_modules'))
  .map((n) => path.join(raiz, n).split(path.sep).join('/')).sort();
const ehEntrada = (a) => entradas.includes(path.relative(raiz, a));

function declaracoes(arquivo) {
  const sf = ts.createSourceFile(arquivo, fs.readFileSync(arquivo, 'utf8'), ts.ScriptTarget.ES2022, true);
  const lista = [];
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) continue;
    const exportado = !!(ts.getCombinedModifierFlags(st) & ts.ModifierFlags.Export);
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        const i = d.initializer;
        lista.push({ nome: d.name.getText(sf), exportado, funcao: !!i && (ts.isArrowFunction(i) || ts.isFunctionExpression(i)) });
      }
    } else if (ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) lista.push({ nome: st.name?.text, exportado, funcao: true });
    else if (ts.isTypeAliasDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isEnumDeclaration(st)) lista.push({ nome: st.name.text, exportado, tipo: true });
    else lista.push({ nome: '(instrução)', exportado: false, instrucao: true });
  }
  return lista;
}

test('backend: só pastas de tela, de apoio e as três portas de entrada na raiz', () => {
  const problemas = [];
  for (const item of fs.readdirSync(raiz)) {
    if (item.endsWith('.ts')) { if (!entradas.includes(item)) problemas.push(`arquivo solto em backend/: ${item}`); }
    else if (!item.endsWith('.md') && ![...telas, ...apoio].includes(item)) problemas.push(`pasta desconhecida em backend/: ${item}`);
  }
  assert.deepEqual(problemas, []);
});

test('backend: todo arquivo começa com uma frase em português dizendo o que faz', () => {
  const problemas = [];
  for (const a of arquivos) {
    const linhas = fs.readFileSync(a, 'utf8').split(/\r?\n/);
    const primeira = (linhas[0].startsWith('#!') ? linhas[1] : linhas[0]) ?? '';
    if (!/^\/\*\* \S.{10,}\S \*\/$/.test(primeira)) problemas.push(`${a}: a primeira linha precisa ser /** descrição */`);
    else if (/PENDENTE/.test(primeira)) problemas.push(`${a}: descrição pendente`);
  }
  assert.deepEqual(problemas, []);
});

test('backend: controladores agrupam canais por lógica e mantêm funções públicas explícitas', () => {
  const problemas = [];
  for (const a of arquivos) {
    if (tabelas.includes(a) || a.includes('/tipos/')) continue;
    const d = declaracoes(a);
    if (ehEntrada(a)) {
      if (d.some((x) => x.exportado)) problemas.push(`${a}: porta de entrada não exporta nada`);
      continue;
    }
    const base = path.basename(a, '.ts');
    const exportadas = d.filter((x) => x.exportado);
    const instr = d.filter((x) => x.instrucao);
    if (instr.length) problemas.push(`${a}: instruções executáveis soltas fora de funções (${instr.map((x) => x.nome).join(', ')})`);
    if (!exportadas.length) problemas.push(`${a}: precisa exportar ao menos uma função, classe ou declaração nomeada`);
    const ehApi = a.includes('/api/');
    if (ehApi && exportadas.length !== 1) problemas.push(`${a}: API deve ter exatamente uma declaração exportada`);
    if (!/^(controlador|servico|repositorio|contratos)/.test(base) && (ehApi || exportadas.length === 1) && exportadas[0]?.nome !== base) {
      problemas.push(`${a}: a única exportação deve ter o nome do arquivo (${exportadas[0]?.nome ?? 'nenhuma'})`);
    }
    if (ehApi && d.some((x) => !x.exportado)) problemas.push(`${a}: canal IPC não pode ter declarações internas ocultas; delegue às regras`);
  }
  assert.deepEqual(problemas, []);
});

test('backend: pastas tipos/ só têm formatos, listas e constantes (nenhuma função)', () => {
  const problemas = [];
  for (const a of arquivos.filter((x) => x.includes('/tipos/'))) for (const d of declaracoes(a)) if (d.funcao || d.instrucao) problemas.push(`${a}: ${d.nome} é função ou instrução; mova para regras/ ou banco/`);
  assert.deepEqual(problemas, []);
});

test('backend: cada função pública tem nome único, mesmo quando várias ficam no mesmo arquivo', () => {
  const problemas = []; const vistos = new Map();
  for (const a of arquivos.filter((x) => !x.includes('/tipos/') && !ehEntrada(x))) {
    for (const item of declaracoes(a).filter((x) => x.exportado && x.funcao)) {
      const nome = item.nome;
      if (!nome) continue;
      if (vistos.has(nome)) problemas.push(`nome repetido: ${nome} em ${vistos.get(nome)} e ${a}`);
      else vistos.set(nome, a);
    }
  }
  assert.deepEqual(problemas, []);
});

test('backend: cada canal IPC registrado possui controlador e contrato oficial', async () => {
  const { esquemasIpc } = await import('../../../../dist/aplicativo/api/catalogoDeContratos.js');
  const registro = fs.readFileSync('backend/aplicativo/api/registrarCanaisIpc.ts', 'utf8');
  const canais = [...registro.matchAll(/registrarCanal\('([a-z]+:[a-z]+)',\s*([A-Za-z][A-Za-z0-9_]*)\)/g)];
  const controladores = arquivos.filter(a => /\/controlador[^/]*\.ts$/.test(a));
  const funcoes = new Set(controladores.flatMap(a => declaracoes(a).filter(d => d.exportado).map(d => d.nome)));
  const problemas = []; const usados = new Set();
  for (const [, canal, nome] of canais) {
    if (usados.has(canal)) problemas.push('canal repetido: ' + canal);
    usados.add(canal);
    if (!funcoes.has(nome)) problemas.push('sem controlador: ' + canal + ' -> ' + nome);
    if (!(canal in esquemasIpc)) problemas.push('sem contrato IPC: ' + canal);
  }
  for (const canal of Object.keys(esquemasIpc)) if (!usados.has(canal)) problemas.push('sem registro: ' + canal);
  assert.deepEqual(problemas, []);
});

test('backend: Documentação Viva corresponde ao catálogo de telas e canais IPC', async () => {
  const { telas, papeis, gerarArquivosDosCanais } = await import('../../../../docs/geradores/catalogo-documentacao-viva.mjs');
  const problemas = [];
  for (const nome of fs.readdirSync('backend', { withFileTypes: true }).filter(f=>f.isDirectory()).map(f=>f.name)) {
    if (!telas[nome]) problemas.push('sem descrição na Documentação Viva: backend/'+nome);
  }
  for (const [papel, descricao] of Object.entries(papeis)) {
    if (!descricao || descricao.includes('(sem explicação)')) problemas.push('papel sem explicação: '+papel);
  }
  const arquivo='backend/aplicativo/api/arquivosDosCanais.ts';
  if(fs.readFileSync(arquivo,'utf8').replaceAll('\r','')!==gerarArquivosDosCanais().replaceAll('\r',''))
    problemas.push('catálogo de canais IPC desatualizado');
  const fonte=fs.readdirSync('backend', {recursive:true}).map(String).filter(n=>/(^|[\/])(LEIA-ME|README)[^\/]*\.md$/i.test(n)&&!n.split(/[\/]/).includes('node_modules'));
  problemas.push(...fonte.map(n=>'documentação duplicada em backend: '+n));
  assert.deepEqual(problemas, []);
});

test('backend: o worker não importa a interface; o aplicativo conecta os avisos', () => {
  const worker = fs.readFileSync('backend/agendamentos/worker/workerDoAplicativo.ts', 'utf8');
  const entrada = fs.readFileSync('backend/aplicativo.ts', 'utf8');
  assert.doesNotMatch(worker, /from\s+['"][^'"]*\/aplicativo\//, 'worker não deve depender da janela ou bandeja');
  assert.match(worker, /export function conectarAvisosDoWorker\(/);
  assert.match(entrada, /conectarAvisosDoWorker\(publicarEventoDoWorker\)/);
});

test('backend: nenhuma dependência circular entre arquivos TypeScript próprios', () => {
  const conhecidos = new Set(arquivos);
  const dependencias = new Map();
  for (const arquivo of arquivos) {
    const fonte = ts.createSourceFile(arquivo, fs.readFileSync(arquivo, 'utf8'), ts.ScriptTarget.ES2022, true);
    const importados = [];
    for (const item of fonte.statements) {
      if (!ts.isImportDeclaration(item) || !ts.isStringLiteral(item.moduleSpecifier)) continue;
      const endereco = item.moduleSpecifier.text;
      if (!endereco.startsWith('.')) continue;
      const destino = path.posix.normalize(path.posix.join(path.posix.dirname(arquivo), endereco.replace(/\.js$/, '.ts')));
      if (conhecidos.has(destino)) importados.push(destino);
    }
    dependencias.set(arquivo, importados);
  }

  const vistos = new Set();
  const visitando = new Set();
  const caminho = [];
  const ciclos = [];
  function visitar(arquivo) {
    if (visitando.has(arquivo)) {
      ciclos.push([...caminho.slice(caminho.indexOf(arquivo)), arquivo].join(' -> '));
      return;
    }
    if (vistos.has(arquivo)) return;
    vistos.add(arquivo);
    visitando.add(arquivo);
    caminho.push(arquivo);
    for (const dependente of dependencias.get(arquivo) || []) visitar(dependente);
    caminho.pop();
    visitando.delete(arquivo);
  }
  for (const arquivo of arquivos) visitar(arquivo);
  assert.deepEqual(ciclos, []);
});
