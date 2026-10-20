/** Apresenta e pesquisa a Ajuda, com navegacao entre documentos. */
  abas.ajuda = async (el) => {
    const todos = await chamar(api.ajuda); if (!todos) return;
    const en = PrumoI18n.idioma === 'en';
    const docs = todos.filter((d) => !d.id.endsWith('.en')).map((d) => { const alt = en ? todos.find((x) => x.id === d.id + '.en') : null; return alt ? { ...alt, id: d.id } : { ...d, soPt: en }; });
    const paineis = { versoes: { title: 'Versões', render: painelVersoes }, atualizacoes: { title: 'Atualizações', render: painelAtualizacoes }, integracoes: { title: 'Integrações técnicas', render: painelIntegracoes }, dados: { title: 'Privacidade e dados', render: painelDados } };
    const itens = new Map([...docs.map((d) => [d.id, { id: d.id, title: d.title, soPt: d.soPt, corpo: d.body, render: () => markdown(d.body, d.id === '10-perguntas') }]), ...Object.entries(paineis).map(([id, p]) => [id, { id, ...p, corpo: tr(DESCRICAO_PAINEL[id] || '') }])]);
    const agrupados = GRUPOS.map(([g, ids]) => [g, ids.map((i) => itens.get(i)).filter(Boolean)]); const usados = new Set(agrupados.flatMap(([, l]) => l.map((i) => i.id)));
    const outros = [...itens.values()].filter((i) => !usados.has(i.id)); if (outros.length) agrupados.push(['Outros documentos', outros]);
    const grupoDe = (id) => agrupados.find(([, l]) => l.some((i) => i.id === id))?.[0];
    const corpo = h('article', { class: 'ds-prosa' }); const trilhaNav = h('div', { class: 'ds-doc-trilha' }); const resultados = h('div', { id: 'ajuda-resultados', hidden: true });
    const indice = h('nav', { class: 'indice', 'aria-label': tr('Índice da documentação') });
    for (const [g, lista] of agrupados) indice.append(h('p', { class: 'ds-doc-grupo' }, tr(g)), h('ul', { class: 'ds-links' }, lista.map((it) => h('li', {}, h('button', { type: 'button', 'data-id': it.id, onclick: () => abrir(it) }, it.title)))));
    const busca = DS.busca({ id: 'ajuda-busca', placeholder: 'Pesquisar na documentação', rotulo: 'Pesquisar na documentação' });
    const abrir = async (it) => {
      busca.input.value = ''; resultados.hidden = true; corpo.hidden = false; trilhaNav.hidden = false;
      for (const b of indice.querySelectorAll('button')) b.setAttribute('aria-current', String(b.dataset.id === it.id));
      trilhaNav.replaceChildren(h('button', { type: 'button', onclick: () => inicio() }, tr('Ajuda')), h('span', { 'aria-hidden': 'true' }, '›'), h('span', {}, tr(grupoDe(it.id) || '')), h('span', { 'aria-hidden': 'true' }, '›'), h('span', {}, it.title));
      corpo.replaceChildren(DS.carregando()); const nos = await it.render(); corpo.replaceChildren(...[].concat(nos).filter(Boolean));
      if (it.id === '10-perguntas') corpo.classList.add('ds-faq'); else corpo.classList.remove('ds-faq');
      if (en && (it.soPt || ['versoes', 'integracoes'].includes(it.id))) corpo.prepend(h('div', { class: 'nota', 'data-i18n-ignore': '' }, 'This help content is available in Portuguese only; the interface around it is in English.'));
      el.closest('main')?.scrollTo?.({ top: 0 }); window.scrollTo({ top: 0 });
    };
    const inicio = () => {
      for (const b of indice.querySelectorAll('button')) b.setAttribute('aria-current', 'false');
      resultados.hidden = true; corpo.hidden = false; trilhaNav.hidden = true; corpo.classList.remove('ds-faq');
      const destaques = [['01-o-que-e', 'Visão geral do produto e do que ele não faz.'], ['04-vincular', 'Projetos, pastas e serviços vinculados.'], ['19-testes-e-integracoes', 'Tickets, casos, runs e escrita autorizada.'], ['18-agendamentos', 'Rotinas, bandeja, horários perdidos e execuções.'], ['07-resultados', 'PASS, FAIL, BLOCKED e NOT_RUN sem atalhos.'], ['09-problemas', 'Diagnóstico de conexões, MCP e execução.']].map(([id, d]) => [itens.get(id), d]).filter(([i]) => i);
      corpo.replaceChildren(h('p', {}, tr('Guias de uso, fluxos de qualidade, integrações e referência técnica. Todo o conteúdo está neste computador.')),
        h('div', { class: 'ds-doc-cartoes' }, destaques.map(([it, d]) => h('button', { type: 'button', onclick: () => abrir(it) }, h('strong', {}, it.title), h('span', {}, tr(d))))));
    };
    busca.input.addEventListener('input', () => {
      const q = paraBusca(busca.input.value.trim()); const ts = termos(q); if (q.length < 2 || !ts.length) { resultados.hidden = true; corpo.hidden = false; return; }
      const achados = [...itens.values()].map((it) => [it, pontuar(it, ts)]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([it]) => it);
      resultados.replaceChildren(h('p', { class: 'suave' }, tr('{n} resultado(s) para "{q}"', { n: achados.length, q: busca.input.value.trim() })), ...(achados.length ? achados.map((it) => h('div', { class: 'ds-doc-resultado' }, h('button', { type: 'button', onclick: () => abrir(it) }, it.title), h('span', { class: 'ds-chip ds-ml' }, tr(grupoDe(it.id) || '')), it.corpo ? trecho(it.corpo, primeiroAchado(it.corpo, ts) || null) : null)) : [DS.estadoTela('vazio', 'Nada encontrado', 'Tente outro termo ou navegue pelo índice.', [], { compacto: true })]));
      resultados.hidden = false; corpo.hidden = true; trilhaNav.hidden = true;
    });
    el.append(DS.cabecalho({ titulo: 'Ajuda', info: 'Documentação, versões, integrações técnicas e dados deste computador.' }),
      h('div', { class: 'ds-barra' }, DS.acao('Baixar instalador no site oficial', () => chamar(() => api.abrirSite()), { id: 'ajuda-download', icone: 'externo' })),
      h('div', { class: 'ds-doc ajuda' }, h('div', { class: 'ds-min0' }, h('div', { class: 'ds-barra ds-barra-solta' }, busca.no), trilhaNav, resultados, corpo), h('aside', {}, indice)));
    const alvo = itens.get(estado.ajudaAlvo); estado.ajudaAlvo = null;
    if (alvo) await abrir(alvo); else inicio();
  };
})();
