'use strict';
/** Componentes compartilhados das subabas de Testes: rótulos de tipo, barra de seções e cabeçalho sem título. */
// ---------------- Testes: IDE, Repositório, Runs e Planos ----------------
const nomesTipo = { unitario: 'Unitário', integracao: 'Integração', funcional: 'Funcional', regressao: 'Regressão', smoke: 'Smoke', desempenho: 'Desempenho', acessibilidade: 'Acessibilidade', indefinido: 'Indefinido' };
const barraSub = (pai, itens, atual) => h('div', { class: 'segmentos sub', role: 'group', 'aria-label': 'Seção' }, itens.map(([k, t]) => h('button', { type: 'button', 'data-sub': k, 'aria-pressed': String(k === atual), onclick: () => { (estado.sub ||= {})[pai] = k; mostrar(pai); } }, t)));
const semTitulo = (no) => { no.querySelector('h1')?.remove(); return no; };
