/** Monta um icone SVG a partir do catalogo. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  function icone(nome, tam = 16) { return sv('svg', { class: 'v36-icone', viewBox: '0 0 24 24', width: tam, height: tam, 'aria-hidden': 'true', focusable: 'false' }, ICONES[nome].map(([t, a]) => sv(t, a))); }
