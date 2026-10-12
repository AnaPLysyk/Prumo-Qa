'use strict';
/** Mostra os indicadores e filtros da tela Métricas. */
abas.metricas = async (el) => {
  el.append(h('h1', {}, 'Métricas')); if (!estado.root) return el.append(semProjeto());
  const v = await chamar(() => api.visao(estado.root)); if (!v) return; const m = v.metrics;
  const ag = await chamar(() => api.metricasExecucoes(estado.espaco?.id)); const ops = estado.espaco ? await chamar(() => api.operacoes(estado.espaco.id, 50)) : null;
  if (!m.complete) el.append(h('div', { class: 'nota' }, 'Histórico parcial: ' + m.problems.length + ' registro(s) inválido(s) ou truncado(s) foram excluídos; os números abaixo são parciais.'));
  const contaOps = (s) => (ops || []).filter(o => o.estado === s).length;
  const defs = [
    { id: 'atividade', rotulo: 'Atividade', visuais: ['numeros', 'barras'], itens: () => [{ n: m.totalOperations, rot: 'interações registradas' }, { n: m.mcpCalls, rot: 'chamadas via MCP' }, { n: m.coverageReviews, rot: 'revisões de cobertura' }, { n: m.contextAnalyses, rot: 'análises de contexto' }, { n: m.findings, rot: 'achados' }, { n: m.recommendations, rot: 'recomendações' }, { n: m.gaps, rot: 'lacunas identificadas' }, { n: m.candidateRedundancies, rot: 'redundâncias candidatas' }, { n: m.executionsRequested, rot: 'execuções solicitadas' }, { n: m.executions.PASS, rot: 'PASS' }, { n: m.executions.FAIL, rot: 'FAIL' }, { n: m.executions.BLOCKED, rot: 'BLOCKED' }, { n: m.executions.NOT_RUN, rot: 'NOT_RUN' }, { n: m.errors, rot: 'erros' }, { n: m.unfinished, rot: 'sem término observado' }] },
    { id: 'resultados', rotulo: 'Resultados', visuais: ['numeros', 'barras', 'rosca'], itens: () => [{ n: m.executions.PASS, rot: 'PASS', cor: '--ok' }, { n: m.executions.FAIL, rot: 'FAIL', cor: '--falha' }, { n: m.executions.BLOCKED, rot: 'BLOCKED', cor: '--aviso' }, { n: m.executions.NOT_RUN, rot: 'NOT_RUN', cor: '--neutro' }] },
    { id: 'agenda', rotulo: 'Agenda', visuais: ['numeros', 'barras'], itens: () => ag ? [{ n: ag.execucoes, rot: 'execuções' }, { n: ag.pass, rot: 'PASS', cor: '--ok' }, { n: ag.fail, rot: 'FAIL', cor: '--falha' }, { n: ag.rotinasAtivas, rot: 'rotinas ativas' }, { n: ag.falhasDeAgendamento, rot: 'falhas de agendamento', cor: '--falha' }, { n: ag.comentariosPendentes, rot: 'comentários pendentes', cor: '--aviso' }] : [] },
    { id: 'externas', rotulo: 'Operações externas', visuais: ['numeros', 'barras', 'rosca'], itens: () => ops ? [{ n: contaOps('CONFIRMADA'), rot: 'confirmadas', cor: '--ok' }, { n: contaOps('FALHA'), rot: 'com falha', cor: '--falha' }, { n: contaOps('BLOQUEADA'), rot: 'bloqueadas', cor: '--aviso' }, { n: contaOps('ENVIADA'), rot: 'sem confirmação', cor: '--neutro' }] : [] }
  ];
  const pref = lerPrefMet(); const ativos = new Set(pref.ativos || ['atividade', 'resultados']); const visual = { ...(pref.visual || {}) };
  const corpo = h('div', { id: 'met-corpo' });
  const salvar = () => gravarPrefMet({ ativos: [...ativos], visual });
  const desenhar = () => corpo.replaceChildren(...defs.filter(d => ativos.has(d.id)).map(d => {
    const atual = d.visuais.includes(visual[d.id]) ? visual[d.id] : 'numeros'; const nomes = { numeros: 'Números', barras: 'Barras', rosca: 'Rosca' };
    const seg = h('div', { class: 'segmentos', role: 'group', 'aria-label': 'Visual' }, d.visuais.map(k => h('button', { type: 'button', 'aria-pressed': String(k === atual), onclick: () => { visual[d.id] = k; salvar(); desenhar(); } }, nomes[k])));
    const itens = d.itens();
    return h('section', { class: 'modulo', 'data-modulo': d.id }, h('div', { class: 'modulo-topo' }, h('h2', {}, d.rotulo), seg), itens.length ? visualItens(itens, atual) : h('p', { class: 'suave' }, 'Selecione um projeto para ver estes dados.'));
  }));
  el.append(h('div', { class: 'met-barra', role: 'group', 'aria-label': 'Módulos' }, defs.map(d => h('label', { class: 'chip-modulo' }, h('input', { type: 'checkbox', checked: ativos.has(d.id), onchange: (e) => { if (e.target.checked) ativos.add(d.id); else ativos.delete(d.id); salvar(); desenhar(); } }), d.rotulo))), corpo);
  desenhar();
  el.append(h('details', { class: 'modulo' }, h('summary', {}, 'Detalhes'),
    h('p', {}, 'Última atividade: ', h('strong', {}, hora(m.lastActivity)), ' · Duração média: ', h('strong', {}, ms(m.averageDurationMs))),
    h('p', { class: 'suave' }, 'Tokens e custos: ' + m.providerMetrics + '. Alterações aplicadas pela IA: não observadas pelo Prumo.'),
    h('p', { class: 'suave' }, 'Última chamada MCP de: ' + (v.lastMcpClient || 'nenhum cliente') + ' (identidade declarada pelo cliente). ' + v.connection),
    h('p', { class: 'suave' }, 'Dados em: ', h('code', {}, v.directory))));
};

