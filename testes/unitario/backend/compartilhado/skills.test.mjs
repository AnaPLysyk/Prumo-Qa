/** Verificação estática de integridade e permissões das Skills; não abre banco nem serviços. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { raiz, fontesSkills, verificarSkills } from '../../../../ferramentas/skills/verificar.mjs';

test('manifesto corresponde às Skills e às políticas reais', () => {
  assert.deepEqual(verificarSkills(), { skills: 8, estado: 'VALIDADO_ESTATICAMENTE' });
});

test('capacidades externas permanecem somente da pessoa; execução exige autorização', () => {
  const { capacidades } = fontesSkills();
  for (const id of ['consultar_jira', 'consultar_qase', 'criar_casos_qase', 'abrir_bug_jira', 'enviar_resultados_qase', 'github_escrita']) assert.equal(capacidades.get(id), 'SOMENTE_PESSOA');
  assert.equal(capacidades.get('executar_testes'), 'EXIGE_AUTORIZACAO');
});

test('oito especializações têm profissão e área; interface distingue permissão efetiva', () => {
  const fonte = fs.readFileSync(path.join(raiz, 'backend/agentes/tipos/politicas.ts'), 'utf8');
  const perfis = [...fonte.matchAll(/skill: '([^']+)', capacidades: \[[^\]]*\], profissao: '([^']+)', especialidade: '([^']+)'/g)];
  assert.equal(perfis.length, 8);
  assert.equal(new Set(perfis.map(p => p[1])).size, 8);
  assert.ok(perfis.every(p => p[2].length > 8 && p[3].length > 8));
  const persona = fs.readFileSync(path.join(raiz, 'backend/agentes/tipos/persona.ts'), 'utf8');
  assert.match(persona, /profissao: perfil\?\.profissao/);
  const tela = fs.readFileSync(path.join(raiz, 'frontend/agentes/mostrarAgentesIntegrados.js'), 'utf8');
  assert.match(tela, /x\.profissao/); assert.match(tela, /x\.especialidade/);
  assert.match(tela, /Permissões efetivas/); assert.match(tela, /s\.matriz\.map/);
});
