'use strict';
/** Define as subabas de casos, runs, automações e vínculos em Testes. */
// ---------------- Testes: catálogo do repositório + casos, planos e automação em subabas ----------------
const nomesTipo = { unitario: 'Unitário', integracao: 'Integração', funcional: 'Funcional', regressao: 'Regressão', smoke: 'Smoke', desempenho: 'Desempenho', acessibilidade: 'Acessibilidade', indefinido: 'Indefinido' };
const barraSub = (pai, itens, atual) => h('div', { class: 'segmentos sub', role: 'group', 'aria-label': 'Seção' }, itens.map(([k, t]) => h('button', { type: 'button', 'data-sub': k, 'aria-pressed': String(k === atual), onclick: () => { (estado.sub ||= {})[pai] = k; mostrar(pai); } }, t)));
const semTitulo = (no) => { no.querySelector('h1')?.remove(); return no; };
const abaCasosQase = abas.testes; const abaRuns = abas.runs; const abaAutomacao = abas.automacoes; const abaVinculos = abas.vinculos; const abaRastreio = abas.rastreabilidade;
