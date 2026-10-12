'use strict';
/** Monta tabelas e representações visuais a partir das métricas observadas. */
// ---------------- Métricas: módulos escolhíveis, três visuais, escolha lembrada neste computador ----------------
const lerPrefMet = () => { try { return JSON.parse(localStorage.getItem('metricas-modulos')) || {}; } catch { return {}; } };
const gravarPrefMet = (p) => { try { localStorage.setItem('metricas-modulos', JSON.stringify(p)); } catch { /* sem armazenamento */ } };
const corVar = (c) => getComputedStyle(document.documentElement).getPropertyValue(c).trim() || '#888';
const celula = (n, rot) => h('div', {}, h('b', {}, String(n)), h('span', {}, rot));
function visualItens(itens, visual) {
  const total = itens.reduce((s, i) => s + (i.n || 0), 0); const max = Math.max(1, ...itens.map(i => i.n || 0));
  if (visual === 'numeros') return h('div', { class: 'grade' }, itens.map(i => celula(i.n, i.rot)));
  if (visual === 'barras') return h('div', { class: 'barras' }, itens.map(i => { const p = h('div', { class: 'preenche' }); if (i.cor) p.style.background = corVar(i.cor); requestAnimationFrame(() => { p.style.width = Math.round(((i.n || 0) / max) * 100) + '%'; }); p.style.width = '0%';
    return h('div', { class: 'linha-b' }, h('span', {}, i.rot), h('div', { class: 'trilho' }, p), h('span', { class: 'num' }, String(i.n))); }));
  if (!total) return h('p', { class: 'suave' }, 'Sem dados para mostrar.');
  const cores = itens.map(i => corVar(i.cor || '--acento')); let acc = 0;
  const fatias = itens.map((i, k) => { const ini = acc; acc += ((i.n || 0) / total) * 360; return cores[k] + ' ' + ini + 'deg ' + acc + 'deg'; });
  const rosca = h('div', { class: 'rosca', role: 'img', 'aria-label': itens.map(i => i.rot + ': ' + i.n).join(', ') }); rosca.style.background = 'conic-gradient(' + fatias.join(', ') + ')';
  return h('div', { class: 'rosca-caixa' }, rosca, h('div', { class: 'legenda' }, itens.map((i, k) => h('span', {}, (() => { const d = h('i'); d.style.background = cores[k]; return d; })(), i.rot + ' · ' + i.n))));
}
