'use strict';
/** Navegação da janela: menu lateral, projeto selecionado, estado do worker e atalhos globais. */
/** Controla menu, tema, idioma, notificações e seletor de projeto da janela. */
// ---- Barra superior: esfera, estado do worker, tema e idioma ----
async function atualizarWorker() {
  const r = await api.workerEstado(); if (!r.ok) return null; const w = r.data; estado.worker = w;
  const chip = $('#worker-estado'); if (chip) { chip.dataset.nivel = nivelWorker(w); chip.replaceChildren(h('i'), textoWorker(w)); chip.title = tr('Próxima execução: {quando}', { quando: w.proximaExecucao ? hora(w.proximaExecucao) : tr('nenhuma agendada') }); }
  qc.definirEstado(estadoOrb(w)); return w;
}

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
