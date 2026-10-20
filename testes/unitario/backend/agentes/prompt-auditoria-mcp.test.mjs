/** Garante que o roteiro de auditoria existe e não pode ser obtido sem sessão MCP autenticada. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { registrarRoteirosMcp } from '../../../../dist/agentes/mcp/roteirosMcp.js';
import { textoDoPrompt } from '../../../../dist/agentes/mcp/roteirosMcp.js';

test('auditar-codigo orienta revisão independente sem escrita', () => {
  const texto = textoDoPrompt('auditar-codigo', {area:'backend/login'});
  assert.match(texto,/backend\/login/);
  assert.match(texto,/revisão crítica independente/);
  assert.match(texto,/não edite/i);
});

test('o prompt auditar-codigo recusa cliente sem sessão, mesmo que MCP esteja iniciado', async t => {
  const anterior = process.env.PRUMO_DATA_DIR;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'prumo-prompt-auditoria-'));
  process.env.PRUMO_DATA_DIR=dir;
  t.after(()=>{if(anterior===undefined)delete process.env.PRUMO_DATA_DIR;else process.env.PRUMO_DATA_DIR=anterior;fs.rmSync(dir,{recursive:true,force:true});});
  const prompts=new Map();
  registrarRoteirosMcp({servidor:{registerPrompt:(nome,_config,handler)=>prompts.set(nome,handler)}});
  assert.ok(prompts.has('auditar-codigo'));
  await assert.rejects(prompts.get('auditar-codigo')({area:'backend/login'}),/MCP_SESSION_REQUIRED/);
});
