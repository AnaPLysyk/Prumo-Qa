import test from 'node:test';
import assert from 'node:assert/strict';
import { criarRepositorio } from '../publicacao.mjs';
test('Editor salva e persiste',()=>{const r=criarRepositorio();assert.equal(r.salvar('Editor','a','Título').status,200);assert.equal(r.ler('a'),'Título');});
test('Leitor não altera publicação',()=>{const r=criarRepositorio();r.salvar('Editor','a','Antes');assert.equal(r.salvar('Leitor','a','Depois').status,403);assert.equal(r.ler('a'),'Antes');});
test('Limites 0, 1, 80, 81',()=>{for(const n of [0,1,80,81]){const r=criarRepositorio();assert.equal(r.salvar('Editor','a','x'.repeat(n)).status,n<1||n>80?422:200);}});
