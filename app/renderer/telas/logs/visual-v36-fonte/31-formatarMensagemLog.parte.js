/** Formata uma mensagem de evento de log. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function mensagem(e) { return e.phase === 'start' ? [h('span', {}, tr('Operação iniciada')), ' · ', ignorar(e.origin + '/' + e.client)] : [h('span', {}, tr('Operação encerrada')), ' · ', ignorar([e.state, e.summary?.code, ms(e.durationMs)].filter(Boolean).join(' · '))]; }
