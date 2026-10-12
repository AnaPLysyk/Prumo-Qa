/** Abre os detalhes de um caso Qase. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  async function abrirCaso(e, id) {
    const vq = vinc(e, 'qase'); if (!vq) { avisar(tr('Qase não vinculado a este projeto.'), true); return; }
    const carregando = DS.modal(tr('Caso {id}', { id }), DS.carregando('Consultando o Qase…'), { tamanho: 'lg' });
    const [r, runs, perm, aut] = await Promise.all([api.servicoConsultar(e.id, 'qase', 'caso', {}, String(id)), api.runs(e.id), escritaDoProjeto(e), api.espacoAutomacoes(e.id)]);
    if (carregando && !carregando.isConnected) return;
    if (!r.ok) { avisar(r.error, true); DS.modal(tr('Caso {id}', { id }), DS.estadoTela('erro', 'Não foi possível abrir o caso', r.error), { tamanho: 'md' }); return; }
    const c = r.data.dados; const esc = !!perm.qase; e = estado.espaco?.id === e.id ? estado.espaco : e;
    const locais = resultadosLocais(runs.ok ? runs.data : [], id).sort((a, b) => Date.parse(b.em) - Date.parse(a.em));
    const autos = relacoesDe(e, ['qase'], id).map((x) => outroLado(x, ['qase'], id)).filter((x) => x.tipo === 'automacao');
    const tks = [...new Set([...ticketsExternos(c), ...relacoesDe(e, ['qase'], id).map((x) => outroLado(x, ['qase'], id)).filter((x) => x.tipo === 'jira').map((x) => x.id)])];
    const passos = Array.isArray(c.steps) ? c.steps : []; const saida = h('div', { id: 'caso-saida' });
    const main = h('section', { class: 'ds-detalhe-main', id: 'caso-detalhe', 'data-caso': String(id) }, saida,
      DS.bloco('Descrição', DS.texto(c.description, 'Sem descrição.')),
      DS.bloco('Pré-condições', DS.texto(c.preconditions, 'Sem pré-condições.')),
      DS.bloco(tr('Passos ({n})', { n: passos.length }), passos.length ? DS.tabela({ colunas: ['#', 'Ação', 'Dados', 'Resultado esperado'], linhas: passos.map((p, i) => ({ celulas: [String(p.position ?? i + 1), DS.texto(p.action), p.data ? DS.texto(p.data) : '—', DS.texto(p.expected_result, '—')] })) }) : h('p', { class: 'suave' }, tr('Nenhum passo cadastrado.'))),
      c.postconditions ? DS.bloco('Pós-condições', DS.texto(c.postconditions)) : null,
      window.PrumoTestes ? window.PrumoTestes.blocoCodigoDoCaso(e, id) : null,
      DS.bloco('Resultados no Prumo', locais.length ? DS.tempo(locais.map((x) => ({ tom: DS.tom(x.status), titulo: h('span', {}, selo(x.status), ' ', x.run.titulo), sub: quando(x.em) + ' · ' + (x.origem === 'MANUAL' ? tr('declarado manualmente') : tr('execução de automação')) + (x.granularidade === 'RODADA' ? ' · ' + tr('escopo da rodada') : '') + (x.comentario ? ' · ' + x.comentario.slice(0, 160) : '') }))) : h('p', { class: 'suave' }, tr('Nenhum resultado registrado no Prumo para este caso.'))),
      DS.recolher('Dados retornados pelo Qase', h('pre', { class: 'ds-codigo' }, JSON.stringify(c, null, 2))));
    const capSel = h('select', { id: 'caso-cap', 'aria-label': tr('Automação') }, ((aut.ok && aut.data.capacidades) || []).map((x) => h('option', { value: x }, x)));
    const tkIn = h('input', { id: 'caso-ticket', class: 'ds-w-sm', placeholder: 'SMART-123', maxlength: 40, 'aria-label': tr('Ticket Jira') });
    const aside = h('aside', {}, DS.meta([['Origem', DS.origem('qase', 'Qase · ' + vq.recurso.chave)], ['Tipo de execução', chipTipoCaso(c)], ['Situação no Prumo', locais[0] ? h('span', {}, selo(locais[0].status), ' ', h('span', { class: 'suave' }, quando(locais[0].em))) : DS.chip('Sem resultado')], ['Suite', c.suite_id != null ? String(c.suite_id) : null], ['Prioridade', c.priority != null ? String(c.priority) : null], ['Severidade', c.severity != null ? String(c.severity) : null], ['Tags', (c.tags || []).map((x) => x.title || x).join(', ') || null], ['Atualizado', c.updated_at || c.updated ? quando(c.updated_at || c.updated) : null]]),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Automação relacionada')), autos.length ? h('div', { class: 'ds-celula-nos' }, autos.map((a) => noRef(e, a, a.id))) : h('p', { class: 'suave' }, tr('Nenhuma automação declarada no Prumo.')),
        h('p', { class: 'ds-nota-perm' }, DS.icone('escudo'), h('span', {}, tr('Automação vinculada não aprova o caso: só um resultado registrado comprova a execução.'))),
        capSel.options.length ? h('div', { class: 'ds-cab-acoes' }, capSel, DS.acao('Declarar', async () => { const x = await chamar(() => api.espacoAssociar(e.id, { de: { tipo: 'qase', id: String(id), vinculoId: vq.id, origem: vq.recurso.chave }, para: { tipo: 'automacao', id: capSel.value, origem: 'qa.project.json' }, justificativa: tr('Declarado pela pessoa') })); if (x) { await atualizarEspaco(e); avisar(tr('Vínculo declarado.')); abrirCaso(estado.espaco, id); } }, { id: 'caso-declarar', compacto: true })) : null),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Tickets')), tks.length ? h('div', { class: 'ds-celula-nos' }, tks.map((k) => noRef(e, { tipo: 'jira', id: k, vinculoId: vinc(e, 'jira')?.id }, k))) : h('p', { class: 'suave' }, tr('Nenhum ticket associado.')),
        h('div', { class: 'ds-cab-acoes' }, tkIn, DS.acao('Associar…', async () => { resultadoOp(saida, await executarOperacao(e, 'qase.associar_ticket', { casoId: Number(id), ticket: tkIn.value.trim().toUpperCase() })); }, { id: 'caso-associar', compacto: true, desabilitado: !esc }))),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Ações')), DS.acao('Editar caso…', () => editarCaso(e, id, c), { id: 'caso-editar', icone: 'editar', desabilitado: !esc }), !esc ? escritaDesligada('qase') : null));
    DS.modal(tr('Caso {id}', { id }) + ' · ' + (c.title || ''), h('div', { class: 'ds-detalhe' }, main, aside), { tamanho: 'lg', subtitulo: [DS.origem('qase'), chipTipoCaso(c), locais[0] ? selo(locais[0].status) : DS.chip('Não executado no Prumo')] });
  }
