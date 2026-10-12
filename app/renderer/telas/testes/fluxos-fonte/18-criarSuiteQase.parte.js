/** Prepara uma nova suite Qase. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  function novaSuite(e, esc) {
    const titulo = h('input', { id: 'su-titulo', maxlength: 255 }); const saida = h('div', { id: 'ts-saida' });
    DS.modal('Nova suite no Qase', [!esc ? DS.alerta('Escrita no Qase desligada. Habilite em Conexões para criar suites.', 'aviso', 'cadeado') : null, h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título da suite', titulo, { inteiro: true })), saida,
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar suite…', async () => { const r = await executarOperacao(e, 'qase.criar_suite', { titulo: titulo.value }); if (r) { saida.replaceChildren(painelResultado(r)); if (r.estado === 'CONFIRMADA') delete memoria('testes', e.id).suites; } }, { id: 'su-criar', primaria: true, desabilitado: !esc }))], { tamanho: 'sm' });
    titulo.focus();
  }
