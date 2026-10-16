import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gravarInstaladorConferido, lerChecksumSeguro } from '../../../../site/baixar-instalador.mjs';

const pasta = t => { const p = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-site-stream-')); t.after(() => fs.rmSync(p, { recursive: true, force: true })); return p; };
const resposta = partes => new Response(new ReadableStream({ start(controlador) { for (const p of partes) controlador.enqueue(Buffer.from(p)); controlador.close(); } }));

test('site: grava em streaming, confere SHA-256 e só publica arquivo inteiro', async t => {
  const p = path.join(pasta(t), 'instalador.exe'); const dados = Buffer.from('conteudo sintetico do instalador');
  const hash = createHash('sha256').update(dados).digest('hex');
  assert.equal(await gravarInstaladorConferido(resposta([dados.subarray(0, 4), dados.subarray(4)]), p, hash, 1024), dados.length);
  assert.deepEqual(fs.readFileSync(p), dados);
  assert.equal(fs.readdirSync(path.dirname(p)).length, 1);
});

test('site: excesso de tamanho interrompe stream sem publicar ou manter temporario', async t => {
  const dir = pasta(t), p = path.join(dir, 'instalador.exe');
  await assert.rejects(() => gravarInstaladorConferido(resposta(['1234','5678']), p, '0'.repeat(64), 5), /maior que o limite/);
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('site: hash divergente nao substitui arquivo existente', async t => {
  const dir = pasta(t), p = path.join(dir, 'instalador.exe');
  fs.writeFileSync(p, 'versao anterior');
  await assert.rejects(() => gravarInstaladorConferido(resposta(['versao incorreta']), p, '0'.repeat(64)), /SHA-256/);
  assert.equal(fs.readFileSync(p, 'utf8'), 'versao anterior');
  assert.deepEqual(fs.readdirSync(dir), ['instalador.exe']);
});

test('site: checksum malicioso grande e content-length acima do teto sao recusados', async t => {
  await assert.rejects(() => lerChecksumSeguro(resposta(['12345','67890']), 6), /maior que o limite/);
  const dir = pasta(t), p = path.join(dir, 'setup.exe');
  const r = new Response('pequeno', { headers: { 'content-length': '10000' } });
  await assert.rejects(() => gravarInstaladorConferido(r, p, '0'.repeat(64), 100), /maior que o limite/);
  assert.deepEqual(fs.readdirSync(dir), []);
});
