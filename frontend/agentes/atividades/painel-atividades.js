'use strict';
// Painel de atividades dos Agentes (v41): canvas infinito com janelas de terminal ligadas por linhas.
// Só desenha registros reais deste computador: operações do núcleo (MCP/CLI), conversas do chat (Orchestrator →
// agente → IA externa, quando houve delegação) e execuções do worker. Nenhuma ligação é inferida: cada linha vem de um
// campo gravado (cliente da operação, agente escolhido pelo roteamento, modo da resposta, rotina da execução).
// Pan e zoom por mouse, toque (pinça), trackpad e teclado; funciona em qualquer largura de janela.
const PrumoPainelAtividades = (() => {
  const { sv, classe, curto, temaClaro, assinatura, modelar, dispor } = PrumoModeloAtividades;
  function montar(host, o) {
    let vista = { x: 0, y: 0, k: 1 }, dados = null, layout = null, modelo = null, ultimaAssinatura = '', timer = null, ajustado = false, carregando = false;
    const ponteiros = new Map(); let arrasto = null, pinca = null, arrastou = false;
    const status = h('span', { class: 'pa-status', role: 'status' }, h('i'), h('span', {}, tr('Consultando atividades locais…')));
    const contagem = h('span', { class: 'pa-contagem', 'data-i18n-ignore': '' });
    const vivoChk = h('input', { type: 'checkbox', id: 'pa-ao-vivo', checked: true, onchange: () => agendar() });
    const zoomTxt = h('span', { class: 'pa-zoom-txt', 'aria-live': 'off' }, '100%');
    const btn = (rot, titulo, fn, attrs = {}) => h('button', { type: 'button', class: 'pa-btn', title: tr(titulo), 'aria-label': tr(titulo), onclick: fn, ...attrs }, rot);
    const raiz = h('section', { class: 'pa', 'aria-label': tr('Painel de atividades') });
    const barra = h('div', { class: 'pa-barra' },
      h('div', { class: 'pa-barra-info' }, status, contagem),
      h('div', { class: 'pa-barra-acoes' },
        h('label', { class: 'pa-vivo' }, vivoChk, h('span', { class: 'pa-trilho', 'aria-hidden': 'true' }), h('span', {}, tr('Ao vivo'))),
        btn('↻', 'Atualizar', () => carregar(true), { id: 'pa-atualizar' }),
        h('span', { class: 'pa-zoom', role: 'group', 'aria-label': tr('Zoom') }, btn('−', 'Afastar', () => zoomCentro(1 / 1.25)), zoomTxt, btn('+', 'Aproximar', () => zoomCentro(1.25))),
        btn('⤢', 'Ajustar à tela', () => ajustar(true), { id: 'pa-ajustar' }),
        btn('⛶', 'Tela cheia', alternarTelaCheia, { id: 'pa-tela-cheia' })));
    const lateral = o.lateral ? h('div', { class: 'pa-lateral', id: 'pa-lateral', hidden: true }, o.lateral.conteudo) : null;
    const botaoLateral = lateral ? h('button', { type: 'button', class: 'pa-btn pa-btn-texto', id: 'pa-lateral-botao', 'aria-controls': 'pa-lateral', 'aria-expanded': 'false', onclick: () => abrirLateral(lateral.hidden) }, '☰ ', h('span', {}, o.lateral.rotulo)) : null;
    if (botaoLateral) barra.lastChild.prepend(botaoLateral);
    function abrirLateral(aberta) { if (!lateral) return; lateral.hidden = !aberta; botaoLateral.setAttribute('aria-expanded', String(aberta)); requestAnimationFrame(() => ajustar(!o.reduzido())); }
    const ajuda = h('p', { class: 'pa-ajuda', id: 'pa-ajuda' }, tr('Arraste para mover, use a pinça ou Ctrl + roda para o zoom. Teclado: setas movem, + e − aproximam, 0 ajusta à tela. Cada linha liga registros gravados neste computador.'));
    const svg = sv('svg', { class: 'pa-arestas', 'aria-hidden': 'true' });
    const mundo = h('div', { class: 'pa-mundo' }); mundo.append(svg);
    const camada = h('div', { class: 'pa-nos' }); mundo.append(camada);
    const vp = h('div', { class: 'pa-viewport', tabindex: '0', role: 'region', 'aria-label': tr('Canvas de atividades dos agentes'), 'aria-describedby': 'pa-ajuda', title: tr('Arraste para mover, use a pinça ou Ctrl + roda para o zoom. Teclado: setas movem, + e − aproximam, 0 ajusta à tela. Cada linha liga registros gravados neste computador.') }, mundo);
    const mini = h('canvas', { class: 'pa-mini', width: 180, height: 110, 'aria-hidden': 'true' });
    const legenda = h('div', { class: 'pa-legenda' },
      ...[['ok', 'PASS · OK'], ['falha', 'FAIL · ERROR'], ['aviso', 'BLOCKED · STARTED · NOT_VERIFIED']].map(([c, t]) => h('span', {}, h('i', { class: c }), h('span', { 'data-i18n-ignore': '' }, t))),
      h('span', {}, h('i', { class: 'pulso' }), h('span', {}, tr('Pulso: registrado nos últimos 90 s'))),
      h('span', {}, h('i', { class: 'delegacao' }), h('span', {}, tr('Delegação do chat à IA externa'))));
    const palco = h('div', { class: 'pa-palco' }, vp, mini, lateral);
    raiz.append(barra, palco, legenda, ajuda); host.replaceChildren(raiz);
    // O canvas ocupa a altura que sobra na janela abaixo dele (legenda e ajuda incluídas), com um mínimo legível.
    function medirAltura() {
      if (!raiz.isConnected || document.fullscreenElement === raiz) return;
      const topo = vp.getBoundingClientRect().top, abaixo = raiz.getBoundingClientRect().bottom - palco.getBoundingClientRect().bottom;
      raiz.style.setProperty('--pa-altura', Math.round(Math.max(320, innerHeight - topo - abaixo - (o.margemInferior ?? 16))) + 'px');
    }
    medirAltura(); addEventListener('resize', medirAltura);

    // ---------- Vista: pan/zoom ----------
    function aplicar() {
      // O conteúdo nunca sai inteiro da tela: sobra ao menos uma faixa de 80 px visível.
      if (layout && vp.clientWidth) { const m = 80, W = vp.clientWidth, H = vp.clientHeight, lw = layout.largura * vista.k, lh = layout.altura * vista.k;
        vista.x = Math.min(W - m, Math.max(m - lw, vista.x)); vista.y = Math.min(H - m, Math.max(m - lh, vista.y)); }
      mundo.style.transform = `translate(${vista.x}px, ${vista.y}px) scale(${vista.k})`;
      const g = 26 * vista.k; vp.style.backgroundSize = `${g}px ${g}px`; vp.style.backgroundPosition = `${vista.x}px ${vista.y}px`;
      raiz.classList.toggle('pa-longe', vista.k < .5); zoomTxt.textContent = Math.round(vista.k * 100) + '%'; desenharMini();
    }
    const limitarK = (k) => Math.max(.12, Math.min(2.5, k));
    function zoomEm(px, py, fator) { const k = limitarK(vista.k * fator); const f = k / vista.k; vista = { x: px - (px - vista.x) * f, y: py - (py - vista.y) * f, k }; aplicar(); }
    function zoomCentro(f) { zoomEm(vp.clientWidth / 2, vp.clientHeight / 2, f); }
    function ajustar(animar) {
      if (!layout) return; const W = vp.clientWidth || 800, H = vp.clientHeight || 500, m = 40;
      const k = limitarK(Math.min((W - m * 2) / layout.largura, (H - m * 2) / layout.altura, 1.1));
      const alvo = { k, x: (W - layout.largura * k) / 2, y: Math.max(m, (H - layout.altura * k) / 2) };
      if (animar && !o.reduzido()) animarPara(alvo); else { vista = alvo; aplicar(); }
    }
    function animarPara(alvo) {
      const ini = { ...vista }, t0 = performance.now(), dur = 380;
      const passo = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); vista = { x: ini.x + (alvo.x - ini.x) * e, y: ini.y + (alvo.y - ini.y) * e, k: ini.k + (alvo.k - ini.k) * e }; aplicar(); if (p < 1) requestAnimationFrame(passo); };
      requestAnimationFrame(passo);
    }
    function centralizar(id) {
      const p = layout?.pos.get(id); if (!p) return; const W = vp.clientWidth, H = vp.clientHeight;
      const sx = vista.x + p.x * vista.k, sy = vista.y + p.y * vista.k, ex = sx + p.w * vista.k, ey = sy + p.h * vista.k;
      if (sx >= 0 && sy >= 0 && ex <= W && ey <= H) return;
      const k = Math.max(vista.k, .7), alvo = { k, x: W / 2 - (p.x + p.w / 2) * k, y: H / 2 - (p.y + p.h / 2) * k };
      if (o.reduzido()) { vista = alvo; aplicar(); } else animarPara(alvo);
    }
    vp.addEventListener('wheel', (ev) => {
      ev.preventDefault(); const r = vp.getBoundingClientRect();
      if (ev.ctrlKey || ev.metaKey) zoomEm(ev.clientX - r.left, ev.clientY - r.top, Math.exp(-ev.deltaY * .0025));
      else { vista.x -= ev.shiftKey ? ev.deltaY : ev.deltaX; vista.y -= ev.shiftKey ? 0 : ev.deltaY; aplicar(); }
    }, { passive: false });
    vp.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0 && ev.pointerType === 'mouse') return;
      ponteiros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (ponteiros.size === 1) { arrasto = { x: ev.clientX, y: ev.clientY, vx: vista.x, vy: vista.y }; arrastou = false; }
      else if (ponteiros.size === 2) { const [a, b] = [...ponteiros.values()]; pinca = { d: Math.hypot(a.x - b.x, a.y - b.y), k: vista.k }; arrasto = null; }
    });
    vp.addEventListener('pointermove', (ev) => {
      if (!ponteiros.has(ev.pointerId)) return; ponteiros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pinca && ponteiros.size >= 2) {
        const [a, b] = [...ponteiros.values()]; const r = vp.getBoundingClientRect(); const d = Math.hypot(a.x - b.x, a.y - b.y);
        zoomEm((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, limitarK(pinca.k * d / pinca.d) / vista.k); arrastou = true; return;
      }
      if (!arrasto) return; const dx = ev.clientX - arrasto.x, dy = ev.clientY - arrasto.y;
      if (!arrastou && Math.hypot(dx, dy) < 5) return;
      if (!arrastou) { arrastou = true; try { vp.setPointerCapture(ev.pointerId); } catch { /* ponteiro já liberado */ } raiz.classList.add('pa-arrastando'); }
      vista.x = arrasto.vx + dx; vista.y = arrasto.vy + dy; aplicar();
    });
    const soltar = (ev) => { ponteiros.delete(ev.pointerId); if (ponteiros.size < 2) pinca = null; if (!ponteiros.size) { arrasto = null; raiz.classList.remove('pa-arrastando'); } };
    vp.addEventListener('pointerup', soltar); vp.addEventListener('pointercancel', soltar);
    // Um arrasto que começou sobre um cartão não abre o cartão.
    vp.addEventListener('click', (ev) => { if (arrastou) { ev.stopPropagation(); ev.preventDefault(); arrastou = false; } }, true);
    vp.addEventListener('keydown', (ev) => {
      const passo = ev.shiftKey ? 160 : 60, mapa = { ArrowLeft: [passo, 0], ArrowRight: [-passo, 0], ArrowUp: [0, passo], ArrowDown: [0, -passo] };
      if (ev.target !== vp && ev.key.startsWith('Arrow')) return;
      if (mapa[ev.key]) { vista.x += mapa[ev.key][0]; vista.y += mapa[ev.key][1]; aplicar(); ev.preventDefault(); }
      else if (ev.key === '+' || ev.key === '=') { zoomCentro(1.2); ev.preventDefault(); }
      else if (ev.key === '-' || ev.key === '_') { zoomCentro(1 / 1.2); ev.preventDefault(); }
      else if (ev.key === '0') { ajustar(true); ev.preventDefault(); }
    });
    vp.addEventListener('focusin', (ev) => { const n = ev.target.closest?.('[data-no]'); if (n && ev.target.matches(':focus-visible')) centralizar(n.dataset.no); });
    mini.addEventListener('click', (ev) => {
      if (!layout) return; const r = mini.getBoundingClientRect(), esc = escalaMini();
      const wx = (ev.clientX - r.left - esc.ox) / esc.s, wy = (ev.clientY - r.top - esc.oy) / esc.s;
      vista.x = vp.clientWidth / 2 - wx * vista.k; vista.y = vp.clientHeight / 2 - wy * vista.k; aplicar();
    });
    function alternarTelaCheia() { if (document.fullscreenElement) document.exitFullscreen?.(); else raiz.requestFullscreen?.().catch(() => avisar(tr('Tela cheia indisponível nesta janela.'), true)); }
    const telaCheia = () => { raiz.classList.toggle('pa-cheia', document.fullscreenElement === raiz); medirAltura(); if (raiz.isConnected) setTimeout(() => ajustar(false), 60); }; document.addEventListener('fullscreenchange', telaCheia);
    // Mudança grande de proporção (girar o celular, tela cheia, janela lateral) refaz a disposição e reajusta.
    let proporcao = 0;
    const observador = new ResizeObserver(() => {
      if (!vp.clientWidth || !vp.clientHeight) return; const p = vp.clientWidth / vp.clientHeight;
      if (dados && proporcao && Math.abs(Math.log(p / proporcao)) > .25) { proporcao = p; ajustado = false; render(null); return; }
      if (!proporcao) proporcao = p; if (!ajustado && layout) { ajustar(false); ajustado = true; } desenharMini();
    }); observador.observe(vp);

    // ---------- Minimapa ----------
    function escalaMini() { const s = Math.min((mini.width - 12) / layout.largura, (mini.height - 12) / layout.altura); return { s, ox: (mini.width - layout.largura * s) / 2, oy: (mini.height - layout.altura * s) / 2 }; }
    function desenharMini() {
      if (!layout || !modelo) return;
      const tudo = vista.x >= -2 && vista.y >= -2 && vista.x + layout.largura * vista.k <= vp.clientWidth + 2 && vista.y + layout.altura * vista.k <= vp.clientHeight + 2;
      mini.hidden = tudo; if (tudo) return; const ctx = mini.getContext('2d'); if (!ctx) return; const { s, ox, oy } = escalaMini();
      ctx.clearRect(0, 0, mini.width, mini.height);
      for (const [id, p] of layout.pos) { const f = modelo.mapa.get(id); ctx.fillStyle = f?.cor ? f.cor + (id.includes(':') && !modelo.fonteIds.has(id) ? '99' : 'cc') : (temaClaro() ? '#14233d55' : '#ffffff55'); ctx.fillRect(ox + p.x * s, oy + p.y * s, Math.max(1.5, p.w * s), Math.max(1.5, p.h * s)); }
      ctx.strokeStyle = temaClaro() ? 'rgba(31,86,184,.9)' : 'rgba(255,255,255,.85)'; ctx.lineWidth = 1;
      ctx.strokeRect(ox + (-vista.x / vista.k) * s, oy + (-vista.y / vista.k) * s, (vp.clientWidth / vista.k) * s, (vp.clientHeight / vista.k) * s);
    }

    // ---------- Desenho dos nós ----------
    function pos(el, p) { el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; el.style.width = p.w + 'px'; el.style.height = p.h + 'px'; }
    function janela(f, p) {
      const corpo = h('div', { class: 'pa-janela-corpo', 'data-i18n-ignore': '' }, ...f.linhas.map((l) => h('div', { class: 'pa-tty' }, h('span', { class: 'pa-tty-hora' }, l.hora), ' ', h('span', { class: 'pa-tty-cmd' }, l.texto), ' ', h('span', { class: 'pa-tty-estado ' + classe(String(l.estado).replace(/^→ /, '')) }, l.estado), l.extra ? h('span', { class: 'pa-tty-extra' }, ' ' + l.extra) : null)),
        h('div', { class: 'pa-tty pa-cursor' }, h('span', { class: 'pa-tty-hora' }, '$'), ' ', h('span', { class: 'pa-caret' })));
      const el = h('div', { class: 'pa-janela pa-' + f.tipo + (f.vivo ? ' vivo' : ''), 'data-no': f.id, role: 'group', 'aria-label': f.titulo + ' · ' + f.sub },
        h('div', { class: 'pa-janela-titulo' }, h('span', { class: 'pa-luzes', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('strong', { 'data-i18n-ignore': '' }, f.titulo), f.vivo ? h('span', { class: 'pa-ao-vivo' }, tr('ATIVO')) : null),
        h('div', { class: 'pa-janela-sub' }, f.sub), corpo);
      el.style.setProperty('--cor', f.cor); pos(el, p); return el;
    }
    function hub(x, p) {
      const el = h('div', { class: 'pa-hub pa-' + x.tipo, 'data-no': x.id, role: 'group', 'aria-label': x.titulo + ' · ' + x.sub }, h('span', { class: 'pa-hub-marca', 'aria-hidden': 'true' }), h('span', { class: 'pa-hub-texto' }, h('strong', { 'data-i18n-ignore': '' }, x.titulo), h('small', {}, x.sub)));
      el.style.setProperty('--cor', x.cor); pos(el, p); return el;
    }
    function folha(f, p, novo) {
      const attrs = { type: 'button', class: 'pa-folha pa-' + f.tipo + (f.vivo ? ' vivo' : '') + (novo ? ' novo' : ''), 'data-no': f.id, 'aria-label': f.rotulo, onclick: () => abrir(f) };
      if (f.tipo === 'operacao') attrs['data-activity'] = f.dado.operationId; else if (f.tipo === 'conversa') attrs['data-conversa'] = f.dado.id; else attrs['data-execucao'] = f.dado.id;
      const el = h('button', attrs,
        h('span', { class: 'pa-folha-topo' }, h('span', { class: 'pa-tag', 'data-i18n-ignore': '' }, f.etiqueta), f.estado ? h('span', { class: 'pa-folha-estado ' + classe(f.estado), 'data-i18n-ignore': '' }, f.estado) : null, h('span', { class: 'pa-folha-hora' }, f.hora)),
        h('span', { class: 'pa-folha-linhas', 'data-i18n-ignore': '' }, ...f.linhas.filter(Boolean).map((l) => h('span', {}, l))));
      el.style.setProperty('--cor', f.cor); pos(el, p); return el;
    }
    function abrir(f) { if (f.tipo === 'operacao') o.abrirAtividade(f.dado); else if (f.tipo === 'conversa') o.abrirConversa(f.dado); else o.abrirExecucao(f.dado); }

    function curva(a, b, tipo) {
      if (tipo === 'delegacao') { const x1 = a.x + a.w / 2, y1 = a.y, x2 = b.x + b.w / 2, y2 = b.y + b.h; const dy = Math.max(120, (y1 - y2) * .5); return `M${x1},${y1} C${x1},${y1 - dy} ${x2},${y2 + dy} ${x2},${y2}`; }
      const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y, my = (y1 + y2) / 2;
      return `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
    }
    function render(anteriores) {
      modelo = modelar(dados); layout = dispor(modelo, vp.clientWidth || 1200, vp.clientHeight || 700); if (vp.clientHeight) proporcao = vp.clientWidth / vp.clientHeight;
      modelo.mapa = new Map([...modelo.fontes, ...modelo.hubs, ...modelo.folhas].map((x) => [x.id, x])); modelo.fonteIds = new Set(modelo.fontes.map((f) => f.id));
      const foco = document.activeElement?.closest?.('[data-no]')?.dataset.no;
      mundo.style.width = layout.largura + 'px'; mundo.style.height = layout.altura + 'px';
      svg.setAttribute('width', layout.largura); svg.setAttribute('height', layout.altura); svg.setAttribute('viewBox', `0 0 ${layout.largura} ${layout.altura}`);
      svg.replaceChildren(); raiz.classList.remove('pa-foco'); const parado = o.reduzido();
      for (const sec of modelo.secoes) {
        const t = sv('text', { x: sec.caixa.x, y: sec.caixa.y + 22, class: 'pa-secao-titulo' }); t.textContent = sec.titulo; svg.append(t);
      }
      for (const a of modelo.arestas) {
        const p1 = layout.pos.get(a.de), p2 = layout.pos.get(a.para); if (!p1 || !p2) continue;
        const d = curva(p1, p2, a.tipo);
        const path = sv('path', { d, class: 'pa-aresta pa-aresta-' + a.tipo + (a.estado ? ' ' + classe(a.estado) : '') + (a.vivo ? ' vivo' : ''), 'vector-effect': 'non-scaling-stroke', 'data-de': a.de, 'data-para': a.para });
        if (a.tipo === 'fonte') path.style.strokeWidth = Math.min(3.2, 1 + Math.log2(1 + (a.peso || 1)) * .45) + 'px';
        if (a.cor) path.style.stroke = a.cor;
        svg.append(path);
        if (a.vivo && !parado) { const c = sv('circle', { r: 3.4, class: 'pa-pulso' }); const m = sv('animateMotion', { dur: (1.6 + Math.random() * 1.4).toFixed(2) + 's', repeatCount: 'indefinite', path: d }); c.append(m); svg.append(c); }
      }
      const nos = [];
      for (const f of modelo.fontes) nos.push(janela(f, layout.pos.get(f.id)));
      for (const x of modelo.hubs) {
        nos.push(hub(x, layout.pos.get(x.id)));
        if (x.posMais) { const b = h('button', { type: 'button', class: 'pa-folha pa-mais', onclick: () => o.abrirTela(x.tipo === 'rotina' ? 'execucoes' : 'historico') }, h('strong', {}, tr('+{n} anteriores', { n: x.ocultas })), h('small', {}, x.tipo === 'rotina' ? tr('Ver em Execuções') : tr('Ver no Histórico'))); pos(b, x.posMais); nos.push(b); }
      }
      for (const f of modelo.folhas) nos.push(folha(f, layout.pos.get(f.id), anteriores && !anteriores.has(f.id)));
      camada.replaceChildren(...nos);
      if (!modelo.fontes.length) camada.append(h('div', { class: 'pa-vazio' }, h('strong', {}, tr('Nenhuma atividade registrada ainda')), h('span', {}, tr('Quando um cliente MCP chamar o núcleo, o chat responder ou o worker executar uma rotina, a janela aparece aqui. Nenhum agente executando foi inferido.'))));
      // Passar o mouse num nó destaca as linhas dele.
      camada.querySelectorAll('[data-no]').forEach((el) => { el.addEventListener('pointerenter', () => destacar(el.dataset.no, true)); el.addEventListener('pointerleave', () => destacar(el.dataset.no, false)); });
      if (foco) camada.querySelector(`[data-no="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
      const n = { op: dados.atividades.length, cv: dados.conversas.length, ex: dados.execucoes.length };
      contagem.textContent = [tr('{n} operações', { n: n.op }), tr('{n} conversas', { n: n.cv }), tr('{n} execuções', { n: n.ex })].join(' · ');
      if (!ajustado && vp.clientWidth) { ajustar(false); ajustado = true; } else aplicar();
    }
    function destacar(id, ligado) {
      raiz.classList.toggle('pa-foco', ligado);
      svg.querySelectorAll(`[data-de="${CSS.escape(id)}"], [data-para="${CSS.escape(id)}"]`).forEach((p) => p.classList.toggle('destaque', ligado));
    }

    // ---------- Dados ao vivo ----------
    async function carregar(manual) {
      if (carregando) return; carregando = true;
      try {
        const d = await o.carregar(); if (!raiz.isConnected) return destruir();
        if (!d) { status.lastChild.textContent = tr('Histórico indisponível para este projeto.'); status.className = 'pa-status erro'; return; }
        // Enquanto houver pulso, redesenha a cada 15 s para o pulso expirar sozinho após 90 s.
        const nova = assinatura(d) + (modelo && [...modelo.folhas, ...modelo.fontes].some((x) => x.vivo) ? '#' + Math.floor(Date.now() / 15000) : '');
        status.className = 'pa-status' + (vivoChk.checked ? ' vivo' : ''); status.lastChild.textContent = (vivoChk.checked ? tr('AO VIVO · REGISTROS LOCAIS') : tr('REGISTROS LOCAIS')) + ' · ' + curto(new Date().toISOString());
        if (nova !== ultimaAssinatura || manual) { const antes = dados ? new Set(modelo.folhas.map((f) => f.id)) : null; dados = d; ultimaAssinatura = nova; render(antes); }
        if (d.avisos?.length) status.title = d.avisos.join(' ');
      } finally { carregando = false; }
    }
    function parar() { clearInterval(timer); timer = null; }
    function destruir() { parar(); observador.disconnect(); document.removeEventListener('fullscreenchange', telaCheia); removeEventListener('resize', medirAltura); }
    function agendar() {
      parar(); status.classList.toggle('vivo', vivoChk.checked);
      if (vivoChk.checked) timer = setInterval(() => { if (!raiz.isConnected || !o.ativo()) { destruir(); return; } if (!document.hidden) carregar(false); }, 3000);
    }
    carregar(false).then(agendar);
    return { parar: destruir, abrirLateral };
  }
  return { montar };
})();
