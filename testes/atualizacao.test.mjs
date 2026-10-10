import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { verificarAtualizacao, destinoAutorizado, urlConsulta, mensagemOffline } from '../dist/atualizacao.js';

const resp = (corpo, init = {}) => async () => new Response(typeof corpo === 'string' ? corpo : JSON.stringify(corpo), { status: 200, ...init });
const release = (tag, extra = {}) => ({ tag_name: tag, html_url: `https://github.com/AnaPLysyk/Prumo-Qa/releases/tag/${tag}`, body: '## Novidades\n- algo', draft: false, prerelease: false, ...extra });

test('versão mais recente disponível: resumo das mudanças e página oficial reconstruída localmente', async () => {
  const r = await verificarAtualizacao('2.2.0', { buscar: resp(release('v2.3.0', { html_url: 'https://evil.example/phishing' })) });
  assert.equal(r.status, 'ATUALIZACAO_DISPONIVEL'); assert.equal(r.latest, '2.3.0'); assert.match(r.notes, /Novidades/);
  assert.equal(r.url, 'https://github.com/AnaPLysyk/Prumo-Qa/releases/tag/v2.3.0', 'html_url do servidor nunca é repassado');
  assert.match(r.message, /sem a sua ação/);
});

test('versão igual, instalada mais nova e comparação numérica (2.10 > 2.9)', async () => {
  assert.equal((await verificarAtualizacao('2.3.0', { buscar: resp(release('v2.3.0')) })).status, 'ATUALIZADO');
  assert.equal((await verificarAtualizacao('2.4.0', { buscar: resp(release('v2.3.0')) })).status, 'INSTALADA_MAIS_NOVA');
  assert.equal((await verificarAtualizacao('2.9.0', { buscar: resp(release('v2.10.0')) })).status, 'ATUALIZACAO_DISPONIVEL');
});

test('ausência de release (404), indisponibilidade, falha de rede e timeout mantêm o uso local', async () => {
  assert.equal((await verificarAtualizacao('2.2.0', { buscar: async () => new Response('{}', { status: 404 }) })).status, 'SEM_RELEASE');
  for (const status of [403, 500, 503]) { const r = await verificarAtualizacao('2.2.0', { buscar: async () => new Response('x', { status }) }); assert.equal(r.status, 'INDISPONIVEL'); assert.equal(r.message, mensagemOffline); }
  const rede = await verificarAtualizacao('2.2.0', { buscar: async () => { throw new TypeError('fetch failed'); } });
  assert.equal(rede.status, 'INDISPONIVEL'); assert.equal(rede.message, 'Não foi possível verificar atualizações. O aplicativo continua disponível para uso local.');
  const lento = await verificarAtualizacao('2.2.0', { timeoutMs: 80, buscar: (_u, init) => new Promise((_ok, ruim) => init.signal.addEventListener('abort', () => ruim(init.signal.reason))) });
  assert.equal(lento.status, 'INDISPONIVEL');
});

test('respostas inválidas são ignoradas: JSON quebrado, tag estranha, rascunho, pré-release e resposta enorme', async () => {
  for (const corpo of ['não é json', '[]', '{}', JSON.stringify(release('latest')), JSON.stringify(release('v2.3')), JSON.stringify(release('v2.3.0-rc1')), JSON.stringify(release('v2.3.0', { draft: true })), JSON.stringify(release('v2.3.0', { prerelease: true })), JSON.stringify(release('v2.3.0', { body: 'x'.repeat(1_100_000) }))]) {
    const r = await verificarAtualizacao('2.2.0', { buscar: resp(corpo) });
    assert.equal(r.status, 'RESPOSTA_INVALIDA', corpo.slice(0, 40)); assert.equal(r.url, undefined);
  }
});

test('notas são texto limpo e limitado, sem caracteres de controle', async () => {
  const r = await verificarAtualizacao('2.2.0', { buscar: resp(release('v2.3.0', { body: 'ok\u0000\u001b[31m' + 'a'.repeat(9000) })) });
  assert.ok(r.notes.length <= 4000); assert.doesNotMatch(r.notes, /[\x00-\x08\x1b]/);
});

test('destino remoto é fixo: nenhum outro host, caminho, porta, credencial ou protocolo', async () => {
  assert.ok(destinoAutorizado(urlConsulta));
  for (const ruim of ['http://api.github.com/repos/AnaPLysyk/Prumo-Qa/releases/latest', 'https://api.github.com/repos/outro/repo/releases/latest', 'https://api.github.com/repos/AnaPLysyk/Prumo-Qa/releases/latest?x=1',
    'https://api.github.com.evil.com/repos/AnaPLysyk/Prumo-Qa/releases/latest', 'https://user:pw@api.github.com/repos/AnaPLysyk/Prumo-Qa/releases/latest', 'https://api.github.com:8443/repos/AnaPLysyk/Prumo-Qa/releases/latest',
    'https://example.com/', 'file:///C:/Windows/win.ini', 'http://127.0.0.1/x', 'nao-e-url', '']) assert.ok(!destinoAutorizado(ruim), ruim);
  assert.ok(destinoAutorizado('http://127.0.0.1:1234/x', true), 'loopback só com permitirLocal (testes)');
  assert.ok(!destinoAutorizado('http://localhost:1234/x', true));
  let chamado = false;
  await assert.rejects(verificarAtualizacao('2.2.0', { url: 'https://example.com/', buscar: async () => { chamado = true; return new Response('{}'); } }), /UPDATE_DESTINATION_FORBIDDEN/);
  assert.equal(chamado, false, 'nenhuma requisição é feita para destino não autorizado');
  await assert.rejects(verificarAtualizacao('abc'), /INVALID_VERSION/);
});

test('requisição não leva dados privados nem segue redirecionamentos', async () => {
  let visto;
  await verificarAtualizacao('2.2.0', { buscar: async (url, init) => { visto = { url, init }; return new Response(JSON.stringify(release('v2.2.0'))); } });
  assert.equal(visto.url, urlConsulta); assert.equal(visto.init.method, 'GET');
  assert.equal(visto.init.body, undefined); assert.equal(visto.init.redirect, 'error'); assert.equal(visto.init.credentials, 'omit');
  assert.deepEqual(Object.keys(visto.init.headers).sort(), ['Accept', 'User-Agent']);
  assert.equal(visto.init.headers['User-Agent'], 'PrumoQA/2.2.0');
  assert.doesNotMatch(JSON.stringify(visto), /Users|AppData|LOCALAPPDATA|projects|\.prumo|token|authorization|cookie/i);
});

test('HTTP real em loopback: lê release, não faz download e recusa redirecionamento', async (t) => {
  const pedidos = [];
  const srv = http.createServer((req, res) => {
    pedidos.push({ m: req.method, u: req.url, h: req.headers, ip: req.socket.remoteAddress });
    if (req.url === '/redireciona') { res.writeHead(302, { Location: 'http://127.0.0.1:1/' }); return res.end(); }
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(release('v2.3.0')));
  });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok)); t.after(() => srv.close());
  const base = `http://127.0.0.1:${srv.address().port}`;
  const r = await verificarAtualizacao('2.2.0', { url: base + '/latest', permitirLocal: true });
  assert.equal(r.status, 'ATUALIZACAO_DISPONIVEL');
  assert.equal(pedidos.length, 1); assert.equal(pedidos[0].m, 'GET'); assert.equal(pedidos[0].h['user-agent'], 'PrumoQA/2.2.0');
  assert.equal(pedidos[0].h.cookie, undefined); assert.equal(pedidos[0].h.authorization, undefined);
  const red = await verificarAtualizacao('2.2.0', { url: base + '/redireciona', permitirLocal: true });
  assert.equal(red.status, 'INDISPONIVEL'); assert.equal(pedidos.length, 2, 'redirecionamento não foi seguido');
});

test('o módulo nunca baixa nem executa instalador', async () => {
  const fonte = (await import('node:fs')).readFileSync('src/atualizacao.ts', 'utf8');
  assert.doesNotMatch(fonte, /child_process|spawn|exec\(|writeFile|createWriteStream|\.exe\b|shell\./);
});
