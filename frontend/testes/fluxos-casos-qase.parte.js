/** Reúne trecho visual da função testes para o bundle fluxos-v40. */
  const tipoCaso = (c) => { if (typeof c.isManual === 'boolean') return c.isManual ? (c.isToBeAutomated ? 'planejado' : 'manual') : 'automatizado'; return ({ 0: 'manual', 1: 'planejado', 2: 'automatizado' })[c.automation] || 'indefinido'; };
  const rotuloTipoCaso = { manual: 'Manual', planejado: 'Automação planejada', automatizado: 'Automatizado', indefinido: 'Não informado' };
  const chipTipoCaso = (c) => { const t = tipoCaso(c); return DS.chip(rotuloTipoCaso[t], t === 'automatizado' ? 'info' : t === 'planejado' ? 'aviso' : null); };
  const resultadosLocais = (runs, casoId) => runs.flatMap((r) => r.casos.filter((c) => c.casoId === Number(casoId) && c.resultado).map((c) => ({ run: r, ...c.resultado })));
  const ticketsExternos = (c) => (Array.isArray(c.external_issues) ? c.external_issues.flatMap((x) => (x.issues || []).map((i) => i.id)) : []);
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
  async function carregarQase(e, mem, op, pagina = { limite: 100 }) {
    const r = await api.servicoConsultar(e.id, 'qase', op, pagina);
    if (!r.ok) { avisar(r.error, true); return { erro: r.error, itens: [] }; }
    return { itens: Array.isArray(r.data.dados) ? r.data.dados : [], proxima: r.data.proxima, em: r.data.consultadoEm };
  }
  const fonteQase = (r, rotulo, mais) => h('div', { class: 'ds-fontes', 'aria-live': 'polite' }, r.erro ? h('span', { role: 'status' }, DS.origem('qase', 'Qase'), ' ', DS.chip(r.erro, 'falha')) : h('span', { role: 'status' }, DS.origem('qase', 'Qase'), tr('{n} {r} · consultado {q}', { n: r.itens.length, r: tr(rotulo), q: quando(r.em) }), r.proxima != null && mais ? DS.link('Carregar mais', mais, { seta: false }) : null));
  abas.testes = async (el) => {
    const e = estado.espaco;
    if (!e) { const sub0 = ['runs', 'automacao'].includes(estado.sub?.testes) ? estado.sub.testes : 'catalogo'; el.append(DS.cabecalho({ titulo: 'Testes' }), barraSub('testes', [['catalogo', 'Catálogo'], ['runs', 'Runs'], ['automacao', 'Automação']], sub0), h('div', { id: 'sub-conteudo' }, DS.estadoTela('vazio', 'Nenhum projeto selecionado', 'Selecione ou crie um projeto para continuar.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))]))); return; }
    const vq = vinc(e, 'qase'); const mem = memoria('testes', e.id);
    const itens = [['catalogo', 'Catálogo'], ...(vq ? [['casos', 'Casos'], ['suites', 'Suites'], ['planos', 'Planos']] : []), ['runs', 'Runs'], ['automacao', 'Automação']];
    let sub = estado.sub?.testes || 'catalogo'; if (!itens.some(([k]) => k === sub)) sub = 'catalogo';
    const perm = vq ? await escritaDoProjeto(e) : {}; const esc = !!perm.qase;
    const acoes = { casos: [DS.acao('Consulta avançada', () => avancadaQase(e), { id: 'testes-avancada', icone: 'filtro' }), DS.acao('Nova proposta de caso', () => novaProposta(e), { id: 'pr-nova', primaria: true, icone: 'mais' })], suites: [DS.acao('Nova suite', () => novaSuite(e, esc), { id: 'su-nova', primaria: true, icone: 'mais' })], planos: [DS.acao('Novo plano', () => novoPlano(e, esc), { id: 'plano-novo', primaria: true, icone: 'mais' })], runs: vq ? [DS.acao('Preparar run', () => prepararRun(e), { id: 'run-nova', primaria: true, icone: 'mais' })] : [] }[sub] || [];
    el.append(DS.cabecalho({ titulo: 'Testes', descricao: [h('span', { class: 'ds-chips' }, DS.origem(e.pastaLocal ? 'local' : 'ausente', e.pastaLocal ? tr('Repositório local') : tr('Sem pasta local')), vq ? DS.origem('qase', 'Qase · ' + vq.recurso.chave) : null, vq && !esc ? h('span', { class: 'ds-chip', 'data-escrita-desligada': 'qase', title: tr('Escrita no Qase desligada. Habilite em Conexões.') }, tr('Qase somente leitura')) : null)], acoes }), barraSub('testes', itens, sub));
    const corpo = h('div', { id: 'sub-conteudo' }); el.append(corpo);
    if (sub === 'catalogo') await catalogoRepo(corpo);
    else if (sub === 'casos') await telaCasos(e, mem, corpo);
    else if (sub === 'suites') await telaSuites(e, mem, corpo);
    else if (sub === 'planos') await telaPlanos(e, mem, corpo);
    else if (sub === 'runs') await telaRuns(e, mem, corpo, esc);
    else { await abaAutomacao(corpo); semTitulo(corpo); }
  };
  async function avancadaQase(e) {
    const caixa = h('div', { class: 'ds-avancada' }, h('p', { class: 'suave' }, tr('Consulta direta ao Qase vinculado: suites, casos, detalhe com passos e planos, com os dados retornados.')));
    DS.modal('Consulta avançada · Qase', caixa, { tamanho: 'lg' }); await consultaManual(caixa, 'qase', { suites: 'Suites', casos: 'Casos manuais e automatizados', caso: 'Detalhe e passos do caso', planos: 'Planos' });
  }
  function novaProposta(e) { DS.modal('Nova proposta de caso', formularioProposta(e, null, () => { DS.fecharModal(); mostrar('testes'); }), { tamanho: 'md' }); }
  async function telaCasos(e, mem, corpo) {
    const f = (mem.fCasos ||= { q: '', tipo: '', suite: '' });
    const q = DS.busca({ id: 'caso-busca', placeholder: 'Buscar por ID, título ou tag', valor: f.q });
    const tipo = DS.selecao({ id: 'caso-tipo', rotulo: 'Tipo de execução', opcoes: [['', 'Todos os tipos'], ['manual', 'Manual'], ['automatizado', 'Automatizado'], ['planejado', 'Automação planejada']], valor: f.tipo });
    const suite = DS.selecao({ id: 'caso-suite', rotulo: 'Suite', opcoes: [['', 'Todas as suites']], valor: '' });
    const area = h('div', { id: 'casos-area' }, DS.esqueleto(6)); const fonte = h('div');
    corpo.append(DS.barra(q.no, tipo, suite, DS.acao('Atualizar', async () => { delete mem.casos; await carregar(); }, { id: 'casos-atualizar', icone: 'atualizar' })), fonte, area);
    const slot = h('div', { id: 'pr-slot' }); const propostas = h('div', { id: 'pr-lista' });
    corpo.append(DS.secao('Propostas em revisão', [h('p', { class: 'suave' }, tr('Rascunhos locais de casos e bugs. Nada é publicado sem revisão e confirmação.')), slot, propostas]));
    const [runs] = await Promise.all([api.runs(e.id)]); const rl = runs.ok ? runs.data : [];
    const desenhar = () => {
      f.q = q.input.value.trim(); f.tipo = tipo.value; f.suite = suite.value; const qq = f.q.toLowerCase();
      const casos = (mem.casos?.itens || []).filter((c) => (!f.tipo || tipoCaso(c) === f.tipo) && (!f.suite || String(c.suite_id) === f.suite) && (!qq || (c.id + ' ' + (c.title || '') + ' ' + (c.tags || []).map((x) => x.title || x).join(' ')).toLowerCase().includes(qq)));
      if (mem.casos?.erro && !mem.casos.itens.length) { area.replaceChildren(DS.estadoTela('erro', 'Não foi possível consultar os casos', mem.casos.erro, [DS.acao('Tentar novamente', async () => { delete mem.casos; await carregar(); })])); return; }
      if (!casos.length) { area.replaceChildren(DS.estadoTela('vazio', mem.casos?.itens.length ? 'Nenhum caso para estes filtros' : 'Nenhum caso retornado pelo Qase', mem.casos?.itens.length ? 'Ajuste a busca, o tipo ou a suite.' : null)); return; }
      const nomeSuite = (sid) => (mem.suites?.itens || []).find((s) => s.id === sid)?.title;
      area.replaceChildren(DS.tabela({ id: 'casos-tabela', colunas: ['ID', 'Caso', 'Tipo', { t: 'Automação no Prumo', classe: 'ds-opcional' }, 'Ticket', 'Resultado no Prumo'], linhas: casos.map((c) => {
        const autos = relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)).filter((x) => x.tipo === 'automacao'); const tk = [...new Set([...ticketsExternos(c), ...relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)).filter((x) => x.tipo === 'jira').map((x) => x.id)])];
        const ult = resultadosLocais(rl, c.id).sort((a, b) => Date.parse(b.em) - Date.parse(a.em))[0];
        return { attrs: { 'data-caso': String(c.id) }, abrir: () => abrirCaso(e, c.id), rotuloAcessivel: tr('Abrir caso {id}', { id: c.id }),
          celulas: [{ no: String(c.id), classe: 'ds-id' }, h('div', {}, h('span', { class: 'ds-resumo-texto' }, c.title || '—'), nomeSuite(c.suite_id) ? h('span', { class: 'ds-sub' }, nomeSuite(c.suite_id)) : null), chipTipoCaso(c), autos.length ? h('span', { class: 'ds-celula-nos' }, autos.map((a) => h('span', { class: 'ds-no', 'data-servico': 'local' }, h('i'), a.id))) : h('span', { class: 'ds-falta' }, tr('não declarada')), tk.length ? tk.join(', ') : '—', ult ? selo(ult.status) : h('span', { class: 'ds-falta' }, tr('sem resultado'))] };
      }) }));
    };
    async function carregar() {
      area.replaceChildren(DS.esqueleto(6));
      const [casos, suites] = await Promise.all([mem.casos ? mem.casos : carregarQase(e, mem, 'casos'), mem.suites ? mem.suites : carregarQase(e, mem, 'suites')]);
      mem.casos = casos; mem.suites = suites; fonte.replaceChildren(fonteQase(casos, 'caso(s)', casos.proxima != null ? async () => { const r = await carregarQase(e, mem, 'casos', { offset: casos.proxima, limite: 100 }); if (!r.erro) { mem.casos = { ...r, itens: mem.casos.itens.concat(r.itens) }; fonte.replaceChildren(fonteQase(mem.casos, 'caso(s)')); desenhar(); } } : null));
      suite.replaceChildren(h('option', { value: '' }, tr('Todas as suites')), ...suites.itens.map((s) => h('option', { value: String(s.id), selected: String(s.id) === f.suite }, s.title)));
      desenhar();
    }
    q.input.addEventListener('input', desenhar); tipo.addEventListener('change', desenhar); suite.addEventListener('change', desenhar);
    const perm = await escritaDoProjeto(e); const ps = await chamar(() => api.propostas(e.id)); const vivas = (ps || []).filter((p) => p.estado !== 'DESCARTADA');
    if (!vivas.length) propostas.append(DS.estadoTela('vazio', 'Nenhuma proposta em revisão', null, [], { id: 'pr-vazia', compacto: true })); for (const p of vivas) propostas.append(cartaoProposta(e, p, perm, () => mostrar('testes')));
    await carregar();
  }
  function novaSuite(e, esc) {
    const titulo = h('input', { id: 'su-titulo', maxlength: 255 }); const saida = h('div', { id: 'ts-saida' });
    DS.modal('Nova suite no Qase', [!esc ? DS.alerta('Escrita no Qase desligada. Habilite em Conexões para criar suites.', 'aviso', 'cadeado') : null, h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título da suite', titulo, { inteiro: true })), saida,
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar suite…', async () => { const r = await executarOperacao(e, 'qase.criar_suite', { titulo: titulo.value }); if (r) { saida.replaceChildren(painelResultado(r)); if (r.estado === 'CONFIRMADA') delete memoria('testes', e.id).suites; } }, { id: 'su-criar', primaria: true, desabilitado: !esc }))], { tamanho: 'sm' });
    titulo.focus();
  }
  async function telaSuites(e, mem, corpo) {
    const area = h('div', { id: 'suites-area' }, DS.esqueleto(5)); const fonte = h('div'); corpo.append(DS.barra(DS.acao('Atualizar', async () => { delete mem.suites; await carregar(); }, { id: 'suites-atualizar', icone: 'atualizar' })), fonte, area);
    async function carregar() {
      area.replaceChildren(DS.esqueleto(5)); const s = (mem.suites = mem.suites || await carregarQase(e, mem, 'suites')); fonte.replaceChildren(fonteQase(s, 'suite(s)'));
      if (s.erro && !s.itens.length) { area.replaceChildren(DS.estadoTela('erro', 'Não foi possível consultar as suites', s.erro)); return; }
      if (!s.itens.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhuma suite retornada pelo Qase')); return; }
      area.replaceChildren(DS.tabela({ id: 'suites-tabela', colunas: ['ID', 'Suite', 'Casos', 'Suite pai'], rotuloAbrir: 'Ver casos', linhas: s.itens.map((x) => ({ attrs: { 'data-suite': String(x.id) }, abrir: () => { (mem.fCasos ||= {}).suite = String(x.id); (estado.sub ||= {}).testes = 'casos'; mostrar('testes'); }, celulas: [{ no: String(x.id), classe: 'ds-id' }, h('div', {}, x.title || '—', x.description ? h('span', { class: 'ds-sub' }, String(x.description).slice(0, 160)) : null), x.cases_count != null ? String(x.cases_count) : '—', x.parent_id != null ? String(x.parent_id) : '—'] })) }));
    }
    await carregar();
  }
