/** IDE do repositório: testes unitários de limites, concorrência e preservação de arquivos. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { arvoreDoRepositorio, lerArquivoDoRepositorio, gravarArquivoDoRepositorio } from '../../../../dist/projetos/ideRepositorio.js';

const ambiente = (t) => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-ide-unit-'));
  t.after(() => fs.rmSync(pasta, { recursive: true, force: true }));
  return pasta;
};

test('explora pastas de código e pastas vazias sem depender de extensão de teste', t => {
  const raiz = ambiente(t);
  fs.mkdirSync(path.join(raiz, 'src', 'components'), { recursive: true });
  fs.mkdirSync(path.join(raiz, '.github', 'workflows'), { recursive: true });
  fs.mkdirSync(path.join(raiz, 'node_modules'), { recursive: true });
  fs.mkdirSync(path.join(raiz, '.git'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'src', 'app.ts'), 'export const x = 1;\n');
  fs.writeFileSync(path.join(raiz, '.github', 'workflows', 'ci.yml'), 'name: CI\n');
  fs.writeFileSync(path.join(raiz, 'node_modules', 'irrelevante.js'), 'x');
  fs.writeFileSync(path.join(raiz, '.git', 'config'), 'x');
  fs.writeFileSync(path.join(raiz, '.env'), 'token=segredo123');
  const r = arvoreDoRepositorio(raiz);
  const linhas = JSON.stringify(r.arvore);
  assert.match(linhas, /src\/app\.ts/);
  assert.match(linhas, /src\/components/);
  assert.match(linhas, /\.github\/workflows\/ci\.yml/);
  assert.doesNotMatch(linhas, /node_modules|irrelevante|\.git\/config|\.env/);
  assert.equal(r.truncado, false);
});

test('lê e salva arquivos gerais do repositório sem exigir nome de teste', t => {
  const raiz = ambiente(t);
  fs.mkdirSync(path.join(raiz, 'src'));
  fs.writeFileSync(path.join(raiz, 'src', 'styles.css'), 'body {\r\n  color: red;\r\n}\r\n');
  const r = lerArquivoDoRepositorio(raiz, 'src/styles.css');
  assert.equal(r.editavel, true);
  assert.equal(r.linhas, 4);
  const s = gravarArquivoDoRepositorio(raiz, 'src/styles.css', 'body {\n  color: blue;\n}\n', r.hash);
  assert.equal(s.criado, false);
  assert.match(fs.readFileSync(path.join(raiz, 'src', 'styles.css'), 'utf8'), /color: blue;\r\n/);
});

test('cria novos arquivos de texto e diretórios internos com segurança', t => {
  const raiz = ambiente(t);
  const s = gravarArquivoDoRepositorio(raiz, 'src/paginas/inicio.ts', 'export {};\n', null);
  assert.equal(s.criado, true);
  assert.equal(lerArquivoDoRepositorio(raiz, 'src/paginas/inicio.ts').conteudo, 'export {};\n');
});

test('impede sobrescrita de mudanças externas, arquivo duplicado e escrita sem hash', t => {
  const raiz = ambiente(t);
  fs.writeFileSync(path.join(raiz, 'main.js'), 'antes');
  const r = lerArquivoDoRepositorio(raiz, 'main.js');
  fs.writeFileSync(path.join(raiz, 'main.js'), 'alterado fora da IDE');
  assert.throws(() => gravarArquivoDoRepositorio(raiz, 'main.js', 'depois', r.hash), /IDE_ARQUIVO_ALTERADO/);
  assert.throws(() => gravarArquivoDoRepositorio(raiz, 'main.js', 'depois', null), /IDE_ARQUIVO_EXISTENTE/);
});

test('bloqueia traversal, pastas internas do Git e nomes de credenciais', t => {
  const raiz = ambiente(t);
  const fora = path.join(raiz, '..', 'nao-gravar.txt');
  for (const nome of ['../nao-gravar.txt', '/absoluto.txt', '.git/config', 'node_modules/hack.js', '.env', 'secrets.json', 'src/../../escape.js', 'src/arquivo.js:oculto', 'CON.txt', 'nome.']) {
    assert.throws(() => gravarArquivoDoRepositorio(raiz, nome, 'x', null), /IDE_CAMINHO_INVALIDO/);
  }
  assert.equal(fs.existsSync(fora), false);
});

test('não abre binários e impede editar textos mascarados com segredos', t => {
  const raiz = ambiente(t);
  fs.writeFileSync(path.join(raiz, 'imagem.png'), Buffer.from([0, 1, 2, 3]));
  assert.throws(() => lerArquivoDoRepositorio(raiz, 'imagem.png'), /IDE_ARQUIVO_BINARIO/);
  fs.writeFileSync(path.join(raiz, 'settings.txt'), 'token=segredo123');
  const r = lerArquivoDoRepositorio(raiz, 'settings.txt');
  assert.equal(r.editavel, false);
  assert.match(r.conteudo, /REDACTED/);
  assert.throws(() => gravarArquivoDoRepositorio(raiz, 'settings.txt', 'novo', r.hash), /IDE_SEGREDO_PROTEGIDO/);
});

test('o front-end liga Código à árvore completa e CI/CD às fontes local e GitHub', () => {
  const fonte = fs.readFileSync('frontend/testes/tela-testes.parte.js', 'utf8');
  const preload = fs.readFileSync('backend/aplicativo/preload.cjs', 'utf8');
  assert.match(fonte, /api\.ideArvore\(e\.id\)/);
  assert.match(fonte, /api\.ideArquivo\(e\.id, arquivo\)/);
  assert.match(fonte, /api\.ideGravar\(id, rel, conteudo, base\)/);
  assert.match(fonte, /pipelinesDoGithub\(/);
  assert.match(fonte, /'github', 'arquivos', \{\}, '\.github\/workflows'/);
  for (const metodo of ['ideArvore', 'ideArquivo', 'ideGravar']) assert.match(preload, new RegExp(metodo + ':'));
});
