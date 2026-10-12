/** Monta os filtros e a estrutura do terminal de logs. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  abas.logs = async (el) => {
    el.classList.add('v36l');
    const root = estado.root; const nomeProjeto = $('#projeto-atual')?.textContent || '';
    let eventos = [], aberto = null, assinatura = '';
    const busca = h('input', { type: 'search', id: 'v36-logs-busca', 'aria-label': tr('Buscar logs'), placeholder: tr('Buscar logs, código, operação ou ferramenta…'), autocomplete: 'off' });
    const fFerramenta = h('select', { id: 'v36-logs-ferramenta', 'aria-label': tr('Filtrar por ferramenta') }, h('option', { value: '' }, tr('Todas as ferramentas')));
    const fNivel = h('select', { id: 'v36-logs-nivel', 'aria-label': tr('Filtrar por nível') }, h('option', { value: '' }, tr('Níveis')), ['INFO', 'WARN', 'ERROR'].map((n) => h('option', { value: n }, n)));
    const fCliente = h('select', { id: 'v36-logs-cliente', 'aria-label': tr('Filtrar por cliente') }, h('option', { value: '' }, tr('Clientes')));
    const limpar = h('button', { type: 'button', class: 'v36l-mini', id: 'v36-logs-limpar', title: tr('Limpar filtros'), 'aria-label': tr('Limpar filtros') }, '↺');
    const corpo = h('div', { class: 'v36l-corpo', id: 'v36-terminal', role: 'log', 'aria-label': tr('Fluxo de eventos do núcleo') });
    const contador = h('span', { id: 'v36-logs-contador' }, tr('Aguardando registros…'));
    const seguir = h('input', { type: 'checkbox', id: 'acompanhar', checked: true });
    const status = h('span', { class: 'v36l-status' }, h('i'), h('span', {}, tr('REGISTROS LOCAIS')));
    const aviso = h('div', { class: 'v36l-aviso', hidden: true }, tr('Histórico parcial: registros inválidos excluídos.'));
    const janela = h('div', { class: 'v36l-janela' });
    const tema = h('button', { type: 'button', class: 'v36l-mini', title: tr('Alternar tema do terminal'), 'aria-label': tr('Alternar tema do terminal'), 'aria-pressed': 'false' }, '◐');
    tema.addEventListener('click', () => { const claro = getComputedStyle(janela).getPropertyValue('--t-bg').trim() === '#f5f8fc'; janela.classList.toggle('escuro', claro); janela.classList.toggle('claro', !claro); tema.setAttribute('aria-pressed', String(claro)); });
    const exportar = h('button', { type: 'button', class: 'v36l-mini', title: tr('Exportar registros'), disabled: !root }, '⇩ ', tr('Exportar'));
    exportar.addEventListener('click', async () => { const r = await chamar(() => api.exportarLogs(root)); if (r?.exported) avisar(tr('Logs exportados.')); });
    const diagnostico = h('button', { type: 'button', id: 'ver-diagnostico' }, tr('Diagnóstico da interface'));
    diagnostico.addEventListener('click', async () => { const r = await chamar(api.diagnostico); if (!r) return; corpo.querySelector('.v36l-diagnostico')?.remove(); const painel = h('section', { class: 'v36l-diagnostico v36l-detalhe', 'aria-label': tr('Diagnóstico da interface') }, h('div', { class: 'v36l-detalhe-topo' }, h('span', {}, tr('Diagnóstico da interface'))), h('small', {}, tr('Metadados IPC, separados das métricas de QA.')), h('pre', {}, JSON.stringify(r.events, null, 2))); corpo.append(painel); painel.scrollIntoView({ block: 'nearest' }); });
    janela.append(
      h('div', { class: 'v36l-topo' }, h('span', { class: 'v36l-pontos', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('span', { class: 'v36l-caminho', 'data-i18n-ignore': '' }, 'prumo@local:~/logs ', h('strong', {}, '› ' + (root ? nomeProjeto : '—'))), status, h('div', { class: 'v36l-acoes' }, tema, exportar)),
      h('div', { class: 'v36l-ferramentas' }, h('span', { class: 'v36l-prompt', 'aria-hidden': 'true' }, '❯'), busca, fFerramenta, fNivel, fCliente, limpar),
      corpo,
      h('div', { class: 'v36l-rodape' }, h('div', { class: 'v36l-led' }, h('i'), contador), h('div', { class: 'v36l-rodape-acoes' }, h('label', {}, seguir, h('span', {}, tr('Seguir saída'))), diagnostico)));
    el.append(h('h1', { class: 'v36-sr' }, 'Logs'), janela);
    const boot = () => h('div', { class: 'v36l-boot' }, h('span', { class: 'v36l-destaque' }, 'Prumo QA'), ' · ', h('span', {}, tr('visualizador de logs')), h('br'),
      h('span', { class: 'v36l-sub' }, '● ', h('span', {}, tr('Terminal de eventos · registros locais do núcleo (MCP e CLI)'))), h('br'),
      h('span', { class: 'v36l-sub' }, tr('Selecione uma linha para inspecionar seus metadados. Nenhum comando é executado nesta tela.')));
    if (!root) { corpo.append(boot(), h('div', { class: 'v36l-vazio' }, semProjeto())); [busca, fFerramenta, fNivel, fCliente, limpar, seguir].forEach((c) => { c.disabled = true; }); contador.textContent = tr('Nenhum projeto selecionado'); return; }
    const chave = (e) => e.operationId + ':' + e.phase;
