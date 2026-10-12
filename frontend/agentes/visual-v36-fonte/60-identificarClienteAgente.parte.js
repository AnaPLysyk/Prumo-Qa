/** Identifica o cliente relacionado ao agente. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  function iconeCliente(cliente) {
    const caixa = h('span', { class: 'v36a-cliente-icone ' + cliente });
    const marca = cliente === 'claude'
      ? sv('svg', { viewBox: '0 0 64 64', 'aria-hidden': 'true' }, ...Array.from({ length: 12 }, (_, i) => sv('path', { d: 'M32 32 L' + (32 + Math.cos(i * Math.PI / 6) * (i % 2 ? 19 : 26)).toFixed(1) + ' ' + (32 + Math.sin(i * Math.PI / 6) * (i % 2 ? 19 : 26)).toFixed(1), stroke: '#d97757', 'stroke-width': 6.5, 'stroke-linecap': 'round' })))
      : sv('svg', { viewBox: '0 0 64 64', 'aria-hidden': 'true' }, ...Array.from({ length: 6 }, (_, i) => sv('rect', { x: 26, y: 9, width: 12, height: 30, rx: 6, fill: 'none', stroke: '#f2f5fb', 'stroke-width': 3.4, transform: 'rotate(' + i * 60 + ' 32 32)' })));
    caixa.append(marca); return caixa;
  }
