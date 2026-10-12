/** Reúne trecho visual da função agentes para o bundle interfaces-v36. */
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
  function paralaxe(area, alvo) {
    area.addEventListener('pointermove', (e) => { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; const r = area.getBoundingClientRect(); alvo.style.setProperty('--rx', (((e.clientY - r.top) / r.height - .5) * -7).toFixed(2) + 'deg'); alvo.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 9).toFixed(2) + 'deg'); });
    area.addEventListener('pointerleave', () => { alvo.style.setProperty('--rx', '0deg'); alvo.style.setProperty('--ry', '0deg'); });
  }
  // Campo neural decorativo: pontos, sinapses e, no Cérebro, conexões do rosto aos neurônios com impulsos.
  function neural(el, opcoes = {}) {
    const cv = h('canvas', { class: 'v36-neural', 'aria-hidden': 'true' }); el.prepend(cv);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)'); let connected = false; let pending = 0;
    const n = opcoes.pontos || 70;
    const points = Array.from({ length: n }, (_, i) => ({ x: ((i * 73 + 17) % 997) / 997, y: ((i * 137 + 11) % 991) / 991, phase: i * 1.71, z: .4 + ((i * 29) % 10) / 16 }));
    const claro = () => !opcoes.escuro && (document.documentElement.dataset.tema === 'claro' || (document.documentElement.dataset.tema !== 'escuro' && matchMedia('(prefers-color-scheme: light)').matches));
    function draw(t) {
      if (cv.isConnected) connected = true;
      if (connected && !cv.isConnected) return;
      if (!cv.isConnected) { if (++pending < 10) requestAnimationFrame(draw); return; }
      if (document.hidden) { requestAnimationFrame(draw); return; }
      const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio, 1.5), ctx = cv.getContext('2d');
      if (cv.width !== Math.round(r.width * d) || cv.height !== Math.round(r.height * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
      ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
      const time = reduced.matches ? 0 : t * .00015, light = claro(); const base = light ? '43,98,184' : '120,175,255';
      const p = points.map((q) => ({ x: q.x * r.width + Math.sin(time + q.phase) * 14 * q.z, y: q.y * r.height + Math.cos(time * 1.2 + q.phase) * 11 * q.z, z: q.z }));
      ctx.lineWidth = .7;
      p.forEach((a, i) => { for (let j = i + 1; j < p.length; j++) { const dist = Math.hypot(a.x - p[j].x, a.y - p[j].y); if (dist < 140) { ctx.strokeStyle = `rgba(${base},${(1 - dist / 140) * (light ? .16 : .24)})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(p[j].x, p[j].y); ctx.stroke(); } }
        ctx.fillStyle = `rgba(${light ? '43,98,184' : '160,205,255'},${(.3 + .35 * Math.sin(time * 3 + i)) * a.z})`; ctx.beginPath(); ctx.arc(a.x, a.y, i % 5 ? 1 : 2.1, 0, Math.PI * 2); ctx.fill(); });
      if (el.classList.contains('v36-brain')) {
        const face = el.querySelector('.v36-brain-face')?.getBoundingClientRect();
        if (face) el.querySelectorAll('.v36-neuron').forEach((node, i) => {
          const pto = node.querySelector('.v36-neuron-ponto') || node; const box = pto.getBoundingClientRect(); const fx = face.left + face.width / 2 - r.left, fy = face.top + face.height * .42 - r.top;
          const x2 = box.left + box.width / 2 - r.left, y2 = box.top + box.height / 2 - r.top, ang = Math.atan2(y2 - fy, x2 - fx), x1 = fx + Math.cos(ang) * face.width * .2, y1 = fy + Math.sin(ang) * face.height * .24; const cor = node.dataset.cor || '#76b5f2';
          const ativo = node.getAttribute('aria-pressed') === 'true';
          ctx.strokeStyle = cor + (ativo ? 'dd' : '77'); ctx.lineWidth = ativo ? 1.6 : 1; ctx.beginPath(); ctx.moveTo(x1, y1); const mx = (x1 + x2) / 2; ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2); ctx.stroke();
          for (const k0 of [0, .5]) { const k = reduced.matches ? .5 : (time * 2.4 + i * .17 + k0) % 1, u = 1 - k;
            const bx = u * u * u * x1 + 3 * u * u * k * mx + 3 * u * k * k * mx + k * k * k * x2, by = u * u * u * y1 + 3 * u * u * k * y1 + 3 * u * k * k * y2 + k * k * k * y2;
            ctx.fillStyle = cor; ctx.shadowColor = cor; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(bx, by, ativo ? 2.8 : 2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
        });
      }
      if (!reduced.matches) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }
