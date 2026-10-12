/** Define como os graficos sao desenhados a partir dos dados. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  const graficos = (() => {
    const tokens = () => { const c = getComputedStyle(document.documentElement); const g = (n, p) => c.getPropertyValue(n).trim() || p; return { texto: g('--texto', '#14233d'), suave: g('--suave', '#465875'), linha: g('--linha', '#cfd9ea'), acento: g('--acento', '#1f56b8'), fundo: g('--fundo', '#f5f8fc') }; };
    const passoBom = (max) => { if (max <= 6) return 1; const bruto = max / 5, p = 10 ** Math.floor(Math.log10(bruto)), n = bruto / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
    function spline(pts, minY, maxY, k = 1.15) {
      if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
      let d = `M${pts[0][0]},${pts[0][1]}`; const lim = (y) => Math.max(minY, Math.min(maxY, y));
      for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        d += ` C${p1[0] + (p2[0] - p0[0]) * k / 6},${lim(p1[1] + (p2[1] - p0[1]) * k / 6)} ${p2[0] - (p3[0] - p1[0]) * k / 6},${lim(p2[1] - (p3[1] - p1[1]) * k / 6)} ${p2[0]},${p2[1]}`; }
      return d;
    }
    function dicaDe(host) { let d = host.querySelector('.v36m-dica'); if (!d) { d = h('div', { class: 'v36m-dica', hidden: true }); host.append(d); } return { mostrar: (x, y, conteudo) => { d.replaceChildren(...conteudo); d.style.left = Math.max(60, Math.min(host.clientWidth - 60, x)) + 'px'; d.style.top = y + 'px'; d.hidden = false; }, esconder: () => { d.hidden = true; } }; }
    const vazio = (host) => host.replaceChildren(h('div', { class: 'v36m-vazio' }, tr('Sem dados para estes filtros.')));
    const txt = (x, y, s, attrs) => sv('text', { x, y, ...attrs }, document.createTextNode(s));
    function linhaTempo(host, cats, series, tipo) {
      const W = host.clientWidth, H = host.clientHeight, t = tokens(); if (!cats.length || W < 40) return vazio(host);
      const m = { l: 38, r: 12, t: 10, b: 28 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      const max = Math.max(1, ...series.flatMap((s) => s.valores)), passo = passoBom(max), topo = Math.ceil(max / passo) * passo;
      const pad = cats.length > 1 ? iw / (cats.length - 1 + .72) * .36 : iw / 2, esp = cats.length > 1 ? (iw - pad * 2) / (cats.length - 1) : 0;
      const X = (i) => m.l + pad + i * esp, Y = (v) => m.t + ih - (v / topo) * ih;
      const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': series.map((s) => s.nome + ': ' + s.valores.reduce((a, b) => a + b, 0)).join(', ') });
      for (let v = 0; v <= topo; v += passo) { svg.append(sv('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: t.linha, 'stroke-dasharray': '2 3', 'stroke-width': 1 }), txt(m.l - 10, Y(v) + 3, String(v), { 'text-anchor': 'end', 'font-size': 10, fill: t.suave })); }
      const salto = Math.max(1, Math.ceil(cats.length / 8));
      cats.forEach((c, i) => { if (i % salto === 0 || i === cats.length - 1 && cats.length <= 8) svg.append(txt(X(i), H - 8, c, { 'text-anchor': 'middle', 'font-size': 10, fill: t.suave })); });
      series.forEach((s, si) => {
        const pts = s.valores.map((v, i) => [X(i), Y(v)]);
        if (si === 0 && tipo === 'bars') { const bw = Math.max(3, Math.min(28, esp * .6 || 28)); s.valores.forEach((v, i) => { if (v) svg.append(sv('rect', { x: X(i) - bw / 2, y: Y(v), width: bw, height: m.t + ih - Y(v), rx: 3, fill: t.acento, opacity: .9 })); }); return; }
        const d = spline(pts, m.t, m.t + ih, s.tracejado ? 1 : 1.15);
        if (si === 0 && tipo === 'area') svg.append(sv('path', { d: d + ` L${pts.at(-1)[0]},${m.t + ih} L${pts[0][0]},${m.t + ih} Z`, fill: t.acento, opacity: .105 }));
        svg.append(sv('path', { d, fill: 'none', stroke: s.cor || t.acento, 'stroke-width': s.tracejado ? 1.6 : 3, 'stroke-dasharray': s.tracejado ? '1.4 4' : null, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
        if (!s.tracejado) pts.forEach(([x, y]) => svg.append(sv('circle', { cx: x, cy: y, r: 2.6, fill: t.acento, stroke: t.fundo, 'stroke-width': 1 })));
      });
      const guia = sv('line', { y1: m.t, y2: m.t + ih, stroke: t.suave, 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0 }); svg.append(guia);
      const alvo = sv('rect', { x: m.l, y: m.t, width: iw, height: ih, fill: 'transparent' }); svg.append(alvo);
      host.replaceChildren(svg); const dica = dicaDe(host);
      alvo.addEventListener('pointermove', (e) => { const r = svg.getBoundingClientRect(); const x = (e.clientX - r.left) * (W / r.width); const i = Math.max(0, Math.min(cats.length - 1, Math.round(esp ? (x - m.l - pad) / esp : 0))); guia.setAttribute('x1', X(i)); guia.setAttribute('x2', X(i)); guia.setAttribute('opacity', .5);
        dica.mostrar(X(i) * (r.width / W), m.t + 6, [h('b', {}, cats[i]), ...series.map((s) => h('div', {}, s.nome + ': ' + s.valores[i]))]); });
      alvo.addEventListener('pointerleave', () => { guia.setAttribute('opacity', 0); dica.esconder(); });
    }
    function barras(host, itens, sufixo = '') {
      const W = host.clientWidth, H = host.clientHeight, t = tokens(); if (!itens.length || W < 40) return vazio(host);
      const m = { l: 112, r: 26, t: 7, b: 12 }, iw = W - m.l - m.r, banda = (H - m.t - m.b) / itens.length, alt = Math.min(22, banda * .42), max = Math.max(1, ...itens.map((i) => i.n)) * 1.17;
      const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': itens.map((i) => i.rot + ': ' + i.n + sufixo).join(', ') }); const dica = () => dicaDe(host);
      itens.forEach((it, k) => { const cy = m.t + banda * (k + .5), w = (it.n / max) * iw;
        svg.append(sv('line', { x1: m.l, x2: W - m.r, y1: cy, y2: cy, stroke: t.linha, 'stroke-width': 1 }), txt(m.l - 4, cy + 3, it.rot, { 'text-anchor': 'end', 'font-size': 10, fill: t.suave }));
        const r = sv('rect', { x: m.l, y: cy - alt / 2, width: Math.max(it.n ? 2 : 0, w), height: alt, fill: it.cor }); svg.append(r, txt(m.l + w + 5, cy + 3, String(it.n), { 'font-size': 10, fill: t.suave }));
        r.addEventListener('pointermove', (e) => { const b = host.getBoundingClientRect(); dica().mostrar(e.clientX - b.left, e.clientY - b.top, [h('b', {}, it.rot), h('div', {}, it.n + sufixo)]); }); r.addEventListener('pointerleave', () => dica().esconder()); });
      host.replaceChildren(svg);
    }
    function rosca(host, itens) {
      const W = host.clientWidth, H = host.clientHeight, t = tokens(), total = itens.reduce((a, b) => a + b.n, 0); if (!total || W < 40) return vazio(host);
      const legenda = 110, R0 = Math.max(30, Math.min(H - 17, W - legenda) / 2), r0 = R0 * .7, cx = (W - legenda) * .5, cy = H / 2;
      const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': itens.map((i) => i.rot + ': ' + i.n).join(', ') }); const dica = () => dicaDe(host);
      let a0 = -Math.PI / 2; const P = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      itens.filter((i) => i.n).forEach((it) => { const a1 = a0 + (it.n / total) * Math.PI * 2, g = a1 - a0 > Math.PI ? 1 : 0;
        const [x0, y0] = P(a0, R0), [x1, y1] = P(a1, R0), [x2, y2] = P(a1, r0), [x3, y3] = P(a0, r0);
        const d = it.n === total ? `M${cx},${cy - R0} A${R0},${R0} 0 1 1 ${cx - .01},${cy - R0} L${cx - .01},${cy - r0} A${r0},${r0} 0 1 0 ${cx},${cy - r0} Z` : `M${x0},${y0} A${R0},${R0} 0 ${g} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${g} 0 ${x3},${y3} Z`;
        const p = sv('path', { d, fill: it.cor, stroke: t.fundo, 'stroke-width': 3, 'stroke-linejoin': 'round' }); svg.append(p); a0 = a1;
        p.addEventListener('pointermove', (e) => { const b = host.getBoundingClientRect(); dica().mostrar(e.clientX - b.left, e.clientY - b.top, [h('b', {}, it.rot), h('div', {}, it.n + ' · ' + Math.round(it.n / total * 100) + '%')]); }); p.addEventListener('pointerleave', () => dica().esconder()); });
      svg.append(txt(cx, cy + 9, String(total), { 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 700, fill: t.texto }));
      const lx = W - legenda + 14, ly = cy - (itens.length * 19) / 2;
      itens.forEach((it, k) => svg.append(sv('rect', { x: lx, y: ly + k * 19, width: 10, height: 10, fill: it.cor }), txt(lx + 25, ly + k * 19 + 9, it.rot, { 'font-size': 11, fill: t.suave })));
      host.replaceChildren(svg);
    }
    function faixas(host, itens) {
      const W = host.clientWidth, H = host.clientHeight, t = tokens(), total = itens.reduce((a, b) => a + b.n, 0); if (!total || W < 40) return vazio(host);
      const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': itens.map((i) => i.rot + ': ' + i.n).join(', ') }); const dica = () => dicaDe(host);
      const y = H / 2 - 30, alt = 34; let x = 2;
      itens.forEach((it) => { const w = (it.n / total) * (W - 8); const r = sv('rect', { x, y, width: Math.max(0, w - 2), height: alt, rx: 3, fill: it.cor }); svg.append(r); x += w;
        r.addEventListener('pointermove', (e) => { const b = host.getBoundingClientRect(); dica().mostrar(e.clientX - b.left, e.clientY - b.top, [h('b', {}, it.rot), h('div', {}, it.n + ' / ' + total)]); }); r.addEventListener('pointerleave', () => dica().esconder()); });
      let lx = 2; const ly = y + alt + 30;
      itens.forEach((it) => { const label = it.rot + ' · ' + it.n; svg.append(sv('rect', { x: lx, y: ly - 9, width: 10, height: 10, fill: it.cor }), txt(lx + 15, ly, label, { 'font-size': 10, fill: t.suave })); lx += 30 + label.length * 6; });
      host.replaceChildren(svg);
    }
    return { linhaTempo, barras, rosca, faixas };
  })();

  // ---------------- Métricas ----------------
