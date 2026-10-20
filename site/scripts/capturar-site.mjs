// Captura as imagens do site a partir do aplicativo REAL, com dados 100% sintéticos e isolados.
// Nada aqui toca Jira, Qase, GitHub ou projetos reais: os serviços são um servidor HTTP local de laboratório
// (testes/apoio/servicos-fixtures.mjs) e o diretório de dados é temporário. Uso: node site/scripts/capturar-site.mjs
// O bootstrap de testes substitui SQLite por armazenamento em memória. As capturas não comprovam
// avaliação humana, uso de leitor de tela ou autenticação em serviços externos.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright-core';
import electronPath from 'electron';
import { servidorFixture } from '../../testes/apoio/servicos-fixtures.mjs';
import { caixaDeEmail } from '../../testes/apoio/caixa-de-email.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const saida = path.join(repo, 'site', 'imagens');
fs.mkdirSync(saida, { recursive: true });
const dados = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-site-captura-'));
let s, app;
const limpezas = [];
// O código de confirmação do e-mail vai para a caixa local (serviço de envio em 127.0.0.1), nunca para o Resend.
const caixa = await caixaDeEmail();
const env = { ...process.env, PRUMO_DATA_DIR: dados, PRUMO_SEM_AVISO_AUTOMATICO: '1', PRUMO_SERVICO: caixa.url }; delete env.ELECTRON_RUN_AS_NODE;
try {
  s = await servidorFixture();
  app = await electron.launch({ executablePath: electronPath, args: [path.join(repo, 'testes/apoio/desktop-entry.cjs')], env, timeout: 30000 });
  await app.evaluate(({ dialog }) => { dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false }); });
  await app.evaluate((_, p) => {
    const https = process.getBuiltinModule('node:https'), http = process.getBuiltinModule('node:http'), dns = process.getBuiltinModule('node:dns');
    dns.promises.lookup = async () => ({ address: '93.184.216.34', family: 4 });
    https.request = (url, opcoes, callback) => http.request({ hostname: '127.0.0.1', port: p, path: url.pathname + url.search, method: opcoes.method, headers: { ...opcoes.headers, 'x-fixture-host': url.hostname } }, callback);
    process.getBuiltinModule('node:module').syncBuiltinESMExports();
  }, s.port);
  const page = await app.firstWindow();
  page.setDefaultTimeout(15000);
  await page.setViewportSize({ width: 1280, height: 800 });
  await app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; w.setContentSize(1280, 800); });
  await page.waitForSelector('#nav button', { state: 'attached' });
  // O Prumo abre na entrada: cria a conta de Administrador sintética (primeiro acesso) e recarrega já dentro.
  await page.waitForSelector('dialog#entrada[open]');
  const pedido = await page.evaluate(() => window.prumo.contaCodigo('conta-demo@prumo.test', 'CADASTRO'));
  if (!pedido.ok) throw new Error('Não foi possível pedir o código da conta de demonstração: ' + JSON.stringify(pedido.error));
  const primeiro = await page.evaluate((c) => window.prumo.usuariosAtivar('conta-demo@prumo.test', 'Conta Demo', 'Prumo-captura-2026', c), caixa.ultimoCodigo('conta-demo@prumo.test'));
  if (!primeiro.ok) throw new Error('Não foi possível criar a conta de demonstração: ' + JSON.stringify(primeiro.error));
  await page.reload();
  await page.waitForSelector('[data-aba=inicio][aria-current=page]');
  const api = (fn, ...a) => page.evaluate(([f, args]) => window.prumo[f](...args), [fn, a]);
  const ir = async (aba) => { await page.click(`[data-aba=${aba}]`); await page.waitForFunction((x) => document.querySelector(`[data-aba=${x}]`)?.getAttribute('aria-current') === 'page', aba); await page.waitForTimeout(500); };

  const e = (await api('espacoCriar', { nome: 'Loja Demo', descricao: 'Projeto de demonstração com dados fictícios' })).data;
  for (const [servico, extra] of [['jira', { instancia: 'https://demo.atlassian.net', usuario: 'demo@example.test' }], ['qase', {}]]) {
    const conta = (await api('servicoAdicionar', { servico, nome: servico === 'jira' ? 'Jira (laboratório)' : 'Qase (laboratório)', token: 'token-ficticio-site', ...extra })).data;
    const recursos = (await api('servicoRecursos', conta.id)).data.recursos;
    await api('servicoVincular', e.id, conta.id, recursos[0]);
  }
  await api('escritaHabilitar', e.id, 'jira', true); await api('escritaHabilitar', e.id, 'qase', true);
  await api('propostaCriar', e.id, 'caso', { titulo: 'Login rejeita senha incorreta', descricao: 'Valida a mensagem de erro sem revelar se o usuário existe.', passos: [{ acao: 'Informar usuário válido e senha incorreta', esperado: 'Mensagem genérica de credenciais inválidas' }], automacao: 'a-automatizar' }, 'RQ-12 Autenticação', 'Acesso indevido');
  await api('runPreparar', { espacoId: e.id, titulo: 'Regressão da sprint 42', ambiente: 'teste', casos: [{ casoId: 31, titulo: 'Caso fictício SFQ' }] });
  await ir('projetos'); await page.locator(`[data-espaco="${e.id}"]`).getByRole('button', { name: 'Selecionar projeto' }).click();
  await page.waitForFunction(() => document.querySelector('#projeto-atual').textContent === 'Loja Demo');

  const tirar = async (nome) => { await page.waitForTimeout(300); await page.screenshot({ path: path.join(saida, nome + '.png') }); console.log('ok', nome); };
  if (process.argv.includes('--todas')) {
    const todas = path.join(repo, '.prumo', 'telas'); fs.mkdirSync(todas, { recursive: true });
    // 2.10: Contextos e Evidências saíram do menu (abrem em modal a partir de Agentes e Execuções).
    const virt = { ide: ['testes', 'ide'], repositorio: ['testes', 'repositorio'], runs: ['testes', 'runs'], planos: ['testes', 'planos'] };
    for (const tema of ['escuro', 'claro']) {
      await page.evaluate((t) => { document.documentElement.dataset.tema = t; }, tema);
      for (const aba of ['inicio', 'projetos', 'tickets', 'testes', 'ide', 'repositorio', 'runs', 'planos', 'agenda', 'metricas', 'logs', 'conexoes', 'agentes', 'suporte', 'ajuda']) {
        const [pai, sub] = virt[aba] || [aba, null]; await ir(pai); if (sub) { await page.click('[data-sub=' + sub + ']'); await page.waitForTimeout(500); }
        await page.waitForTimeout(1200); await page.screenshot({ path: path.join(todas, tema + '-' + aba + '.png') });
      }
    }
    console.log('telas capturadas');
  } else {
  // Repositório sintético para o catálogo de testes (nada de projeto real)
  const { fixture } = await import('../../testes/apoio/fixtures.mjs'); const f = await fixture({ after(fn) { limpezas.push(fn); } });
  const escreve = async (rel, txt) => { const p = path.join(f.root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, txt); };
  await escreve('tests/e2e/checkout.spec.ts', "import { test } from '@playwright/test';\ntest.describe('Checkout', () => {\n  test('paga com cartão @smoke', async ({ page }) => { // Qase: SFQ-31\n    await page.goto('/'); await test.step('Escolher produto', async () => {}); await test.step('Pagar com cartão', async () => {}); });\n  test('recusa cartão vencido @regression', async ({ page }) => { await page.goto('/'); });\n});\n");
  await escreve('tests/e2e/login.spec.ts', "import { test } from '@playwright/test';\ntest.describe('Login', () => {\n  test('entra com senha válida', async ({ page }) => { await page.goto('/'); });\n  test('bloqueia após 5 tentativas', async ({ page }) => { await page.goto('/'); });\n});\n");
  await escreve('tests/api/pedidos.spec.ts', "import request from 'supertest';\ntest('lista pedidos do usuário', async () => { await request(app).get('/pedidos'); });\ntest('rejeita pedido sem itens', async () => { await request(app).post('/pedidos'); });\n");
  await escreve('src/preco.test.ts', "describe('Preço', () => { it('aplica desconto progressivo', () => {}); it('arredonda para centavos', () => {}); });\n");
  await escreve('features/carrinho.feature', '@regression\nFeature: Carrinho\n  Scenario: Remover item\n    Given um carrinho com dois itens\n    When removo um item\n    Then o total é recalculado\n');
  await page.evaluate(() => 0);
  await app.evaluate(({ dialog }, p) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [p] }); }, f.root);
  await api('espacoPasta', e.id);
  const tema = (t) => page.evaluate((x) => { document.documentElement.dataset.tema = x; }, t);
  await tema('escuro');
  // 2.10: telas do Design System. Métricas fica fora: com dados sintéticos mínimos os gráficos sairiam vazios.
  const texto = (t) => page.waitForFunction((x) => document.querySelector('#conteudo')?.textContent.includes(x), t, { timeout: 15000 })
    .catch(async (erro) => { await page.screenshot({ path: path.join(repo, '.prumo', 'captura-falha.png') }); throw erro; });
  const sub = async (k) => { await page.click(`[data-sub=${k}]`); await page.waitForTimeout(600); };
  await ir('inicio'); await page.waitForTimeout(6500); await tirar('inicio');
  await ir('testes'); await sub('repositorio'); await texto('aplica desconto progressivo'); await tirar('testes');
  await sub('ide'); await page.click('.ds-ide-arquivo[data-arquivo="tests/e2e/checkout.spec.ts"]'); await page.waitForSelector('.ds-ide-linhas'); await page.click('#ide-editar'); await page.waitForSelector('.ds-ide-cm .CodeMirror'); await page.waitForTimeout(500); await tirar('codigo');
  await sub('runs'); await texto('Regressão da sprint 42'); await tirar('runs');
  await ir('tickets'); await texto('SMART-1'); await tirar('tickets');
  await ir('agentes'); await page.waitForTimeout(1200); await tirar('agentes');
  await tema('claro'); await ir('inicio'); await page.waitForTimeout(6500); await tirar('inicio-claro');
  }
} finally {
  try {
    await app?.close();
  } finally {
    try {
      await s?.fechar();
    } finally {
      try { for (const limpar of limpezas.reverse()) await limpar(); }
      finally { fs.rmSync(dados, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 }); }
    }
  }
}
