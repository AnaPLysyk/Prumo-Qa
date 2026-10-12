/** Monta a descricao de cada atividade. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function corpoDe(a) {
      if (a.findingsText) return ignorar(a.findingsText);
      return h('span', {}, h('span', {}, tr('Resultado')), ' ', ignorar([a.state, a.summary?.code, ms(a.durationMs)].filter(Boolean).join(' · ')));
    }
    function tags(a) { return [h('span', { class: 'v36-tag v36-estado ' + classeEstado(a.state) }, a.state), h('span', { class: 'v36-tag', 'data-i18n-ignore': '' }, nomeProjeto), h('span', { class: 'v36-tag' }, a.tool), h('span', { class: 'v36-tag' }, a.origin + ' · ' + a.client)]; }
    function detalheInline(a) {
      const ev = a.summary?.evidenceJobId;
      const campos = [['Quando', new Date(a.at).toLocaleString(local())], ['Projeto', nomeProjeto], ['Origem · Cliente (declarado)', a.origin + ' · ' + a.client], ['Ferramenta', a.tool], ['Operação', a.operationId, true], ['Duração', ms(a.durationMs)], ['Código', a.summary?.code || '—', true], ['Evidência', ev || '—', true]];
      return h('div', { class: 'v36h-detalhe', id: 'v36-det-' + a.operationId, role: 'region', 'aria-label': tr('Detalhes da atividade') },
        h('div', { class: 'v36h-dcabeca' }, h('strong', {}, tituloDe(a)), h('span', { class: 'v36-pilula ' + classeEstado(a.state) }, a.state)),
        h('p', {}, corpoDe(a)),
        h('div', { class: 'v36h-dgrade' }, campos.map(([k, v, codigo]) => h('div', {}, h('small', {}, tr(k)), codigo ? h('code', {}, String(v)) : h('strong', { 'data-i18n-ignore': '' }, String(v))))),
        h('div', { class: 'v36h-dacoes' }, h('button', { type: 'button', onclick: () => detalhesAtividade(a) }, tr('Detalhes')), h('button', { type: 'button', onclick: () => copiar(a.operationId) }, tr('Copiar ID')),
          h('button', { type: 'button', onclick: () => { busca.value = a.operationId; filtros.hidden = false; botaoFiltros.setAttribute('aria-expanded', 'true'); desenhar(); } }, tr('Filtrar operação')),
          ev ? h('button', { type: 'button', onclick: () => { estado.jobId = ev; mostrar('evidencias'); } }, tr('Ver evidência')) : null));
    }
