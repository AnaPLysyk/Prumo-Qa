// Códigos por e-mail no aplicativo: validade, uso único, tentativas, espera entre envios e o cliente do serviço de envio.
// O envio é injetado ou vai para o serviço em 127.0.0.1 com caixa em memória; nada sai do computador.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { conferirCodigo, esquecerCodigos, pedirCodigo } from '../../../../dist/login/regras/codigosPorEmail.js';
import { enviarCodigoPorEmail } from '../../../../dist/login/integracoes/enviarCodigoPorEmail.js';
import { encerrarSessao } from '../../../../dist/login/regras/sessao.js';
import { criarServico } from '../../../../servico-do-prumo/servidor.mjs';

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

test('cliente do serviço: fala com o serviço local e traduz as respostas; endereço fora de HTTPS e de 127.0.0.1 é recusado sem rede', async (t) => {
  const mensagens = []; let falhar = false;
  const servidor = http.createServer(criarServico({ enviar: async (m) => { if (falhar) throw new Error('fora'); mensagens.push(m); }, registrar: () => {}, limites: { porEmail10min: 1, porEmailDia: 10, porIpHora: 10, totalHora: 10 } }));
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok)); t.after(() => servidor.close());
  const antes = process.env.PRUMO_SERVICO; t.after(() => { if (antes === undefined) delete process.env.PRUMO_SERVICO; else process.env.PRUMO_SERVICO = antes; });
  process.env.PRUMO_SERVICO = 'http://127.0.0.1:' + servidor.address().port;
  await enviarCodigoPorEmail({ email: 'eli@exemplo.com', codigo: '765432', finalidade: 'SENHA', idioma: 'pt-BR' });
  assert.equal(mensagens.length, 1); assert.match(mensagens[0].texto, /765432/);
  await assert.rejects(enviarCodigoPorEmail({ email: 'eli@exemplo.com', codigo: '765432', finalidade: 'SENHA', idioma: 'pt-BR' }), /^Error: EMAIL_RATE_LIMIT/);
  falhar = true; await assert.rejects(enviarCodigoPorEmail({ email: 'fabi@exemplo.com', codigo: '765432', finalidade: 'SENHA', idioma: 'pt-BR' }), /^Error: EMAIL_SEND_FAILED/);
  for (const url of ['http://exemplo.com', 'http://localhost:9', 'ftp://127.0.0.1', 'não é url']) {
    process.env.PRUMO_SERVICO = url;
    await assert.rejects(enviarCodigoPorEmail({ email: 'eli@exemplo.com', codigo: '765432', finalidade: 'SENHA', idioma: 'pt-BR' }), /^Error: EMAIL_SERVICE_UNAVAILABLE: endereço/, url);
  }
});
