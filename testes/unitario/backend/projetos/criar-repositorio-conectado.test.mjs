/** Criação remota usa conta autenticada e escrita habilitada; serviço e vínculo simulados. */
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
const projeto = { id: 'projeto-fixture', vinculos: [] };
let habilitada = true, servico = 'github', identidade = 'conta-42', vinculos = [], escritas = [], diferente = false;
const resposta = { id: 42, full_name: 'pessoa/novo', name: 'novo' };
const ctx = { enviar: async (...args) => { escritas.push(args); return resposta; }, ler: async () => diferente ? { ...resposta, id: 43 } : resposta };
mock.module('../../../../dist/projetos/banco/projetos.js', { exports: { obterEspaco: () => projeto } });
mock.module('../../../../dist/projetos/servicoProjetos.js', { exports: { vincularServicoAoEspaco: (...args) => { vinculos.push(args); return { ...projeto, vinculos: [args[3]] }; } } });
mock.module('../../../../dist/conexoes/escrita/permissoes.js', { exports: { escritaHabilitada: () => habilitada } });
mock.module('../../../../dist/conexoes/servicoContas.js', { exports: {
  contaAtivaRenovada: async () => ({ id: 'conexao-fixture', servico, contaId: 'conta-42' }),
  adaptadorDaConta: () => ({ c: { servico: 'github', instancia: 'https://api.github.com', contaId: 'conta-42', token: 'credencial-ficticia' }, autenticar: async () => ({ contaId: identidade }), contexto: () => ctx })
} });
const { criarRepositorio } = await import('../../../../dist/conexoes/github/criarRepositorio.js');
const reset = () => { habilitada = true; servico = 'github'; identidade = 'conta-42'; projeto.vinculos = []; vinculos = []; escritas = []; diferente = false; };
test('cria repositório privado inicializado e vincula apenas após reler a mesma identidade', async () => {
  reset(); await criarRepositorio({}, projeto.id, 'conexao-fixture', 'novo', true);
  assert.equal(escritas[0][0], 'POST'); assert.equal(escritas[0][1], '/user/repos');
  assert.deepEqual(JSON.parse(escritas[0][2]), { name: 'novo', private: true, auto_init: true });
  assert.equal(vinculos.length, 1); assert.equal(vinculos[0][0], projeto.id); assert.equal(vinculos[0][3].id, '42');
});
test('conta errada, identidade trocada, vínculo existente e escrita desligada não criam repositório', async () => {
  for (const preparar of [() => { habilitada = false; }, () => { servico = 'jira'; }, () => { identidade = 'outra'; }, () => { projeto.vinculos = [{ servico: 'github' }]; }]) {
    reset(); preparar();
    await assert.rejects(criarRepositorio({}, projeto.id, 'conexao-fixture', 'novo', false));
    assert.equal(escritas.length, 0); assert.equal(vinculos.length, 0);
  }
});
test('releitura divergente informa falha sem registrar vínculo falso', async () => {
  reset(); diferente = true;
  await assert.rejects(criarRepositorio({}, projeto.id, 'conexao-fixture', 'novo', true), /CODE_REPOSITORY_NOT_CONFIRMED/);
  assert.equal(vinculos.length, 0);
});
