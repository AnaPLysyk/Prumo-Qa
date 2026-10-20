/** O MCP usa uma credencial efêmera do Electron, não um identificador de conta enviado pelo cliente. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { iniciarPonteDaSessaoMcp, renovarCredencialMcp, revogarCredencialMcp, fecharPonteDaSessaoMcp } from '../../../../dist/aplicativo/ponteDaSessaoMcp.js';
import { contaAutorizadaMcp, conferirAcessoMcp } from '../../../../dist/agentes/mcp/contaAutorizadaMcp.js';
import { gravarLocal } from '../../../../dist/compartilhado/banco/persistenciaLocal.js';

test('MCP só recebe a conta ativa: troca de conta invalida segredo antigo, sair e fechar revogam', async t => {
  const anterior = process.env.PRUMO_DATA_DIR;
  const dados = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-ponte-mcp-'));
  process.env.PRUMO_DATA_DIR = dados;
  t.after(() => {
    fecharPonteDaSessaoMcp();
    if (anterior === undefined) delete process.env.PRUMO_DATA_DIR;
    else process.env.PRUMO_DATA_DIR = anterior;
    fs.rmSync(dados, { recursive: true, force: true });
  });
  const a = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const b = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  let atual = null;
  await iniciarPonteDaSessaoMcp(async () => atual);
  assert.equal(await contaAutorizadaMcp(), null, 'sem login não há credencial de acesso');
  atual = a;
  renovarCredencialMcp();
  assert.equal(await contaAutorizadaMcp(), a);
  const arquivo = path.join(dados, 'plataforma', 'mcp-sessao.json');
  const antigo = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  atual = b;
  renovarCredencialMcp();
  assert.equal(await contaAutorizadaMcp(), b);
  gravarLocal('mcp-sessao.json', antigo, dados);
  await assert.rejects(contaAutorizadaMcp(), /MCP_SESSION_REQUIRED/, 'token de A não pode acessar B');
  renovarCredencialMcp();
  assert.equal(await contaAutorizadaMcp(), b);
  assert.throws(() => conferirAcessoMcp(b, 'propor_bugs'), /MCP_SESSION_REQUIRED/, 'uma identidade não cadastrada não ganha permissões');
  revogarCredencialMcp();
  assert.equal(fs.existsSync(arquivo), false, 'logout retira a credencial');
  gravarLocal('mcp-sessao.json', antigo, dados);
  await assert.rejects(contaAutorizadaMcp(), /MCP_SESSION_REQUIRED/, 'credencial antiga não revive após logout');
  fecharPonteDaSessaoMcp();
  assert.equal(fs.existsSync(arquivo), false);
});
