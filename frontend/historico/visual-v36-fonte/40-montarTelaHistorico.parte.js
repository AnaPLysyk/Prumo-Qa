/** Monta os filtros e a linha do tempo do historico. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  abas.historico = async (el) => {
    el.classList.add('v36h'); el.append(h('h1', { class: 'v36-sr' }, 'Histórico'));
    if (!estado.root) return el.append(semProjeto());
    const root = estado.root; const r = await chamar(() => api.historico(root, { limit: 1000 })); if (!r) return;
    const nomeProjeto = $('#projeto-atual')?.textContent || '';
    let dias = 7, vista = 'linha', ordem = 'desc', coluna = 'data', aberto = null;
    const periodo = h('div', { class: 'v36h-segmento', role: 'group', 'aria-label': tr('Período') });
    const opcoesPeriodo = [[7, '7 dias'], [30, '30 dias'], [90, '90 dias'], [0, 'Todos']];
    const busca = h('input', { type: 'search', id: 'v36-hist-busca', placeholder: tr('Operação, ferramenta, estado ou código…'), autocomplete: 'off' });
    const de = h('input', { type: 'date', id: 'v36-hist-de' }), ate = h('input', { type: 'date', id: 'v36-hist-ate' });
    const opc = (sel, vazio, vals) => { sel.append(h('option', { value: '' }, tr(vazio)), ...vals.map((v) => h('option', { value: v }, v))); return sel; };
    const fFerr = opc(h('select', { id: 'v36-hist-ferramenta' }), 'Todas as ferramentas', [...new Set(r.activities.map((a) => a.tool))].sort());
    const fEst = opc(h('select', { id: 'v36-hist-resultado' }), 'Qualquer resultado', [...new Set(r.activities.map((a) => a.state))].sort());
    const fOri = opc(h('select', { id: 'v36-hist-origem' }), 'Todas as origens', [...new Set(r.activities.map((a) => a.origin))].sort());
    const fCli = opc(h('select', { id: 'v36-hist-cliente' }), 'Todos os clientes', [...new Set(r.activities.map((a) => a.client))].sort());
    const contagemFiltros = h('span', { class: 'v36-contagem' });
    const resumoFiltros = h('span', {});
    const filtros = h('div', { class: 'v36-filtros', id: 'v36-hist-filtros', hidden: true },
      h('label', {}, tr('Buscar atividade'), busca), h('label', {}, tr('De'), de), h('label', {}, tr('Até'), ate), h('label', {}, tr('Ferramenta'), fFerr),
      h('label', {}, tr('Resultado'), fEst), h('label', {}, tr('Origem'), fOri), h('label', {}, tr('Cliente (declarado)'), fCli), h('span'),
      h('div', { class: 'v36-filtros-acoes' }, resumoFiltros, h('button', { type: 'button', id: 'v36-hist-limpar', onclick: () => { [busca, de, ate, fFerr, fEst, fOri, fCli].forEach((c) => { c.value = ''; }); desenhar(); } }, tr('Limpar filtros'))));
    const botaoFiltros = h('button', { type: 'button', class: 'v36-btn-texto', 'aria-expanded': 'false', 'aria-controls': 'v36-hist-filtros' }, icone('filtro', 17), h('span', {}, tr('Filtros')), contagemFiltros);
    botaoFiltros.addEventListener('click', () => { filtros.hidden = !filtros.hidden; botaoFiltros.setAttribute('aria-expanded', String(!filtros.hidden)); if (!filtros.hidden) busca.focus(); });
    const exportar = h('button', { type: 'button', class: 'v36-btn-icone', 'aria-label': tr('Exportar registros'), title: tr('Exportar registros') }, icone('baixar', 17));
    exportar.addEventListener('click', async () => { const x = await chamar(() => api.exportarLogs(root)); if (x?.exported) avisar(tr('Logs exportados.')); });
    const imprimir = h('button', { type: 'button', class: 'v36-btn-icone', 'aria-label': tr('Imprimir ou salvar em PDF'), title: tr('Imprimir ou salvar em PDF'), onclick: () => window.print() }, icone('documento', 17));
    const abas2 = h('div', { class: 'v36h-abas', role: 'tablist', 'aria-label': tr('Visualização do histórico') });
    const contagem = h('span', { id: 'v36-hist-contagem' });
    const ordemSel = h('select', { id: 'v36-history-sort', 'aria-label': tr('Ordenar') }, h('option', { value: 'desc' }, tr('Mais recentes')), h('option', { value: 'asc' }, tr('Mais antigos')));
    const lista = h('div', { class: 'v36h-lista', id: 'v36-hist-eventos', role: 'region', 'aria-label': tr('Eventos do histórico') });
    el.append(h('div', { class: 'v36h-barra' }, periodo, botaoFiltros, h('div', { class: 'v36-direita' }, exportar, imprimir)), filtros,
      h('div', { class: 'v36h-troca' }, abas2, h('div', { class: 'v36h-info' }, contagem, h('label', { class: 'v36h-ordem' }, h('span', {}, tr('Ordenar')), ordemSel))),
      ...(r.complete ? [] : [h('div', { class: 'nota' }, tr('Histórico parcial: registros inválidos excluídos.'))]), lista,
      h('p', { class: 'v36h-nota' }, h('span', {}, r.notice), ' ', h('span', {}, tr('Até 1000 atividades por consulta. STARTED sem término não comprova processo ainda ativo.'))));
