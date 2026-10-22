/** Testes: formulário de suítes e lista de casos do repositório local, sem Qase conectado. */
  function formularioSuiteLocal(e, suites, atual = null, paiInicial = null) {
    const titulo = h('input', { id: 'suite-local-titulo', maxlength: 255, value: atual?.titulo || '' });
    const descricao = h('textarea', { id: 'suite-local-descricao', rows: 3, maxlength: 4000 }, atual?.descricao || '');
    const pai = h('select', { id: 'suite-local-pai', 'aria-label': tr('Suíte pai') },
      h('option', { value: '' }, tr('Raiz do projeto')), suites.filter(s => s.id !== atual?.id).map(s => h('option', { value: s.id, selected: s.id === (atual?.paiId ?? paiInicial) }, s.titulo)));
    const saida = h('div', { id: 'suite-local-saida', role: 'status', 'aria-live': 'polite' });
    const salvar = DS.acao(atual ? 'Salvar alterações' : 'Criar suíte local', async () => {
      salvar.disabled = true;
      try {
        const r = await api.suiteLocalSalvar({ espacoId: e.id, ...(atual ? { id: atual.id } : {}), titulo: titulo.value.trim(),
          descricao: descricao.value, paiId: pai.value || null });
        if (!r.ok) { saida.replaceChildren(DS.alerta(textoErro(r.error), 'falha')); return; }
        avisar(tr('Suíte salva neste computador.')); DS.fecharModal(); void mostrar('testes');
      } finally { salvar.disabled = false; }
    }, { id: 'suite-local-salvar', primaria: true });
    DS.modal(atual ? 'Editar suíte local' : 'Nova suíte local', [
      h('form', { class: 'ds-form', onsubmit: ev => ev.preventDefault() },
        DS.campo('Título', titulo, { inteiro: true }), DS.campo('Descrição', descricao, { inteiro: true }), DS.campo('Suíte pai', pai)),
      saida, DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), salvar)
    ], { tamanho: 'md', subtitulo: DS.info('Suíte exclusiva deste projeto. Nada é enviado ao Qase.', { rotulo: 'Sobre esta suíte local' }) });
    titulo.focus();
  }
  async function telaCasosLocais(e, _mem, corpo) {
    if (vinc(e, 'qase')) return; // Qase é a fonte única dos casos no modo conectado.
    const r = await api.repositorioLocal(e.id);
    const casos = r.ok ? r.data.casos : [];
    const suites = r.ok ? r.data.suites : [];
    memoriaDaTela('testes', e.id).totalCasosLocais = casos.length;
    corpo.append(DS.secao('Suítes locais', [
      DS.barra(DS.acao('Nova suíte local', () => formularioSuiteLocal(e, suites), { id: 'suite-local-nova', icone: 'mais' })),
      !r.ok ? DS.estadoTela('erro', 'Não foi possível consultar as suítes locais', r.error) :
      suites.length ? DS.tabela({ id: 'suites-locais', colunas: ['Suíte', 'Pai', 'Casos'], linhas: suites.map(s => ({
        attrs: { 'data-suite-local': s.id }, abrir: () => formularioSuiteLocal(e, suites, s), rotuloAcessivel: tr('Editar suíte local') + ' ' + s.titulo,
        celulas: [s.titulo, suites.find(p => p.id === s.paiId)?.titulo || '—', String(casos.filter(c => c.suiteLocalId === s.id).length)] })) }) :
        DS.estadoTela('vazio', 'Nenhuma suíte local', 'Crie uma suíte para organizar seus casos.', [], { compacto: true })
    ]));
    corpo.append(DS.secao('Casos do repositório local', [
      DS.info('Sem Qase vinculado: os casos ficam neste computador e pertencem somente ao projeto selecionado.'),
      !r.ok ? DS.estadoTela('erro', 'Não foi possível ler os casos locais', r.error) :
      casos.length ? DS.tabela({ id: 'casos-locais', colunas: ['Caso', 'Suíte', 'Automação', 'Passos', 'Atualizado'], linhas: casos.map(c => ({
        attrs: { 'data-caso-local': c.id }, abrir: () => abrirCasoLocal(e, c), rotuloAcessivel: tr('Abrir caso local') + ' ' + c.titulo,
        celulas: [h('span', {}, c.titulo), suites.find(s => s.id === c.suiteLocalId)?.titulo || '—', c.dados.automacao || 'manual', String(c.dados.passos?.length || 0), hora(c.atualizadaEm)] })) }) :
        DS.estadoTela('vazio', 'Nenhum caso local cadastrado', 'Use Novo caso local para criar o primeiro.', [], { compacto: true })
    ]));
  }
