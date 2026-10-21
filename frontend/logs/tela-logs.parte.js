/** Logs: tela, eventos, detalhes e filtros. */

  // ---------------- Logs: terminal de eventos do núcleo ----------------
  // Mesma regra de nível do núcleo (atividades.ts): FAIL/ERROR = 50, BLOCKED = 40, demais = 30.
  const nivelDe = (s) => (s === 'ERROR' || s === 'FAIL' ? 'ERROR' : s === 'BLOCKED' ? 'WARN' : 'INFO');
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
    const boot = (temLinhas) => temLinhas ? h('div', { class: 'v36l-boot' }, DS.info('Selecione uma linha para inspecionar seus metadados. Nenhum comando é executado nesta tela.', { rotulo: 'Como usar' })) : null;
    // Logs de conta são consultáveis mesmo sem projeto escolhido; QA depende de projeto vinculado.
    if (!root) aviso.textContent = tr('Sem projeto selecionado: exibindo apenas o histórico de ações da conta.');
    const chave = (e) => e.operationId + ':' + e.phase;
    function mensagem(e) {
      if (e.auditoria) return [h('span', {}, tr('Ação auditada')), ' · ', semTraducao(e.state + ' · ' + e.auditoria.tipo + ' · ' + ms(e.durationMs))];
      if (e.execucao) return [h('span', {}, tr('Execução registrada')), ' · ', semTraducao(e.state + ' · ' + e.execucao.tipo)];
      return e.phase === 'start' ? [h('span', {}, tr('Operação iniciada')), ' · ', semTraducao(e.origin + '/' + e.client)] : [h('span', {}, tr('Operação encerrada')), ' · ', semTraducao([e.state, e.summary?.code, ms(e.durationMs)].filter(Boolean).join(' · '))];
    }
    function detalhe(e) {
      const campos = [['Horário completo', e.at], ['Operação / correlação', e.operationId], ['Fase', e.phase], ['Ferramenta', e.tool], ['Origem', e.origin], ['Cliente (declarado)', e.client], ['Estado', e.state], ['Duração', ms(e.durationMs)], ['Código', e.summary?.code || '—'], ['Evidência', e.summary?.evidenceJobId || '—'],
        ...(e.auditoria ? [['Tipo de ação', e.auditoria.tipo], ['Conta responsável', e.auditoria.usuarioId || 'Não informada'], ['Projeto', e.auditoria.espacoId || 'Não informado'], ['Ambiente', e.auditoria.ambiente || 'Não informado pelo executor'], ['Dispositivo', e.auditoria.dispositivo || 'Não informado pelo executor'], ['Navegador', e.auditoria.navegador || 'Não informado pelo executor']] : []),
        ...(e.execucao ? [['Tipo de teste', e.execucao.tipo], ['Rotina', e.execucao.rotina || '—'], ['Ambiente', e.execucao.ambiente || 'Não informado pelo executor'], ['Dispositivo', 'Não informado pelo executor'], ['Navegador', 'Não informado pelo executor'], ['Resultado', e.execucao.resultado?.status || e.execucao.estado]] : [])];
      const ev = e.summary?.evidenceJobId;
      return h('div', { class: 'v36l-detalhe', role: 'region', 'aria-label': tr('Detalhes do log') },
        h('div', { class: 'v36l-detalhe-topo' }, '↳ ', h('span', {}, tr('Inspeção de evento')), ' · ', semTraducao('op-' + e.operationId.slice(0, 8))),
        h('dl', {}, campos.map(([k, v]) => h('div', {}, h('dt', {}, tr(k)), h('dd', { 'data-i18n-ignore': '' }, String(v))))),
        h('pre', {}, JSON.stringify(e.auditoria || e.execucao || e, null, 2)),
        h('small', {}, tr('Somente os metadados registrados pelo núcleo para esta operação.')),
        ev ? h('button', { type: 'button', class: 'v36l-mini', onclick: () => { estado.jobId = ev; void mostrar('evidencias'); } }, tr('Ver evidência')) : null);
    }
    function linha(e) {
      const nivel = nivelDe(e.state), ab = aberto === chave(e);
      const b = h('button', { type: 'button', class: 'v36l-linha v36-log-line', 'data-level': nivel, 'data-state': e.state, 'aria-expanded': String(ab), title: e.operationId },
        h('span', { class: 'v36l-hora' }, hms(e.at)), h('span', { class: 'v36l-nivel', 'data-level': nivel }, nivel), h('span', { class: 'v36l-op' }, 'op-' + e.operationId.slice(0, 6)),
        h('span', { class: 'v36l-fase' }, e.tool), h('span', { class: 'v36l-msg' }, ...mensagem(e)), h('span', { class: 'v36l-seta', 'aria-hidden': 'true' }, ab ? '⌃' : '⌄'));
      b.addEventListener('click', () => { aberto = ab ? null : chave(e); desenhar(); corpo.querySelector('[data-log="' + chave(e) + '"]')?.scrollIntoView({ block: 'nearest' }); });
      return h('div', { class: 'v36l-evento', 'data-log': chave(e) }, b, ab ? detalhe(e) : null);
    }
    function desenhar() {
      const q = busca.value.trim().toLowerCase();
      const linhas = eventos.filter((e) => (!fFerramenta.value || e.tool === fFerramenta.value) && (!fNivel.value || nivelDe(e.state) === fNivel.value) && (!fCliente.value || e.client === fCliente.value)
        && (!q || [e.operationId, e.tool, e.state, e.origin, e.client, e.phase, e.summary?.code].join(' ').toLowerCase().includes(q)));
      const diag = corpo.querySelector('.v36l-diagnostico'); corpo.replaceChildren(boot(linhas.length > 0), aviso, ...linhas.map(linha));
      if (!linhas.length) corpo.append(h('div', { class: 'v36l-vazio' }, eventos.length ? tr('Nenhum registro para estes filtros.') : tr('Nenhuma ação auditada nesta conta nem operação de QA neste projeto.')));
      if (diag) corpo.append(diag);
      const ops = new Set(linhas.map((e) => e.operationId)).size;
      contador.textContent = tr('{n} registros · {m} operações', { n: linhas.length, m: ops });
      if (seguir.checked && !aberto) corpo.scrollTop = corpo.scrollHeight;
    }
    function preencher(sel, valores) { const atual = sel.value; const primeiro = sel.options[0]; sel.replaceChildren(primeiro, ...valores.map((v) => h('option', { value: v }, v))); sel.value = valores.includes(atual) ? atual : ''; }
    async function carregar() {
      const [r, diagnosticos, jobs] = await Promise.all([
        root ? chamarSemAviso(() => api.logs(root, { limit: 1000 })) : Promise.resolve(null),
        chamarSemAviso(() => api.diagnostico()),
        estado.espaco?.id ? chamarSemAviso(() => api.execucoes({ espacoId: estado.espaco.id, limite: 200 })) : Promise.resolve(null)
      ]);
      if (estado.root !== root || estado.aba !== 'logs' || !janela.isConnected && eventos.length) return;
      const auditoria = diagnosticos?.auditoria;
      const registrosDeAcoes = (auditoria?.eventos || []).map(a => ({
        operationId: a.id, at: a.at, phase: 'end', tool: a.canal, state: a.estado, origin: 'INTERFACE',
        client: 'prumo', durationMs: a.duracaoMs, summary: { code: a.codigo }, auditoria: a
      }));
      const execucoes = (jobs?.execucoes || []).map(x => ({
        operationId: x.id, at: x.termino || x.terminadoEm || x.inicio || x.iniciadoEm || x.criadoEm,
        phase: 'end', tool: 'worker:' + x.tipo, state: x.resultado?.status || x.estado,
        origin: 'WORKER', client: 'prumo', durationMs: x.duracaoMs || 0,
        summary: { code: x.erro || null }, execucao: x
      })).filter(x => x.at);
      const novos = [...(r?.events || []), ...registrosDeAcoes, ...execucoes].sort((a, b) => a.at.localeCompare(b.at) || (a.phase === 'start' ? -1 : 1));
      const ass = novos.length + '|' + (novos.at(-1) ? chave(novos.at(-1)) + novos.at(-1).at : '') + '|' + r?.complete + '|' + auditoria?.invalidos;
      if (ass === assinatura) return; assinatura = ass; eventos = novos;
      aviso.hidden = !!r?.complete && !auditoria?.invalidos || !root && !auditoria?.invalidos;
      if (!aviso.hidden && auditoria?.invalidos) aviso.textContent = tr('Auditoria parcial: há registros inválidos.');
      else if (!root) { aviso.hidden = false; aviso.textContent = tr('Sem projeto selecionado: apenas ações da conta.'); }
      preencher(fFerramenta, [...new Set(eventos.map((e) => e.tool))].sort((a, b) => String(a).localeCompare(String(b)))); preencher(fCliente, [...new Set(eventos.map((e) => e.client))].sort((a, b) => String(a).localeCompare(String(b)))); desenhar();
    }
    function acompanhar() { clearInterval(estado.timer); status.classList.toggle('vivo', seguir.checked); status.lastChild.textContent = seguir.checked ? tr('AO VIVO · REGISTROS LOCAIS') : tr('REGISTROS LOCAIS'); if (seguir.checked) estado.timer = setInterval(carregar, 2000); }
    [busca].forEach((c) => c.addEventListener('input', desenhar)); [fFerramenta, fNivel, fCliente].forEach((c) => c.addEventListener('change', desenhar));
    limpar.addEventListener('click', () => { busca.value = ''; fFerramenta.value = ''; fNivel.value = ''; fCliente.value = ''; desenhar(); });
    seguir.addEventListener('change', () => { acompanhar(); if (seguir.checked) desenhar(); });
    await carregar(); if (!eventos.length) desenhar(); acompanhar();
  };
