/** Monta a tela de Testes e suas subabas. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  abas.testes = async (el) => {
    const e = estado.espaco;
    if (!e) { const sub0 = ['runs', 'automacao'].includes(estado.sub?.testes) ? estado.sub.testes : 'catalogo'; el.append(DS.cabecalho({ titulo: 'Testes' }), barraSub('testes', [['catalogo', 'Catálogo'], ['runs', 'Runs'], ['automacao', 'Automação']], sub0), h('div', { id: 'sub-conteudo' }, DS.estadoTela('vazio', 'Nenhum projeto selecionado', 'Selecione ou crie um projeto para continuar.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))]))); return; }
    const vq = vinc(e, 'qase'); const mem = memoria('testes', e.id);
    const itens = [['catalogo', 'Catálogo'], ...(vq ? [['casos', 'Casos'], ['suites', 'Suites'], ['planos', 'Planos']] : []), ['runs', 'Runs'], ['automacao', 'Automação']];
    let sub = estado.sub?.testes || 'catalogo'; if (!itens.some(([k]) => k === sub)) sub = 'catalogo';
    const perm = vq ? await escritaDoProjeto(e) : {}; const esc = !!perm.qase;
    const acoes = { casos: [DS.acao('Consulta avançada', () => avancadaQase(e), { id: 'testes-avancada', icone: 'filtro' }), DS.acao('Nova proposta de caso', () => novaProposta(e), { id: 'pr-nova', primaria: true, icone: 'mais' })], suites: [DS.acao('Nova suite', () => novaSuite(e, esc), { id: 'su-nova', primaria: true, icone: 'mais' })], planos: [DS.acao('Novo plano', () => novoPlano(e, esc), { id: 'plano-novo', primaria: true, icone: 'mais' })], runs: vq ? [DS.acao('Preparar run', () => prepararRun(e), { id: 'run-nova', primaria: true, icone: 'mais' })] : [] }[sub] || [];
    el.append(DS.cabecalho({ titulo: 'Testes', descricao: [h('span', { class: 'ds-chips' }, DS.origem(e.pastaLocal ? 'local' : 'ausente', e.pastaLocal ? tr('Repositório local') : tr('Sem pasta local')), vq ? DS.origem('qase', 'Qase · ' + vq.recurso.chave) : null, vq && !esc ? h('span', { class: 'ds-chip', 'data-escrita-desligada': 'qase', title: tr('Escrita no Qase desligada. Habilite em Conexões.') }, tr('Qase somente leitura')) : null)], acoes }), barraSub('testes', itens, sub));
    const corpo = h('div', { id: 'sub-conteudo' }); el.append(corpo);
    if (sub === 'catalogo') await catalogoRepo(corpo);
    else if (sub === 'casos') await telaCasos(e, mem, corpo);
    else if (sub === 'suites') await telaSuites(e, mem, corpo);
    else if (sub === 'planos') await telaPlanos(e, mem, corpo);
    else if (sub === 'runs') await telaRuns(e, mem, corpo, esc);
    else { await abaAutomacao(corpo); semTitulo(corpo); }
  };
