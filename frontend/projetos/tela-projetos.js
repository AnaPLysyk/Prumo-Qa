'use strict';
/** Tela Projetos: seleção, cadastro, repositórios, vínculos e pastas locais. */
/** Projetos: guarda o projeto escolhido e abre a tela solicitada sem copiar sua lógica. */
function escolherEspaco(espaco, destino = 'projetos') {
  estado.espaco = espaco;
  estado.root = espaco.raizContextos;
  salvarRaiz();

  if (destino === 'testes') {
    (estado.sub ||= {}).testes = 'repositorio';
  }
  estado.jobId = undefined;
  (estado.ds ||= {}).ultimoProjeto = espaco.id;
  return mostrar(destino);
}

/** Projetos: cria ou edita o cadastro manual; nenhuma integração é configurada neste formulário. */
/** Formulário curto de projeto: Enter salva e Cancelar devolve a pessoa de onde veio (não deixa área vazia). */
function abrirFormularioProjeto(formulario, espaco, aoCancelar = () => formulario.replaceChildren()) {
  const enviarComEnter = ev => { if (ev.key === 'Enter') { ev.preventDefault(); salvar.click(); } };
  const nome = campoPlataforma('Nome', {
    id: 'espaco-nome',
    maxlength: 200,
    required: true,
    autocomplete: 'off',
    value: espaco?.nome || '',
    onkeydown: enviarComEnter
  });
  const descricao = campoPlataforma('Descrição (opcional)', {
    id: 'espaco-descricao',
    maxlength: 1000,
    autocomplete: 'off',
    value: espaco?.descricao || '',
    onkeydown: enviarComEnter
  });
  const erroNome = h("p", { id: "espaco-nome-erro", class: "cx-erro", role: "alert", hidden: true });
  nome.input.oninput = () => { erroNome.hidden = true; nome.input.removeAttribute("aria-invalid"); };
  const salvar = botao(espaco ? 'Salvar projeto' : 'Criar projeto', async () => {
    if (!nome.input.value.trim()) { erroNome.textContent = tr("Informe o nome do projeto."); erroNome.hidden = false; nome.input.setAttribute("aria-invalid", "true"); nome.input.setAttribute("aria-describedby", "espaco-nome-erro"); nome.input.focus(); return; }
    const dados = { nome: nome.input.value, descricao: descricao.input.value };
    const resultado = await chamar(() => espaco
      ? api.espacoEditar(espaco.id, dados)
      : api.espacoCriar(dados)
    );
    if (!resultado) return;
    // Projeto manual funciona imediatamente. Pasta ou GitHub são opcionais e podem ser ligados na bancada.
    escolherEspaco(resultado);
  }, 'espaco-salvar');
  salvar.classList?.add('primaria');

  formulario.replaceChildren(h('div', { class: 'ds-proj-form' },
    formulario.closest?.('.ds-proj-painel') ? null : h('h2', {}, espaco ? 'Editar projeto' : 'Novo projeto'),
    nome.no,
    erroNome,
    descricao.no,
    h('div', { class: 'ds-proj-form-acoes' }, salvar, botao('Cancelar', aoCancelar))
  ));

  nome.input.focus();
}

/** Projetos: importa cada recurso como espaço independente; vincular a outro projeto é uma ação separada. */
function abrirProjetosDaOrigem(painel, servico, espaco = null, autorizar = null, raiz = null) {
  // `raiz`: migalhas de pão até aqui (por exemplo Projetos › Importar), só no fluxo de importação.
  const rotulo = { jira: 'Jira', qase: 'Qase', github: 'GitHub' }[servico] || servico;
  /** Trilha dentro do próprio painel (Importar › GitHub › Destino); só no fluxo de importação, onde `raiz` diz de onde a pessoa veio. */
  const trilha = (...atuais) => raiz && DS.trilha ? DS.trilha([...raiz, ...atuais], { semAtual: false }) : null;
  async function selecionarRecurso(conta, recursoDaLista, trazer = false, alvo = espaco) {
    // A lista acrescenta `usadoPor` só para a tela; o contrato e a conferência do núcleo exigem o recurso exatamente como o serviço o devolveu.
    const { usadoPor: _usadoPor, ...recurso } = recursoDaLista;
    const resultado = await chamar(() => alvo
      ? api.projetosVincular(alvo.id, conta.id, recurso)
      : api.projetosImportar(conta.id, recurso));
    if (!resultado || resultado.canceled) return;
    if (alvo && trazer) {
      const copia = await chamar(() => api.espacoTrazer(alvo.id));
      if (!copia || copia.canceled) return;
    }
    // Vinculou a um projeto que já existia: abre esse projeto. Criou um novo: abre o novo (só com esta conexão).
    if (alvo && alvo.id !== espaco?.id) escolherEspaco(alvo);
    else if (alvo) mostrar('projetos');
    else if (resultado.projeto) escolherEspaco(resultado.projeto);
    else mostrar('projetos');
  }
  /** Importar não escolhe o destino sozinho: ou cria um projeto novo (que nasce só com esta conexão) ou vincula a um projeto que já existe e ainda não tem este serviço. */
  async function decidirDestino(conta, recurso, voltarLista) {
    const existentes = (await chamar(api.espacos)) || [];
    // Sem outro projeto para vincular, não há o que decidir: o recurso vira o projeto novo direto.
    if (!existentes.length) return selecionarRecurso(conta, recurso);
    const nomeDe = servico === 'github' ? 'repositório ' : 'projeto ';
    const linhas = existentes.map(p => {
      const jaTem = (p.vinculos || []).some(v => v.servico === servico);
      return h('li', { class: 'proj-vinculo' }, h('span', { class: 'cx-item-nome' }, p.nome),
        jaTem ? chipCx('já tem ' + rotulo, 'aviso') : botao('Vincular aqui', () => selecionarRecurso(conta, recurso, false, p), 'importar-vincular-' + p.id));
    });
    painel.replaceChildren(
      trilha([rotulo, voltarLista], ['Destino']),
      h('div', { class: 'cx-passo-linha' }, h('h2', {}, 'Onde entra ' + nomeDe + recurso.chave + '?'),
        infoCx('Cada projeto do Prumo acompanha um único ' + (servico === 'github' ? 'repositório' : 'projeto de ' + rotulo) + '. Um projeto novo começa só com esta conexão: nada vem de outros projetos, e o resto você conecta depois.')),
      h('div', { class: 'proj-decisao' },
        h('section', { class: 'proj-decisao-bloco' }, h('strong', {}, 'Projeto novo'), h('span', { class: 'suave' }, 'Nasce só com ' + rotulo + ' ' + recurso.chave + '.'),
          primaria(botao('Criar projeto', () => selecionarRecurso(conta, recurso), 'importar-criar'))),
        h('section', { class: 'proj-decisao-bloco' }, h('strong', {}, 'Projeto que já existe'),
          linhas.length ? h('ul', { class: 'ds-lista proj-vinculos' }, linhas) : h('span', { class: 'suave' }, 'Ainda não há outros projetos.'))));
  }
  async function paginaDaConta(conta, pagina = { offset: 0, limite: 50 }) {
    painel.replaceChildren(DS.carregando('Consultando projetos no ' + rotulo + '...'));
    const dados = await chamar(() => api.projetosRecursos(conta.id, pagina));
    if (!dados) {
      painel.replaceChildren(DS.estadoTela('erro', 'Falha na consulta de ' + rotulo, 'A conexão não retornou os projetos. Nenhum cadastro foi alterado.', [DS.acao('Tentar novamente', () => paginaDaConta(conta, pagina))]));
      return;
    }
    const recursos = dados.recursos || [];
    const textos = new Map();
    const linhas = recursos.map(recurso => {
      // Cada projeto, repositório ou pasta fica em um só projeto do Prumo: o que já está em outro aparece marcado, sem botão de vincular.
      const dono = recurso.usadoPor || null;
      const aqui = !!dono && !!espaco && dono.id === espaco.id;
      const li = h('li', { class: 'proj-vinculo' },
        DS.origem(servico, recurso.nome),
        h('span', { class: 'ds-sub' }, recurso.chave + ' · ' + recurso.instancia),
        dono ? chipCx(aqui ? 'já é deste projeto' : 'já está em ' + dono.nome, aqui ? 'ok' : 'aviso') : null,
        dono
          ? (aqui ? null : botao('Abrir ' + dono.nome, async () => { const todos = await chamar(api.espacos); const p = (todos || []).find(x => x.id === dono.id); if (p) escolherEspaco(p); }))
          : botao(espaco ? 'Escolher este' : 'Escolher', () => espaco ? selecionarRecurso(conta, recurso) : decidirDestino(conta, recurso, () => paginaDaConta(conta, pagina))),
        !dono && espaco && servico === 'github'
          ? botao('Vincular e trazer para este computador', () => selecionarRecurso(conta, recurso, true))
          : null
      );
      textos.set(li, (recurso.nome + ' ' + recurso.chave).toLocaleLowerCase());
      return li;
    });
    const lista = h('ul', { class: 'ds-lista proj-vinculos' }, linhas);
    const semResultado = h('p', { class: 'ds-sub', hidden: true }, 'Nenhum projeto corresponde à busca.');
    const busca = recursos.length > 5 ? DS.busca({ id: 'projetos-origem-busca', placeholder: 'Buscar por nome ou código', rotulo: 'Buscar projetos do ' + rotulo }) : null;
    if (busca) busca.input.addEventListener('input', () => {
      const termo = busca.input.value.trim().toLocaleLowerCase();
      let achou = 0;
      for (const li of linhas) { li.hidden = !!termo && !textos.get(li).includes(termo); if (!li.hidden) achou++; }
      semResultado.hidden = achou > 0;
    });
    painel.replaceChildren(
      trilha([rotulo]),
      h('div', { class: 'cx-passo-linha' },
        h('h2', {}, espaco
          ? (servico === 'github' ? 'Qual repositório este Prumo vai acompanhar?' : 'Qual projeto do ' + rotulo + ' este Prumo vai acompanhar?')
          : (servico === 'github' ? 'Qual repositório você quer trazer?' : 'Qual projeto do ' + rotulo + ' você quer trazer?')),
        infoCx(espaco
          ? 'Cada projeto do Prumo acompanha um único ' + (servico === 'github' ? 'repositório' : 'projeto de ' + rotulo) + '. Este vínculo vale só para ' + espaco.nome + ' e nada é unido por semelhança de nome.'
          : 'Depois de escolher, você decide: criar um projeto novo (só com esta conexão) ou vincular a um projeto que já existe. Nada é associado automaticamente.')),
      busca ? busca.no : null,
      recursos.length ? lista : DS.estadoTela('vazio', 'Nenhum projeto disponível nesta conta.', null, [], { compacto: true }),
      semResultado,
      dados.proxima !== null
        ? h('div', { class: 'barra-acoes proj-vinculos-paginas' }, botao('Próxima página', () => paginaDaConta(conta, { offset: dados.proxima, limite: 50 })))
        : null
    );
  }
  return (async () => {
    const contas = await chamar(api.servicos);
    if (!contas) { painel.replaceChildren(DS.estadoTela('erro', 'Não foi possível consultar as conexões.')); return; }
    const ativas = contas.filter(c => c.servico === servico && c.ativa);
    if (!ativas.length) {
      painel.replaceChildren(
        DS.estadoTela('vazio', 'Nenhuma conta do ' + rotulo + ' conectada', 'Conecte uma conta do ' + rotulo + ' para ver os projetos dela. Nada é importado nem vinculado sem a sua escolha.', [DS.acao('Conectar conta do ' + rotulo, () => autorizar ? autorizar() : abrirPainelDeConexoes(espaco), { primaria: true })])
      );
      return;
    }
    if (ativas.length === 1) return paginaDaConta(ativas[0]);
    painel.replaceChildren(h('h2', {}, 'Escolha a conexão ' + rotulo),
      ...ativas.map(conta => botao(conta.nome, () => paginaDaConta(conta))));
  })();
}

/** Conexões do projeto, contadas como o mapa do projeto conta: Jira, Qase e GitHub ligados (não desligados) mais a pasta local; o Manual é intrínseco e não entra. */
function resumoDasConexoes(p) {
  const nomes = { jira: 'Jira', qase: 'Qase', github: 'GitHub' };
  const vinculos = p.vinculos || [];
  const ativas = vinculos.filter(v => !v.desligado).map(v => nomes[v.servico] || v.servico);
  if (p.pastaLocal) ativas.push('Pasta local');
  const desligadas = vinculos.filter(v => v.desligado).length;
  const n = ativas.length;
  return (n ? n + (n === 1 ? ' conexão' : ' conexões') + ' · ' + ativas.join(', ') : 'Sem conexões')
    + (desligadas ? ' · ' + desligadas + (desligadas === 1 ? ' desligada' : ' desligadas') : '');
}

const AJUDA_DO_MODO = {
  jira: 'Só ver: o Prumo e os agentes apenas leem o Jira. Integrado: você publica os defeitos e melhorias que abriu no Jira, comenta resultados, anexa evidências e muda o status, tudo com os agentes e sempre com a sua confirmação.',
  qase: 'Só ver: o Prumo e os agentes apenas leem o Qase. Integrado: criar casos, defeitos e runs e publicar resultados no Qase, sempre com a sua confirmação.',
  github: 'Só ver: o Prumo e os agentes apenas leem o repositório. Integrado: criar issues e branches, gravar testes e abrir Pull Request em rascunho, sempre com a sua confirmação.'
};

/** Desenha vínculos do projeto com comandos isolados por serviço, sem misturar repositórios. */
function montarFluxoProjeto(espaco, abrirConexao, escrita = null) {
  const vinculo = servico => (espaco.vinculos || []).find(v => v.servico === servico);
  const atualizar = fn => async () => { const r = await chamar(fn); if (r && !r.canceled) mostrar('projetos'); };
  // A confirmação do Windows tem "Cancelar" como padrão: se a pessoa só apertar Enter, nada é gravado. Avisa e relê o estado real para a tela não sugerir o contrário.
  const alterarEscrita = async (servico, integrar) => {
    const r = await chamar(() => api.escritaHabilitar(espaco.id, servico, integrar));
    if (r?.canceled) avisar(tr('Alteração cancelada: o modo do {servico} continua como estava. Confirme na janela do Windows para integrar.', { servico: servico[0].toUpperCase() + servico.slice(1) }), true);
    mostrar('projetos');
  };
  const origens = [{
    servico: 'manual', nome: 'Manual / Prumo', vinculado: espaco.manualAtivo !== false,
    estado: espaco.manualAtivo === false ? 'Desativado' : 'Disponível',
    detalhe: espaco.manualAtivo === false ? 'Criação de casos e tickets locais suspensa; registros antigos preservados' : 'Casos, propostas e tickets locais',
    acoes: [[espaco.manualAtivo === false ? 'Ativar manual' : 'Desativar manual', atualizar(() => api.espacoManual(espaco.id, espaco.manualAtivo === false))]]
  }];
  for (const servico of ['jira', 'qase', 'github']) {
    const v = vinculo(servico);
    const nome = { jira: 'Jira · gestão', qase: 'Qase · qualidade', github: 'GitHub · código' }[servico];
    origens.push({
      servico, nome, vinculado: !!v, desligado: !!v?.desligado, estado: v?.estado || 'Não vinculado',
      // Dois modos por ligação: só ver (nada vai ao serviço) ou integrado (publicar, comentar e editar com os agentes, sempre com a sua confirmação).
      modo: v && !v.desligado ? { integrado: !!escrita?.[servico], aoAlterar: integrar => alterarEscrita(servico, integrar), ajuda: AJUDA_DO_MODO[servico] } : null,
      detalhe: v ? v.recurso.chave + ' · ' + (escrita?.[servico] ? tr('integrado') : tr('só leitura')) : 'Escolha um projeto da conta conectada',
      acoes: v ? [
        // Desligar agora impede consultas e escrita também no backend (não só a cor do cabo).
        [v.desligado ? 'Ligar' : 'Desligar', atualizar(() => api.servicoAlternar(espaco.id, servico, !!v.desligado))],
        ...(v.desligado ? [] : [['Verificar', atualizar(() => api.servicoConferir(espaco.id, servico))]]),
        ['Remover', atualizar(() => api.servicoDesvincular(espaco.id, servico))],
        ...(servico === 'github' ? [['Usar clone na IDE', () => window.PrumoCodigo.origem(espaco)]] : [])
      ] : [['Conectar', () => abrirConexao(servico)]]
    });
  }
  origens.push({
    servico: 'local', nome: 'Pasta local', vinculado: !!espaco.pastaLocal,
    estado: espaco.pastaLocal ? 'Vinculada' : 'Não vinculada',
    detalhe: espaco.pastaLocal || 'Código e arquivos deste computador',
    acoes: [[espaco.pastaLocal ? 'Trocar pasta' : 'Escolher pasta',
      atualizar(() => api.espacoPasta(espaco.id))], [espaco.pastaLocal ? 'Código e publicação' : 'Criar projeto do zero', () => window.PrumoCodigo.origem(espaco)]]
  });
  return DS.fluxoProjeto({
    nome: espaco.nome, descricao: espaco.descricao, codigo: espaco.id,
    selecionado: estado.espaco?.id === espaco.id, servicos: origens,
    abrirConexao
  });
}

/** Abre a configuração de serviços no escopo do projeto, sem mudar vínculos dos demais. */
function abrirPainelDeConexoes() {
  // Usado pelos atalhos de Agentes: a configuração aparece sobre a bancada de Projetos.
  (estado.sub ||= {}).projetos = 'conexoes';
  return mostrar('projetos');
}

/** Projetos: uma bancada por vez; as bolhas abrem o painel de conexão. */
function montarSecaoProjeto(espaco, projetos, escrita = null) {
  const shell = h('section', { class: 'ds-proj-workspace', 'data-espaco': espaco.id });
  const sobreposicao = h('div', { class: 'ds-proj-sobreposicao', id: 'projeto-painel', hidden: true });
  const conteudo = h('div', { class: 'ds-proj-painel-corpo' });
  const titulo = h('h2', { id: 'projeto-painel-titulo', tabindex: '-1' });
  const trilhaDoPainel = h('div', { class: 'ds-proj-trilha' });
  // O painel ocupa o lugar da bancada (CSS): foco vai para o título ao abrir e volta para quem abriu ao fechar.
  let origemDoFoco = null;
  const fechar = () => { sobreposicao.hidden = true; conteudo.replaceChildren(); origemDoFoco?.focus?.(); origemDoFoco = null; };
  sobreposicao.append(h('div', { class: 'ds-proj-painel', role: 'region', 'aria-labelledby': 'projeto-painel-titulo' },
    h('header', { class: 'ds-proj-painel-cab' }, h('div', { class: 'ds-proj-painel-titulos' }, trilhaDoPainel, titulo),
      h('button', { type: 'button', class: 'ds-proj-fechar', 'aria-label': 'Fechar painel e voltar à bancada', onclick: fechar }, 'Fechar ×')),
    conteudo));
  function abrirPainel(rotulo, { trilha = true } = {}) {
    if (sobreposicao.hidden) origemDoFoco = document.activeElement;
    titulo.textContent = rotulo;
    // Trilha: de qualquer painel dá para voltar ao mapa do projeto.
    trilhaDoPainel.replaceChildren(...(trilha && DS.trilha ? [DS.trilha([['Projetos', fechar]], { semAtual: false })] : []));
    conteudo.replaceChildren();
    sobreposicao.hidden = false;
    conteudo.scrollTo?.(0, 0);
    titulo.focus?.();
    return conteudo;
  }
  function abrirConexao(servico) {
    if (servico === 'local') {
      const area = abrirPainel('Pasta local');
      area.append(h('p', { class: 'ds-sub' }, 'Escolha uma pasta deste computador para trabalhar com o código do projeto.'),
        DS.acao('Escolher pasta', async () => { const r=await chamar(() => api.espacoPasta(espaco.id)); if(r && !r.canceled) mostrar('projetos'); }));
      return;
    }
    if (servico === 'manual') { abrirFormularioProjeto(abrirPainel('Editar dados do projeto'), espaco, fechar); return; }
    const area = abrirPainel('Conexão com ' + ({ jira:'Jira', qase:'Qase', github:'GitHub' }[servico] || servico));
    const corpo = h('div', { class: 'repos-github ds-proj-painel-recursos' });
    area.append(DS.abas([['recursos', 'Projetos disponíveis'], ['contas', 'Contas e permissões']], 'recursos', k => (k === 'recursos' ? recursos() : gerenciar()), { rotulo: 'Conexão', id: 'projeto-abas' }), corpo);
    function recursos() { void abrirProjetosDaOrigem(corpo, servico, espaco, conectar); }
    function conectar() {
      corpo.replaceChildren();
      void mostrarConexoesDoProjeto(corpo, espaco, servico, { soFormulario: true, aoConectar: () => { avisar('Conta conectada.'); recursos(); }, aoCancelar: recursos });
    }
    async function gerenciar() {
      const destino = h('div');
      corpo.replaceChildren(DS.carregando('Consultando contas...'));
      await mostrarConexoesDoProjeto(destino, espaco, servico);
      corpo.replaceChildren(destino);
    }
    recursos();
  }
  function trocar() {
    const area = abrirPainel('Trocar projeto');
    area.append(h('p', { class:'ds-sub' }, 'Escolha o projeto que deseja usar. As conexões de um não alteram as do outro.'),
      h('div', { class:'ds-proj-opcoes' }, projetos.map(p =>
        h('button', { type:'button', class:'ds-proj-opcao', 'data-projeto':p.id,
          'aria-current': p.id === espaco.id ? 'true' : 'false',
          onclick: () => { fechar(); void escolherEspaco(p); } },
          h('strong', {}, p.nome), h('span', { class:'ds-proj-opcao-resumo' }, (p.id===espaco.id ? 'Projeto atual · ' : '') + resumoDasConexoes(p))))),
      DS.acao('Criar outro projeto', () => abrirFormularioProjeto(abrirPainel('Novo projeto manual'), null, fechar), { id:'projeto-criar-troca', primaria:true }));
  }
  /** Portão de importação: de onde vem e, depois, criar um projeto novo ou vincular a um existente. Nunca decide sozinho. */
  function escolherImportacao() {
    const raiz = [['Projetos', fechar], ['Importar', escolherImportacao]];
    const area = abrirPainel('De onde vem?');
    area.append(
      h('div', { class:'cx-passo-linha' }, h('span', { class:'cx-fala' }, 'Escolha a origem e depois decida onde ela entra.'),
        infoCx('Cada projeto do Prumo acompanha um único destino por ferramenta. Importar cria um projeto novo (só com a conexão escolhida) ou vincula ao projeto que você indicar.')),
      h('div', { class:'ds-proj-origens' }, [['qase','Qase'],['jira','Jira'],['github','GitHub']].map(([servico, nome]) =>
        DS.acao(nome, () => {
          const abrirLista = () => abrirProjetosDaOrigem(abrirPainel('Escolher no ' + nome, { trilha: false }), servico, null, autorizar, raiz);
          const autorizar = () => {
            const areaConta = abrirPainel('Conectar o ' + nome, { trilha: false });
            void mostrarConexoesDoProjeto(areaConta, null, servico, { soFormulario:true, aoConectar:() => { avisar('Conta conectada.'); void abrirLista(); }, aoCancelar:abrirLista });
          };
          void abrirLista();
        }, { id:'espaco-importar-'+servico, compacto:true })).concat([
        DS.acao('Pasta do computador', () => importarPasta(abrirPainel('Pasta do computador', { trilha: false }), raiz), { id:'espaco-importar-pasta', compacto:true }),
        DS.acao('Projeto manual', () => abrirFormularioProjeto(abrirPainel('Projeto manual'), null, fechar), { id:'espaco-importar-manual', compacto:true })])));
  }
  /** Pasta local: um projeto novo com a pasta ou a pasta de um projeto que ainda não tem uma (a mesma pasta nunca fica em dois projetos). */
  function importarPasta(area, raiz) {
    const semPasta = (projetos || []).filter(p => !p.pastaLocal);
    const nomeNovo = h('input', { type: 'text', id: 'importar-pasta-nome', placeholder: 'Nome do projeto', maxlength: 80, 'aria-label': 'Nome do projeto novo' });
    area.replaceChildren(
      DS.trilha ? DS.trilha([...raiz, ['Pasta do computador']], { semAtual: false }) : null,
      h('div', { class:'cx-passo-linha' }, h('h2', {}, 'Onde entra a pasta?'),
        infoCx('A pasta precisa ter (ou ganhar) o qa.project.json. A mesma pasta não fica em dois projetos.')),
      h('div', { class:'proj-decisao' },
        h('section', { class:'proj-decisao-bloco' }, h('strong', {}, 'Projeto novo'), h('span', { class:'suave' }, 'Cria o projeto e abre a escolha da pasta. Se você cancelar, ele fica sem pasta e dá para escolher depois.'),
          nomeNovo,
          primaria(botao('Criar projeto e escolher a pasta', async () => {
            const nomeDoProjeto = nomeNovo.value.trim();
            if (!nomeDoProjeto) { avisar('Dê um nome ao projeto novo.', true); nomeNovo.focus?.(); return; }
            const novo = await chamar(() => api.espacoCriar({ nome: nomeDoProjeto, descricao: '' }));
            if (!novo) return;
            const r = await chamar(() => api.espacoPasta(novo.id));
            if (!r || r.canceled) avisar('Projeto criado sem pasta. Escolha a pasta quando quiser, em Pasta local.');
            escolherEspaco(novo);
          }, 'importar-pasta-nova'))),
        h('section', { class:'proj-decisao-bloco' }, h('strong', {}, 'Projeto que já existe'),
          semPasta.length
            ? h('ul', { class:'ds-lista proj-vinculos' }, semPasta.map(p => h('li', { class:'proj-vinculo' }, h('span', { class:'cx-item-nome' }, p.nome),
                botao('Escolher pasta', async () => { const r = await chamar(() => api.espacoPasta(p.id)); if (r && !r.canceled) escolherEspaco(p); }, 'importar-pasta-' + p.id))))
            : h('span', { class:'suave' }, 'Todos os projetos já têm pasta.'))));
  }
  const ferramenta = h('div', { class:'ds-proj-workspace-topo' },
    h('div', { class:'ds-proj-contexto' },
      h('span', { class:'ds-proj-legenda' }, 'PROJETO EM EXIBIÇÃO'),
      h('button', { type:'button', class:'ds-proj-trocar', id:'projetos-trocar', onclick:trocar }, espaco.nome, ' ▾')),
    h('div', { class:'ds-proj-atalhos' },
      DS.acao('Novo projeto', () => abrirFormularioProjeto(abrirPainel('Novo projeto manual'), null, fechar), { id:'espaco-novo', primaria:true }),
      DS.acao('Importar', escolherImportacao, { id:'projeto-importar', compacto:true }),
      DS.acao('Editar', () => abrirFormularioProjeto(abrirPainel('Editar projeto'), espaco, fechar), { id:'projeto-editar', compacto:true })));
  shell.append(ferramenta,
    montarFluxoProjeto(espaco, abrirConexao, escrita),
    h('div', { class:'ds-proj-workspace-rodape' },
      h('span', {}, 'Cada conexão pertence a este projeto.'),
      // Sem permissão à tela Testes o atalho não aparece (como na 2.19); o backend também recusa.
      (!window.PrumoConta || window.PrumoConta.pode('testes')) ? DS.acao('Abrir testes', () => escolherEspaco(espaco,'testes'), { compacto:true, id:'espaco-testes-'+espaco.id }) : null,
      DS.acao('Contas e permissões', () => {
        const area=abrirPainel('Contas e permissões deste projeto');
        void mostrarConexoesDoProjeto(area,espaco);
      }, { compacto:true })),
    sobreposicao);
  shell.addEventListener('keydown', ev => { if(ev.key==='Escape' && !sobreposicao.hidden){ev.stopPropagation();fechar();} });
  // Pedido vindo do menu ("Criar projeto"): abre o formulário direto, sem mais um clique.
  if (estado.sub?.projetos === 'novo') { delete estado.sub.projetos; setTimeout(() => abrirFormularioProjeto(abrirPainel('Novo projeto manual'), null, fechar)); }
  // Projeto recém-criado sem repositório: pede a pasta local ou o repositório do GitHub.
  if (estado.sub?.projetos === 'repositorio') {
    delete estado.sub.projetos;
    if (!espaco.pastaLocal && !(espaco.vinculos || []).some(v => v.servico === 'github')) setTimeout(() => {
      const area = abrirPainel('Escolha o repositório do projeto');
      area.append(h('p', { class: 'ds-sub' }, 'Com o repositório, os agentes analisam o código e já começam a trabalhar nele, seja desenvolvimento ou automação.'),
        h('div', { class: 'ds-proj-atalhos' },
          DS.acao('Criar projeto do zero', () => window.PrumoCodigo.criar(espaco), { id: 'repositorio-criar' }),
          DS.acao('Escolher pasta deste computador', async () => { const r = await chamar(() => api.espacoPasta(espaco.id)); if (r && !r.canceled) mostrar('projetos'); }, { id: 'repositorio-pasta', primaria: true }),
          DS.acao('Vincular repositório do GitHub', () => abrirConexao('github'), { id: 'repositorio-github' })));
    });
  }
  return shell;
}

/** Tela Projetos: um único mapa ativo; nenhum projeto começa vazio. */
abas.projetos = async elemento => {
  elemento.append(h('h1', {}, 'Projetos'));
  const projetos = await chamar(api.espacos);
  if (!projetos) {
    elemento.append(DS.estadoTela('erro', 'Não foi possível consultar os projetos',
      'Nenhum cadastro foi alterado.', [DS.acao('Tentar novamente', () => mostrar('projetos'))],
      { id: 'projetos-falha-consulta' })); return;
  }
  const ativo = projetos.find(p => p.id === estado.espaco?.id) || projetos[0] || null;
  // A bancada mostra o primeiro projeto quando nenhum foi escolhido: o menu e as outras telas passam a usar o mesmo.
  if (ativo && !estado.espaco) { estado.espaco = ativo; estado.root = ativo.raizContextos; estado.projetoSelecionadoId = ativo.id; estado.projetoNome = ativo.nome; const rotulo = typeof document !== 'undefined' && document.getElementById?.('projeto-atual'); if (rotulo) rotulo.textContent = ativo.nome; if (typeof atualizarMenuDoProjeto === 'function') atualizarMenuDoProjeto(ativo); }
  if (ativo && estado.espaco?.id === ativo.id) estado.espaco = ativo;
  if (!ativo) {
    const vazio = h('section', { class:'ds-proj-vazio', id:'projetos-vazio' });
    const apresentacao = h('div', { class:'ds-proj-vazio-apresentacao' });
    const corpo = h('div', { class:'ds-proj-vazio-corpo' });
    // Criar ou importar ocupa o lugar da apresentação, numa coluna centrada: nada empilhado com rolagem própria.
    const voltar = () => { definirDetalheDaTrilha(); etapa.hidden = true; corpo.replaceChildren(); apresentacao.hidden = false; apresentacao.querySelector?.('#espaco-novo')?.focus(); };
    const etapa = h('div', { class:'ds-proj-vazio-painel', hidden:true, onkeydown: ev => { if (ev.key === 'Escape') { ev.stopPropagation(); voltar(); } } },
      corpo);
    // A trilha da tela (Início › Projetos › Novo projeto) mostra onde a pessoa está; a importação desenha a própria trilha dentro do painel.
    const abrirEtapa = atual => { apresentacao.hidden = true; etapa.hidden = false; corpo.replaceChildren(); definirDetalheDaTrilha(atual ? [[atual]] : []); return corpo; };
    const novo = () => abrirFormularioProjeto(abrirEtapa('Novo projeto'), null, voltar);
    const importar = servico => {
      const abrirLista = () => abrirProjetosDaOrigem(abrirEtapa('Importar do ' + { jira: 'Jira', qase: 'Qase', github: 'GitHub' }[servico]), servico, null, autorizar);
      const autorizar = () => {
        corpo.replaceChildren();
        void mostrarConexoesDoProjeto(corpo, null, servico, { soFormulario: true, aoConectar: () => { avisar('Conta conectada.'); void abrirLista(); }, aoCancelar: abrirLista });
      };
      void abrirLista();
    };
    apresentacao.append(h('span', { class:'ds-proj-vazio-simbolo', 'aria-hidden':'true' }, '◎'),
      h('h2', {}, 'Comece criando seu primeiro projeto'),
      h('p', { class:'ds-sub' }, 'Crie sem conectar serviços. Você pode importar ou vincular contas depois.'),
      h('div', { class:'ds-proj-vazio-acoes' },
        DS.acao('Criar projeto manual', novo, { id:'espaco-novo', primaria:true }),
        DS.acao('Importar do Qase', () => importar('qase'), { id:'espaco-importar-qase' }),
        DS.acao('Importar do Jira', () => importar('jira'), { id:'espaco-importar-jira' }),
        DS.acao('Importar do GitHub', () => importar('github'), { id:'espaco-importar-github' })));
    vazio.append(apresentacao, etapa);
    elemento.append(vazio);
    // Pedido vindo do menu ("Criar projeto"): abre o formulário direto, sem mais um clique.
    if (estado.sub?.projetos === 'novo') { delete estado.sub.projetos; setTimeout(novo); }
    return;
  }
  const escrita = typeof escritaDoProjeto === 'function' ? await escritaDoProjeto(ativo).catch(() => null) : null;
  elemento.append(montarSecaoProjeto(ativo, projetos, escrita));
  if (estado.sub?.projetos === 'conexoes') {
    delete estado.sub.projetos;
    const botoes = elemento.querySelector?.('.ds-proj-workspace-rodape')?.querySelectorAll('button') || [];
    [...botoes].find(b => b.textContent.includes('Contas e permissões'))?.click();
  }
};

/** Integrações do projeto de qualidade: conta autorizada não implica vínculo com outro projeto. */
/** Tela Conexões: projetos Qase, permissões e formulário de vínculo. */
/** Conexões: seleção de projetos Qase em uma prévia temporária, sem duplicar formulários. */
function criarApresentacaoProjetosQase(controleQase,limparPrevia){
  function apresentarProjetos(pre,container,aoVoltar){
    controleQase.previaId=pre.previaId;
    const projetos=pre.projetos||[];
    const filtro=h('input',{id:'qase-busca',type:'search',placeholder:'Buscar por nome ou código','aria-label':'Buscar projetos Qase',autocomplete:'off'});
    const todos=h('input',{type:'checkbox',id:'qase-todos'});
    const lista=h('div',{id:'qase-projetos-lista',class:'cx-lista',role:'group','aria-label':'Projetos do Qase'});
    const status=h('span',{id:'qase-status',class:'suave'});
    const selecao=new Set();
    const visiveis=()=>projetos.filter(p=>(p.nome+' '+p.codigo).toLocaleLowerCase().includes(filtro.value.toLocaleLowerCase()));
    function render(){
      const encontrados=visiveis();
      lista.replaceChildren(...encontrados.map(p=>{
        const ck=h('input',{type:'checkbox','data-codigo':p.codigo,'aria-label':p.nome+' · '+p.codigo});
        ck.checked=selecao.has(p.codigo);
        ck.addEventListener('change',()=>{if(ck.checked)selecao.add(p.codigo);else selecao.delete(p.codigo);contar();});
        return h('label',{class:'cx-item'},ck,h('span',{class:'cx-item-nome'},p.nome),chipCx(p.codigo),
          p.jaImportado?chipCx('já no Prumo','ok'):p.conflitoOutraConta?chipCx('mesmo código em outra conexão','aviso'):null);
      }));
      if(!encontrados.length)lista.append(h('p',{class:'suave cx-vazio'},'Nenhum projeto corresponde à busca.'));
      todos.checked=encontrados.length>0&&encontrados.every(p=>selecao.has(p.codigo));
      contar();
    }
    function contar(){status.textContent=selecao.size+' de '+projetos.length+' escolhido(s)';importar.textContent=selecao.size?'Trazer '+selecao.size+(selecao.size===1?' projeto':' projetos'):'Trazer projetos';importar.disabled=!selecao.size;}
    todos.addEventListener('change',()=>{for(const p of visiveis()){if(todos.checked)selecao.add(p.codigo);else selecao.delete(p.codigo);}render();});
    filtro.addEventListener('input',render);
    const importar=primaria(botao('Trazer projetos',async()=>{
      if(!selecao.size){avisar('Escolha pelo menos um projeto.',true);return;}
      status.textContent='Trazendo…';
      const resultado=await chamar(()=>api.qaseImportar(controleQase.previaId,[...selecao]));
      if(!resultado){status.textContent='Não consegui concluir. Tente de novo.';return;}
      if(resultado.canceled){status.textContent='Tudo bem, nada foi trazido.';return;}
      controleQase.previaId=null;
      status.textContent=resultado.adicionados.length+' trazido(s) · '+resultado.existentes.length+' já estavam aqui · '+resultado.falhas.length+' com falha';
      if(resultado.falhas.length)status.textContent+=' ('+resultado.falhas.map(f=>f.codigo+': '+f.erro).join(', ')+')';
      else{
        // Cada projeto Qase vira um projeto Prumo com a sua conexão: abre o primeiro e os demais ficam no seletor do menu.
        const todos=typeof api.espacos==='function'?await chamar(api.espacos):null;
        const novos=(todos||[]).filter(e=>resultado.adicionados.includes((e.vinculos||[]).find(v=>v.servico==='qase')?.recurso?.chave));
        avisar(resultado.adicionados.length>1?'Pronto! Trouxe '+resultado.adicionados.length+' projetos do Qase. Troque entre eles no menu.':'Pronto! O projeto do Qase já está conectado.');
        if(novos.length)escolherEspaco(novos[0]);else mostrar('projetos');
      }
    },'qase-importar'));
    const achei=projetos.length===0?'Não achei projetos nesta conta.':projetos.length===1?'Achei 1 projeto. Traz comigo?':'Achei '+projetos.length+' projetos. Quais vêm comigo?';
    container.replaceChildren(
      h('div',{class:'cx-passo','data-passo':'3'},h('span',{class:'cx-passo-n','aria-hidden':'true'},'3'),
        h('div',{class:'cx-passo-corpo'},
          h('div',{class:'cx-passo-linha'},h('strong',{},achei),infoCx('Nada é enviado ao Qase nesta etapa. Cada projeto escolhido vira um projeto independente no Prumo.')),
          h('div',{class:'cx-barra'},filtro,h('label',{class:'cx-todos'},todos,' Todos')),
          lista,
          h('div',{class:'cx-rodape'},status,h('span',{class:'cx-acoes'},importar)))));
    container.prepend(DS.trilha([['Token do Qase',async()=>{await limparPrevia();container.replaceChildren();aoVoltar?.();}],['Escolher projetos']],{semAtual:false}));
    render();
  }
  return apresentarProjetos;
}

/** Conexões: apresenta permissões mínimas e instruções oficiais de configuração de cada serviço. */
// Permissões que o token precisa ter, com os nomes exatos das telas de cada serviço, para a pessoa não gerar um token incompleto.
const permissoesDoToken={
  github:{onde:'GitHub › Settings › Developer settings › Personal access tokens › Fine-grained tokens › Generate new token. Em Repository access, escolha só os repositórios que o Prumo vai usar.',
    itens:[['Issues','Read and write','listar issues e publicar bug ou melhoria (sem escrita, o GitHub descarta os rótulos)'],['Contents','Read-only','branches, commits e arquivos de teste; Read and write só para criar branch e gravar teste'],['Pull requests','Read-only','ver Pull Requests; Read and write só para abrir PR'],['Actions','Read-only','ver pipelines e execuções'],['Metadata','Read-only','obrigatória; o GitHub marca sozinho']]},
};
function blocoPermissoes(servico){
  const p=permissoesDoToken[servico];if(!p)return null;
  return h('div',{class:'cx-permissoes',id:'conexao-permissoes'},
    h('strong',{},'Permissões do token'),
    h('p',{class:'suave'},p.onde),
    h('ul',{},p.itens.map(([nome,nivel,para])=>h('li',{},h('span',{class:'cx-perm-nome'},nome),nivel!=='—'?chipCx(nivel,nivel.includes('write')?'aviso':null):null,h('span',{class:'suave'},para)))));
}

/** Conexões: apresenta o formulário Qase, Jira ou GitHub e solicita validação ao backend. */
function criarAberturaFormularioConexao({el,novo,form,limparPrevia,fecharPainel,apresentarProjetos,servicoFixo=false,aoConectar=null,vinculando=false,comProjeto=false}){
  function abrirPainel(servico,ancora){
    const tipo=h('select',{id:'conexao-servico','aria-label':'Serviço'},servicosConexao.map(([v,n])=>h('option',{value:v},n)));
    tipo.value=servico;
    const nome=campoPlataforma('Nome da conexão',{id:'conexao-nome',maxlength:100});
    const instancia=campoPlataforma('Nome do site Jira',{id:'conexao-instancia',placeholder:'empresa  (de empresa.atlassian.net)',maxlength:300});
    const usuario=campoPlataforma('E-mail da sua conta Atlassian',{id:'conexao-usuario',type:'email',placeholder:'o e-mail com que você entra no Jira'});
    const token=campoPlataforma('Token de acesso',{id:'conexao-token',type:'password',autocomplete:'off',maxlength:6000,'aria-label':'Token de acesso'});
    const tituloToken=h('span',{id:'conexao-token-titulo'});
    token.no.replaceChildren(tituloToken,token.input);
    const titulo=h('strong',{class:'cx-painel-titulo'});const ajuda=h('span',{id:'conexao-descricao'});
    const especificos=h('div',{id:'conexao-campos-especificos',class:'cx-campos'});
    const acoes=h('div',{id:'conexao-acoes',class:'cx-acoes'});
    const permissoes=h('div',{});
    const listaQase=h('div',{id:'conexao-qase-projetos'});
    const saidaQase=h('div',{id:'qase-conexao-resultado',role:'status','aria-live':'polite'});
    const autorizacaoGithub=h('div',{id:'github-autorizacao',role:'status','aria-live':'polite'});
    const camposCredencial=h('div',{id:'cx-campos-credenciais',class:'cx-form'},especificos,permissoes,token.no);
    const destinoCampos=h('div',{id:'cx-campos-padrao'},camposCredencial);
    const tituloAvancado=h('summary',{},'Configuração avançada · usar token manualmente');
    const DICA_AVANCADA='Use esta opção somente se a autorização pelo navegador não estiver disponível.';
    const dicaAvancada=h('p',{class:'suave'},DICA_AVANCADA);
    const acoesManuais=h('div',{class:'cx-acoes'});
    const avancadoGithub=h('details',{id:'github-token-avancado'},tituloAvancado,dicaAvancada,acoesManuais);
    let chamadaGithub=0;
    let chamadaAutorizacao=0;
    const concluido=()=>{if(aoConectar)aoConectar();else mostrar('projetos');};
    /** Mostra cada etapa da autorização pelo navegador (GitHub App ou Jira OAuth): igual em Windows, macOS e Linux, sem token na tela. */
    function mostrarAutorizacao(servico,dados,atual){
      const rotulo=servico==='jira'?'Jira':'GitHub';
      const status=h('p',{class:'suave'},'Aguardando a autorização no navegador...');
      if(dados.estado==='CONECTADO'){
        if(!dados.instalarAplicativo){concluido();return;}
        autorizacaoGithub.replaceChildren(
          h('p',{},'Conta GitHub conectada. Falta escolher em quais repositórios o Prumo QA pode ler: o GitHub só mostra os repositórios onde o aplicativo foi instalado.'),
          botao('Escolher repositórios no GitHub',async()=>{const r=await api.abrirCadastroExterno('github');if(!r?.ok)avisar('Não foi possível abrir o navegador.',true);},'github-instalar'),
          botao('Já escolhi, continuar',concluido,'github-instalado'));
        return;
      }
      if(dados.estado==='ESCOLHER_SITE'){
        autorizacaoGithub.replaceChildren(h('p',{},'Em qual site Jira você quer conectar?'),
          ...(dados.sites||[]).map(site=>botao(site.nome+' · '+site.url.replace('https://',''),async()=>{
            const r=await api.autorizacaoEscolherSite(site.id).catch(e=>({ok:false,error:'RENDERER: '+(e?.message||e)}));
            if(atual!==chamadaAutorizacao)return;
            if(!r?.ok){autorizacaoGithub.replaceChildren(h('p',{class:'cx-erro'},textoDoErro(r,'Não foi possível conectar este site.')));return;}
            mostrarAutorizacao(servico,r.data,atual);
          },'jira-site-'+site.id)));
        return;
      }
      if(dados.estado==='ERRO'){
        autorizacaoGithub.replaceChildren(h('p',{class:'cx-erro'},dados.mensagem||'Não foi possível conectar '+rotulo+'.'));
        if(dados.indisponivel)avancadoGithub.open=true;
        return;
      }
      if(dados.estado!=='AGUARDANDO'){
        autorizacaoGithub.replaceChildren(h('p',{class:'cx-erro'},'Autorização '+(dados.estado==='EXPIRADO'?'expirada':dados.estado==='NEGADO'?'recusada':'cancelada')+'. Nada foi conectado.'));
        return;
      }
      autorizacaoGithub.replaceChildren(
        h('p',{},'O navegador abriu a página do '+rotulo+'. Autorize o Prumo QA e volte para cá: a conexão termina sozinha.'),
        h('div',{class:'cx-passo-linha'},status,infoCx(servico==='jira'?'Você escolhe os sites que o Prumo pode acessar. A escrita no Jira continua desligada até você habilitá-la por projeto.':'Você escolhe os repositórios que o Prumo pode ler. A escrita no GitHub continua desligada até você habilitá-la por projeto.')),
        botao('Cancelar autorização',async()=>{chamadaAutorizacao++;await api.autorizacaoEstado(true);autorizacaoGithub.replaceChildren();},'autorizacao-cancelar'));
      const consultar=async()=>{
        if(atual!==chamadaAutorizacao||!form.isConnected)return;
        const r=await api.autorizacaoEstado().catch(()=>null);
        if(atual!==chamadaAutorizacao)return;
        if(!r?.ok){status.textContent='Não foi possível confirmar a conexão. Tente novamente.';return;}
        if(r.data.estado==='AGUARDANDO'){setTimeout(consultar,2000);return;}
        mostrarAutorizacao(servico,r.data,atual);
      };
      setTimeout(consultar,1500);
    }
    /** Erro do núcleo chega como texto "CODIGO: explicação" (ou objeto); mostra a explicação e deixa o código visível para o suporte. */
    const textoDoErro=(r,padrao)=>{const e=r?.error;const t=String(typeof e==='string'?e:e?.message||'').trim();if(!t)return padrao;const m=/^([A-Z][A-Z0-9_]{2,63})(?::\s*(.*))?$/s.exec(t);return m?(m[2]?m[2]+' ':padrao+' ')+'('+m[1]+')':t;};
    async function autorizarPeloNavegador(servico){
      const atual=++chamadaAutorizacao;chamadaGithub++;
      autorizacaoGithub.replaceChildren(DS.carregando('Abrindo o navegador...'));
      const r=await api.autorizarServico(servico).catch(e=>({ok:false,error:'RENDERER: '+(e?.message||e)}));
      if(atual!==chamadaAutorizacao)return;
      // Sem o serviço central configurado, o GitHub volta ao caminho do Git Credential Manager (Windows) e o Jira, ao token manual.
      if(r?.ok&&r.data.estado==='ERRO'&&r.data.indisponivel&&servico==='github')return conectarPeloGithub();
      if(!r?.ok){autorizacaoGithub.replaceChildren(h('p',{class:'cx-erro'},textoDoErro(r,'Não foi possível iniciar a conexão.')));return;}
      mostrarAutorizacao(servico,r.data,atual);
    }
    async function conectarPeloGithub(usuarioGitHub){
      const atual=++chamadaGithub;
      autorizacaoGithub.replaceChildren(DS.carregando('Conectando à conta GitHub do Windows...'));
      const resposta=await api.githubConectar(usuarioGitHub).catch(()=>null);
      if(atual!==chamadaGithub)return;
      if(!resposta?.ok){
        autorizacaoGithub.replaceChildren(h('p',{class:'cx-erro'},
          String(resposta?.error?.message||'Não foi possível iniciar a conexão. Se o Git Credential Manager não estiver instalado, peça à Administração a configuração OAuth uma única vez.')));
        return;
      }
      function escolherConta(contas){
        autorizacaoGithub.replaceChildren(
          h('p',{},'Selecione qual conta GitHub deste computador deseja vincular ao Prumo:'),
          ...contas.map(conta=>botao('Usar '+conta,()=>conectarPeloGithub(conta))));
      }
      const dados=resposta.data;
      if(dados.estado==='ESCOLHER_CONTA'){escolherConta(dados.contas||[]);return;}
      if(dados.estado==='CONECTADO'){if(aoConectar)aoConectar();else mostrar('projetos');return;}
      if(dados.estado==='ERRO'){
        autorizacaoGithub.replaceChildren(h('p',{class:'cx-erro'},dados.mensagem||'Não foi possível conectar a conta GitHub.'));
        return;
      }
      const status=h('p',{class:'suave'},'Conectando com segurança...');
      autorizacaoGithub.replaceChildren(
        h('p',{},'O Prumo usará a conta GitHub autorizada neste Windows. Se necessário, o Git Credential Manager abrirá o navegador.'),
        h('p',{class:'suave'},'Confira as permissões: a credencial pode permitir acesso amplo aos repositórios. A escrita do Prumo permanece desligada até você habilitá-la por projeto.'),
        status,
        botao('Cancelar autorização',async()=>{chamadaGithub++;await api.githubConexaoEstado(true);autorizacaoGithub.replaceChildren();})
      );
      async function consultar(){
        if(atual!==chamadaGithub||!form.isConnected)return;
        const r=await api.githubConexaoEstado().catch(()=>null);
        if(atual!==chamadaGithub)return;
        if(!r?.ok){status.textContent='Não foi possível confirmar a conexão. Tente novamente.';return;}
        const situacao=r.data;
        if(situacao.estado==='AGUARDANDO'){
          status.textContent='Aguardando a conta GitHub...';
          setTimeout(consultar,2000);
        }else if(situacao.estado==='CONECTADO'){
          status.textContent='Conta do GitHub conectada com sucesso.';
          if(aoConectar)aoConectar();else mostrar('projetos');
        }else if(situacao.estado==='ESCOLHER_CONTA')escolherConta(situacao.contas||[]);
        else if(situacao.estado==='ERRO')status.textContent=situacao.mensagem||'Não foi possível concluir a conexão.';
        else status.textContent='Autorização '+(situacao.estado==='EXPIRADO'?'expirada':situacao.estado==='NEGADO'?'recusada':'cancelada')+'.';
      }
      setTimeout(consultar,1500);
    }
    let falaDoJira=null;
    let detalhesJira=null;
    let resumoDoJira=()=>{};
    const passo=(n,rotulo,...conteudo)=>h('div',{class:'cx-passo','data-passo':String(n)},h('span',{class:'cx-passo-n','aria-hidden':'true'},String(n)),h('div',{class:'cx-passo-corpo'},h('strong',{},rotulo),...conteudo));
    /** "empresa", "empresa.atlassian.net" ou um link qualquer do Jira: só o nome do site interessa (e só nome de site válido vira nome da conexão). */
    const nomeDoSiteJira=texto=>(/^(?:https?:\/\/)?([a-z0-9][a-z0-9-]{0,62})(?:\.atlassian\.net)?(?:[/?#].*)?$/i.exec(String(texto||'').trim())||[])[1]||'';
    let chamadaQase=0;
    function trocar(){
      chamadaQase++;void limparPrevia();listaQase.replaceChildren();saidaQase.replaceChildren();token.input.value='';
      instancia.input.value='';usuario.input.value='';
      token.no.replaceChildren(tituloToken,token.input);
      const qase=tipo.value==='qase', github=tipo.value==='github';
      chamadaGithub++;chamadaAutorizacao++;
      autorizacaoGithub.replaceChildren();
      const jira=tipo.value==='jira';
      // GitHub e Jira: autorização no navegador como caminho principal; o token manual fica em Configuração avançada.
      if(github){avancadoGithub.replaceChildren(tituloAvancado,dicaAvancada,camposCredencial,acoesManuais);avancadoGithub.hidden=false;avancadoGithub.open=false;destinoCampos.replaceChildren();if(github&&!nome.input.value)nome.input.value='GitHub';}
      else if(!jira){destinoCampos.replaceChildren(camposCredencial);avancadoGithub.hidden=true;}
      titulo.textContent=qase?(vinculando?'Conectar o Qase':'Trazer projetos do Qase'):'Conectar o '+(servicosConexao.find(x=>x[0]===tipo.value)?.[1]||tipo.value);
      especificos.replaceChildren(...(qase||jira?[]:[nome.no]),...(jira?[instancia.no,usuario.no]:[]));
      ajuda.replaceChildren(...(qase?[h('span',{class:'cx-fala'},vinculando?(comProjeto?'Cole seu token e eu conecto o Qase a este projeto.':'Cole seu token e eu conecto o Qase.'):'Cole seu token e eu mostro seus projetos.'),
        infoCx('O token fica só no cofre deste computador e só depois da sua confirmação. Ele herda o seu papel no Qase: leitura para ver projetos, casos, suites, runs e defeitos; escrita para criar casos, defeitos e runs e publicar resultados.')]
        :jira?[falaDoJira=h('span',{class:'cx-fala'},'Autorize no navegador e escolha o site. Sem token.'),
          infoCx('A escrita no Jira continua desligada até você habilitá-la por projeto. No caminho por token, o token herda as permissões da sua conta no Jira: ver projeto e tickets, criar itens, comentar e, se quiser, mudar status.')]
        :[infoCx('Autorize sua conta no navegador e escolha o repositório. Não precisa gerar nem colar um token.')]));
      permissoes.replaceChildren(...(qase||jira?[]:[blocoPermissoes(tipo.value)].filter(Boolean)));
      tituloToken.textContent=qase||jira?'':'Token pessoal do GitHub (PAT)';
      tituloAvancado.textContent=jira?'Prefiro usar um token de API':'Configuração avançada · usar token manualmente';
      dicaAvancada.textContent=DICA_AVANCADA;
      token.input.placeholder=qase?'Seu token do Qase':'Cole o token de acesso';
      acoesManuais.replaceChildren(...(github?[salvarManual]:[]));
      let botaoJira=null;
      if(qase){
        // Três passos, um de cada vez: pegar o token, colar, escolher. Depois de verificado, o token some da tela.
        const passos=h('div',{id:'qase-passos',class:'cx-passos'});
        const verificado=h('div',{id:'qase-verificado',class:'cx-verificado',hidden:true},h('span',{},'✓ Token verificado e já apagado da tela.'),
          botao('Usar outro token',async()=>{await limparPrevia();listaQase.replaceChildren();voltar();},'qase-outro-token'));
        const voltar=()=>{passos.hidden=false;verificado.hidden=true;token.input.focus?.();};
        const conectarQase=primaria(botao(vinculando?'Conectar':'Ver meus projetos',async()=>{
          saidaQase.replaceChildren();
          const valor=token.input.value.trim();
          if(!valor){saidaQase.replaceChildren(h('p',{class:'cx-erro'},'Cole o token do Qase primeiro.'));token.input.focus?.();return;}
          // O próprio botao() já desliga o botão durante a ação (evita clique duplo); conferir disabled aqui bloqueava toda consulta.
          const chamada=++chamadaQase;
          try{
            const resposta=await api.qasePrever(valor);
            // A pessoa trocou de serviço enquanto o Qase respondia: a prévia não é mais de ninguém, então é descartada.
            if(chamada!==chamadaQase||tipo.value!=='qase'){if(resposta?.ok)await api.qaseCancelar(resposta.data.previaId);return;}
            if(!resposta?.ok){saidaQase.replaceChildren(h('p',{class:'cx-erro'},mensagemFalhaQase(resposta?.error)));return;}
            if(vinculando){
              // Dentro de um projeto do Prumo: só conecta a conta; quem escolhe o projeto do Qase (um só) é a tela seguinte.
              const conta=await api.qaseConectar(resposta.data.previaId);
              if(chamada!==chamadaQase||tipo.value!=='qase')return;
              if(!conta?.ok){saidaQase.replaceChildren(h('p',{class:'cx-erro'},mensagemFalhaQase(conta?.error)));return;}
              token.input.value='';concluido();return;
            }
            token.input.value='';
            passos.hidden=true;verificado.hidden=false;
            apresentarProjetos(resposta.data,listaQase,voltar);
          }catch{
            saidaQase.replaceChildren(h('p',{class:'cx-erro'},'Não consegui concluir a consulta. Tente de novo. Nada foi salvo.'));
          }
        },'qase-conectar'));
        const abrirQase=botao('Abrir o Qase',async()=>{
          const r=await api.abrirCadastroExterno('qase');
          if(!r?.ok)avisar('Não consegui abrir o navegador. Confira sua conexão.',true);
        },'integracao-abrir-qase');
        passos.append(
          passo(1,'Pegue seu token',h('div',{class:'cx-passo-linha'},abrirQase,h('span',{class:'suave'},'Perfil › API tokens › criar token'))),
          passo(2,'Cole aqui',h('div',{class:'cx-passo-linha cx-passo-token'},token.input,conectarQase)));
        destinoCampos.replaceChildren(passos,verificado);
      }
      acoes.replaceChildren(...(github
        ?[primaria(botao('Conectar com GitHub',()=>autorizarPeloNavegador('github'),'github-autorizar'))]
        :qase?[]
        :[botaoJira=primaria(botao('Conectar com Jira',()=>autorizarPeloNavegador('jira'),'jira-autorizar'))]),
        botao('Cancelar',fecharPainel));
      // O Qase não tem OAuth público (passo 1 acima). O Jira por token também é em passos: gerar, colar e, só se faltar, confirmar site e e-mail.
      if(jira){
        const abrirJira=botao('Abrir a Atlassian',async()=>{
          const r=await api.abrirCadastroExterno('jira');
          if(!r?.ok)avisar('Não consegui abrir o navegador. Confira sua conexão.',true);
        },'integracao-abrir-jira');
        const resumoJira=h('summary',{},'Nome do site Jira');
        const dadosJira=h('details',{id:'jira-dados',class:'cx-jira-dados'},resumoJira,instancia.no);
        const atualizarResumoJira=()=>{
          const site=nomeDoSiteJira(instancia.input.value);
          resumoJira.textContent=site?'Site '+site+'  (alterar)':'Nome do site Jira (só se eu não achar sozinho)';
        };
        instancia.input.addEventListener('input',atualizarResumoJira);
        detalhesJira=dadosJira;resumoDoJira=atualizarResumoJira;dadosJira.open=false;atualizarResumoJira();
        avancadoGithub.replaceChildren(tituloAvancado,dicaAvancada,h('div',{class:'cx-passos'},
          passo(1,'Gere seu token',h('div',{class:'cx-passo-linha'},abrirJira,h('span',{class:'suave'},'Segurança › Criar token de API › copie'))),
          passo(2,'Cole aqui',usuario.no,h('div',{class:'cx-passo-linha cx-passo-token'},token.input,salvarJira),h('span',{class:'suave'},'Com o e-mail e o token eu descubro o seu site Jira sozinho.')),
          dadosJira));
        avancadoGithub.hidden=false;avancadoGithub.open=false;destinoCampos.replaceChildren();
        void preencherJiraConhecido(dadosJira,atualizarResumoJira);
      }
      if(jira){if(typeof api.autorizacaoDisponivel==='function')botaoJira.hidden=true;void checarDisponibilidade('jira',botaoJira);}
    }
    /** Site e e-mail do Jira vêm de uma conexão anterior ou da conta do Prumo; quando os dois são conhecidos, só o token precisa ser colado. */
    async function preencherJiraConhecido(detalhes,atualizar){
      const r=typeof api.servicos==='function'?await api.servicos().catch(()=>null):null;
      if(tipo.value!=='jira')return;
      const antiga=[...(r?.ok&&Array.isArray(r.data)?r.data:[])].reverse().find(c=>c.servico==='jira'&&c.ativa&&c.usuario&&c.instancia);
      if(antiga){if(!instancia.input.value)instancia.input.value=nomeDoSiteJira(antiga.instancia);if(!usuario.input.value)usuario.input.value=antiga.usuario;}
      atualizar();
      detalhes.open=false;
    }
    /** Pergunta ao serviço do Prumo se o aplicativo oficial do Jira já está ativo; se não, mostra direto o caminho por token, sem botão que falha. */
    async function checarDisponibilidade(servico,botaoNavegador){
      if(typeof api.autorizacaoDisponivel!=='function')return;
      const r=await api.autorizacaoDisponivel().catch(()=>null);
      if(tipo.value!==servico)return;
      // Não deu para perguntar (sessão, rede): na dúvida o botão aparece e a própria tentativa explica o que houve.
      if(!r?.ok||r.data?.[servico]){botaoNavegador.hidden=false;return;}
      botaoNavegador.hidden=true;
      if(falaDoJira)falaDoJira.textContent='Cole seu token de API e eu conecto o Jira.';
      avancadoGithub.open=true;
      dicaAvancada.textContent='A conexão pelo navegador ainda não está ativa neste ambiente. Use um token de API: leva um minuto.';
    }
    tipo.addEventListener('change',trocar);
    const salvarManual=primaria(botao('Validar e guardar token',async()=>{
      const dados={servico:'github',nome:nome.input.value.trim(),token:token.input.value};
      try{const resultado=await chamar(()=>api.servicoAdicionar(dados));if(resultado&&!resultado.canceled){if(aoConectar)aoConectar();else mostrar('projetos');}}
      finally{token.input.value='';dados.token='';}
    },'github-token-salvar'));
    /** Erros do Jira em português claro; o código técnico só aparece quando não há explicação melhor. */
    const mensagemFalhaJira=erro=>{
      const codigo=/^[A-Z][A-Z0-9_]{2,70}/.exec(String(erro||''))?.[0]||'';
      const mensagens={
        SERVICE_DESTINATION_BLOCKED:'Não reconheci o site. Use o endereço que você abre no navegador, como empresa.atlassian.net.',
        SERVICE_NOT_FOUND:'Não achei esse site no Jira. Confira o nome do site.',
        CREDENTIAL_INVALID_OR_EXPIRED:'O Jira não aceitou o e-mail e o token. Confira o e-mail da sua conta Atlassian ou gere outro token.',
        SERVICE_PERMISSION:'Essa conta não tem permissão de ver projetos no Jira.',
        JIRA_EMAIL_REQUIRED:'Informe o e-mail da sua conta Atlassian.',
        CONNECTION_DUPLICATE:'Esse Jira já está conectado. Escolha o projeto nele.',
        SERVICE_UNAVAILABLE:'Não consegui falar com o Jira. Confira sua conexão e tente de novo.',
        SERVICE_TIMEOUT:'O Jira demorou demais. Tente de novo.',
        CREDENTIAL_PROTECTION_UNAVAILABLE:'O cofre do sistema não está disponível, então não consigo guardar o token.'
      };
      return mensagens[codigo]||'Não consegui conectar o Jira. Confira os dados e tente de novo.';
    };
    const salvarJira=primaria(botao('Conectar',async()=>{
      saidaQase.replaceChildren();
      const aviso=(texto,campo)=>{if(detalhesJira&&campo===instancia.input)detalhesJira.open=true;saidaQase.replaceChildren(h('p',{class:'cx-erro'},texto));campo?.focus?.();};
      if(!token.input.value.trim())return aviso('Cole o token primeiro. Em "Gere seu token" está o caminho para criá-lo.',token.input);
      let site=instancia.input.value.trim(),email=usuario.input.value.trim();
      // Só o token: o núcleo procura o site pelo e-mail e pelas conexões que você já tem, e o próprio Jira confirma. Site e e-mail só são pedidos se não achar.
      if(!(nomeDoSiteJira(site)&&email)){
        saidaQase.replaceChildren(h('p',{class:'suave'},'Procurando o seu Jira…'));
        const d=await api.jiraDescobrir(token.input.value,email||undefined).catch(()=>null);
        if(!d?.ok)return aviso('Não consegui procurar o seu Jira agora. Confira sua conexão e tente de novo.');
        const achado=d.data;
        if(!achado.achou){
          if(achado.motivo==='CREDENCIAL_RECUSADA')return aviso('O Jira não aceitou esse e-mail com o token. Confira o e-mail da conta Atlassian em que você criou o token (pode ser diferente do e-mail do Prumo).',usuario.input);
          return email
            ?aviso('Não achei o seu site Jira pelo e-mail. Digite o nome dele (o que vem antes de .atlassian.net) e clique em Conectar.',instancia.input)
            :aviso('A Atlassian não diz de quem é o token, então preciso do e-mail da conta onde você o criou (pode ser diferente do e-mail do Prumo). Digite acima: com ele eu acho o site sozinho.',usuario.input);
        }
        site=achado.site;email=achado.usuario;instancia.input.value=site;usuario.input.value=email;resumoDoJira();
        saidaQase.replaceChildren();
      }
      const dados={servico:'jira',nome:'Jira · '+(nomeDoSiteJira(site)||'site'),token:token.input.value,instancia:site,usuario:email};
      try{
        const r=await api.servicoAdicionar(dados).catch(()=>null);
        if(!r?.ok)return aviso(mensagemFalhaJira(r?.error));
        // Em erro o token fica no campo (corrigir um caractere não obriga a colar tudo de novo); no sucesso ele some.
        if(!r.data?.canceled){token.input.value='';concluido();}
      }finally{dados.token='';}
    },'conexao-salvar'));
    acoesManuais.append(salvarManual);
    form.replaceChildren(h('div',{class:'cx-painel-cab'},titulo,ajuda,servicoFixo?null:h('label',{class:'cx-servico-sel'},'Serviço ',tipo)),
      h('div',{class:'cx-form'},autorizacaoGithub,destinoCampos,avancadoGithub,acoes),saidaQase,listaQase);
    trocar();
    if(ancora)ancora.after?.(form);else novo.parentNode?.after?.(form);
    if(!form.parentNode&&el.append)el.append(form);
    form.scrollIntoView?.({behavior:'smooth',block:'nearest'});
    // Primeiro campo do formulário (nome/endereço); no Qase só existe o token.
    (especificos.querySelector?.('input')||token.input).focus?.();
  }
  return abrirPainel;
}

/** Conexões: uma linha por serviço (contas, escrita no projeto e ações), formulário sob a linha e importação dos projetos Qase pelo token. */
function mensagemFalhaQase(erro) {
  const codigo=/^[A-Z][A-Z0-9_]{2,70}/.exec(String(erro||''))?.[0]||'';
  const mensagens={
    SERVICE_UNAVAILABLE:'Não consegui falar com o Qase. Confira sua conexão e tente de novo.',
    SERVICE_TIMEOUT:'O Qase demorou demais. Tente de novo.',
    SERVICE_RATE_LIMIT:'O Qase pediu uma pausa. Espere alguns minutos.',
    SERVICE_RESPONSE_INVALID:'O Qase respondeu algo inesperado. Nada foi trazido.',
    SERVICE_RESPONSE_LIMIT:'A resposta do Qase passou do limite de segurança. Nada foi trazido.',
    SERVICE_NOT_FOUND:'Não achei a lista de projetos na API do Qase.',
    SERVICE_DESTINATION_BLOCKED:'O endereço do Qase foi bloqueado por segurança.',
    SERVICE_REDIRECT_BLOCKED:'O Qase tentou me redirecionar, então parei por segurança.',
    CREDENTIAL_INVALID_OR_EXPIRED:'Esse token não funcionou. Crie outro no Qase e cole aqui.',
    SERVICE_PERMISSION:'Esse token não pode listar projetos. Crie um com leitura de projetos.',
    CREDENTIAL_PROTECTION_UNAVAILABLE:'O cofre do sistema não está disponível, então não consigo guardar o token.',
    QASE_PROJECT_LIMIT:'Esta conta tem projetos demais para trazer de uma vez.',
    INVALID_ARGUMENTS:'Confira o token e tente de novo.'
  };
  return (mensagens[codigo]||'Não consegui validar o token. Confira e tente de novo.')+' Nada foi salvo.';
}
// Tela única por serviço: cada linha reúne o que o serviço serve, as contas conectadas, a escrita no projeto e as ações.
// O formulário de conexão abre logo abaixo da linha clicada (sem cartão separado no fim da página).
const servicosConexao=[['qase','Qase','Casos, suites, runs e defeitos'],['jira','Jira','Tickets, bugs e critérios de aceite'],['github','GitHub','Repositório, Pull Requests, Issues e pipelines']];
const chipCx=(texto,tom)=>typeof DS!=='undefined'?DS.chip(texto,tom):h('span',{class:'ds-chip','data-tom':tom||null},texto);
const infoCx=texto=>typeof DS!=='undefined'?DS.info(texto):h('span',{class:'suave'},texto);
const primaria=b=>{b.classList?.add('primaria');return b;};
async function mostrarConexoesDoProjeto(el, e, servicoDesejado = null, opcoes = {}) {
  const soFormulario = !!(servicoDesejado && opcoes.soFormulario);
  const novo=botao('Adicionar conta autorizada',()=>abrirPainel(servicoDesejado||'qase',null),'conexao-nova');
  if(!soFormulario)el.append(h('h2',{},e ? 'Conexões de ' + e.nome : 'Contas para importar projetos'));
  const form=h('div',{class:'cx-painel',id:'conexao-form'});
  const recursos=h('div',{id:'recursos-remotos',class:'cx-recursos'});
  const controleQase={previaId:null};
  const limparPrevia=async()=>{
    if(controleQase.previaId){const id=controleQase.previaId;controleQase.previaId=null;await api.qaseCancelar(id);}
  };
  const apresentarProjetos=criarApresentacaoProjetosQase(controleQase,limparPrevia);
  const fecharPainel=async()=>{await limparPrevia();form.replaceChildren();form.remove?.();};
  // Lista dos projetos do token: caixa à esquerda, nome, código e situação; busca e "selecionar todos" na mesma barra.
  // Formulário de conexão: abre sob a linha do serviço (ou no topo, por "Nova conexão"); o serviço continua trocável.
  const fecharFormulario=opcoes.aoCancelar?async()=>{await limparPrevia();opcoes.aoCancelar();}:fecharPainel;
  const abrirPainel=criarAberturaFormularioConexao({el,novo,form,limparPrevia,fecharPainel:fecharFormulario,apresentarProjetos,servicoFixo:soFormulario,aoConectar:opcoes.aoConectar,vinculando:soFormulario,comProjeto:!!e});
  if(soFormulario){
    abrirPainel(servicoDesejado,null);
    return;
  }
  // Recursos da conta (projetos ou repositórios) para vincular ao projeto selecionado; aparecem sob a conta.
  async function listar(c,pagina,ancora){
    const id=e?.id;
    const resultado=await chamar(()=>api.servicoRecursos(c.id,pagina));if(!resultado)return;
    recursos.replaceChildren(h('div',{class:'cx-lista-cab'},h('strong',{},'Recursos de '+c.nome),id?null:chipCx('Selecione primeiro um projeto Prumo.','aviso')),
      resultado.recursos.length?h('div',{class:'cx-lista'},resultado.recursos.map(x=>h('div',{class:'cx-item cx-recurso'},
        h('span',{class:'cx-item-nome'},x.nome),chipCx(x.chave),h('span',{class:'suave'},'ID '+x.id),
        id?botao('Vincular '+x.chave,async()=>{
          const v=await chamar(()=>api.servicoVincular(id,c.id,x));
          if(v&&!v.canceled)avisar('Vínculo confirmado para o projeto selecionado.');
        }):null)))
      :h('p',{class:'suave'},'A API retornou uma lista vazia para esta credencial.'),
      resultado.proxima!==null?botao('Próxima página',()=>listar(c,{offset:resultado.proxima,limite:50},ancora)):null);
    ancora.after?.(recursos);
  }
  const contas=await chamar(api.servicos);
  if(!contas){
    el.append(DS.estadoTela('erro','Não foi possível consultar as conexões',
      'As contas conectadas não foram carregadas. Nenhuma conexão foi alterada.',
      [DS.acao('Tentar novamente',()=>mostrar('projetos'),{icone:'atualizar'})],
      {id:'conexoes-falha-consulta'}));
    return;
  }
  const perm=e&&typeof escritaDoProjeto==='function'?await escritaDoProjeto(e).catch(()=>null):null;
  const linhas=servicosConexao.filter(([sv])=>!servicoDesejado||sv===servicoDesejado).map(([sv,nomeSv,serve])=>{
    const ativas=contas.filter(c=>c.ativa&&c.servico===sv);
    const doProjeto=e?.vinculos?.find(v=>v.servico===sv);
    const linha=h('div',{class:'cx-linha'},
      h('span',{class:'cx-nome','data-servico':sv},h('i',{'aria-hidden':'true'}),nomeSv),
      h('span',{class:'cx-serve suave'},serve),
      h('span',{class:'cx-estado'},e ? (doProjeto ? chipCx('vinculado: '+doProjeto.recurso.chave,'ok') : h('span',{class:'suave'},'Não vinculado a este projeto')) : ativas.length?chipCx(ativas.length===1?'conta autorizada':ativas.length+' contas autorizadas','ok'):h('span',{class:'suave'},'Sem conta autorizada')),
      // Escrita no projeto selecionado: desligada por padrão; cada operação ainda pede confirmação.
      e?h('span',{class:'cx-escrita','data-escrita':sv},chipCx(perm?.[sv]?'escrita habilitada':'somente leitura',perm?.[sv]?'aviso':null),
        botao(perm?.[sv]?'Desabilitar escrita':'Habilitar escrita…',async()=>{const r=await chamar(()=>api.escritaHabilitar(e.id,sv,!perm?.[sv]));if(r?.canceled)avisar(tr('Alteração cancelada: o modo do {servico} continua como estava. Confirme na janela do Windows para integrar.',{servico:sv[0].toUpperCase()+sv.slice(1)}),true);if(r)mostrar('projetos');},'escrita-'+sv)):h('span',{class:'cx-escrita'}),
      h('span',{class:'cx-acoes'},botao(ativas.length?'Adicionar conta':'Conectar '+nomeSv,()=>abrirPainel(sv,bloco),'integracao-conectar-'+sv)));
    const contasNo=ativas.map(c=>{
      const conta=h('div',{class:'cx-conta','data-conta':c.id},
        h('span',{class:'cx-conta-nome'},c.nome),
        h('span',{class:'suave cx-conta-detalhe'},c.identidade+' · '+c.instancia+' · validada '+hora(c.validadaEm)),
        h('span',{class:'cx-acoes'},
          botao('Validar conexão',async()=>{const resultado=await chamar(()=>api.servicoValidar(c.id));if(resultado)avisar('Credencial validada por consulta de leitura.');}),
          // O token salvo fica trancado (nunca é exibido); só dá para substituí-lo por um novo, validado antes de trocar.
          botao('Trocar token',()=>{
            const campo=h('input',{type:'password',id:'conta-novo-token-'+c.id,autocomplete:'off',maxlength:6000,placeholder:tr('Cole o novo token'),'aria-label':tr('Novo token de ')+c.nome});
            const enviar=botao('Guardar novo token',async()=>{
              const valor=campo.value;if(!valor.trim()){campo.focus();return;}
              try{const r=await chamar(()=>api.servicoTrocarToken(c.id,valor));if(r){avisar('Token substituído.');mostrar('projetos');}}finally{campo.value='';}
            });
            conta.after?.(h('div',{class:'cx-acoes'},campo,enviar));campo.focus();
          }),
          // Qase: importar cria projetos Prumo novos; listar recursos vincula o projeto selecionado (ex.: criado à mão) a um projeto Qase existente.
          c.servico==='qase'?botao('Importar projetos Qase',async()=>{const resultado=await chamar(()=>api.qasePreverConta(c.id));if(!resultado)return;await limparPrevia();form.replaceChildren();
            const caixa=h('div',{class:'cx-painel',id:'conexao-qase-projetos'});form.replaceChildren(caixa);conta.after?.(form);apresentarProjetos(resultado,caixa);}):null,
          botao('Listar recursos disponíveis',()=>listar(c,{offset:0,limite:50},conta)),
          botao('Remover conta autorizada (pode afetar outros projetos)',async()=>{const resultado=await chamar(()=>api.servicoRemover(c.id));if(resultado&&!resultado.canceled)mostrar('projetos');})));
      return conta;
    });
    const bloco=h('div',{class:'cx-servico','data-integracao':sv},linha,...contasNo);
    return bloco;
  });
  el.append(h('section',{class:'cx-servicos',id:'cx-servicos'},
    h('div',{class:'cx-secao-cab'},h('h2',{},'Serviços de teste e tickets'),infoCx('Conectar dá acesso de leitura. A escrita é habilitada por projeto e cada envio ainda pede confirmação.'),novo),
    ...linhas));
  if (!servicoDesejado) {
    await mostrarOperacoesExternas(el,e);
    if (e) await mostrarIntegracoesDosAgentes(el,e);
  }
}


/** Conexões: operações externas e integrações disponíveis para agentes. */
/** Mostra o histórico das operações externas do projeto selecionado; a habilitação da escrita fica na linha de cada serviço. */
async function mostrarOperacoesExternas(el,e) {
  if (!e) return;
  const ops = await chamar(() => api.operacoes(e.id, 15)); if (!ops?.length) return;
  el.append(h('section', { class: 'cx-servicos', id: 'cx-operacoes' }, h('div', { class: 'cx-secao-cab' }, h('h2', {}, 'Operações externas recentes'), DS.info('Tudo o que o Prumo enviou a Jira, Qase ou GitHub neste projeto, com o estado conferido no serviço.')),
    h('ul', { id: 'conexoes-operacoes', class: 'cx-ops' }, ops.map(o => h('li', {}, seloOp(o.estado), h('span', {}, o.resumo), h('span', { class: 'suave' }, hora(o.atualizadoEm)), o.erro ? h('span', { class: 'cx-erro' }, o.erro) : null)))));
};

/** Conexões como ponto de distribuição: serviços de teste e tickets (linhas da tela base) e, abaixo, a IA por MCP (Claude Code, Codex, GitHub Copilot e Gemini CLI). */
// A configuracao MCP fica em frontend/agentes/mostrarConfiguracaoMcp.js.
async function mostrarIntegracoesDosAgentes(el,e) {
  const centro = h('div', { id: 'integracoes-agentes', class: 'ds-integracoes' });
  // As linhas de Qase, Jira e GitHub já vêm da tela base: entram no mesmo bloco, antes da IA, sem repetir os serviços.
  const servicos = el.querySelector('#cx-servicos'); if (servicos) { servicos.replaceWith(centro); centro.append(servicos); } else el.append(centro);
  const clientes = e?.id === estado.espaco?.id && e.raizContextos ? await chamarSemAviso(() => api.conexoes(e.raizContextos)) : null;
  const painelMcp = h('div', { id: 'conexao-mcp-painel' }); let carregado = false;
  const mcp = h('details', { id: 'conexao-mcp', ontoggle: async (ev) => { if (!ev.currentTarget.open || carregado) return; carregado = true; if (e?.id !== estado.espaco?.id) { painelMcp.replaceChildren(DS.estadoTela('vazio','Selecione este projeto para configurar seus agentes.',null,[DS.acao('Usar projeto',()=>escolherEspaco(e,'agentes'))])); return; } await mostrarConfiguracaoMcp(painelMcp); painelMcp.querySelector('h1')?.remove(); } },
    h('summary', {}, tr('Conectar sua IA ao Prumo (MCP)')), painelMcp);
  const abrirMcp = () => { mcp.open = true; mcp.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const linha = (atributos, nome, detalhe, situacao, ...acoes) => h('div', { class: 'ds-integra', ...atributos }, h('strong', { 'data-i18n-ignore': '' }, nome), h('span', { class: 'suave' }, detalhe), h('span', { class: 'ds-integra-estado' }, situacao), h('span', { class: 'ds-integra-acoes' }, acoes));
  const ia = ORDEM_DAS_IAS.map((cliente) => {
    const nome = IAS_DO_MCP[cliente].nome; const c = clientes?.find((x) => x.client === cliente);
    const usado = c?.lastObserved ? tr('Última chamada: {quando}', { quando: hora(c.lastObserved.at) }) : tr('Nenhuma chamada observada');
    return linha({ 'data-integracao': cliente }, nome, e ? (c ? usado : tr('Estado indisponível agora.')) : tr('Selecione um projeto para configurar.'), c ? selo(c.state) : null, e ? botao(tr('Conectar e testar'), abrirMcp, 'integracao-' + cliente) : null);
  });
  centro.append(DS.secao('IA por MCP', [h('div', { id: 'integracoes-ia' }, ia), mcp], { acoes: [botao(tr('Abrir Agentes'), () => mostrar('agentes'), 'integracao-abrir-agentes')] }));
};
