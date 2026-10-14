import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {exe,versao,abrirPadrao,mcp} from '../../../apoio/janela.mjs';
const ativo=process.env.PRUMO_MIGRACAO_26==='1'&&exe;
test('instalação 2.6 → atual preserva contexto exato, preferências, histórico e MCP', {skip:!ativo&&'Etapa de atualização 2.6 do CI Windows instalado'},async t=>{
  const dados=path.join(process.env.LOCALAPPDATA,'PrumoQA'),antes=JSON.parse(fs.readFileSync(path.join(dados,'instantaneo-2.6.0.json')));assert.equal(antes.versao,'2.6.0');
  const {page,erros}=await abrirPadrao(t);await page.waitForFunction(v=>document.querySelector('#versao').textContent==='v'+v,versao);
  const c=await page.evaluate(([raiz,id])=>window.prumo.contextosObter(raiz,id),[antes.raiz,antes.contexto.id]);assert.ok(c.ok);assert.equal(c.data.hash,antes.contexto.hash);assert.equal(c.data.estado,'RASCUNHO');assert.equal(c.data.versao,antes.contexto.versao);
  const pref=(await page.evaluate(()=>window.prumo.preferencias())).data.preferencias;assert.equal(pref.silenciar,true);assert.equal(pref.verificarAoIniciar,false);
  const v=(await page.evaluate(r=>window.prumo.visao(r),antes.raiz)).data;assert.equal(v.metrics.totalOperations,antes.totalOperations);assert.equal(v.metrics.executions.PASS,0);
  const chamadas=await mcp(antes.raiz,null,[['contexto_projeto',{}],['consultar_evidencias',{}]]);assert.ok(chamadas.every(r=>!r.isError));assert.deepEqual(erros,[]);
});
