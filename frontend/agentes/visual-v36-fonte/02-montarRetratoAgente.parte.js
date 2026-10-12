/** Monta o retrato visual animado do agente. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  function portrait(index, large = false, tamanho) {
    const classe = tamanho || (large ? 'large' : '');
    const el = h('div', { class: 'v36-portrait' + (classe ? ' ' + classe : ''), 'data-motion': index % 6 },
      h('span', { class: 'v36-retrato-halo', 'aria-hidden': 'true' }),
      h('span', { class: 'v36-retrato-3d' }, h('img', { src: asset('avatar-' + variants[index % 8] + '.webp'), alt: '', draggable: false }), h('span', { class: 'v36-retrato-scan', 'aria-hidden': 'true' })));
    el.style.setProperty('--face-color', palette[index % 8]);
    el.style.setProperty('--face-duration', (5 + index * .47) + 's');
    el.style.setProperty('--face-delay', (-index * .67) + 's');
    return el;
  }
  // Paralaxe sutil seguindo o ponteiro (desligada com movimento reduzido).
