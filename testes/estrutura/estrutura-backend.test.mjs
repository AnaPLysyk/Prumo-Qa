// Garante a organização do backend: pasta por tela, uma função por arquivo, nome do arquivo = nome da função
// e a primeira linha explicando em português o que o arquivo faz. Cada teste lista TODOS os arquivos com problema.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const raiz = 'backend';
const telas = ['inicio', 'projetos', 'contextos', 'tickets', 'testes', 'agendamentos', 'execucoes', 'evidencias', 'rastreabilidade', 'metricas', 'historico', 'logs', 'conexoes', 'agentes', 'suporte', 'ajuda', 'configuracoes', 'atualizacoes', 'administracao'];
const apoio = ['aplicativo', 'terminal', 'compartilhado'];
const entradas = ['aplicativo.ts', 'cli.ts', 'mcp.ts'];
// Tabela única de dados de propósito: o catálogo reúne todos os canais e ferramentas num só lugar.
const tabelas = ['backend/aplicativo/api/catalogoDeContratos.ts'];
const arquivos = fs.readdirSync(raiz, { recursive: true }).map(String).filter((n) => n.endsWith('.ts')).map((n) => path.join(raiz, n).split(path.sep).join('/')).sort();
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

test('backend: uma função por arquivo, com o nome do arquivo, sem auxiliares escondidas', () => {
  const problemas = [];
  for (const a of arquivos) {
    if (tabelas.includes(a) || a.includes('/tipos/')) continue;
    const d = declaracoes(a);
    if (ehEntrada(a)) { if (d.some((x) => x.exportado)) problemas.push(`${a}: porta de entrada não exporta nada`); continue; }
    const base = path.basename(a, '.ts');
    const exportadas = d.filter((x) => x.exportado);
    if (exportadas.length !== 1) problemas.push(`${a}: deve ter exatamente uma declaração exportada (tem: ${exportadas.map((x) => x.nome).join(', ') || 'nenhuma'})`);
    else if (exportadas[0].nome !== base) problemas.push(`${a}: o nome do arquivo deve ser o da declaração (${exportadas[0].nome})`);
    const escondidas = d.filter((x) => !x.exportado);
    if (escondidas.length) problemas.push(`${a}: declarações não exportadas devem ir para arquivo próprio (${escondidas.map((x) => x.nome).join(', ')})`);
  }
  assert.deepEqual(problemas, []);
});

test('backend: pastas tipos/ só têm formatos, listas e constantes (nenhuma função)', () => {
  const problemas = [];
  for (const a of arquivos.filter((x) => x.includes('/tipos/'))) for (const d of declaracoes(a)) if (d.funcao || d.instrucao) problemas.push(`${a}: ${d.nome} é função ou instrução; mova para regras/ ou banco/`);
  assert.deepEqual(problemas, []);
});

test('backend: cada função tem nome único (procurar pelo nome leva a um só arquivo)', () => {
  const problemas = []; const vistos = new Map();
  for (const a of arquivos.filter((x) => !x.includes('/tipos/') && !ehEntrada(x))) {
    const n = path.basename(a, '.ts');
    if (vistos.has(n)) problemas.push(`nome repetido: ${n} em ${vistos.get(n)} e ${a}`); else vistos.set(n, a);
  }
  assert.deepEqual(problemas, []);
});

test('backend: cada canal da janela (IPC) é atendido por um arquivo api/ com o nome do canal', async () => {
  const { esquemasIpc } = await import('../../dist/aplicativo/api/catalogoDeContratos.js');
  const nomeDoArquivo = (c) => { const [p, acao] = c.split(':'); return p + acao[0].toUpperCase() + acao.slice(1).replace('politica', 'Politica'); };
  const apis = new Set(arquivos.filter((a) => a.includes('/api/')).map((a) => path.basename(a, '.ts')));
  const problemas = Object.keys(esquemasIpc).filter((c) => !apis.has(nomeDoArquivo(c))).map((c) => `canal ${c} sem arquivo ${nomeDoArquivo(c)}.ts numa pasta api/`);
  assert.deepEqual(problemas, []);
});

test('backend: o LEIA-ME de cada tela está igual ao código (rode npm run leia-me)', async () => {
  const { gerarLeiaMe } = await import('../../scripts/gerar-leia-me-backend.mjs');
  const problemas = [];
  for (const [arq, texto] of gerarLeiaMe()) {
    if (texto.includes('(sem explicação)')) problemas.push(`${arq}: pasta sem explicação em scripts/gerar-leia-me-backend.mjs`);
    if (!fs.existsSync(arq) || fs.readFileSync(arq, 'utf8').split('\r').join('') !== texto) problemas.push(`${arq}: desatualizado`);
  }
  assert.deepEqual(problemas, []);
});
