/** Tickets: detalhe de GitHub Issues em modo somente leitura. */
  // Issue do GitHub: somente leitura no Prumo; os dados vêm da listagem do repositório vinculado.
  function abrirIssue(e, i) {
    const vg = vinc(e, 'github'); if (!vg) { avisar(tr('GitHub não vinculado a este projeto.'), true); return; }
    const rot = Array.isArray(i.rotulos) ? i.rotulos : [];
    const main = h('section', { class: 'ds-detalhe-main', id: 'issue-detalhe' }, DS.bloco('Descrição', DS.texto(i.corpo, 'Sem descrição.')));
    const aside = h('aside', {}, DS.meta([['Origem', DS.origem('github', 'GitHub · ' + vg.recurso.chave)], ['Estado', i.estado === 'open' ? tr('Aberta') : i.estado === 'closed' ? tr('Fechada') : String(i.estado)], ['Rótulos', rot.join(', ') || null], ['Autor', i.autor || null], ['Comentários', String(i.comentarios ?? 0)], ['Atualizada', i.atualizado ? hora(i.atualizado) : null], ['Link', i.url ? h('code', {}, i.url) : null]]),
      DS.notaPermissao('Issues do GitHub são somente leitura aqui. Nova issue nasce de um rascunho local com destino GitHub Issues; edição e comentários não têm contrato.'));
    DS.modal('#' + i.numero + ' · ' + (i.titulo || ''), h('div', { class: 'ds-detalhe' }, main, aside), { tamanho: 'lg', subtitulo: [DS.origem('github'), DS.chip('Issue')] });
  }

  // ======================= Casos (Qase) =======================
