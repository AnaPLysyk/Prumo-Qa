/** Mostra uma atividade na linha do tempo. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function entrada(a) {
      const ab = aberto === a.operationId;
      const ev = h('button', { type: 'button', class: 'v36h-evento', 'aria-expanded': String(ab), 'aria-controls': 'v36-det-' + a.operationId, onclick: () => { aberto = ab ? null : a.operationId; desenhar(); } },
        h('span', { class: 'v36h-titulo' }, icone(ICONE_FERRAMENTA[a.tool] || 'agente', 16), h('span', {}, tituloDe(a)), h('span', { class: 'v36h-seta', 'aria-hidden': 'true' }, ab ? '⌃' : '⌄')),
        h('div', { class: 'v36h-corpo' }, corpoDe(a)), h('div', { class: 'v36h-tags' }, tags(a)));
      return h('div', { class: 'v36h-entrada', 'data-operation': a.operationId }, h('div', { class: 'v36h-hora' }, hm(a.at)), h('div', { class: 'v36h-fio' }, h('span', { class: 'v36h-ponto ' + classeEstado(a.state) })), h('div', { class: 'v36h-quadro' }, ev, ab ? detalheInline(a) : null));
    }
    const COLUNAS = [['data', 'Data', (a) => a.at], ['atividade', 'Atividade', tituloDe], ['ferramenta', 'Ferramenta', (a) => a.tool], ['resultado', 'Resultado', (a) => a.state], ['origem', 'Origem', (a) => a.origin], ['cliente', 'Cliente', (a) => a.client], ['duracao', 'Duração', (a) => a.durationMs], ['operacao', 'Operação', (a) => a.operationId]];
