/** Mostra filtros avancados de tickets. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  async function avancada(e) {
    const caixa = h('div', { class: 'ds-avancada' }, h('p', { class: 'suave' }, tr('Consulta direta ao Jira vinculado: detalhe por chave, comentários e descoberta do campo de critérios de aceite.')));
    DS.modal('Consulta avançada · Jira', caixa, { tamanho: 'lg' }); await consultaManual(caixa, 'jira', { tickets: 'Tickets do projeto', ticket: 'Detalhe de ticket', campos: 'Descobrir campos de critérios de aceite', comentarios: 'Comentários de ticket' });
  }

