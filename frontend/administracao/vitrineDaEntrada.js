'use strict';
/** Vitrine da tela de entrada: céu estrelado que cintila e acompanha o ponteiro, esfera e órbitas do Prumo e o lema. Só apresentação. */
window.PrumoVitrine = (() => {
  const movimento = matchMedia('(prefers-reduced-motion: reduce)');

  /** Estrelas em camadas (as de perto se movem mais), sempre claras sobre fundo noturno; sem movimento, um quadro parado. */
  function ceu() {
    const canvas = h('canvas', { class: 'entrada-ceu', 'aria-hidden': 'true' }), ctx = canvas.getContext('2d');
    const estrelas = Array.from({ length: 120 }, (_, i) => ({ x: Math.random(), y: Math.random(), z: .25 + Math.random() * .75, fase: Math.random() * 6.28, vel: .0006 + Math.random() * .0016, cor: i % 9 === 0 ? [255, 82, 108] : i % 4 === 0 ? [116, 173, 255] : [244, 247, 255] }));
    let w = 0, alto = 0, px = 0, py = 0, alvoX = 0, alvoY = 0, ultimo = 0, quadro = 0;
    const ajustar = () => { const d = Math.min(devicePixelRatio || 1, 1.5); w = innerWidth; alto = innerHeight; canvas.width = Math.round(w * d); canvas.height = Math.round(alto * d); ctx.setTransform(d, 0, 0, d, 0, 0); };
    const desenhar = (t) => {
      ctx.clearRect(0, 0, w, alto); px += (alvoX - px) * .04; py += (alvoY - py) * .04;
      for (const e of estrelas) {
        const x = ((e.x + t * .0000045 * e.z) % 1) * w + px * e.z * 28, y = e.y * alto + py * e.z * 20, brilho = .45 + .55 * Math.sin(t * e.vel + e.fase);
        ctx.beginPath(); ctx.arc(x, y, .5 + e.z * 1.1, 0, 6.283); ctx.fillStyle = 'rgba(' + e.cor.join(',') + ',' + (.8 * brilho * (.3 + e.z * .7)).toFixed(3) + ')'; ctx.fill();
      }
    };
    const ciclo = (t) => {
      quadro = 0; if (!canvas.isConnected) { removeEventListener('resize', ajustar); removeEventListener('pointermove', mover); return; }
      if (t - ultimo >= 33) { ultimo = t; desenhar(t); }
      if (!document.hidden && !movimento.matches) quadro = requestAnimationFrame(ciclo);
    };
    const mover = (ev) => { alvoX = ev.clientX / innerWidth - .5; alvoY = ev.clientY / innerHeight - .5; };
    addEventListener('pointermove', mover, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !quadro && canvas.isConnected && !movimento.matches) quadro = requestAnimationFrame(ciclo); });
    addEventListener('resize', ajustar); ajustar();
    requestAnimationFrame((t) => { desenhar(t); if (!movimento.matches) quadro = requestAnimationFrame(ciclo); });
    return canvas;
  }

  /** Lado esquerdo da entrada: marca, lema e a esfera com as órbitas originais do Prumo. */
  function lema() {
    const orbe = h('span', { class: 'entrada-orbe' }, h('img', { src: '../../assets/qc-orb.png', alt: '', draggable: 'false' }));
    const orbita = h('div', { class: 'entrada-orbita', 'aria-hidden': 'true' }, orbe);
    PrumoOrbitas.anexar(orbita, true);
    return h('div', { class: 'entrada-vitrine' }, h('span', { class: 'entrada-etiqueta' }, tr('QUALIDADE DE SOFTWARE')), h('p', { class: 'entrada-lema' }, tr('Do ticket à evidência.')),
      h('p', { class: 'entrada-sub' }, tr('Testes, tickets, runs e relatórios num só lugar. Você decide o que sai do seu computador.')), h('p', { class: 'entrada-meta' }, 'Jira · Qase · GitHub'), orbita);
  }

  return { ceu, lema };
})();
