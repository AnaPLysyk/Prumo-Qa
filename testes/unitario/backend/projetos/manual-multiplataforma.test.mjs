/** Manual/Prumo: ativação por projeto, migração, persistência e bloqueio real em qualquer sistema operacional. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { criarEspaco, configurarManualDoEspaco } from '../../../../dist/projetos/servicoProjetos.js';
import { obterEspaco } from '../../../../dist/projetos/banco/projetos.js';
import { salvarCasoLocal, salvarSuiteLocal, listarRepositorioLocal } from '../../../../dist/testes/servicoCasos.js';
import { criarProposta } from '../../../../dist/tickets/servicoPropostas.js';
import { registro } from '../../../../dist/projetos/contratos.js';
import { githubWindowsDisponivel } from '../../../../dist/conexoes/integracoes/credencialGitHubWindows.js';

const baseTemporaria = t => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-manual-cross-platform-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  return base;
};

test('esquema de projeto legado preserva manual ativo por padrão em Windows, macOS e Linux', () => {
  const antigo = { id:'00000000-0000-4000-8000-000000000001', nome:'Anterior', descricao:'',
    criadoEm:new Date().toISOString(), raizContextos:'/tmp/projeto', vinculos:[],relacoes:[],historico:[] };
  for (const plataforma of ['win32','darwin','linux']) {
    const r = registro.parse({version:1,espacos:[antigo]});
    assert.equal(r.espacos[0].manualAtivo,true, 'migração '+plataforma);
  }
  assert.equal(githubWindowsDisponivel(),process.platform==='win32');
});

test('manual desligado bloqueia casos, suítes e propostas; preserva o histórico e não afeta outro projeto', async t => {
  const base = baseTemporaria(t);
  const a = await criarEspaco({nome:'Manual ligado'},base);
  const b = await criarEspaco({nome:'Outro projeto'},base);
  assert.equal(a.manualAtivo,true);
  const caso = salvarCasoLocal({espacoId:a.id,dados:{titulo:'Caso antigo válido'}},base);
  salvarSuiteLocal({espacoId:a.id,titulo:'Suíte antiga'},base);
  configurarManualDoEspaco(a.id,false,base);
  assert.equal(obterEspaco(a.id,base).manualAtivo,false);
  assert.equal(obterEspaco(b.id,base).manualAtivo,true);
  assert.throws(()=>salvarCasoLocal({espacoId:a.id,dados:{titulo:'Não deve criar'}},base),/MANUAL_DISABLED/);
  assert.throws(()=>salvarSuiteLocal({espacoId:a.id,titulo:'Não deve criar'},base),/MANUAL_DISABLED/);
  assert.throws(()=>criarProposta({espacoId:a.id,tipo:'bug',origem:'PESSOA',dados:{resumo:'Não deve criar'}},base),/MANUAL_DISABLED/);
  assert.equal(listarRepositorioLocal(a.id,base).casos.some(c=>c.id===caso.id),true,'dados antigos permanecem');
  assert.equal(listarRepositorioLocal(a.id,base).suites.length,1);
  const outro = salvarCasoLocal({espacoId:b.id,dados:{titulo:'Caso independente'}},base);
  assert.ok(outro.id);
  configurarManualDoEspaco(a.id,true,base);
  const reativado = salvarCasoLocal({espacoId:a.id,dados:{titulo:'Novo após reativar'}},base);
  assert.ok(reativado.id);
});
