/** Edita um caso Qase com revisao. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  function editarCaso(e, id, c) {
    const tipo0 = tipoCaso(c) === 'planejado' ? 'a-automatizar' : tipoCaso(c) === 'automatizado' ? 'automatizado' : 'manual';
    const titulo = h('input', { id: 'caso-ed-titulo', maxlength: 255, value: c.title || '' }); const desc = h('textarea', { id: 'caso-ed-descricao', rows: 4, maxlength: 8000 }); desc.value = c.description || '';
    const pre = h('textarea', { id: 'caso-ed-pre', rows: 3, maxlength: 4000 }); pre.value = c.preconditions || '';
    const auto = h('select', { id: 'caso-ed-automacao' }, [['manual', 'Manual'], ['a-automatizar', 'Manual, a automatizar'], ['automatizado', 'Automatizado']].map(([v, txt]) => h('option', { value: v, selected: v === tipo0 }, tr(txt))));
    const passos = h('div', { id: 'caso-ed-passos', class: 'ds-lista' }); const linha = (p = {}) => { const a = h('input', { class: 'passo-acao', placeholder: tr('Ação'), maxlength: 2000, value: p.action || '', 'aria-label': tr('Ação') }); const d = h('input', { class: 'passo-dados', placeholder: tr('Dados'), maxlength: 2000, value: p.data || '', 'aria-label': tr('Dados') }); const x = h('input', { class: 'passo-esperado', placeholder: tr('Resultado esperado'), maxlength: 2000, value: p.expected_result || '', 'aria-label': tr('Resultado esperado') });
      const l = h('div', { class: 'ds-cab-acoes ds-passo-linha' }, a, d, x, h('button', { type: 'button', class: 'ds-icone-btn', 'aria-label': tr('Remover passo'), onclick: () => l.remove() }, DS.icone('fechar'))); for (const i of [a, d, x]) i.style.flex = '1'; passos.append(l); };
    for (const p of (c.steps?.length ? c.steps : [{}])) linha(p);
    const saida = h('div', { id: 'caso-ed-saida' });
    DS.modal(tr('Editar caso {id}', { id }), [h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título', titulo, { inteiro: true }), DS.campo('Tipo de execução', auto), h('span'), DS.campo('Descrição', desc, { inteiro: true }), DS.campo('Pré-condições', pre, { inteiro: true }),
      h('div', { class: 'ds-campo inteiro' }, h('span', {}, tr('Passos')), passos, h('div', {}, DS.link('Adicionar passo', () => linha({}), { seta: false })))), saida,
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('Qase {p} · confirmação nativa antes de enviar', { p: vinc(e, 'qase')?.recurso.chave })), DS.acao('Cancelar', () => abrirCaso(e, id)), DS.acao('Salvar no Qase…', async () => {
        const p = { casoId: Number(id) }; if (titulo.value !== (c.title || '')) p.titulo = titulo.value; if (desc.value !== (c.description || '')) p.descricao = desc.value; if (pre.value !== (c.preconditions || '')) p.preCondicoes = pre.value; if (auto.value !== tipo0) p.automacao = auto.value;
        const novos = [...passos.children].map((l) => ({ acao: l.querySelector('.passo-acao').value, dados: l.querySelector('.passo-dados').value, esperado: l.querySelector('.passo-esperado').value })).filter((s) => s.acao.trim());
        const antigos = (c.steps || []).map((s) => ({ acao: s.action || '', dados: s.data || '', esperado: s.expected_result || '' })); if (JSON.stringify(novos) !== JSON.stringify(antigos)) p.passos = novos;
        if (Object.keys(p).length === 1) { saida.replaceChildren(DS.alerta('Nenhuma alteração para salvar.', 'aviso')); return; }
        const r = await executarOperacao(e, 'qase.editar_caso', p); if (r?.estado === 'CONFIRMADA') { delete memoria('testes', e.id).casos; abrirCaso(e, id); } else if (r) saida.replaceChildren(painelResultado(r));
      }, { id: 'caso-ed-salvar', primaria: true }))], { tamanho: 'md' });
  }

  // ======================= Testes =======================
