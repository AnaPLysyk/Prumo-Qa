'use strict';
/** Monta a tela inicial, seu chat e os indicadores atuais. */
// ---- Início ----
abas.inicio = async (el) => {
  const w = estado.worker || (await atualizarWorker()); const m = await chamar(() => api.metricasExecucoes(estado.espaco?.id));
  const msgs = h('div', { class: 'chat-msgs', id: 'chat-msgs', 'aria-live': 'polite', 'data-i18n-ignore': '' });
  const entrada = h('input', { id: 'chat-input', type: 'text', maxlength: 300, placeholder: tr('Pergunte sobre este projeto…'), 'aria-label': tr('Pergunta ao Prumo') });
  const form = h('form', { class: 'chat-form', id: 'chat-form' }, entrada, h('button', { class: 'acao primaria', type: 'submit' }, tr('Enviar')));
  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches; let fila = Promise.resolve();
  // Digita como um chat. Pára sozinho se a pessoa sair da tela; movimento reduzido mostra o texto de uma vez.
  const digitar = (texto, classe = 'prumo') => { const b = h('div', { class: 'msg ' + classe }); msgs.append(b); const ativo = () => b.isConnected;
    if (reduzido || classe === 'voce') { b.textContent = texto; msgs.scrollTop = msgs.scrollHeight; return Promise.resolve(); }
    return new Promise((ok) => { b.classList.add('digitando'); let n = 0; const t = setInterval(() => { if (!ativo()) { clearInterval(t); ok(); return; } n += 2; b.textContent = texto.slice(0, n); msgs.scrollTop = msgs.scrollHeight; if (n >= texto.length) { clearInterval(t); b.classList.remove('digitando'); ok(); } }, 18); }); };
  const falar = (linhas, fontes) => { fila = fila.then(async () => { for (const l of linhas) await digitar(l); if (fontes?.length) { msgs.append(h('div', { class: 'fontes' }, fontes.map((f) => h('button', { type: 'button', onclick: () => mostrar(f.aba) }, f.rotulo)))); msgs.scrollTop = msgs.scrollHeight; } }); return fila; };
  form.addEventListener('submit', async (ev) => { ev.preventDefault(); const q = entrada.value.trim(); if (q.length < 2) return; entrada.value = ''; await digitar(q, 'voce');
    const r = await chamar(() => api.assistentePerguntar(estado.espaco?.id ?? null, q)); if (r) await falar(r.linhas, r.fontes); });
  el.append(h('section', { class: 'home' },
    h('div', { class: 'home-orb' }, qc.campo(260, estadoOrb(w), tr('Esfera do Prumo QA')), h('h1', {}, 'Prumo QA'), h('p', { class: 'qc-legenda' }, estadoOrb(w) === 'executando' ? tr('Rodando agora.') : tr('Em espera.'))),
    h('div', { class: 'chat', id: 'chat' }, h('div', { class: 'chat-topo' }, h('strong', {}, 'Prumo'), h('span', { class: 'chip' }, h('i'), tr('Dados locais'))), msgs, form, h('div', { class: 'chat-dica suave' }, tr('Responde com os dados deste computador, sem modelo de IA.')))));
  el.append(h('div', { class: 'kpis', id: 'inicio-estado' },
    h('div', {}, h('b', {}, textoWorker(w)), h('span', {}, tr('estado do worker'))),
    h('div', {}, h('b', {}, m?.proximaExecucao ? hora(m.proximaExecucao) : '—'), h('span', {}, tr('próxima execução'))),
    h('div', {}, h('b', {}, String(m?.rotinasAtivas ?? 0)), h('span', {}, tr('rotinas ativas'))),
    h('div', {}, h('b', {}, String(m?.execucoes ?? 0)), h('span', {}, tr('execuções registradas')))));
  const sit = await chamar(() => api.assistenteSituacao(estado.espaco?.id ?? null));
  falar([tr('Olá! Eu sou o Prumo.'), ...(sit || [])]);
};

