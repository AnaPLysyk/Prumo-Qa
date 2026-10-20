/** Disponibiliza icones e exportacao usados em mais de uma tela. */
  async function download(name, value, type = 'application/json') {
    const kind = type.startsWith('text/csv') ? 'metricas-csv' : name.includes('metricas') ? 'metricas-json' : 'agente';
    const r = await chamar(() => api.exportarTela(kind, value));
    if (r?.exported) avisar('Arquivo exportado.');
  }

  // ---------------- Ícones do protótipo aprovado ----------------
  const NS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs, ...filhos) { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs || {})) if (v != null) e.setAttribute(k, v); for (const f of filhos.flat()) if (f) e.append(f); return e; }
  const R = (x, y, w, hh, rx) => ['rect', { x, y, width: w, height: hh, rx }];
  const C = (cx, cy, r) => ['circle', { cx, cy, r }];
  const D = (d) => ['path', { d }];
  const ICONES = {
    testes: [D('M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3')],
    agentes: [R(4, 8, 16, 12, 3), D('M12 8V4M9 14h.01M15 14h.01')],
    logs: [D('M4 6h16M4 12h16M4 18h10')],
    metricas: [D('M13 2 5 13h6l-1 9 9-13h-6l1-7Z')],
    historico: [D('M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2')],
    faisca: [D('m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z'), D('m19 16 .7 1.3L21 18l-1.3.7L19 20l-.7-1.3L17 18l1.3-.7L19 16Z')],
    enviar: [D('M12 19V5M5 12l7-7 7 7')],
    encaixar: [R(3, 4, 18, 16, 2), D('M14 4v16M8 12h3m-2-2 2 2-2 2')],
    soltar: [R(3, 4, 18, 16, 2), D('M14 4v16M19 12h-8m2-2-2 2 2 2')],
    fechar: [D('M6 6l12 12M18 6L6 18')],
    filtro: [D('M4 7h16M7 12h10M10 17h4'), C(8, 7, 2), C(16, 12, 2)],
    graficos: [D('M4 5h16M4 12h16M4 19h16M8 2v6M16 9v6M9 16v6')],
    baixar: [D('M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4')],
    documento: [D('M6 3h10l4 4v14H6zM15 3v5h5M9 13h8M9 17h6')],
    execucao: [C(12, 12, 9), D('m10 8 6 4-6 4z')],
    permissao: [D('m12 3 8 3v6c0 5-3 8-8 9-5-1-8-4-8-9V6z')],
    projeto: [D('M3 7h7l2 2h9v11H3z')],
    evidencia: [D('M6 3h10l4 4v14H6zM15 3v5h5M9 13h8M9 17h6')],
    revisao: [D('M4 7h16v12H4zM8 11h8M8 15h5')],
    agente: [R(4, 8, 16, 12, 3), D('M12 8V4M9 14h.01M15 14h.01')]
  };
  function icone(nome, tam = 16) { return sv('svg', { class: 'v36-icone', viewBox: '0 0 24 24', width: tam, height: tam, 'aria-hidden': 'true', focusable: 'false' }, ICONES[nome].map(([t, a]) => sv(t, a))); }
  const alca = () => sv('svg', { class: 'v36-icone', viewBox: '0 0 14 30', width: 14, height: 30, 'aria-hidden': 'true' }, sv('path', { d: 'M5 10 2 15l3 5M9 10l3 5-3 5' }));
  const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const local = () => (PrumoI18n.idioma === 'en' ? 'en-US' : 'pt-BR');
  const diaIso = (d) => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const hms = (iso) => new Date(iso).toLocaleTimeString(local(), { hour12: false });
  function caixa(titulo, conteudo) {
    const d = h('dialog', { class: 'v36-dialog', 'aria-label': titulo }, h('h2', {}, titulo), ...conteudo, h('div', {}, button(tr('Fechar'), () => d.close())));
    document.body.append(d); d.addEventListener('close', () => d.remove(), { once: true }); d.showModal(); return d;
  }

  // ---------------- Casca: tela atual, espaço reservado ao canto superior direito ----------------
  let telaAnterior = null;
  function medirTopo() { const t = document.querySelector('.topo-direita'); if (t) document.documentElement.style.setProperty('--v36-topo', Math.ceil(t.getBoundingClientRect().width + 34) + 'px'); }
  function marcarTela() {
    const aba = estado.aba; document.body.dataset.tela = aba; medirTopo(); if (aba !== 'agentes') document.querySelectorAll('.v36a-ceu').forEach((c) => c.remove());
    if (aba !== telaAnterior) { telaAnterior = aba; flutuante?.trocouTela(aba); }
  }

  // ---------------- Conversa do Orchestrator: um único DOM no Início e no painel ----------------
