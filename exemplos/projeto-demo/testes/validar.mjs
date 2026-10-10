import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { criarRepositorio } from '../publicacao.mjs';
const cases=[];
function verificar(id,fn){try{fn();cases.push({id,status:'PASS',evidence:'Assertions de autorização, retorno e persistência executadas.'});}catch(e){cases.push({id,status:'FAIL',evidence:e.message});}}
verificar('R1-editor',()=>{const r=criarRepositorio();assert.equal(r.salvar('Editor','a','Título').status,200);assert.equal(r.ler('a'),'Título');});
verificar('R1-leitor',()=>{const r=criarRepositorio();r.salvar('Editor','a','Antes');assert.equal(r.salvar('Leitor','a','Depois').status,403);assert.equal(r.ler('a'),'Antes');});
for(const n of [0,1,80,81])verificar(`R2-limite-${n}`,()=>{const r=criarRepositorio();const status=r.salvar('Editor','a','x'.repeat(n)).status;assert.equal(status,n<1||n>80?422:200);});
console.log(JSON.stringify({cases}));
if(process.env.PRUMO_RESULT_FILE)writeFileSync(process.env.PRUMO_RESULT_FILE,JSON.stringify({jobId:process.env.PRUMO_JOB_ID,cases}));
if(cases.some(c=>c.status==='FAIL'))process.exitCode=1;
