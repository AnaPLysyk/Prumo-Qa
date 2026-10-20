/** Valida montagem e ações de Projetos sem acessar APIs, disco de usuário ou serviços externos. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const scripts = [
  'frontend/projetos/selecionarProjeto.js',
  'frontend/projetos/modais/abrirFormularioProjeto.js',
  'frontend/projetos/modais/abrirRepositoriosGithub.js',
  'frontend/projetos/componentes/montarVinculosProjeto.js',
  'frontend/projetos/componentes/montarSecaoProjeto.js',
  'frontend/projetos/componentes/montarDiagnosticoPasta.js',
  'frontend/projetos/mostrarPastasLocais.js',
  'frontend/projetos/mostrarProjetos.js'
];

const projeto = {
  id: 'projeto-A', nome: 'Projeto A', descricao: 'Um projeto de teste',
  raizContextos: 'raiz-A', pastaLocal: null,
  vinculos: [{
    servico: 'github', recurso: { chave: 'org/repositorio', id: 'repositorio-1', instancia: 'github.com' },
    validadoEm: '2026-10-18', estado: 'ATIVO'
  }]
};

function criarContexto(overrides = {}) {
  const chamadas = [], navegacao = [];
  const api = {
    espacos: async () => [projeto],
    projetos: async () => [],
    servicos: async () => [],
    servicoRecursos: async () => ({ recursos: [], proxima: null }),
    servicoConferir: async (...args) => { chamadas.push(['validar', ...args]); return { valido: true }; },
    servicoDesvincular: async (...args) => { chamadas.push(['remover', ...args]); return { ok: true }; },
    espacoPasta: async id => { chamadas.push(['pasta', id]); return { ok: true }; },
    espacoEditar: async (...args) => { chamadas.push(['editar', ...args]); return projeto; },
    espacoCriar: async data => { chamadas.push(['criar', data]); return projeto; },
    ...overrides.api
  };
  const contexto = {
    window: { PrumoConta: { pode: () => true } },
    abas: {},
    estado: { espaco: null, projetoLegado: false },
    api, chamadas, navegacao, foco: null,
    h: (tag, props, ...children) => ({ tag, props, children }),
    botao: (texto, onClick, id) => ({ tipo: 'botao', texto, onClick, id }),
    chamar: async fn => typeof fn === 'function' ? fn() : fn,
    mostrar: destino => { navegacao.push(destino); return destino; },
    salvarRaiz: () => { chamadas.push(['salvarRaiz']); },
    avisar: mensagem => { chamadas.push(['avisar', mensagem]); },
    DS: {
      nomesServico: { github: 'GitHub' },
      origem: (...args) => ({ tipo: 'origem', args }),
      info: texto => ({ tipo: 'info', texto }),
      link: (texto, onClick, props) => ({ tipo: 'link', texto, onClick, props })
    },
    tr: (texto, dados) => texto.replace(/\{(\w+)\}/g, (_, k) => dados?.[k] ?? ''),
    hora: x => x, selo: x => ({ tipo: 'selo', x }),
    campoPlataforma: (titulo, config) => ({
      no: { tipo: 'campo', titulo },
      input: { value: config.value || '', focus: () => { contexto.foco = config.id; } }
    }),
    document: { getElementById: () => null },
    ...overrides.globals
  };
  vm.createContext(contexto);
  for (const arquivo of scripts) {
    vm.runInContext(fs.readFileSync(arquivo, 'utf8'), contexto, { filename: arquivo });
  }
  const percorrer = raiz => {
    const achados = [];
    function visitar(no) {
      if (!no) return;
      if (Array.isArray(no)) { for (const filho of no) visitar(filho); return; }
      if (typeof no !== 'object') return;
      achados.push(no);
      if ('children' in no) visitar(no.children);
      if ('elementos' in no) visitar(no.elementos);
    }
    visitar(raiz);
    return achados;
  };
  return { contexto, api, chamadas, navegacao, percorrer };
}

test('componentes de Projetos carregam na ordem correta, antes da tela', () => {
  const html = fs.readFileSync('frontend/compartilhado/runtime/index.html', 'utf8');
  let anterior = -1;
  for (const caminho of [
    'telas/projetos/selecionarProjeto.js',
    'telas/projetos/modais/abrirFormularioProjeto.js',
    'telas/projetos/modais/abrirRepositoriosGithub.js',
    'telas/projetos/componentes/montarVinculosProjeto.js',
    'telas/projetos/componentes/montarSecaoProjeto.js',
    'telas/projetos/componentes/montarDiagnosticoPasta.js',
    'telas/projetos/mostrarPastasLocais.js',
    'telas/projetos/mostrarProjetos.js'
  ]) {
    const indice = html.indexOf('src="' + caminho + '"');
    assert.ok(indice > anterior, caminho);
    anterior = indice;
  }
});

test('Projetos monta lista, vínculos e atalhos sem misturar a lógica de Testes', async () => {
  const { contexto, percorrer } = criarContexto();
  const elemento = { elementos: [], append(...partes) { this.elementos.push(...partes); } };
  await contexto.abas.projetos(elemento);
  const nos = percorrer(elemento);
  assert.ok(nos.some(x => x.tag === 'h2' && x.children.includes('Projeto A')));
  assert.ok(nos.some(x => x.tag === 'section' && x.props['data-espaco'] === projeto.id));
  assert.ok(nos.some(x => x.tag === 'li' && x.props['data-servico'] === 'github'));
  assert.ok(nos.some(x => x.tag === 'li' && x.props['data-servico'] === 'local'));
  assert.ok(nos.some(x => x.tipo === 'botao' && x.texto === 'Importar projetos do Qase'));
  assert.ok(nos.some(x => x.tag === 'h2' && x.props.id === 'pastas-contrato-local'), 'seção de pastas locais preservada');
});

test('selecionar projeto mantém o estado e só abre Testes quando solicitado', () => {
  const { contexto, chamadas, navegacao } = criarContexto();
  contexto.escolherEspaco(projeto);
  assert.equal(contexto.estado.espaco, projeto);
  assert.equal(contexto.estado.root, 'raiz-A');
  assert.deepEqual(navegacao, ['projetos']);
  contexto.escolherEspaco(projeto, 'testes');
  assert.equal(contexto.estado.sub.testes, 'repositorio');
  assert.equal(navegacao.at(-1), 'testes');
  assert.equal(chamadas.filter(x => x[0] === 'salvarRaiz').length, 2);
});

test('botões de vínculo chamam API com projeto e serviço corretos', async () => {
  const { contexto, chamadas, navegacao, percorrer } = criarContexto();
  const nos = percorrer(contexto.montarVinculosProjeto(projeto));
  await nos.find(x => x.tipo === 'link' && x.texto === 'Validar').onClick();
  await nos.find(x => x.tipo === 'link' && x.texto === 'Remover').onClick();
  assert.deepEqual(chamadas[0], ['validar', 'projeto-A', 'github']);
  assert.deepEqual(chamadas[1], ['remover', 'projeto-A', 'github']);
  assert.deepEqual(navegacao, ['projetos', 'projetos']);
});

test('formulário de Projeto mantém edição e cadastro separados', async () => {
  const { contexto, chamadas, percorrer } = criarContexto();
  const area = { elementos: [], replaceChildren(...nos) { this.elementos = nos; } };
  contexto.abrirFormularioProjeto(area, projeto);
  assert.equal(contexto.foco, 'espaco-nome');
  const nos = percorrer(area);
  await nos.find(x => x.tipo === 'botao' && x.texto === 'Salvar projeto').onClick();
  assert.equal(chamadas.at(-1)[0], 'salvarRaiz');
  assert.equal(chamadas.some(x => x[0] === 'editar' && x[1] === 'projeto-A'), true);
});

test('vincular GitHub e trazer repositório usa o projeto selecionado e só copia após vincular', async () => {
  const ordem = [];
  const conta = { id: 'conta-github', nome: 'Minha conta', ativa: true, servico: 'github' };
  const recurso = { chave: 'org/repositorio', id: 'repo-1' };
  const { contexto, percorrer, navegacao } = criarContexto({
    api: {
      servicos: async () => [conta],
      servicoRecursos: async (id, pagina) => {
        ordem.push(['listar', id, pagina.offset]);
        return { recursos: [recurso], proxima: null };
      },
      servicoVincular: async (...args) => {
        ordem.push(['vincular', args[0], args[1], args[2].chave]);
        return { ok: true };
      },
      espacoTrazer: async id => { ordem.push(['trazer', id]); return { ok: true }; }
    }
  });
  const painel = { elementos: [], replaceChildren(...nos) { this.elementos = nos; } };
  await contexto.abrirRepositoriosGithub(painel, projeto);
  const botaoTrazer = percorrer(painel).find(
    x => x.tipo === 'botao' && x.texto === 'Vincular e trazer para este computador'
  );
  assert.ok(botaoTrazer, 'ação precisa aparecer com uma conexão ativa');
  await botaoTrazer.onClick();
  assert.deepEqual(ordem, [
    ['listar', 'conta-github', 0],
    ['vincular', 'projeto-A', 'conta-github', 'org/repositorio'],
    ['trazer', 'projeto-A']
  ]);
  assert.deepEqual(navegacao, ['projetos']);
});

test('se não há conexão GitHub ativa, exibe orientação e não tenta vincular', async () => {
  const { contexto, percorrer, chamadas, navegacao } = criarContexto();
  const painel = { elementos: [], replaceChildren(...nos) { this.elementos = nos; } };
  await contexto.abrirRepositoriosGithub(painel, projeto);
  const nos = percorrer(painel);
  assert.ok(nos.some(x => x.tipo === 'botao' && x.texto === 'Abrir Conexões'));
  assert.equal(chamadas.length, 0);
  await nos.find(x => x.tipo === 'botao' && x.texto === 'Abrir Conexões').onClick();
  assert.deepEqual(navegacao, ['conexoes']);
});
