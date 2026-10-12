/** Preserva os estilos das telas ao atualizar o conteudo. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  for (const id of ['inicio', 'metricas', 'historico', 'logs', 'agentes']) {
    const render = abas[id]; abas[id] = async el => { await render(el); const wrapper = h('section', { class: el.className }, ...el.childNodes); el.replaceChildren(wrapper); };
  }
