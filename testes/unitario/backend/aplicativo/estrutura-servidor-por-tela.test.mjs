import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const raiz=fileURLToPath(new URL('../../../../',import.meta.url));
const existe=(rel)=>fs.existsSync(path.join(raiz,rel));
test('API HTTP obedece a arquitetura de backend por tela e nao mantém pasta de servicos paralela',()=>{
  assert.equal(existe('servico-do-prumo'),false,'nenhuma pasta separada de serviços na raiz');
  for(const arquivo of [
    'backend/aplicativo/servidor/servidor.mjs',
    'backend/login/servidor/autenticacao.mjs',
    'backend/login/servidor/recuperar-senha.html',
    'backend/login/servidor/migrar-autenticacao.mjs',
    'backend/suporte/servidor/chamados.mjs',
    'backend/suporte/servidor/github.mjs',
    'backend/compartilhado/servidor/comum.mjs',
    'backend/login/servidor/package.json',
    'backend/login/servidor/package-lock.json',
  ]) assert.ok(existe(arquivo),arquivo);
  assert.ok(existe('frontend/login/entrarNaConta.js'),'tela de login preservada');
  const principal=fs.readFileSync(path.join(raiz,'backend/aplicativo/servidor/servidor.mjs'),'utf8');
  assert.match(principal,/\.\.\/\.\.\/login\/servidor\/codigos\.mjs/);
  assert.match(principal,/\.\.\/\.\.\/suporte\/servidor\/chamados\.mjs/);
  const blueprint=fs.readFileSync(path.join(raiz,'render.yaml'),'utf8');
  assert.ok(blueprint.includes('rootDir: backend/login/servidor'));
  assert.ok(blueprint.includes('startCommand: node ../../aplicativo/servidor/servidor.mjs'));
});
