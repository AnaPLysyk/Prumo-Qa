/** Regras pessoais de Agentes › IA e regras: pertencem só à conta e chegam ao prompt da IA externa e ao MCP dela, nunca ao de outra conta. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { criarPrimeiraConta } from '../../utilitarios/contas-por-email.mjs';
import { criarContaPelaAdministracao } from '../../../../dist/administracao/servico.js';
import { entrarNaConta, sairDaConta, trocarMinhaSenha } from '../../../../dist/login/regras/contas.js';
import { encerrarSessao, contaDaSessao } from '../../../../dist/login/regras/sessao.js';
import { salvarPreferenciasDoAgente, regrasDaPessoaParaIa, PARA_TODOS_OS_AGENTES } from '../../../../dist/agentes/regras/agentesPessoais.js';
import { montarPrompt, montarPromptGeral } from '../../../../dist/agentes/chat/consultarIaExterna.js';
import { agentesChat } from '../../../../dist/agentes/tipos/persona.js';

const fatos = { linhas: ['Fato local'], fontes: [], fatos: [] };

test('regra para todos e regra por agente valem só para a conta que escreveu', async (t) => {
  const b = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-regras-pessoais-'));
  t.after(() => { encerrarSessao(); fs.rmSync(b, { recursive: true, force: true }); });
  const ana = (await criarPrimeiraConta({ email: 'ana-regras@prumo.test', nome: 'Ana Regras', senha: 'Nuvem-Verde-2026!' }, b)).conta;
  const joao = await criarContaPelaAdministracao({ login: 'joao.regras', nome: 'João Regras', papel: 'qa' }, b);
  salvarPreferenciasDoAgente(PARA_TODOS_OS_AGENTES, { apelido: '', orientacao: 'Responda em tópicos curtos' }, ana.id, b);
  salvarPreferenciasDoAgente('qa-geral', { apelido: '', orientacao: 'Cite sempre o ticket' }, ana.id, b);

  const daAna = regrasDaPessoaParaIa(ana.id, b);
  assert.equal(daAna.paraTodos, 'Responda em tópicos curtos');
  assert.deepEqual(daAna.porAgente.map((x) => [x.agente, x.regra]), [['qa-geral', 'Cite sempre o ticket']]);
  assert.match(daAna.aviso, /Nunca ampliam permissões/);
  assert.deepEqual({ ...regrasDaPessoaParaIa(joao.conta.id, b), aviso: '' }, { disponivel: true, paraTodos: null, porAgente: [], aviso: '' });
  assert.equal(regrasDaPessoaParaIa(null, b).disponivel, false, 'sem conta não há regra pessoal');

  const qa = agentesChat.find((a) => a.id === 'qa-geral');
  assert.equal(contaDaSessao(b)?.id, ana.id);
  const prompt = montarPrompt(qa, 'quais riscos?', fatos, 'direto', 'Prumo', { base: b, skill: '' });
  assert.match(prompt, /Regra pessoal da conta para todos os agentes: Responda em tópicos curtos\. Nunca amplia permissões/);
  assert.match(prompt, /Preferência individual da conta: Cite sempre o ticket/);
  assert.match(montarPromptGeral(qa, 'o que é regressão?', 'direto', 'Prumo', { base: b, skill: '' }), /Responda em tópicos curtos/, 'o modo automático também respeita a regra');

  sairDaConta(b);
  await entrarNaConta({ login: 'joao.regras', senha: joao.senhaTemporaria }, b);
  await trocarMinhaSenha({ atual: joao.senhaTemporaria, nova: 'Trilho-Azul-27-2026!' }, b);
  assert.equal(contaDaSessao(b)?.id, joao.conta.id);
  assert.doesNotMatch(montarPrompt(qa, 'quais riscos?', fatos, 'direto', 'Prumo', { base: b, skill: '' }), /tópicos curtos|Cite sempre o ticket/);
});

test('o id reservado "todos" é aceito; agente inexistente e o Orchestrator continuam recusados', () => {
  const b = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-regras-ids-'));
  try {
    const conta = '22222222-2222-4222-8222-222222222222';
    assert.deepEqual(salvarPreferenciasDoAgente('todos', { apelido: '', orientacao: 'Seja breve' }, conta, b), { apelido: '', orientacao: 'Seja breve' });
    assert.throws(() => salvarPreferenciasDoAgente('orquestrador', { apelido: '', orientacao: 'x' }, conta, b), /AGENT_NOT_FOUND/);
    assert.throws(() => salvarPreferenciasDoAgente('agente-que-nao-existe', { apelido: '', orientacao: 'x' }, conta, b), /AGENT_NOT_FOUND/);
    salvarPreferenciasDoAgente('todos', { apelido: '', orientacao: '' }, conta, b);
    assert.equal(regrasDaPessoaParaIa(conta, b).paraTodos, null, 'regra apagada deixa de valer');
  } finally { fs.rmSync(b, { recursive: true, force: true }); }
});
