'use strict';
// Órbitas originais do protótipo v36: geometria, cores, partículas e flexão das três curvas.
// Apresentação apenas. Um único laço de animação atende todos os campos anexados; movimento reduzido
// desenha um quadro parado e documento oculto suspende o laço.
const PrumoOrbitas = (() => {
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)');
  const orbitas = [
    { rx: .41, ry: .17, tilt: -.10, speed: .00026, phase: .15, trackAlpha: .17, alpha: .92, width: 1.28, colorA: [116, 173, 255], colorB: [244, 247, 255], lenA: .28, lenB: .20, dotted: false },
    { rx: .33, ry: .27, tilt: -1.03, speed: -.00018, phase: 2.0, trackAlpha: .13, alpha: .70, width: 1.02, colorA: [244, 247, 255], colorB: [255, 82, 108], lenA: .22, lenB: .16, dotted: true },
    { rx: .365, ry: .215, tilt: .82, speed: .00022, phase: 4.35, trackAlpha: .14, alpha: .76, width: 1.08, colorA: [116, 173, 255], colorB: [255, 82, 108], lenA: .24, lenB: .16, dotted: false }
  ];
  const particulas = Array.from({ length: 30 }, (_, i) => ({ orbit: i % 3, phase: (i / 30) * Math.PI * 2 + (i % 3) * .37, speed: .00009 + (i % 6) * .000018, size: .62 + (i % 4) * .18, alpha: .12 + (i % 5) * .032 }));
  const elipse = (cx, cy, rx, ry, a, tilt) => { const x = Math.cos(a) * rx, y = Math.sin(a) * ry, c = Math.cos(tilt), s = Math.sin(tilt); return { x: cx + x * c - y * s, y: cy + x * s + y * c }; };
  function flexao(cx, cy, rx, ry, a, tilt, i, t) {
    const wa = Math.sin(a * 2.15 + t * .00155 + i * 1.24), wb = Math.cos(a * 3.1 - t * .00105 + i * .82), wc = Math.sin(a * 1.05 + t * .00082 + i * 2.15);
    const f = wa * .040 + wb * .020 + wc * .012;
    return elipse(cx, cy, rx * (1 + f), ry * (1 - f * .74), a, tilt + wb * .028 + wc * .018);
  }
  function trilha(ctx, cx, cy, rx, ry, tilt, i, t, ini = 0, len = Math.PI * 2, passos = 140) {
    for (let j = 0; j <= passos; j++) { const p = flexao(cx, cy, rx, ry, ini + len * j / passos, tilt, i, t); if (j) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
  }
  const claro = () => { const t = document.documentElement.dataset.tema; return t === 'claro' || (t !== 'escuro' && matchMedia('(prefers-color-scheme: light)').matches); };
  const cor = (c, light) => { if (!light) return c; const [r, g, b] = c; if (r > 235 && g > 230 && b > 230) return [112, 128, 156]; if (r > 210 && r > g + 35) return [181, 70, 96]; return [43, 98, 184]; };
  function desenhar(n, t) {
    const rect = n.el.getBoundingClientRect(); if (rect.width < 4 || rect.height < 4) return;
    const w = rect.width, h = rect.height, dpr = Math.min(devicePixelRatio || 1, 1.5);
    if (n.w !== w || n.h !== h || n.dpr !== dpr) { n.w = w; n.h = h; n.dpr = dpr; n.canvas.width = Math.round(w * dpr); n.canvas.height = Math.round(h * dpr); }
    const ctx = n.ctx; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, light = claro();
    ctx.save(); ctx.globalCompositeOperation = light ? 'source-over' : 'lighter'; ctx.lineCap = 'round';
    orbitas.forEach((o, i) => {
      const rx = w * o.rx, ry = h * o.ry, giro = t * o.speed + o.phase, a = cor(o.colorA, light), b = cor(o.colorB, light);
      ctx.beginPath(); trilha(ctx, cx, cy, rx, ry, o.tilt, i, t); ctx.setLineDash(o.dotted ? (light ? [3, 4] : [4, 5]) : []);
      ctx.strokeStyle = light ? `rgba(36,58,93,${o.trackAlpha * 1.55})` : `rgba(${a.join(',')},${o.trackAlpha})`; ctx.lineWidth = o.width + (light ? .18 : 0); ctx.shadowBlur = 0; ctx.stroke();
      if (light) { ctx.beginPath(); trilha(ctx, cx, cy, rx, ry, o.tilt, i, t); ctx.strokeStyle = `rgba(17,31,56,${Math.min(.16, o.trackAlpha * .9)})`; ctx.lineWidth = o.width + 1.25; ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.beginPath(); trilha(ctx, cx, cy, rx, ry, o.tilt, i, t, giro, o.lenA * Math.PI * 2, 60);
      ctx.strokeStyle = `rgba(${a.join(',')},${Math.min(1, o.alpha * (light ? 1.2 : 1))})`; ctx.lineWidth = o.width + (light ? .85 : .55); ctx.shadowColor = `rgba(${a.join(',')},${light ? .30 : .42})`; ctx.shadowBlur = light ? 10 : 12; ctx.stroke();
      ctx.beginPath(); trilha(ctx, cx, cy, rx, ry, o.tilt, i, t, giro + Math.PI, o.lenB * Math.PI * 2, 60);
      ctx.strokeStyle = `rgba(${b.join(',')},${Math.min(1, o.alpha * .78 * (light ? 1.15 : 1))})`; ctx.lineWidth = o.width + (light ? .38 : .2); ctx.shadowColor = `rgba(${b.join(',')},${light ? .20 : .30})`; ctx.shadowBlur = light ? 7 : 9; ctx.stroke();
      ctx.beginPath(); trilha(ctx, cx, cy, rx, ry, o.tilt, i, t, giro + i * .85, .07 * Math.PI * 2, 60);
      ctx.strokeStyle = `rgba(${a.join(',')},${light ? .95 : .88})`; ctx.lineWidth = o.width + (light ? 1.15 : .85); ctx.shadowColor = `rgba(${a.join(',')},${light ? .24 : .38})`; ctx.shadowBlur = light ? 8 : 11; ctx.stroke();
    });
    particulas.forEach((p, i) => {
      const o = orbitas[p.orbit], pt = flexao(cx, cy, w * o.rx, h * o.ry, t * (o.speed + p.speed) + p.phase, o.tilt, p.orbit, t);
      const pulso = .55 + .45 * Math.sin(t * .0024 + i), alfa = p.alpha * .76 * (.72 + pulso * .3);
      const c = cor(i % 3 === 0 ? [255, 82, 108] : i % 3 === 1 ? [116, 173, 255] : [244, 247, 255], light);
      ctx.beginPath(); ctx.arc(pt.x, pt.y, p.size, 0, Math.PI * 2); ctx.shadowColor = `rgba(${c.join(',')},${alfa * (light ? .22 : .52)})`; ctx.shadowBlur = light ? 4 : 5;
      ctx.fillStyle = `rgba(${c.join(',')},${Math.min(1, alfa * (light ? 1.08 : 1))})`; ctx.fill(); ctx.shadowBlur = 0;
    });
    ctx.restore();
  }
  const campos = new Set(); let quadro = 0, ultimo = 0;
  function ciclo(t) {
    quadro = 0;
    if (t - ultimo >= 28) { ultimo = t; for (const n of campos) { if (!n.el.isConnected) { if (n.efemero) campos.delete(n); continue; } desenhar(n, reduzido.matches ? 0 : t); } }
    if (!document.hidden && !reduzido.matches && campos.size) quadro = requestAnimationFrame(ciclo);
  }
  const iniciar = () => { if (!quadro) quadro = requestAnimationFrame(ciclo); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) iniciar(); else if (quadro) { cancelAnimationFrame(quadro); quadro = 0; } });
  reduzido.addEventListener?.('change', () => { for (const n of campos) if (n.el.isConnected) desenhar(n, 0); iniciar(); });
  new MutationObserver(() => { for (const n of campos) if (n.el.isConnected) desenhar(n, reduzido.matches ? 0 : performance.now()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
  /** Anexa o campo de órbitas ao elemento (que define o tamanho). efemero: removido quando sai do documento. */
  function anexar(el, efemero = false) {
    const camada = document.createElement('span'); camada.className = 'v36-orbitas'; camada.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas'); camada.append(canvas); el.prepend(camada);
    const n = { el, canvas, ctx: canvas.getContext('2d'), w: 0, h: 0, dpr: 0, efemero }; campos.add(n);
    requestAnimationFrame(() => { if (el.isConnected) desenhar(n, reduzido.matches ? 0 : performance.now()); iniciar(); });
    return camada;
  }
  return { anexar, redesenhar: iniciar };
})();
