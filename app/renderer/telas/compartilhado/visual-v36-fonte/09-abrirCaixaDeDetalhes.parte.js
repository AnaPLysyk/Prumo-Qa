/** Monta uma caixa para apresentar detalhes. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  function caixa(titulo, conteudo) {
    const d = h('dialog', { class: 'v36-dialog', 'aria-label': titulo }, h('h2', {}, titulo), ...conteudo, h('div', {}, button(tr('Fechar'), () => d.close())));
    document.body.append(d); d.addEventListener('close', () => d.remove(), { once: true }); d.showModal(); return d;
  }

  // ---------------- Casca: tela atual, espaço reservado ao canto superior direito ----------------
