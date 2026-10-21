import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { criarRepositorio } from '../publicacao.mjs';
const cases=[];
function verificar(id,fn){try{fn();cases.push({id,status:'PASS',evidence:'Assertions de autorização, retorno e persistência executadas.'});}catch(e){cases.push({id,status:'FAIL',evidence:e.message});}}
verificar('R1-editor',()=>{const r=criarRepositorio();assert.equal(r.salvar('Editor','a','Título').status,200);assert.equal(r.ler('a'),'Título');});
verificar('R1-leitor',()=>{const r=criarRepositorio();r.salvar('Editor','a','Antes');assert.equal(r.salvar('Leitor','a','Depois').status,403);assert.equal(r.ler('a'),'Antes');});
verificar('R1-perfil-desconhecido',()=>{for(const perfil of ['editor','EDITOR','Editor ','',null,undefined,'Admin'])assert.equal(criarRepositorio().salvar(perfil,'a','T').status,403);});
for(const n of [0,1,80,81])verificar(`R2-limite-${n}`,()=>{const r=criarRepositorio();const status=r.salvar('Editor','a','x'.repeat(n)).status;assert.equal(status,n<1||n>80?422:200);});
for(const [n,status] of [[41,200],[80,200],[81,422]])verificar(`R2-emoji-${n}`,()=>{assert.equal(criarRepositorio().salvar('Editor','a','😀'.repeat(n)).status,status);});
verificar('R2-titulo-so-espacos',()=>{for(const t of [' ','   ','\t\n'])assert.equal(criarRepositorio().salvar('Editor','a',t).status,422);});
verificar('R2-espacos-nas-pontas',()=>{const r=criarRepositorio();assert.equal(r.salvar('Editor','a','  Título  ').status,200);assert.equal(r.ler('a'),'Título');});
verificar('R2-titulo-nao-textual',()=>{for(const t of [null,undefined,5,{},['a']])assert.equal(criarRepositorio().salvar('Editor','a',t).status,422);});
verificar('R3-recusa-preserva',()=>{const r=criarRepositorio();r.salvar('Editor','a','Antes');assert.equal(r.salvar('Editor','a','').status,422);assert.equal(r.salvar('Editor','a','x'.repeat(81)).status,422);assert.equal(r.salvar('Leitor','a','Depois').status,403);assert.equal(r.ler('a'),'Antes');});
verificar('R3-aceita-persiste',()=>{const r=criarRepositorio();r.salvar('Editor','a','Antes');assert.equal(r.salvar('Editor','a','Depois').status,200);assert.equal(r.ler('a'),'Depois');});
verificar('R4-id-invalido',()=>{for(const id of ['','  ',undefined,null,5,{}]){const r=criarRepositorio();assert.equal(r.salvar('Editor',id,'T').status,422);assert.equal(r.ler(id),undefined);}});
console.log(JSON.stringify({cases}));
if(process.env.PRUMO_RESULT_FILE)writeFileSync(process.env.PRUMO_RESULT_FILE,JSON.stringify({jobId:process.env.PRUMO_JOB_ID,cases}));
if(cases.some(c=>c.status==='FAIL'))process.exitCode=1;
