// Captura as imagens do site a partir do aplicativo REAL, com dados 100% sintéticos e isolados.
// Nada aqui toca Jira, Qase, GitHub ou projetos reais: os serviços são um servidor HTTP local de laboratório
// (testes/servicos-fixtures.mjs) e o diretório de dados é temporário. Uso: node scripts/capturar-site.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { _electron as electron } from 'playwright-core';
import electronPath from 'electron';
import { servidorFixture } from '../testes/servicos-fixtures.mjs';

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const saida = path.join(repo, 'site', 'imagens');
fs.mkdirSync(saida, { recursive: true });
const dados = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-site-captura-'));
const s = await servidorFixture();
const env = { ...process.env, PRUMO_DATA_DIR: dados }; delete env.ELECTRON_RUN_AS_NODE;
const app = await electron.launch({ executablePath: electronPath, args: [repo], env });
try {
  await app.evaluate(({ dialog }) => { dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false }); });
  await app.evaluate((_, p) => {
    const https = process.getBuiltinModule('node:https'), http = process.getBuiltinModule('node:http'), dns = process.getBuiltinModule('node:dns');
    dns.promises.lookup = async () => ({ address: '93.184.216.34', family: 4 });
    https.request = (url, opcoes, callback) => http.request({ hostname: '127.0.0.1', port: p, path: url.pathname + url.search, method: opcoes.method, headers: { ...opcoes.headers, 'x-fixture-host': url.hostname } }, callback);
    process.getBuiltinModule('node:module').syncBuiltinESMExports();
  }, s.port);
  const page = await app.firstWindow();
  await page.setViewportSize({ width: 1280, height: 800 });
  await app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; w.setContentSize(1280, 800); });
  await page.waitForSelector('#nav button');
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
    const virt = { runs: ['testes', 'runs'], automacoes: ['testes', 'automacao'], vinculos: ['rastreabilidade', 'vinculos'] };
    for (const tema of ['escuro', 'claro']) {
      await page.evaluate((t) => { document.documentElement.dataset.tema = t; }, tema);
      for (const aba of ['inicio', 'projetos', 'contextos', 'tickets', 'testes', 'runs', 'automacoes', 'agenda', 'execucoes', 'evidencias', 'rastreabilidade', 'vinculos', 'metricas', 'historico', 'logs', 'conexoes', 'agentes', 'suporte', 'ajuda']) {
        const [pai, sub] = virt[aba] || [aba, null]; await ir(pai); if (sub) { await page.click('[data-sub=' + sub + ']'); await page.waitForTimeout(500); }
        await page.waitForTimeout(400); await page.screenshot({ path: path.join(todas, tema + '-' + aba + '.png') });
      }
    }
    console.log('telas capturadas'); await app.close(); await s.fechar(); fs.rmSync(dados, { recursive: true, force: true }); process.exit(0);
  }
  // Repositório sintético para o catálogo de testes (nada de projeto real)
  const { fixture } = await import('../testes/fixtures.mjs'); const f = await fixture({ after() {} });
  const escreve = async (rel, txt) => { const p = path.join(f.root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, txt); };
  await escreve('tests/e2e/checkout.spec.ts', "import { test } from '@playwright/test';\ntest.describe('Checkout', () => {\n  test('paga com cartão @smoke', async ({ page }) => { await page.goto('/'); await test.step('Escolher produto', async () => {}); await test.step('Pagar com cartão', async () => {}); });\n  test('recusa cartão vencido @regression', async ({ page }) => { await page.goto('/'); });\n});\n");
  await escreve('tests/e2e/login.spec.ts', "import { test } from '@playwright/test';\ntest.describe('Login', () => {\n  test('entra com senha válida', async ({ page }) => { await page.goto('/'); });\n  test('bloqueia após 5 tentativas', async ({ page }) => { await page.goto('/'); });\n});\n");
  await escreve('tests/api/pedidos.spec.ts', "import request from 'supertest';\ntest('lista pedidos do usuário', async () => { await request(app).get('/pedidos'); });\ntest('rejeita pedido sem itens', async () => { await request(app).post('/pedidos'); });\n");
  await escreve('src/preco.test.ts', "describe('Preço', () => { it('aplica desconto progressivo', () => {}); it('arredonda para centavos', () => {}); });\n");
  await escreve('features/carrinho.feature', '@regression\nFeature: Carrinho\n  Scenario: Remover item\n    Given um carrinho com dois itens\n    When removo um item\n    Then o total é recalculado\n');
  await page.evaluate(() => 0);
  await app.evaluate(({ dialog }, p) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [p] }); }, f.root);
  await api('espacoPasta', e.id);
  const tema = (t) => page.evaluate((x) => { document.documentElement.dataset.tema = x; }, t);
  await tema('escuro');
  await ir('inicio'); await page.waitForTimeout(6500); await tirar('inicio');
  await ir('testes'); await page.waitForSelector('#cat-lista [data-feature]'); await page.locator('#cat-lista details').first().evaluate((d) => { d.open = true; }); await tirar('catalogo');
  await ir('tickets'); await page.fill('#tk-q', 'SMART'); await page.click('#tk-buscar'); await page.waitForSelector('#tk-tabela'); await tirar('tickets');
  await ir('testes'); await page.click('[data-sub=runs]'); await page.waitForTimeout(500); await tirar('execucoes-plano');
  await ir('metricas'); await tirar('metricas');
  await ir('agentes'); await tirar('agentes');
  await tema('claro'); await ir('inicio'); await page.waitForTimeout(6500); await tirar('inicio-claro');
} finally {
  await app.close().catch(() => {});
  await s.fechar();
  fs.rmSync(dados, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
}
