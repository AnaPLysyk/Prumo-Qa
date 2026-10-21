/** Valida montagem e ações de Projetos sem acessar APIs, disco de usuário ou serviços externos. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const scripts = ['frontend/projetos/tela-projetos.js'];

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
    h: (tag, props, ...children) => ({ tag, props, children,
       append(...itens) { this.children.push(...itens); },
       replaceChildren(...itens) { this.children = itens; },
       addEventListener() {}, querySelector() { return null; } }),
    botao: (texto, onClick, id) => ({ tipo: 'botao', texto, onClick, id }),
    chamar: async fn => typeof fn === 'function' ? fn() : fn,
    mostrar: destino => { navegacao.push(destino); return destino; },
    salvarRaiz: () => { chamadas.push(['salvarRaiz']); },
    avisar: mensagem => { chamadas.push(['avisar', mensagem]); },
    DS: {
      nomesServico: { github: 'GitHub' },
      origem: (...args) => ({ tipo: 'origem', args }),
      carregando: texto => ({ tipo: 'carregando', texto }),
      chip: (texto, tom) => ({ tipo: 'chip', texto, tom }),
      fluxoProjeto: dados => ({ tag: 'ul', props: { class: 'ds-proj-fluxo' }, children: dados.servicos.map(s => ({ tag: 'li', props: { 'data-servico': s.servico, 'data-vinculado': s.vinculado ? 'sim' : 'nao' }, children: [{ tipo: 'descricao', texto: s.detalhe }, ...(s.acoes || []).map(([texto, onClick]) => ({ tipo: 'link', texto, onClick }))] })) }),
      info: texto => ({ tipo: 'info', texto }),
      trilha: (itens, opcoes) => ({ tipo: 'trilha', itens, opcoes, children: [] }),
      link: (texto, onClick, props) => ({ tipo: 'link', texto, onClick, props }),
      acao: (texto, onClick) => ({ tipo: 'acao', texto, onClick }),
      estadoTela: (tipo, titulo, descricao, acoes, opcoes) => ({ tipo, titulo, descricao, acoes, opcoes, children: acoes || [] })
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
  for (const caminho of ['telas/projetos/tela-projetos.js']) {
    const indice = html.indexOf('src="' + caminho + '"');
    assert.ok(indice > anterior, caminho);
    anterior = indice;
  }
});

test('Projetos mostra uma bancada única e seletor visível, sem empilhar outros projetos', async () => {
  const { contexto, percorrer } = criarContexto();
  const elemento = { elementos: [], append(...partes) { this.elementos.push(...partes); } };
  await contexto.abas.projetos(elemento);
  const nos = percorrer(elemento);
  assert.equal(nos.filter(x => x.tag === 'section' && x.props['data-espaco']).length, 1);
  assert.ok(nos.some(x => x.tag === 'button' && x.props.id === 'projetos-trocar'));
  assert.ok(nos.some(x => x.tipo === 'acao' && x.texto === 'Novo projeto'));
  assert.ok(nos.some(x => x.tag === 'li' && x.props['data-servico'] === 'github'));
  assert.ok(nos.some(x => x.tag === 'li' && x.props['data-servico'] === 'local'));
  assert.ok(!nos.some(x => x.tag === 'h2' && x.props.id === 'pastas-contrato-local'));
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
  const nos = percorrer(contexto.montarFluxoProjeto(projeto, () => {}));
  const github = nos.find(x => x.tag === 'li' && x.props?.['data-servico'] === 'github');
  await github.children.find(x => x.tipo === 'link' && x.texto === 'Verificar').onClick();
  await github.children.find(x => x.tipo === 'link' && x.texto === 'Remover').onClick();
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
      projetosRecursos: async (id, pagina) => {
        ordem.push(['listar', id, pagina.offset]);
        return { recursos: [recurso], proxima: null };
      },
      projetosVincular: async (...args) => {
        ordem.push(['vincular', args[0], args[1], args[2].chave]);
        return { ok: true };
      },
      espacoTrazer: async id => { ordem.push(['trazer', id]); return { ok: true }; }
    }
  });
  const painel = { elementos: [], replaceChildren(...nos) { this.elementos = nos; } };
  await contexto.abrirProjetosDaOrigem(painel, 'github', projeto);
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
  await contexto.abrirProjetosDaOrigem(painel, 'github', projeto);
  const nos = percorrer(painel);
  assert.ok(nos.some(x => x.tipo === 'acao' && x.texto === 'Conectar conta do GitHub'));
  assert.equal(chamadas.length, 0);
  await nos.find(x => x.tipo === 'acao' && x.texto === 'Conectar conta do GitHub').onClick();
  assert.deepEqual(navegacao, ['projetos']);
});


test('Projetos diferencia consultas com falha de listas vazias sem duplicar pastas', async () => {
  const montar = async (api) => {
    const { contexto, percorrer } = criarContexto({ api });
    const elemento = { elementos: [], append(...nos) { this.elementos.push(...nos); } };
    await contexto.abas.projetos(elemento);
    return percorrer(elemento);
  };
  const falhaProjetos = await montar({ espacos: async () => null });
  assert.ok(falhaProjetos.some(x => x.opcoes?.id === 'projetos-falha-consulta'));
  assert.ok(!falhaProjetos.some(x => x.tag === 'section' && x.props?.['data-espaco']));

  const vazia = await montar({ espacos: async () => [] });
  assert.ok(vazia.some(x => x.props?.id === 'projetos-vazio'));
  assert.ok(vazia.some(x => x.tipo === 'acao' && x.texto === 'Criar projeto manual'));
  const varias = await montar({ espacos: async () => [projeto, {...projeto, id: 'projeto-B', nome: 'Projeto B'}] });
  assert.equal(varias.filter(x => x.tag === 'section' && x.props?.['data-espaco']).length, 1);
});


test('Jira, Qase e GitHub oferecem importação de projetos distintos sem associação automática', async () => {
  for (const servico of ['jira','qase','github']) {
    const conta = { id: 'conta-' + servico, nome: 'Conta ' + servico, servico, ativa: true };
    const recurso = { id: servico + '-21', chave: 'PRJ-' + servico, nome: 'Projeto ' + servico, instancia: 'https://' + servico + '.example', contaId: 'owner-1', tipoId: 'id_api' };
    const espaco = { id: 'espaco-' + servico, nome: recurso.nome, descricao: '', raizContextos: 'dados-' + servico, vinculos: [{ servico, recurso }] };
    const chamadas = [];
    const { contexto, percorrer, navegacao } = criarContexto({ api: {
      servicos: async () => [conta],
      espacos: async () => [],
      projetosRecursos: async (id, pagina) => { chamadas.push(['listar', id, pagina.offset]); return { recursos: [recurso], proxima: null }; },
      projetosImportar: async (id, r) => { chamadas.push(['importar', id, r.id]); return { projeto: espaco, criado: true }; }
    } });
    const painel = { elementos: [], replaceChildren(...nos) { this.elementos = nos; } };
    await contexto.abrirProjetosDaOrigem(painel, servico);
    const botoes = percorrer(painel);
    assert.ok(!botoes.some(x => x.tipo === 'botao' && x.texto === 'Criar projeto'), 'importar nunca cria sozinho: primeiro escolhe o recurso e depois decide o destino');
    const escolher = botoes.find(x => x.tipo === 'botao' && x.texto === 'Escolher');
    assert.ok(escolher, servico + ' precisa oferecer a escolha do recurso');
    await escolher.onClick();
    const criar = percorrer(painel).find(x => x.tipo === 'botao' && x.texto === 'Criar projeto');
    assert.ok(criar, servico + ': depois de escolher, oferece criar um projeto novo');
    assert.deepEqual(chamadas, [['listar', conta.id, 0]], 'nada foi criado ainda');
    await criar.onClick();
    assert.deepEqual(chamadas, [['listar', conta.id, 0], ['importar', conta.id, recurso.id]]);
    assert.equal(contexto.estado.espaco.id, espaco.id);
    assert.deepEqual(navegacao, ['projetos']);
  }
});

test('vincular recurso Qase ao projeto existente preserva o ID do espaço e não cria outro', async () => {
  const conta = { id: 'conta-qase', nome: 'Conta Qase', servico: 'qase', ativa: true };
  const recurso = { id: 'recurso-qase', chave: 'SM', nome: 'Suite SM', instancia: 'https://api.qase.io', contaId: 'owner', tipoId: 'id_api', usadoPor: null };
  const chamadas = [];
  const { contexto, percorrer } = criarContexto({ api: {
    servicos: async () => [conta],
    projetosRecursos: async () => ({ recursos: [recurso], proxima: null }),
    projetosVincular: async (...args) => { chamadas.push(args); return { ok: true }; }
  } });
  const painel = { elementos: [], replaceChildren(...nos) { this.elementos = nos; } };
  await contexto.abrirProjetosDaOrigem(painel, 'qase', projeto);
  const botaoVincular = percorrer(painel).find(x => x.tipo === 'botao' && x.texto === 'Escolher este');
  assert.ok(botaoVincular);
  await botaoVincular.onClick();
  assert.deepEqual(chamadas.map(x => x.slice(0, 2)), [['projeto-A', 'conta-qase']]);
  assert.equal(chamadas[0][2].chave, 'SM');
  assert.ok(!('usadoPor' in chamadas[0][2]), 'o contrato estrito do núcleo não aceita o campo que a lista acrescenta só para a tela');
  assert.deepEqual(Object.keys(chamadas[0][2]).sort(), ['chave', 'contaId', 'id', 'instancia', 'nome', 'tipoId']);
});


test('fluxo visual representa cinco origens e não inventa conexões entre serviços', () => {
  const { contexto, percorrer } = criarContexto();
  const tela = contexto.montarFluxoProjeto(projeto, () => {});
  const nos = percorrer(tela).filter(n => n.tag === 'li' && n.props?.['data-servico']);
  assert.deepEqual(nos.map(n => n.props['data-servico']), ['manual', 'jira', 'qase', 'github', 'local']);
  assert.deepEqual(nos.map(n => n.props['data-vinculado']), ['sim', 'nao', 'nao', 'sim', 'nao']);
  assert.ok(!nos[0].children.some(n => n.texto === 'Remover'), 'origem manual é intrínseca ao Prumo');
  assert.ok(nos[1].children.some(n => n.texto === 'Conectar'));
  assert.ok(nos[3].children.some(n => n.texto === 'Verificar'));
  assert.ok(nos[3].children.some(n => n.texto === 'Remover'));
  assert.ok(nos[4].children.some(n => n.texto === 'Escolher pasta'));
});

test('ação no mapa vincula somente o Qase ao projeto selecionado', async () => {
  const qase = { id: 'conta-qase', nome: 'Qase', ativa: true, servico: 'qase' };
  const recurso = { id: 'case-qase', chave: 'SM', nome: 'SM', contaId: 'dono', instancia: 'https://api.qase.io', tipoId: 'id_api' };
  const chamadas = [];
  const { contexto, percorrer } = criarContexto({ api: {
    servicos: async () => [qase],
    projetosRecursos: async (id, pagina) => { chamadas.push(['listar', id, pagina.offset]); return { recursos: [recurso], proxima: null }; },
    projetosVincular: async (espacoId, contaId, escolhido) => {
      chamadas.push(['vincular', espacoId, contaId, escolhido.chave]); return { ok: true };
    }
  } });
  const painel = { elementos: [], replaceChildren(...nos) { this.elementos = nos; } };
  const fluxo = contexto.montarFluxoProjeto(projeto,
    servico => contexto.abrirProjetosDaOrigem(painel, servico, projeto));
  const qaseNo = percorrer(fluxo).find(n => n.tag === 'li' && n.props?.['data-servico'] === 'qase');
  await qaseNo.children.find(n => n.texto === 'Conectar').onClick();
  const selecionar = percorrer(painel).find(n => n.tipo === 'botao' && n.texto === 'Escolher este');
  await selecionar.onClick();
  assert.deepEqual(chamadas, [['listar', 'conta-qase', 0], ['vincular', 'projeto-A', 'conta-qase', 'SM']]);
  assert.equal(projeto.vinculos[0].servico, 'github', 'a escolha de Qase não sobrescreve a origem GitHub');
});

test('desenho de vínculos pertence só ao Design System, sem tela extra', () => {
  const visual = fs.readFileSync('frontend/design-system/ds.js', 'utf8');
  const css = fs.readFileSync('frontend/design-system/ds.css', 'utf8');
  const tela = fs.readFileSync('frontend/projetos/tela-projetos.js', 'utf8');
  assert.match(visual, /function fluxoProjeto\(/);
  assert.match(visual, /'data-servico': s\.servico/);
  assert.match(css, /\.ds-proj-fluxo\s*\{/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(tela, /montarFluxoProjeto\(espaco, abrirConexao, escrita\)/);
  assert.doesNotMatch(tela, /function abrirRepositoriosGithub\(/, 'não mantém segunda implementação de seleção GitHub');
});

test('cabos no Design System refletem apenas origens realmente vinculadas', () => {
  const ds = fs.readFileSync('frontend/design-system/ds.js', 'utf8');
  const css = fs.readFileSync('frontend/design-system/ds.css', 'utf8');
  assert.match(ds, /for \(const s of servicos\)/);
  assert.match(ds, /data-ativo.*s\.vinculado/);
  assert.match(ds, /document\.createElementNS\(NS, 'path'\)/);
  assert.match(ds, /class: 'ds-proj-porta'/);
  assert.match(ds, /acao\[1\]\(\)/);
  assert.match(ds, /case 'local': return svg\(/);
  assert.match(ds, /case 'jira': return svg\(/);
  assert.match(css, /\.ds-proj-cabo\[data-servico="jira"\]/);
  assert.match(css, /\.ds-proj-cabo\[data-servico="manual"\]/, 'o Manual/Prumo ativo também tem cabo');
  assert.doesNotMatch(ds, /s\.servico === 'manual'\) continue/, 'cabo do Manual só some quando ele é desativado');
  assert.match(css, /\.ds-proj-cabos/);
  assert.match(css, /\.ds-proj-porta:focus-visible/);
});

test('trocar projeto altera as fontes dos módulos no menu, sem reaproveitar Jira de outro projeto', () => {
  const codigo = fs.readFileSync('frontend/compartilhado/navegacaoDaJanela.js','utf8');
  const inicio = codigo.indexOf('function atualizarMenuDoProjeto(');
  const fim = codigo.indexOf('function iniciarAjustes()', inicio);
  assert.ok(inicio >= 0 && fim > inicio, 'a atualização deve pertencer à navegação');
  const menu = ['projetos','tickets','testes','agentes'].map(tipo => {
    const nome = {projetos:'Projetos',tickets:'Tickets',testes:'Testes',agentes:'Agentes'}[tipo];
    const b = { dataset:{aba:tipo}, title:'', nodes:[], append(node){this.nodes.push(node);},
      querySelector(seletor){ return seletor==='span' ? {textContent:nome} : null; }};
    return b;
  });
  const lateral={setAttribute(k,v){this[k]=v;}};
  const ctx={document:{querySelectorAll:()=>menu,querySelector:()=>lateral},
    h:(tag,attrs)=>({tag,attrs,textContent:''})};
  vm.createContext(ctx); vm.runInContext(codigo.slice(inicio,fim),ctx);
  const pA={id:'A',nome:'Projeto A',pastaLocal:null,vinculos:[{servico:'jira'},{servico:'github'}]};
  const pB={id:'B',nome:'Projeto B',pastaLocal:'C:/codigo',vinculos:[{servico:'qase'}]};
  ctx.atualizarMenuDoProjeto(pA);
  assert.match(menu[1].title,/Jira/);
  assert.match(menu[1].title,/GitHub/);
  assert.doesNotMatch(menu[2].title,/Qase/);
  ctx.atualizarMenuDoProjeto(pB);
  assert.doesNotMatch(menu[1].title,/Jira/);
  assert.match(menu[1].title,/Qase/);
  assert.match(menu[2].title,/Local/);
  assert.equal(menu[1].dataset.projeto,'B');
  assert.equal(lateral['data-projeto-ativo'],'B');
  // Pedido de 21/10/2026: o menu não leva legenda embaixo de cada item (ficava amontoado).
  assert.ok(menu.every(b=>b.nodes.length===0),'nenhuma legenda no menu');
  ctx.atualizarMenuDoProjeto(null);
  assert.match(menu[1].title,/Nenhum projeto selecionado/);
});

test('criar projeto manual abre a bancada sem exigir repositório', async () => {
  const { contexto, chamadas, navegacao, percorrer } = criarContexto({
    globals: {
      campoPlataforma: (rotulo, config) => ({
        no: { tipo: 'campo', titulo: rotulo },
        input: { value: rotulo === 'Nome' ? 'Projeto manual' : '', focus() {}, removeAttribute() {} }
      })
    }
  });
  const area = { elementos: [], replaceChildren(...nos) { this.elementos = nos; } };
  contexto.abrirFormularioProjeto(area, null);
  const criar = percorrer(area).find(x => x.tipo === 'botao' && x.texto === 'Criar projeto');
  assert.ok(criar, 'ação de criação existe');
  await criar.onClick();
  assert.equal(chamadas.some(x => x[0] === 'criar'), true);
  assert.equal(contexto.estado.sub?.projetos, undefined, 'nenhuma conexão obrigatória após criar');
  assert.deepEqual(navegacao, ['projetos']);
});

test('recurso que já está em outro projeto vem marcado e só oferece abrir esse projeto; o que é livre continua com "Escolher este"', async () => {
  const conta = { id: 'conta-jira', nome: 'Conta Jira', servico: 'jira', ativa: true };
  const base = { instancia: 'https://empresa.atlassian.net', contaId: 'c', tipoId: 'id_api' };
  const recursos = [
    { ...base, id: '1', chave: 'EM-OUTRO', nome: 'Em outro', usadoPor: { id: 'projeto-X', nome: 'Projeto X' } },
    { ...base, id: '2', chave: 'DESTE', nome: 'Deste', usadoPor: { id: 'projeto-A', nome: 'Projeto A' } },
    { ...base, id: '3', chave: 'LIVRE', nome: 'Livre', usadoPor: null }
  ];
  const vinculados = [];
  const { contexto, percorrer } = criarContexto({ api: {
    servicos: async () => [conta],
    espacos: async () => [projeto, { ...projeto, id: 'projeto-X', nome: 'Projeto X' }],
    projetosRecursos: async () => ({ recursos, proxima: null }),
    projetosVincular: async (...args) => { vinculados.push(args[2].chave); return { ok: true }; }
  } });
  const painel = { elementos: [], replaceChildren(...nos) { this.elementos = nos; } };
  await contexto.abrirProjetosDaOrigem(painel, 'jira', projeto);
  const nos = percorrer(painel);
  assert.equal(nos.filter((x) => x.tipo === 'botao' && x.texto === 'Escolher este').length, 1, 'só o recurso livre pode ser escolhido');
  assert.ok(nos.some((x) => x.tipo === 'botao' && x.texto === 'Abrir Projeto X'));
  assert.ok(!nos.some((x) => x.tipo === 'botao' && x.texto === 'Abrir Projeto A'), 'o próprio projeto não se oferece');
  await nos.find((x) => x.tipo === 'botao' && x.texto === 'Escolher este').onClick();
  assert.deepEqual(vinculados, ['LIVRE']);
  await nos.find((x) => x.tipo === 'botao' && x.texto === 'Abrir Projeto X').onClick();
  assert.equal(contexto.estado.espaco.id, 'projeto-X');
});

test('importar: depois de escolher o recurso a pessoa decide; projeto novo nasce só com aquela conexão, e vincular a existente só mostra projetos sem aquele serviço', async () => {
  const conta = { id: 'conta-jira', nome: 'Conta Jira', servico: 'jira', ativa: true };
  const recurso = { id: '10000', chave: 'KAN', nome: 'Qa', instancia: 'https://empresa.atlassian.net', contaId: 'c', tipoId: 'id_api', usadoPor: null };
  const comJira = { ...projeto, id: 'com-jira', nome: 'Já tem Jira', vinculos: [{ servico: 'jira', recurso: { chave: 'OUTRO' } }] };
  const semJira = { ...projeto, id: 'sem-jira', nome: 'Sem Jira', vinculos: [{ servico: 'github', recurso: { chave: 'a/b' } }] };
  const chamadas = [];
  const { contexto, percorrer } = criarContexto({ api: {
    servicos: async () => [conta],
    espacos: async () => [comJira, semJira],
    projetosRecursos: async () => ({ recursos: [recurso], proxima: null }),
    projetosImportar: async (...args) => { chamadas.push(['importar', ...args]); return { projeto: { ...projeto, id: 'novo', nome: 'Qa' }, criado: true }; },
    projetosVincular: async (...args) => { chamadas.push(['vincular', args[0], args[1], args[2]]); return { ok: true }; }
  } });
  const painel = { elementos: [], replaceChildren(...nos) { this.elementos = nos; } };
  await contexto.abrirProjetosDaOrigem(painel, 'jira', null, null, [['Projetos', () => {}], ['Importar', () => {}]]);
  const lista = percorrer(painel);
  assert.ok(lista.some(x => x.tipo === 'trilha' && x.itens.map(i => i[0]).join('>') === 'Projetos>Importar>Jira'), 'trilha Projetos › Importar › Jira');
  await lista.find(x => x.tipo === 'botao' && x.texto === 'Escolher').onClick();
  const decisao = percorrer(painel);
  assert.ok(decisao.some(x => x.tipo === 'trilha' && x.itens.map(i => i[0]).join('>') === 'Projetos>Importar>Jira>Destino'), 'trilha Projetos › Importar › Jira › Destino');
  const botoesVincular = decisao.filter(x => x.tipo === 'botao' && x.texto === 'Vincular aqui');
  assert.deepEqual(botoesVincular.map(b => b.id), ['importar-vincular-sem-jira'], 'o projeto que já tem Jira não oferece vincular');
  assert.ok(decisao.some(x => x.tipo === 'chip' && x.texto === 'já tem Jira'));
  await botoesVincular[0].onClick();
  assert.deepEqual(chamadas.map(x => x.slice(0, 3)), [['vincular', 'sem-jira', 'conta-jira']]);
  assert.ok(!('usadoPor' in chamadas[0][3]));
  assert.equal(contexto.estado.espaco.id, 'sem-jira', 'abre o projeto em que vinculou');
  chamadas.length = 0;
  await lista.find(x => x.tipo === 'botao' && x.texto === 'Escolher').onClick();
  await percorrer(painel).find(x => x.tipo === 'botao' && x.texto === 'Criar projeto').onClick();
  assert.deepEqual(chamadas.map(x => x[0]), ['importar'], 'projeto novo: só a importação do recurso escolhido, nenhuma outra conexão');
  assert.deepEqual(chamadas[0].slice(1, 2), ['conta-jira']);
  assert.equal(contexto.estado.espaco.id, 'novo');
});

test('"Trocar projeto" conta as conexões como o mapa do projeto: ligadas (sem as desligadas) mais a pasta local, com singular, nomes e aviso de desligadas', () => {
  const { contexto } = criarContexto();
  const v = (servico, desligado = false) => ({ servico, desligado, recurso: { chave: 'X' } });
  assert.equal(contexto.resumoDasConexoes({ vinculos: [] }), 'Sem conexões');
  assert.equal(contexto.resumoDasConexoes({}), 'Sem conexões');
  assert.equal(contexto.resumoDasConexoes({ vinculos: [v('jira')] }), '1 conexão · Jira');
  assert.equal(contexto.resumoDasConexoes({ vinculos: [v('jira'), v('qase'), v('github')], pastaLocal: 'C:/x' }), '4 conexões · Jira, Qase, GitHub, Pasta local');
  assert.equal(contexto.resumoDasConexoes({ vinculos: [v('jira'), v('qase', true)] }), '1 conexão · Jira · 1 desligada');
  assert.equal(contexto.resumoDasConexoes({ vinculos: [v('jira', true), v('qase', true)] }), 'Sem conexões · 2 desligadas');
  assert.equal(contexto.resumoDasConexoes({ vinculos: [], pastaLocal: 'C:/x' }), '1 conexão · Pasta local');
});

test('o número de conexões do "Trocar projeto" é o mesmo da faixa do painel (vinculadas, sem o Manual e sem as desligadas)', () => {
  const { contexto, percorrer } = criarContexto();
  const espaco = { ...projeto, vinculos: [{ servico: 'jira', recurso: { chave: 'K', nome: 'K', instancia: 'https://a.atlassian.net' }, desligado: false }, { servico: 'qase', recurso: { chave: 'P', nome: 'P', instancia: 'https://api.qase.io' }, desligado: true }], pastaLocal: 'C:/x', manualAtivo: true };
  const n = Number(/^(\d+)/.exec(contexto.resumoDasConexoes(espaco))?.[1] ?? 0);
  const nos = percorrer(contexto.montarFluxoProjeto(espaco, () => {})).filter(x => x.tag === 'li' && x.props?.['data-servico']);
  const vinculadasAtivas = nos.filter(x => x.props['data-servico'] !== 'manual' && x.props['data-vinculado'] === 'sim').length;
  assert.equal(n, 2, 'Jira ligado + pasta local');
  assert.ok(vinculadasAtivas >= 2);
});
