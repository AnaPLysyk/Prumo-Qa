/** Reúne trecho visual da função historico para o bundle interfaces-v36. */
  const ROTULO_FERRAMENTA = { contexto_projeto: 'Contexto do projeto consultado', revisar_cobertura: 'Revisão de cobertura', executar_validacao: 'Validação solicitada', consultar_evidencias: 'Evidências consultadas', desconhecida: 'Ferramenta não reconhecida' };
  const ICONE_FERRAMENTA = { contexto_projeto: 'projeto', revisar_cobertura: 'revisao', executar_validacao: 'execucao', consultar_evidencias: 'evidencia', desconhecida: 'agente' };
  const classeEstado = (s) => (['PASS', 'OK'].includes(s) ? 'good' : ['FAIL', 'ERROR'].includes(s) ? 'bad' : ['BLOCKED', 'NOT_VERIFIED', 'NOT_RUN', 'SEM_TERMINO_OBSERVADO', 'STARTED'].includes(s) ? 'warn' : '');
  function detalhesAtividade(a) { caixa(tr('Detalhes da atividade'), [note(tr('Origem observada no núcleo; identidade do cliente é declarada.')), h('pre', {}, JSON.stringify(a, null, 2))]); }
  async function copiar(texto) { try { await navigator.clipboard.writeText(texto); avisar(tr('Copiado.')); } catch { avisar(tr('Não foi possível copiar.'), true); } }
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
    function desenharPeriodo() { periodo.replaceChildren(...opcoesPeriodo.map(([d, t]) => h('button', { type: 'button', 'aria-pressed': String(dias === d), onclick: () => { dias = d; desenhar(); } }, tr(t)))); }
    function desenharAbas() { abas2.replaceChildren(...[['linha', 'Linha do tempo'], ['tabela', 'Tabela']].map(([v, t]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(vista === v), onclick: () => { vista = v; desenhar(); } }, tr(t)))); }
    const tituloDe = (a) => tr(ROTULO_FERRAMENTA[a.tool] || a.tool);
    function filtradas() {
      const q = busca.value.trim().toLowerCase(); const limite = dias ? Date.now() - dias * 86400000 : 0;
      const ativos = [busca.value, de.value, ate.value, fFerr.value, fEst.value, fOri.value, fCli.value].filter(Boolean).length;
      contagemFiltros.textContent = ativos ? String(ativos) : ''; resumoFiltros.textContent = tr('Os filtros se combinam e afetam a linha do tempo e a tabela.');
      return r.activities.filter((a) => { const t = Date.parse(a.at); return t >= limite && (!de.value || t >= Date.parse(de.value + 'T00:00:00')) && (!ate.value || t <= Date.parse(ate.value + 'T23:59:59.999'))
        && (!fFerr.value || a.tool === fFerr.value) && (!fEst.value || a.state === fEst.value) && (!fOri.value || a.origin === fOri.value) && (!fCli.value || a.client === fCli.value)
        && (!q || [a.operationId, a.tool, a.state, a.client, a.origin, a.summary?.code, tituloDe(a)].join(' ').toLowerCase().includes(q)); });
    }
    function corpoDe(a) {
      if (a.findingsText) return ignorar(a.findingsText);
      return h('span', {}, h('span', {}, tr('Resultado')), ' ', ignorar([a.state, a.summary?.code, ms(a.durationMs)].filter(Boolean).join(' · ')));
    }
    function tags(a) { return [h('span', { class: 'v36-tag v36-estado ' + classeEstado(a.state) }, a.state), h('span', { class: 'v36-tag', 'data-i18n-ignore': '' }, nomeProjeto), h('span', { class: 'v36-tag' }, a.tool), h('span', { class: 'v36-tag' }, a.origin + ' · ' + a.client)]; }
    function detalheInline(a) {
      const ev = a.summary?.evidenceJobId;
      const campos = [['Quando', new Date(a.at).toLocaleString(local())], ['Projeto', nomeProjeto], ['Origem · Cliente (declarado)', a.origin + ' · ' + a.client], ['Ferramenta', a.tool], ['Operação', a.operationId, true], ['Duração', ms(a.durationMs)], ['Código', a.summary?.code || '—', true], ['Evidência', ev || '—', true]];
      return h('div', { class: 'v36h-detalhe', id: 'v36-det-' + a.operationId, role: 'region', 'aria-label': tr('Detalhes da atividade') },
        h('div', { class: 'v36h-dcabeca' }, h('strong', {}, tituloDe(a)), h('span', { class: 'v36-pilula ' + classeEstado(a.state) }, a.state)),
        h('p', {}, corpoDe(a)),
        h('div', { class: 'v36h-dgrade' }, campos.map(([k, v, codigo]) => h('div', {}, h('small', {}, tr(k)), codigo ? h('code', {}, String(v)) : h('strong', { 'data-i18n-ignore': '' }, String(v))))),
        h('div', { class: 'v36h-dacoes' }, h('button', { type: 'button', onclick: () => detalhesAtividade(a) }, tr('Detalhes')), h('button', { type: 'button', onclick: () => copiar(a.operationId) }, tr('Copiar ID')),
          h('button', { type: 'button', onclick: () => { busca.value = a.operationId; filtros.hidden = false; botaoFiltros.setAttribute('aria-expanded', 'true'); desenhar(); } }, tr('Filtrar operação')),
          ev ? h('button', { type: 'button', onclick: () => { estado.jobId = ev; mostrar('evidencias'); } }, tr('Ver evidência')) : null));
    }
    function entrada(a) {
      const ab = aberto === a.operationId;
      const ev = h('button', { type: 'button', class: 'v36h-evento', 'aria-expanded': String(ab), 'aria-controls': 'v36-det-' + a.operationId, onclick: () => { aberto = ab ? null : a.operationId; desenhar(); } },
        h('span', { class: 'v36h-titulo' }, icone(ICONE_FERRAMENTA[a.tool] || 'agente', 16), h('span', {}, tituloDe(a)), h('span', { class: 'v36h-seta', 'aria-hidden': 'true' }, ab ? '⌃' : '⌄')),
        h('div', { class: 'v36h-corpo' }, corpoDe(a)), h('div', { class: 'v36h-tags' }, tags(a)));
      return h('div', { class: 'v36h-entrada', 'data-operation': a.operationId }, h('div', { class: 'v36h-hora' }, hm(a.at)), h('div', { class: 'v36h-fio' }, h('span', { class: 'v36h-ponto ' + classeEstado(a.state) })), h('div', { class: 'v36h-quadro' }, ev, ab ? detalheInline(a) : null));
    }
    const COLUNAS = [['data', 'Data', (a) => a.at], ['atividade', 'Atividade', tituloDe], ['ferramenta', 'Ferramenta', (a) => a.tool], ['resultado', 'Resultado', (a) => a.state], ['origem', 'Origem', (a) => a.origin], ['cliente', 'Cliente', (a) => a.client], ['duracao', 'Duração', (a) => a.durationMs], ['operacao', 'Operação', (a) => a.operationId]];
    function tabela(itens) {
      const val = COLUNAS.find((c) => c[0] === coluna)[2]; const ord = [...itens].sort((x, y) => { const p = val(x), q = val(y); const c = typeof p === 'number' ? p - q : String(p).localeCompare(String(q)); return ordem === 'desc' ? -c : c; });
      return h('div', { class: 'v36h-tabela-caixa' }, h('table', { class: 'v36h-tabela', id: 'v36-history-table' },
        h('thead', {}, h('tr', {}, COLUNAS.map(([id, t]) => h('th', { 'aria-sort': coluna === id ? (ordem === 'desc' ? 'descending' : 'ascending') : 'none' }, h('button', { type: 'button', class: 'v36h-ord' + (coluna === id ? ' ativo' : ''), onclick: () => { if (coluna === id) ordem = ordem === 'desc' ? 'asc' : 'desc'; else { coluna = id; ordem = 'desc'; } ordemSel.value = ordem; desenhar(); } }, h('span', {}, tr(t)), h('span', { class: 'v36h-seta-ord', 'aria-hidden': 'true' }, coluna === id ? (ordem === 'desc' ? '↓' : '↑') : '↕')))))),
        h('tbody', {}, ord.map((a) => h('tr', { 'data-operation': a.operationId, tabindex: '0', onclick: () => detalhesAtividade(a), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); detalhesAtividade(a); } } },
          h('td', {}, new Date(a.at).toLocaleDateString(local(), { day: '2-digit', month: '2-digit' }), h('small', {}, hm(a.at))), h('td', { class: 'v36h-ttitulo' }, tituloDe(a), h('small', {}, a.tool)), h('td', {}, a.tool),
          h('td', {}, h('span', { class: 'v36-pilula ' + classeEstado(a.state) }, a.state)), h('td', {}, a.origin), h('td', {}, a.client), h('td', { 'data-i18n-ignore': '' }, ms(a.durationMs)), h('td', {}, h('code', {}, a.operationId.slice(0, 8))))))));
    }
    function desenhar() {
      desenharPeriodo(); desenharAbas(); const itens = filtradas();
      contagem.textContent = tr('{n} eventos', { n: itens.length });
      if (!itens.length) { lista.replaceChildren(h('div', { class: 'v36h-vazio' }, r.activities.length ? h('span', {}, tr('Nenhuma atividade para este período e filtros.')) : h('span', {}, tr('Nenhuma atividade registrada ainda.')), r.activities.length && dias ? h('button', { type: 'button', onclick: () => { dias = 0; desenhar(); } }, tr('Ver todo o período')) : null)); return; }
      if (vista === 'tabela') { lista.replaceChildren(tabela(itens)); return; }
      const ord = [...itens].sort((x, y) => (ordem === 'desc' ? y.at.localeCompare(x.at) : x.at.localeCompare(y.at)));
      const grupos = new Map(); for (const a of ord) { const k = diaIso(a.at); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(a); }
      lista.replaceChildren(...[...grupos].map(([, as]) => h('section', { class: 'v36h-grupo' },
        h('div', { class: 'v36h-dia' }, ignorar(new Date(as[0].at).toLocaleDateString(local(), { day: 'numeric', month: 'long', year: 'numeric' })), h('span', { class: 'v36h-regua' }), h('small', {}, tr('{n} evento(s)', { n: as.length }))),
        as.map(entrada))));
    }
    [busca].forEach((c) => c.addEventListener('input', desenhar)); [de, ate, fFerr, fEst, fOri, fCli].forEach((c) => c.addEventListener('change', desenhar));
    ordemSel.addEventListener('change', () => { ordem = ordemSel.value; coluna = 'data'; desenhar(); });
    desenhar();
  };

  // ---------------- Gráficos (SVG desenhado a partir dos dados locais) ----------------
