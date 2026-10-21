/** Jira só com o token: o Prumo acha o site pelo e-mail e pelas conexões que a pessoa já tem, e o próprio Jira confirma. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { candidatosDeSiteJira, descobrirSiteDoJira } from '../../../../dist/conexoes/regras/descobrirSiteDoJira.js';
import { ErroServico } from '../../../../dist/conexoes/integracoes/configuracaoDosServicos.js';

/** Jira simulado: só os sites em `sites` existem; cada um aceita um e-mail com um token. Os outros respondem como um site inexistente. */
function jiraSimulado(sites) {
  const pedidos = [];
  const c = {
    transporte: async (p) => {
      pedidos.push({ instancia: p.instancia, authorization: p.headers.Authorization, caminho: p.caminho });
      const host = new URL(p.instancia).hostname.replace('.atlassian.net', '');
      const site = sites[host];
      if (!site) throw new ErroServico('SERVICE_NOT_FOUND');
      const [usuario, token] = Buffer.from(p.headers.Authorization.replace('Basic ', ''), 'base64').toString().split(':');
      if (usuario !== site.email || token !== site.token) throw new ErroServico('CREDENTIAL_INVALID_OR_EXPIRED');
      return { accountId: 'acc:1', displayName: 'Ana' };
    },
    escrita: async () => ({})
  };
  return { c, pedidos };
}
const hosts = (pedidos) => pedidos.map((p) => new URL(p.instancia).hostname.replace('.atlassian.net', ''));

test('candidatos: conhecidos primeiro, domínio da empresa, início do e-mail; provedor pessoal nunca vira site', () => {
  assert.deepEqual(candidatosDeSiteJira(['ana.silva@empresa.com.br'], ['filial']), ['filial', 'empresa', 'anasilva', 'ana-silva']);
  assert.deepEqual(candidatosDeSiteJira(['paulalysyk1234@gmail.com']), ['paulalysyk1234']);
  for (const provedor of ['gmail', 'hotmail', 'outlook', 'yahoo', 'icloud', 'uol']) assert.ok(!candidatosDeSiteJira([`x@${provedor}.com`]).includes(provedor), provedor);
  assert.deepEqual(candidatosDeSiteJira(['ana+jira@empresa.com']), ['empresa', 'ana']);
});

test('candidatos: só nomes de site válidos, sem repetição e no máximo oito', () => {
  assert.deepEqual(candidatosDeSiteJira(['_ruim@dominio.com', 'bom@dominio.com']), ['dominio', 'bom']);
  assert.deepEqual(candidatosDeSiteJira(['a@empresa.com', 'b@empresa.com']), ['empresa', 'a', 'b']);
  const muitos = candidatosDeSiteJira(['a.b@x.com', 'c.d@y.com', 'e.f@z.com'], ['k1', 'k2', 'k3', 'k4']);
  assert.ok(muitos.length <= 8);
  assert.ok(candidatosDeSiteJira(['sem-arroba']).length === 0);
  assert.ok(candidatosDeSiteJira(['a@b'], ['../x', 'com espaço', 'EMPRESA']).every((c) => /^[a-z0-9][a-z0-9-]*$/.test(c)));
});

test('o caso da usuária: e-mail do Atlassian parecido com o nome do site acha o site só com o token', async () => {
  const { c } = jiraSimulado({ paulalysyk1234: { email: 'paulalysyk1234@gmail.com', token: 'tk' } });
  assert.deepEqual(await descobrirSiteDoJira(c, { token: 'tk', emails: ['paulalysyk1234@gmail.com'] }), { achou: true, site: 'paulalysyk1234', usuario: 'paulalysyk1234@gmail.com' });
});

test('e-mail do Prumo diferente do da Atlassian não acha; o e-mail certo digitado depois acha', async () => {
  const { c } = jiraSimulado({ paulalysyk1234: { email: 'paulalysyk1234@gmail.com', token: 'tk' } });
  const sem = await descobrirSiteDoJira(c, { token: 'tk', emails: ['paulalysyk123@gmail.com'] });
  assert.deepEqual(sem, { achou: false, motivo: 'NAO_ACHEI', site: null });
  const com = await descobrirSiteDoJira(c, { token: 'tk', emails: ['paulalysyk1234@gmail.com', 'paulalysyk123@gmail.com'] });
  assert.equal(com.achou, true);
  assert.equal(com.usuario, 'paulalysyk1234@gmail.com');
});

test('domínio da empresa e conexões anteriores também levam ao site; o e-mail certo é escolhido entre os candidatos', async () => {
  const { c } = jiraSimulado({ empresa: { email: 'ana@empresa.com', token: 'tk' }, filial: { email: 'ana@empresa.com', token: 'tk' } });
  assert.deepEqual(await descobrirSiteDoJira(c, { token: 'tk', emails: ['ana@empresa.com'] }), { achou: true, site: 'empresa', usuario: 'ana@empresa.com' });
  const { c: c2 } = jiraSimulado({ 'time-qa': { email: 'ana@gmail.com', token: 'tk' } });
  assert.deepEqual(await descobrirSiteDoJira(c2, { token: 'tk', emails: ['outra@gmail.com', 'ana@gmail.com'], conhecidos: ['time-qa'] }), { achou: true, site: 'time-qa', usuario: 'ana@gmail.com' });
});

test('site existe mas o e-mail/token não valem: informa qual site achou em vez de dizer que não existe', async () => {
  const { c } = jiraSimulado({ empresa: { email: 'ana@empresa.com', token: 'tk' } });
  assert.deepEqual(await descobrirSiteDoJira(c, { token: 'token-errado', emails: ['ana@empresa.com'] }), { achou: false, motivo: 'CREDENCIAL_RECUSADA', site: 'empresa' });
});

test('nada é enviado a endereço fora de *.atlassian.net, o provedor de e-mail não é testado e o token não volta no resultado', async () => {
  const { c, pedidos } = jiraSimulado({});
  const r = await descobrirSiteDoJira(c, { token: 'segredo-do-token', emails: ['ana.silva@gmail.com', 'ana@empresa.com'] });
  assert.equal(r.achou, false);
  assert.ok(pedidos.length > 0 && pedidos.length <= 8 * 3);
  for (const p of pedidos) { assert.match(p.instancia, /^https:\/\/[a-z0-9-]+\.atlassian\.net$/); assert.equal(p.caminho, '/rest/api/3/myself'); }
  assert.ok(!hosts(pedidos).includes('gmail'));
  assert.ok(!JSON.stringify(r).includes('segredo-do-token'));
});

test('e-mails inválidos são ignorados e sem candidatos nada é consultado', async () => {
  const { c, pedidos } = jiraSimulado({});
  assert.deepEqual(await descobrirSiteDoJira(c, { token: 'tk', emails: ['sem-arroba', ''] }), { achou: false, motivo: 'NAO_ACHEI', site: null });
  assert.equal(pedidos.length, 0);
});

test('erro de rede em um candidato não impede achar o site nos outros', async () => {
  const { c } = jiraSimulado({ empresa: { email: 'ana.silva@empresa.com', token: 'tk' } });
  const original = c.transporte;
  c.transporte = async (p) => { if (p.instancia.includes('anasilva')) throw new Error('rede caiu'); return original(p); };
  assert.equal((await descobrirSiteDoJira(c, { token: 'tk', emails: ['ana.silva@empresa.com'] })).achou, true);
});
