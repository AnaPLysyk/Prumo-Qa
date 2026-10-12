/** Carrega casos Qase por consulta autorizada. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  async function carregarQase(e, mem, op, pagina = { limite: 100 }) {
    const r = await api.servicoConsultar(e.id, 'qase', op, pagina);
    if (!r.ok) { avisar(r.error, true); return { erro: r.error, itens: [] }; }
    return { itens: Array.isArray(r.data.dados) ? r.data.dados : [], proxima: r.data.proxima, em: r.data.consultadoEm };
  }
  const fonteQase = (r, rotulo, mais) => h('div', { class: 'ds-fontes', 'aria-live': 'polite' }, r.erro ? h('span', { role: 'status' }, DS.origem('qase', 'Qase'), ' ', DS.chip(r.erro, 'falha')) : h('span', { role: 'status' }, DS.origem('qase', 'Qase'), tr('{n} {r} · consultado {q}', { n: r.itens.length, r: tr(rotulo), q: quando(r.em) }), r.proxima != null && mais ? DS.link('Carregar mais', mais, { seta: false }) : null));
