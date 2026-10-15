import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { abrir, novoDados, ir } from '../../../apoio/janela.mjs';
import { servidorFixture } from '../../../apoio/servicos-fixtures.mjs';

// Um caminho longo e sem ponto de quebra (como o do runner do CI) não pode alargar a página nem em janela pequena nem com zoom.
// Em tabelas do Design System a palavra não quebra no meio ("SMART" não vira "SMAR/T").
const estoura = (page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

test('Projetos com pasta de caminho longo não gera rolagem horizontal em 1024×768, zoom 2 e zoom 4', { timeout: 120000 }, async (t) => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-' + 'x'.repeat(70)));
  fs.writeFileSync(path.join(pasta, 'package.json'), '{"name":"longo","scripts":{"test":"node --test"}}'); t.after(() => fs.rmSync(pasta, { recursive: true, force: true }));
  const a = await abrir(t, novoDados(t)); const p = a.page;
  await a.app.evaluate(({ dialog }, d) => { dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false }); dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [d] }); }, pasta);
  const e = (await p.evaluate(() => window.prumo.espacoCriar({ nome: 'Longo', descricao: 'caminho longo' }))).data; await p.evaluate((id) => window.prumo.espacoPasta(id), e.id);
  await ir(p, 'projetos');
  for (const [w, h, zoom] of [[1024, 768, 1], [1280, 900, 2], [1280, 900, 4]]) {
    await a.app.evaluate(({ BrowserWindow }, [largura, altura, z]) => { const j = BrowserWindow.getAllWindows()[0]; j.setSize(largura, altura); j.webContents.setZoomFactor(z); }, [w, h, zoom]);
    await p.waitForFunction((z) => window.innerWidth <= 1280 / z + 16, zoom); await p.waitForTimeout(300);
    assert.equal(await estoura(p), false, `${w}x${h} zoom ${zoom}`);
  }
});

test('Tickets: a chave do projeto fica numa linha só dentro da tabela', { timeout: 120000 }, async (t) => {
  const s = await servidorFixture(t); const a = await abrir(t, novoDados(t)); const p = a.page;
  await a.app.evaluate((_, port) => { const https = process.getBuiltinModule('node:https'), http = process.getBuiltinModule('node:http'); process.getBuiltinModule('node:dns').promises.lookup = async () => ({ address: '93.184.216.34', family: 4 }); https.request = (url, o, cb) => http.request({ hostname: '127.0.0.1', port, path: url.pathname + url.search, method: o.method, headers: { ...o.headers, 'x-fixture-host': url.hostname } }, cb); process.getBuiltinModule('node:module').syncBuiltinESMExports(); }, s.port);
  const e = (await p.evaluate(() => window.prumo.espacoCriar({ nome: 'Chave', descricao: 'x' }))).data;
  const c = (await p.evaluate(() => window.prumo.servicoAdicionar({ servico: 'jira', nome: 'Jira', token: 'fixture-token-abcdef', instancia: 'https://lab.atlassian.net', usuario: 'f@example.test' }))).data;
  const r = (await p.evaluate((id) => window.prumo.servicoRecursos(id), c.id)).data.recursos[0]; await p.evaluate(([x, y, z]) => window.prumo.servicoVincular(x, y, z), [e.id, c.id, r]);
  await ir(p, 'projetos'); await p.locator(`[data-espaco="${e.id}"]`).getByRole('button', { name: 'Selecionar projeto' }).click(); await p.waitForFunction(() => document.querySelector('#projeto-atual').textContent === 'Chave');
  // A coluna Projeto só aparece em janelas largas (ds-opcional abaixo de 1240 px).
  await a.app.evaluate(({ BrowserWindow }) => { const j = BrowserWindow.getAllWindows()[0]; j.webContents.setZoomFactor(1); j.setSize(1500, 900); }); await p.waitForFunction(() => window.innerWidth > 1260);
  await ir(p, 'tickets'); const celula = p.locator('#tk-lista tbody tr').first().locator('td', { hasText: /^SMART$/ }); await celula.waitFor();
  assert.ok((await celula.boundingBox()).height < 48, 'a chave não quebra no meio da palavra');
  assert.equal((await celula.textContent()).trim(), 'SMART');
  assert.deepEqual(a.erros, []);
});
