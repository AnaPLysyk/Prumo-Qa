/** Mostra os filtros avancados de casos. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  async function avancadaQase(e) {
    const caixa = h('div', { class: 'ds-avancada' }, h('p', { class: 'suave' }, tr('Consulta direta ao Qase vinculado: suites, casos, detalhe com passos e planos, com os dados retornados.')));
    DS.modal('Consulta avançada · Qase', caixa, { tamanho: 'lg' }); await consultaManual(caixa, 'qase', { suites: 'Suites', casos: 'Casos manuais e automatizados', caso: 'Detalhe e passos do caso', planos: 'Planos' });
  }
