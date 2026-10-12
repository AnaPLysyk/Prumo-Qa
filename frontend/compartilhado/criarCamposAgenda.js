'use strict';
/** Cria campos de formulário e seletores usados na agenda. */
const campoA = (rotulo, el, id) => h('label', { class: 'ds-campo', for: id }, h('span', {}, tr(rotulo)), el);
const selecao = (id, opcoes, atual) => h('select', { id }, Object.entries(opcoes).map(([v, t]) => h('option', { value: v, selected: v === atual }, tr(t))));
