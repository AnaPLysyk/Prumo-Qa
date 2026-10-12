/** Inicializa os componentes visuais quando a pagina esta pronta. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  function iniciar() {
    flutuante = montarFlutuante(); ajustesAssistente();
    new MutationObserver(marcarTela).observe($('#conteudo'), { childList: true });
    const topo = document.querySelector('.topo-direita'); if (topo) new ResizeObserver(medirTopo).observe(topo);
    marcarTela();
  }
