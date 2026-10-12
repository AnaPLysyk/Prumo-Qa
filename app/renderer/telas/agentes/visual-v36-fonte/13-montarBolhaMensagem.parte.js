/** Monta uma mensagem no chat. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function bolha(quem, rotulo) {
      const texto = h('div', { class: 'v36c-texto' }); const meta = quem === 'prumo' && (primeira || rotulo);
      const m = h('article', { class: 'msg ' + quem + (meta ? ' primeira' : '') }, meta ? h('div', { class: 'v36c-meta' }, rotulo || nomeIa()) : null, texto);
      if (quem === 'prumo') primeira = false; msgs.append(m); return { m, texto };
    }
