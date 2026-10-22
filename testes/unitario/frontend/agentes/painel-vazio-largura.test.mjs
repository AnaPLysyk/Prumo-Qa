import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('o aviso do painel de atividades vazio tem largura própria: em % do contêiner vazio ele colapsava e o texto saía em letras verticais', () => {
  const css = fs.readFileSync('frontend/design-system/estilos-das-telas.parte.css', 'utf8');
  const regra = /\.pa-vazio\{[^}]*\}/.exec(css)?.[0] ?? '';
  assert.match(regra, /width:440px/);
  assert.doesNotMatch(regra, /width:min\(440px,80%\)/);
});

test('o painel lista todos os agentes pelo nome e clicar abre o fluxo do agente; a cor vai por propriedade, não por style inline (a CSP bloqueia)', () => {
  const painel = fs.readFileSync('frontend/design-system/painel-atividades.js', 'utf8');
  const tela = fs.readFileSync('frontend/agentes/tela-agentes.parte.js', 'utf8');
  assert.match(painel, /\(d\.agentes \|\| \[\]\)\.map\(\(ag, i\)/);
  assert.match(painel, /o\.abrirAgente\?\.\(ag, \{ \.\.\.d, ativos \}\)/);
  assert.match(painel, /style\.setProperty\('--pa-cor'/);
  assert.doesNotMatch(painel, /style: '--pa-cor/);
  assert.match(tela, /abrirAgente: \(ag, d\) =>/);
  assert.match(tela, /pediu a \{a\} que consultasse o projeto\./);
});
