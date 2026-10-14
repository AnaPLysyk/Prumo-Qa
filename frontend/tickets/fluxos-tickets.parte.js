/** Reúne trecho visual da função tickets para o bundle fluxos-v40. */
  async function tiposJira(e) {
    const m = memoria('jira-meta', e.id);
    if (!m.tipos) { const r = await api.servicoConsultar(e.id, 'jira', 'metadados'); m.tipos = r.ok ? (r.data.dados || []).filter((t) => !t.subtarefa) : []; m.erro = r.ok ? null : r.error; }
    return m;
  }
  abas.tickets = async (el) => {
    const e = estado.espaco; if (!e) return el.append(...semProjetoDS('Tickets'));
    const vj = vinc(e, 'jira'), vq = vinc(e, 'qase');
    const perm = await escritaDoProjeto(e); const escJira = !!perm.jira;
    const mem = memoria('tickets', e.id); const f = (mem.filtros ||= { q: '', origem: '', tipo: '', status: '', desde: '', ate: '' });
    const fontesCab = [vj && DS.origem('jira', 'Jira · ' + vj.recurso.chave), vq && DS.origem('qase', 'Qase · ' + vq.recurso.chave), DS.origem('prumo', tr('Locais (Prumo)')),
      vj && !escJira ? h('span', { class: 'ds-chip', 'data-escrita-desligada': 'jira', title: tr('Escrita no Jira desligada. Habilite em Conexões.') }, tr('Jira somente leitura')) : null].filter(Boolean);
    const contagem = h('span');
    const cab = DS.cabecalho({ titulo: 'Tickets', contagem: 0, idContagem: 'tk-contagem', descricao: fontesCab.some((x) => x.hasAttribute('data-escrita-desligada')) ? [h('span', { class: 'ds-chips' }, fontesCab.filter((x) => x.hasAttribute('data-escrita-desligada')))] : null,
      acoes: [vj && DS.acao('Consulta avançada', () => avancada(e), { id: 'tk-avancada', icone: 'filtro' }), DS.acao('Novo ticket local', () => abrirLocalNovo(e, () => buscar()), { id: 'tk-novo-local', icone: 'mais', primaria: !vj }), vj && DS.acao('Novo ticket', () => abrirCriar(e, {}), { id: 'tk-novo', primaria: true, icone: 'mais' })] });
    void contagem;
    const q = DS.busca({ id: 'tk-q', placeholder: 'Buscar por chave ou texto', valor: f.q, aoEnter: () => buscar() });
    const origem = DS.selecao({ id: 'tk-origem', rotulo: 'Origem', opcoes: [['', 'Todas as origens'], vj ? ['jira', 'Jira'] : null, vq ? ['qase', 'Defeitos Qase'] : null, ['prumo', 'Locais (Prumo)']].filter(Boolean), valor: f.origem, aoMudar: () => { tipo.disabled = origem.value === 'qase' || origem.value === 'prumo'; } });
    const tipo = DS.selecao({ id: 'tk-tipo', rotulo: 'Tipo', opcoes: [['', 'Todos os tipos']], valor: '' });
    const status = h('input', { id: 'tk-status', placeholder: tr('Status'), 'aria-label': tr('Status'), list: 'tk-status-opcoes', maxlength: 60, value: f.status, autocomplete: 'off' });
    const sugestoes = h('datalist', { id: 'tk-status-opcoes' });
    const desde = h('input', { id: 'tk-desde', type: 'date', 'aria-label': tr('Atualizado desde'), value: f.desde }); const ate = h('input', { id: 'tk-ate', type: 'date', 'aria-label': tr('Atualizado até'), value: f.ate });
    for (const c of [status, desde, ate]) c.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); void buscar(); } });
    const fontes = h('div', { class: 'ds-fontes', id: 'tk-fontes', 'aria-live': 'polite' }); const lista = h('div', { id: 'tk-lista' });
    el.append(cab, DS.barra(q.no, origem, vj ? tipo : null, status, sugestoes, h('span', { class: 'ds-periodo' }, tr('Atualizado'), desde, tr('até'), ate), DS.acao('Buscar', () => buscar(), { id: 'tk-buscar', icone: 'busca' })), fontes, lista);
    if (origem) tipo.disabled = origem.value === 'qase' || origem.value === 'prumo';
    if (vj) void tiposJira(e).then((m) => { for (const t of m.tipos) tipo.append(h('option', { value: t.nome, selected: t.nome === f.tipo }, t.nome)); });

    const lerFiltros = () => { f.q = q.input.value.trim(); f.origem = origem.value || ''; f.tipo = tipo.value; f.status = status.value.trim(); f.desde = desde.value; f.ate = ate.value; };
    async function consultarJira(pagina) {
      const fj = {}; for (const k of ['q', 'tipo', 'status', 'desde', 'ate']) if (f[k]) fj[k] = f[k];
      const r = await api.servicoConsultar(e.id, 'jira', 'tickets', pagina, undefined, fj);
      if (!r.ok) { avisar(r.error, true); return { erro: r.error }; }
      return { itens: r.data.dados || [], proxima: r.data.proxima, em: r.data.consultadoEm, origem: r.data.origem };
    }
    async function consultarQase(offset) {
      const r = await api.servicoConsultar(e.id, 'qase', 'defeitos', { offset, limite: 25 });
      if (!r.ok) { avisar(r.error, true); return { erro: r.error }; }
      return { itens: r.data.dados || [], proxima: r.data.proxima, em: r.data.consultadoEm, origem: r.data.origem };
    }
    async function buscar() {
      if (desde.value && ate.value && desde.value > ate.value) { avisar(tr('A data inicial deve ser anterior à data final.'), true); return; }
      lerFiltros(); const versao = (mem.versao = (mem.versao || 0) + 1);
      lista.replaceChildren(DS.esqueleto(6)); lista.setAttribute('aria-busy', 'true'); fontes.replaceChildren(h('span', { role: 'status' }, h('span', { class: 'ds-giro' }), tr('Consultando…')));
      const [jira, qase, locais] = await Promise.all([vj && f.origem !== 'qase' && f.origem !== 'prumo' ? consultarJira({ offset: 0, limite: 25 }) : null, vq && f.origem !== 'jira' && f.origem !== 'prumo' ? consultarQase(0) : null, !f.origem || f.origem === 'prumo' ? carregarLocais(e) : null]);
      if (versao !== mem.versao) return;
      mem.jira = jira; mem.qase = qase; mem.locais = locais; mem.carregado = true; desenhar();
    }
    async function maisJira() { const r = await consultarJira(typeof mem.jira.proxima === 'string' ? { cursor: mem.jira.proxima, limite: 25 } : { offset: mem.jira.proxima, limite: 25 }); if (r.erro) return; mem.jira = { ...r, itens: mem.jira.itens.concat(r.itens) }; desenhar(); }
    async function maisQase() { const r = await consultarQase(mem.qase.proxima); if (r.erro) return; mem.qase = { ...r, itens: mem.qase.itens.concat(r.itens) }; desenhar(); }
    function linhasTabela() {
      const L = []; const st = f.status.toLowerCase(); const qq = f.q.toLowerCase();
      for (const i of mem.jira?.itens || []) { const x = i.fields || {}; const n = relacoesDe(e, ['jira', 'jira-bug'], i.key).length;
        L.push({ ordem: Date.parse(x.updated || 0) || 0, attrs: { 'data-ticket': i.key, 'data-origem': 'jira' }, abrir: () => abrirTicket(e, i.key), rotuloAcessivel: null,
          celulas: [DS.origem('jira'), { no: i.key, classe: 'ds-id' }, h('span', { class: 'ds-resumo-texto' }, x.summary || '—'), x.issuetype?.name ? DS.chip(x.issuetype.name) : '—', x.status?.name ? DS.chip(x.status.name, tomStatusJira(x.status)) : '—', x.priority?.name || '—', vj.recurso.chave, { no: quando(x.updated), classe: 'ds-nowrap' }, n ? DS.chip(tr('{n} vínculo(s)', { n }), 'info') : '—'] }); }
      for (const p of mem.locais?.itens || []) {
        const chave = p.remoto?.chave || ('LOCAL-' + p.id.slice(0, 6).toUpperCase()); const estadoTxt = p.estado === 'VINCULADA' ? tr('Vinculada') : p.estado === 'PUBLICADA' ? tr('Publicada') : tr('Local');
        if (st && !estadoTxt.toLowerCase().includes(st)) continue; if (qq && !(chave + ' ' + p.titulo).toLowerCase().includes(qq)) continue;
        L.push({ ordem: Date.parse(p.atualizadaEm || 0) || 0, attrs: { 'data-local': p.id, 'data-origem': 'prumo' }, abrir: () => abrirLocal(e, p, () => buscar()), rotuloAcessivel: null,
          celulas: [h('span', { class: 'ds-chips' }, DS.origem('prumo', 'Prumo'), DS.chip(origemDoLocal(p))), { no: chave, classe: 'ds-id' }, h('span', { class: 'ds-resumo-texto' }, p.titulo), DS.chip(rotuloClassificacao(p.dados.classificacao)), DS.chip(estadoTxt, p.estado === 'RASCUNHO' || p.estado === 'REVISADA' ? 'aviso' : 'ok'), '—', '—', { no: quando(p.atualizadaEm), classe: 'ds-nowrap' }, p.falhaDeOrigem ? DS.chip(tr('Falha do caso {c}', { c: p.falhaDeOrigem.casoId }), 'info') : '—'] });
      }
      for (const d of mem.qase?.itens || []) {
        if (st && !String(d.status ?? '').toLowerCase().includes(st)) continue; if (qq && !(String(d.id) + ' ' + (d.title || '')).toLowerCase().includes(qq)) continue;
        const n = relacoesDe(e, ['qase-defeito'], d.id).length;
        L.push({ ordem: Date.parse(d.updated_at || 0) || 0, attrs: { 'data-defeito': String(d.id), 'data-origem': 'qase' }, abrir: () => abrirDefeito(e, d.id), rotuloAcessivel: null,
          celulas: [DS.origem('qase'), { no: vq.recurso.chave + '-' + d.id, classe: 'ds-id' }, h('span', { class: 'ds-resumo-texto' }, d.title || '—'), DS.chip('Defeito'), d.status != null ? DS.chip(String(d.status), d.status === 'resolved' ? 'ok' : d.status === 'open' ? 'aviso' : null) : '—', d.severity != null ? String(d.severity) : '—', vq.recurso.chave, { no: quando(d.updated_at), classe: 'ds-nowrap' }, n ? DS.chip(tr('{n} vínculo(s)', { n }), 'info') : '—'] });
      }
      return L.sort((a, b) => b.ordem - a.ordem);
    }
    function linhaFonte(servico, r, mais) {
      if (!r) return null; const nome = servico === 'jira' ? 'Jira' : 'Qase';
      if (r.erro) return h('span', { role: 'status', 'data-fonte': servico }, DS.origem(servico, nome), ' ', DS.chip(r.erro, 'falha'));
      return h('span', { role: 'status', 'data-fonte': servico }, DS.origem(servico, nome), tr(servico === 'jira' ? '{n} ticket(s) · consultado {q}' : '{n} defeito(s) · consultado {q}', { n: r.itens.length, q: quando(r.em) }), r.proxima !== null && r.proxima !== undefined ? DS.link('Carregar mais', mais, { id: 'tk-mais-' + servico, seta: false }) : null);
    }
    function desenhar() {
      lista.setAttribute('aria-busy', 'false');
      fontes.replaceChildren(...[linhaFonte('jira', mem.jira, maisJira), linhaFonte('qase', mem.qase, maisQase), mem.locais ? h('span', { role: 'status', 'data-fonte': 'prumo' }, DS.origem('prumo', 'Prumo'), tr('{n} ticket(s) local(is) neste computador', { n: mem.locais.itens.length })) : null].filter(Boolean));
      sugestoes.replaceChildren(...[...new Set((mem.jira?.itens || []).map((i) => i.fields?.status?.name).filter(Boolean))].map((s) => h('option', { value: s })));
      const L = linhasTabela(); const n = cab.querySelector('#tk-contagem'); if (n) n.textContent = String(L.length);
      const erros = [mem.jira?.erro, mem.qase?.erro].filter(Boolean);
      if (!L.length) { lista.replaceChildren(erros.length && erros.length === [mem.jira, mem.qase, mem.locais].filter(Boolean).length ? DS.estadoTela('erro', 'Não foi possível consultar as fontes', erros.join(' · '), [DS.acao('Tentar novamente', () => buscar())])
        : DS.estadoTela('vazio', 'Nenhum ticket encontrado', mem.qase && !mem.qase.erro && !mem.qase.itens.length && !mem.jira ? 'Nenhum defeito retornado pelo Qase.' : 'Ajuste os filtros ou a origem e busque novamente. Falhas de runs e tickets criados à mão aparecem em Locais (Prumo).')); return; }
      lista.replaceChildren(DS.tabela({ id: 'tk-tabela', colunas: ['Origem', 'ID', 'Resumo', 'Tipo', 'Status', { t: 'Prioridade', classe: 'ds-opcional' }, { t: 'Projeto', classe: 'ds-opcional' }, 'Atualização', { t: 'Vínculos', classe: 'ds-opcional' }], linhas: L }));
    }
    if (mem.carregado) void desenhar(); else void buscar();
  };

  // ======================= Tickets locais (Prumo) =======================
  // Rascunho de bug/melhoria guardado só neste computador: nasce de uma falha de run ou é criado à mão, sem Jira. Pode ser vinculado a um ticket
  // existente (o Prumo só guarda a chave) ou publicado no Jira com confirmação. Nada vai ao Jira sem a pessoa decidir.
  const classificacoesFalha = [['PRODUTO', 'Bug de produto'], ['OUTRO_BUG', 'Outro bug'], ['MELHORIA', 'Melhoria']];
  const rotuloClassificacao = (c) => tr((classificacoesFalha.find((x) => x[0] === c) || [0, 'Sem classificação'])[1]);
  async function carregarLocais(e) {
    const r = await api.propostas(e.id); if (!r.ok) return { erro: r.error, itens: [] };
    return { itens: (r.data || []).filter((p) => p.tipo === 'bug' && p.estado !== 'DESCARTADA') };
  }
  // Como o ticket local nasceu: de uma falha de run, sugerido por IA ou criado à mão.
  const origemDoLocal = (p) => (p.falhaDeOrigem ? tr('Falha de run') : p.origem === 'IA' ? tr('Sugerido por IA') : tr('Manual'));
  function selecaoClassificacao(id, valor) { return h('select', { id }, classificacoesFalha.map(([v, t]) => h('option', { value: v, selected: v === valor }, tr(t)))); }
  async function abrirLocalNovo(e, aoCriar) {
    const rs = await api.runs(e.id); const falhas = [];
    for (const r of rs.ok ? rs.data : []) for (const c of r.casos.filter((x) => x.resultado?.status === 'FAIL')) falhas.push({ runLocalId: r.id, casoId: c.casoId, rotulo: `${r.titulo} · ${c.casoId} · ${c.titulo}` });
    const cls = selecaoClassificacao('tkl-classificacao', 'PRODUTO'); const res = h('input', { id: 'tkl-resumo', maxlength: 255 }); const desc = h('textarea', { id: 'tkl-descricao', rows: 7, maxlength: 8000 });
    const falha = h('select', { id: 'tkl-falha' }, h('option', { value: '' }, tr('Sem falha de origem')), falhas.map((x, i) => h('option', { value: String(i) }, x.rotulo)));
    const saida = h('div', { id: 'tkl-saida', 'aria-live': 'polite' });
    DS.modal('Novo ticket local', [DS.info('Fica só neste computador, sem Jira. Depois você pode vinculá-lo a um ticket existente ou publicá-lo no Jira.'),
      h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Classificação', cls), DS.campo('Resumo', res, { inteiro: true }), DS.campo('Descrição', desc, { inteiro: true }), DS.campo('Falha de origem (opcional)', falha, { inteiro: true })), saida,
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Salvar ticket local', async () => {
        const o = falha.value === '' ? undefined : falhas[Number(falha.value)]; const dados = { classificacao: cls.value, resumo: res.value, descricao: desc.value, rotulos: ['prumo-qa'] };
        const r = await api.propostaCriar(e.id, 'bug', dados, '', '', o ? { runLocalId: o.runLocalId, casoId: o.casoId } : undefined);
        if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } avisar(tr('Ticket local salvo. Nada foi enviado ao Jira.')); DS.fecharModal(); aoCriar();
      }, { id: 'tkl-salvar', primaria: true }))], { tamanho: 'md' });
    res.focus();
  }
  async function abrirLocal(e, p, aoMudar) {
    const vj = vinc(e, 'jira'); const perm = await escritaDoProjeto(e); const aberta = p.estado === 'RASCUNHO' || p.estado === 'REVISADA';
    const chave = h('input', { id: 'tkl-chave', maxlength: 40, placeholder: 'SMART-123', 'aria-label': tr('Ticket existente') }); const cls = selecaoClassificacao('tkl-nova-classificacao', p.dados.classificacao); const saida = h('div', { id: 'tkl-detalhe-saida', 'aria-live': 'polite' });
    const fecharEMudar = () => { DS.fecharModal(); aoMudar(); };
    const publicar = async () => {
      let tipoId; if (!p.dados.tipoId) { const m = await tiposJira(e); const preferido = p.dados.classificacao === 'MELHORIA' ? m.tipos.find((t) => /melhoria|improvement|story|hist/i.test(t.nome)) : m.tipos.find((t) => /bug|defeito/i.test(t.nome)); tipoId = (preferido || m.tipos[0])?.id; }
      const r = await api.propostaPublicar(p.id, tipoId); if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } if (r.data.canceled) return;
      if (r.data.estado === 'CONFIRMADA') { avisar(tr('Ticket publicado no Jira.')); fecharEMudar(); } else saida.replaceChildren(DS.alerta(tr('Publicação não confirmada: {e}', { e: r.data.erro || r.data.estado }), 'falha'));
    };
    DS.modal(p.titulo, h('div', { class: 'ds-detalhe' }, h('section', { class: 'ds-detalhe-main', id: 'tkl-painel', 'data-local': p.id },
      DS.bloco('Descrição', DS.texto(p.dados.descricao, 'Sem descrição.')),
      p.falhaDeOrigem ? DS.bloco('Falha de origem', h('p', {}, tr('Caso {c} da run local {r}.', { c: p.falhaDeOrigem.casoId, r: p.falhaDeOrigem.runLocalId.slice(0, 8) }))) : null,
      p.remoto?.chave ? DS.bloco(p.estado === 'VINCULADA' ? 'Ticket vinculado' : 'Ticket publicado', h('p', {}, p.remoto.chave, p.remoto.url ? ' · ' + p.remoto.url : '')) : null,
      aberta ? DS.bloco('Vincular a um ticket que já existe', [h('p', { class: 'suave' }, tr('Informe a chave do ticket. O Prumo guarda o vínculo, sem consultar nem alterar o Jira.')), h('div', { class: 'ds-cab-acoes' }, chave, DS.acao('Vincular', async () => { const r = await api.propostaVincular(p.id, chave.value); if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } avisar(tr('Ticket local vinculado a {k}.', { k: r.data.remoto.chave })); await atualizarEspaco(e); fecharEMudar(); }, { id: 'tkl-vincular', primaria: true }))]) : null, saida),
      h('aside', {}, DS.meta([['Origem', DS.origem('prumo', 'Prumo · neste computador')], ['Como nasceu', origemDoLocal(p)], ['Classificação', rotuloClassificacao(p.dados.classificacao)], ['Estado', p.estado === 'VINCULADA' ? tr('Vinculada') : p.estado === 'PUBLICADA' ? tr('Publicada') : tr('Local, sem integração')], ['Criado', quando(p.criadaEm)]]),
        aberta ? h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Ações')), DS.campo('Classificação', cls),
          DS.acao('Salvar classificação', async () => { const r = await api.propostaEditar(p.id, { ...p.dados, classificacao: cls.value }); if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } avisar(tr('Classificação atualizada.')); fecharEMudar(); }, { id: 'tkl-classificar' }),
          DS.acao('Publicar no Jira…', publicar, { id: 'tkl-publicar', desabilitado: !vj || !perm.jira, titulo: !vj ? 'Vincule o Jira em Conexões para publicar.' : !perm.jira ? 'Escrita no Jira desligada.' : null }),
          DS.acao('Descartar', async () => { const r = await api.propostaDescartar(p.id); if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } fecharEMudar(); }, { id: 'tkl-descartar' })) : null)),
    { tamanho: 'lg', subtitulo: [DS.origem('prumo'), DS.chip(origemDoLocal(p)), DS.chip(rotuloClassificacao(p.dados.classificacao))] });
  }

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
      DS.bloco(tr('Comentários ({n})', { n: comentarios.length }), comentarios.length ? h('ul', { class: 'ds-lista' }, comentarios.map((c) => h('li', { class: 'ds-comentario' }, h('span', { class: 'ds-avatar', 'aria-hidden': 'true' }, DS.iniciais(c.author?.displayName)), h('div', {}, h('strong', {}, c.author?.displayName || tr('Autor não informado')), c.updated || c.created ? h('span', { class: 'ds-sub' }, quando(c.updated || c.created)) : null, DS.texto(textoExterno(c.body)))))) : h('p', { class: 'suave' }, com.ok ? tr('Nenhum comentário.') : tr('Comentários indisponíveis: {e}', { e: com.error })),
        h('div', { class: 'ds-campo ds-mt' }, caixaTexto), h('div', { class: 'ds-cab-acoes ds-mt' }, DS.acao('Comentar…', async () => { resultadoOp(resultados, await executarOperacao(e, 'jira.comentar', { ticket: chave, texto: caixaTexto.value })); }, { id: 'tk-comentar', desabilitado: !esc }), !esc ? escritaDesligada('jira') : null)),
      DS.recolher(tr('Histórico de alterações ({n})', { n: hist.ok ? hist.data.dados.length : 0 }), hist.ok ? (hist.data.dados.length ? DS.tempo(hist.data.dados.map((z) => ({ titulo: z.mudancas.map((m) => `${m.campo}: ${m.de ?? '—'} → ${m.para ?? '—'}`).join('; '), sub: quando(z.em) + ' · ' + (z.por || '—') }))) : h('p', { class: 'suave' }, tr('Sem alterações registradas.'))) : h('p', { class: 'suave' }, tr('Indisponível: {e}', { e: hist.error }))),
      DS.bloco(tr('Anexos ({n})', { n: anexos.ok ? anexos.data.dados.length : 0 }), anexos.ok && anexos.data.dados.length ? h('div', { class: 'ds-arquivos' }, anexos.data.dados.map((a) => h('div', { class: 'ds-arquivo' }, h('span', { class: 'ds-arquivo-ic' }, DS.icone(/^image\//.test(a.tipo || '') ? 'imagem' : /^video\//.test(a.tipo || '') ? 'video' : 'arquivo')), h('div', {}, h('strong', {}, a.nome), h('span', { class: 'ds-sub' }, (a.bytes != null ? bytes(a.bytes) : '') + (a.em ? ' · ' + quando(a.em) : '')))))) : h('p', { class: 'suave' }, anexos.ok ? tr('Nenhum anexo.') : tr('Anexos indisponíveis: {e}', { e: anexos.error })),
        h('div', { class: 'ds-cab-acoes ds-mt' }, DS.acao('Anexar arquivo…', async () => { resultadoOp(resultados, await executarOperacao(e, 'jira.anexar', { ticket: chave }, { tipo: 'arquivo' })); }, { id: 'tk-anexar', icone: 'clipe', desabilitado: !esc }))));
    const aside = h('aside', {}, DS.meta([['Origem', DS.origem('jira', 'Jira · ' + vj.recurso.chave)], ['Tipo', x.issuetype?.name], ['Status', x.status?.name ? DS.chip(x.status.name, tomStatusJira(x.status)) : null], ['Prioridade', x.priority?.name], ['Responsável', x.assignee?.displayName || tr('Não atribuído')], ['Relator', x.reporter?.displayName], ['Atualizado', x.updated ? quando(x.updated) : null], ['Consultado', quando(t.data.consultadoEm)]]),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Ações')),
        trSel.options.length ? DS.campo('Mudar status', trSel) : h('p', { class: 'suave' }, trans.ok ? tr('Nenhuma transição disponível para este ticket.') : tr('Transições indisponíveis: {e}', { e: trans.error })), trSel.options.length ? DS.acao('Aplicar transição…', async () => { const r = await executarOperacao(e, 'jira.transicionar', { ticket: chave, transicaoId: trSel.value }); if (r?.estado === 'CONFIRMADA') void abrirTicket(e, chave); else resultadoOp(resultados, r); }, { id: 'tk-transicionar', desabilitado: !esc || trSel.disabled }) : null,
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
  async function abrirDefeito(e, id) {
    const vq = vinc(e, 'qase'), vj = vinc(e, 'jira'); if (!vq) { avisar(tr('Qase não vinculado a este projeto.'), true); return; }
    const carregando = DS.modal(tr('Defeito {id}', { id }), DS.carregando('Consultando o Qase…'), { tamanho: 'lg' });
    const r = await api.servicoConsultar(e.id, 'qase', 'defeito', {}, String(id)); if (carregando && !carregando.isConnected) return;
    if (!r.ok) { avisar(r.error, true); DS.modal(tr('Defeito {id}', { id }), DS.estadoTela('erro', 'Não foi possível abrir o defeito', r.error), { tamanho: 'md' }); return; }
    const d = r.data.dados; e = estado.espaco?.id === e.id ? estado.espaco : e;
    const tickets = e.relacoes.filter((x) => x.de.tipo === 'qase-defeito' && x.de.id === String(id) && x.para.tipo === 'jira-bug');
    const lista = (v) => (Array.isArray(v) ? v : []);
    const main = h('section', { class: 'ds-detalhe-main', id: 'def-detalhe' },
      DS.bloco('Resultado observado', DS.texto(d.actual_result || d.description, 'Sem descrição retornada.')),
      lista(d.runs).length ? DS.bloco('Runs relacionadas', h('div', { class: 'ds-celula-nos' }, lista(d.runs).map((x) => h('span', { class: 'ds-no', 'data-servico': 'qase' }, h('i'), tr('Run {id}', { id: x }))))) : null,
      lista(d.results).length ? DS.bloco('Resultados relacionados', h('div', { class: 'ds-celula-nos' }, lista(d.results).map((x) => h('span', { class: 'ds-no', 'data-servico': 'qase' }, h('i'), String(x))))) : null,
      DS.bloco(tr('Anexos ({n})', { n: lista(d.attachments).length }), lista(d.attachments).length ? h('ul', { class: 'ds-lista' }, lista(d.attachments).map((a) => h('li', {}, a.filename || a.name || a.hash || tr('Anexo'), h('span', { class: 'ds-sub' }, a.size ? bytes(a.size) : '')))) : h('p', { class: 'suave' }, tr('Nenhum anexo.'))),
      blocoRelacoes(e, ['qase-defeito'], id),
      DS.recolher('Dados retornados pelo Qase', h('pre', { class: 'ds-codigo' }, JSON.stringify(d, null, 2))));
    const aside = h('aside', {}, DS.meta([['Origem', DS.origem('qase', 'Qase · ' + vq.recurso.chave)], ['Status', d.status != null ? String(d.status) : null], ['Severidade', d.severity != null ? String(d.severity) : null], ['Tags', lista(d.tags).map((x) => x.title || x).join(', ') || null], ['Atualizado', d.updated_at ? quando(d.updated_at) : null], ['Consultado', quando(r.data.consultadoEm)]]),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Jira')),
        tickets.length ? h('div', { class: 'ds-celula-nos' }, tickets.map((x) => noRef(e, x.para, x.para.id))) : null,
        vj ? (tickets.length ? h('p', { class: 'suave' }, tr('Já existe ticket relacionado a este defeito.')) : DS.acao('Abrir ticket no Jira…', () => abrirCriar(e, { resumo: `[Qase ${vq.recurso.chave}-${id}] ${d.title || ''}`.slice(0, 255), descricao: [tr('Defeito Qase: {k}-{id}', { k: vq.recurso.chave, id }), d.severity != null ? tr('Severidade: {s}', { s: d.severity }) : '', '', d.actual_result || ''].filter((z) => z !== null).join('\n').slice(0, 8000), defeito: { id } }), { id: 'def-jira', icone: 'mais' })) : h('p', { class: 'suave' }, tr('Vincule o Jira para abrir um ticket a partir deste defeito.')),
        DS.notaPermissao('Defeitos do Qase são somente leitura no Prumo: criação, edição, comentários e anexos não têm contrato.')));
    DS.modal(tr('Defeito {id}', { id: vq.recurso.chave + '-' + id }) + ' · ' + (d.title || ''), h('div', { class: 'ds-detalhe' }, main, aside), { tamanho: 'lg', subtitulo: [DS.origem('qase'), DS.chip('Defeito'), d.status != null ? DS.chip(String(d.status)) : null, d.severity != null ? DS.chip(tr('Severidade {s}', { s: d.severity })) : null] });
  }

  // ======================= Casos (Qase) =======================
