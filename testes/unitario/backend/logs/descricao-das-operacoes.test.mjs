import test from 'node:test';
import assert from 'node:assert/strict';
import { descreverOperacao } from '../../../../dist/aplicativo/api/catalogoDeContratos.js';
import { resultadoRunnerSchema, ambienteDeTesteSchema } from '../../../../dist/testes/tipos/catalogoDeTestes.js';

test('canais e ferramentas MCP têm descrição em português; canal sem texto próprio fica sem descrição em vez de repetir o nome', () => {
  assert.match(descreverOperacao('contexto_projeto'), /contexto/i);
  assert.match(descreverOperacao('prumo:conta:entrar'), /senha/);
  assert.equal(descreverOperacao('prumo:canal:inexistente'), undefined);
  assert.equal(descreverOperacao('ferramenta_que_nao_existe'), undefined);
});

test('o relatório do runner aceita aparelho e navegador declarados e recusa campos soltos', () => {
  const base = { jobId: '11111111-1111-4111-8111-111111111111', cases: [{ id: 'a', status: 'PASS', evidence: 'ok' }] };
  const amb = { projeto: 'mobile', dispositivo: 'Pixel 7', navegador: 'chromium', versaoDoNavegador: '126', viewport: '412x915', plataforma: 'win32' };
  assert.equal(resultadoRunnerSchema.safeParse({ ...base, ambientes: [amb] }).success, true);
  assert.equal(resultadoRunnerSchema.safeParse(base).success, true, 'o campo é opcional: runners antigos continuam valendo');
  assert.equal(ambienteDeTesteSchema.safeParse({ ...amb, extra: 'x' }).success, false);
});
