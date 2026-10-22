import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('o aviso do painel de atividades vazio tem largura própria: em % do contêiner vazio ele colapsava e o texto saía em letras verticais', () => {
  const css = fs.readFileSync('frontend/design-system/estilos-das-telas.parte.css', 'utf8');
  const regra = /\.pa-vazio\{[^}]*\}/.exec(css)?.[0] ?? '';
  assert.match(regra, /width:440px/);
  assert.doesNotMatch(regra, /width:min\(440px,80%\)/);
});

test('todo agente do projeto aparece no canvas pelo nome, clicar abre o fluxo dele, e o painel não repete título nem subtítulo da tela', () => {
  const painel = fs.readFileSync('frontend/design-system/painel-atividades.js', 'utf8');
  const tela = fs.readFileSync('frontend/agentes/tela-agentes.parte.js', 'utf8');
  assert.match(painel, /const faltam = \(d\.agentes \|\| \[\]\)\.filter/);
  assert.match(painel, /o\.abrirAgente\?\.\(/);
  assert.doesNotMatch(painel, /pa-elenco|desenharElenco|style: '--pa-cor/);
  assert.match(tela, /abrirAgente: \(ag, d\) =>/);
  assert.match(tela, /pediu a \{a\} que consultasse o projeto\./);
  assert.doesNotMatch(tela, /class: 'v36a-titulo' \}, tr\('Painel de atividades'\)/);
  assert.doesNotMatch(tela, /v36a-painel-intro/);
});
