import test from 'node:test';
import assert from 'node:assert/strict';
import { abrir, novoDados, ir } from './janela.mjs';
import { servidorFixture } from './servicos-fixtures.mjs';

// 2.9: telas de integração na janela real. Serviços são um servidor local sintético; nenhum projeto externo é tocado.
const confirmar = (app, resposta = 1) => app.evaluate(({ dialog }, r) => { dialog.showMessageBox = async () => ({ response: r, checkboxChecked: false }); }, resposta);
const instrumentar = (app, port) => app.evaluate((_, p) => {
  const https = process.getBuiltinModule('node:https'), http = process.getBuiltinModule('node:http'), dns = process.getBuiltinModule('node:dns');
  dns.promises.lookup = async () => ({ address: '93.184.216.34', family: 4 });
  https.request = (url, opcoes, callback) => http.request({ hostname: '127.0.0.1', port: p, path: url.pathname + url.search, method: opcoes.method, headers: { ...opcoes.headers, 'x-fixture-host': url.hostname } }, callback);
  process.getBuiltinModule('node:module').syncBuiltinESMExports();
}, port);

async function preparar(t) {
  const dados = novoDados(t), s = await servidorFixture(t); const a = await abrir(t, dados); await instrumentar(a.app, s.port); await confirmar(a.app);
  const e = (await a.page.evaluate(() => window.prumo.espacoCriar({ nome: 'SMART-LAB', descricao: 'sintético' }))).data;
  for (const [servico, instancia, usuario, indice] of [['jira', 'https://lab.atlassian.net', 'fixture@example.test', 0], ['qase', undefined, undefined, 0]]) {
    const conta = (await a.page.evaluate((d) => window.prumo.servicoAdicionar(d), { servico, nome: servico + ' simulado', ...(instancia ? { instancia, usuario } : {}), token: 'fixture-secret-29' })).data;
    const recursos = (await a.page.evaluate((id) => window.prumo.servicoRecursos(id), conta.id)).data.recursos;
    assert.ok((await a.page.evaluate(([x, y, z]) => window.prumo.servicoVincular(x, y, z), [e.id, conta.id, recursos[indice]])).ok);
  }
  await ir(a.page, 'projetos'); await a.page.locator(`[data-espaco="${e.id}"]`).getByRole('button', { name: 'Selecionar projeto' }).click();
  await a.page.waitForFunction(() => document.querySelector('#projeto-atual').textContent === 'SMART-LAB');
  return { dados, s, a, e };
}

test('navegação 2.9: telas novas abrem sem erro e sem botão decorativo (cada controle chama o backend ou explica por que está indisponível)', async (t) => {
  const { a } = await preparar(t);
  for (const aba of ['runs', 'vinculos', 'agentes', 'conexoes', 'tickets', 'testes', 'automacoes']) { await ir(a.page, aba); assert.ok((await a.page.textContent('#conteudo')).length > 40, aba); }
  await ir(a.page, 'conexoes'); assert.equal(await a.page.locator('[data-escrita]').count(), 3);
  assert.match(await a.page.textContent('[data-escrita=jira]'), /somente leitura/, 'escrita nasce desligada');
  await ir(a.page, 'tickets'); assert.ok(await a.page.locator('[data-escrita-desligada=jira]').count(), 'aviso claro: escrita desligada');
  assert.deepEqual(a.erros, []);
});

test('Conexões: habilitar escrita exige confirmação nativa; recusar mantém somente leitura', async (t) => {
  const { a, e } = await preparar(t);
  await ir(a.page, 'conexoes'); await confirmar(a.app, 0); await a.page.click('#escrita-jira');
  await a.page.waitForTimeout(400); assert.match(await a.page.textContent('[data-escrita=jira]'), /somente leitura/);
  assert.equal((await a.page.evaluate((id) => window.prumo.escritaEstado(id), e.id)).data.servicos.find((x) => x.servico === 'jira').escrita, false);
  await confirmar(a.app, 1); await a.page.click('#escrita-jira');
  await a.page.waitForFunction(() => /escrita habilitada/.test(document.querySelector('[data-escrita=jira]')?.textContent || ''));
  assert.deepEqual(a.erros, []);
});

test('Tickets: filtro, detalhe e comentário idempotente pela interface (única escrita é o POST de comentário)', async (t) => {
  const { a, s } = await preparar(t);
  await ir(a.page, 'conexoes'); await a.page.click('#escrita-jira'); await a.page.waitForFunction(() => /escrita habilitada/.test(document.querySelector('[data-escrita=jira]')?.textContent || ''));
  await ir(a.page, 'tickets'); await a.page.fill('#tk-q', 'SMART'); await a.page.click('#tk-buscar'); await a.page.waitForSelector('#tk-tabela [data-ticket="SMART-1"]');
  const jql = decodeURIComponent(s.pedidos.filter((p) => p.caminho.includes('/search/jql')).at(-1).caminho);
  assert.match(jql, /project[+ ]=[+ ]11[+ ]AND/, 'o JQL é sempre restrito ao projeto vinculado'); assert.match(jql, /SMART/);
  await a.page.locator('#tk-tabela [data-ticket="SMART-1"]').getByRole('button', { name: 'Detalhar' }).click(); await a.page.waitForSelector('#tk-painel');
  await a.page.fill('#tk-comentario', 'Falha reproduzida no ambiente de teste.'); await a.page.click('#tk-comentar');
  await a.page.waitForSelector('[data-resultado-operacao="CONFIRMADA"]'); assert.equal(s.comentarios.length, 1);
  assert.match(JSON.stringify(s.comentarios[0].body), /prumo-[0-9a-f]{10}/, 'marcador de idempotência no comentário');
  await a.page.click('#tk-comentar'); await a.page.waitForFunction(() => document.querySelectorAll('[data-resultado-operacao]').length >= 2); assert.equal(s.comentarios.length, 1, 'repetir não duplica');
  assert.deepEqual([...new Set(s.pedidos.filter((p) => p.metodo !== 'GET').map((p) => p.metodo + ' ' + p.caminho))], ['POST /rest/api/3/issue/SMART-1/comment']);
  assert.deepEqual(a.erros, []);
});

test('Testes: proposta é rascunho, revisão exige os quatro itens e confirmação nativa, e nada sai sem escrita habilitada', async (t) => {
  const { a, s } = await preparar(t);
  await ir(a.page, 'testes'); await a.page.click('#pr-nova'); await a.page.fill('#pr-titulo', 'Login rejeita senha incorreta'); await a.page.fill('#pr-descricao', 'Valida a mensagem de erro.');
  await a.page.fill('.passo-acao', 'Informar usuário válido e senha errada'); await a.page.fill('.passo-esperado', 'Mensagem de credenciais inválidas'); await a.page.fill('#pr-requisito', 'RQ-12'); await a.page.fill('#pr-risco', 'Acesso indevido');
  await a.page.click('#pr-salvar'); await a.page.waitForSelector('[data-proposta]');
  assert.match(await a.page.textContent('[data-proposta]'), /RASCUNHO/);
  const antes = s.pedidos.filter((p) => p.metodo !== 'GET').length; assert.equal(antes, 0, 'salvar rascunho não escreve em lugar nenhum');
  await a.page.getByRole('button', { name: /^Publicar/ }).click(); await a.page.waitForFunction(() => /revis|desligad|habilit/i.test(document.querySelector('#aviso')?.textContent || ''));
  assert.equal(s.pedidos.filter((p) => p.metodo !== 'GET').length, 0, 'publicar sem revisão e sem escrita habilitada não envia nada');
  await a.page.getByRole('button', { name: 'Descartar' }).click(); await a.page.waitForSelector('#pr-vazia');
  assert.deepEqual(a.erros, []);
});

test('Agentes: matriz real, política salva com confirmação e vínculos mostram lacunas sem inventar relação', async (t) => {
  const { a, e } = await preparar(t);
  await ir(a.page, 'agentes'); await a.page.waitForSelector('#ag-matriz'); assert.ok(await a.page.locator('#ag-especializacoes input').count() >= 8);
  assert.match(await a.page.textContent('[data-cap=executar_testes]'), /autoriza/i);
  await a.page.selectOption('[data-pol=propor_bugs]', 'BLOQUEADO'); await a.page.click('#ag-salvar'); await a.page.waitForFunction(() => /Permissões salvas|Permissions saved/.test(document.querySelector('#aviso')?.textContent || ''));
  const estado = (await a.page.evaluate((id) => window.prumo.agentesEstado(id), e.id)).data; assert.equal(estado.matriz.find((c) => c.id === 'propor_bugs').estado, 'BLOQUEADO');
  await ir(a.page, 'vinculos'); await a.page.waitForSelector('#vinc-aviso'); assert.ok(await a.page.locator('#vinc-lacunas, #vinc-tabela').count());
  assert.deepEqual(a.erros, []);
});
