/** Jira por token de API, o mais simples possível: basta o nome do site, o e-mail e o token. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { adicionarConta } from '../../../../dist/conexoes/servicoContas.js';
import { cofreCredenciais } from '../../../../dist/conexoes/banco/credenciais.js';
import { enderecoDoSiteJira } from '../../../../dist/conexoes/integracoes/configuracaoDosServicos.js';

const protetor = { disponivel: () => true, proteger: (s) => Buffer.from(s), abrir: (b) => b.toString() };

function ambiente(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-jira-simples-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const pedidos = [];
  const transporte = async (p) => { pedidos.push(p); if (p.caminho === '/rest/api/3/myself') return { accountId: '70121:abc', displayName: 'Ana Souza' }; throw new Error('inesperado ' + p.caminho); };
  return { pedidos, c: { protetor, transporte, escrita: async () => ({}), base, cofre: cofreCredenciais(protetor, base) } };
}
const entrada = (instancia) => ({ servico: 'jira', nome: 'Jira · empresa', instancia, usuario: 'ana@empresa.com', token: 'token-de-api' });

test('o site pode ser digitado ou colado de várias formas (até um link qualquer do Jira) e sempre vira o endereço oficial em HTTPS', () => {
  for (const digitado of ['empresa', 'Empresa', ' empresa ', 'empresa.atlassian.net', 'EMPRESA.atlassian.net', 'https://empresa.atlassian.net', 'https://empresa.atlassian.net/', 'http://empresa.atlassian.net',
    'https://empresa.atlassian.net/jira/software/projects/KAN/boards/1', 'empresa.atlassian.net/browse/KAN-12', 'https://empresa.atlassian.net/jira?x=1#y'])
    assert.equal(enderecoDoSiteJira(digitado), 'https://empresa.atlassian.net', digitado);
  assert.equal(enderecoDoSiteJira('minha-empresa-2'), 'https://minha-empresa-2.atlassian.net');
});

test('o que não é um site Jira Cloud não é "consertado": segue para a validação estrita e é recusado', async (t) => {
  for (const ruim of ['', 'evil.example.com', 'empresa.atlassian.net.evil.com', 'https://user@empresa.atlassian.net', 'https://empresa.atlassian.net:8443', '-empresa', 'a/b', 'https://evil.com/empresa.atlassian.net']) {
    const { c, pedidos } = ambiente(t);
    await assert.rejects(adicionarConta(c, entrada(ruim)), /SERVICE_DESTINATION_BLOCKED|invalid|Invalid|too_small/i, JSON.stringify(ruim));
    assert.equal(pedidos.length, 0, 'nada é enviado para endereço recusado: ' + ruim);
  }
});

test('conectar com só o nome do site: valida no endereço oficial, guarda o token no cofre e nunca no cadastro', async (t) => {
  const { c, pedidos } = ambiente(t);
  const conta = await adicionarConta(c, entrada('empresa'));
  assert.equal(conta.instancia, 'https://empresa.atlassian.net');
  assert.equal(conta.usuario, 'ana@empresa.com');
  assert.equal(conta.autenticacao, undefined, 'token de API continua sendo token de API');
  const pedido = pedidos[0];
  assert.equal(pedido.instancia, 'https://empresa.atlassian.net');
  assert.equal(pedido.nuvem, undefined, 'token de API vai ao site, não ao api.atlassian.com');
  assert.equal(pedido.headers.Authorization, 'Basic ' + Buffer.from('ana@empresa.com:token-de-api').toString('base64'));
  assert.equal(c.cofre.ler(conta.id), 'token-de-api');
  assert.ok(!JSON.stringify(conta).includes('token-de-api'));
});

test('o mesmo site digitado de outro jeito é a mesma conta: não duplica', async (t) => {
  const { c } = ambiente(t);
  await adicionarConta(c, entrada('empresa'));
  await assert.rejects(adicionarConta(c, entrada('https://empresa.atlassian.net/')), /CONNECTION_DUPLICATE/);
  await assert.rejects(adicionarConta(c, entrada('EMPRESA.atlassian.net')), /CONNECTION_DUPLICATE/);
});

test('Jira por token continua exigindo o e-mail da conta', async (t) => {
  const { c, pedidos } = ambiente(t);
  await assert.rejects(adicionarConta(c, { servico: 'jira', nome: 'Jira', instancia: 'empresa', token: 'x' }), /JIRA_EMAIL_REQUIRED/);
  assert.equal(pedidos.length, 0);
});
