/** Monta uma linha do terminal de logs. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function linha(e) {
      const nivel = nivelDe(e.state), ab = aberto === chave(e);
      const b = h('button', { type: 'button', class: 'v36l-linha v36-log-line', 'data-level': nivel, 'data-state': e.state, 'aria-expanded': String(ab), title: e.operationId },
        h('span', { class: 'v36l-hora' }, hms(e.at)), h('span', { class: 'v36l-nivel', 'data-level': nivel }, nivel), h('span', { class: 'v36l-op' }, 'op-' + e.operationId.slice(0, 6)),
        h('span', { class: 'v36l-fase' }, e.tool), h('span', { class: 'v36l-msg' }, ...mensagem(e)), h('span', { class: 'v36l-seta', 'aria-hidden': 'true' }, ab ? '⌃' : '⌄'));
      b.addEventListener('click', () => { aberto = ab ? null : chave(e); desenhar(); corpo.querySelector('[data-log="' + chave(e) + '"]')?.scrollIntoView({ block: 'nearest' }); });
      return h('div', { class: 'v36l-evento', 'data-log': chave(e) }, b, ab ? detalhe(e) : null);
    }
