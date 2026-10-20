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
  const integracao = ler('frontend/conexoes/mostrarIntegracoesDosAgentes.js');
  assert.doesNotMatch(compartilhado, /async conexoes\(el\)/);
  assert.match(agente, /async function mostrarConfiguracaoMcp\(el\)/);
  assert.match(telaAgentes, /mostrarConfiguracaoMcp\(clientContent\)/);
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

test('ordem dos scripts carrega o painel de Agentes antes da tela Conexões', () => {
  const html = ler('frontend/compartilhado/runtime/index.html');
  const scripts = [
    'telas/agentes/mostrarConfiguracaoMcp.js',
    'telas/conexoes/mostrarConexoes.js',
    'telas/conexoes/mostrarOperacoesExternas.js',
    'telas/conexoes/mostrarIntegracoesDosAgentes.js'
  ];
  let anterior = -1;
  for (const arquivo of scripts) {
    const atual = html.indexOf('src="' + arquivo + '"');
    assert.ok(atual > anterior, 'script carregado fora de ordem: ' + arquivo);
    anterior = atual;
  }
});

test('formulário de serviços e login têm pastas e responsabilidades distintas', () => {
  const conexoes = ler('frontend/conexoes/mostrarConexoes.js');
  const login = ler('frontend/login/entrarNaConta.js');
  const cofre = ler('backend/conexoes/banco/cofreCredenciais.ts');
  assert.match(conexoes, /api\.servicoAdicionar|api\.qasePrever/);
  assert.doesNotMatch(conexoes, /api\.contaEntrar\(/);
  assert.match(login, /PrumoLoginRemoto/);
  assert.doesNotMatch(login, /api\.servicoAdicionar\(/);
  assert.match(cofre, /salvarCredencial|lerCredencial|removerCredencial/);
});

test('Conexões registra a tela uma vez e chama os complementos pelo nome', () => {
  const base = ler('frontend/conexoes/mostrarConexoes.js');
  const operacoes = ler('frontend/conexoes/mostrarOperacoesExternas.js');
  const integracoes = ler('frontend/conexoes/mostrarIntegracoesDosAgentes.js');
  assert.match(base, /abas\.conexoes\s*=\s*async/);
  assert.match(base, /await mostrarOperacoesExternas\(el\)/);
  assert.match(base, /await mostrarIntegracoesDosAgentes\(el\)/);
  assert.match(operacoes, /async function mostrarOperacoesExternas\(el\)/);
  assert.match(integracoes, /async function mostrarIntegracoesDosAgentes\(el\)/);
  assert.doesNotMatch(operacoes + integracoes, /abas\.conexoes\s*=/);
  assert.doesNotMatch(operacoes + integracoes, /conexoesBase|conexoesSemIntegracoes/);
  const html = ler('frontend/compartilhado/runtime/index.html');
  assert.ok(html.indexOf('telas/conexoes/mostrarConexoes.js') < html.indexOf('telas/conexoes/mostrarOperacoesExternas.js'));
  assert.ok(html.indexOf('telas/conexoes/mostrarOperacoesExternas.js') < html.indexOf('telas/conexoes/mostrarIntegracoesDosAgentes.js'));
});
