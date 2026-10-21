import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { registrarAuditoria, lerAuditoria } from '../../../../dist/logs/banco/diagnostico.js';
import { registrarOrquestracao } from '../../../../dist/agentes/banco/orquestracao.js';

const evento=(usuarioId,espacoId,canal='testes:gravar')=>({
  canal, tipo:'ALTERACAO', estado:'OK', usuarioId, espacoId,
  correlacao:randomUUID(), duracaoMs:25, codigo:null,
  agente:null, ambiente:null, dispositivo:null, navegador:null
});
test('auditoria grava ações tipadas sem texto livre, separada por conta e recuperável',t=>{
  const a=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-log-a-'));
  const b=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-log-b-'));
  t.after(()=>{fs.rmSync(a,{recursive:true,force:true});fs.rmSync(b,{recursive:true,force:true});});
  const usuarioA=randomUUID(),usuarioB=randomUUID(), projeto=randomUUID();
  assert.equal(registrarAuditoria(evento(usuarioA,projeto),a),true);
  assert.equal(registrarAuditoria(evento(usuarioB,projeto,'agentes:pessoalsalvar'),b),true);
  assert.equal(lerAuditoria(a).eventos.length,1);
  assert.equal(lerAuditoria(b).eventos.length,1);
  assert.equal(lerAuditoria(a).eventos[0].usuarioId,usuarioA);
  assert.equal(lerAuditoria(a).eventos[0].canal,'testes:gravar');
  assert.equal(lerAuditoria(a).eventos[0].navegador,null,'não inventa navegador');
  assert.ok(!JSON.stringify(lerAuditoria(a)).includes('senha'));
  assert.equal(registrarAuditoria({...evento(usuarioA,projeto),senha:'segredo'},a),false,'recusa campos livres');
  fs.appendFileSync(path.join(a,'auditoria.jsonl'),'invalid-json\n');
  const leitura=lerAuditoria(a);
  assert.equal(leitura.eventos.length,1,'registro correto sobrevive ao malformado');
  assert.equal(leitura.invalidos,1,'sinaliza corrupção');
});
test('orquestração registra cada mudança real de especialista nos Logs e resultado terminal', t=>{
  const b=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-audit-steps-'));
  t.after(()=>fs.rmSync(b,{recursive:true,force:true}));
  const espacoId=randomUUID(),id=randomUUID();
  const o={id,em:new Date().toISOString(),espacoId,responsavel:'orquestrador',modo:'LOCAL',
    motivo:[],agentes:['regressao','requisitos'],dependencias:'INDEPENDENTES',
    etapas:[],estado:'EXECUTANDO',duracaoMs:0,emExecucao:'regressao'};
  registrarOrquestracao(o,b);
  registrarOrquestracao({...o,emExecucao:'requisitos',etapas:[{ordem:1,agente:'regressao',inicio:o.em,fim:o.em,duracaoMs:0,estado:'CONCLUIDA',fontes:['Execuções'],fatos:[],linhas:2}],duracaoMs:12},b);
  registrarOrquestracao({...o,emExecucao:undefined,estado:'CONCLUIDA',duracaoMs:24},b);
  const eventos=lerAuditoria(b).eventos;
  assert.deepEqual(eventos.map(x=>x.estado),['EXECUTANDO','EXECUTANDO','CONCLUIDA']);
  assert.deepEqual(eventos.map(x=>x.agente),['regressao','requisitos',null]);
  assert.ok(eventos.every(x=>x.correlacao===id&&x.espacoId===espacoId));
  assert.ok(eventos.every(x=>x.navegador===null&&x.dispositivo===null));
});
