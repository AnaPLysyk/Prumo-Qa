/** Conexões: impede mistura de responsabilidades e garante carregamento dos módulos da tela. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const base = 'frontend/conexoes/';
const arquivos = [
  'componentes/apresentarProjetosQase.js',
  'componentes/mostrarPermissoesConexao.js',
  'abrirFormularioConexao.js',
  'mostrarConexoes.js',
  'mostrarOperacoesExternas.js',
  'mostrarIntegracoesDosAgentes.js'
];
const ler = nome => fs.readFileSync(base + nome, 'utf8');

test('Conexões mantém listagem, seleção Qase, permissões e formulário em arquivos distintos', () => {
  const [qase, permissoes, formulario, principal] = arquivos.slice(0, 4).map(ler);
  assert.match(qase, /function criarApresentacaoProjetosQase/);
  assert.match(qase, /qaseImportar\(/);
  assert.match(permissoes, /function blocoPermissoes\(/);
  assert.match(permissoes, /const permissoesDoToken=/);
  assert.match(formulario, /function criarAberturaFormularioConexao/);
  assert.match(formulario, /qasePrever\(/);
  assert.match(principal, /abas\.conexoes=async/);
  assert.doesNotMatch(principal, /function apresentarProjetos|function abrirPainel|const permissoesDoToken=/);
  assert.doesNotMatch(permissoes, /api\.contaEntrar|api\.servicoAdicionar/);
  assert.doesNotMatch(qase, /api\.contaEntrar/);
});

test('scripts de Conexões carregam dependências antes da tela principal e dos complementos', () => {
  const html = fs.readFileSync('frontend/compartilhado/runtime/index.html', 'utf8');
  let anterior = -1;
  for (const item of arquivos) {
    const indice = html.indexOf('src="telas/conexoes/' + item + '"');
    assert.ok(indice > anterior, item + ' precisa ser carregado na ordem correta');
    anterior = indice;
  }
  for (const nome of arquivos) assert.match(ler(nome), /^'use strict';\n\/\*\*/);
});

test('identidade do Prumo permanece separada das contas conectadas', () => {
  const principal = ler('mostrarConexoes.js');
  const formulario = ler('abrirFormularioConexao.js');
  assert.doesNotMatch(principal + formulario, /contaEntrar\(|contaCadastrar\(|contaSair\(/);
  assert.match(formulario, /api\.servicoAdicionar\(/);
  assert.match(fs.readFileSync('backend/conexoes/banco/credenciais.ts','utf8'), /salvarCredencial/);
});


test('falha de consulta não é apresentada como ausência de conexões', async () => {
  const codigo = ler('mostrarConexoes.js');
  async function renderizar(resposta) {
    const itens = [];
    const chamadas = { operacoes: 0, agentes: 0 };
    const ambiente = {
      abas: {},
      estado: { espaco: null },
      api: { servicos: () => resposta },
      chamar: async (executar) => executar(),
      h: (tag, attrs, ...filhos) => ({ tag, attrs, filhos }),
      botao: (rotulo, executar, id) => ({ rotulo, executar, id }),
      criarApresentacaoProjetosQase: () => () => {},
      criarAberturaFormularioConexao: () => () => {},
      DS: {
        estadoTela: (tipo, titulo, descricao, acoes, opcoes) => ({ tipo, titulo, descricao, acoes, opcoes }),
        acao: (rotulo, executar) => ({ rotulo, executar }),
        info: (texto) => ({ texto }),
        chip: (texto) => ({ texto })
      },
      mostrarOperacoesExternas: async () => { chamadas.operacoes++; },
      mostrarIntegracoesDosAgentes: async () => { chamadas.agentes++; }
    };
    vm.runInNewContext(codigo, ambiente);
    await ambiente.abas.conexoes({ append: (...nos) => itens.push(...nos) });
    return { itens, chamadas };
  }

  // A camada chamar() converte respostas de falha em null.
  const viaNulo = await (async () => {
    const itens = [];
    const ambiente = {
      abas: {}, estado: { espaco: null }, api: { servicos: () => null },
      chamar: async () => null, h: (tag, attrs, ...filhos) => ({ tag, attrs, filhos }),
      botao: (rotulo, executar, id) => ({ rotulo, executar, id }),
      criarApresentacaoProjetosQase: () => () => {},
      criarAberturaFormularioConexao: () => () => {},
      DS: { estadoTela: (tipo, titulo, descricao, acoes, opcoes) => ({ tipo, titulo, descricao, acoes, opcoes }), acao: (rotulo, executar) => ({ rotulo, executar }), info: () => ({}) }
    };
    vm.runInNewContext(codigo, ambiente);
    await ambiente.abas.conexoes({ append: (...nos) => itens.push(...nos) });
    return itens;
  })();
  assert.equal(viaNulo.at(-1).tipo, 'erro');
  assert.equal(viaNulo.at(-1).opcoes.id, 'conexoes-falha-consulta');
  assert.equal(viaNulo.at(-1).acoes.length, 1);
  assert.doesNotMatch(JSON.stringify(viaNulo), /Sem conta conectada/);

  const vazio = await renderizar([]);
  assert.equal(vazio.itens.at(-1).attrs.id, 'cx-servicos', 'lista vazia válida apresenta os serviços');
  assert.equal(vazio.chamadas.operacoes, 1);
  assert.equal(vazio.chamadas.agentes, 1);
});
