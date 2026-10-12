/** Encontra referencias e relacionamentos do projeto. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  function noRef(e, ref, rotulo) {
    const servico = servicoDoTipo[ref.tipo] || 'prumo'; const ok = vigente(e, ref);
    const abrir = { jira: () => abrirTicket(e, ref.id), 'jira-bug': () => abrirTicket(e, ref.id), qase: () => abrirCaso(e, ref.id), 'qase-defeito': () => abrirDefeito(e, ref.id) }[ref.tipo];
    if (!abrir) return h('span', { class: 'ds-no', 'data-servico': servico }, h('i'), rotulo || ref.id);
    const b = h('button', { type: 'button', class: 'ds-no', 'data-servico': servico, 'aria-label': tr('Abrir {t} {id}', { t: ref.tipo, id: ref.id }), disabled: !ok, title: ok ? null : tr('Vínculo original removido; consulta não autorizada ao vínculo atual.') }, h('i'), rotulo || ref.id);
    if (ok) b.addEventListener('click', abrir);
    return b;
  }
  function blocoRelacoes(e, tipos, id) {
    const rels = relacoesDe(e, tipos, id);
    return DS.bloco('Vínculos no Prumo', rels.length ? h('div', { class: 'ds-celula-nos' }, rels.map((r) => { const o = outroLado(r, tipos, id); return noRef(e, o, ({ qase: 'Caso ', 'qase-defeito': 'Defeito ', automacao: '', 'jira-bug': 'Bug ' }[o.tipo] ?? '') + o.id); }))
      : h('p', { class: 'suave' }, tr('Nenhum vínculo declarado.')), DS.link('Ver na rastreabilidade', () => { DS.fecharModal(); (estado.ds ||= {}).rastroBusca = String(id); mostrar('rastreabilidade'); }));
  }

  // ======================= Tickets =======================
