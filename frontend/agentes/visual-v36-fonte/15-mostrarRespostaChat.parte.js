/** Apresenta a resposta e as fontes do chat. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function falar(linhas, fontes, proximos, rotulo) {
      const v = versao;
      fila = fila.then(async () => {
        for (const [i, l] of linhas.entries()) { await digitar(l, v, i === 0 ? rotulo : null); falarVoz(l); }
        if (v !== versao) return;
        if (fontes?.length) { msgs.append(h('div', { class: 'v36c-fontes' }, fontes.map((f) => h('button', { type: 'button', class: 'v36c-fonte', onclick: () => abrirTela(f.aba) }, f.rotulo, h('span', { 'aria-hidden': 'true' }, '↗'))))); rolar(); }
        if (proximos) sugerir(proximos);
      }).catch(() => {});
      return fila;
    }
