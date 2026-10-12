/** Mostra a lista dos casos Qase. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  async function telaCasos(e, mem, corpo) {
    const f = (mem.fCasos ||= { q: '', tipo: '', suite: '' });
    const q = DS.busca({ id: 'caso-busca', placeholder: 'Buscar por ID, título ou tag', valor: f.q });
    const tipo = DS.selecao({ id: 'caso-tipo', rotulo: 'Tipo de execução', opcoes: [['', 'Todos os tipos'], ['manual', 'Manual'], ['automatizado', 'Automatizado'], ['planejado', 'Automação planejada']], valor: f.tipo });
    const suite = DS.selecao({ id: 'caso-suite', rotulo: 'Suite', opcoes: [['', 'Todas as suites']], valor: '' });
    const area = h('div', { id: 'casos-area' }, DS.esqueleto(6)); const fonte = h('div');
    corpo.append(DS.barra(q.no, tipo, suite, DS.acao('Atualizar', async () => { delete mem.casos; await carregar(); }, { id: 'casos-atualizar', icone: 'atualizar' })), fonte, area);
    const slot = h('div', { id: 'pr-slot' }); const propostas = h('div', { id: 'pr-lista' });
    corpo.append(DS.secao('Propostas em revisão', [h('p', { class: 'suave' }, tr('Rascunhos locais de casos e bugs. Nada é publicado sem revisão e confirmação.')), slot, propostas]));
    const [runs] = await Promise.all([api.runs(e.id)]); const rl = runs.ok ? runs.data : [];
    const desenhar = () => {
      f.q = q.input.value.trim(); f.tipo = tipo.value; f.suite = suite.value; const qq = f.q.toLowerCase();
      const casos = (mem.casos?.itens || []).filter((c) => (!f.tipo || tipoCaso(c) === f.tipo) && (!f.suite || String(c.suite_id) === f.suite) && (!qq || (c.id + ' ' + (c.title || '') + ' ' + (c.tags || []).map((x) => x.title || x).join(' ')).toLowerCase().includes(qq)));
      if (mem.casos?.erro && !mem.casos.itens.length) { area.replaceChildren(DS.estadoTela('erro', 'Não foi possível consultar os casos', mem.casos.erro, [DS.acao('Tentar novamente', async () => { delete mem.casos; await carregar(); })])); return; }
      if (!casos.length) { area.replaceChildren(DS.estadoTela('vazio', mem.casos?.itens.length ? 'Nenhum caso para estes filtros' : 'Nenhum caso retornado pelo Qase', mem.casos?.itens.length ? 'Ajuste a busca, o tipo ou a suite.' : null)); return; }
      const nomeSuite = (sid) => (mem.suites?.itens || []).find((s) => s.id === sid)?.title;
      area.replaceChildren(DS.tabela({ id: 'casos-tabela', colunas: ['ID', 'Caso', 'Tipo', { t: 'Automação no Prumo', classe: 'ds-opcional' }, 'Ticket', 'Resultado no Prumo'], linhas: casos.map((c) => {
        const autos = relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)).filter((x) => x.tipo === 'automacao'); const tk = [...new Set([...ticketsExternos(c), ...relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)).filter((x) => x.tipo === 'jira').map((x) => x.id)])];
        const ult = resultadosLocais(rl, c.id).sort((a, b) => Date.parse(b.em) - Date.parse(a.em))[0];
        return { attrs: { 'data-caso': String(c.id) }, abrir: () => abrirCaso(e, c.id), rotuloAcessivel: tr('Abrir caso {id}', { id: c.id }),
          celulas: [{ no: String(c.id), classe: 'ds-id' }, h('div', {}, h('span', { class: 'ds-resumo-texto' }, c.title || '—'), nomeSuite(c.suite_id) ? h('span', { class: 'ds-sub' }, nomeSuite(c.suite_id)) : null), chipTipoCaso(c), autos.length ? h('span', { class: 'ds-celula-nos' }, autos.map((a) => h('span', { class: 'ds-no', 'data-servico': 'local' }, h('i'), a.id))) : h('span', { class: 'ds-falta' }, tr('não declarada')), tk.length ? tk.join(', ') : '—', ult ? selo(ult.status) : h('span', { class: 'ds-falta' }, tr('sem resultado'))] };
      }) }));
    };
    async function carregar() {
      area.replaceChildren(DS.esqueleto(6));
      const [casos, suites] = await Promise.all([mem.casos ? mem.casos : carregarQase(e, mem, 'casos'), mem.suites ? mem.suites : carregarQase(e, mem, 'suites')]);
      mem.casos = casos; mem.suites = suites; fonte.replaceChildren(fonteQase(casos, 'caso(s)', casos.proxima != null ? async () => { const r = await carregarQase(e, mem, 'casos', { offset: casos.proxima, limite: 100 }); if (!r.erro) { mem.casos = { ...r, itens: mem.casos.itens.concat(r.itens) }; fonte.replaceChildren(fonteQase(mem.casos, 'caso(s)')); desenhar(); } } : null));
      suite.replaceChildren(h('option', { value: '' }, tr('Todas as suites')), ...suites.itens.map((s) => h('option', { value: String(s.id), selected: String(s.id) === f.suite }, s.title)));
      desenhar();
    }
    q.input.addEventListener('input', desenhar); tipo.addEventListener('change', desenhar); suite.addEventListener('change', desenhar);
    const perm = await escritaDoProjeto(e); const ps = await chamar(() => api.propostas(e.id)); const vivas = (ps || []).filter((p) => p.estado !== 'DESCARTADA');
    if (!vivas.length) propostas.append(DS.estadoTela('vazio', 'Nenhuma proposta em revisão', null, [], { id: 'pr-vazia', compacto: true })); for (const p of vivas) propostas.append(cartaoProposta(e, p, perm, () => mostrar('testes')));
    await carregar();
  }
