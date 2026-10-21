/** Autorização pelo navegador, lado do app: uma tentativa por pessoa, nada guardado sem concluir, nada de token na tela. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { criarAutorizacaoPeloNavegador } from '../../../../dist/conexoes/integracoes/autorizacaoPeloNavegador.js';
import { respostaDeInicio, respostaDeRetirada } from '../../../../dist/conexoes/tipos/autorizacao.js';

const SITE_A = { id: '11111111-1111-4111-8111-111111111111', nome: 'Empresa', url: 'https://empresa.atlassian.net' };
const SITE_B = { id: '22222222-2222-4222-8222-222222222222', nome: 'Filial', url: 'https://filial.atlassian.net' };
const esperar = async (condicao, ms = 2000) => { const fim = Date.now() + ms; while (!condicao()) { if (Date.now() > fim) throw new Error('tempo esgotado'); await new Promise((r) => setTimeout(r, 2)); } };

function montar(ajuste = {}) {
  const registro = { abertos: [], iniciados: [], retiradas: [], adicionados: [], consultas: 0 };
  let dono = 'pessoa-1';
  const sequencia = [...(ajuste.estados ?? ['PENDENTE', 'PRONTO'])];
  const d = {
    dono: () => dono,
    iniciar: async (servico) => { registro.iniciados.push(servico); if (ajuste.iniciarFalha) throw new Error(ajuste.iniciarFalha); return { tentativa: 'tentativa-' + registro.iniciados.length + '-abcdefghijkl', url: 'https://provedor.example/autorizar?state=x', ...(servico === 'github' ? { instalarUrl: 'https://github.com/apps/prumo-qa/installations/new' } : {}) }; },
    estado: async () => { registro.consultas++; return { estado: sequencia.length > 1 ? sequencia.shift() : sequencia[0] }; },
    retirar: async (id) => { registro.retiradas.push(id); return ajuste.entrega ?? { acesso: 'ghu_acesso_secreto', renovacao: 'ghr_renovacao_secreta', expiraEm: 123456 }; },
    abrir: async (url) => { if (ajuste.abrirFalha) throw new Error('sem navegador'); registro.abertos.push(url); },
    adicionar: async (entrada) => { if (ajuste.adicionarFalha) throw new Error(ajuste.adicionarFalha); registro.adicionados.push(entrada); return { id: 'conta-1', nome: entrada.nome ?? 'GitHub · ana', identidade: 'ana' }; },
    repositorios: async () => ajuste.repositorios ?? 3,
    intervaloMs: 2, limiteMs: ajuste.limiteMs ?? 5000
  };
  return { auto: criarAutorizacaoPeloNavegador(d), registro, trocarDono: (x) => { dono = x; } };
}
const semSegredos = (valor) => { const texto = JSON.stringify(valor); for (const s of ['ghu_acesso_secreto', 'ghr_renovacao_secreta', 'jira_acesso', 'jira_renovacao']) assert.ok(!texto.includes(s), 'segredo no estado público: ' + s); };

test('GitHub: abre o navegador, acompanha até autorizar e guarda a conta com o acesso entregue uma vez', async () => {
  const { auto, registro } = montar();
  const inicio = await auto.iniciar('github');
  assert.deepEqual(inicio, { estado: 'AGUARDANDO' });
  assert.deepEqual(registro.abertos, ['https://provedor.example/autorizar?state=x']);
  await esperar(() => auto.estado().estado === 'CONECTADO');
  const final = auto.estado();
  assert.deepEqual(final, { estado: 'CONECTADO', conta: { id: 'conta-1', nome: 'GitHub · ana', identidade: 'ana' } });
  assert.equal(registro.retiradas.length, 1);
  assert.deepEqual(registro.adicionados[0], { servico: 'github', credencial: { acesso: 'ghu_acesso_secreto', renovacao: 'ghr_renovacao_secreta', expiraEm: 123456 } });
  semSegredos(inicio); semSegredos(final);
  assert.equal(registro.abertos.length, 1, 'com repositórios já instalados não abre a página de instalação');
});

test('GitHub sem aplicativo instalado: conecta, abre a página de instalação e avisa a tela', async () => {
  const { auto, registro } = montar({ repositorios: 0 });
  await auto.iniciar('github');
  await esperar(() => auto.estado().estado === 'CONECTADO');
  assert.equal(auto.estado().instalarAplicativo, true);
  assert.deepEqual(registro.abertos, ['https://provedor.example/autorizar?state=x', 'https://github.com/apps/prumo-qa/installations/new']);
  assert.equal(auto.urlDeInstalacao(), 'https://github.com/apps/prumo-qa/installations/new');
});

test('Jira com um site: conecta direto, com nome, endereço e nuvem do site autorizado', async () => {
  const { auto, registro } = montar({ entrega: { acesso: 'jira_acesso', renovacao: 'jira_renovacao', expiraEm: 99, sites: [SITE_A] } });
  await auto.iniciar('jira');
  await esperar(() => auto.estado().estado === 'CONECTADO');
  assert.deepEqual(registro.adicionados[0], { servico: 'jira', nome: 'Jira · Empresa', instancia: 'https://empresa.atlassian.net', nuvem: SITE_A.id, credencial: { acesso: 'jira_acesso', renovacao: 'jira_renovacao', expiraEm: 99 } });
  semSegredos(auto.estado());
  assert.equal(auto.urlDeInstalacao(), null, 'instalação é coisa do GitHub');
});

test('Jira com vários sites: nada é guardado até a pessoa escolher, e só vale site da lista', async () => {
  const { auto, registro } = montar({ entrega: { acesso: 'jira_acesso', renovacao: 'jira_renovacao', sites: [SITE_A, SITE_B] } });
  await auto.iniciar('jira');
  await esperar(() => auto.estado().estado === 'ESCOLHER_SITE');
  assert.deepEqual(auto.estado().sites, [SITE_A, SITE_B]);
  semSegredos(auto.estado());
  assert.equal(registro.adicionados.length, 0);
  await assert.rejects(auto.escolherSite('33333333-3333-4333-8333-333333333333'), /RESOURCE_NOT_AUTHORIZED/);
  assert.equal(registro.adicionados.length, 0);
  const r = await auto.escolherSite(SITE_B.id);
  assert.equal(r.estado, 'CONECTADO');
  assert.equal(registro.adicionados.length, 1);
  assert.equal(registro.adicionados[0].nuvem, SITE_B.id);
  assert.equal(registro.adicionados[0].nome, 'Jira · Filial');
  assert.deepEqual(await auto.escolherSite(SITE_B.id), r, 'escolher de novo não duplica a conta');
  assert.equal(registro.adicionados.length, 1);
});

test('Jira sem nenhum site autorizado termina em erro claro, sem conta', async () => {
  const { auto, registro } = montar({ entrega: { acesso: 'jira_acesso', sites: [] } });
  await auto.iniciar('jira');
  await esperar(() => auto.estado().estado === 'ERRO');
  assert.match(auto.estado().mensagem, /Nenhum site Jira/);
  assert.equal(registro.adicionados.length, 0);
});

test('recusa, expiração e erro do provedor terminam sem conta e sem retirar credencial', async () => {
  for (const estado of ['NEGADO', 'EXPIRADO', 'ERRO']) {
    const { auto, registro } = montar({ estados: [estado] });
    await auto.iniciar('github');
    await esperar(() => auto.estado().estado === estado);
    assert.equal(registro.retiradas.length, 0, estado);
    assert.equal(registro.adicionados.length, 0, estado);
  }
});

test('prazo no app: sem resposta do provedor a tentativa expira sozinha', async () => {
  const { auto, registro } = montar({ estados: ['PENDENTE'], limiteMs: 30 });
  await auto.iniciar('github');
  await esperar(() => auto.estado().estado === 'EXPIRADO');
  assert.equal(registro.retiradas.length, 0);
});

test('cancelar: nada é retirado nem guardado, mesmo que o provedor ainda conclua depois', async () => {
  const { auto, registro } = montar({ estados: ['PENDENTE', 'PENDENTE', 'PRONTO'] });
  await auto.iniciar('github');
  assert.deepEqual(auto.estado(true), { estado: 'CANCELADO' });
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(registro.retiradas.length, 0);
  assert.equal(registro.adicionados.length, 0);
  assert.equal(auto.estado().estado, 'CANCELADO');
});

test('clicar de novo durante a espera não abre outra tentativa; trocar de serviço abre', async () => {
  const { auto, registro } = montar({ estados: ['PENDENTE'] });
  await auto.iniciar('github'); await auto.iniciar('github');
  assert.deepEqual(registro.iniciados, ['github']);
  await auto.iniciar('jira');
  assert.deepEqual(registro.iniciados, ['github', 'jira']);
  auto.estado(true);
});

test('troca de conta do Prumo no meio da autorização: nada é guardado e a outra pessoa não vê o resultado', async () => {
  const { auto, registro, trocarDono } = montar({ estados: ['PENDENTE', 'PENDENTE', 'PRONTO'] });
  await auto.iniciar('github');
  trocarDono('pessoa-2');
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(registro.adicionados.length, 0);
  assert.deepEqual(auto.estado(), { estado: 'INATIVO' }, 'a outra pessoa não herda a tentativa');
  trocarDono('pessoa-1');
  assert.equal(auto.estado().estado, 'ERRO');
  assert.match(auto.estado().mensagem, /Entre de novo/);
});

test('o resultado é só de quem pediu: outra pessoa nunca vê conta nem escolhe site', async () => {
  const { auto, trocarDono } = montar({ entrega: { acesso: 'jira_acesso', sites: [SITE_A, SITE_B] } });
  await auto.iniciar('jira');
  await esperar(() => auto.estado().estado === 'ESCOLHER_SITE');
  trocarDono('pessoa-2');
  assert.deepEqual(auto.estado(), { estado: 'INATIVO' });
  assert.deepEqual(await auto.escolherSite(SITE_A.id), { estado: 'INATIVO' });
  assert.equal(auto.urlDeInstalacao(), null);
});

test('serviço central não configurado: erro marcado como indisponível, para a tela oferecer o caminho manual', async () => {
  for (const codigo of ['INTEGRATION_NOT_CONFIGURED', 'IDENTITY_NOT_CONFIGURED', 'SESSION_REQUIRED']) {
    const { auto, registro } = montar({ iniciarFalha: codigo });
    const r = await auto.iniciar('github');
    assert.equal(r.estado, 'ERRO'); assert.equal(r.indisponivel, true, codigo);
    assert.equal(registro.abertos.length, 0);
  }
  const limite = await montar({ iniciarFalha: 'INTEGRATION_RATE_LIMIT' }).auto.iniciar('github');
  assert.equal(limite.estado, 'ERRO'); assert.equal(limite.indisponivel, undefined); assert.match(limite.mensagem, /Aguarde/);
});

test('navegador que não abre termina em erro e não deixa tentativa pendurada', async () => {
  const { auto, registro } = montar({ abrirFalha: true });
  const r = await auto.iniciar('github');
  assert.equal(r.estado, 'ERRO');
  assert.match(r.mensagem, /navegador/);
  await new Promise((x) => setTimeout(x, 20));
  assert.equal(registro.consultas, 0, 'sem navegador não há o que acompanhar');
});

test('conta repetida, cofre indisponível e falha qualquer dão mensagem própria sem texto técnico nem segredo', async () => {
  const casos = [['CONNECTION_DUPLICATE', /já está conectada/], ['CREDENTIAL_PROTECTION_UNAVAILABLE', /cofre/], ['SERVICE_RESPONSE_INVALID: ghu_acesso_secreto', /não foi concluída/]];
  for (const [falha, texto] of casos) {
    const { auto } = montar({ adicionarFalha: falha });
    await auto.iniciar('github');
    await esperar(() => auto.estado().estado === 'ERRO');
    assert.match(auto.estado().mensagem, texto);
    semSegredos(auto.estado());
    assert.ok(!auto.estado().mensagem.includes('SERVICE_RESPONSE_INVALID'));
  }
});

test('uma nova autorização depois de terminar começa do zero', async () => {
  const { auto, registro } = montar({ estados: ['PRONTO'] });
  await auto.iniciar('github');
  await esperar(() => auto.estado().estado === 'CONECTADO');
  await auto.iniciar('github');
  assert.deepEqual(registro.iniciados, ['github', 'github']);
  await esperar(() => registro.adicionados.length === 2);
});

test('o app só aceita do serviço páginas oficiais do GitHub e da Atlassian para abrir no navegador', () => {
  const tentativa = 'abcdefghijklmnopqrstuvwxyz012345';
  assert.ok(respostaDeInicio.safeParse({ tentativa, url: 'https://github.com/login/oauth/authorize?client_id=x&state=y', instalarUrl: 'https://github.com/apps/prumo-qa/installations/new' }).success);
  assert.ok(respostaDeInicio.safeParse({ tentativa, url: 'https://auth.atlassian.com/authorize?audience=api.atlassian.com' }).success);
  for (const url of ['http://github.com/login/oauth/authorize?x=1', 'https://evil.example/login/oauth/authorize?x=1', 'https://github.com.evil.example/login/oauth/authorize?x=1', 'https://github.com/login/oauth/authorize', 'file:///C:/Windows/System32/calc.exe', 'https://auth.atlassian.com/oauth/token?x=1'])
    assert.equal(respostaDeInicio.safeParse({ tentativa, url }).success, false, url);
  for (const instalarUrl of ['https://evil.example/apps/prumo-qa/installations/new', 'https://github.com/apps/prumo-qa/installations/new?x=1', 'http://github.com/apps/a/installations/new'])
    assert.equal(respostaDeInicio.safeParse({ tentativa, url: 'https://github.com/login/oauth/authorize?x=1', instalarUrl }).success, false, instalarUrl);
  assert.equal(respostaDeInicio.safeParse({ tentativa: 'curta', url: 'https://github.com/login/oauth/authorize?x=1' }).success, false);
  assert.equal(respostaDeInicio.safeParse({ tentativa, url: 'https://github.com/login/oauth/authorize?x=1', extra: 1 }).success, false);
});

test('a entrega do serviço só passa com credencial no formato esperado e sites Jira *.atlassian.net válidos', () => {
  assert.ok(respostaDeRetirada.safeParse({ acesso: 'a', renovacao: 'r', expiraEm: 10, sites: [SITE_A] }).success);
  assert.equal(respostaDeRetirada.safeParse({ acesso: '' }).success, false);
  assert.equal(respostaDeRetirada.safeParse({ acesso: 'a', sites: [{ ...SITE_A, url: 'http://empresa.atlassian.net' }] }).success, false);
  assert.equal(respostaDeRetirada.safeParse({ acesso: 'a', sites: [{ ...SITE_A, id: 'nao-uuid' }] }).success, false);
  assert.equal(respostaDeRetirada.safeParse({ acesso: 'a', outro: 'campo' }).success, false);
});
