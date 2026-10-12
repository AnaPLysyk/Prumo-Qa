/** Interpreta uma referencia do grafo. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  const refDoNo = (n) => { const [tipo, ...resto] = n.id.split(':'); const id = resto[0] ?? n.id; return { tipo: n.tipo === 'run' ? 'run' : tipo, id }; };
  function botaoNo(e, n, origem) {
    const ref = refDoNo(n); const servico = servicoDoTipo[n.tipo] || 'prumo'; const desat = n.estado === 'DESATUALIZADO';
    const abrir = { jira: () => abrirTicket(e, ref.id), 'jira-bug': () => abrirTicket(e, ref.id), qase: () => abrirCaso(e, ref.id), 'qase-defeito': () => abrirDefeito(e, ref.id), evidencia: () => window.PrumoOperacao?.abrirEvidencia(e, ref.id), run: () => abrirRunLocal(e, ref.id, false) }[n.tipo];
    const texto = n.tipo === 'jira' ? ref.id : n.rotulo;
    if (!abrir) return h('span', { class: 'ds-no', 'data-servico': servico, 'data-origem': origem || null, title: n.detalhe || null }, h('i'), texto);
    const b = h('button', { type: 'button', class: 'ds-no', 'data-servico': servico, 'data-origem': origem || null, 'aria-label': tr('Abrir {t} {id}', { t: n.tipo, id: ref.id }), title: desat ? tr('Vínculo original removido; consulta não autorizada ao vínculo atual.') : (n.detalhe || null), disabled: desat }, h('i'), texto);
    if (!desat) b.addEventListener('click', abrir);
    return b;
  }
