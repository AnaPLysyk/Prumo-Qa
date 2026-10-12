/** Monta os detalhes de um evento de log. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function detalhe(e) {
      const campos = [['Horário completo', e.at], ['Operação / correlação', e.operationId], ['Fase', e.phase], ['Ferramenta', e.tool], ['Origem', e.origin], ['Cliente (declarado)', e.client], ['Estado', e.state], ['Duração', ms(e.durationMs)], ['Código', e.summary?.code || '—'], ['Evidência', e.summary?.evidenceJobId || '—']];
      const ev = e.summary?.evidenceJobId;
      return h('div', { class: 'v36l-detalhe', role: 'region', 'aria-label': tr('Detalhes do log') },
        h('div', { class: 'v36l-detalhe-topo' }, '↳ ', h('span', {}, tr('Inspeção de evento')), ' · ', ignorar('op-' + e.operationId.slice(0, 8))),
        h('dl', {}, campos.map(([k, v]) => h('div', {}, h('dt', {}, tr(k)), h('dd', { 'data-i18n-ignore': '' }, String(v))))),
        h('pre', {}, JSON.stringify(e, null, 2)),
        h('small', {}, tr('Somente os metadados registrados pelo núcleo para esta operação.')),
        ev ? h('button', { type: 'button', class: 'v36l-mini', onclick: () => { estado.jobId = ev; mostrar('evidencias'); } }, tr('Ver evidência')) : null);
    }
