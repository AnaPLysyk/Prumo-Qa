import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { esquemasIpc } from '../../../../dist/aplicativo/api/catalogoDeContratos.js';

test('voz:transcrever aceita só fala de 0,1 s a 60 s em 16 kHz e idioma conhecido', () => {
  const contrato = esquemasIpc['voz:transcrever'];
  assert.equal(contrato.safeParse({ audio: new Float32Array(16000), idioma: 'pt' }).success, true);
  assert.equal(contrato.safeParse({ audio: new Float32Array(100), idioma: 'pt' }).success, false);
  assert.equal(contrato.safeParse({ audio: new Float32Array(16000 * 61), idioma: 'pt' }).success, false);
  assert.equal(contrato.safeParse({ audio: new Float32Array(16000), idioma: 'fr' }).success, false);
  assert.equal(contrato.safeParse({ audio: [0, 0], idioma: 'pt' }).success, false);
});

test('a janela libera só o microfone, para a própria página, e o preload expõe os três canais da voz', () => {
  const janela = fs.readFileSync('backend/aplicativo/janela/controleDaJanela.ts', 'utf8');
  assert.match(janela, /permissao === 'media' && microfoneDoPrumo/);
  assert.match(janela, /every\(t => t === 'audio'\)/);
  const preload = fs.readFileSync('backend/aplicativo/preload.cjs', 'utf8');
  for (const canal of ['voz:estado', 'voz:preparar', 'voz:transcrever']) assert.ok(preload.includes(`'${canal}'`), canal);
});
