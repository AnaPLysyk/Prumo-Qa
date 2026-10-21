/** A marca admin vem do serviço de identidade: concedida ou retirada lá, vale no próximo acesso. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {entrarComIdentidadeRemota} from '../../../../dist/login/regras/entradaPorProvedor.js';
import {lerContas} from '../../../../dist/login/banco/contas.js';
import {encerrarSessao} from '../../../../dist/login/regras/sessao.js';

test('administrador autorizado pelo serviço ganha a marca e a perde quando deixa de ser autorizado',t=>{
  const raiz=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-admin-remoto-'));
  t.after(()=>{encerrarSessao();fs.rmSync(raiz,{recursive:true,force:true});});
  const pessoa={id:'remotoAdmin00001',email:'admin@example.test',name:'Admin',emailVerified:true};
  entrarComIdentidadeRemota({...pessoa,administrador:true},raiz);
  assert.equal(lerContas(raiz).usuarios[0].admin,true);
  entrarComIdentidadeRemota({...pessoa,administrador:false},raiz);
  assert.equal(lerContas(raiz).usuarios[0].admin,false);
  entrarComIdentidadeRemota(pessoa,raiz);
  assert.equal(lerContas(raiz).usuarios[0].admin,false);
});

test('homologação: e-mail de teste vira admin sem o serviço; fora da homologação a variável é ignorada',t=>{
  const raiz=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-admin-homolog-'));
  const antes={a:process.env.PRUMO_AMBIENTE,l:process.env.PRUMO_HOMOLOGACAO_ADMINS};
  t.after(()=>{encerrarSessao();fs.rmSync(raiz,{recursive:true,force:true});for(const [k,v] of [['PRUMO_AMBIENTE',antes.a],['PRUMO_HOMOLOGACAO_ADMINS',antes.l]]){if(v===undefined)delete process.env[k];else process.env[k]=v;}});
  const pessoa={id:'remotoHomolog01',email:'Teste@Example.Test',name:'Teste',emailVerified:true};
  process.env.PRUMO_HOMOLOGACAO_ADMINS='teste@example.test, outra@example.test';
  delete process.env.PRUMO_AMBIENTE;
  entrarComIdentidadeRemota(pessoa,raiz);
  assert.equal(lerContas(raiz).usuarios[0].admin,false,'sem PRUMO_AMBIENTE=homologacao a lista não vale');
  process.env.PRUMO_AMBIENTE='homologacao';
  entrarComIdentidadeRemota(pessoa,raiz);
  assert.equal(lerContas(raiz).usuarios[0].admin,true);
  entrarComIdentidadeRemota({...pessoa,email:'outro@example.test'},raiz);
  assert.equal(lerContas(raiz).usuarios[0].admin,false,'e-mail fora da lista perde a marca');
});
