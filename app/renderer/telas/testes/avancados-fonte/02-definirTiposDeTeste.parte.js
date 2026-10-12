/** Define rótulos e indicadores do tipo de teste. Parte de testes-v40.js; nao carregar isoladamente. */
  const nomesNivel = { unitario: 'Unitário', integracao: 'Integração/API', funcional: 'Funcional (E2E)', regressao: 'Regressão', smoke: 'Smoke', desempenho: 'Desempenho', acessibilidade: 'Acessibilidade', indefinido: 'Não classificado' };
  const chipNivel = (t) => h('span', { class: 'tipo t-' + t }, tr(nomesNivel[t] || t));
  const chipTag = (t) => h('span', { class: 'ds-chip ds-tag' }, '@' + t);

  /** Carrega e memoriza o catálogo do código e os casos do Qase do projeto (uma vez por sessão, com "Atualizar"). */
