/** Mostra indicadores, filtros e graficos do projeto. */
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
  const ALIAS = { smoke: 'Smoke', regressao: 'Regressão', 'validacao-ticket': 'Por ticket', 'consulta-jira': 'Consulta Jira', 'analise-mudancas': 'Mudanças', 'run-qase': 'Run Qase', k6: 'k6' };
  const FONTES = { prumo: 'Prumo local', mcp: 'MCP / CLI', jira: 'Jira', qase: 'Qase', github: 'GitHub' };
  const AMBIENTES = { local: 'Local', teste: 'Teste', homologacao: 'Homologação' };
  const RESULTADOS = ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'];
  const COR_RESULTADO = { PASS: '#54d39b', FAIL: '#ff7b8c', BLOCKED: '#e8b84a', NOT_RUN: '#9aa8c2' };
  const PALETA = ['#6ea8ff', '#54d39b', '#ff7b8c', '#e8b84a', '#a78bfa', '#4dc5d2', '#b6bacc', '#faab79'];
  const corDe = (rot, i) => COR_RESULTADO[rot] || PALETA[i % PALETA.length];
  const DEFS = {
    trend: { nome: 'Execuções ao longo do tempo', tipo: 'line', tipos: ['line', 'area', 'bars'], largo: true },
    result: { nome: 'Resultados de execução', tipo: 'donut', tipos: ['donut', 'bars', 'strip'] },
    routines: { nome: 'Tipos de rotina', tipo: 'bars', tipos: ['bars', 'donut', 'strip'] },
    reviews: { nome: 'Achados nas revisões', tipo: 'bars', tipos: ['bars', 'donut', 'strip'], nota: 'totais do núcleo' },
    sources: { nome: 'Fontes de atividade', tipo: 'donut', tipos: ['donut', 'bars', 'strip'] },
    environment: { nome: 'Ambientes', tipo: 'strip', tipos: ['strip', 'donut', 'bars'] },
    time: { nome: 'Duração por tipo', tipo: 'bars', tipos: ['bars', 'strip'], sufixo: ' ms' },
    jira: { nome: 'Consultas e publicações Jira', tipo: 'bars', tipos: ['bars', 'strip'] }
  };
  const NOMES_TIPO = { line: 'Linha', area: 'Área', bars: 'Barras', donut: 'Rosca', strip: 'Faixas' };
  function lerVista() {
    try { const p = JSON.parse(localStorage.getItem('prumo-v36-metricas') || 'null'); if (p && Array.isArray(p.vista)) { const ok = p.vista.filter((v) => DEFS[v.id] && DEFS[v.id].tipos.includes(v.tipo)); const faltam = Object.keys(DEFS).filter((id) => !ok.some((v) => v.id === id)).map((id) => ({ id, tipo: DEFS[id].tipo, on: false })); return { vista: [...ok, ...faltam], dias: [7, 30, 90].includes(p.dias) ? p.dias : 7 }; } } catch { /* sem preferência salva */ }
    return { vista: Object.keys(DEFS).map((id) => ({ id, tipo: DEFS[id].tipo, on: ['trend', 'result', 'routines'].includes(id) })), dias: 7 };
  }
  const gravarVista = (p) => { try { localStorage.setItem('prumo-v36-metricas', JSON.stringify(p)); } catch { /* armazenamento indisponível */ } };
  abas.metricas = async (el) => {
    el.classList.add('v36m'); el.append(h('h1', { class: 'v36-sr' }, 'Métricas'));
    if (!estado.root) return el.append(semProjeto());
    const root = estado.root, espaco = estado.espaco;
    const [v, hist, execs] = await Promise.all([chamar(() => api.visao(root)), chamar(() => api.historico(root, { limit: 1000 })), espaco ? chamar(() => api.execucoes({ espacoId: espaco.id, limite: 500 })) : null]);
    if (!v) return; const m = v.metrics;
    // Uma linha por registro real: execuções da agenda/manuais e operações MCP/CLI observadas pelo núcleo.
    const registros = [];
    for (const x of execs?.execucoes || []) { const st = x.resultado?.status || (x.estado === 'ERRO' ? 'ERRO_INFRA' : null); if (!st) continue;
      registros.push({ id: x.id, at: x.termino || x.inicio || x.slot || x.criadoEm, tipo: ALIAS[x.tipo] || x.tipo, status: st, fonte: x.tipo === 'consulta-jira' ? 'jira' : x.tipo === 'run-qase' ? 'qase' : x.tipo === 'analise-mudancas' ? 'github' : 'prumo', ambiente: x.ambiente || null, origem: x.origem, duracao: x.duracaoMs, ticket: x.ticket, jira: x.jira?.estado || null }); }
    for (const a of hist?.activities || []) { if (a.state === 'SEM_TERMINO_OBSERVADO') continue;
      registros.push({ id: a.operationId, at: a.at, tipo: a.tool, status: RESULTADOS.includes(a.state) ? a.state : a.state === 'ERROR' ? 'ERRO_INFRA' : 'INFO', fonte: 'mcp', ambiente: null, origem: a.origin, duracao: a.durationMs, ticket: null, jira: null }); }
    const pref = lerVista(); let dias = pref.dias, intervalo = null; const vista = pref.vista;
    const salvar = () => gravarVista({ vista, dias });
    // Barra
    const periodo = h('div', { class: 'v36m-periodo', role: 'group', 'aria-label': tr('Período') });
    const de = h('input', { type: 'date', id: 'v36-met-de' }), ate = h('input', { type: 'date', id: 'v36-met-ate' });
    const calendario = h('div', { class: 'v36m-calendario', hidden: true }, h('label', {}, tr('De'), de), h('label', {}, tr('Até'), ate), h('button', { type: 'button', onclick: () => { if (!de.value || !ate.value || de.value > ate.value) { avisar(tr('Escolha um período válido.'), true); return; } intervalo = [de.value, ate.value]; calendario.hidden = true; botaoCal.setAttribute('aria-expanded', 'false'); desenhar(); } }, tr('Aplicar período')));
    const botaoCal = h('button', { type: 'button', class: 'v36-btn-texto', 'aria-expanded': 'false', onclick: () => { calendario.hidden = !calendario.hidden; botaoCal.setAttribute('aria-expanded', String(!calendario.hidden)); } }, tr('Calendário'));
    const fFonte = h('select', { id: 'v36-met-fonte' }, h('option', { value: '' }, tr('Todas as fontes')), Object.entries(FONTES).map(([k, t]) => h('option', { value: k }, tr(t))));
    const fRes = h('select', { id: 'v36-met-resultado' }, h('option', { value: '' }, tr('Qualquer resultado')), [...RESULTADOS, 'INFO', 'ERRO_INFRA'].map((s) => h('option', { value: s }, s)));
    const fTipo = h('select', { id: 'v36-met-tipo' }, h('option', { value: '' }, tr('Todas as rotinas')), [...new Set(registros.map((r) => r.tipo))].sort((a, b) => String(a).localeCompare(String(b))).map((t) => h('option', { value: t }, t)));
    const fAmb = h('select', { id: 'v36-met-ambiente' }, h('option', { value: '' }, tr('Todos os ambientes')), Object.entries(AMBIENTES).map(([k, t]) => h('option', { value: k }, tr(t))));
    const fOri = h('select', { id: 'v36-met-execucao' }, h('option', { value: '' }, tr('Qualquer execução')), [['AGENDA', 'Agendada'], ['MANUAL', 'Manual'], ['MCP', 'MCP'], ['CLI', 'CLI']].map(([k, t]) => h('option', { value: k }, tr(t))));
    const fTicket = h('input', { type: 'search', id: 'v36-met-ticket', placeholder: 'SMART-1556', autocomplete: 'off' });
    const busca = h('input', { type: 'search', id: 'v36-met-busca', placeholder: tr('Tipo, resultado, ticket ou identificador…'), autocomplete: 'off' });
    const contagemFiltros = h('span', { class: 'v36-contagem' }), resumo = h('span', { id: 'v36-met-resumo' });
    const filtros = h('div', { class: 'v36-filtros', id: 'v36-met-filtros', hidden: true },
      h('label', {}, tr('Buscar atividade'), busca), h('label', {}, tr('Fonte da informação'), fFonte), h('label', {}, tr('Resultado'), fRes), h('label', {}, tr('Tipo de rotina'), fTipo),
      h('label', {}, tr('Ambiente'), fAmb), h('label', {}, tr('Execução'), fOri), h('label', {}, tr('Ticket / identificador'), fTicket), h('span'),
      h('div', { class: 'v36-filtros-acoes' }, resumo, h('button', { type: 'button', id: 'v36-met-limpar', onclick: () => { [busca, fFonte, fRes, fTipo, fAmb, fOri, fTicket].forEach((c) => { c.value = ''; }); desenhar(); } }, tr('Limpar filtros'))));
    const botaoFiltros = h('button', { type: 'button', class: 'v36-btn-texto', 'aria-expanded': 'false', 'aria-controls': 'v36-met-filtros', onclick: () => { filtros.hidden = !filtros.hidden; botaoFiltros.setAttribute('aria-expanded', String(!filtros.hidden)); } }, icone('filtro', 17), h('span', {}, tr('Filtros')), contagemFiltros);
    const escolhas = h('div', { class: 'v36m-escolhas' });
    const editor = h('div', { class: 'v36m-editor', id: 'v36-met-editor', hidden: true }, h('strong', {}, tr('Editar gráficos do relatório')), escolhas, h('p', {}, tr('Escolha, altere o formato e ordene os gráficos. Os filtros determinam os dados exibidos.')));
    const botaoEditor = h('button', { type: 'button', class: 'v36-btn-texto', 'aria-expanded': 'false', 'aria-controls': 'v36-met-editor', onclick: () => { editor.hidden = !editor.hidden; botaoEditor.setAttribute('aria-expanded', String(!editor.hidden)); } }, icone('graficos', 17), h('span', {}, tr('Editar gráficos')));
    const menu = h('div', { class: 'v36-menu', hidden: true, role: 'menu' });
    const botaoExportar = h('button', { type: 'button', class: 'v36-btn-icone', 'aria-label': tr('Exportar dados filtrados'), title: tr('Exportar dados filtrados'), 'aria-haspopup': 'true', 'aria-expanded': 'false', onclick: (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; botaoExportar.setAttribute('aria-expanded', String(!menu.hidden)); } }, icone('baixar', 17));
    const fora = (e) => { if (!botaoExportar.isConnected) { if (menu.dataset.visto) document.removeEventListener('click', fora); return; } menu.dataset.visto = '1'; if (!menu.hidden && !menu.contains(e.target)) { menu.hidden = true; botaoExportar.setAttribute('aria-expanded', 'false'); } };
    document.addEventListener('click', fora);
    const imprimir = h('button', { type: 'button', class: 'v36-btn-icone', 'aria-label': tr('Imprimir ou salvar em PDF'), title: tr('Imprimir ou salvar em PDF'), onclick: () => window.print() }, icone('documento', 17));
    const grade = h('div', { class: 'v36m-grade', id: 'v36-met-graficos' });
    const totais = [[m.totalOperations, 'interações registradas'], [m.mcpCalls, 'chamadas via MCP'], [m.coverageReviews, 'revisões de cobertura'], [m.contextAnalyses, 'análises de contexto'], [m.executions.PASS, 'PASS'], [m.executions.FAIL, 'FAIL'], [m.executions.BLOCKED, 'BLOCKED'], [m.executions.NOT_RUN, 'NOT_RUN']];
    el.append(DS.cabecalho({ titulo: 'Métricas' }), h('div', { class: 'v36m-barra' }, periodo, h('div', { class: 'v36m-periodo-caixa' }, botaoCal, calendario), h('span', { class: 'v36m-divisor', 'aria-hidden': 'true' }), botaoFiltros,
      h('div', { class: 'v36-direita' }, botaoEditor, botaoExportar, imprimir, menu)), filtros, editor,
      ...(m.complete ? [] : [h('div', { class: 'v36m-aviso' }, tr('Histórico parcial: registros inválidos ou truncados foram excluídos; os números são parciais.'))]),
      grade,
      h('div', { class: 'grade v36m-resumo' }, h('span', { class: 'v36m-resumo-titulo' }, tr('Totais do núcleo · todo o período')), totais.map(([n, t]) => h('div', {}, h('b', {}, String(n ?? 0)), h('span', {}, tr(t))))),
      h('p', { class: 'v36m-nota' }, DS.info('Os gráficos refletem os filtros selecionados. Uma consulta (INFO) não conta como teste PASS.', { rotulo: 'Sobre os gráficos' }), ' ',
        h('span', {}, tr('Última atividade:')), ' ', semTraducao(hora(m.lastActivity)), ' · ', h('span', {}, tr('Tokens e custos:')), ' ', semTraducao(String(m.providerMetrics)), ' · ', h('span', {}, tr('Última chamada MCP de:')), ' ', semTraducao(v.lastMcpClient || '—')));
    function noPeriodo(at) { const d = diaIso(at); if (intervalo) return d >= intervalo[0] && d <= intervalo[1]; return Date.parse(at) >= Date.now() - dias * 86400000; }
    function filtrados() {
      const q = busca.value.trim().toLowerCase(), tk = fTicket.value.trim().toLowerCase();
      const ativos = [busca.value, fFonte.value, fRes.value, fTipo.value, fAmb.value, fOri.value, fTicket.value].filter(Boolean).length; contagemFiltros.textContent = ativos ? String(ativos) : '';
      const lista = registros.filter((r) => noPeriodo(r.at) && (!fFonte.value || r.fonte === fFonte.value) && (!fRes.value || r.status === fRes.value) && (!fTipo.value || r.tipo === fTipo.value) && (!fAmb.value || r.ambiente === fAmb.value) && (!fOri.value || r.origem === fOri.value)
        && (!tk || (r.ticket || '').toLowerCase().includes(tk)) && (!q || [r.id, r.tipo, r.status, r.ticket, r.fonte].join(' ').toLowerCase().includes(q)));
      resumo.textContent = tr('{n} registros nos filtros atuais', { n: lista.length }); return lista;
    }
    const contar = (lista, f) => { const mp = new Map(); for (const r of lista) { const k = f(r); if (k != null) mp.set(k, (mp.get(k) || 0) + 1); } return [...mp].map(([rot, n], i) => ({ rot: String(rot), n, cor: corDe(String(rot), i) })); };
    function dados(id, lista) {
      if (id === 'trend') {
        const diasLista = []; if (intervalo) { for (let d = new Date(intervalo[0] + 'T12:00:00'); diaIso(d) <= intervalo[1] && diasLista.length < 366; d.setDate(d.getDate() + 1)) diasLista.push(diaIso(d)); }
        else for (let i = dias - 1; i >= 0; i--) diasLista.push(diaIso(Date.now() - i * 86400000));
        const cats = diasLista.map((d) => new Date(d + 'T12:00:00').toLocaleDateString(local(), { day: '2-digit', month: '2-digit' }));
        const porDia = (f) => diasLista.map((d) => lista.filter((r) => diaIso(r.at) === d && f(r)).length);
        return { cats, series: [{ nome: tr('Execuções'), valores: porDia((r) => r.status !== 'INFO') }, { nome: tr('Consultas'), valores: porDia((r) => r.status === 'INFO'), tracejado: true, cor: '#a78bfa' }] };
      }
      if (id === 'result') return RESULTADOS.map((s) => ({ rot: s, n: lista.filter((r) => r.status === s).length, cor: COR_RESULTADO[s] })).filter((i) => i.n);
      if (id === 'routines') return contar(lista, (r) => r.tipo).sort((a, b) => b.n - a.n);
      if (id === 'reviews') return [['Achados', m.findings], ['Lacunas', m.gaps], ['Recomendações', m.recommendations], ['Redundâncias', m.candidateRedundancies]].map(([t, n], i) => ({ rot: tr(t), n: n || 0, cor: PALETA[i] })).filter((i) => i.n);
      if (id === 'sources') return contar(lista, (r) => tr(FONTES[r.fonte]));
      if (id === 'environment') return contar(lista.filter((r) => r.ambiente && r.status !== 'INFO'), (r) => tr(AMBIENTES[r.ambiente] || r.ambiente));
      if (id === 'time') { const mp = new Map(); for (const r of lista) if (r.status !== 'INFO' && typeof r.duracao === 'number') { const o = mp.get(r.tipo) || { s: 0, n: 0 }; o.s += r.duracao; o.n++; mp.set(r.tipo, o); } return [...mp].map(([rot, o], i) => ({ rot, n: Math.round(o.s / o.n), cor: PALETA[i % PALETA.length] })).sort((a, b) => b.n - a.n); }
      if (id === 'jira') return [['Consultas', lista.filter((r) => r.fonte === 'jira').length], ['Comentários publicados', lista.filter((r) => r.jira === 'PUBLICADO').length], ['Comentários pendentes', lista.filter((r) => ['PENDENTE', 'FALHA', 'PREPARADO'].includes(r.jira)).length]].map(([t, n], i) => ({ rot: tr(t), n, cor: PALETA[i] })).filter((i) => i.n);
      return [];
    }
    const observadores = [];
    function pintar(area, v, lista) {
      const d = DEFS[v.id], x = dados(v.id, lista);
      if (v.id === 'trend') { if (v.tipo === 'bars' || v.tipo === 'area' || v.tipo === 'line') graficos.linhaTempo(area, x.cats, x.series, v.tipo); return; }
      if (v.tipo === 'donut') graficos.rosca(area, x); else if (v.tipo === 'strip') graficos.faixas(area, x); else graficos.barras(area, x, d.sufixo || '');
    }
    function mover(id, delta) { const i = vista.findIndex((v) => v.id === id); const ativos = vista.filter((v) => v.on); const pos = ativos.findIndex((v) => v.id === id); const alvo = ativos[pos + delta]; if (!alvo) return; const j = vista.indexOf(alvo); [vista[i], vista[j]] = [vista[j], vista[i]]; salvar(); desenhar(); }
    let arrastado = null;
    function secao(v, lista) {
      const d = DEFS[v.id]; const area = h('div', { class: 'v36m-area' });
      const formato = h('select', { 'aria-label': tr('Formato de {grafico}', { grafico: tr(d.nome) }) }, d.tipos.map((k) => h('option', { value: k, selected: k === v.tipo }, tr(NOMES_TIPO[k]))));
      formato.addEventListener('change', () => { v.tipo = formato.value; salvar(); pintar(area, v, lista); });
      const s = h('article', { class: 'v36m-secao' + (d.largo ? ' largo' : ''), 'data-grafico': v.id },
        h('div', { class: 'v36m-cabeca' }, h('h2', { class: 'v36m-titulo' }, tr(d.nome), d.nota ? h('small', {}, tr(d.nota)) : null),
          h('div', { class: 'v36m-acoes' }, formato, h('button', { type: 'button', title: tr('Mover para cima'), 'aria-label': tr('Mover para cima'), onclick: () => mover(v.id, -1) }, '↑'), h('button', { type: 'button', title: tr('Mover para baixo'), 'aria-label': tr('Mover para baixo'), onclick: () => mover(v.id, 1) }, '↓'),
            h('button', { type: 'button', class: 'v36m-alca', draggable: 'true', title: tr('Arrastar para reorganizar'), 'aria-label': tr('Arrastar para reorganizar') }, '⠿'))), area);
      const alcaEl = s.querySelector('.v36m-alca');
      alcaEl.addEventListener('dragstart', (e) => { arrastado = v.id; s.classList.add('arrastando'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', v.id); });
      alcaEl.addEventListener('dragend', () => { arrastado = null; s.classList.remove('arrastando'); });
      s.addEventListener('dragover', (e) => { if (arrastado && arrastado !== v.id) e.preventDefault(); });
      s.addEventListener('drop', (e) => { e.preventDefault(); if (!arrastado || arrastado === v.id) return; const i = vista.findIndex((x) => x.id === arrastado), j = vista.findIndex((x) => x.id === v.id); const [item] = vista.splice(i, 1); vista.splice(j, 0, item); salvar(); desenhar(); });
      let quadro = 0; const ro = new ResizeObserver(() => { cancelAnimationFrame(quadro); quadro = requestAnimationFrame(() => { if (area.isConnected) pintar(area, v, lista); }); }); ro.observe(area); observadores.push(ro);
      return s;
    }
    function desenhar() {
      periodo.replaceChildren(...[7, 30, 90].map((d) => h('button', { type: 'button', 'aria-pressed': String(!intervalo && dias === d), onclick: () => { dias = d; intervalo = null; salvar(); desenhar(); } }, tr('{n} dias', { n: d }))));
      botaoCal.setAttribute('aria-pressed', String(!!intervalo)); botaoCal.replaceChildren(h('span', {}, intervalo ? tr('Período: {de} a {ate}', { de: intervalo[0].split('-').reverse().join('/'), ate: intervalo[1].split('-').reverse().join('/') }) : tr('Calendário')));
      escolhas.replaceChildren(...vista.map((v) => h('label', {}, h('input', { type: 'checkbox', 'data-grafico': v.id, checked: v.on, onchange: (e) => { v.on = e.target.checked; salvar(); desenhar(); } }), h('span', {}, tr(DEFS[v.id].nome)))));
      const lista = filtrados(); observadores.splice(0).forEach((o) => o.disconnect());
      const ativos = vista.filter((v) => v.on);
      grade.replaceChildren(...(ativos.length ? ativos.map((v) => secao(v, lista)) : [h('div', { class: 'v36m-vazio' }, tr('Escolha pelo menos um gráfico em Editar gráficos.'))]));
      menu.replaceChildren(
        h('button', { type: 'button', role: 'menuitem', onclick: () => { menu.hidden = true; void download('prumo-metricas-observadas.json', JSON.stringify({ fonte: 'registros-locais', periodo: intervalo || { dias }, complete: m.complete, registros: lista }, null, 2)); } }, tr('Exportar JSON')),
        h('button', { type: 'button', role: 'menuitem', onclick: () => { menu.hidden = true; const cel = (x) => '"' + String(x ?? '').replaceAll('"', '""').replace(/^[\t\r\n ]*[=+@-]/, "'$&") + '"'; void download('prumo-metricas-observadas.csv', ['Horário,Tipo,Resultado,Fonte,Ambiente,Execução,Ticket,Duração (ms)', ...lista.map((r) => [r.at, r.tipo, r.status, r.fonte, r.ambiente, r.origem, r.ticket, r.duracao].map(cel).join(','))].join('\r\n'), 'text/csv;charset=utf-8'); } }, tr('Exportar CSV')));
    }
    [busca, fTicket].forEach((c) => c.addEventListener('input', desenhar)); [fFonte, fRes, fTipo, fAmb, fOri].forEach((c) => c.addEventListener('change', desenhar));
    desenhar();
  };

  // Detalhes de atividade usados pelo painel de atividades dos Agentes.
