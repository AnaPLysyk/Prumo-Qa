import test from 'node:test';
import assert from 'node:assert/strict';
import { criarRepositorio } from '../publicacao.mjs';
test('Editor salva e persiste',()=>{const r=criarRepositorio();assert.equal(r.salvar('Editor','a','Título').status,200);assert.equal(r.ler('a'),'Título');});
test('Leitor não altera publicação',()=>{const r=criarRepositorio();r.salvar('Editor','a','Antes');assert.equal(r.salvar('Leitor','a','Depois').status,403);assert.equal(r.ler('a'),'Antes');});
test('Limites 0, 1, 80, 81',()=>{for(const n of [0,1,80,81]){const r=criarRepositorio();assert.equal(r.salvar('Editor','a','x'.repeat(n)).status,n<1||n>80?422:200);}});
test('R1: perfil desconhecido, vazio ou com outra caixa é recusado com 403',()=>{for(const perfil of ['editor','EDITOR','Editor ','',null,undefined,'Admin'])assert.equal(criarRepositorio().salvar(perfil,'a','T').status,403,String(perfil));});
test('R2: título não textual é recusado com 422',()=>{for(const t of [null,undefined,5,{},['a']])assert.equal(criarRepositorio().salvar('Editor','a',t).status,422,String(t));});
test('R2: caracteres são pontos de código: 40 e 41 emojis cabem, 81 não',()=>{for(const [n,status] of [[40,200],[41,200],[80,200],[81,422]]){const r=criarRepositorio();assert.equal(r.salvar('Editor','a','😀'.repeat(n)).status,status,String(n));}});
test('R2: título só com espaços é recusado; espaços nas pontas não contam e não são gravados',()=>{
  for(const t of [' ','   ','\t\n'])assert.equal(criarRepositorio().salvar('Editor','a',t).status,422,JSON.stringify(t));
  const r=criarRepositorio();assert.equal(r.salvar('Editor','a','  Título  ').status,200);assert.equal(r.ler('a'),'Título');
  assert.equal(criarRepositorio().salvar('Editor','a',' '+'x'.repeat(80)+' ').status,200);assert.equal(criarRepositorio().salvar('Editor','a',' '+'x'.repeat(81)+' ').status,422);
});
test('R3: gravação recusada (título ou id inválido) não altera o valor existente',()=>{
  const r=criarRepositorio();r.salvar('Editor','a','Antes');
  assert.equal(r.salvar('Editor','a','').status,422);assert.equal(r.salvar('Editor','a','x'.repeat(81)).status,422);assert.equal(r.salvar('Leitor','a','Depois').status,403);assert.equal(r.salvar('Editor','','Depois').status,422);
  assert.equal(r.ler('a'),'Antes');assert.equal(r.ler(''),undefined);
});
test('R4: id vazio, só com espaços ou não textual é recusado com 422 e nada é gravado',()=>{
  for(const id of ['','  ',undefined,null,5,{}]){const r=criarRepositorio();assert.equal(r.salvar('Editor',id,'T').status,422,String(id));assert.equal(r.ler(id),undefined);}
});
test('R1 vence R4: perfil inválido com id inválido responde 403',()=>{assert.equal(criarRepositorio().salvar('Leitor','','T').status,403);});
