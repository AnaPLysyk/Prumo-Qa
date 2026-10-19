import test from 'node:test';
import assert from 'node:assert/strict';
import {verificarEsquemaDaAutenticacao} from '../../../../backend/login/regras/verificarEsquema.mjs';

const completas = {usuario:'user',sessao:'session',conta:'account',verificacao:'verification'};

test('saude do login requer as quatro tabelas, nao apenas SELECT 1', async () => {
  let consulta = '';
  const pool = {query: async sql => {consulta=sql;return {rows:[completas]};}};
  await verificarEsquemaDaAutenticacao(pool);
  for (const tabela of ['user','session','account','verification'])
    assert.ok(consulta.includes(`to_regclass('"${tabela}"')`), tabela);
  assert.doesNotMatch(consulta,/SELECT\s+1/i);
});

test('banco vazio, esquema parcial ou resultado ausente impedem login', async () => {
  for (const esquema of [null, {}, {...completas, usuario:null}, {...completas, verificacao:null}]) {
    const pool = {query: async () => ({rows:esquema===null?[]:[esquema]})};
    await assert.rejects(() => verificarEsquemaDaAutenticacao(pool),/AUTH_SCHEMA_REQUIRED/);
  }
});

test('falha de conexao nao e mascarada pelo health check', async () => {
  const pool = {query: async () => {throw new Error('CONNECTION_REFUSED');}};
  await assert.rejects(() => verificarEsquemaDaAutenticacao(pool),/CONNECTION_REFUSED/);
});
