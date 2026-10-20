/** Tickets: consulta, detalhe, edição e criação controlada no Jira. */
  async function avancada(e) {
    const caixa = h('div', { class: 'ds-avancada' }, DS.info('Consulta direta ao Jira vinculado: detalhe por chave, comentários e descoberta do campo de critérios de aceite.'));
    DS.modal('Consulta avançada · Jira', caixa, { tamanho: 'lg' }); await consultaManual(caixa, 'jira', { tickets: 'Tickets do projeto', ticket: 'Detalhe de ticket', campos: 'Descobrir campos de critérios de aceite', comentarios: 'Comentários de ticket' });
  }

  async function abrirTicket(e, chave) {
    const vj = vinc(e, 'jira'); if (!vj) { avisar(tr('Jira não vinculado a este projeto.'), true); return; }
    const carregando = DS.modal(chave, DS.carregando('Consultando o Jira…'), { tamanho: 'lg' });
    const consulta = (op, p = {}) => api.servicoConsultar(e.id, 'jira', op, p, chave);
    const [t, com, hist, anexos, trans, perm] = await Promise.all([consulta('ticket'), consulta('comentarios', { limite: 50 }), consulta('historico', { limite: 30 }), consulta('anexos'), consulta('transicoes'), escritaDoProjeto(e)]);
    if (carregando && !carregando.isConnected) return;
    if (!t.ok) { avisar(t.error, true); DS.modal(chave, DS.estadoTela('erro', 'Não foi possível abrir o ticket', t.error), { tamanho: 'md' }); return; }
    const d = t.data.dados, x = d.fields || {}; const esc = !!perm.jira; const resultados = h('div', { id: 'tk-resultados' });
    const criterio = vj.campoAceite ? textoExterno(x[vj.campoAceite]) : null;
    const nativos = [...(x.subtasks || []).map((s) => ['Subtarefa', s.key]), x.parent ? ['Pai', x.parent.key] : null, ...(x.issuelinks || []).map((l) => [l.type?.name || 'Vínculo', l.inwardIssue?.key || l.outwardIssue?.key])].filter((p) => p && p[1]);
    const comentarios = com.ok ? com.data.dados : [];
    const caixaTexto = h('textarea', { id: 'tk-comentario', rows: 3, maxlength: 4000, disabled: !esc, placeholder: tr(esc ? 'Escreva um comentário' : 'Escrita no Jira desligada') });
    const trSel = h('select', { id: 'tk-transicao', 'aria-label': tr('Transição'), disabled: !esc || !(trans.ok && trans.data.dados.length) }, (trans.ok ? trans.data.dados : []).map((z) => h('option', { value: z.id }, z.nome + (z.para ? ' → ' + z.para : ''))));
    const main = h('section', { class: 'ds-detalhe-main', id: 'tk-painel', 'data-ticket': chave }, resultados,
      DS.bloco('Descrição', DS.texto(textoExterno(x.description), 'Sem descrição.')),
      DS.bloco('Critérios de aceite', criterio ? DS.texto(criterio) : h('p', { class: 'suave' }, tr('Campo de critérios não configurado para este projeto (Consulta avançada › Descobrir campos).'))),
      nativos.length ? DS.bloco('Relações no Jira', h('div', { class: 'ds-celula-nos' }, nativos.map(([rot, k]) => noRef(e, { tipo: 'jira', id: k, vinculoId: vj.id }, tr(rot) + ' ' + k)))) : null,
      blocoRelacoes(e, ['jira', 'jira-bug'], chave),
      DS.bloco(tr('Comentários ({n})', { n: comentarios.length }), comentarios.length ? h('ul', { class: 'ds-lista' }, comentarios.map((c) => h('li', { class: 'ds-comentario' }, h('span', { class: 'ds-avatar', 'aria-hidden': 'true' }, DS.iniciais(c.author?.displayName)), h('div', {}, h('strong', {}, c.author?.displayName || tr('Autor não informado')), c.updated || c.created ? h('span', { class: 'ds-sub' }, hora(c.updated || c.created)) : null, DS.texto(textoExterno(c.body)))))) : h('p', { class: 'suave' }, com.ok ? tr('Nenhum comentário.') : tr('Comentários indisponíveis: {e}', { e: com.error })),
        h('div', { class: 'ds-campo ds-mt' }, caixaTexto), h('div', { class: 'ds-cab-acoes ds-mt' }, DS.acao('Comentar…', async () => { resultadoOp(resultados, await executarOperacao(e, 'jira.comentar', { ticket: chave, texto: caixaTexto.value })); }, { id: 'tk-comentar', desabilitado: !esc }), !esc ? escritaDesligada('jira') : null)),
      DS.recolher(tr('Histórico de alterações ({n})', { n: hist.ok ? hist.data.dados.length : 0 }), hist.ok ? (hist.data.dados.length ? DS.tempo(hist.data.dados.map((z) => ({ titulo: z.mudancas.map((m) => `${m.campo}: ${m.de ?? '—'} → ${m.para ?? '—'}`).join('; '), sub: hora(z.em) + ' · ' + (z.por || '—') }))) : h('p', { class: 'suave' }, tr('Sem alterações registradas.'))) : h('p', { class: 'suave' }, tr('Indisponível: {e}', { e: hist.error }))),
      DS.bloco(tr('Anexos ({n})', { n: anexos.ok ? anexos.data.dados.length : 0 }), anexos.ok && anexos.data.dados.length ? h('div', { class: 'ds-arquivos' }, anexos.data.dados.map((a) => h('div', { class: 'ds-arquivo' }, h('span', { class: 'ds-arquivo-ic' }, DS.icone(/^image\//.test(a.tipo || '') ? 'imagem' : /^video\//.test(a.tipo || '') ? 'video' : 'arquivo')), h('div', {}, h('strong', {}, a.nome), h('span', { class: 'ds-sub' }, (a.bytes != null ? bytes(a.bytes) : '') + (a.em ? ' · ' + hora(a.em) : '')))))) : h('p', { class: 'suave' }, anexos.ok ? tr('Nenhum anexo.') : tr('Anexos indisponíveis: {e}', { e: anexos.error })),
        h('div', { class: 'ds-cab-acoes ds-mt' }, DS.acao('Anexar arquivo…', async () => { resultadoOp(resultados, await executarOperacao(e, 'jira.anexar', { ticket: chave }, { tipo: 'arquivo' })); }, { id: 'tk-anexar', icone: 'clipe', desabilitado: !esc }))));
    const aside = h('aside', {}, DS.meta([['Origem', DS.origem('jira', 'Jira · ' + vj.recurso.chave)], ['Tipo', x.issuetype?.name], ['Status', x.status?.name ? DS.chip(x.status.name, tomStatusJira(x.status)) : null], ['Prioridade', x.priority?.name], ['Responsável', x.assignee?.displayName || tr('Não atribuído')], ['Relator', x.reporter?.displayName], ['Atualizado', x.updated ? hora(x.updated) : null], ['Consultado', hora(t.data.consultadoEm)]]),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Ações')),
        trSel.options.length ? DS.campo('Mudar status', trSel) : h('p', { class: 'suave' }, trans.ok ? tr('Nenhuma transição disponível para este ticket.') : tr('Transições indisponíveis agora; tente de novo em instantes.')), trSel.options.length ? DS.acao('Aplicar transição…', async () => { const r = await executarOperacao(e, 'jira.transicionar', { ticket: chave, transicaoId: trSel.value }); if (r?.estado === 'CONFIRMADA') void abrirTicket(e, chave); else resultadoOp(resultados, r); }, { id: 'tk-transicionar', desabilitado: !esc || trSel.disabled }) : null,
        DS.acao('Editar resumo e descrição…', () => editarTicket(e, chave, x), { id: 'tk-editar', icone: 'editar', desabilitado: !esc }),
        DS.acao('Preparar bug relacionado…', () => abrirCriar(e, { origem: chave }), { id: 'tk-bug', icone: 'alerta' }),
        DS.acao('Importar como contexto', async () => { const r = await chamar(() => api.servicoImportar(e.id, chave)); if (r && !r.canceled) avisar(tr('Contexto importado como RASCUNHO.')); }, { id: 'tk-importar' }),
        !esc ? escritaDesligada('jira') : null));
    DS.modal(chave + ' · ' + (x.summary || ''), h('div', { class: 'ds-detalhe' }, main, aside), { tamanho: 'lg', subtitulo: [DS.origem('jira'), x.issuetype?.name ? DS.chip(x.issuetype.name) : null, x.status?.name ? DS.chip(x.status.name, tomStatusJira(x.status)) : null, x.priority?.name ? DS.chip(tr('Prioridade {p}', { p: x.priority.name })) : null] });
  }
  function editarTicket(e, chave, x) {
    const resumo = h('input', { id: 'tk-ed-resumo', maxlength: 255, value: x.summary || '' }); const desc = h('textarea', { id: 'tk-ed-descricao', rows: 10, maxlength: 8000 }); desc.value = textoExterno(x.description);
    const saida = h('div', { id: 'tk-ed-saida' }); const r0 = resumo.value, d0 = desc.value;
    DS.modal(tr('Editar {k}', { k: chave }), [h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Resumo', resumo, { inteiro: true }), DS.campo('Descrição', desc, { inteiro: true, ajuda: 'Texto simples. O Jira converte para o formato do ticket; segredos são mascarados.' })), saida,
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('A alteração é enviada após a confirmação nativa.')), DS.acao('Cancelar', () => abrirTicket(e, chave)), DS.acao('Salvar no Jira…', async () => {
        const p = { ticket: chave }; if (resumo.value !== r0) p.resumo = resumo.value; if (desc.value !== d0) p.descricao = desc.value;
        if (Object.keys(p).length === 1) { saida.replaceChildren(DS.alerta('Nenhuma alteração para salvar.', 'aviso')); return; }
        const r = await executarOperacao(e, 'jira.editar', p); if (r?.estado === 'CONFIRMADA') void abrirTicket(e, chave); else if (r) saida.replaceChildren(painelResultado(r));
      }, { id: 'tk-ed-salvar', primaria: true }))], { tamanho: 'md' });
    resumo.focus();
  }
  /** Novo ticket no Jira. Com `defeito`, registra o vínculo Defeito Qase → ticket após a criação confirmada (sem duplicar). */
  async function abrirCriar(e, { origem = '', resumo = '', descricao = '', defeito = null } = {}) {
    const vj = vinc(e, 'jira'), vq = vinc(e, 'qase'); if (!vj) { avisar(tr('Jira não vinculado a este projeto.'), true); return; }
    const perm = await escritaDoProjeto(e); const esc = !!perm.jira; const m = await tiposJira(e);
    const preferido = (m.tipos.find((t) => /bug|defeito/i.test(t.nome)) || m.tipos[0])?.id;
    const tipo = h('select', { id: 'tk-novo-tipo' }, m.tipos.map((t) => h('option', { value: t.id, selected: (origem || defeito) ? t.id === preferido : false }, t.nome)));
    const res = h('input', { id: 'tk-novo-resumo', maxlength: 255, value: resumo }); const desc = h('textarea', { id: 'tk-novo-descricao', rows: 7, maxlength: 8000 }); desc.value = descricao;
    const org = h('input', { id: 'tk-novo-origem', value: origem, maxlength: 40, placeholder: 'SMART-123' }); const rot = h('input', { id: 'tk-novo-rotulos', value: 'prumo-qa', maxlength: 200 });
    const saida = h('div', { id: 'tk-novo-saida', 'aria-live': 'polite' });
    DS.modal(defeito ? tr('Novo ticket a partir do defeito {id}', { id: defeito.id }) : 'Novo ticket no Jira', [
      !esc ? DS.alerta('Escrita no Jira desligada. Habilite em Conexões para criar tickets.', 'aviso', 'cadeado') : null,
      m.erro ? DS.alerta(tr('Tipos de ticket indisponíveis: {e}', { e: m.erro }), 'falha') : null,
      h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Tipo de ticket', tipo), DS.campo('Ticket de origem (opcional)', org), DS.campo('Resumo', res, { inteiro: true }), DS.campo('Descrição', desc, { inteiro: true }), DS.campo('Rótulos (separados por vírgula)', rot, { inteiro: true })), saida,
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('{p} · confirmação nativa antes de enviar', { p: 'Jira ' + vj.recurso.chave })), DS.acao('Cancelar', () => DS.fecharModal(), { id: 'tk-novo-cancelar' }), DS.acao('Revisar e criar…', async () => {
        const p = { tipoId: tipo.value, resumo: res.value, descricao: desc.value, rotulos: rot.value.split(/[,\s]+/).filter(Boolean), ...(org.value.trim() ? { origem: org.value.trim().toUpperCase() } : {}) };
        const r = await executarOperacao(e, 'jira.criar_ticket', p); if (!r) return; saida.replaceChildren(painelResultado(r));
        if (r.estado === 'CONFIRMADA' && defeito && vq && r.remoto?.chave) {
          const a = await api.espacoAssociar(e.id, { de: { tipo: 'qase-defeito', id: String(defeito.id), vinculoId: vq.id, origem: vq.recurso.chave }, para: { tipo: 'jira-bug', id: r.remoto.chave, vinculoId: vj.id, origem: vj.recurso.chave }, justificativa: tr('Ticket aberto no Prumo a partir do defeito Qase {id}', { id: defeito.id }) });
          saida.append(a.ok || /TRACE_DUPLICATE/.test(a.error || '') ? DS.alerta(tr('Vínculo registrado: Defeito Qase {d} → {k}.', { d: defeito.id, k: r.remoto.chave }), 'ok') : DS.alerta(tr('Ticket criado, mas o vínculo não foi registrado: {e}', { e: a.error }), 'falha'));
          await atualizarEspaco(e);
        }
      }, { id: 'tk-novo-criar', primaria: true, desabilitado: !esc || !m.tipos.length }))], { tamanho: 'md' });
  }
