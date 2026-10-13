import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { gravarContratoProposto } from '../../../dist/projetos/regras/gravarContratoProposto.js';
import { proporContrato } from '../../../dist/projetos/regras/proporContrato.js';
import { resumirContratoProposto as resumoProposta } from '../../../dist/projetos/regras/resumirContratoProposto.js';
import { situacaoProjeto } from '../../../dist/projetos/regras/situacaoProjeto.js';

/** Pastas temporárias montadas no teste: nenhum repositório real é lido. */
const pasta = (t, arquivos) => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo contrato '));
  t.after(() => fs.rmSync(raiz, { recursive: true, force: true }));
  for (const [rel, conteudo] of Object.entries(arquivos)) { const alvo = path.join(raiz, rel); fs.mkdirSync(path.dirname(alvo), { recursive: true }); if (conteudo !== null) fs.writeFileSync(alvo, conteudo); }
  return raiz;
};

test('contrato proposto (2.10.2): projeto npm ganha comandos só de scripts reais; e2e e deploy ficam bloqueados', async (t) => {
  const raiz = pasta(t, {
    'package.json': JSON.stringify({ name: '@empresa/loja-web', scripts: { test: 'vitest', 'test:unit': 'vitest run', build: 'tsc', lint: 'eslint .', 'test:e2e': 'playwright test', dev: 'vite', 'deploy-prod': 'x', start: 'node .' } }),
    'README.md': '# Loja', 'docs/guia.md': 'g', 'src/index.ts': 'x', 'tests/a.test.ts': 'x', '.env': 'SEGREDO=1', 'node_modules/x/index.js': 'x', 'dist/a.js': 'x'
  });
  const p = proporContrato(raiz); const m = p.manifesto;
  assert.deepEqual(p.stacks.map((s) => s.id), ['node']);
  assert.equal(m.id, 'loja-web'); assert.equal(m.name, '@empresa/loja-web');
  assert.deepEqual(Object.keys(m.commands).sort(), ['build', 'lint', 'test', 'test-e2e', 'test-unit'], 'só scripts de teste/build/lint; dev, start e deploy ficam de fora');
  assert.deepEqual(m.commands['test-unit'], { executable: 'npm', args: ['run', 'test:unit'], cwd: '.', env: {}, requiredFiles: [], requiredEnv: [] });
  assert.deepEqual(m.execution.blockedByDefault, ['test-e2e']); assert.equal(m.execution.readOnly, false); assert.equal(m.execution.requireApproval, true);
  assert.deepEqual(m.context, { documentation: ['docs', 'README.md'], tests: ['tests'], code: ['src', 'package.json'] });
  assert.ok(![...Object.values(m.context).flat()].some((c) => /\.env|node_modules|dist/.test(c)), 'nada sensível ou gerado no contexto');
  assert.deepEqual(fs.readdirSync(raiz).includes('qa.project.json'), false, 'propor não grava nada');
  assert.match(resumoProposta(p), /Será criado só o arquivo qa\.project\.json/);
  const projeto = await gravarContratoProposto(p);
  assert.equal(projeto.manifesto.id, 'loja-web'); assert.equal((await situacaoProjeto(raiz)).state, 'INTEGRADO');
});

test('contrato proposto: Python, Go, Java e .NET ficam somente leitura, com o comando nativo explicado', async (t) => {
  for (const [arquivos, stack, comando] of [
    [{ 'pyproject.toml': '[project]', 'tests/test_a.py': 'x', 'app/main.py': 'x' }, 'python', 'pytest'],
    [{ 'go.mod': 'module x', 'cmd/main.go': 'x', 'internal/a_test.go': 'x' }, 'go', 'go test ./...'],
    [{ 'pom.xml': '<project/>', 'src/main/A.java': 'x', 'src/test/ATest.java': 'x' }, 'maven', 'mvn test'],
    [{ 'Loja.sln': 'x', 'Loja/Loja.csproj': 'x' }, 'dotnet', 'dotnet test']
  ]) {
    const raiz = pasta(t, arquivos); const p = proporContrato(raiz);
    assert.deepEqual(p.stacks.map((s) => s.id), [stack]); assert.equal(p.stacks[0].comandoNativo, comando);
    assert.deepEqual(p.manifesto.commands, {}); assert.equal(p.manifesto.execution.readOnly, true);
    assert.ok(p.observacoes.some((o) => o.includes(comando) && /2\.11/.test(o)), `limite declarado para ${stack}`);
    await gravarContratoProposto(p); assert.equal((await situacaoProjeto(raiz)).state, 'INTEGRADO', stack);
  }
  const java = proporContrato(pasta(t, { 'pom.xml': '<project/>', 'src/test/A.java': 'x' }));
  assert.ok(java.manifesto.context.tests.includes('src/test'), 'testes do Maven em src/test');
});

test('contrato proposto: nunca sobrescreve, pasta sem stack fica só leitura e links simbólicos não entram', async (t) => {
  const existente = pasta(t, { 'qa.project.json': '{"meu":"contrato"}', 'package.json': '{}' });
  assert.throws(() => proporContrato(existente), /CONTRACT_EXISTS/);
  const vazia = pasta(t, { 'notas.txt': 'x' }); const p = proporContrato(vazia);
  assert.deepEqual(p.stacks, []); assert.equal(p.manifesto.execution.readOnly, true); assert.ok(p.observacoes.some((o) => /Nenhuma stack/.test(o)));
  // Corrida: alguém cria o arquivo entre a proposta e a aprovação. A gravação exclusiva recusa e preserva o arquivo da pessoa.
  fs.writeFileSync(path.join(vazia, 'qa.project.json'), 'meu');
  await assert.rejects(() => gravarContratoProposto(p), /EEXIST/); assert.equal(fs.readFileSync(path.join(vazia, 'qa.project.json'), 'utf8'), 'meu');
  const comLink = pasta(t, { 'package.json': '{"scripts":{"test":"x"}}', 'alvo/a.js': 'x' });
  try { fs.symlinkSync(path.join(comLink, 'alvo'), path.join(comLink, 'src'), 'junction'); } catch { return t.diagnostic('sem permissão para criar junction: parte do link não verificada'); }
  assert.ok(!proporContrato(comLink).manifesto.context.code.includes('src'), 'junction não entra no contexto');
});
