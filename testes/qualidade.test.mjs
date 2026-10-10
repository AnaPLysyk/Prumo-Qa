import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './fixtures.mjs';
import { carregarProjeto } from '../dist/projeto.js';
import { revisarCobertura } from '../dist/qualidade.js';
const candidato={id:'A',behavior:'Editor grava',source:'R1',risk:'Alteração indevida',expected:'200 e persistência',oracle:'nova leitura',technique:'equivalence',partition:'Editor'};
const plano={requirement:'R1: Apenas Editor grava.',source:'README R1',sourcePath:'README.md',existingTests:[],candidates:[candidato]};
test('rastreabilidade, fonte real e proposta nunca PASS',async t=>{
  const f=await fixture(t);const r=await revisarCobertura(await carregarProjeto(f.root),plano);
  assert.equal(r.state,'NOT_VERIFIED');assert.equal(r.executed,false);assert.equal(r.missing.length,0);assert.equal(r.facts[0].requirementFoundVerbatim,true);assert.deepEqual(r.suggestedSelection,['A']);
});
test('redundância candidata comparada com teste real, não quantidade fixa',async t=>{
  const f=await fixture(t);const r=await revisarCobertura(await carregarProjeto(f.root),{...plano,existingTests:[{...candidato,id:'existente',testPath:'tests/test.mjs'}]});
  assert.ok(r.findings.some(f=>f.type==='POTENTIAL_REDUNDANCY'));assert.deepEqual(r.suggestedSelection,[]);
});
test('limites diferentes não são colapsados por mesma classe válida',async t=>{
  const f=await fixture(t);const r=await revisarCobertura(await carregarProjeto(f.root),{...plano,candidates:[{...candidato,id:'L1',technique:'boundary',boundary:1},{...candidato,id:'L80',technique:'boundary',boundary:80}]});
  assert.deepEqual(r.suggestedSelection,['L1','L80']);assert.ok(!r.findings.some(f=>f.type==='POTENTIAL_REDUNDANCY'));
});
test('autorização: Editor e Leitor são partições distintas, ambas justificadas',async t=>{
  const f=await fixture(t);const r=await revisarCobertura(await carregarProjeto(f.root),{...plano,candidates:[candidato,{...candidato,id:'B',behavior:'Leitor grava',partition:'Leitor',expected:'403 sem mutação'}]});
  assert.deepEqual(r.suggestedSelection,['A','B']);
});
test('falta de requisito, oráculo, risco e fonte expõe lacunas, sem inventar',async t=>{
  const f=await fixture(t);const r=await revisarCobertura(await carregarProjeto(f.root),{requirement:'',source:'',existingTests:[],candidates:[{id:'A',behavior:'clicar botão'}]});
  assert.ok(r.findings.some(f=>f.type==='MISSING_REQUIREMENT'));assert.ok(r.findings.some(f=>f.type==='MISSING_ORACLE'));assert.ok(r.missing.length>=4);assert.equal(r.state,'NOT_VERIFIED');
});
test('contradição fornecida e teste ignorado permanecem lacunas',async t=>{
  const f=await fixture(t);await f.write('tests/test.mjs','test.skip("a",()=>{});');
  const r=await revisarCobertura(await carregarProjeto(f.root),{...plano,contradictions:[{source:'R2',statement:'Leitor também deve gravar'}],existingTests:[{...candidato,testPath:'tests/test.mjs'}]});
  assert.ok(r.findings.some(f=>f.type==='CONTRADICTORY_REQUIREMENT'));assert.ok(r.findings.some(f=>f.type==='WEAK_TEST'));
});
test('teste inexistente não comprova cobertura nem remove candidato',async t=>{
  const f=await fixture(t);const r=await revisarCobertura(await carregarProjeto(f.root),{...plano,existingTests:[{...candidato,testPath:'tests/ausente.mjs'}]});
  assert.ok(r.findings.some(f=>f.type==='UNVERIFIED_TEST'));assert.deepEqual(r.suggestedSelection,['A']);
});
test('payload não admite resultado fabricado ou execução arbitrária',async t=>{
  const f=await fixture(t);await assert.rejects(revisarCobertura(await carregarProjeto(f.root),{...plano,status:'PASS',command:'apagar'}));
});
