/** Aguarda DOM pronto antes de montar a interface. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true }); else iniciar();
})();
