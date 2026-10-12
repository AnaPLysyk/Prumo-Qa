/** Marca na janela qual tela esta ativa. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  let telaAnterior = null;
  function medirTopo() { const t = document.querySelector('.topo-direita'); if (t) document.documentElement.style.setProperty('--v36-topo', Math.ceil(t.getBoundingClientRect().width + 34) + 'px'); }
  function marcarTela() {
    const aba = estado.aba; document.body.dataset.tela = aba; medirTopo(); if (aba !== 'agentes') document.querySelectorAll('.v36a-ceu').forEach((c) => c.remove());
    if (aba !== telaAnterior) { telaAnterior = aba; flutuante?.trocouTela(aba); }
  }

  // ---------------- Conversa do Orchestrator: um único DOM no Início e no painel ----------------
