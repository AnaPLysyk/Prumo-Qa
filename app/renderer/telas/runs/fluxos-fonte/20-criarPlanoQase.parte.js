/** Prepara um plano de testes Qase. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  async function novoPlano(e, esc) {
    const mem = memoria('testes', e.id); const casos = mem.casos || (mem.casos = await carregarQase(e, mem, 'casos'));
    const titulo = h('input', { id: 'plano-titulo', maxlength: 255 }); const marcados = new Set(); const saida = h('div', { id: 'plano-saida' });
    DS.modal('Novo plano no Qase', [!esc ? DS.alerta('Escrita no Qase desligada. Habilite em Conexões para criar planos.', 'aviso', 'cadeado') : null, h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título do plano', titulo, { inteiro: true }),
      h('div', { class: 'ds-campo inteiro' }, h('span', {}, tr('Casos ({n})', { n: casos.itens.length })), casos.itens.length ? h('div', { class: 'ds-opcoes coluna', id: 'plano-casos' }, casos.itens.map((c) => h('label', {}, h('input', { type: 'checkbox', 'data-caso': c.id, onchange: (ev) => (ev.target.checked ? marcados.add(c.id) : marcados.delete(c.id)) }), `${c.id} · ${c.title}`))) : h('p', { class: 'suave' }, tr('Nenhum caso retornado pelo Qase.')))), saida,
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar plano…', async () => { const r = await executarOperacao(e, 'qase.criar_plano', { titulo: titulo.value || 'Plano Prumo', casos: [...marcados] }); if (r) { saida.replaceChildren(painelResultado(r)); if (r.estado === 'CONFIRMADA') delete mem.planos; } }, { id: 'plano-criar', primaria: true, desabilitado: !esc }))], { tamanho: 'md' });
  }
