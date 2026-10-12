/** Move o retrato suavemente ao passar o ponteiro. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  function paralaxe(area, alvo) {
    area.addEventListener('pointermove', (e) => { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; const r = area.getBoundingClientRect(); alvo.style.setProperty('--rx', (((e.clientY - r.top) / r.height - .5) * -7).toFixed(2) + 'deg'); alvo.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 9).toFixed(2) + 'deg'); });
    area.addEventListener('pointerleave', () => { alvo.style.setProperty('--rx', '0deg'); alvo.style.setProperty('--ry', '0deg'); });
  }
  // Campo neural decorativo: pontos, sinapses e, no Cérebro, conexões do rosto aos neurônios com impulsos.
