import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fixture } from '../../infra/fixtures.mjs';
import { carregarProjeto } from '../../../../dist/compartilhado/projeto/carregarProjeto.js';
import { hash } from '../../../../dist/compartilhado/seguranca/hash.js';
import { executarValidacao } from '../../../../dist/testes/regras/executarValidacao.js';
import { revisarCobertura } from '../../../../dist/testes/regras/revisarCobertura.js';

test('readonly bloqueia execução sem gravar no projeto',async t=>{
  const f=await fixture(t);f.manifest.execution.readOnly=true;await f.save();const antes=(await fs.readdir(f.root)).sort();
  const e=await executarValidacao(await carregarProjeto(f.root),'unit',true);assert.equal(e.status,'BLOCKED');assert.equal(e.persisted,false);assert.deepEqual((await fs.readdir(f.root)).sort(),antes);
});
test('tabela de decisão e estados exigem condições; óraculo ainda é necessário',async t=>{
  const f=await fixture(t);const r=await revisarCobertura(await carregarProjeto(f.root),{requirement:'R1',source:'fonte fornecida',existingTests:[],candidates:[{id:'d',behavior:'desconto',technique:'decision_table'},{id:'s',behavior:'aprovar estado',technique:'state_transition'}]});
  assert.equal(r.findings.filter(f=>f.type==='MISSING_CONDITIONS').length,2);assert.ok(r.findings.some(f=>f.type==='MISSING_ORACLE'));assert.equal(r.executed,false);
});
test('fixture de suíte ignorada não torna candidato redundante',async t=>{
  const f=await fixture(t);await f.write('tests/test.mjs','test.skip("ignorado",()=>{});');
  const c={id:'A',behavior:'salvar',source:'R1',risk:'perda',expected:'persistir',oracle:'nova leitura',technique:'equivalence'};
  const r=await revisarCobertura(await carregarProjeto(f.root),{requirement:'R1',source:'requisito',existingTests:[{...c,id:'existente',testPath:'tests/test.mjs'}],candidates:[c]});
  assert.deepEqual(r.suggestedSelection,['A']);assert.ok(!r.findings.some(f=>f.type==='POTENTIAL_REDUNDANCY'));
});
