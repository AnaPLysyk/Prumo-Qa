/** Segurança mínima: dois usuários no mesmo computador não compartilham dados locais nem trabalhos pendentes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {z} from 'zod';
import {entrarComIdentidadeRemota,idLocalDeIdentidadeRemota} from '../../../../dist/login/regras/entrarComIdentidadeRemota.js';
import {encerrarSessao} from '../../../../dist/login/regras/sessao.js';
import {diretorioDados} from '../../../../dist/compartilhado/banco/diretorioDados.js';
import {lerLocal} from '../../../../dist/compartilhado/banco/persistenciaLocal.js';
import {gravarLocal} from '../../../../dist/compartilhado/banco/persistenciaLocal.js';
import {executarNoEscopoDoUsuario} from '../../../../dist/compartilhado/banco/escopoDeUsuario.js';

test('sair, entrar em outra conta e operação tardia nunca misturam arquivos de usuários',async t=>{
  const antiga=process.env.PRUMO_DATA_DIR;
  const raiz=fs.mkdtempSync(path.join(os.tmpdir(),'prumo-mvp-isolado-'));
  process.env.PRUMO_DATA_DIR=raiz;
  t.after(()=>{encerrarSessao();if(antiga===undefined)delete process.env.PRUMO_DATA_DIR;else process.env.PRUMO_DATA_DIR=antiga;fs.rmSync(raiz,{recursive:true,force:true});});
  const a={id:'remotePessoaA001',email:'a@example.test',name:'Pessoa A',emailVerified:true};
  const b={id:'remotePessoaB001',email:'b@example.test',name:'Pessoa B',emailVerified:true};
  const schema=z.object({projeto:z.string()});
  const vazio={projeto:'NENHUM'};
  entrarComIdentidadeRemota(a,raiz);
  const caminhoA=diretorioDados();
  gravarLocal('privado.json',{projeto:'Somente A'});
  const leituraTardia=executarNoEscopoDoUsuario(idLocalDeIdentidadeRemota(a.id),async()=>{
    await new Promise(ok=>setTimeout(ok,5));
    gravarLocal('tardio.json',{projeto:'Tarefa A'});
    return diretorioDados();
  });
  encerrarSessao();
  assert.equal(lerLocal('privado.json',schema,vazio).projeto,'NENHUM','sem sessão não vê A');
  entrarComIdentidadeRemota(b,raiz);
  const caminhoB=diretorioDados();
  assert.notEqual(caminhoA,caminhoB);
  assert.equal(lerLocal('privado.json',schema,vazio).projeto,'NENHUM','B não vê A');
  gravarLocal('privado.json',{projeto:'Somente B'});
  assert.equal(await leituraTardia,caminhoA,'operação iniciada por A mantém a identidade A');
  assert.equal(lerLocal('tardio.json',schema,vazio).projeto,'NENHUM','B não vê trabalho de A');
  encerrarSessao();
  entrarComIdentidadeRemota(a,raiz);
  assert.equal(diretorioDados(),caminhoA);
  assert.equal(lerLocal('privado.json',schema,vazio).projeto,'Somente A');
  assert.equal(lerLocal('tardio.json',schema,vazio).projeto,'Tarefa A');
  assert.equal(fs.existsSync(path.join(raiz,'plataforma','privado.json')),false,'não usa mais pasta comum');
});
