/** Finaliza o escopo compartilhado das interfaces. */
  for (const id of ['inicio', 'metricas', 'logs', 'agentes']) {
    const render = abas[id]; abas[id] = async el => { await render(el); const wrapper = h('section', { class: el.className }, ...el.childNodes); el.replaceChildren(wrapper); };
  }
  function iniciar() {
    flutuante = montarFlutuante(); ajustesAssistente();
    new MutationObserver(marcarTela).observe($('#conteudo'), { childList: true });
    const topo = document.querySelector('.topo-direita'); if (topo) new ResizeObserver(medirTopo).observe(topo);
    marcarTela();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true }); else iniciar();
})();
