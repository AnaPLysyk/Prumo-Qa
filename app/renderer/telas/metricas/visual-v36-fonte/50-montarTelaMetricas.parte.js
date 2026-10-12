/** Monta filtros datas e indicadores de metricas. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  abas.metricas = async (el) => {
    el.classList.add('v36m'); el.append(h('h1', { class: 'v36-sr' }, 'Métricas'));
    if (!estado.root) return el.append(semProjeto());
    const root = estado.root, espaco = estado.espaco;
    const [v, hist, execs] = await Promise.all([chamar(() => api.visao(root)), chamar(() => api.historico(root, { limit: 1000 })), espaco ? chamar(() => api.execucoes({ espacoId: espaco.id, limite: 500 })) : null]);
    if (!v) return; const m = v.metrics;
    // Uma linha por registro real: execuções da agenda/manuais e operações MCP/CLI observadas pelo núcleo.
    const registros = [];
    for (const x of execs?.execucoes || []) { const st = x.resultado?.status || (x.estado === 'ERRO' ? 'ERRO_INFRA' : null); if (!st) continue;
      registros.push({ id: x.id, at: x.termino || x.inicio || x.slot || x.criadoEm, tipo: ALIAS[x.tipo] || x.tipo, status: st, fonte: x.tipo === 'consulta-jira' ? 'jira' : x.tipo === 'run-qase' ? 'qase' : x.tipo === 'analise-mudancas' ? 'github' : 'prumo', ambiente: x.ambiente || null, origem: x.origem, duracao: x.duracaoMs, ticket: x.ticket, jira: x.jira?.estado || null }); }
    for (const a of hist?.activities || []) { if (a.state === 'SEM_TERMINO_OBSERVADO') continue;
      registros.push({ id: a.operationId, at: a.at, tipo: a.tool, status: RESULTADOS.includes(a.state) ? a.state : a.state === 'ERROR' ? 'ERRO_INFRA' : 'INFO', fonte: 'mcp', ambiente: null, origem: a.origin, duracao: a.durationMs, ticket: null, jira: null }); }
    const pref = lerVista(); let dias = pref.dias, intervalo = null; const vista = pref.vista;
    const salvar = () => gravarVista({ vista, dias });
    // Barra
    const periodo = h('div', { class: 'v36m-periodo', role: 'group', 'aria-label': tr('Período') });
    const de = h('input', { type: 'date', id: 'v36-met-de' }), ate = h('input', { type: 'date', id: 'v36-met-ate' });
    const calendario = h('div', { class: 'v36m-calendario', hidden: true }, h('label', {}, tr('De'), de), h('label', {}, tr('Até'), ate), h('button', { type: 'button', onclick: () => { if (!de.value || !ate.value || de.value > ate.value) { avisar(tr('Escolha um período válido.'), true); return; } intervalo = [de.value, ate.value]; calendario.hidden = true; botaoCal.setAttribute('aria-expanded', 'false'); desenhar(); } }, tr('Aplicar período')));
    const botaoCal = h('button', { type: 'button', class: 'v36-btn-texto', 'aria-expanded': 'false', onclick: () => { calendario.hidden = !calendario.hidden; botaoCal.setAttribute('aria-expanded', String(!calendario.hidden)); } }, tr('Calendário'));
    const fFonte = h('select', { id: 'v36-met-fonte' }, h('option', { value: '' }, tr('Todas as fontes')), Object.entries(FONTES).map(([k, t]) => h('option', { value: k }, tr(t))));
    const fRes = h('select', { id: 'v36-met-resultado' }, h('option', { value: '' }, tr('Qualquer resultado')), [...RESULTADOS, 'INFO', 'ERRO_INFRA'].map((s) => h('option', { value: s }, s)));
    const fTipo = h('select', { id: 'v36-met-tipo' }, h('option', { value: '' }, tr('Todas as rotinas')), [...new Set(registros.map((r) => r.tipo))].sort().map((t) => h('option', { value: t }, t)));
    const fAmb = h('select', { id: 'v36-met-ambiente' }, h('option', { value: '' }, tr('Todos os ambientes')), Object.entries(AMBIENTES).map(([k, t]) => h('option', { value: k }, tr(t))));
    const fOri = h('select', { id: 'v36-met-execucao' }, h('option', { value: '' }, tr('Qualquer execução')), [['AGENDA', 'Agendada'], ['MANUAL', 'Manual'], ['MCP', 'MCP'], ['CLI', 'CLI']].map(([k, t]) => h('option', { value: k }, tr(t))));
    const fTicket = h('input', { type: 'search', id: 'v36-met-ticket', placeholder: 'SMART-1556', autocomplete: 'off' });
    const busca = h('input', { type: 'search', id: 'v36-met-busca', placeholder: tr('Tipo, resultado, ticket ou identificador…'), autocomplete: 'off' });
    const contagemFiltros = h('span', { class: 'v36-contagem' }), resumo = h('span', { id: 'v36-met-resumo' });
    const filtros = h('div', { class: 'v36-filtros', id: 'v36-met-filtros', hidden: true },
      h('label', {}, tr('Buscar atividade'), busca), h('label', {}, tr('Fonte da informação'), fFonte), h('label', {}, tr('Resultado'), fRes), h('label', {}, tr('Tipo de rotina'), fTipo),
      h('label', {}, tr('Ambiente'), fAmb), h('label', {}, tr('Execução'), fOri), h('label', {}, tr('Ticket / identificador'), fTicket), h('span'),
      h('div', { class: 'v36-filtros-acoes' }, resumo, h('button', { type: 'button', id: 'v36-met-limpar', onclick: () => { [busca, fFonte, fRes, fTipo, fAmb, fOri, fTicket].forEach((c) => { c.value = ''; }); desenhar(); } }, tr('Limpar filtros'))));
    const botaoFiltros = h('button', { type: 'button', class: 'v36-btn-texto', 'aria-expanded': 'false', 'aria-controls': 'v36-met-filtros', onclick: () => { filtros.hidden = !filtros.hidden; botaoFiltros.setAttribute('aria-expanded', String(!filtros.hidden)); } }, icone('filtro', 17), h('span', {}, tr('Filtros')), contagemFiltros);
    const escolhas = h('div', { class: 'v36m-escolhas' });
    const editor = h('div', { class: 'v36m-editor', id: 'v36-met-editor', hidden: true }, h('strong', {}, tr('Editar gráficos do relatório')), escolhas, h('p', {}, tr('Escolha, altere o formato e ordene os gráficos. Os filtros determinam os dados exibidos.')));
    const botaoEditor = h('button', { type: 'button', class: 'v36-btn-texto', 'aria-expanded': 'false', 'aria-controls': 'v36-met-editor', onclick: () => { editor.hidden = !editor.hidden; botaoEditor.setAttribute('aria-expanded', String(!editor.hidden)); } }, icone('graficos', 17), h('span', {}, tr('Editar gráficos')));
    const menu = h('div', { class: 'v36-menu', hidden: true, role: 'menu' });
    const botaoExportar = h('button', { type: 'button', class: 'v36-btn-icone', 'aria-label': tr('Exportar dados filtrados'), title: tr('Exportar dados filtrados'), 'aria-haspopup': 'true', 'aria-expanded': 'false', onclick: (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; botaoExportar.setAttribute('aria-expanded', String(!menu.hidden)); } }, icone('baixar', 17));
    const fora = (e) => { if (!botaoExportar.isConnected) { if (menu.dataset.visto) document.removeEventListener('click', fora); return; } menu.dataset.visto = '1'; if (!menu.hidden && !menu.contains(e.target)) { menu.hidden = true; botaoExportar.setAttribute('aria-expanded', 'false'); } };
    document.addEventListener('click', fora);
    const imprimir = h('button', { type: 'button', class: 'v36-btn-icone', 'aria-label': tr('Imprimir ou salvar em PDF'), title: tr('Imprimir ou salvar em PDF'), onclick: () => window.print() }, icone('documento', 17));
    const grade = h('div', { class: 'v36m-grade', id: 'v36-met-graficos' });
    const totais = [[m.totalOperations, 'interações registradas'], [m.mcpCalls, 'chamadas via MCP'], [m.coverageReviews, 'revisões de cobertura'], [m.contextAnalyses, 'análises de contexto'], [m.executions.PASS, 'PASS'], [m.executions.FAIL, 'FAIL'], [m.executions.BLOCKED, 'BLOCKED'], [m.executions.NOT_RUN, 'NOT_RUN']];
    el.append(h('div', { class: 'v36m-barra' }, periodo, h('div', { class: 'v36m-periodo-caixa' }, botaoCal, calendario), h('span', { class: 'v36m-divisor', 'aria-hidden': 'true' }), botaoFiltros,
      h('div', { class: 'v36-direita' }, botaoEditor, botaoExportar, imprimir, menu)), filtros, editor,
      ...(m.complete ? [] : [h('div', { class: 'v36m-aviso' }, tr('Histórico parcial: registros inválidos ou truncados foram excluídos; os números são parciais.'))]),
      grade,
      h('div', { class: 'grade v36m-resumo' }, h('span', { class: 'v36m-resumo-titulo' }, tr('Totais do núcleo · todo o período')), totais.map(([n, t]) => h('div', {}, h('b', {}, String(n ?? 0)), h('span', {}, tr(t))))),
      h('p', { class: 'v36m-nota' }, h('span', {}, tr('Os gráficos refletem os filtros selecionados. Uma consulta (INFO) não conta como teste PASS.')), ' ',
        h('span', {}, tr('Última atividade:')), ' ', ignorar(hora(m.lastActivity)), ' · ', h('span', {}, tr('Tokens e custos:')), ' ', ignorar(String(m.providerMetrics)), ' · ', h('span', {}, tr('Última chamada MCP de:')), ' ', ignorar(v.lastMcpClient || '—')));
