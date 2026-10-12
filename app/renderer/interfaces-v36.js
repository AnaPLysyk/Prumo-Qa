'use strict';
// Integração isolada das telas aprovadas. Conteúdo importado é dado, nunca código.
(() => {
  const asset = (nome) => '../../assets/interfaces-v36/' + nome;
  const button = (texto, fn, attrs = {}) => h('button', { type: 'button', class: 'acao', onclick: fn, ...attrs }, texto);
  const field = (rotulo, input) => h('label', { class: 'v36-field' }, h('span', {}, rotulo), input);
  const note = (texto) => h('p', { class: 'suave' }, texto);
  const previewNotice = 'Prévia local: não executa, não se conecta ao MCP e não altera as políticas do núcleo.';
  const palette = ['#7abaff', '#80ddda', '#bea1f8', '#ffba90', '#a7de82', '#ffa1bf', '#f2d38c', '#99b8ff'];
  const variants = [0, 2, 3, 4, 5, 1, 6, 7];
  // Retrato vivo: respiração e microviradas próprias, halo na cor do agente e varredura holográfica.
  // tamanho: 'mini' (lista), 'large' (perfil e Cérebro) ou padrão. Movimento visual, sem articulação facial.
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
  const hm = (iso) => new Date(iso).toLocaleTimeString(local(), { hour: '2-digit', minute: '2-digit', hour12: false });
  const hms = (iso) => new Date(iso).toLocaleTimeString(local(), { hour12: false });
  const ignorar = (texto) => h('span', { 'data-i18n-ignore': '' }, texto);
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
  const TOPICOS = {
    tests: { rot: 'Meus testes', icone: 'testes', pergunta: 'execuções e falhas recentes', aba: 'execucoes', rota: 'Execuções' },
    agents: { rot: 'Agentes', icone: 'agentes', texto: 'Os agentes são as especializações do núcleo. Em Agentes você consulta cada uma e ajusta as permissões do projeto.', aba: 'agentes', rota: 'Agentes' },
    logs: { rot: 'Investigar logs', icone: 'logs', pergunta: 'erros e falhas', aba: 'logs', rota: 'Logs' },
    metrics: { rot: 'Métricas', icone: 'metricas', situacao: true, aba: 'metricas', rota: 'Métricas' },
    history: { rot: 'Histórico', icone: 'historico', texto: 'O histórico reúne as atividades observadas pelo núcleo, em linha do tempo ou em tabela.', aba: 'historico', rota: 'Histórico' }
  };
  const INICIAIS = ['tests', 'agents', 'logs', 'metrics'];
  const PROXIMOS = { tests: ['metrics', 'logs', 'agents'], agents: ['tests', 'logs', 'metrics'], logs: ['history', 'tests', 'metrics'], history: ['logs', 'metrics', 'tests'], metrics: ['tests', 'history', 'logs'] };
  const TOPICO_DA_TELA = { logs: 'logs', historico: 'history', metricas: 'metrics', agentes: 'agents', execucoes: 'tests', testes: 'tests' };
  function topicoDe(q) {
    const x = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/log|erro|falh|failure|trace/.test(x)) return 'logs'; if (/hist|aconteceu|atividade|timeline/.test(x)) return 'history';
    if (/metric|graf|chart|dashboard/.test(x)) return 'metrics'; if (/agente|agent|orquest|mcp/.test(x)) return 'agents';
    if (/teste|test|execu|run|pass|fail|block/.test(x)) return 'tests'; return null;
  }
  const conversa = (() => {
    let el = null, msgs, entrada, enviar, chips, seletorAgente, seletorProvedor, rodapeTexto, fila = Promise.resolve(), primeira = true, projeto, versao = 0, roster = null, historico = [], pendente = null;
    const nomeIa = () => estado.prefs?.ia?.nome || 'Prumo';
    const rolar = () => { msgs.scrollTop = msgs.scrollHeight; };
    function bolha(quem, rotulo) {
      const texto = h('div', { class: 'v36c-texto' }); const meta = quem === 'prumo' && (primeira || rotulo);
      const m = h('article', { class: 'msg ' + quem + (meta ? ' primeira' : '') }, meta ? h('div', { class: 'v36c-meta' }, rotulo || nomeIa()) : null, texto);
      if (quem === 'prumo') primeira = false; msgs.append(m); return { m, texto };
    }
    function digitar(t, v, rotulo) {
      if (v !== versao) return Promise.resolve();
      const { m, texto } = bolha('prumo', rotulo); if (reduzido()) { texto.textContent = t; rolar(); return Promise.resolve(); }
      return new Promise((ok) => { m.classList.add('digitando'); let n = 0; const id = setInterval(() => { if (m.parentNode !== msgs) { clearInterval(id); ok(); return; } n += 2; texto.textContent = t.slice(0, n); rolar(); if (n >= t.length) { clearInterval(id); m.classList.remove('digitando'); ok(); } }, 18); });
    }
    function falar(linhas, fontes, proximos, rotulo) {
      const v = versao;
      fila = fila.then(async () => {
        for (const [i, l] of linhas.entries()) { await digitar(l, v, i === 0 ? rotulo : null); falarVoz(l); }
        if (v !== versao) return;
        if (fontes?.length) { msgs.append(h('div', { class: 'v36c-fontes' }, fontes.map((f) => h('button', { type: 'button', class: 'v36c-fonte', onclick: () => abrirTela(f.aba) }, f.rotulo, h('span', { 'aria-hidden': 'true' }, '↗'))))); rolar(); }
        if (proximos) sugerir(proximos);
      }).catch(() => {});
      return fila;
    }
    function ocupado() { const m = h('div', { class: 'v36c-ocupado', role: 'status', 'aria-label': tr('Prumo está escrevendo') }, h('span'), h('span'), h('span')); msgs.append(m); rolar(); return () => m.remove(); }
    function chip(id) { const T = TOPICOS[id]; return h('button', { type: 'button', class: 'v36c-chip', 'data-topico': id, onclick: () => perguntar(tr(T.rot), id) }, icone(T.icone, 16), h('span', {}, tr(T.rot)), h('span', { class: 'v36c-seta', 'aria-hidden': 'true' }, '↗')); }
    function sugerir(ids) { chips.replaceChildren(...ids.map((p) => typeof p === 'string' ? chip(p) : h('button', { type: 'button', class: 'v36c-chip', onclick: () => p.pergunta ? perguntar(p.pergunta) : p.aba && abrirTela(p.aba) }, p.rotulo))); }
    function controlesResposta(r, pergunta) {
      const caixa = h('div', { class: 'v36c-fontes' }); const v = versao;
      for (const acao of r.acoes || []) caixa.append(h('button', { type: 'button', class: 'v36c-fonte', onclick: async (ev) => {
        const botao = ev.currentTarget; botao.disabled = true;
        const resultado = await chamar(() => api.conhecimentoDecidir(acao.id, acao.tipo === 'aprovar_conhecimento' ? 'APROVADO' : 'DESCARTADO'));
        if (resultado && v === versao) { caixa.querySelectorAll('[data-conhecimento="' + acao.id + '"]').forEach(b => b.remove()); avisar(acao.tipo === 'aprovar_conhecimento' ? 'Aprendizado aprovado.' : 'Aprendizado descartado.'); }
        else botao.disabled = false;
      }, 'data-conhecimento': acao.id }, acao.rotulo));
      if (r.atendimentoId) {
        const avaliar = async (valor) => {
          const resultado = await chamar(() => api.assistenteAvaliar(r.atendimentoId, valor)); if (!resultado || v !== versao) return;
          feedback.replaceChildren(h('span', {}, 'Avaliação registrada.'));
          if (valor === 'NAO_UTIL') {
            const correto = h('select', { 'aria-label': 'Agente mais adequado' }, h('option', { value: '' }, 'Corrigir roteamento…'), ...(roster?.agentes || []).map(a => h('option', { value: a.id }, a.nome)));
            correto.addEventListener('change', async () => { if (!correto.value) return; const corrigido = await chamar(() => api.assistenteAvaliar(r.atendimentoId, 'NAO_UTIL', { agenteCorreto: correto.value, pergunta })); if (corrigido && v === versao) feedback.replaceChildren(h('span', {}, 'Agente corrigido; os termos foram aprendidos.')); });
            feedback.append(correto);
          }
        };
        const feedback = h('span', {}, h('button', { type: 'button', class: 'v36c-fonte', onclick: () => avaliar('UTIL') }, 'Útil'), h('button', { type: 'button', class: 'v36c-fonte', onclick: () => avaliar('NAO_UTIL') }, 'Não ajudou'));
        caixa.append(feedback);
      }
      if (caixa.childNodes.length) { msgs.append(caixa); rolar(); }
    }
    // Leitura em voz alta (voz do sistema, sem rede), quando a pessoa ligou em Ajustes > Assistente.
    function falarVoz(texto) { const ia = estado.prefs?.ia; if (!ia?.lerRespostas || !('speechSynthesis' in window) || reduzido()) return; try { const u = new SpeechSynthesisUtterance(texto); const v = speechSynthesis.getVoices().find((x) => x.name === ia.voz); if (v) u.voice = v; u.lang = v?.lang || (PrumoI18n.idioma === 'en' ? 'en-US' : 'pt-BR'); speechSynthesis.speak(u); } catch { /* sem voz disponível */ } }
    const TOPICO_AGENTE = { tests: 'qa-geral', agents: 'orquestrador', logs: 'investigacao-bugs', metrics: 'monitoramento', history: 'monitoramento' };
    async function carregarRoster() {
      const r = await chamar(() => api.assistenteAgentes(idAtual())); if (!r || !seletorAgente) return; roster = r;
      const atual = seletorAgente.value; seletorAgente.replaceChildren(h('option', { value: '' }, tr('Agente automático')), ...r.agentes.map((a) => h('option', { value: a.id }, a.nome))); seletorAgente.value = r.agentes.some((a) => a.id === atual) ? atual : '';
      const opcoes = [['local', tr('Local')], ...r.provedores.filter((p) => p.disponivel && p.autorizado).map((p) => [p.id, p.id === 'claude' ? 'Claude Code' : 'Codex'])];
      const atualP = seletorProvedor.value; seletorProvedor.replaceChildren(...opcoes.map(([v, t]) => h('option', { value: v }, t))); seletorProvedor.value = opcoes.some(([v]) => v === atualP) ? atualP : 'local'; seletorProvedor.hidden = opcoes.length < 2;
      rodapeTexto.textContent = opcoes.length > 1 ? tr('Agentes locais; Claude/Codex só quando você escolher.') : tr('Respostas com os dados deste computador, sem modelo de IA.');
    }
    const idAtual = () => estado.espaco?.id ?? null;
    async function saudar() {
      const v = versao; const abertura = await chamar(() => api.assistenteAbertura(idAtual())); if (v !== versao || !abertura) return;
      pendente = abertura.pendente; falar(abertura.linhas, null, abertura.proximos);
    }
    function reiniciar() { versao++; primeira = true; fila = Promise.resolve(); historico = []; pendente = null; delete el.dataset.conversou; msgs.replaceChildren(); projeto = idAtual(); sugerir(INICIAIS); saudar(); }
    function sincronizar() { if (!el) return; carregarRoster(); entrada.setAttribute('aria-label', tr('Mensagem para o Prumo')); entrada.placeholder = tr('Pergunte alguma coisa ao Prumo…'); if (projeto !== idAtual()) reiniciar(); }
    function ajustarAltura() { entrada.style.height = 'auto'; entrada.style.height = Math.min(125, entrada.scrollHeight) + 'px'; }
    async function perguntar(q, topico) {
      q = String(q || '').trim(); if (q.length < 2 || enviar.disabled) return;
      sincronizar(); const v = versao; const { texto } = bolha('voce'); texto.textContent = q; rolar(); entrada.value = ''; ajustarAltura();
      enviar.disabled = true; const id = idAtual(); const fim = ocupado();
      try {
        const t = topico || topicoDe(q); const T = TOPICOS[t];
        // A memória fica apenas nesta janela e é isolada ao trocar de projeto.
        const agenteFixo = seletorAgente.value || (topico ? TOPICO_AGENTE[topico] : null) || null;
        const pergunta = topico && T?.pergunta ? T.pergunta : q;
        const memoria = historico.length ? historico : pendente ? [{ pergunta: '', agente: 'orquestrador', pendente }] : [];
        const r = await chamar(() => api.assistenteConversar(id, pergunta, { agente: agenteFixo, provedor: seletorProvedor.value || 'local', primeira: !el.dataset.conversou, historico: memoria }));
        fim(); if (v !== versao) return;
        if (idAtual() !== id) { reiniciar(); return; }
        if (!r) return; el.dataset.conversou = '1'; pendente = r.pendente;
        historico.push({ pergunta, agente: r.agente.id, pendente: r.pendente }); historico = historico.slice(-6);
        let fontes = r.fontes || []; if (T && !fontes.some((f) => f.aba === T.aba)) fontes = [...fontes, { rotulo: tr(T.rota), aba: T.aba }];
        const meio = r.modo === 'CLAUDE' ? 'Claude Code' : r.modo === 'CODEX' ? 'Codex' : tr('local');
        if (r.aviso) avisar(r.aviso);
        await falar(r.linhas.length ? r.linhas : [tr('Não encontrei nada sobre isso nos dados locais deste projeto.')], fontes, r.proximos || [], r.agente.nome + ' · ' + meio);
        if (v === versao) controlesResposta(r, pergunta);
      } catch { fim(); avisar(tr('Falha ao consultar o assistente local.'), true); } finally { enviar.disabled = false; }
    }
    function montar() {
      if (el) return el;
      msgs = h('div', { class: 'v36c-msgs', id: 'chat-msgs', 'aria-live': 'polite', 'data-i18n-ignore': '' });
      entrada = h('textarea', { id: 'chat-input', rows: 1, maxlength: 300, placeholder: tr('Pergunte alguma coisa ao Prumo…'), 'aria-label': tr('Mensagem para o Prumo'), autocomplete: 'off' });
      enviar = h('button', { type: 'submit', class: 'v36c-enviar', 'aria-label': tr('Enviar mensagem'), title: tr('Enviar mensagem') }, icone('enviar', 18));
      seletorAgente = h('select', { id: 'chat-agente', class: 'v36c-seletor', 'aria-label': tr('Agente que vai responder') }, h('option', { value: '' }, tr('Agente automático')));
      seletorProvedor = h('select', { id: 'chat-provedor', class: 'v36c-seletor', 'aria-label': tr('Quem processa a resposta'), hidden: true }, h('option', { value: 'local' }, tr('Local')));
      const form = h('form', { id: 'chat-form', class: 'v36c-compor' }, h('span', { class: 'v36c-faisca', 'aria-hidden': 'true' }, icone('faisca', 16)), entrada, enviar);
      chips = h('div', { class: 'v36c-chips', role: 'group', 'aria-label': tr('Sugestões de mensagens') });
      const orbita = h('div', { class: 'v36c-orbita', role: 'img', 'aria-label': tr('Prumo Orchestrator, esfera original com três órbitas') }, qc.campo(212, estadoOrb(estado.worker), ''));
      PrumoOrbitas.anexar(orbita);
      el = h('section', { class: 'v36c', id: 'v36-conversa', 'aria-label': tr('Conversa com o Prumo Orchestrator') },
        h('h1', { class: 'v36-sr' }, 'Prumo QA'),
        h('div', { class: 'v36c-topo' }, orbita), msgs,
        h('div', { class: 'v36c-interacao' }, h('div', { class: 'v36c-sugestoes' }, h('span', { class: 'v36c-faisca', 'aria-hidden': 'true' }, icone('faisca', 15)), h('span', {}, tr('O que vamos explorar?'))), chips),
        h('div', { class: 'v36c-compor-caixa' }, h('div', { class: 'v36c-opcoes' }, seletorAgente, seletorProvedor), form, h('div', { class: 'v36c-rodape' }, rodapeTexto = h('span', {}, tr('Respostas com os dados deste computador, sem modelo de IA.')), h('span', {}, 'Enter ↵ · Shift+Enter'))));
      form.addEventListener('submit', (e) => { e.preventDefault(); perguntar(entrada.value); });
      entrada.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
      entrada.addEventListener('input', ajustarAltura);
      reiniciar(); carregarRoster(); return el;
    }
    function contexto(aba, texto) { montar(); sincronizar(); falar([texto], null, PROXIMOS[TOPICO_DA_TELA[aba]] || INICIAIS); }
    function focar() { setTimeout(() => entrada?.focus({ preventScroll: true }), 220); }
    function estadoOrbita() { el?.querySelectorAll('.qc-orb, .qc-campo').forEach((e) => { e.dataset.estado = estadoOrb(estado.worker); }); }
    return { montar, sincronizar, contexto, focar, estadoOrbita, recarregar: () => { if (el) { carregarRoster(); } } };
  })();
  function abrirTela(aba) { if (!document.body.classList.contains('v36-encaixado')) flutuante?.fechar(true); mostrar(aba); }

  // ---------------- Orchestrator flutuante (robô original, balão contextual, painel e lateral) ----------------
  const DICAS = {
    metricas: ['Quer explorar um gráfico ou comparar períodos?', 'Posso te ajudar a interpretar estas métricas.'],
    historico: ['Quer descobrir o que aconteceu em uma operação?', 'Posso te ajudar a entender um evento do histórico.'],
    logs: ['Precisa investigar uma falha nos logs?', 'Posso te ajudar a localizar a etapa com problema.'],
    execucoes: ['Quer revisar uma execução de teste?', 'Posso te orientar a encontrar os resultados.'],
    testes: ['Quer entender os testes deste projeto?', 'Posso te orientar pelos cenários.'],
    agentes: ['Quer conhecer os agentes disponíveis?', 'Posso te explicar como configurá-los.'],
    conexoes: ['Quer revisar suas integrações?', 'Posso te orientar nas configurações de conexão.'],
    projetos: ['Quer explorar um projeto?', 'Posso te ajudar a navegar pelos projetos.'],
    tickets: ['Quer procurar um ticket?', 'Posso te mostrar por onde começar.']
  };
  let flutuante = null;
  function montarFlutuante() {
    const raiz = h('aside', { class: 'v36f', id: 'v36-float', 'aria-label': tr('Atalho do Prumo Orchestrator') });
    const dock = h('div', { class: 'v36f-dock', id: 'v36-float-dock' });
    const encaixe = h('button', { type: 'button', id: 'v36-chat-dock', class: 'v36f-ctl' });
    const fecharBtn = h('button', { type: 'button', id: 'v36-chat-close', class: 'v36f-ctl v36f-fechar', 'aria-label': tr('Fechar chat'), title: tr('Fechar chat') }, icone('fechar', 18));
    const alcaLateral = h('div', { class: 'v36f-grip', id: 'v36-side-grip', role: 'separator', tabindex: '0', 'aria-orientation': 'vertical', 'aria-label': tr('Ajustar largura do chat lateral'), title: tr('Arraste para ajustar a largura; use as setas do teclado') }, alca());
    const painel = h('section', { id: 'v36-float-panel', class: 'v36f-painel', hidden: true, role: 'dialog', 'aria-label': tr('Prumo Orchestrator, conversa compacta') }, h('div', { class: 'v36f-barra' }, encaixe, fecharBtn), dock, alcaLateral);
    const orbita = h('span', { class: 'v36f-orbita' }, h('span', { class: 'v36f-robo' }, h('img', { src: asset('robo-original.png'), alt: '', draggable: 'false' })), h('span', { class: 'v36f-alvo', 'aria-hidden': 'true' }));
    const botao = h('button', { type: 'button', id: 'v36-chat-open', class: 'v36f-botao', 'aria-label': tr('Abrir Prumo Orchestrator'), title: 'Prumo Orchestrator', 'aria-expanded': 'false', 'aria-controls': 'v36-float-panel' }, orbita);
    const dica = h('button', { type: 'button', class: 'v36f-dica', 'data-visible': 'false', 'aria-label': tr('Abrir sugestão do Prumo Orchestrator') });
    raiz.append(painel, botao, dica); document.body.append(raiz); PrumoOrbitas.anexar(orbita);
    const encaixado = () => document.body.classList.contains('v36-encaixado');
    function rotularEncaixe() {
      const lado = encaixado(); encaixe.replaceChildren(icone(lado ? 'soltar' : 'encaixar', 18));
      const dicaTxt = lado ? tr('Voltar para chat flutuante') : tr('Encaixar chat na lateral');
      encaixe.setAttribute('aria-label', dicaTxt); encaixe.title = dicaTxt; encaixe.setAttribute('aria-pressed', String(lado)); raiz.classList.toggle('lateral', lado);
    }
    function soltar() { document.body.classList.remove('v36-encaixado'); rotularEncaixe(); }
    let fechando = 0;
    function abrir() {
      if (estado.aba === 'inicio') return; clearTimeout(fechando); esconderDica();
      dock.append(conversa.montar()); conversa.sincronizar(); conversa.estadoOrbita();
      painel.classList.remove('fechando'); painel.hidden = false; raiz.classList.add('aberto'); document.body.classList.add('v36-painel-aberto'); botao.setAttribute('aria-expanded', 'true'); conversa.focar();
    }
    function fechar(imediato = false) {
      if (painel.hidden) { soltar(); return; }
      const devolverFoco = painel.contains(document.activeElement);
      const concluir = () => { painel.hidden = true; painel.classList.remove('fechando'); raiz.classList.remove('aberto'); document.body.classList.remove('v36-painel-aberto'); botao.setAttribute('aria-expanded', 'false'); soltar(); if (devolverFoco && estado.aba !== 'inicio') botao.focus(); };
      clearTimeout(fechando); if (imediato || reduzido()) concluir(); else { painel.classList.add('fechando'); fechando = setTimeout(concluir, 180); }
    }
    botao.addEventListener('click', () => (painel.hidden ? abrir() : fechar()));
    fecharBtn.addEventListener('click', () => fechar());
    encaixe.addEventListener('click', () => { if (painel.hidden) return; document.body.classList.toggle('v36-encaixado'); rotularEncaixe(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !painel.hidden && !document.querySelector('dialog[open]')) { e.preventDefault(); fechar(); } });
    // Largura da lateral: arrastar ou setas do teclado; limites relativos à janela.
    const limites = () => ({ min: Math.min(300, Math.round(innerWidth * .4)), max: Math.min(600, Math.round(innerWidth * .62)) });
    const larguraAtual = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--v36-lateral')) || 440;
    function ajustar(px) { const { min, max } = limites(); const w = Math.max(min, Math.min(max, Math.round(px))); document.documentElement.style.setProperty('--v36-lateral', w + 'px'); alcaLateral.setAttribute('aria-valuemin', min); alcaLateral.setAttribute('aria-valuemax', max); alcaLateral.setAttribute('aria-valuenow', w); }
    let arrastando = false;
    alcaLateral.addEventListener('pointerdown', (e) => { if (!encaixado() || innerWidth <= 840) return; arrastando = true; alcaLateral.classList.add('arrastando'); alcaLateral.setPointerCapture(e.pointerId); e.preventDefault(); });
    alcaLateral.addEventListener('pointermove', (e) => { if (arrastando) ajustar(innerWidth - e.clientX); });
    const fimArraste = () => { arrastando = false; alcaLateral.classList.remove('arrastando'); };
    alcaLateral.addEventListener('pointerup', fimArraste); alcaLateral.addEventListener('pointercancel', fimArraste); alcaLateral.addEventListener('lostpointercapture', fimArraste);
    alcaLateral.addEventListener('keydown', (e) => { if (encaixado() && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); ajustar(larguraAtual() + (e.key === 'ArrowLeft' ? 20 : -20)); } });
    // Balão contextual: convida a conversar, sem afirmar leitura de dados.
    let n = 0, tMostrar = 0, tEsconder = 0;
    function esconderDica() { dica.dataset.visible = 'false'; clearTimeout(tEsconder); }
    function mostrarDica() {
      const aba = estado.aba; if (aba === 'inicio' || !painel.hidden || document.hidden) return;
      const op = DICAS[aba] || ['Quer ajuda para explorar esta tela?', 'Posso te orientar nesta tela.'];
      dica.textContent = tr(op[n++ % op.length]); dica.dataset.visible = 'true'; clearTimeout(tEsconder); tEsconder = setTimeout(esconderDica, 6400);
    }
    dica.addEventListener('click', () => { const texto = dica.textContent; esconderDica(); abrir(); conversa.contexto(estado.aba, texto); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) esconderDica(); });
    setInterval(() => { if (dica.dataset.visible !== 'true') mostrarDica(); }, 15500);
    function trocouTela(aba) {
      esconderDica(); clearTimeout(tMostrar);
      if (aba === 'inicio') { fechar(true); return; }
      if (!painel.hidden && !encaixado()) fechar(true);
      tMostrar = setTimeout(mostrarDica, 1050);
    }
    rotularEncaixe();
    return { abrir, fechar, trocouTela };
  }

  // ---------------- Início ----------------
  abas.inicio = async (el) => {
    el.classList.add('v36-inicio');
    if (!estado.worker && typeof atualizarWorker === 'function') await atualizarWorker();
    flutuante?.fechar(true);
    el.append(conversa.montar()); conversa.estadoOrbita(); conversa.sincronizar();
  };

  // ---------------- Logs: terminal de eventos do núcleo ----------------
  // Mesma regra de nível do núcleo (atividades.ts): FAIL/ERROR = 50, BLOCKED = 40, demais = 30.
  const nivelDe = (s) => (s === 'ERROR' || s === 'FAIL' ? 'ERROR' : s === 'BLOCKED' ? 'WARN' : 'INFO');
  abas.logs = async (el) => {
    el.classList.add('v36l');
    const root = estado.root; const nomeProjeto = $('#projeto-atual')?.textContent || '';
    let eventos = [], aberto = null, assinatura = '';
    const busca = h('input', { type: 'search', id: 'v36-logs-busca', 'aria-label': tr('Buscar logs'), placeholder: tr('Buscar logs, código, operação ou ferramenta…'), autocomplete: 'off' });
    const fFerramenta = h('select', { id: 'v36-logs-ferramenta', 'aria-label': tr('Filtrar por ferramenta') }, h('option', { value: '' }, tr('Todas as ferramentas')));
    const fNivel = h('select', { id: 'v36-logs-nivel', 'aria-label': tr('Filtrar por nível') }, h('option', { value: '' }, tr('Níveis')), ['INFO', 'WARN', 'ERROR'].map((n) => h('option', { value: n }, n)));
    const fCliente = h('select', { id: 'v36-logs-cliente', 'aria-label': tr('Filtrar por cliente') }, h('option', { value: '' }, tr('Clientes')));
    const limpar = h('button', { type: 'button', class: 'v36l-mini', id: 'v36-logs-limpar', title: tr('Limpar filtros'), 'aria-label': tr('Limpar filtros') }, '↺');
    const corpo = h('div', { class: 'v36l-corpo', id: 'v36-terminal', role: 'log', 'aria-label': tr('Fluxo de eventos do núcleo') });
    const contador = h('span', { id: 'v36-logs-contador' }, tr('Aguardando registros…'));
    const seguir = h('input', { type: 'checkbox', id: 'acompanhar', checked: true });
    const status = h('span', { class: 'v36l-status' }, h('i'), h('span', {}, tr('REGISTROS LOCAIS')));
    const aviso = h('div', { class: 'v36l-aviso', hidden: true }, tr('Histórico parcial: registros inválidos excluídos.'));
    const janela = h('div', { class: 'v36l-janela' });
    const tema = h('button', { type: 'button', class: 'v36l-mini', title: tr('Alternar tema do terminal'), 'aria-label': tr('Alternar tema do terminal'), 'aria-pressed': 'false' }, '◐');
    tema.addEventListener('click', () => { const claro = getComputedStyle(janela).getPropertyValue('--t-bg').trim() === '#f5f8fc'; janela.classList.toggle('escuro', claro); janela.classList.toggle('claro', !claro); tema.setAttribute('aria-pressed', String(claro)); });
    const exportar = h('button', { type: 'button', class: 'v36l-mini', title: tr('Exportar registros'), disabled: !root }, '⇩ ', tr('Exportar'));
    exportar.addEventListener('click', async () => { const r = await chamar(() => api.exportarLogs(root)); if (r?.exported) avisar(tr('Logs exportados.')); });
    const diagnostico = h('button', { type: 'button', id: 'ver-diagnostico' }, tr('Diagnóstico da interface'));
    diagnostico.addEventListener('click', async () => { const r = await chamar(api.diagnostico); if (!r) return; corpo.querySelector('.v36l-diagnostico')?.remove(); const painel = h('section', { class: 'v36l-diagnostico v36l-detalhe', 'aria-label': tr('Diagnóstico da interface') }, h('div', { class: 'v36l-detalhe-topo' }, h('span', {}, tr('Diagnóstico da interface'))), h('small', {}, tr('Metadados IPC, separados das métricas de QA.')), h('pre', {}, JSON.stringify(r.events, null, 2))); corpo.append(painel); painel.scrollIntoView({ block: 'nearest' }); });
    janela.append(
      h('div', { class: 'v36l-topo' }, h('span', { class: 'v36l-pontos', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('span', { class: 'v36l-caminho', 'data-i18n-ignore': '' }, 'prumo@local:~/logs ', h('strong', {}, '› ' + (root ? nomeProjeto : '—'))), status, h('div', { class: 'v36l-acoes' }, tema, exportar)),
      h('div', { class: 'v36l-ferramentas' }, h('span', { class: 'v36l-prompt', 'aria-hidden': 'true' }, '❯'), busca, fFerramenta, fNivel, fCliente, limpar),
      corpo,
      h('div', { class: 'v36l-rodape' }, h('div', { class: 'v36l-led' }, h('i'), contador), h('div', { class: 'v36l-rodape-acoes' }, h('label', {}, seguir, h('span', {}, tr('Seguir saída'))), diagnostico)));
    el.append(h('h1', { class: 'v36-sr' }, 'Logs'), janela);
    const boot = () => h('div', { class: 'v36l-boot' }, h('span', { class: 'v36l-destaque' }, 'Prumo QA'), ' · ', h('span', {}, tr('visualizador de logs')), h('br'),
      h('span', { class: 'v36l-sub' }, '● ', h('span', {}, tr('Terminal de eventos · registros locais do núcleo (MCP e CLI)'))), h('br'),
      h('span', { class: 'v36l-sub' }, tr('Selecione uma linha para inspecionar seus metadados. Nenhum comando é executado nesta tela.')));
    if (!root) { corpo.append(boot(), h('div', { class: 'v36l-vazio' }, semProjeto())); [busca, fFerramenta, fNivel, fCliente, limpar, seguir].forEach((c) => { c.disabled = true; }); contador.textContent = tr('Nenhum projeto selecionado'); return; }
    const chave = (e) => e.operationId + ':' + e.phase;
    function mensagem(e) { return e.phase === 'start' ? [h('span', {}, tr('Operação iniciada')), ' · ', ignorar(e.origin + '/' + e.client)] : [h('span', {}, tr('Operação encerrada')), ' · ', ignorar([e.state, e.summary?.code, ms(e.durationMs)].filter(Boolean).join(' · '))]; }
    function detalhe(e) {
      const campos = [['Horário completo', e.at], ['Operação / correlação', e.operationId], ['Fase', e.phase], ['Ferramenta', e.tool], ['Origem', e.origin], ['Cliente (declarado)', e.client], ['Estado', e.state], ['Duração', ms(e.durationMs)], ['Código', e.summary?.code || '—'], ['Evidência', e.summary?.evidenceJobId || '—']];
      const ev = e.summary?.evidenceJobId;
      return h('div', { class: 'v36l-detalhe', role: 'region', 'aria-label': tr('Detalhes do log') },
        h('div', { class: 'v36l-detalhe-topo' }, '↳ ', h('span', {}, tr('Inspeção de evento')), ' · ', ignorar('op-' + e.operationId.slice(0, 8))),
        h('dl', {}, campos.map(([k, v]) => h('div', {}, h('dt', {}, tr(k)), h('dd', { 'data-i18n-ignore': '' }, String(v))))),
        h('pre', {}, JSON.stringify(e, null, 2)),
        h('small', {}, tr('Somente os metadados registrados pelo núcleo para esta operação.')),
        ev ? h('button', { type: 'button', class: 'v36l-mini', onclick: () => { estado.jobId = ev; mostrar('evidencias'); } }, tr('Ver evidência')) : null);
    }
    function linha(e) {
      const nivel = nivelDe(e.state), ab = aberto === chave(e);
      const b = h('button', { type: 'button', class: 'v36l-linha v36-log-line', 'data-level': nivel, 'data-state': e.state, 'aria-expanded': String(ab), title: e.operationId },
        h('span', { class: 'v36l-hora' }, hms(e.at)), h('span', { class: 'v36l-nivel', 'data-level': nivel }, nivel), h('span', { class: 'v36l-op' }, 'op-' + e.operationId.slice(0, 6)),
        h('span', { class: 'v36l-fase' }, e.tool), h('span', { class: 'v36l-msg' }, ...mensagem(e)), h('span', { class: 'v36l-seta', 'aria-hidden': 'true' }, ab ? '⌃' : '⌄'));
      b.addEventListener('click', () => { aberto = ab ? null : chave(e); desenhar(); corpo.querySelector('[data-log="' + chave(e) + '"]')?.scrollIntoView({ block: 'nearest' }); });
      return h('div', { class: 'v36l-evento', 'data-log': chave(e) }, b, ab ? detalhe(e) : null);
    }
    function desenhar() {
      const q = busca.value.trim().toLowerCase();
      const linhas = eventos.filter((e) => (!fFerramenta.value || e.tool === fFerramenta.value) && (!fNivel.value || nivelDe(e.state) === fNivel.value) && (!fCliente.value || e.client === fCliente.value)
        && (!q || [e.operationId, e.tool, e.state, e.origin, e.client, e.phase, e.summary?.code].join(' ').toLowerCase().includes(q)));
      const diag = corpo.querySelector('.v36l-diagnostico'); corpo.replaceChildren(boot(), aviso, ...linhas.map(linha));
      if (!linhas.length) corpo.append(h('div', { class: 'v36l-vazio' }, eventos.length ? tr('Nenhum registro para estes filtros.') : tr('Nenhum registro ainda. As chamadas MCP e CLI deste projeto aparecem aqui.')));
      if (diag) corpo.append(diag);
      const ops = new Set(linhas.map((e) => e.operationId)).size;
      contador.textContent = tr('{n} registros · {m} operações', { n: linhas.length, m: ops });
      if (seguir.checked && !aberto) corpo.scrollTop = corpo.scrollHeight;
    }
    function preencher(sel, valores) { const atual = sel.value; const primeiro = sel.options[0]; sel.replaceChildren(primeiro, ...valores.map((v) => h('option', { value: v }, v))); sel.value = valores.includes(atual) ? atual : ''; }
    async function carregar() {
      const r = await chamar(() => api.logs(root, { limit: 1000 })); if (!r || estado.root !== root || estado.aba !== 'logs' || !janela.isConnected && eventos.length) return;
      const novos = [...r.events].sort((a, b) => a.at.localeCompare(b.at) || (a.phase === 'start' ? -1 : 1));
      const ass = novos.length + '|' + (novos.at(-1) ? chave(novos.at(-1)) + novos.at(-1).at : '') + '|' + r.complete;
      if (ass === assinatura) return; assinatura = ass; eventos = novos; aviso.hidden = r.complete;
      preencher(fFerramenta, [...new Set(eventos.map((e) => e.tool))].sort()); preencher(fCliente, [...new Set(eventos.map((e) => e.client))].sort()); desenhar();
    }
    function acompanhar() { clearInterval(estado.timer); status.classList.toggle('vivo', seguir.checked); status.lastChild.textContent = seguir.checked ? tr('AO VIVO · REGISTROS LOCAIS') : tr('REGISTROS LOCAIS'); if (seguir.checked) estado.timer = setInterval(carregar, 2000); }
    [busca].forEach((c) => c.addEventListener('input', desenhar)); [fFerramenta, fNivel, fCliente].forEach((c) => c.addEventListener('change', desenhar));
    limpar.addEventListener('click', () => { busca.value = ''; fFerramenta.value = ''; fNivel.value = ''; fCliente.value = ''; desenhar(); });
    seguir.addEventListener('change', () => { acompanhar(); if (seguir.checked) desenhar(); });
    await carregar(); if (!eventos.length) desenhar(); acompanhar();
  };

  // ---------------- Histórico: linha do tempo e tabela das atividades observadas ----------------
  const ROTULO_FERRAMENTA = { contexto_projeto: 'Contexto do projeto consultado', revisar_cobertura: 'Revisão de cobertura', executar_validacao: 'Validação solicitada', consultar_evidencias: 'Evidências consultadas', desconhecida: 'Ferramenta não reconhecida' };
  const ICONE_FERRAMENTA = { contexto_projeto: 'projeto', revisar_cobertura: 'revisao', executar_validacao: 'execucao', consultar_evidencias: 'evidencia', desconhecida: 'agente' };
  const classeEstado = (s) => (['PASS', 'OK'].includes(s) ? 'good' : ['FAIL', 'ERROR'].includes(s) ? 'bad' : ['BLOCKED', 'NOT_VERIFIED', 'NOT_RUN', 'SEM_TERMINO_OBSERVADO', 'STARTED'].includes(s) ? 'warn' : '');
  function detalhesAtividade(a) { caixa(tr('Detalhes da atividade'), [note(tr('Origem observada no núcleo; identidade do cliente é declarada.')), h('pre', {}, JSON.stringify(a, null, 2))]); }
  async function copiar(texto) { try { await navigator.clipboard.writeText(texto); avisar(tr('Copiado.')); } catch { avisar(tr('Não foi possível copiar.'), true); } }
  abas.historico = async (el) => {
    el.classList.add('v36h'); el.append(h('h1', { class: 'v36-sr' }, 'Histórico'));
    if (!estado.root) return el.append(semProjeto());
    const root = estado.root; const r = await chamar(() => api.historico(root, { limit: 1000 })); if (!r) return;
    const nomeProjeto = $('#projeto-atual')?.textContent || '';
    let dias = 7, vista = 'linha', ordem = 'desc', coluna = 'data', aberto = null;
    const periodo = h('div', { class: 'v36h-segmento', role: 'group', 'aria-label': tr('Período') });
    const opcoesPeriodo = [[7, '7 dias'], [30, '30 dias'], [90, '90 dias'], [0, 'Todos']];
    const busca = h('input', { type: 'search', id: 'v36-hist-busca', placeholder: tr('Operação, ferramenta, estado ou código…'), autocomplete: 'off' });
    const de = h('input', { type: 'date', id: 'v36-hist-de' }), ate = h('input', { type: 'date', id: 'v36-hist-ate' });
    const opc = (sel, vazio, vals) => { sel.append(h('option', { value: '' }, tr(vazio)), ...vals.map((v) => h('option', { value: v }, v))); return sel; };
    const fFerr = opc(h('select', { id: 'v36-hist-ferramenta' }), 'Todas as ferramentas', [...new Set(r.activities.map((a) => a.tool))].sort());
    const fEst = opc(h('select', { id: 'v36-hist-resultado' }), 'Qualquer resultado', [...new Set(r.activities.map((a) => a.state))].sort());
    const fOri = opc(h('select', { id: 'v36-hist-origem' }), 'Todas as origens', [...new Set(r.activities.map((a) => a.origin))].sort());
    const fCli = opc(h('select', { id: 'v36-hist-cliente' }), 'Todos os clientes', [...new Set(r.activities.map((a) => a.client))].sort());
    const contagemFiltros = h('span', { class: 'v36-contagem' });
    const resumoFiltros = h('span', {});
    const filtros = h('div', { class: 'v36-filtros', id: 'v36-hist-filtros', hidden: true },
      h('label', {}, tr('Buscar atividade'), busca), h('label', {}, tr('De'), de), h('label', {}, tr('Até'), ate), h('label', {}, tr('Ferramenta'), fFerr),
      h('label', {}, tr('Resultado'), fEst), h('label', {}, tr('Origem'), fOri), h('label', {}, tr('Cliente (declarado)'), fCli), h('span'),
      h('div', { class: 'v36-filtros-acoes' }, resumoFiltros, h('button', { type: 'button', id: 'v36-hist-limpar', onclick: () => { [busca, de, ate, fFerr, fEst, fOri, fCli].forEach((c) => { c.value = ''; }); desenhar(); } }, tr('Limpar filtros'))));
    const botaoFiltros = h('button', { type: 'button', class: 'v36-btn-texto', 'aria-expanded': 'false', 'aria-controls': 'v36-hist-filtros' }, icone('filtro', 17), h('span', {}, tr('Filtros')), contagemFiltros);
    botaoFiltros.addEventListener('click', () => { filtros.hidden = !filtros.hidden; botaoFiltros.setAttribute('aria-expanded', String(!filtros.hidden)); if (!filtros.hidden) busca.focus(); });
    const exportar = h('button', { type: 'button', class: 'v36-btn-icone', 'aria-label': tr('Exportar registros'), title: tr('Exportar registros') }, icone('baixar', 17));
    exportar.addEventListener('click', async () => { const x = await chamar(() => api.exportarLogs(root)); if (x?.exported) avisar(tr('Logs exportados.')); });
    const imprimir = h('button', { type: 'button', class: 'v36-btn-icone', 'aria-label': tr('Imprimir ou salvar em PDF'), title: tr('Imprimir ou salvar em PDF'), onclick: () => window.print() }, icone('documento', 17));
    const abas2 = h('div', { class: 'v36h-abas', role: 'tablist', 'aria-label': tr('Visualização do histórico') });
    const contagem = h('span', { id: 'v36-hist-contagem' });
    const ordemSel = h('select', { id: 'v36-history-sort', 'aria-label': tr('Ordenar') }, h('option', { value: 'desc' }, tr('Mais recentes')), h('option', { value: 'asc' }, tr('Mais antigos')));
    const lista = h('div', { class: 'v36h-lista', id: 'v36-hist-eventos', role: 'region', 'aria-label': tr('Eventos do histórico') });
    el.append(h('div', { class: 'v36h-barra' }, periodo, botaoFiltros, h('div', { class: 'v36-direita' }, exportar, imprimir)), filtros,
      h('div', { class: 'v36h-troca' }, abas2, h('div', { class: 'v36h-info' }, contagem, h('label', { class: 'v36h-ordem' }, h('span', {}, tr('Ordenar')), ordemSel))),
      ...(r.complete ? [] : [h('div', { class: 'nota' }, tr('Histórico parcial: registros inválidos excluídos.'))]), lista,
      h('p', { class: 'v36h-nota' }, h('span', {}, r.notice), ' ', h('span', {}, tr('Até 1000 atividades por consulta. STARTED sem término não comprova processo ainda ativo.'))));
    function desenharPeriodo() { periodo.replaceChildren(...opcoesPeriodo.map(([d, t]) => h('button', { type: 'button', 'aria-pressed': String(dias === d), onclick: () => { dias = d; desenhar(); } }, tr(t)))); }
    function desenharAbas() { abas2.replaceChildren(...[['linha', 'Linha do tempo'], ['tabela', 'Tabela']].map(([v, t]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(vista === v), onclick: () => { vista = v; desenhar(); } }, tr(t)))); }
    const tituloDe = (a) => tr(ROTULO_FERRAMENTA[a.tool] || a.tool);
    function filtradas() {
      const q = busca.value.trim().toLowerCase(); const limite = dias ? Date.now() - dias * 86400000 : 0;
      const ativos = [busca.value, de.value, ate.value, fFerr.value, fEst.value, fOri.value, fCli.value].filter(Boolean).length;
      contagemFiltros.textContent = ativos ? String(ativos) : ''; resumoFiltros.textContent = tr('Os filtros se combinam e afetam a linha do tempo e a tabela.');
      return r.activities.filter((a) => { const t = Date.parse(a.at); return t >= limite && (!de.value || t >= Date.parse(de.value + 'T00:00:00')) && (!ate.value || t <= Date.parse(ate.value + 'T23:59:59.999'))
        && (!fFerr.value || a.tool === fFerr.value) && (!fEst.value || a.state === fEst.value) && (!fOri.value || a.origin === fOri.value) && (!fCli.value || a.client === fCli.value)
        && (!q || [a.operationId, a.tool, a.state, a.client, a.origin, a.summary?.code, tituloDe(a)].join(' ').toLowerCase().includes(q)); });
    }
    function corpoDe(a) {
      if (a.findingsText) return ignorar(a.findingsText);
      return h('span', {}, h('span', {}, tr('Resultado')), ' ', ignorar([a.state, a.summary?.code, ms(a.durationMs)].filter(Boolean).join(' · ')));
    }
    function tags(a) { return [h('span', { class: 'v36-tag v36-estado ' + classeEstado(a.state) }, a.state), h('span', { class: 'v36-tag', 'data-i18n-ignore': '' }, nomeProjeto), h('span', { class: 'v36-tag' }, a.tool), h('span', { class: 'v36-tag' }, a.origin + ' · ' + a.client)]; }
    function detalheInline(a) {
      const ev = a.summary?.evidenceJobId;
      const campos = [['Quando', new Date(a.at).toLocaleString(local())], ['Projeto', nomeProjeto], ['Origem · Cliente (declarado)', a.origin + ' · ' + a.client], ['Ferramenta', a.tool], ['Operação', a.operationId, true], ['Duração', ms(a.durationMs)], ['Código', a.summary?.code || '—', true], ['Evidência', ev || '—', true]];
      return h('div', { class: 'v36h-detalhe', id: 'v36-det-' + a.operationId, role: 'region', 'aria-label': tr('Detalhes da atividade') },
        h('div', { class: 'v36h-dcabeca' }, h('strong', {}, tituloDe(a)), h('span', { class: 'v36-pilula ' + classeEstado(a.state) }, a.state)),
        h('p', {}, corpoDe(a)),
        h('div', { class: 'v36h-dgrade' }, campos.map(([k, v, codigo]) => h('div', {}, h('small', {}, tr(k)), codigo ? h('code', {}, String(v)) : h('strong', { 'data-i18n-ignore': '' }, String(v))))),
        h('div', { class: 'v36h-dacoes' }, h('button', { type: 'button', onclick: () => detalhesAtividade(a) }, tr('Detalhes')), h('button', { type: 'button', onclick: () => copiar(a.operationId) }, tr('Copiar ID')),
          h('button', { type: 'button', onclick: () => { busca.value = a.operationId; filtros.hidden = false; botaoFiltros.setAttribute('aria-expanded', 'true'); desenhar(); } }, tr('Filtrar operação')),
          ev ? h('button', { type: 'button', onclick: () => { estado.jobId = ev; mostrar('evidencias'); } }, tr('Ver evidência')) : null));
    }
    function entrada(a) {
      const ab = aberto === a.operationId;
      const ev = h('button', { type: 'button', class: 'v36h-evento', 'aria-expanded': String(ab), 'aria-controls': 'v36-det-' + a.operationId, onclick: () => { aberto = ab ? null : a.operationId; desenhar(); } },
        h('span', { class: 'v36h-titulo' }, icone(ICONE_FERRAMENTA[a.tool] || 'agente', 16), h('span', {}, tituloDe(a)), h('span', { class: 'v36h-seta', 'aria-hidden': 'true' }, ab ? '⌃' : '⌄')),
        h('div', { class: 'v36h-corpo' }, corpoDe(a)), h('div', { class: 'v36h-tags' }, tags(a)));
      return h('div', { class: 'v36h-entrada', 'data-operation': a.operationId }, h('div', { class: 'v36h-hora' }, hm(a.at)), h('div', { class: 'v36h-fio' }, h('span', { class: 'v36h-ponto ' + classeEstado(a.state) })), h('div', { class: 'v36h-quadro' }, ev, ab ? detalheInline(a) : null));
    }
    const COLUNAS = [['data', 'Data', (a) => a.at], ['atividade', 'Atividade', tituloDe], ['ferramenta', 'Ferramenta', (a) => a.tool], ['resultado', 'Resultado', (a) => a.state], ['origem', 'Origem', (a) => a.origin], ['cliente', 'Cliente', (a) => a.client], ['duracao', 'Duração', (a) => a.durationMs], ['operacao', 'Operação', (a) => a.operationId]];
    function tabela(itens) {
      const val = COLUNAS.find((c) => c[0] === coluna)[2]; const ord = [...itens].sort((x, y) => { const p = val(x), q = val(y); const c = typeof p === 'number' ? p - q : String(p).localeCompare(String(q)); return ordem === 'desc' ? -c : c; });
      return h('div', { class: 'v36h-tabela-caixa' }, h('table', { class: 'v36h-tabela', id: 'v36-history-table' },
        h('thead', {}, h('tr', {}, COLUNAS.map(([id, t]) => h('th', { 'aria-sort': coluna === id ? (ordem === 'desc' ? 'descending' : 'ascending') : 'none' }, h('button', { type: 'button', class: 'v36h-ord' + (coluna === id ? ' ativo' : ''), onclick: () => { if (coluna === id) ordem = ordem === 'desc' ? 'asc' : 'desc'; else { coluna = id; ordem = 'desc'; } ordemSel.value = ordem; desenhar(); } }, h('span', {}, tr(t)), h('span', { class: 'v36h-seta-ord', 'aria-hidden': 'true' }, coluna === id ? (ordem === 'desc' ? '↓' : '↑') : '↕')))))),
        h('tbody', {}, ord.map((a) => h('tr', { 'data-operation': a.operationId, tabindex: '0', onclick: () => detalhesAtividade(a), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); detalhesAtividade(a); } } },
          h('td', {}, new Date(a.at).toLocaleDateString(local(), { day: '2-digit', month: '2-digit' }), h('small', {}, hm(a.at))), h('td', { class: 'v36h-ttitulo' }, tituloDe(a), h('small', {}, a.tool)), h('td', {}, a.tool),
          h('td', {}, h('span', { class: 'v36-pilula ' + classeEstado(a.state) }, a.state)), h('td', {}, a.origin), h('td', {}, a.client), h('td', { 'data-i18n-ignore': '' }, ms(a.durationMs)), h('td', {}, h('code', {}, a.operationId.slice(0, 8))))))));
    }
    function desenhar() {
      desenharPeriodo(); desenharAbas(); const itens = filtradas();
      contagem.textContent = tr('{n} eventos', { n: itens.length });
      if (!itens.length) { lista.replaceChildren(h('div', { class: 'v36h-vazio' }, r.activities.length ? h('span', {}, tr('Nenhuma atividade para este período e filtros.')) : h('span', {}, tr('Nenhuma atividade registrada ainda.')), r.activities.length && dias ? h('button', { type: 'button', onclick: () => { dias = 0; desenhar(); } }, tr('Ver todo o período')) : null)); return; }
      if (vista === 'tabela') { lista.replaceChildren(tabela(itens)); return; }
      const ord = [...itens].sort((x, y) => (ordem === 'desc' ? y.at.localeCompare(x.at) : x.at.localeCompare(y.at)));
      const grupos = new Map(); for (const a of ord) { const k = diaIso(a.at); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(a); }
      lista.replaceChildren(...[...grupos].map(([, as]) => h('section', { class: 'v36h-grupo' },
        h('div', { class: 'v36h-dia' }, ignorar(new Date(as[0].at).toLocaleDateString(local(), { day: 'numeric', month: 'long', year: 'numeric' })), h('span', { class: 'v36h-regua' }), h('small', {}, tr('{n} evento(s)', { n: as.length }))),
        as.map(entrada))));
    }
    [busca].forEach((c) => c.addEventListener('input', desenhar)); [de, ate, fFerr, fEst, fOri, fCli].forEach((c) => c.addEventListener('change', desenhar));
    ordemSel.addEventListener('change', () => { ordem = ordemSel.value; coluna = 'data'; desenhar(); });
    desenhar();
  };

  // ---------------- Gráficos (SVG desenhado a partir dos dados locais) ----------------
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
    const fTipo = h('select', { id: 'v36-met-tipo' }, h('option', { value: '' }, tr('Todas as rotinas')), [...new Set(registros.map((r) => r.tipo))].sort().map((t) => h('option', { value: t }, t)));
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
    el.append(h('div', { class: 'v36m-barra' }, periodo, h('div', { class: 'v36m-periodo-caixa' }, botaoCal, calendario), h('span', { class: 'v36m-divisor', 'aria-hidden': 'true' }), botaoFiltros,
      h('div', { class: 'v36-direita' }, botaoEditor, botaoExportar, imprimir, menu)), filtros, editor,
      ...(m.complete ? [] : [h('div', { class: 'v36m-aviso' }, tr('Histórico parcial: registros inválidos ou truncados foram excluídos; os números são parciais.'))]),
      grade,
      h('div', { class: 'grade v36m-resumo' }, h('span', { class: 'v36m-resumo-titulo' }, tr('Totais do núcleo · todo o período')), totais.map(([n, t]) => h('div', {}, h('b', {}, String(n ?? 0)), h('span', {}, tr(t))))),
      h('p', { class: 'v36m-nota' }, h('span', {}, tr('Os gráficos refletem os filtros selecionados. Uma consulta (INFO) não conta como teste PASS.')), ' ',
        h('span', {}, tr('Última atividade:')), ' ', ignorar(hora(m.lastActivity)), ' · ', h('span', {}, tr('Tokens e custos:')), ' ', ignorar(String(m.providerMetrics)), ' · ', h('span', {}, tr('Última chamada MCP de:')), ' ', ignorar(v.lastMcpClient || '—')));
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
        h('button', { type: 'button', role: 'menuitem', onclick: () => { menu.hidden = true; download('prumo-metricas-observadas.json', JSON.stringify({ fonte: 'registros-locais', periodo: intervalo || { dias }, complete: m.complete, registros: lista }, null, 2)); } }, tr('Exportar JSON')),
        h('button', { type: 'button', role: 'menuitem', onclick: () => { menu.hidden = true; const cel = (x) => '"' + String(x ?? '').replaceAll('"', '""').replace(/^[\t\r\n ]*[=+@-]/, "'$&") + '"'; download('prumo-metricas-observadas.csv', ['Horário,Tipo,Resultado,Fonte,Ambiente,Execução,Ticket,Duração (ms)', ...lista.map((r) => [r.at, r.tipo, r.status, r.fonte, r.ambiente, r.origem, r.ticket, r.duracao].map(cel).join(','))].join('\r\n'), 'text/csv;charset=utf-8'); } }, tr('Exportar CSV')));
    }
    [busca, fTicket].forEach((c) => c.addEventListener('input', desenhar)); [fFonte, fRes, fTipo, fAmb, fOri].forEach((c) => c.addEventListener('change', desenhar));
    desenhar();
  };

  // Detalhes de atividade usados pelo painel de atividades dos Agentes.
  const activityDetails = detalhesAtividade;

  // ---------------- Agentes: especializações fixas do núcleo; cadastros personalizados = prévias locais ----------------
  function readDrafts(id) { try { const a = JSON.parse(localStorage.getItem('prumo-v36-drafts-' + id) || '[]'); if (!Array.isArray(a) || a.length > 50) throw Error('Lista inválida'); return a.map(validateDraft); } catch { avisar('Prévias locais inválidas: não puderam ser carregadas.', true); return []; } }
  function validateDraft(a) {
    if (!a || typeof a !== 'object' || Array.isArray(a) || Object.keys(a).some(k => !['version', 'id', 'nome', 'descricao', 'objetivo', 'instrucoes'].includes(k)) || a.version !== 1 || typeof a.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(a.id)) throw Error('Formato de prévia inválido.');
    for (const k of ['nome', 'descricao', 'objetivo', 'instrucoes']) if (typeof a[k] !== 'string' || a[k].length > (k === 'nome' ? 100 : 4000)) throw Error('Campo inválido: ' + k);
    if (!a.nome.trim() || !a.objetivo.trim() || !a.instrucoes.trim()) throw Error('Nome, objetivo e instruções são obrigatórios.');
    return { version: 1, id: a.id, nome: a.nome.trim(), descricao: a.descricao, objetivo: a.objetivo.trim(), instrucoes: a.instrucoes.trim() };
  }
  const iconeCerebro = () => sv('svg', { class: 'v36-icone', viewBox: '0 0 24 24', width: 26, height: 26, 'aria-hidden': 'true' }, sv('path', { d: 'M12 18V5a3 3 0 0 0-5.7-1.3A4.5 4.5 0 0 0 4 10.5 4.4 4.4 0 0 0 5 17.5 3.5 3.5 0 0 0 12 18Z' }), sv('path', { d: 'M12 18V5a3 3 0 0 1 5.7-1.3A4.5 4.5 0 0 1 20 10.5a4.4 4.4 0 0 1-1 7A3.5 3.5 0 0 1 12 18Z' }), sv('path', { d: 'M8 9a3 3 0 0 1-3 3m3 2a3 3 0 0 0 3 3m5-8a3 3 0 0 0 3 3m-3 2a3 3 0 0 1-3 3' }));
  const iconeBusca = () => sv('svg', { class: 'v36-icone', viewBox: '0 0 24 24', width: 16, height: 16, 'aria-hidden': 'true' }, sv('circle', { cx: 10.5, cy: 10.5, r: 6.5 }), sv('path', { d: 'm15.5 15.5 4.5 4.5' }));
  function iconeCliente(cliente) {
    const caixa = h('span', { class: 'v36a-cliente-icone ' + cliente });
    const marca = cliente === 'claude'
      ? sv('svg', { viewBox: '0 0 64 64', 'aria-hidden': 'true' }, ...Array.from({ length: 12 }, (_, i) => sv('path', { d: 'M32 32 L' + (32 + Math.cos(i * Math.PI / 6) * (i % 2 ? 19 : 26)).toFixed(1) + ' ' + (32 + Math.sin(i * Math.PI / 6) * (i % 2 ? 19 : 26)).toFixed(1), stroke: '#d97757', 'stroke-width': 6.5, 'stroke-linecap': 'round' })))
      : sv('svg', { viewBox: '0 0 64 64', 'aria-hidden': 'true' }, ...Array.from({ length: 6 }, (_, i) => sv('rect', { x: 26, y: 9, width: 12, height: 30, rx: 6, fill: 'none', stroke: '#f2f5fb', 'stroke-width': 3.4, transform: 'rotate(' + i * 60 + ' 32 32)' })));
    caixa.append(marca); return caixa;
  }
  const CORES_NEURONIO = ['#6ea8ff', '#5bd9bd', '#bea1f8', '#f2c977', '#ff9fb8', '#7ad7ff', '#a7de82', '#ffba90'];
  // Céu profundo da tela Agentes: nebulosas lentas, estrelas em três profundidades e meteoros raros. Decorativo.
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
  abas.agentes = async el => {
    el.classList.add('v36a'); espaco(el); el.append(h('h1', { class: 'v36-sr' }, 'Agentes'));
    const e = estado.espaco; if (!e) { el.append(h('div', { class: 'v36a-sem' }, note(tr('Selecione um projeto para consultar as especializações e configurar permissões.')))); const legacy = h('div'); await agentesLegado(legacy); legacy.querySelector('h1')?.remove(); el.append(legacy); return; }
    const s = await chamar(() => api.agentesEstado(e.id)); if (!s) return;
    let drafts = readDrafts(e.id); let activeTab = 'agents', painelVivo = null;
    const body = h('div', { id: 'v36-agents-body', class: 'v36a-corpo' });
    const tabs = h('div', { class: 'v36a-abas', role: 'group', 'aria-label': tr('Áreas de agentes') },
      h('button', { type: 'button', class: 'v36a-aba', 'data-agent-tab': 'agents', 'aria-pressed': 'true', onclick: () => showTab('agents') }, tr('Agentes')),
      h('button', { type: 'button', class: 'v36a-aba', 'data-agent-tab': 'activity', 'aria-pressed': 'false', onclick: () => showTab('activity') }, tr('Painel de atividades')));
    el.append(tabs, body);
    const habilitada = (id) => s.configuracao.especializacoes.includes(id);
    const capsDe = (x) => s.matriz.filter(c => x.capacidades?.includes(c.id));
    function saveDrafts(next) { try { localStorage.setItem('prumo-v36-drafts-' + e.id, JSON.stringify(next)); drafts = next; return true; } catch { avisar('Não foi possível persistir a prévia local.', true); return false; } }
    function showTab(tab) { activeTab = tab; if (tab !== 'activity') painelVivo?.parar(); tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.agentTab === tab))); if (tab === 'agents') list(); else activity(); }
    function resumoCaps(x) { const c = capsDe(x); const auth = c.filter(k => k.estado === 'EXIGE_AUTORIZACAO').length, bloq = c.filter(k => k.estado === 'BLOQUEADO').length;
      return [h('strong', {}, tr('{n} capacidades', { n: c.length })), auth ? h('small', {}, tr('{n} exige autorização', { n: auth })) : null, bloq ? h('small', { class: 'v36a-bloq' }, tr('{n} bloqueada(s)', { n: bloq })) : null]; }
    function list() {
      const search = h('input', { type: 'search', 'aria-label': tr('Buscar agente'), placeholder: tr('Localizar agente'), oninput: render, autocomplete: 'off' });
      const lista = h('div', { class: 'v36a-constelacao', id: 'v36-agent-list', role: 'list' }); const conta = h('span', { class: 'v36a-conta' });
      const novo = h('button', { type: 'button', class: 'v36a-primario', id: 'v36-agent-new', onclick: () => detail({ version: 1, id: 'previa-' + crypto.randomUUID(), nome: '', descricao: '', objetivo: '', instrucoes: '', preview: true, index: drafts.length + 8 }, true) }, '+ ', tr('Nova prévia'));
      const orbe = h('span', { class: 'v36a-orbe' }, h('img', { src: asset('robo-original.png'), alt: '' })); PrumoOrbitas.anexar(orbe);
      const orq = h('button', { type: 'button', class: 'v36a-astro v36a-astro-orq', role: 'listitem', 'aria-label': tr('Conversar com o Prumo Orchestrator'), onclick: () => flutuante?.abrir() },
        h('span', { class: 'v36a-astro-figura' }, orbe),
        h('span', { class: 'v36a-astro-nome' }, 'Prumo Orchestrator'), h('span', { class: 'v36a-astro-sub' }, tr('Assistente local no Prumo')),
        h('span', { class: 'v36a-astro-estado' }, h('i', { class: 'ok' }), h('span', {}, tr('Sem modelo de IA'))));
      const clientesEl = []; let clientes = [];
      if (estado.root) chamar(() => api.conexoes(estado.root)).then((r) => { if (!r || !lista.isConnected) return; clientes = r; render(); });
      function astroCliente(c) {
        const nome = c.client === 'claude' ? 'Claude Code' : c.client === 'codex' ? 'Codex' : c.client;
        const usado = c.lastObserved ? tr('Última chamada: {quando}', { quando: hora(c.lastObserved.at) }) : tr('Nenhuma chamada observada');
        return h('button', { type: 'button', class: 'v36a-astro v36a-astro-cliente', role: 'listitem', 'data-cliente': c.client, 'aria-label': tr('Cliente MCP {nome}', { nome }), onclick: () => { const d = document.getElementById('v36-clients'); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } },
          h('span', { class: 'v36a-astro-figura' }, iconeCliente(c.client)), h('span', { class: 'v36a-astro-nome' }, nome), h('span', { class: 'v36a-astro-sub' }, tr('Cliente conectado por MCP')),
          h('span', { class: 'v36a-astro-estado' }, h('i', { class: c.state === 'UTILIZADO' || c.state === 'VALIDADO' ? 'ok' : c.state === 'ERRO' ? 'erro' : 'off' }), h('span', {}, selo(c.state))), h('span', { class: 'v36a-astro-sub' }, usado));
      }
      function render() {
        const q = search.value.trim().toLowerCase();
        const items = [...s.especializacoes.map((x, i) => ({ ...x, nome: x.rotulo, index: i })), ...drafts.map((x, i) => ({ ...x, index: i + 8, preview: true }))].filter(x => (x.nome + ' ' + (x.skill || '')).toLowerCase().includes(q));
        conta.textContent = String(items.length);
        lista.replaceChildren(...(!q || 'prumo orchestrator'.includes(q) ? [orq] : []), ...clientes.filter(c => !q || c.client.includes(q)).map(astroCliente), ...items.map((x, k) => {
          const ligado = x.preview ? null : habilitada(x.id); const caps = x.preview ? [] : capsDe(x);
          const astro = h('button', { type: 'button', class: 'v36a-astro', role: 'listitem', 'data-agent': x.id, title: tr('Configurar agente'), onclick: () => detail(x) });
          astro.style.setProperty('--face-color', palette[x.index % 8]); astro.style.setProperty('--atraso', (-k * 1.3) + 's');
          astro.append(figuraRobo(h('span', { class: 'v36a-astro-figura' }), x, 'lista', astro),
            h('span', { class: 'v36a-astro-nome', 'data-i18n-ignore': '' }, x.nome), h('span', { class: 'v36a-astro-sub' }, x.preview ? tr('Prévia local · sem execução') : x.skill),
            h('span', { class: 'v36a-astro-estado' }, h('i', { class: x.preview ? '' : ligado ? 'ok' : 'off' }), h('span', {}, x.preview ? tr('Somente neste computador') : ligado ? tr('Habilitada no projeto') : tr('Desabilitada no projeto')),
              x.preview ? null : h('span', { class: 'v36a-astro-caps' }, ' · ', tr('{n} capacidades', { n: caps.length }))));
          return astro; }));
        if (!lista.children.length) lista.append(h('div', { class: 'v36a-vazio' }, tr('Nenhum agente para esta busca.')));
      }
      const clientContent = h('div', { id: 'v36-client-panel' }); let loaded = false;
      const clients = h('details', { class: 'v36a-secao-extra', id: 'v36-clients', ontoggle: async ev => { if (!ev.currentTarget.open || loaded) return; loaded = true; await agentesLegado(clientContent); clientContent.querySelector('h1')?.remove(); } }, h('summary', {}, tr('Clientes MCP · diagnóstico e configuração')), clientContent);
      body.replaceChildren(
        h('div', { class: 'v36a-topo' }, h('div', {}, h('h2', { class: 'v36a-titulo' }, tr('Agentes'), ' ', conta), h('p', {}, tr('Especializações do núcleo e prévias locais deste projeto.'))),
          h('div', { class: 'v36a-acoes' }, h('label', { class: 'v36a-busca' }, iconeBusca(), search), novo)),
        lista, h('p', { class: 'v36a-nota' }, tr('Especializações reais do núcleo. Habilitação não comprova sessão nem execução ativa. Retratos com movimento visual, sem articulação facial 3D.')),
        legacyPolicies(), clients);
      render();
    }
    // Matriz completa do projeto (mesmos seletores da tela 2.9), com confirmação nativa para salvar.
    function legacyPolicies() {
      const esp = new Set(s.configuracao.especializacoes), pol = { ...s.configuracao.politicas };
      const save = h('button', { type: 'button', class: 'v36a-primario', id: 'ag-salvar', disabled: true, onclick: async () => { save.disabled = true; const r = await chamar(() => api.agentesSalvar(e.id, [...esp], pol)); if (r && !r.canceled) { avisar('Permissões salvas.'); mostrar('agentes'); } else dirty(); } }, tr('Salvar permissões…'));
      function dirty() { save.disabled = JSON.stringify([...esp].sort()) === JSON.stringify([...s.configuracao.especializacoes].sort()) && JSON.stringify(pol) === JSON.stringify(s.configuracao.politicas); }
      return h('details', { class: 'v36a-secao-extra', open: true }, h('summary', {}, tr('Políticas do projeto · confirmação nativa para salvar')),
        h('div', { id: 'ag-especializacoes', class: 'v36a-esps' }, s.especializacoes.map(x => h('label', { class: 'v36a-check' }, h('input', { type: 'checkbox', 'data-esp': x.id, checked: esp.has(x.id), onchange: ev => { ev.target.checked ? esp.add(x.id) : esp.delete(x.id); dirty(); } }), h('span', {}, x.rotulo)))),
        policyTable(pol, dirty), h('div', { class: 'v36a-salvar' }, save));
    }
    function policyTable(pol, change, caps) {
      return h('div', { class: 'v36a-matriz', id: 'ag-matriz', role: 'table', 'aria-label': tr('Permissões') },
        s.matriz.filter(c => !caps || caps.includes(c.id)).map(c => h('div', { class: 'v36a-cap', role: 'row', 'data-cap': c.id },
          h('div', { class: 'v36a-cap-info', role: 'cell' }, h('strong', {}, c.rotulo), h('small', {}, c.motivo)),
          h('div', { role: 'cell' }, selo(c.estado)),
          h('div', { role: 'cell' }, c.editavel.length ? h('select', { 'data-pol': c.id, 'aria-label': c.rotulo, onchange: ev => { pol[c.id] = ev.target.value; change(); } }, c.editavel.map(v => h('option', { value: v, selected: (pol[c.id] ?? c.editavel[0]) === v }, v))) : h('span', { class: 'v36a-pessoa' }, tr('Somente pessoa'))))));
    }
    const secao = (titulo, texto, ...campos) => h('section', { class: 'v36a-form-secao' }, h('div', { class: 'v36a-form-rotulo' }, h('h3', {}, tr(titulo)), h('p', {}, tr(texto))), h('div', { class: 'v36a-campos' }, ...campos));
    function detail(x, isNew = false) {
      const pol = { ...s.configuracao.politicas }, esp = new Set(s.configuracao.especializacoes);
      const name = h('input', { id: 'v36-agent-name', value: x.nome, maxlength: 100, required: true, readonly: !x.preview, placeholder: tr('Ex.: Agente de regressão') });
      const desc = h('textarea', { id: 'v36-agent-description', rows: 3, maxlength: 4000, placeholder: tr('Quando o Prumo deve sugerir este agente') }, x.descricao || '');
      const goal = h('textarea', { id: 'v36-agent-goal', rows: 3, maxlength: 4000, required: true, placeholder: tr('Ex.: revisar a cobertura de um ticket autorizado') }, x.objetivo || '');
      const instructions = h('textarea', { id: 'v36-agent-instructions', rows: 6, maxlength: 4000, required: true, placeholder: tr('Responsabilidades, regras de decisão, restrições e formato esperado') }, x.instrucoes || '');
      const enabled = h('input', { type: 'checkbox', id: 'v36-agent-enabled', checked: esp.has(x.id), onchange: ev => { ev.target.checked ? esp.add(x.id) : esp.delete(x.id); sync(); } });
      const form = h('form', { class: 'v36-agent-form v36a-form', id: 'v36-agent-form' });
      const cancel = h('button', { type: 'button', id: 'v36-agent-cancel', 'aria-label': tr('Descartar alterações'), title: tr('Descartar alterações'), disabled: true, onclick: () => reset() }, '×');
      const save = h('button', { type: 'submit', id: 'v36-agent-save', 'aria-label': tr('Confirmar alterações'), title: tr('Confirmar alterações'), disabled: true }, '✓');
      const read = () => ({ version: 1, id: x.id, nome: name.value, descricao: desc.value, objetivo: goal.value, instrucoes: instructions.value });
      const baseline = JSON.stringify(read());
      function changed() { return x.preview ? JSON.stringify(read()) !== baseline : JSON.stringify(pol) !== JSON.stringify(s.configuracao.politicas) || esp.has(x.id) !== habilitada(x.id); }
      function sync() { cancel.disabled = save.disabled = !changed(); rodape.classList.toggle('alterado', changed()); }
      function reset() { if (x.preview) { name.value = x.nome; desc.value = x.descricao || ''; goal.value = x.objetivo || ''; instructions.value = x.instrucoes || ''; } else { detail(x); return; } sync(); }
      form.addEventListener('input', sync);
      form.addEventListener('submit', async ev => { ev.preventDefault(); if (!changed()) return;
        if (x.preview) { let data; try { data = validateDraft(read()); } catch (err) { avisar(err.message, true); return; }
          const d = h('dialog', { class: 'v36-dialog v36a-confirmar', 'aria-label': tr('Confirmar salvamento da prévia') }, h('div', { class: 'v36a-olho' }, tr('CONFIRMAR ALTERAÇÕES')), h('h2', {}, tr('Salvar prévia local?')), note(data.nome + ' · ' + previewNotice), h('div', { class: 'v36a-confirmar-acoes' }, button(tr('Cancelar'), () => d.close()), button(tr('Salvar prévia'), () => { const next = [...drafts.filter(a => a.id !== x.id), data]; if (next.length > 50) { avisar('Limite de 50 prévias por projeto.', true); return; } if (saveDrafts(next)) { const antes = linhasInstrucao(x.instrucoes); registrarMudanca(x.id, [...(data.nome !== x.nome || data.descricao !== (x.descricao || '') ? ['Identidade'] : []), ...(data.objetivo !== (x.objetivo || '') ? ['Objetivo'] : []), ...linhasInstrucao(data.instrucoes).map((l, i) => antes.includes(l) ? null : tr('Instrução {n}', { n: i + 1 })).filter(Boolean)]); d.close(); list(); } }, { class: 'acao primaria' }))); document.body.append(d); d.addEventListener('close', () => d.remove(), { once: true }); d.showModal();
        } else { save.disabled = cancel.disabled = true; const r = await chamar(() => api.agentesSalvar(e.id, [...esp], pol)); if (r && !r.canceled) { registrarMudanca(x.id, [...(esp.has(x.id) !== habilitada(x.id) ? ['Disponibilidade'] : []), ...s.matriz.filter(c => x.capacidades.includes(c.id) && (pol[c.id] ?? null) !== (s.configuracao.politicas[c.id] ?? null)).map(c => c.rotulo)]); avisar('Permissões salvas.'); mostrar('agentes'); } else sync(); }
      });
      const exportar = h('button', { type: 'button', class: 'v36a-quieto', onclick: () => { try { download('prumo-agente-' + x.id + '.json', JSON.stringify(x.preview ? validateDraft(read()) : { fonte: 'nucleo', especializacao: { id: x.id, rotulo: x.rotulo, skill: x.skill, capacidades: x.capacidades }, configuracao: s.configuracao }, null, 2)); } catch (err) { avisar('Exportação recusada: ' + err.message, true); } } }, tr('Exportar JSON'));
      const barra = h('div', { class: 'v36a-barra' }, h('button', { type: 'button', class: 'v36a-voltar', onclick: list }, '← ', tr('Agentes')), h('span', { class: 'v36a-fonte' }, x.preview ? tr('Prévia local · sem execução') : tr('Especialização do núcleo · políticas compartilhadas pelo projeto')), h('div', { class: 'v36a-barra-acoes' }));
      if (x.preview) { const file = h('input', { type: 'file', accept: '.json,application/json', id: 'v36-agent-import', class: 'v36-sr', onchange: async ev => { const f = ev.target.files[0]; if (!f) return; try { if (f.size > 32768) throw Error('Arquivo excede 32 KiB.'); const d = validateDraft(JSON.parse(await f.text())); name.value = d.nome; desc.value = d.descricao; goal.value = d.objetivo; instructions.value = d.instrucoes; sync(); avisar('Prévia importada. Revise e confirme antes de salvar.'); } catch (err) { avisar('Importação recusada: ' + err.message, true); } ev.target.value = ''; } });
        barra.lastChild.append(h('label', { class: 'v36a-quieto', title: tr('A importação só preenche o formulário; revise antes de salvar.') }, '↥ ', h('span', {}, tr('Importar prévia JSON')), file)); }
      barra.lastChild.append(exportar);
      const retrato = h('div', { class: 'v36a-retrato-robo' });
      const perfil = h('aside', { class: 'v36a-perfil' }, h('div', { class: 'v36a-perfil-retrato' }, retrato),
        h('div', { class: 'v36a-perfil-info' }, h('span', { class: 'v36a-olho' }, x.preview ? tr('PRÉVIA LOCAL') : tr('ESPECIALIZAÇÃO DO NÚCLEO')), h('h2', { 'data-i18n-ignore': '' }, x.nome || tr('Novo agente')),
          h('p', {}, x.preview ? tr('Prévia local · sem execução') : h('span', {}, x.skill, ' · ', ...resumoCaps(x).filter(Boolean).slice(0, 1))),
          h('button', { type: 'button', class: 'v36a-cerebro-btn', id: 'v36-brain-open', 'aria-label': tr('Abrir cérebro do agente'), title: tr('Explorar as conexões configuradas deste agente'), onclick: () => brain(x) }, iconeCerebro())));
      perfil.style.setProperty('--face-color', palette[x.index % 8]); neural(perfil, { pontos: 46, escuro: true });
      form.append(h('div', { class: 'v36a-form-topo' }, h('span', {}, isNew ? tr('Criar prévia de agente') : tr('Configuração do agente')), h('span', {}, tr('* Obrigatório'))));
      if (x.preview) form.append(note(previewNotice),
        secao('Identidade', 'Como o agente aparece na lista e como é identificado.', field(tr('Nome *'), name), field(tr('Descrição'), desc)),
        secao('Objetivo e instruções', 'O que fazer, como agir e o que caracteriza um resultado válido.', field(tr('Objetivo *'), goal), field(tr('Instruções *'), instructions)));
      else form.append(
        secao('Identidade', 'Especialização fixa do núcleo; nome e skill não são editáveis.', field(tr('Nome *'), name), field(tr('Skill configurada'), h('input', { value: x.skill, readonly: true }))),
        secao('Disponibilidade', 'Habilitar não inicia sessão nem execução; o cliente de IA decide quando usar.', h('label', { class: 'v36a-interruptor' }, enabled, h('span', { class: 'v36a-trilho', 'aria-hidden': 'true' }), h('span', {}, tr('Especialização habilitada')))),
        secao('Permissões', 'As políticas são compartilhadas pelo projeto e aplicadas pelo servidor MCP.', policyTable(pol, sync, x.capacidades)));
      const rodape = h('div', { class: 'v36-form-actions v36a-commit' }, cancel, save); form.append(rodape);
      body.replaceChildren(barra, h('div', { class: 'v36a-detalhe' }, perfil, form)); figuraRobo(retrato, x, 'perfil', perfil);
    }
    // O que mudou em cada agente desde o último salvamento (só neste computador), para destacar no Cérebro.
    const chaveMudancas = 'prumo-v36-mudancas-' + e.id;
    const lerMudancas = () => { try { const m = JSON.parse(localStorage.getItem(chaveMudancas) || '{}'); return m && typeof m === 'object' && !Array.isArray(m) ? m : {}; } catch { return {}; } };
    function registrarMudanca(id, chaves) { if (!chaves.length) return; try { const m = lerMudancas(); m[id] = { em: new Date().toISOString(), chaves: chaves.slice(0, 60) }; localStorage.setItem(chaveMudancas, JSON.stringify(m)); } catch { /* armazenamento indisponível */ } }
    const linhasInstrucao = (texto) => String(texto || '').split(/\n+|(?<=[.;!?])\s+/).map(l => l.trim()).filter(Boolean).slice(0, 24);
    function figuraRobo(host, x, modo, area) { if (!PrumoRobos.criar(host, x.index, modo, area)) host.append(portrait(x.index, modo !== 'lista')); return host; }
    const bolinha = (cor) => { const i = h('i'); i.style.background = cor; return i; };
    async function brain(x) {
      const caps = capsDe(x); const mudou = lerMudancas()[x.id];
      const GRUPOS = { base: ['Identidade', '#7cb6ff'], cap: ['Capacidade', '#52e0c4'], ctx: ['Contexto do projeto', '#b38cff'], inst: ['Instrução', '#7ad7ff'], conv: ['Atendimento', '#ff9f6b'], saber: ['Conhecimento', '#52e0c4'] };
      const neuronios = x.preview
        ? [{ t: 'Identidade', r: x.nome, v: { nome: x.nome, descricao: x.descricao }, g: 'base' }, { t: 'Objetivo', r: x.objetivo, v: x.objetivo, g: 'base' }, ...linhasInstrucao(x.instrucoes).map((l, i) => ({ t: tr('Instrução {n}', { n: i + 1 }), r: l, v: l, g: 'inst' })), { t: 'Estado', r: tr('Prévia local · sem execução'), v: previewNotice, g: 'base' }]
        : [{ t: 'Identidade', r: x.rotulo, v: { id: x.id, rotulo: x.rotulo }, g: 'base' }, { t: 'Skill', r: x.skill, v: x.skill, g: 'base' }, { t: 'Disponibilidade', r: habilitada(x.id) ? tr('Habilitada no projeto') : tr('Desabilitada no projeto'), v: { habilitada: habilitada(x.id) }, g: 'base' }, ...caps.map(c => ({ t: c.rotulo, r: c.estado, v: c, g: 'cap' }))];
      // Contextos aprovados que a especialização pode ler (capacidade de contexto permitida no projeto).
      const ctxCap = caps.find(c => c.id === 'consultar_contexto');
      if (!x.preview && ctxCap && ctxCap.estado === 'PERMITIDO' && estado.root) {
        const r = await chamar(() => api.contextosListar(estado.root, {})); if (estado.aba !== 'agentes') return;
        for (const c of (r?.contextos || []).filter(c => c.estado === 'APROVADO').slice(0, 40)) neuronios.push({ t: c.titulo, r: c.tipo, v: { id: c.id, titulo: c.titulo, tipo: c.tipo, estado: c.estado }, g: 'ctx' });
      }
      if (!x.preview) {
        const conhecimentos = await chamar(() => api.conhecimentoListar(e.id, { agente: x.id })); if (estado.aba !== 'agentes') return;
        for (const c of conhecimentos || []) neuronios.push({ t: c.titulo, r: c.estado + ' · ' + c.origem, v: c, g: 'saber' });
      }
      // Atendimentos recentes têm metadados; conversas antigas podem conter texto.
      if (!x.preview) { const conv = await chamar(() => api.conversasListar(e.id, x.id)); if (estado.aba !== 'agentes') return;
        for (const c of (conv || []).slice(0, 18)) neuronios.push({ t: c.semTexto ? 'Atendimento · ' + (c.avaliacao || 'Sem avaliação') : '“' + c.pergunta.slice(0, 38) + (c.pergunta.length > 38 ? '…”' : '”'), r: (c.modo === 'LOCAL' ? tr('local') : c.modo) + ' · ' + hora(c.em), v: { pergunta: c.pergunta, resposta: c.linhas, fontes: c.fontes.map((f) => f.rotulo), modo: c.modo, estilo: c.estilo, em: c.em }, g: 'conv' }); }
      const inspect = h('section', { class: 'v36-brain-inspect', 'aria-live': 'polite' }, note(tr('Cada ponto é um conhecimento configurado deste agente. Selecione um para consultar. Isso não representa memória aprendida automaticamente.')));
      const campo = h('div', { class: 'v36a-campo-neural' });
      const face = h('div', { class: 'v36-brain-face' }); const stage = h('div', { class: 'v36-stage v36-brain v36a-cerebro' });
      const n = neuronios.length, anel2 = n > 16;
      neuronios.forEach((nr, i) => {
        const externo = !anel2 || i % 2 === 0, k = anel2 ? Math.floor(i / 2) : i, total = anel2 ? Math.ceil(n / (externo ? 2 : 2)) : n;
        const a = -Math.PI / 2 + (k + (externo ? 0 : .5)) / Math.max(1, total) * Math.PI * 2, rx = externo ? 40 : 29, ry = externo ? 41 : 30;
        const lado = Math.cos(a) < 0 ? 'esq' : 'dir', cor = GRUPOS[nr.g][1], alterado = mudou?.chaves?.includes(nr.t);
        const b = h('button', { type: 'button', class: 'v36-neuron ' + lado + (alterado ? ' mudou' : ''), 'data-neuron': nr.t, 'data-cor': alterado ? '#ffc65a' : cor, 'aria-pressed': 'false', 'aria-label': nr.t + ': ' + String(nr.r || '') },
          h('span', { class: 'v36-neuron-ponto', 'aria-hidden': 'true' }), h('span', { class: 'v36-neuron-rotulo' }, h('strong', {}, nr.t), h('small', { 'data-i18n-ignore': '' }, String(nr.r || '—'))));
        b.style.left = (50 + Math.cos(a) * rx) + '%'; b.style.top = (50 + Math.sin(a) * ry) + '%'; b.style.setProperty('--cor', alterado ? '#ffc65a' : cor); b.style.setProperty('--atraso', (-i * .37) + 's');
        b.addEventListener('click', () => { campo.querySelectorAll('.v36-neuron').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
          inspect.replaceChildren(h('div', { class: 'v36a-insp-grupo' }, bolinha(cor), tr(GRUPOS[nr.g][0]), alterado ? h('span', { class: 'v36a-insp-mudou' }, tr('Alterado em {quando}', { quando: hora(mudou.em) })) : null), h('h3', {}, nr.t), h('pre', {}, typeof nr.v === 'string' ? nr.v : JSON.stringify(nr.v, null, 2)));
          if (nr.g === 'saber') for (const [estado, rotulo] of [['APROVADO', 'Aprovar'], ['DESCARTADO', 'Descartar']]) if (nr.v.estado !== estado) inspect.append(h('button', { type: 'button', class: 'v36c-fonte', onclick: async () => { const resultado = await chamar(() => api.conhecimentoDecidir(nr.v.id, estado)); if (resultado) brain(x); } }, rotulo));
        });
        campo.append(b);
      });
      campo.prepend(face);
      const legenda = h('div', { class: 'v36a-legenda-neural' }, ...Object.entries(GRUPOS).filter(([g]) => neuronios.some(nr => nr.g === g)).map(([, [t, cor]]) => h('span', {}, bolinha(cor), tr(t))), mudou ? h('span', {}, bolinha('#ffc65a'), tr('Alterado no último salvamento')) : null);
      stage.append(h('div', { class: 'v36a-cerebro-topo' }, h('button', { type: 'button', class: 'v36a-voltar', onclick: () => detail(x) }, '← ', tr('Configuração')), h('strong', { 'data-i18n-ignore': '' }, x.nome), h('span', {}, tr('{n} conhecimentos', { n: neuronios.length }))), campo, h('div', { class: 'v36a-cerebro-rodape' }, inspect, legenda));
      stage.style.setProperty('--face-color', palette[x.index % 8]); neural(stage, { pontos: 110, escuro: true });
      body.replaceChildren(stage); figuraRobo(face, x, 'cerebro', campo);
    }
    // Painel de atividades (v41): canvas com janelas de terminal ligadas pelos registros locais, atualizado ao vivo.
    async function activity() {
      painelVivo?.parar();
      const quieto = async (fn) => { try { const r = await fn(); return r && r.ok ? r.data : null; } catch { return null; } };
      const host = h('div', { class: 'v36a-painel' });
      body.replaceChildren(h('div', { class: 'v36a-topo' }, h('div', {}, h('h2', { class: 'v36a-titulo' }, tr('Painel de atividades')), h('p', {}, tr('Clientes, agentes e o worker trabalhando, em tempo real. Só aparecem ligações que os registros deste computador comprovam.')))), host);
      painelVivo = PrumoPainelAtividades.montar(host, {
        reduzido, ativo: () => activeTab === 'activity' && estado.aba === 'agentes' && estado.espaco?.id === e.id,
        carregar: async () => {
          const root = estado.root;
          const [hist, roster, execs] = await Promise.all([root ? quieto(() => api.historico(root, { limit: 1000 })) : null, quieto(() => api.assistenteAgentes(e.id)), quieto(() => api.execucoes({ espacoId: e.id, limite: 200 }))]);
          const agentes = roster?.agentes || [];
          const conversas = (await Promise.all(agentes.map((a) => quieto(() => api.conversasListar(e.id, a.id)).then((l) => (l || []).map((c) => ({ ...c, fontes: c.fontes.map(f => typeof f === 'string' ? f : f.rotulo), agenteNome: a.nome })))))).flat();
          if (!hist && !execs && !conversas.length) return null;
          const avisos = [!hist ? tr('Histórico do núcleo indisponível.') : null, hist && !hist.complete ? tr('Histórico parcial: registros inválidos excluídos.') : null, !execs ? tr('Execuções indisponíveis.') : null].filter(Boolean);
          return { atividades: hist?.activities || [], conversas, agentes, execucoes: execs?.execucoes || [], totalExecucoes: execs?.total, avisos };
        },
        abrirAtividade: activityDetails,
        abrirConversa: (c) => caixa((c.semTexto ? 'Atendimento · ' : 'Conversa · ') + (c.agenteNome || c.agente), [note(c.semTexto ? 'Registro local de metadados. A pergunta e a resposta não foram gravadas.' : tr('Gravada somente neste computador. Resposta {m}.', { m: c.modo === 'LOCAL' ? tr('local, sem modelo de IA') : c.modo })), h('pre', {}, JSON.stringify({ em: c.em, agente: c.agente, ...(c.semTexto ? { avaliacao: c.avaliacao } : { pergunta: c.pergunta, resposta: c.linhas }), fontes: c.fontes, modo: c.modo }, null, 2))]),
        abrirExecucao: (x) => caixa(tr('Execução {r}', { r: x.rotina }), [note(tr('Registro da fila do worker. Evidência e logs completos ficam em Execuções.')), h('pre', {}, JSON.stringify(x, null, 2)), button(tr('Abrir Execuções'), () => { document.querySelector('.v36-dialog[open]')?.close(); mostrar('execucoes'); })]),
        abrirTela: (aba) => mostrar(aba)
      });
    }
    list();
  };

  // ---------------- Ajustes: Sistema (tema, idioma, cor) e Assistente (nome, estilo, voz, IA externa) ----------------
  function ajustesAssistente() {
    const caixa = $('#controles'); if (!caixa || caixa.querySelector('.v36-ajustes-ia')) return;
    caixa.prepend(h('div', { class: 'v36-ajustes-titulo' }, tr('Sistema')));
    const ia = () => estado.prefs?.ia || { nome: 'Prumo', estilo: 'amigavel', voz: null, lerRespostas: false, delegacao: { claude: false, codex: false } };
    async function salvar(parcial) { const r = await chamar(() => api.salvarPreferencias({ ia: parcial })); if (r) { estado.prefs = { ...(estado.prefs || {}), ...r }; conversa.recarregar(); } return r; }
    const nome = h('input', { id: 'ia-nome', maxlength: 40, value: ia().nome, 'aria-label': tr('Nome do assistente'), autocomplete: 'off' });
    const pessoa = h('input', { id: 'ia-pessoa', maxlength: 30, 'aria-label': 'Como chamar você', autocomplete: 'off' });
    const papel = h('select', { id: 'ia-papel', 'aria-label': 'Seu papel no time' }, [['', 'Não informado'], ['qa', 'QA'], ['dev', 'Desenvolvimento'], ['po', 'Produto (PO)'], ['analista', 'Análise'], ['outro', 'Outro']].map(([value, rotulo]) => h('option', { value }, rotulo)));
    async function carregarPerfil() { const r = await chamar(() => api.perfilObter()); if (r) { pessoa.value = r.comoChamar || ''; papel.value = r.papel || ''; } }
    pessoa.addEventListener('change', () => chamar(() => api.perfilSalvar({ comoChamar: pessoa.value.trim() || null })));
    papel.addEventListener('change', () => chamar(() => api.perfilSalvar({ papel: papel.value || null })));
    nome.addEventListener('change', async () => { const v = nome.value.trim(); if (!v || !/^[\p{L}\p{N} ._-]+$/u.test(v)) { nome.value = ia().nome; avisar(tr('Use letras, números, espaço, ponto, hífen ou sublinhado.'), true); return; } await salvar({ nome: v }); });
    const estilo = h('select', { id: 'ia-estilo', 'aria-label': tr('Estilo das respostas') }, [['amigavel', 'Amigável e educado'], ['direto', 'Direto ao ponto'], ['tecnico', 'Técnico, com detalhes']].map(([v, t]) => h('option', { value: v, selected: v === ia().estilo }, tr(t))));
    estilo.addEventListener('change', () => salvar({ estilo: estilo.value }));
    const voz = h('select', { id: 'ia-voz', 'aria-label': tr('Voz do assistente') });
    const ler = h('input', { type: 'checkbox', id: 'ia-ler', checked: !!ia().lerRespostas });
    ler.addEventListener('change', () => salvar({ lerRespostas: ler.checked }));
    function vozes() { const lista = 'speechSynthesis' in window ? speechSynthesis.getVoices() : []; voz.replaceChildren(h('option', { value: '' }, tr('Voz padrão do sistema')), ...lista.map((v) => h('option', { value: v.name, selected: v.name === ia().voz }, v.name + ' (' + v.lang + ')'))); voz.disabled = !lista.length; }
    vozes(); if ('speechSynthesis' in window) speechSynthesis.addEventListener?.('voiceschanged', vozes);
    voz.addEventListener('change', () => salvar({ voz: voz.value || null }));
    const externos = h('div', { class: 'v36-ajustes-externos' });
    async function desenharExternos() {
      const r = await chamar(() => api.assistenteAgentes(estado.espaco?.id ?? null)); if (!r) return;
      externos.replaceChildren(...r.provedores.map((p) => {
        const nomeP = p.id === 'claude' ? 'Claude Code' : 'Codex';
        const chave = h('input', { type: 'checkbox', 'data-provedor': p.id, checked: p.autorizado, disabled: !p.disponivel && !p.autorizado });
        chave.addEventListener('change', async () => { const x = await chamar(() => api.iaDelegacao(p.id, chave.checked)); if (!x || x.canceled) chave.checked = !chave.checked; else { estado.prefs = { ...(estado.prefs || {}), ia: x.ia }; conversa.recarregar(); } });
        const situacao = p.disponivel ? (p.autorizado ? tr('autorizado no chat') : tr('instalado, não autorizado')) : p.atalho ? tr('só atalho .cmd; indisponível') : tr('não encontrado');
        return h('label', { class: 'v36-ajustes-linha' }, chave, h('span', {}, nomeP), h('small', {}, situacao));
      }));
    }
    const linha = (rotulo, no) => h('label', { class: 'ajuste' }, h('span', {}, tr(rotulo)), no);
    caixa.append(h('div', { class: 'v36-ajustes-ia' }, h('div', { class: 'v36-ajustes-titulo' }, tr('Assistente')),
      linha('Nome do assistente', nome), linha('Como chamar você', pessoa), linha('Seu papel no time', papel), linha('Estilo das respostas', estilo), linha('Voz do assistente', voz),
      h('label', { class: 'v36-ajustes-linha' }, ler, h('span', {}, tr('Ler respostas em voz alta'))),
      h('div', { class: 'v36-ajustes-sub' }, tr('IA externa no chat (opcional)')), externos,
      h('p', { class: 'v36-ajustes-nota' }, tr('Sem IA externa, os agentes respondem com os dados deste computador. Autorizar pede confirmação.'))));
    desenharExternos(); carregarPerfil();
    $('#ajustes')?.addEventListener('click', () => { nome.value = ia().nome; estilo.value = ia().estilo; ler.checked = !!ia().lerRespostas; vozes(); desenharExternos(); });
  }
  if (typeof montarControles === 'function') { const base = montarControles; montarControles = function () { base(); ajustesAssistente(); }; }
  // mostrar() transfere os filhos do recipiente temporário para o main; a classe
  // precisa acompanhar os filhos para manter estilos restritos ao módulo.
  for (const id of ['inicio', 'metricas', 'historico', 'logs', 'agentes']) {
    const render = abas[id]; abas[id] = async el => { await render(el); const wrapper = h('section', { class: el.className }, ...el.childNodes); el.replaceChildren(wrapper); };
  }
  function iniciar() {
    flutuante = montarFlutuante(); ajustesAssistente();
    new MutationObserver(marcarTela).observe($('#conteudo'), { childList: true });
    const topo = document.querySelector('.topo-direita'); if (topo) new ResizeObserver(medirTopo).observe(topo);
    marcarTela();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true }); else iniciar();
})();
