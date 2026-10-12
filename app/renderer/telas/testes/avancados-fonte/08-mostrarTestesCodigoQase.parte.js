/** Monta Testes com as opções do catálogo e Qase. Parte de testes-v40.js; nao carregar isoladamente. */
  abas.testes = async (el) => {
    const e = estado.espaco;
    if (!e) { const sub0 = ['runs', 'automacao'].includes(estado.sub?.testes) ? estado.sub.testes : 'catalogo'; el.append(DS.cabecalho({ titulo: 'Testes' }), barraSub('testes', [['catalogo', 'Visão geral'], ['runs', 'Runs'], ['automacao', 'CI e GitHub']], sub0), h('div', { id: 'sub-conteudo' }, DS.estadoTela('vazio', 'Nenhum projeto selecionado', 'Selecione ou crie um projeto para continuar.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))]))); return; }
    const vq = vinc(e, 'qase'), vg = vinc(e, 'github'); const itens = ABAS(vq); const mem = memoria('testes', e.id);
    let sub = estado.sub?.testes || 'catalogo'; if (!itens.some(([k]) => k === sub)) sub = 'catalogo';
    const perm = vq ? await escritaDoProjeto(e) : {}; const esc = !!perm.qase;
    const acoes = { catalogo: [DS.acao('Atualizar', async () => { await fontes(e, { forcar: true }); mostrar('testes'); }, { id: 'testes-atualizar', icone: 'atualizar' })],
      casos: [DS.acao('Consulta avançada', () => F.avancadaQase(e), { id: 'testes-avancada', icone: 'filtro' }), DS.acao('Nova proposta de caso', () => F.novaProposta(e), { id: 'pr-nova', primaria: true, icone: 'mais' })],
      suites: [DS.acao('Nova suite', () => F.novaSuite(e, esc), { id: 'su-nova', primaria: true, icone: 'mais' })], planos: [DS.acao('Novo plano', () => F.novoPlano(e, esc), { id: 'plano-novo', primaria: true, icone: 'mais' })],
      runs: vq ? [DS.acao('Preparar run', () => F.prepararRun(e), { id: 'run-nova', primaria: true, icone: 'mais' })] : [] }[sub] || [];
    const origem = e.pastaLocal ? DS.origem('local', tr('Repositório local')) : vg ? DS.origem('github', 'GitHub · ' + vg.recurso.chave) : h('span', { class: 'ds-chip', 'data-tom': 'aviso' }, tr('Sem repositório vinculado'));
    el.append(DS.cabecalho({ titulo: 'Testes', descricao: [h('span', { class: 'ds-chips', id: 'testes-fontes' }, origem, vq ? DS.origem('qase', 'Qase · ' + vq.recurso.chave) : null, vq && !esc ? h('span', { class: 'ds-chip', 'data-escrita-desligada': 'qase', title: tr('Escrita no Qase desligada. Habilite em Conexões.') }, tr('Qase somente leitura')) : null)], acoes }), barraSub('testes', itens, sub));
    const corpo = h('div', { id: 'sub-conteudo' }); el.append(corpo);
    if (sub === 'catalogo') await visaoGeral(e, mem, corpo);
    else if (sub === 'codigo') await telaCodigo(e, mem, corpo);
    else if (sub === 'casos') await F.telaCasos(e, mem, corpo);
    else if (sub === 'suites') await F.telaSuites(e, mem, corpo);
    else if (sub === 'planos') await F.telaPlanos(e, mem, corpo);
    else if (sub === 'runs') await F.telaRuns(e, mem, corpo, esc);
    else { await abaAutomacao(corpo); semTitulo(corpo); }
  };

  // ======================= Visão geral =======================
