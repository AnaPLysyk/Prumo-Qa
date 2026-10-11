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
  await page.selectOption('#tema', 'escuro');
  await ir('inicio'); await tirar('inicio');
  await ir('tickets'); await page.fill('#tk-q', 'SMART'); await page.click('#tk-buscar'); await page.waitForSelector('#tk-tabela'); await tirar('tickets');
  await ir('testes'); await tirar('testes');
  await ir('runs'); await tirar('runs');
  await ir('vinculos'); await tirar('vinculos');
  await ir('agentes'); await tirar('agentes');
  await ir('agenda'); await tirar('agendamentos');
  await ir('conexoes'); await tirar('conexoes');
  await page.selectOption('#tema', 'claro'); await ir('runs'); await tirar('runs-claro');
} finally {
  await app.close().catch(() => {});
  await s.fechar();
  fs.rmSync(dados, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
}
