/** Logs: converte eventos em linhas e detalhes inspecion?veis. */
    const chave = (e) => e.operationId + ':' + e.phase;
    function mensagem(e) { return e.phase === 'start' ? [h('span', {}, tr('Operação iniciada')), ' · ', semTraducao(e.origin + '/' + e.client)] : [h('span', {}, tr('Operação encerrada')), ' · ', semTraducao([e.state, e.summary?.code, ms(e.durationMs)].filter(Boolean).join(' · '))]; }
    function detalhe(e) {
      const campos = [['Horário completo', e.at], ['Operação / correlação', e.operationId], ['Fase', e.phase], ['Ferramenta', e.tool], ['Origem', e.origin], ['Cliente (declarado)', e.client], ['Estado', e.state], ['Duração', ms(e.durationMs)], ['Código', e.summary?.code || '—'], ['Evidência', e.summary?.evidenceJobId || '—']];
      const ev = e.summary?.evidenceJobId;
      return h('div', { class: 'v36l-detalhe', role: 'region', 'aria-label': tr('Detalhes do log') },
        h('div', { class: 'v36l-detalhe-topo' }, '↳ ', h('span', {}, tr('Inspeção de evento')), ' · ', semTraducao('op-' + e.operationId.slice(0, 8))),
        h('dl', {}, campos.map(([k, v]) => h('div', {}, h('dt', {}, tr(k)), h('dd', { 'data-i18n-ignore': '' }, String(v))))),
        h('pre', {}, JSON.stringify(e, null, 2)),
        h('small', {}, tr('Somente os metadados registrados pelo núcleo para esta operação.')),
        ev ? h('button', { type: 'button', class: 'v36l-mini', onclick: () => { estado.jobId = ev; void mostrar('evidencias'); } }, tr('Ver evidência')) : null);
    }
    function linha(e) {
      const nivel = nivelDe(e.state), ab = aberto === chave(e);
      const b = h('button', { type: 'button', class: 'v36l-linha v36-log-line', 'data-level': nivel, 'data-state': e.state, 'aria-expanded': String(ab), title: e.operationId },
        h('span', { class: 'v36l-hora' }, hms(e.at)), h('span', { class: 'v36l-nivel', 'data-level': nivel }, nivel), h('span', { class: 'v36l-op' }, 'op-' + e.operationId.slice(0, 6)),
        h('span', { class: 'v36l-fase' }, e.tool), h('span', { class: 'v36l-msg' }, ...mensagem(e)), h('span', { class: 'v36l-seta', 'aria-hidden': 'true' }, ab ? '⌃' : '⌄'));
      b.addEventListener('click', () => { aberto = ab ? null : chave(e); desenhar(); corpo.querySelector('[data-log="' + chave(e) + '"]')?.scrollIntoView({ block: 'nearest' }); });
      return h('div', { class: 'v36l-evento', 'data-log': chave(e) }, b, ab ? detalhe(e) : null);
    }
