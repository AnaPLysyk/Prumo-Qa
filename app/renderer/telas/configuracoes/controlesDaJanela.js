'use strict';
/** Controla menu, tema, idioma, notificações e seletor de projeto da janela. */
// ---- Barra superior: esfera, estado do worker, tema e idioma ----
async function atualizarWorker() {
  const r = await api.workerEstado(); if (!r.ok) return null; const w = r.data; estado.worker = w;
  const chip = $('#worker-estado'); if (chip) { chip.dataset.nivel = nivelWorker(w); chip.replaceChildren(h('i'), textoWorker(w)); chip.title = tr('Próxima execução: {quando}', { quando: w.proximaExecucao ? hora(w.proximaExecucao) : tr('nenhuma agendada') }); }
  qc.definirEstado(estadoOrb(w)); return w;
}
function montarControles() {
  const caixa = $('#controles'); if (!caixa) return;
  const tema = h('select', { id: 'tema', 'aria-label': tr('Tema') }, [['sistema', 'Seguir sistema'], ['claro', 'Claro'], ['escuro', 'Escuro']].map(([v, t]) => h('option', { value: v, selected: v === (estado.prefs?.tema || 'sistema') }, tr(t))));
  const idioma = h('select', { id: 'idioma', 'aria-label': tr('Idioma') }, [['pt-BR', 'Português (Brasil)'], ['en', 'English']].map(([v, t]) => h('option', { value: v, selected: v === (estado.prefs?.idioma || 'pt-BR') }, t)));
  tema.addEventListener('change', async () => { aplicarTema(tema.value); estado.prefs = { ...(estado.prefs || {}), tema: tema.value }; await chamar(() => api.salvarPreferencias({ tema: tema.value })); });
  idioma.addEventListener('change', async () => { await chamar(() => api.salvarPreferencias({ idioma: idioma.value })); await definirIdioma(idioma.value); });
  const cores = [['azul', 'Azul', '#6ea8ff'], ['violeta', 'Violeta', '#a78bfa'], ['verde', 'Verde-água', '#34d3b0'], ['ambar', 'Âmbar', '#f0b84a'], ['rosa', 'Rosa', '#f472b6']]; let atual = 'azul'; try { atual = localStorage.getItem('acento') || 'azul'; } catch { /* sem armazenamento */ }
  const paleta = h('div', { class: 'paleta', role: 'radiogroup', 'aria-label': tr('Cor de destaque') }, cores.map(([id, nome, cor]) => { const b = h('button', { type: 'button', class: 'cor', role: 'radio', 'data-cor': id, 'aria-checked': String(id === atual), 'aria-label': tr(nome), title: tr(nome), onclick: () => { aplicarAcento(id); for (const x of paleta.children) x.setAttribute('aria-checked', String(x.dataset.cor === id)); } }); b.style.background = cor; return b; }));
  const linha = (rotulo, no) => h('label', { class: 'ajuste' }, h('span', {}, tr(rotulo)), no);
  caixa.replaceChildren(linha('Tema', tema), linha('Idioma', idioma), h('div', { class: 'ajuste' }, h('span', {}, tr('Cor de destaque')), paleta));
}
function aplicarAcento(a) { document.documentElement.dataset.acento = a; try { localStorage.setItem('acento', a); } catch { /* sem armazenamento */ } qc.definirEstado(estadoOrb(estado.worker)); }
function aplicarMenu(fechado, salvar = true) { document.body.dataset.menu = fechado ? 'fechado' : 'aberto'; const b = $('#menu-alternar'); if (b) { b.setAttribute('aria-expanded', String(!fechado)); const t = tr(fechado ? 'Expandir menu' : 'Recolher menu'); b.setAttribute('aria-label', t); b.title = t; } if (salvar) { try { localStorage.setItem('menu', fechado ? 'fechado' : 'aberto'); } catch { /* sem armazenamento */ } } }
/** Seletor de projeto na lateral: lista os projetos, troca o atual e leva para Projetos para criar ou gerenciar. */
async function montarSeletorProjeto() {
  const btn = $('#projeto-botao'); const lista = $('#projeto-lista'); if (!btn || !lista) return;
  const espacos = (await chamar(api.espacos)) || [];
  const item = (txt, ativo, fn, extra = {}) => h('button', { type: 'button', role: 'option', class: 'projeto-item', 'aria-selected': String(!!ativo), onclick: fn, ...extra }, txt);
  lista.replaceChildren(...espacos.map((e) => item(e.nome, estado.espaco?.id === e.id, () => { estado.espaco = e; estado.root = e.raizContextos; salvarRaiz(); fechar(); mostrar(estado.aba === 'projetos' ? 'projetos' : estado.aba); }, { 'data-projeto': e.id })),
    item(tr(espacos.length ? 'Gerenciar projetos…' : 'Criar o primeiro projeto…'), false, () => { fechar(); mostrar('projetos'); }, { class: 'projeto-item gerenciar' }));
  PrumoI18n.traduzirDocumento();
  function fechar() { lista.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
  btn.onclick = (ev) => { ev.stopPropagation(); const abrir = lista.hidden; lista.hidden = !abrir; btn.setAttribute('aria-expanded', String(abrir)); };
  if (!montarSeletorProjeto.ligado) { montarSeletorProjeto.ligado = true; document.addEventListener('click', (ev) => { if (!lista.hidden && !lista.contains(ev.target)) { lista.hidden = true; btn.setAttribute('aria-expanded', 'false'); } }); }
}
function iniciarAjustes() {
  const bt = $('#ajustes'); const pop = $('#controles'); if (!bt || !pop) return;
  const abrir = (v) => { pop.hidden = !v; bt.setAttribute('aria-expanded', String(v)); };
  bt.addEventListener('click', (ev) => { ev.stopPropagation(); abrir(pop.hidden); });
  document.addEventListener('click', (ev) => { if (!pop.hidden && !pop.contains(ev.target)) abrir(false); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !pop.hidden) { abrir(false); bt.focus(); } });
  // F5 / Ctrl+R: atualiza a tela atual com os dados mais recentes (sem recarregar a janela nem importar arquivo).
  document.addEventListener('keydown', (ev) => { if (ev.key === 'F5' || (ev.ctrlKey && ev.key.toLowerCase() === 'r')) { ev.preventDefault(); atualizarWorker().then(() => mostrar(estado.aba)); } });
  $('#site-institucional')?.addEventListener('click', () => chamar(() => api.abrirSite()));
}
function iniciarMenu() { iniciarAjustes(); let f = false; try { f = localStorage.getItem('menu') === 'fechado'; document.documentElement.dataset.acento = localStorage.getItem('acento') || 'azul'; } catch { /* sem armazenamento */ } aplicarMenu(f, false); $('#menu-alternar')?.addEventListener('click', () => aplicarMenu(document.body.dataset.menu !== 'fechado')); }
function aplicarTema(t) { document.documentElement.dataset.tema = t || 'sistema'; qc.definirEstado(estadoOrb(estado.worker)); }
async function definirIdioma(i) {
  PrumoI18n.definir(i); estado.prefs = { ...(estado.prefs || {}), idioma: i }; document.documentElement.lang = i;
  PrumoI18n.traduzirDocumento(); montarControles(); await atualizarWorker(); await mostrar(estado.aba);
}

