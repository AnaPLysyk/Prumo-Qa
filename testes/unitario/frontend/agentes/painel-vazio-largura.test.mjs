import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('o aviso do painel de atividades vazio tem largura própria: em % do contêiner vazio ele colapsava e o texto saía em letras verticais', () => {
  const css = fs.readFileSync('frontend/design-system/estilos-das-telas.parte.css', 'utf8');
  const regra = /\.pa-vazio\{[^}]*\}/.exec(css)?.[0] ?? '';
  assert.match(regra, /width:440px/);
  assert.doesNotMatch(regra, /width:min\(440px,80%\)/);
});

test('o painel não repete título nem subtítulo da tela, e agentes ativos abrem o fluxo ao clicar', () => {
  const painel = fs.readFileSync('frontend/design-system/painel-atividades.js', 'utf8');
  const tela = fs.readFileSync('frontend/agentes/tela-agentes.parte.js', 'utf8');
  assert.match(painel, /o\.abrirAgente\?\.\(/);
  assert.doesNotMatch(painel, /pa-elenco|desenharElenco|style: '--pa-cor|const faltam/);
  assert.match(tela, /abrirAgente: \(ag, d\) =>/);
  assert.doesNotMatch(tela, /class: 'v36a-titulo' \}, tr\('Painel de atividades'\)/);
  assert.doesNotMatch(tela, /v36a-painel-intro/);
});
