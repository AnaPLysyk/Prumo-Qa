/** Execução manual: autoria local persistida e resultado explícito por caso. */
  const RESULTADOS_MANUAIS = [['PASS', 'Aprovado'], ['FAIL', 'Reprovado'], ['BLOCKED', 'Bloqueado'], ['SKIPPED', 'Pulado'], ['INVALID', 'Inválido']];
  function marcaDoAndamento(inicio, resultadoEm) {
    if (!inicio) return [];
    const ativo = !resultadoEm || Date.parse(inicio.em) > Date.parse(resultadoEm);
    return [h('span', { class: 'ds-chips', title: tr('Iniciado em') + ' ' + hora(inicio.em) }, DS.avatar(inicio.por), h('span', { class: 'ds-sub' }, inicio.por.nome), ativo ? DS.chip('Em andamento', 'info') : null)];
  }
  function listaDosCasosDaRun(e, run, inicios, recarregar, mostrarEvidencias) {
    const area = h('div');
    const statusDoCaso = c => c.resultado && c.resultado.status !== 'NOT_RUN' ? c.resultado.status : inicios.some(i => i.casoId === c.casoId) ? 'IN_PROGRESS' : 'NOT_RUN';
    const rotulos = new Map([...RESULTADOS_MANUAIS, ['IN_PROGRESS', 'Em andamento'], ['NOT_RUN', 'Ainda não testado']]);
    const filtro = h('select', { id: 'run-filtro-resultado', 'aria-label': tr('Filtrar casos por resultado'), onchange: () => desenhar() }, h('option', { value: '' }, tr('Todos os casos')), [...rotulos].map(([s, t]) => h('option', { value: s }, tr(t))));
    function desenhar() {
      const casos = run.casos.filter(c => !filtro.value || statusDoCaso(c) === filtro.value);
      area.replaceChildren(DS.tabela({ colunas: ['Caso', 'Automação', 'Resultado', 'Executado por', 'Publicado', 'Evidências'], linhas: casos.map(c => ({
        attrs: { 'data-caso': c.casoId }, abrir: () => executarCasoLocal(e, run, c, recarregar), rotuloAcessivel: tr('Executar caso {id}', { id: c.casoId }),
        celulas: [h('div', {}, String(c.casoId), h('span', { class: 'ds-sub' }, c.titulo)), c.capability || DS.chip('Manual'),
          h('div', {}, DS.chip(rotulos.get(statusDoCaso(c)) || statusDoCaso(c)), ...marcaDoAndamento(inicios.find(i => i.casoId === c.casoId), c.resultado?.em), c.resultado?.comentario ? h('span', { class: 'ds-sub' }, c.resultado.comentario) : null),
          c.resultado ? [c.resultado.por, c.resultado.origem === 'MANUAL' ? tr('Manual') : tr('Automatizado')].filter(Boolean).join(' · ') : '—',
          DS.chip(c.publicado ? 'Publicado' : 'Local'), DS.acao('Ver evidências', () => mostrarEvidencias(c), { compacto: true, icone: 'arquivo' })]
      })) }));
    }
    desenhar(); return h('div', {}, filtro, area);
  }
  async function executarCasoLocal(e, run, caso, voltar) {
    const protegido = caso.resultado?.origem === 'EXECUCAO' && caso.resultado.status !== 'NOT_RUN';
    const podeEditar = !window.PrumoConta?.soVer('testes') && !protegido;
    const iniciar = podeEditar && (!caso.resultado || caso.resultado.status === 'NOT_RUN');
    const andamentos = await chamar(() => api.runAndamento(e.id, run.id, iniciar ? caso.casoId : undefined));
    if (!andamentos) return;
    const inicio = andamentos.find(i => i.casoId === caso.casoId) || (iniciar ? andamentos[0] : null);
    let dados = {}, passos = [];
    if (caso.casoLocalId) {
      const r = await chamar(() => api.repositorioLocal(e.id));
      if (!r) return;
      dados = r.casos.find(c => c.id === caso.casoLocalId)?.dados || {};
      passos = (dados.passos || []).map(p => ({ acao: p.acao, esperado: p.esperado, dados: p.dados }));
    } else if (caso.casoId < 1e9 && vinc(e, 'qase')) {
      const r = await chamar(() => api.servicoConsultar(e.id, 'qase', 'caso', {}, String(caso.casoId)));
      if (!r) return;
      dados = { descricao: r.dados.description, preCondicoes: r.dados.preconditions };
      passos = (r.dados.steps || []).map(p => ({ acao: p.action, esperado: p.expected_result, dados: p.data }));
    }
    let status = RESULTADOS_MANUAIS.some(([s]) => s === caso.resultado?.status) ? caso.resultado.status : null;
    const comentario = h('textarea', { id: 'manual-comentario', rows: 3, maxlength: 2000, 'aria-label': tr('Resultado observado'), placeholder: tr('Descreva o resultado observado') });
    comentario.value = caso.resultado?.comentario || '';
    const erro = h('p', { role: 'alert', class: 'ds-sub' });
    const escolha = h('div', { class: 'qs-resultados', role: 'group', 'aria-label': tr('Resultado') });
    const botoes = RESULTADOS_MANUAIS.map(([s, t]) => h('button', { type: 'button', class: 'qs-resultado', 'data-status': s.toLowerCase(), disabled: !podeEditar, 'aria-pressed': String(status === s), onclick: () => { status = s; botoes.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.status === s.toLowerCase()))); salvar.disabled = false; } }, tr(t)));
    escolha.append(...botoes);
    const proximo = h('input', { type: 'checkbox', id: 'manual-proximo', checked: true });
    let salvando = false;
    const salvar = DS.acao('Salvar resultado', async () => {
      if (!status || salvando) return;
      if (!['PASS', 'SKIPPED'].includes(status) && comentario.value.trim().length < 3) { erro.textContent = tr('Descreva o que aconteceu (mínimo de 3 caracteres).'); comentario.focus(); return; }
      salvando = true; salvar.disabled = true;
      try {
        const r = await chamar(() => api.runResultado(run.id, caso.casoId, status, comentario.value));
        if (!r || r.canceled) return;
        delete memoriaDaTela('testes', e.id).runsLocais;
        const seguinte = r.run.casos.find(c => c.casoId !== caso.casoId && (!c.resultado || c.resultado.status === 'NOT_RUN') && !c.capability);
        if (proximo.checked && seguinte) await executarCasoLocal(e, r.run, seguinte, voltar);
        else await voltar();
      } finally { salvando = false; salvar.disabled = !podeEditar || !status; }
    }, { id: 'manual-salvar', primaria: true, desabilitado: !podeEditar || !status });
    DS.modal(caso.titulo, [h('div', { class: 'ds-chips' }, DS.chip('Caso ' + caso.casoId), DS.chip(caso.resultado?.status || 'Ainda não testado'), ...marcaDoAndamento(inicio, caso.resultado?.em)),
      dados.descricao ? DS.bloco('Descrição', DS.texto(dados.descricao)) : null,
      dados.preCondicoes ? DS.bloco('Pré-condições', DS.texto(dados.preCondicoes)) : null,
      passos.length ? DS.bloco('Passos', h('ol', { class: 'qs-passos' }, passos.map((p, i) => h('li', {}, h('span', {}, String(i + 1)), h('div', {}, h('strong', {}, p.acao), p.dados ? h('p', { class: 'ds-sub' }, tr('Dados: {d}', { d: p.dados })) : null, p.esperado ? h('p', { class: 'ds-sub' }, tr('Esperado: {r}', { r: p.esperado })) : null))))) : null,
      protegido ? DS.info('Este caso tem resultado de automação. Execute novamente a automação para atualizar o resultado.') : null,
      escolha, comentario, erro, h('label', { class: 'ds-chips' }, proximo, tr('Avançar para o próximo caso manual não testado')),
      DS.rodape(DS.acao('Voltar à run', voltar), salvar)], { tamanho: 'lg', subtitulo: run.titulo });
  }
