/** IDE: ideias trazidas do VS Code e do JetBrains (margem do Git, aba em pré-visualização, quick open com prefixos, modo foco e atalhos). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const fonte = fs.readFileSync('frontend/testes/ide-workbench.parte.js', 'utf8');
const janela = {}; vm.runInNewContext(fonte, { window: janela, tr: (x) => x });
const trechosDoDiff = (d) => JSON.parse(JSON.stringify(janela.PrumoIde.trechosDoDiff(d))); // sai do contexto isolado para o deepEqual comparar

test('a margem do Git separa linhas novas, alteradas e removidas pelo diff unificado', () => {
  const diff = ['diff --git a/a.ts b/a.ts', '--- a/a.ts', '+++ b/a.ts', '@@ -1,6 +1,8 @@', ' um', '+novo 2', '+novo 3', ' quatro', '-velho 5', '+mudou 5', ' seis', '-removida', ' sete'].join('\n');
  assert.deepEqual(trechosDoDiff(diff), [{ de: 2, ate: 3, tipo: 'add' }, { de: 5, ate: 5, tipo: 'mod' }, { de: 7, ate: 7, tipo: 'del' }]);
  assert.deepEqual(trechosDoDiff(''), []);
  assert.deepEqual(trechosDoDiff('@@ -0,0 +1,2 @@\n+a\n+b\n'), [{ de: 1, ate: 2, tipo: 'add' }]);
  assert.deepEqual(trechosDoDiff('@@ -3,2 +3,0 @@\n-x\n-y\n'), [{ de: 3, ate: 3, tipo: 'del' }]);
});

test('aba em pré-visualização: clique no explorador troca a aba, duplo clique e edição fixam, quick open sempre fixa', () => {
  assert.ok(fonte.includes("(a) => void abrir(a, undefined, true), undefined, (a) => void abrir(a)"), 'duplo clique abre fixando');
  assert.ok(fonte.includes('const abrindo = new Map();'), 'abrir duas vezes ao mesmo tempo devolve a mesma aba');
  assert.ok(fonte.includes('if (m.sujo) aba.previa = false;'));
  assert.ok(fonte.includes("if (!previa) existente.previa = false;"));
  assert.ok(fonte.includes("ondblclick: () => fixar(a)"));
  assert.match(fs.readFileSync('frontend/design-system/ds.css', 'utf8'), /\.ds-wb-aba\[data-previa="true"\] \.ds-wb-aba-titulo span \{ font-style: italic; \}/);
});

test('o quick open entende > (comandos), : (linha) e @ (símbolos), e o menu da aba tem fechar, fechar outras, fechar todas e copiar caminho', () => {
  for (const trecho of ["{ '>': 'comando', ':': 'linha', '@': 'simbolo' }", "comandoDoEditor('simbolos')", "'editor.action.quickOutline'"]) assert.ok(fonte.includes(trecho) || fs.readFileSync('frontend/editor-de-codigo/editor.js', 'utf8').includes(trecho), trecho);
  for (const rotulo of ['Fechar as outras', 'Fechar todas', 'Fixar aba', 'Copiar caminho']) assert.ok(fonte.includes("tr('" + rotulo + "')"), rotulo);
});

test('modo foco (Ctrl+K Z, Esc duas vezes), atalhos e Orquestrador no menu do editor', () => {
  for (const trecho of ['function alternarZen(', 'function escDoZen()', 'acordeK', 'function mostrarAtalhos()', "tr('Modo foco (Zen)')"]) assert.ok(fonte.includes(trecho), trecho);
  assert.match(fs.readFileSync('frontend/design-system/ds.css', 'utf8'), /\.ds-ide\.ds-wb\[data-zen="sim"\] \{ position: fixed; inset: 0;/);
  assert.ok(fonte.includes('document.addEventListener(\'keydown\', aoTeclarNaIde)'), 'atalhos valem com nada focado');
  const editor = fs.readFileSync('frontend/editor-de-codigo/editor.js', 'utf8');
  for (const trecho of ["chave: 'Esc'", "id: 'prumo.orquestrador'", "t: 'orquestrador'", 'deltaDecorations', "'git-' + x.tipo"]) assert.ok(editor.includes(trecho), trecho);
  assert.ok(fs.readFileSync('frontend/editor-de-codigo/editor.html', 'utf8').includes('.git-add'));
});
