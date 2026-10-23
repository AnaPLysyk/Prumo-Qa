/** Execução manual: autoria local persistida e resultado explícito por caso, no painel lateral da página da run. */
  const RESULTADOS_MANUAIS = [['PASS', 'Aprovado'], ['FAIL', 'Reprovado'], ['BLOCKED', 'Bloqueado'], ['SKIPPED', 'Pulado'], ['INVALID', 'Inválido']];
  function marcaDoAndamento(inicio, resultadoEm) {
    if (!inicio) return [];
    const ativo = !resultadoEm || Date.parse(inicio.em) > Date.parse(resultadoEm);
    return [h('span', { class: 'ds-chips', title: tr('Iniciado em') + ' ' + hora(inicio.em) }, DS.avatar(inicio.por), h('span', { class: 'ds-sub' }, inicio.por.nome), ativo ? DS.chip('Em andamento', 'info') : null)];
  }
  /** Descrição, pré-condições e passos do caso: do repositório do Prumo ou do Qase. Devolve null quando a leitura falha (o aviso já foi mostrado). */
  async function dadosDoCasoDaRun(e, caso) {
    if (caso.casoLocalId) {
      const r = await chamar(() => api.repositorioLocal(e.id));
      if (!r) return null;
      const dados = r.casos.find(c => c.id === caso.casoLocalId)?.dados || {};
      return { dados, passos: (dados.passos || []).map(p => ({ acao: p.acao, esperado: p.esperado, dados: p.dados })) };
    }
    if (caso.casoId < 1e9 && vinc(e, 'qase')) {
      const r = await chamar(() => api.servicoConsultar(e.id, 'qase', 'caso', {}, String(caso.casoId)));
      if (!r) return null;
      return { dados: { descricao: r.dados.description, preCondicoes: r.dados.preconditions }, passos: (r.dados.steps || []).map(p => ({ acao: p.action, esperado: p.expected_result, dados: p.data })) };
    }
    return { dados: {}, passos: [] };
  }
  const blocoDoCaso = (dados, passos) => [
    dados.descricao ? DS.bloco('Descrição', DS.texto(dados.descricao)) : null,
    dados.preCondicoes ? DS.bloco('Pré-condições', DS.texto(dados.preCondicoes)) : null,
    passos.length ? DS.bloco('Passos', h('ol', { class: 'qs-passos' }, passos.map((p, i) => h('li', {}, h('span', {}, String(i + 1)), h('div', {}, h('strong', {}, p.acao), p.dados ? h('p', { class: 'ds-sub' }, tr('Dados: {d}', { d: p.dados })) : null, p.esperado ? h('p', { class: 'ds-sub' }, tr('Esperado: {r}', { r: p.esperado })) : null))))) : null];
  /** Aba Execução do painel: o caso como está (resultado atual, quem executou, descrição e passos), sem editar nada. `l` é a linha da página da run. */
  async function execucaoDoCaso(e, run, l) {
    const lido = await dadosDoCasoDaRun(e, l.c); if (!lido) return [DS.estadoTela('erro', 'Não foi possível abrir o caso', 'Tente de novo em instantes.', [], { compacto: true })];
    const r = l.c.resultado;
    return [h('div', { class: 'ds-chips' }, chipDoStatus(l.status), DS.chip(l.c.capability ? tr('Automação: {c}', { c: l.c.capability }) : 'Manual'), DS.chip(l.c.publicado ? 'Publicado' : 'Local'), ...marcaDoAndamento(l.inicio, r?.em)),
      r && r.status !== 'NOT_RUN' ? DS.bloco('Resultado', h('div', {}, h('p', {}, [r.por, r.origem === 'MANUAL' ? tr('Manual') : tr('Automatizado'), hora(r.em)].filter(Boolean).join(' · ')), r.comentario ? DS.texto(r.comentario) : null)) : DS.info('Este caso ainda não tem resultado. Use "Enviar resultado" para declarar um.'),
      ...blocoDoCaso(lido.dados, lido.passos)].filter(Boolean);
  }
  /** Formulário de resultado do caso, desenhado em `alvo`. `aoSalvar(seguinte)` recebe o próximo caso manual pendente quando a pessoa pede para avançar. */
  async function executarCasoLocal(e, run, caso, { alvo, statusInicial = null, aoSalvar }) {
    const protegido = caso.resultado?.origem === 'EXECUCAO' && caso.resultado.status !== 'NOT_RUN';
    const podeEditar = !window.PrumoConta?.soVer('testes') && !protegido;
    const iniciar = podeEditar && (!caso.resultado || caso.resultado.status === 'NOT_RUN');
    const andamentos = await chamar(() => api.runAndamento(e.id, run.id, iniciar ? caso.casoId : undefined));
    if (!andamentos) return;
    const inicio = andamentos.find(i => i.casoId === caso.casoId) || (iniciar ? andamentos[0] : null);
    const lido = await dadosDoCasoDaRun(e, caso); if (!lido) return;
    let status = statusInicial || (RESULTADOS_MANUAIS.some(([s]) => s === caso.resultado?.status) ? caso.resultado.status : null);
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
        await aoSalvar(proximo.checked ? seguinte : null);
      } finally { salvando = false; salvar.disabled = !podeEditar || !status; }
    }, { id: 'manual-salvar', primaria: true, desabilitado: !podeEditar || !status });
    alvo.replaceChildren(...[h('div', { class: 'ds-chips' }, DS.chip('Caso ' + caso.casoId), DS.chip(caso.resultado?.status || 'Ainda não testado'), ...marcaDoAndamento(inicio, caso.resultado?.em)),
      ...blocoDoCaso(lido.dados, lido.passos),
      protegido ? DS.info('Este caso tem resultado de automação. Execute novamente a automação para atualizar o resultado.') : null,
      escolha, comentario, erro, h('label', { class: 'ds-chips' }, proximo, tr('Avançar para o próximo caso manual não testado')), salvar].filter(Boolean));
  }
