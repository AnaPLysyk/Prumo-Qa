'use strict';
/** Preferências visuais e de idioma: tema, cor e controles de configuração. */
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

function aplicarTema(t) { document.documentElement.dataset.tema = t || 'sistema'; qc.definirEstado(estadoOrb(estado.worker)); }

async function definirIdioma(i) {
  PrumoI18n.definir(i); estado.prefs = { ...(estado.prefs || {}), idioma: i }; document.documentElement.lang = i;
  PrumoI18n.traduzirDocumento(); montarControles(); await atualizarWorker(); await mostrar(estado.aba);
}
