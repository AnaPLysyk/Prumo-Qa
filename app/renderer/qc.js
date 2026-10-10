'use strict';
// Componente visual Quality Control: esfera + campo de órbitas (canvas). Apresentação apenas.
// Honestidade: a animação só roda quando o estado é "executando" (há trabalho real) e o usuário não pediu menos movimento.
const qc = (() => {
  const reduzido = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const orbitas = [
    { rx: .41, ry: .17, tilt: -.10, vel: .00026, fase: .15, trilha: .17, alfa: .92, larg: 1.28, a: [116, 173, 255], b: [244, 247, 255] },
    { rx: .33, ry: .27, tilt: -1.03, vel: -.00018, fase: 2.0, trilha: .13, alfa: .70, larg: 1.02, a: [244, 247, 255], b: [255, 82, 108] },
    { rx: .365, ry: .215, tilt: .82, vel: .00022, fase: 4.35, trilha: .14, alfa: .76, larg: 1.08, a: [116, 173, 255], b: [255, 82, 108] }
  ];
  const particulas = Array.from({ length: 30 }, (_, i) => ({ o: i % 3, fase: (i / 30) * Math.PI * 2 + (i % 3) * .37, vel: .00009 + (i % 6) * .000018, tam: .62 + (i % 4) * .18, alfa: .12 + (i % 5) * .032 }));
  const campos = new Set(); let quadro = 0;
  const claro = () => { const t = document.documentElement.dataset.tema; return t === 'claro' || (t !== 'escuro' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches); };
  const cor = ([r, g, b]) => { if (!claro()) return [r, g, b]; if (r > 235 && g > 230 && b > 230) return [112, 128, 156]; if (r > 210 && r > g + 35) return [181, 70, 96]; return [43, 98, 184]; };
  const ponto = (cx, cy, rx, ry, ang, tilt) => { const x = Math.cos(ang) * rx, y = Math.sin(ang) * ry, c = Math.cos(tilt), s = Math.sin(tilt); return { x: cx + x * c - y * s, y: cy + x * s + y * c }; };
  function desenhar(campo, t) {
    const { canvas, ctx } = campo; const rect = canvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, rect.width), hh = Math.max(1, rect.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hh * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(hh * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, hh);
    const cx = w / 2, cy = hh / 2;
    orbitas.forEach((o, idx) => {
      const [ra, ga, ba] = cor(o.a);
      ctx.beginPath(); for (let j = 0; j <= 120; j++) { const p = ponto(cx, cy, o.rx * w, o.ry * w, (j / 120) * Math.PI * 2, o.tilt); j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
      ctx.strokeStyle = `rgba(${ra},${ga},${ba},${o.trilha})`; ctx.lineWidth = o.larg; ctx.stroke();
      const ini = o.fase + t * o.vel * 6; const [rb, gb, bb] = cor(o.b);
      ctx.beginPath(); for (let j = 0; j <= 40; j++) { const p = ponto(cx, cy, o.rx * w, o.ry * w, ini + 1.5 * (j / 40), o.tilt); j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
      ctx.strokeStyle = `rgba(${idx % 2 ? rb : ra},${idx % 2 ? gb : ga},${idx % 2 ? bb : ba},${o.alfa})`; ctx.lineWidth = o.larg * 1.2; ctx.stroke();
    });
    for (const p of particulas) { const o = orbitas[p.o]; const q = ponto(cx, cy, o.rx * w, o.ry * w, p.fase + t * p.vel, o.tilt); const [r, g, b] = cor(o.a);
      ctx.beginPath(); ctx.arc(q.x, q.y, p.tam, 0, Math.PI * 2); ctx.fillStyle = `rgba(${r},${g},${b},${p.alfa * 3})`; ctx.fill(); }
  }
  function ciclo(t) {
    quadro = 0; let animar = false;
    for (const c of [...campos]) { if (!c.canvas.isConnected) { campos.delete(c); continue; } desenhar(c, c.el.dataset.estado === 'executando' && !reduzido() ? t : 0); if (c.el.dataset.estado === 'executando' && !reduzido()) animar = true; }
    if (animar) quadro = requestAnimationFrame(ciclo);
  }
  const iniciar = () => { if (!quadro) quadro = requestAnimationFrame(ciclo); };
  /** Esfera. estado: 'ocioso' | 'executando' | 'parado'. */
  function orb(tamanho, estado, rotulo) {
    const el = document.createElement('span'); el.className = 'qc-orb'; el.dataset.estado = estado || 'ocioso'; el.style.setProperty('--qc-tam', tamanho + 'px');
    const img = document.createElement('img'); img.src = '../../assets/qc-orb.png'; img.alt = rotulo || ''; img.width = tamanho; img.height = tamanho; el.append(img);
    if (!rotulo) el.setAttribute('aria-hidden', 'true'); return el;
  }
  /** Esfera com campo de órbitas ao redor. */
  function campo(tamanho, estado, rotulo) {
    const el = document.createElement('div'); el.className = 'qc-campo'; el.dataset.estado = estado || 'ocioso';
    const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true'); const o = orb(tamanho, estado, rotulo); el.append(canvas, o);
    const c = { el, canvas, ctx: canvas.getContext('2d') }; campos.add(c); requestAnimationFrame(() => { desenhar(c, 0); iniciar(); }); return el;
  }
  /** Atualiza o estado de todas as esferas (real: vindo do worker). */
  function definirEstado(estado) {
    document.querySelectorAll('.qc-orb, .qc-campo').forEach((e) => { e.dataset.estado = estado; });
    for (const c of campos) if (c.canvas.isConnected) desenhar(c, 0); iniciar();
  }
  return { orb, campo, definirEstado };
})();
