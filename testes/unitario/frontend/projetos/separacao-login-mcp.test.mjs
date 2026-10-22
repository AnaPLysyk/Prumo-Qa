/** Confere separação entre autenticação, integrações e o painel MCP sem conectar contas reais. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ler = arquivo => fs.readFileSync(arquivo, 'utf8');

test('painel MCP pertence a Agentes e não fica dentro do runtime compartilhado', async () => {
  const compartilhado = ler('frontend/compartilhado/runtime/app.js');
  const agente = ler('frontend/agentes/mostrarConfiguracaoMcp.js');
  const telaAgentes = ler('frontend/agentes/tela-agentes.parte.js');
  const integracao = ler('frontend/projetos/tela-projetos.js');
  assert.doesNotMatch(compartilhado, /async conexoes\(el\)/);
  assert.match(agente, /async function mostrarConfiguracaoMcp\(el, opcoes = \{\}\)/);
  assert.match(telaAgentes, /mostrarConfiguracaoMcp\(conteudo, \{ ia \}\)/);
  assert.match(integracao, /mostrarConfiguracaoMcp\(painelMcp\)/);
  const elementos = [];
  const contexto = {
    estado: { root: null },
    h: (tag, attrs, ...filhos) => ({ tag, attrs, filhos }),
    semProjeto: () => ({ texto: 'Selecione um projeto' }),
    api: {},
    chamar: async () => { throw Error('chamada externa não autorizada'); }
  };
  vm.createContext(contexto);
  vm.runInContext(agente, contexto);
  await contexto.mostrarConfiguracaoMcp({ append: (...itens) => elementos.push(...itens) });
  assert.ok(elementos.some(e => e.tag === 'h1'));
  assert.ok(elementos.some(e => e.texto === 'Selecione um projeto'));
});

test('Projetos carrega antes do painel MCP de Agentes e não expõe Conexões no menu', () => {
  const html = ler('frontend/compartilhado/runtime/index.html');
  const scripts = [
    'telas/projetos/tela-projetos.js',
    'telas/agentes/mostrarConfiguracaoMcp.js'
  ];
  let anterior = -1;
  for (const arquivo of scripts) {
    const atual = html.indexOf('src="' + arquivo + '"');
    assert.ok(atual > anterior, 'script carregado fora de ordem: ' + arquivo);
    anterior = atual;
  }
});

test('formulário de serviços e login têm pastas e responsabilidades distintas', () => {
  const conexoes = ler('frontend/projetos/tela-projetos.js');
  const login = ler('frontend/login/entrarNaConta.js');
  const cofre = ler('backend/conexoes/banco/credenciais.ts');
  assert.match(conexoes, /api\.servicoAdicionar|api\.qasePrever/);
  assert.doesNotMatch(conexoes, /api\.contaEntrar\(/);
  assert.match(login, /PrumoLoginRemoto/);
  assert.doesNotMatch(login, /api\.servicoAdicionar\(/);
  assert.match(cofre, /salvarCredencial|lerCredencial|removerCredencial/);
});

test('Projetos centraliza gestão de contas, operações e MCP por projeto', () => {
  const base = ler('frontend/projetos/tela-projetos.js');
  const operacoes = ler('frontend/projetos/tela-projetos.js');
  const integracoes = ler('frontend/projetos/tela-projetos.js');
  assert.match(base, /async function mostrarConexoesDoProjeto\(el, e, servicoDesejado = null, opcoes = \{\}\)/);
  assert.match(base, /await mostrarOperacoesExternas\(el,e\)/);
  assert.match(base, /await mostrarIntegracoesDosAgentes\(el,e\)/);
  assert.match(operacoes, /async function mostrarOperacoesExternas\(el,e\)/);
  assert.match(integracoes, /async function mostrarIntegracoesDosAgentes\(el,e\)/);
  assert.equal((base.match(/async function mostrarConexoesDoProjeto/g) || []).length, 1);
  assert.doesNotMatch(operacoes + integracoes, /conexoesBase|conexoesSemIntegracoes/);
  const html = ler('frontend/compartilhado/runtime/index.html');
  assert.doesNotMatch(html, /data-aba="conexoes"|telas\/conexoes\/tela-conexoes\.js/);
});
