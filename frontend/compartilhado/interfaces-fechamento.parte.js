/** Finaliza o escopo compartilhado das interfaces. */
  for (const id of ['inicio', 'metricas', 'logs', 'agentes']) {
    const render = abas[id]; abas[id] = async el => { await render(el); const wrapper = h('section', { class: el.className }, ...el.childNodes); el.replaceChildren(wrapper); };
  }
  function iniciar() {
    flutuante = montarFlutuante();
    // Telas pedem ajuda ao Orquestrador pelo mesmo robô flutuante: abre a conversa e deixa o começo da pergunta no campo.
    window.PrumoOrquestrador = Object.freeze({ preparar: (texto) => { flutuante.abrir(); conversa.preparar(texto); } });
    new MutationObserver(marcarTela).observe($('#conteudo'), { childList: true });
    const topo = document.querySelector('.topo-direita'); if (topo) new ResizeObserver(medirTopo).observe(topo);
    marcarTela();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true }); else iniciar();
})();
