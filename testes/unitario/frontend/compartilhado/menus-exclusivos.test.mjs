/** Menus flutuantes do topo e das telas: um só aberto por vez e o topo sempre acima dos botões da tela. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('abrir um menu fecha o outro: a escuta é na captura, porque cada gatilho para a propagação', () => {
  const nav = fs.readFileSync('frontend/compartilhado/navegacaoDaJanela.js', 'utf8');
  const corpo = nav.slice(nav.indexOf('function iniciarMenusExclusivos'), nav.indexOf('function iniciarAjustes'));
  assert.match(corpo, /addEventListener\('click'[\s\S]*\}, true\)/);
  assert.ok(corpo.includes('[aria-haspopup][aria-expanded="true"][aria-controls]') && corpo.includes('absolute|fixed') && corpo.includes('gatilho.click()'), 'só menus (aria-haspopup): o chat flutuante, que é diálogo, não fecha com clique fora do menu');
  assert.match(nav, /function iniciarAjustes\(\) \{\s*iniciarMenusExclusivos\(\);/);
});

test('o topo (conta e ajustes) fica acima do botão Criar de Testes', () => {
  const css = fs.readFileSync('frontend/design-system/ds.css', 'utf8');
  const topo = Number(/html body \.topo-direita \{ z-index: (\d+); \}/.exec(css)?.[1]);
  const criar = Number(/\.rep-criar \{ z-index: (\d+); \}/.exec(fs.readFileSync('frontend/design-system/estilos-das-telas.parte.css', 'utf8'))?.[1]);
  assert.ok(topo > criar, topo + ' > ' + criar);
});
