// Unidade: validade, uso único, tentativas e espera entre códigos, com envio falso injetado.
// O teste HTTP do cliente de envio fica no Prumo QA Lab, sem acesso a serviços externos.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { conferirCodigo, esquecerCodigos, pedirCodigo } from '../../../../dist/login/regras/codigosPorEmail.js';
import { encerrarSessao } from '../../../../dist/login/regras/sessao.js';

const pasta = (t) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-codigos-')); t.after(() => { encerrarSessao(); esquecerCodigos(); fs.rmSync(d, { recursive: true, force: true }); }); return d; };
const caixa = () => { const enviados = []; return { enviados, enviar: async (p) => { enviados.push(p); } }; };
const T0 = Date.parse('2026-10-16T12:00:00Z');

test('pedir: código de 6 dígitos, e-mail em minúsculas, idioma repassado; outro pedido só depois de 60 segundos', async (t) => {
  const b = pasta(t); const c = caixa();
  const r = await pedirCodigo({ email: ' Bia@Exemplo.com ', finalidade: 'CADASTRO', idioma: 'en' }, b, c.enviar, T0);
  assert.deepEqual(r, { email: 'bia@exemplo.com', minutosDeValidade: 10, segundosParaReenviar: 60 });
  assert.equal(c.enviados.length, 1); assert.match(c.enviados[0].codigo, /^\d{6}$/); assert.equal(c.enviados[0].idioma, 'en'); assert.equal(c.enviados[0].email, 'bia@exemplo.com');
  await assert.rejects(pedirCodigo({ email: 'bia@exemplo.com', finalidade: 'CADASTRO' }, b, c.enviar, T0 + 30_000), /^Error: EMAIL_WAIT: espere 30 segundos/);
  await pedirCodigo({ email: 'bia@exemplo.com', finalidade: 'CADASTRO' }, b, c.enviar, T0 + 60_000);
  assert.equal(c.enviados.length, 2);
  assert.throws(() => conferirCodigo('CADASTRO', 'bia@exemplo.com', c.enviados[0].codigo === c.enviados[1].codigo ? 'x' : c.enviados[0].codigo, T0 + 61_000), /CODE_INVALID/, 'o código anterior deixa de valer');
  await assert.rejects(pedirCodigo({ email: 'sem-arroba', finalidade: 'CADASTRO' }, b, c.enviar, T0), /^Error: EMAIL_INVALID/);
});

test('conferir: vale uma vez, por 10 minutos, e 5 erros obrigam a pedir outro', async (t) => {
  const b = pasta(t); const c = caixa(); const email = 'caio@exemplo.com';
  await pedirCodigo({ email, finalidade: 'CADASTRO' }, b, c.enviar, T0); const certo = c.enviados[0].codigo; const errado = certo === '000000' ? '111111' : '000000';
  assert.throws(() => conferirCodigo('SENHA', email, certo, T0), /CODE_EXPIRED/, 'a finalidade faz parte do código');
  assert.throws(() => conferirCodigo('CADASTRO', email, errado, T0), /CODE_INVALID/);
  conferirCodigo('CADASTRO', email, ' ' + certo + ' ', T0 + 60_000);
  assert.throws(() => conferirCodigo('CADASTRO', email, certo, T0 + 60_000), /CODE_EXPIRED/, 'uso único');

  await pedirCodigo({ email, finalidade: 'CADASTRO' }, b, c.enviar, T0 + 120_000);
  assert.throws(() => conferirCodigo('CADASTRO', email, c.enviados[1].codigo, T0 + 120_000 + 10 * 60_000), /CODE_EXPIRED/, 'vence em 10 minutos');

  await pedirCodigo({ email, finalidade: 'CADASTRO' }, b, c.enviar, T0 + 20 * 60_000); const outro = c.enviados[2].codigo; const ruim = outro === '000000' ? '111111' : '000000';
  for (let i = 0; i < 4; i++) assert.throws(() => conferirCodigo('CADASTRO', email, ruim, T0 + 20 * 60_000), /CODE_INVALID/);
  assert.throws(() => conferirCodigo('CADASTRO', email, ruim, T0 + 20 * 60_000), /CODE_EXPIRED: código errado vezes demais/);
  assert.throws(() => conferirCodigo('CADASTRO', email, outro, T0 + 20 * 60_000), /CODE_EXPIRED/, 'nem o certo vale depois de 5 erros');
});

test('falha no envio não deixa código pendente', async (t) => {
  const b = pasta(t);
  await assert.rejects(pedirCodigo({ email: 'dora@exemplo.com', finalidade: 'CADASTRO' }, b, async () => { throw new Error('EMAIL_SEND_FAILED: fora'); }, T0), /EMAIL_SEND_FAILED/);
  assert.throws(() => conferirCodigo('CADASTRO', 'dora@exemplo.com', '123456', T0), /CODE_EXPIRED/);
  const c = caixa(); await pedirCodigo({ email: 'dora@exemplo.com', finalidade: 'CADASTRO' }, b, c.enviar, T0 + 1000);
  assert.equal(c.enviados.length, 1, 'pode tentar de novo na hora');
});
