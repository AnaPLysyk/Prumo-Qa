import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { exe, versao, abrirPadrao, mcp } from './janela.mjs';
const ativo = process.env.PRUMO_MIGRACAO_27 === '1' && exe;
test('instalação 2.7 → atual preserva projeto, contexto exato, preferências e MCP; agenda nasce vazia e o worker sobe', { skip: !ativo && 'Etapa de atualização 2.7 do CI Windows instalado' }, async (t) => {
  const dados = path.join(process.env.LOCALAPPDATA, 'PrumoQA'); const antes = JSON.parse(fs.readFileSync(path.join(dados, 'instantaneo-2.7.0.json'))); assert.equal(antes.versao, '2.7.0');
  const { page, erros } = await abrirPadrao(t); await page.waitForFunction((v) => document.querySelector('#versao').textContent === 'v' + v, versao);
  const espacos = (await page.evaluate(() => window.prumo.espacos())).data; const e = espacos.find((x) => x.id === antes.espaco.id);
  assert.ok(e, 'projeto Prumo criado pela 2.7 continua listado'); assert.equal(e.nome, 'MIGRACAO-27'); assert.equal(e.raizContextos, antes.espaco.raizContextos);
  const c = await page.evaluate(([raiz, id]) => window.prumo.contextosObter(raiz, id), [antes.espaco.raizContextos, antes.contexto.id]); assert.ok(c.ok); assert.equal(c.data.hash, antes.contexto.hash); assert.equal(c.data.estado, 'RASCUNHO');
  const pref = (await page.evaluate(() => window.prumo.preferencias())).data.preferencias;
  assert.equal(pref.silenciar, true); assert.equal(pref.verificarAoIniciar, false); assert.equal(pref.tema, 'sistema'); assert.equal(pref.idioma, 'pt-BR'); assert.equal(pref.iniciarComWindows, false, 'iniciar com o Windows continua desligado'); assert.equal(pref.notificarAgenda, true);
  assert.deepEqual((await page.evaluate(() => window.prumo.agendaListar())).data, [], 'agenda nasce vazia'); const w = (await page.evaluate(() => window.prumo.workerEstado())).data; assert.equal(w.executando, true);
  const chamadas = await mcp(antes.espaco.raizContextos, null, [['contexto_projeto', {}], ['consultar_evidencias', {}]]); assert.ok(chamadas.every((r) => !r.isError)); assert.deepEqual(erros, []);
});
