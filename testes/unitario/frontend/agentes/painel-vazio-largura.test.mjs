import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('o aviso do painel de atividades vazio tem largura própria: em % do contêiner vazio ele colapsava e o texto saía em letras verticais', () => {
  const css = fs.readFileSync('frontend/design-system/estilos-das-telas.parte.css', 'utf8');
  const regra = /\.pa-vazio\{[^}]*\}/.exec(css)?.[0] ?? '';
  assert.match(regra, /width:440px/);
  assert.doesNotMatch(regra, /width:min\(440px,80%\)/);
});
