import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { versao, exe, ir, mcp, abrirPadrao } from '../../../apoio/janela.mjs';

/**
 * Atualização 2.2.0 → 2.3.0 sobre dados REAIS criados pela 2.2.0 instalada (ferramentas/migracao/preparar-dados-22.mjs),
 * no diretório de dados padrão do usuário. Só roda no CI de instalação: PRUMO_MIGRACAO=1 e PRUMO_APP_EXE.
 */
const ativo = process.env.PRUMO_MIGRACAO === '1' && exe;
const dados = path.join(process.env.LOCALAPPDATA ?? '', 'PrumoQA');
const lerInstantaneo = () => JSON.parse(fs.readFileSync(path.join(dados, 'instantaneo-2.2.0.json'), 'utf8'));
const opcoes = { skip: !ativo && 'defina PRUMO_MIGRACAO=1 e PRUMO_APP_EXE (executado no workflow de instalação)' };

test('migração: versão nova, vínculo, histórico, métricas e evidências da 2.2.0 preservados', opcoes, async (t) => {
  const antes = lerInstantaneo();
  assert.equal(antes.versao, '2.2.0');
  const { page, erros } = await abrirPadrao(t);
  assert.equal((await page.textContent('#versao')).trim(), 'v' + versao); assert.match(versao, /^\d+\.\d+\.\d+$/);
  assert.equal(fs.readFileSync(path.join(dados, 'marca-migracao.txt'), 'utf8'), 'dados criados pela versão 2.2.0', 'dados do usuário intactos');
  const projetos = (await page.evaluate(() => window.prumo.projetos())).data;
  assert.equal(projetos.length, 1); assert.equal(projetos[0].state, 'INTEGRADO'); assert.equal(projetos[0].id, 'prumo-demo'); assert.equal(projetos[0].root.toLowerCase(), fs.realpathSync(antes.raizDemonstracao).toLowerCase());
  const v = (await page.evaluate((r) => window.prumo.visao(r), projetos[0].root)).data;
  assert.equal(v.metrics.totalOperations, 3); assert.equal(v.metrics.mcpCalls, 3); assert.equal(v.metrics.coverageReviews, 1);
  assert.equal(v.metrics.executions.BLOCKED, 1); assert.equal(v.metrics.executions.PASS, 0); assert.equal(v.metrics.complete, true);
  const ev = (await page.evaluate((r) => window.prumo.evidencias(r), projetos[0].root)).data;
  assert.equal(ev.results.length, 1); assert.equal(ev.results[0].status, 'BLOCKED');
  await ir(page, 'ajuda'); await page.click('.indice button:has-text("Versões")'); await page.waitForTimeout(300);
  assert.match(await page.textContent('details.versao[open] summary'), new RegExp(versao.replaceAll('.', '\\.') + '[\\s\\S]*instalada'));
  assert.deepEqual(erros, []);
});

test('migração: o MCP configurado como na 2.2.0 (mesmo executável e mcp.js) continua utilizável, informa 2.3.0 e acrescenta ao histórico', opcoes, async () => {
  const antes = lerInstantaneo();
  // Mesma forma de configuração que a 2.2.0 propunha: executável do app em modo Node + <instalação>\resources\app\dist\mcp.js.
  assert.ok(fs.existsSync(path.join(path.dirname(exe), 'resources', 'app', 'dist', 'mcp.js')));
  const [ctx, evid] = await mcp(antes.raizDemonstracao, null, [['contexto_projeto', {}], ['consultar_evidencias', {}]]);
  assert.ok(!ctx.isError && !evid.isError);
  assert.equal(JSON.parse(evid.content[0].text).results.length, 1, 'evidência da 2.2.0 legível pela 2.3.0');
});

test('migração: histórico da 2.2.0 e chamada nova da 2.3.0 convivem; execução protegida segue bloqueada', opcoes, async (t) => {
  const antes = lerInstantaneo();
  const { page } = await abrirPadrao(t);
  const raiz = (await page.evaluate(() => window.prumo.projetos())).data[0].root;
  const v = (await page.evaluate((r) => window.prumo.visao(r), raiz)).data;
  assert.equal(v.metrics.totalOperations, 5, '3 da 2.2.0 + 2 feitas pela 2.3.0 no teste anterior');
  assert.equal(v.metrics.executions.PASS, 0); assert.equal(v.metrics.errors, 0);
  const [exec] = await mcp(antes.raizDemonstracao, null, [['executar_validacao', { capability: 'unit' }]]);
  assert.equal(JSON.parse(exec.content[0].text).status, 'BLOCKED');
});
