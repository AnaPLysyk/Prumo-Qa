/** Monta o cenario visual da tela Agentes. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  function espaco(el) {
    document.querySelectorAll('.v36a-ceu').forEach((c) => c.remove()); const cv = h('canvas', { class: 'v36a-ceu', 'aria-hidden': 'true' }); document.body.append(cv);
    const ruido = (s) => { const x = Math.sin(s) * 43758.5453; return x - Math.floor(x); };
    const estrelas = Array.from({ length: 320 }, (_, i) => ({ x: ruido(i * 12.9898 + 1), y: ruido(i * 78.233 + 2), z: .15 + ruido(i * 3.17) ** 2 * .85, f: ruido(i * 9.71) * 6.28, cor: ruido(i * 5.3) }));
    const nebulas = [[.78, .16, '96,72,210', .20], [.16, .82, '24,128,176', .16], [.52, .52, '140,64,170', .08], [.94, .78, '40,90,200', .12]];
    let iniciado = false, meteoro = null, proximo = 4000;
    function quadro(t) {
      const naTela = document.body.dataset.tela === 'agentes'; if (naTela) iniciado = true; else if (iniciado || !cv.isConnected) { cv.remove(); return; } else { requestAnimationFrame(quadro); return; }
      if (document.hidden) { requestAnimationFrame(quadro); return; }
      const W = innerWidth, H = innerHeight, d = Math.min(devicePixelRatio || 1, 1.5), ctx = cv.getContext('2d'), parado = reduzido(), tt = parado ? 0 : t;
      if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
      const tema = document.documentElement.dataset.tema, claro = tema === 'claro' || (tema !== 'escuro' && matchMedia('(prefers-color-scheme: light)').matches);
      ctx.setTransform(d, 0, 0, d, 0, 0); const fundo = ctx.createLinearGradient(0, 0, 0, H); fundo.addColorStop(0, claro ? '#f4f7fd' : '#02040c'); fundo.addColorStop(1, claro ? '#e3eaf7' : '#060c1f'); ctx.fillStyle = fundo; ctx.fillRect(0, 0, W, H);
      for (const [nx, ny, cor, a] of nebulas) { const x = (nx + Math.sin(tt * .00003 + nx * 9) * .03) * W, y = (ny + Math.cos(tt * .000025 + ny * 7) * .03) * H, r = Math.max(W, H) * .55; const g = ctx.createRadialGradient(x, y, 0, x, y, r); const aa = claro ? a * .7 : a; g.addColorStop(0, `rgba(${cor},${aa})`); g.addColorStop(.45, `rgba(${cor},${aa * .35})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      for (const s of estrelas) { const x = ((s.x * W - tt * .006 * s.z) % W + W) % W, y = s.y * H, brilho = .25 + .75 * Math.abs(Math.sin(tt * .0011 * (.4 + s.z) + s.f)), r = .35 + s.z * 1.35;
        ctx.fillStyle = claro ? (s.cor > .82 ? `rgba(110,80,200,${brilho * .7})` : s.cor > .65 ? `rgba(40,100,190,${brilho * .7})` : `rgba(30,50,90,${brilho * .55})`) : s.cor > .82 ? `rgba(190,170,255,${brilho})` : s.cor > .65 ? `rgba(150,205,255,${brilho})` : `rgba(235,242,255,${brilho * .9})`;
        if (s.z > .82) { ctx.shadowColor = claro ? 'rgba(60,110,200,.6)' : 'rgba(160,200,255,.9)'; ctx.shadowBlur = 8; } ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
      if (!parado) { if (!meteoro && t > proximo) meteoro = { x: Math.random() * W * .8 + W * .2, y: Math.random() * H * .4, ini: t }; if (meteoro) { const k = (t - meteoro.ini) / 900; if (k > 1) { meteoro = null; proximo = t + 7000 + Math.random() * 9000; } else { const x = meteoro.x - k * 260, y = meteoro.y + k * 120, g = ctx.createLinearGradient(x, y, x + 90, y - 42); const mc = claro ? '40,90,180' : '220,235,255'; g.addColorStop(0, `rgba(${mc},${.85 * (1 - k)})`); g.addColorStop(1, `rgba(${mc},0)`); ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 90, y - 42); ctx.stroke(); } } }
      if (!parado) requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
  }
