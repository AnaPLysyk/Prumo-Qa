/** Monta a trilha de rastreabilidade. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  function trilha(e, m, corpo, projSel) {
    const { nos, vizinhos } = grafo(m); const linhas = []; const usados = new Set();
    const colher = (ids, tipos) => { const out = new Map(); for (const id of ids) for (const v of vizinhos(id, tipos)) if (!out.has(v.id)) out.set(v.id, v); return [...out.values()]; };
    const montar = (ticket, casos) => {
      const base = [ticket?.id, ...casos.map((c) => c.id)].filter(Boolean);
      const autos = colher(casos.map((c) => c.id), ['automacao']); const evid = colher(base, ['evidencia']); const runs = colher(casos.map((c) => c.id), ['run']);
      const bugs = colher(base, ['jira-bug']); const defs = colher([...base, ...bugs.map((b) => b.id)], ['qase-defeito']);
      const origens = new Set([...casos, ...autos, ...evid, ...runs, ...bugs, ...defs].map((v) => v.aresta?.origem).filter(Boolean));
      for (const x of [ticket, ...casos, ...autos, ...bugs, ...defs].filter(Boolean)) usados.add(x.id);
      linhas.push({ ticket: ticket ? nos.get(ticket.id) : null, features: colher(autos.map((a) => a.id), ['feature']), casos, autos, execs: [...runs, ...evid], defs: [...bugs, ...defs], origens });
    };
    for (const t of m.nos.filter((n) => n.tipo === 'jira')) montar({ id: t.id }, vizinhos(t.id, ['qase']));
    for (const c of m.nos.filter((n) => n.tipo === 'qase' && !usados.has(n.id))) montar(null, [{ id: c.id, aresta: null }]);
    // Cenários sem Qase continuam visíveis na trilha estática da feature.
    for (const f of m.nos.filter((n) => n.tipo === 'feature')) {
      const autos = vizinhos(f.id, ['automacao']).filter((a) => !usados.has(a.id));
      if (!autos.length) continue;
      autos.forEach((a) => usados.add(a.id));
      linhas.push({ ticket: null, features: [{ id: f.id, aresta: null }], casos: [], autos, execs: [], defs: [], origens: new Set(autos.map((a) => a.aresta.origem)) });
    }
    // Defeito do Qase e bug do Jira relacionados ficam na mesma trilha; o que sobrar vira uma linha própria.
    for (const d of m.nos.filter((n) => (n.tipo === 'qase-defeito' || n.tipo === 'jira-bug') && !usados.has(n.id))) {
      if (usados.has(d.id)) continue; const juntos = [{ id: d.id, aresta: null }, ...vizinhos(d.id, ['qase-defeito', 'jira-bug']).filter((v) => !usados.has(v.id))];
      for (const x of juntos) usados.add(x.id); linhas.push({ ticket: null, casos: [], autos: [], execs: [], defs: juntos, origens: new Set(juntos.map((v) => v.aresta?.origem).filter(Boolean)) });
    }
    const mem = memoria('rastro', e.id); const busca = DS.busca({ id: 'rastro-busca', placeholder: 'Buscar ticket, caso, automação ou evidência', valor: estado.ds?.rastroBusca ?? mem.q ?? '', rotulo: 'Buscar relações' }); if (estado.ds) delete estado.ds.rastroBusca;
    const mostrarSel = DS.selecao({ id: 'rastro-filtro', rotulo: 'Mostrar', opcoes: [['', 'Todas as trilhas'], ['lacunas', 'Com vínculos ausentes'], ['observado', 'Com resultado observado']], valor: mem.filtro || '' });
    const area = h('div', { id: 'rastro-area' });
    const celula = (lista, origemPadrao) => (lista.length ? h('div', { class: 'ds-celula-nos' }, lista.map((v) => botaoNo(e, nos.get(v.id) || { id: v.id, tipo: 'prumo', rotulo: v.id }, v.aresta?.origem || origemPadrao))) : h('span', { class: 'ds-falta' }, tr('ausente')));
    const textoLinha = (l) => [l.ticket, ...[...(l.features || []), ...l.casos, ...l.autos, ...l.execs, ...l.defs].map((v) => nos.get(v.id))].filter(Boolean).map((n) => n.rotulo + ' ' + n.id + ' ' + (n.detalhe || '')).join(' ').toLowerCase();
    const desenhar = () => {
      const q = busca.input.value.trim().toLowerCase(); mem.q = busca.input.value; mem.filtro = mostrarSel.value;
      const vis = linhas.filter((l) => (!q || textoLinha(l).includes(q)) && (mostrarSel.value !== 'lacunas' || !l.ticket || !l.casos.length || !l.autos.length || !l.execs.length) && (mostrarSel.value !== 'observado' || l.origens.has('OBSERVADO')));
      if (!linhas.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhuma relação registrada', 'Declare vínculos entre tickets e casos, ou execute fluxos do Prumo para registrar resultados.', [DS.acao('Declarar vínculo', () => declarar(e))])); return; }
      if (!vis.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhuma trilha para estes filtros')); return; }
      area.replaceChildren(DS.tabela({ id: 'rastro-tabela', colunas: ['Ticket', 'Feature', 'Caso', 'Automação', 'Execução · evidência', 'Defeito', 'Comprovação'], linhas: vis.map((l) => ({ attrs: { 'data-relacao-navegavel': '' }, celulas: [l.ticket ? botaoNo(e, l.ticket) : h('span', { class: 'ds-falta' }, tr('sem ticket')), celula(l.features || [], 'OBSERVADO_NO_CODIGO'), celula(l.casos, 'DECLARADO_PELO_USUARIO'), celula(l.autos), celula(l.execs), l.defs.length ? celula(l.defs) : '—',
        l.origens.has('OBSERVADO') ? DS.chip('Resultado observado', 'ok') : l.origens.has('OBSERVADO_NO_CODIGO') ? DS.chip('Lido no código · sem execução', 'info') : l.origens.size ? DS.chip(l.origens.has('REGISTRADO_PELO_PRUMO') ? 'Registrado pelo Prumo' : 'Declarado', 'info') : DS.chip('Sem comprovação')] })) }),
        h('div', { class: 'ds-legenda' }, h('span', { class: 'ds-no', 'data-origem': 'DECLARADO_PELO_USUARIO' }, tr('declarado pela pessoa')), h('span', { class: 'ds-no', 'data-origem': 'REGISTRADO_PELO_PRUMO' }, tr('registrado pelo Prumo')), h('span', { class: 'ds-no', 'data-origem': 'OBSERVADO' }, tr('observado em execução')), h('span', { class: 'ds-no', 'data-origem': 'OBSERVADO_NO_CODIGO' }, tr('lido no código · sem execução')), h('span', {}, tr('Vínculo declarado não comprova cobertura nem aprovação.'))));
    };
    busca.input.addEventListener('input', desenhar); mostrarSel.addEventListener('change', desenhar);
    corpo.append(DS.barra(busca.no, mostrarSel, projSel, h('span', { class: 'ds-meta-barra' }, tr('{n} trilha(s) · {l} lacuna(s)', { n: linhas.length, l: m.lacunas.length }))), area);
    if (m.lacunas.length) corpo.append(DS.secao(tr('Vínculos ausentes ({n})', { n: m.lacunas.length }), h('ul', { class: 'ds-lista', id: 'rastro-lacunas' }, m.lacunas.map((l) => h('li', {}, l.mensagem)))));
    desenhar();
  }
