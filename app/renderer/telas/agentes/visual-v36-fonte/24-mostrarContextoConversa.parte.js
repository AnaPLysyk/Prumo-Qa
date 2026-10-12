/** Mostra dicas de contexto de acordo com a tela. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function contexto(aba, texto) { montar(); sincronizar(); falar([texto], null, PROXIMOS[TOPICO_DA_TELA[aba]] || INICIAIS); }
    function focar() { setTimeout(() => entrada?.focus({ preventScroll: true }), 220); }
    function estadoOrbita() { el?.querySelectorAll('.qc-orb, .qc-campo').forEach((e) => { e.dataset.estado = estadoOrb(estado.worker); }); }
    return { montar, sincronizar, contexto, focar, estadoOrbita, recarregar: () => { if (el) { carregarRoster(); } } };
  })();
