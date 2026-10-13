'use strict';
// Grupo B (v40): Agendamentos (orquestração de rotinas de QA) e Execuções (histórico com etapas, logs e evidências).
// Usa os mesmos canais da agenda e da fila; nenhum resultado é calculado aqui. Horário perdido nunca vira executado.
(() => {
  const quando = (iso) => (iso ? hora(iso) : '—');
  const memoria = (tela, id) => ((estado.ds ||= {})[tela + ':' + id] ||= {});
  const PRECISA_AUT = ['smoke', 'regressao', 'validacao-ticket', 'k6', 'run-qase'];
  const ESTADOS_ROTINA = { ATIVA: 'Ativa', PAUSADA: 'Pausada', DESATIVADA: 'Desativada', CONCLUIDA: 'Concluída' };
  const fluxoDe = (r) => [rotuloTipo(r.tipo), r.capability].filter(Boolean).join(' · ');
  function autorizacaoChip(r) {
    if (!PRECISA_AUT.includes(r.tipo)) return DS.chip('Não exige');
    const v = r.autorizacoes.find((a) => a.estado === 'VIGENTE'); if (v) return DS.chip('Autorizada', 'ok');
    return r.autorizacoes.length ? DS.chip(r.autorizacoes[0].estado.replaceAll('_', ' '), 'aviso') : DS.chip('Sem automação', 'aviso');
  }

  // ======================= Agendamentos =======================
  abas.agenda = async (el) => {
    const espacos = await chamar(api.espacos); if (!espacos) return el.append(DS.cabecalho({ titulo: 'Agendamentos' }), DS.falhaConsulta('agenda'));
    if (!espacos.length) return el.append(DS.cabecalho({ titulo: 'Agendamentos' }), DS.estadoTela('vazio', 'Nenhum projeto cadastrado', 'Crie um projeto Prumo em Projetos para agendar rotinas.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))], { id: 'agenda-vazia' }));
    const w = await atualizarWorker(); const recarregar = () => mostrar('agenda');
    const mem = memoria('agenda', 'filtros'); mem.projeto ??= estado.espaco?.id || '';
    const lista = await chamar(() => api.agendaListar(mem.projeto || undefined)); if (!lista) return el.append(DS.cabecalho({ titulo: 'Agendamentos' }), DS.falhaConsulta('agenda'));
    const novo = () => abrirFormulario(espacos, null, recarregar);
    el.append(DS.cabecalho({ titulo: 'Agendamentos', contagem: lista.length, descricao: 'Rotinas de QA por projeto: fluxo, horário, autorização e destino dos resultados.',
      acoes: [DS.acao('Políticas e preferências', () => abrirPoliticas(espacos, recarregar), { id: 'agenda-politicas', icone: 'escudo' }), DS.acao(w?.pausado ? 'Retomar todos os agendamentos' : 'Pausar todos os agendamentos', async () => { if (await chamar(() => api.workerPausa(!w?.pausado))) recarregar(); }, { id: 'agenda-pausa', icone: w?.pausado ? 'play' : 'pausa' }), DS.acao('Nova rotina', novo, { id: 'rotina-nova', primaria: true, icone: 'mais' })] }));
    const ativas = lista.filter((r) => r.estado === 'ATIVA').length, pausadas = lista.filter((r) => r.estado === 'PAUSADA').length, semAut = lista.filter((r) => PRECISA_AUT.includes(r.tipo) && r.estado === 'ATIVA' && !r.autorizacoes.some((a) => a.estado === 'VIGENTE')).length;
    el.append(h('div', { id: 'agenda-worker' }, DS.resumo([[textoWorker(w), 'worker', nivelWorker(w) === 'ok' ? 'ok' : nivelWorker(w) === 'falha' ? 'falha' : 'aviso'], [w?.proximaExecucao ? hora(w.proximaExecucao) : tr('nenhuma agendada'), 'próxima execução'], [w?.pendentes ?? 0, 'pendentes na fila'], [ativas, 'rotinas ativas', 'ok'], [pausadas, 'pausadas', pausadas ? 'aviso' : null], [semAut, 'ativas sem autorização', semAut ? 'aviso' : null]])));
    const busca = DS.busca({ id: 'agenda-busca', placeholder: 'Buscar rotina', valor: mem.q || '' });
    const proj = DS.selecao({ id: 'agenda-projeto', rotulo: 'Projeto', opcoes: [['', 'Todos os projetos'], ...espacos.map((e) => [e.id, e.nome])], valor: mem.projeto, aoMudar: (v) => { mem.projeto = v; recarregar(); } });
    const est = DS.selecao({ id: 'agenda-estado', rotulo: 'Estado', opcoes: [['', 'Todos os estados'], ...Object.entries(ESTADOS_ROTINA)], valor: mem.estado || '' });
    const area = h('div', { id: 'agenda-lista' });
    el.append(DS.barra(busca.no, proj, est, h('span', { class: 'ds-meta-barra' }, tr('Horário perdido nunca conta como execução.'))), area);
    const desenhar = () => {
      mem.q = busca.input.value; mem.estado = est.value; const q = mem.q.trim().toLowerCase();
      const vis = lista.filter((r) => (!mem.estado || r.estado === mem.estado) && (!q || (r.nome + ' ' + rotuloTipo(r.tipo) + ' ' + (r.capability || '') + ' ' + (r.ticket || '')).toLowerCase().includes(q)));
      if (!lista.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhuma rotina criada ainda.', 'Uma rotina define o projeto, o fluxo de QA, o ambiente e quando executar.', [DS.acao('Nova rotina', novo, { primaria: true })], { id: 'agenda-vazia' })); return; }
      if (!vis.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhuma rotina para estes filtros')); return; }
      area.replaceChildren(DS.tabela({ id: 'rotinas-tabela', colunas: ['Rotina', { t: 'Projeto', classe: 'ds-opcional' }, { t: 'Ambiente', classe: 'ds-opcional' }, 'Frequência', 'Próxima execução', 'Última execução', 'Autorização', 'Estado', ''], linhas: vis.map((r) => {
        const p = espacos.find((e) => e.id === r.espacoId); const ult = r.ultimaExecucao;
        const alternar = r.estado === 'ATIVA' ? DS.acao('Pausar', async () => { if (await chamar(() => api.agendaEstado(r.id, 'pausar'))) recarregar(); }, { compacto: true, icone: 'pausa' }) : r.estado !== 'CONCLUIDA' ? DS.acao('Retomar', async () => { if (await chamar(() => api.agendaEstado(r.id, 'retomar'))) recarregar(); }, { compacto: true, icone: 'play' }) : null;
        return { attrs: { 'data-rotina': r.id }, abrir: () => abrirRotina(r, espacos, recarregar), rotuloAcessivel: tr('Abrir rotina {n}', { n: r.nome }),
          celulas: [h('div', {}, h('strong', {}, r.nome), h('span', { class: 'ds-sub' }, fluxoDe(r) + (r.ticket ? ' · ' + r.ticket : ''))), p?.nome || '—', tr(AMBIENTES[r.ambiente] || r.ambiente), { no: textoFrequencia(r), classe: 'ds-rotina-quando' }, { no: r.proximaExecucao ? hora(r.proximaExecucao) : '—', classe: 'ds-nowrap ds-rotina-quando' },
            ult ? h('div', {}, selo(ult.resultado || ult.estado), h('span', { class: 'ds-sub' }, quando(ult.em))) : h('span', { class: 'ds-falta' }, tr('ainda não executada')), autorizacaoChip(r), selo(r.estado), alternar ? { no: alternar, classe: 'ds-acao' } : ''] };
      }) }));
    };
    busca.input.addEventListener('input', desenhar); est.addEventListener('change', desenhar); desenhar();
  };
  function abrirFormulario(espacos, r, recarregar) {
    DS.modal(r ? tr('Editar rotina') : tr('Nova rotina'), formularioRotina(espacos, r, () => { DS.fecharModal(); recarregar(); }), { tamanho: 'md', subtitulo: r ? [DS.chip(fluxoDe(r))] : [h('span', {}, tr('Projeto, fluxo, ambiente e horário. A rotina prepara a execução; o resultado vem do núcleo.'))] });
    $('#rotina-nome')?.focus();
  }
  async function abrirRotina(r, espacos, recarregar) {
    const p = espacos.find((e) => e.id === r.espacoId); const precisa = PRECISA_AUT.includes(r.tipo); const ult = r.ultimaExecucao;
    const dias = h('input', { type: 'number', min: 1, max: 30, value: 7, id: 'aut-dias-' + r.id }); const usos = h('input', { type: 'number', min: 1, max: 1000, value: 20, id: 'aut-usos-' + r.id });
    const reabrir = async () => { const l = await chamar(() => api.agendaListar()); const nova = (l || []).find((x) => x.id === r.id); if (nova) abrirRotina(nova, espacos, recarregar); else { DS.fecharModal(); recarregar(); } };
    const vigente = r.autorizacoes.find((a) => a.estado === 'VIGENTE');
    const [nav, painel] = DS.abasModal([
      ['geral', tr('Visão geral'), null, () => [DS.meta([['Projeto', p?.nome || '—'], ['Fluxo', rotuloTipo(r.tipo)], ['Automação', r.capability || '—'], ['Ticket', r.ticket || '—'], ['Ambiente', tr(AMBIENTES[r.ambiente] || r.ambiente)], ['Frequência', textoFrequencia(r)], ['Próxima execução', r.proximaExecucao ? hora(r.proximaExecucao) : tr('nenhuma')], ['Fuso', r.fuso], ['Se perdido', r.politicaPerdido === 'EXECUTAR_UMA_VEZ' ? tr('Executar uma vez ao voltar') : tr('Pular e registrar como perdido')], ['Tolerância', tr('{n} min', { n: r.toleranciaMinutos })]], { linha: true }),
        DS.bloco('Última execução', ult ? h('p', {}, selo(ult.resultado || ult.estado), ' ', quando(ult.em), ult.motivo ? h('span', { class: 'ds-sub' }, ult.motivo) : null) : h('p', { class: 'suave' }, tr('ainda não executada'))),
        DS.bloco('Regras da rotina', h('ul', { class: 'ds-lista' }, h('li', {}, h('strong', {}, tr('Aprovação')), h('span', { class: 'ds-sub' }, precisa ? (vigente ? tr('Autorização vigente até {q}{u}.', { q: quando(vigente.validaAte), u: vigente.usos ? ' · ' + tr('usos {n}', { n: vigente.usos }) : '' }) : tr('Sem autorização vigente: a execução agendada fica BLOCKED até você autorizar.')) : tr('Consulta sem execução de testes: não exige autorização.'))),
          h('li', {}, h('strong', {}, tr('Em caso de falha')), h('span', { class: 'ds-sub' }, tr('O resultado FAIL, BLOCKED ou ERRO fica registrado em Execuções; o aviso segue as preferências de notificação.'))),
          h('li', {}, h('strong', {}, tr('Resultados')), h('span', { class: 'ds-sub' }, r.tipo === 'run-qase' ? tr('Execuções do Prumo; publicação na run do Qase somente com política aprovada.') : r.ticket ? tr('Execuções do Prumo; comentário no Jira somente com política aprovada.') : tr('Execuções do Prumo, com etapas, logs e evidências.'))))),
        DS.recolher('O que esta rotina pode fazer', h('ul', { class: 'ds-lista' }, r.permissoes.map((x) => h('li', {}, x)))),
        r.erros.length ? DS.recolher(tr('Problemas recentes ({n})', { n: r.erros.length }), h('ul', { class: 'ds-lista' }, r.erros.map((x) => h('li', {}, h('code', {}, x.codigo || ''), ' ', x.motivo))), { aberto: true }) : null]],
      ['autorizacao', tr('Autorização'), r.autorizacoes.length || null, () => (precisa ? [h('p', { class: 'suave' }, tr('Autoriza a execução agendada das automações desta rotina, com validade e limite de usos. Cada autorização pede confirmação do Windows.')),
        r.autorizacoes.length ? h('ul', { class: 'ds-lista' }, r.autorizacoes.map((a) => h('li', {}, h('code', {}, a.capability), ' ', selo(a.estado), h('span', { class: 'ds-sub' }, [a.validaAte ? tr('até {quando}', { quando: hora(a.validaAte) }) : '', a.usos ? tr('usos {n}', { n: a.usos }) : ''].filter(Boolean).join(' · ')), a.id && a.estado === 'VIGENTE' ? DS.acao('Revogar ' + a.capability, async () => { if (await chamar(() => api.agendaRevogar(a.id))) reabrir(); }, { compacto: true }) : null))) : h('p', { class: 'suave' }, tr('Sem automação associada.')),
        h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Validade (dias, 1–30)', dias), DS.campo('Máximo de execuções', usos), h('div', { class: 'ds-form-acoes' }, DS.acao('Autorizar execuções agendadas…', async () => { const x = await chamar(() => api.agendaAutorizar(r.id, Number(dias.value), Number(usos.value))); if (x && !x.canceled) { avisar(tr('Autorização registrada.')); reabrir(); } }, { primaria: true })))]
        : [DS.estadoTela('vazio', 'Esta rotina não exige autorização', 'Consultas não executam testes nem escrevem em serviços.', [], { compacto: true })])],
      ['execucoes', tr('Execuções'), null, async () => { const x = await chamar(() => api.execucoes({ rotinaId: r.id, limite: 20 })); const l = x?.execucoes || [];
        return l.length ? [DS.tabela({ colunas: ['Iniciada em', 'Origem', 'Duração', 'Resultado'], linhas: l.map((y) => ({ attrs: { 'data-exec-rotina': y.id }, abrir: () => abrirExecucao(y), celulas: [quando(y.inicio || y.criadoEm), y.origem === 'AGENDA' ? tr('Agenda') : tr('Manual'), duracao(y.duracaoMs), h('div', {}, selo(y.resultado?.status || y.estado), y.resultado?.motivo ? h('span', { class: 'ds-sub' }, y.resultado.motivo) : null)] })) }), DS.link('Ver todas em Execuções', () => { estado.filtroExec = { rotinaId: r.id, selecionadoQuando: estado.espaco?.id ?? null }; mostrar('execucoes'); })]
          : [DS.estadoTela('vazio', 'Nenhuma execução desta rotina', null, [], { compacto: true })]; }]
    ]);
    DS.modal(r.nome, [nav, painel, DS.rodape(
      DS.acao('Excluir', async () => { const x = await chamar(() => api.agendaExcluir(r.id)); if (x && !x.canceled) { DS.fecharModal(); recarregar(); } }, { classe: 'perigo' }), h('span', { class: 'ds-form-msg' }),
      r.estado !== 'DESATIVADA' && r.estado !== 'CONCLUIDA' ? DS.acao('Desativar', async () => { if (await chamar(() => api.agendaEstado(r.id, 'desativar'))) reabrir(); }) : null,
      r.estado === 'ATIVA' ? DS.acao('Pausar', async () => { if (await chamar(() => api.agendaEstado(r.id, 'pausar'))) reabrir(); }, { icone: 'pausa' }) : r.estado !== 'CONCLUIDA' ? DS.acao('Retomar', async () => { if (await chamar(() => api.agendaEstado(r.id, 'retomar'))) reabrir(); }, { icone: 'play' }) : null,
      DS.acao('Editar', () => abrirFormulario(espacos, r, recarregar), { icone: 'editar' }),
      DS.acao('Executar agora', async () => { const x = await chamar(() => api.agendaExecutar(r.id)); if (x) { avisar(tr('Rotina enfileirada. Testes pedem a sua autenticação do Windows.')); setTimeout(() => { if (estado.aba === 'agenda' && document.querySelector('#qualidade-dialog')?.open) reabrir(); }, 1500); } }, { primaria: true, icone: 'play' }))],
    { tamanho: 'lg', subtitulo: [selo(r.estado), DS.chip(fluxoDe(r)), p ? DS.origem('prumo', p.nome) : null, autorizacaoChip(r)] });
  }
  async function abrirPoliticas(espacos, recarregar) {
    const perm = await chamar(() => api.agendaPermissoes(estado.espaco?.id)); if (!perm) return;
    const prefs = [['iniciarComWindows', 'Iniciar o Prumo com o Windows (desligado por padrão; só você pode ligar)'], ['notificarAgenda', 'Avisar quando uma rotina falhar, for bloqueada ou concluir']].map(([k, t]) => h('label', {}, h('input', { type: 'checkbox', id: 'pref-' + k, checked: !!estado.prefs?.[k], onchange: async (e) => { const r = await chamar(() => api.salvarPreferencias({ [k]: e.target.checked })); if (r) estado.prefs = r.preferencias; } }), tr(t)));
    const [nav, painel] = DS.abasModal([
      ['jira', tr('Comentários no Jira'), perm.publicacoes.length || null, () => [blocoPoliticas(espacos, perm, () => { DS.fecharModal(); recarregar(); })]],
      ['qase', tr('Resultados no Qase'), (perm.escritas || []).length || null, () => [politicasQase(perm.escritas || [], espacos, () => { DS.fecharModal(); recarregar(); })]],
      ['residente', tr('Prumo residente'), null, () => [h('p', { id: 'residente' }, tr('Ao fechar a janela, o Prumo continua na bandeja do Windows para executar as rotinas. Para parar tudo, use "Sair do Prumo" no menu do ícone da bandeja: isso encerra o worker e os processos filhos.')), h('div', { class: 'ds-opcoes coluna' }, prefs)]]
    ]);
    DS.modal('Políticas e preferências', [nav, painel], { tamanho: 'md' });
  }

  // Políticas que deixam rotinas run-qase publicarem resultados no Qase: listar e revogar (a criação é feita na run local, em Testes › Runs).
  function politicasQase(itens, espacos, recarregar) {
    if (!itens.length) return DS.estadoTela('vazio', 'Nenhuma política de publicação no Qase', 'Sem política, as rotinas de run do Qase guardam os resultados só neste computador.', [], { compacto: true, id: 'politicas-qase-vazia' });
    return DS.tabela({ id: 'politicas-qase', colunas: ['Projeto', 'Runs', 'Validade', 'Usos', 'Estado', ''], linhas: itens.map((p) => ({ attrs: { 'data-politica-qase': p.id }, celulas: [
      espacos.find((e) => e.id === p.espacoId)?.nome || p.espacoId.slice(0, 8), p.runs.map((n) => '#' + n).join(', '), hora(p.validaAte), p.usos + '/' + p.maxUsos, selo(p.estado),
      p.estado === 'VIGENTE' ? { no: DS.acao('Revogar', async () => { if (await chamar(() => api.runRevogarPolitica(p.id))) { avisar(tr('Política revogada.')); recarregar(); } }, { compacto: true }), classe: 'ds-acao' } : ''] })) });
  }

  // ======================= Execuções =======================
  const ORIGENS = { MANUAL: 'Manual', AGENDA: 'Agenda' };
  const cenarios = (x) => { const c = x.resultado?.contagem; if (!c || !(c.pass + c.fail + c.blocked + c.notRun)) return null; return c; };
  abas.execucoes = async (el) => {
    const espacos = (await chamar(api.espacos)) || []; const f = estado.filtroExec || (estado.filtroExec = {});
    if (f.selecionadoQuando !== (estado.espaco?.id ?? null)) { for (const k of Object.keys(f)) delete f[k]; f.selecionadoQuando = estado.espaco?.id ?? null; }
    if (!f.espacoId && estado.espaco && f.todos !== true) f.espacoId = estado.espaco.id;
    const aplicar = (extra = {}) => { if (desde.value && ate.value && desde.value > ate.value) { avisar(tr('A data inicial deve ser anterior à data final.'), true); return; } estado.filtroExec = { espacoId: proj.value || undefined, todos: !proj.value, ticket: tk.value.trim().toUpperCase() || undefined, resultado: res.value || undefined, desde: desde.value, ate: ate.value, tipo: tipo.value, origem: org.value, rotinaId: f.rotinaId, selecionadoQuando: f.selecionadoQuando, ...extra }; mostrar('execucoes'); };
    const proj = DS.selecao({ id: 'f-projeto', rotulo: 'Projeto', opcoes: [['', 'Todos os projetos'], ...espacos.map((e) => [e.id, e.nome])], valor: f.espacoId || '', aoMudar: () => aplicar() });
    const tk = h('input', { id: 'f-ticket', placeholder: tr('Ticket'), 'aria-label': tr('Ticket'), value: f.ticket || '', maxlength: 40, class: 'ds-w-sm' }); tk.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') aplicar(); });
    const res = DS.selecao({ id: 'f-resultado', rotulo: 'Resultado', opcoes: [['', 'Qualquer resultado'], ...['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'ERRO_INFRA', 'INFO'].map((v) => [v, v])], valor: f.resultado || '', aoMudar: () => aplicar() });
    const tipo = DS.selecao({ id: 'f-tipo', rotulo: 'Fluxo', opcoes: [['', 'Qualquer fluxo'], ...Object.entries(TIPOS)], valor: f.tipo || '', aoMudar: () => aplicar() });
    const org = DS.selecao({ id: 'f-origem', rotulo: 'Origem', opcoes: [['', 'Qualquer origem'], ...Object.entries(ORIGENS)], valor: f.origem || '', aoMudar: () => aplicar() });
    const desde = h('input', { id: 'f-desde', type: 'date', 'aria-label': tr('Desde'), value: f.desde || '' }); const ate = h('input', { id: 'f-ate', type: 'date', 'aria-label': tr('Até'), value: f.ate || '' });
    const periodo = {}; if (f.desde) periodo.since = new Date(f.desde + 'T00:00:00').toISOString(); if (f.ate) periodo.until = new Date(f.ate + 'T23:59:59.999').toISOString();
    const [m, lista] = await Promise.all([chamar(() => api.metricasExecucoes(f.espacoId)), chamar(() => api.execucoes({ espacoId: f.espacoId, rotinaId: f.rotinaId, ticket: f.ticket, resultado: f.resultado, ...periodo, limite: 100 }))]); if (!lista) return el.append(DS.cabecalho({ titulo: 'Execuções' }), DS.falhaConsulta('execucoes'));
    const itens = lista.execucoes.filter((x) => (!f.tipo || x.tipo === f.tipo) && (!f.origem || x.origem === f.origem));
    el.append(DS.cabecalho({ titulo: 'Execuções', contagem: itens.length, descricao: 'Histórico das execuções do Prumo. As evidências ficam dentro de cada execução.',
      acoes: [DS.acao('Runs do Qase', () => mostrar('runs'), { id: 'exec-runs', icone: 'externo' }), DS.acao('Evidências CLI/MCP', () => { estado.jobId = undefined; mostrar('evidencias'); }, { id: 'exec-evidencias', icone: 'escudo', titulo: 'Evidências de validações solicitadas por agentes (MCP) ou pela linha de comando' })] }));
    if (m) el.append(DS.resumo([[m.execucoes, 'execuções'], [m.pass, 'PASS', 'ok'], [m.fail, 'FAIL', 'falha'], [m.blocked, 'BLOCKED', 'aviso'], [m.notRun, 'NOT_RUN'], [m.consultas, 'consultas (INFO)'], [m.falhasDeAgendamento, 'falhas de agendamento', m.falhasDeAgendamento ? 'falha' : null], [m.comentariosPendentes, 'comentários pendentes', m.comentariosPendentes ? 'aviso' : null]], { id: 'metricas-exec' }));
    el.append(DS.barra(proj, tk, res, tipo, org, h('span', { class: 'ds-periodo' }, tr('Período'), desde, tr('até'), ate), DS.acao('Filtrar', () => { if (!desde.reportValidity() || !ate.reportValidity()) return; aplicar(); }, { id: 'f-aplicar', icone: 'filtro' }),
      f.rotinaId ? DS.acao('Limpar filtro de rotina', () => { delete estado.filtroExec.rotinaId; mostrar('execucoes'); }, { compacto: true }) : null,
      h('span', { class: 'ds-meta-barra', title: tr('Até 100 registros por consulta. Fluxo e origem filtram os registros carregados. O período usa o horário deste computador.') }, tr('{n} de {t} registro(s)', { n: itens.length, t: lista.total }))));
    if (!itens.length) { el.append(DS.estadoTela('vazio', 'Nenhuma execução registrada para este filtro.', 'Execuções aparecem aqui quando uma rotina roda ou é executada agora.', [DS.acao('Abrir Agendamentos', () => mostrar('agenda'))], { id: 'exec-vazia' })); return; }
    el.append(DS.tabela({ id: 'tabela-exec', colunas: ['Execução', { t: 'Projeto', classe: 'ds-opcional' }, 'Fluxo', { t: 'Origem', classe: 'ds-opcional' }, 'Iniciada em', { t: 'Duração', classe: 'ds-opcional' }, 'Cenários', 'Resultado', 'Jira'], linhas: itens.map((x) => { const r = x.resultado; const c = cenarios(x);
      return { attrs: { 'data-exec': x.id }, abrir: () => abrirExecucao(x), rotuloAcessivel: tr('Abrir execução {n}', { n: x.rotina }),
        celulas: [h('div', {}, h('strong', {}, x.rotina), h('span', { class: 'ds-sub' }, [x.ticket, x.id.slice(0, 8)].filter(Boolean).join(' · '))), x.projeto, h('div', {}, rotuloTipo(x.tipo), x.capability ? h('span', { class: 'ds-sub' }, x.capability) : null), DS.origem(x.origem === 'AGENDA' ? 'prumo' : 'manual', tr(ORIGENS[x.origem] || x.origem || '—')),
          { no: h('div', {}, hora(x.inicio || x.criadoEm), x.estado === 'PERDIDO' ? h('span', { class: 'ds-sub' }, tr('horário planejado: {q}', { q: hora(x.slot) })) : null), classe: 'ds-nowrap' }, duracao(x.duracaoMs),
          c ? h('div', { class: 'ds-sub ds-m0' }, `${c.pass} PASS · ${c.fail} FAIL · ${c.blocked} BLOCKED · ${c.notRun} NOT_RUN`) : r && ['PASS', 'FAIL'].includes(r.status) ? h('span', { class: 'ds-falta' }, tr('sem cenários individuais')) : '—',
          h('div', {}, selo(r?.status || x.estado), r?.motivo ? h('span', { class: 'ds-sub' }, r.motivo) : x.erro ? h('span', { class: 'ds-sub' }, x.erro) : null),
          x.jira.estado === 'NAO_APLICAVEL' ? '—' : h('div', {}, selo(x.jira.estado), x.jira.comentarioId ? h('span', { class: 'ds-sub' }, '#' + x.jira.comentarioId) : null)] }; }) }));
  };
  // Evidência de uma execução: consultada uma vez e compartilhada pelas abas Logs e Evidências.
  function evidenciaDe(x) { if (!x.evidenciaId || !x.pastaLocal) return Promise.resolve(null); return (x._ev ||= api.evidencias(x.pastaLocal, x.evidenciaId).then((r) => (r.ok ? r.data : { erro: r.error }))); }
  function cartaoArquivo(ic, titulo, sub, ...acoes) { return h('div', { class: 'ds-arquivo' }, h('span', { class: 'ds-arquivo-ic' }, DS.icone(ic)), h('div', { class: 'ds-flex1' }, h('strong', {}, titulo), sub ? h('span', { class: 'ds-sub' }, sub) : null, acoes.length ? h('div', { class: 'ds-cab-acoes ds-mt' }, acoes) : null)); }
  const exportar = (dados, primeiro) => DS.acao('Exportar JSON…', async () => { const s = await chamar(() => api.exportarTela('evidencia-json', JSON.stringify(dados, null, 2))); if (s?.exported) avisar(tr('Evidência exportada.')); }, { id: primeiro ? 'evidencia-exportar' : null, compacto: true, icone: 'baixar' });
  function painelEvidencias(ev, { vazio = 'Nenhuma evidência registrada para esta execução.' } = {}) {
    if (!ev) return [DS.estadoTela('vazio', vazio, 'Consultas e execuções bloqueadas antes de rodar não produzem arquivos.', [], { compacto: true })];
    if (ev.erro) return [DS.estadoTela('erro', 'Evidência indisponível', ev.erro, [], { compacto: true })];
    if (!ev.results.length) return [DS.estadoTela('vazio', ev.reason || vazio, null, [], { compacto: true })];
    return ev.results.slice().reverse().map((e, i) => h('div', { class: 'ds-bloco', 'data-evidencia': e.jobId || '' }, h('h3', { class: 'ds-h' }, e.capability, ' ', selo(e.status)),
      h('p', { class: 'suave ds-mb' }, quando(e.endedAt) + ' · ' + tr('código de saída {c}', { c: e.exitCode ?? 'n/d' }) + ' · ' + tr('escopo da evidência: {s}', { s: e.evidenceScope }) + ' · ' + (e.executed ? tr('executado') : tr('não executado'))),
      e.reason ? DS.alerta(e.reason, e.status === 'PASS' ? 'ok' : e.status === 'FAIL' ? 'falha' : 'aviso') : null,
      h('div', { class: 'ds-arquivos' }, cartaoArquivo('codigo', tr('Registro da evidência (JSON)'), e.evidencePath, exportar(ev, i === 0)), e.stdout ? cartaoArquivo('arquivo', tr('Saída padrão (stdout)'), tr('{n} caracteres', { n: e.stdout.length })) : null, e.stderr ? cartaoArquivo('alerta', tr('Saída de erro (stderr)'), tr('{n} caracteres', { n: e.stderr.length })) : null),
      e.cases.length ? DS.bloco(tr('Cenários individuais ({n})', { n: e.cases.length }), DS.tabela({ colunas: ['Cenário', 'Resultado', 'Evidência'], linhas: e.cases.map((c) => ({ celulas: [c.id, selo(c.status), h('span', { class: 'ds-resumo-texto' }, c.evidence)] })) })) : h('p', { class: 'suave' }, tr('Sem resultados individuais verificáveis.')),
      h('p', { class: 'ds-nota-perm' }, DS.icone('escudo'), h('span', {}, tr('Capturas de tela, vídeos e relatórios só aparecem quando o executor os registra; nenhum arquivo é presumido.'))))).concat(ev.trust ? [h('p', { class: 'suave' }, ev.trust)] : []);
  }
  function painelLogs(x, ev) {
    const blocos = [];
    if (ev && !ev.erro) for (const e of ev.results) { if (e.stdout) blocos.push(DS.bloco(tr('stdout · {c}', { c: e.capability }), h('pre', { class: 'ds-codigo' }, e.stdout))); if (e.stderr) blocos.push(DS.bloco(tr('stderr · {c}', { c: e.capability }), h('pre', { class: 'ds-codigo' }, e.stderr))); }
    if (x.erro) blocos.unshift(DS.alerta(x.erro, 'falha'));
    if (x.resultado?.detalhes) blocos.unshift(DS.bloco('Detalhes do resultado', h('pre', { class: 'ds-codigo' }, x.resultado.detalhes)));
    return blocos.length ? blocos : [DS.estadoTela('vazio', 'Nenhum log registrado para esta execução.', null, [], { compacto: true })];
  }
  async function jiraPrevia(x, caixa) {
    const p = await chamar(() => api.jiraPrevia(x.id)); if (!p) return;
    caixa.replaceChildren(h('p', { class: 'suave' }, tr('Prévia do comentário para {t} (nada foi enviado):', { t: p.ticket })), h('pre', { class: 'ds-codigo' }, p.texto), h('div', { class: 'ds-cab-acoes ds-mt' }, DS.acao('Publicar no Jira…', async () => { const r = await chamar(() => api.jiraPublicar(x.id)); if (r && !r.canceled) { avisar(r.estado === 'PUBLICADO' ? tr('Comentário publicado.') : tr('Publicação não concluída: {e}', { e: r.erro || r.estado }), r.estado !== 'PUBLICADO'); mostrar('execucoes'); } }, { id: 'jira-publicar', primaria: true })));
  }
  function abrirExecucao(x) {
    const r = x.resultado; const c = cenarios(x); const jiraCx = h('div', { id: 'jira-caixa' }); const saida = h('div', { id: 'exec-saida' });
    const falhou = r && ['FAIL', 'ERRO_INFRA'].includes(r.status);
    const [nav, painel] = DS.abasModal([
      ['resumo', tr('Resumo'), null, () => [DS.meta([['ID', h('code', {}, x.id)], ['Projeto', x.projeto], ['Rotina', x.rotina], ['Fluxo', rotuloTipo(x.tipo)], ['Automação', x.capability || '—'], ['Ambiente', x.ambiente || '—'], ['Ticket', x.ticket || '—'], ['Origem', tr(ORIGENS[x.origem] || x.origem || '—')], ['Executor', x.executor], ['Iniciada em', quando(x.inicio || x.criadoEm)], ['Terminada em', x.termino ? quando(x.termino) : null], ['Duração', duracao(x.duracaoMs)]], { linha: true }),
        x.estado === 'PERDIDO' ? DS.alerta(tr('Horário perdido ({q}): nada foi executado.', { q: hora(x.slot) }), 'aviso') : null,
        r?.motivo ? DS.alerta(r.motivo, r.status === 'PASS' ? 'ok' : r.status === 'FAIL' ? 'falha' : 'aviso') : null,
        c ? DS.resumo([[c.pass, 'PASS', 'ok'], [c.fail, 'FAIL', 'falha'], [c.blocked, 'BLOCKED', 'aviso'], [c.notRun, 'NOT_RUN']]) : null,
        r?.detalhes ? DS.bloco('Detalhes do resultado', DS.texto(r.detalhes)) : null,
        x.ticket ? DS.bloco('Jira', h('p', {}, selo(x.jira.estado), x.jira.comentarioId ? ' #' + x.jira.comentarioId : ''), r && ['PASS', 'FAIL'].includes(r.status) ? DS.acao('Comentário Jira', () => jiraPrevia(x, jiraCx), { icone: 'mensagem' }) : null, jiraCx) : null]],
      ['etapas', tr('Etapas'), x.tentativas.length || null, () => [DS.tempo([{ titulo: tr('Enfileirada'), sub: quando(x.criadoEm) + ' · ' + tr(ORIGENS[x.origem] || x.origem || ''), tom: 'info' },
        ...x.tentativas.map((t) => ({ titulo: h('span', {}, tr('Tentativa {n}', { n: t.n }), ' ', selo(t.estado), t.codigo ? ' ' + t.codigo : ''), sub: quando(t.inicio) + (t.fim ? ' → ' + quando(t.fim) : ''), tom: DS.tom(t.estado) })),
        { titulo: h('span', {}, tr('Resultado'), ' ', selo(r?.status || x.estado)), sub: x.termino ? quando(x.termino) : tr('sem término registrado'), tom: DS.tom(r?.status || x.estado) }]),
        c ? DS.bloco('Cenários', h('p', { class: 'suave' }, `${c.pass} PASS · ${c.fail} FAIL · ${c.blocked} BLOCKED · ${c.notRun} NOT_RUN`)) : null]],
      ['logs', tr('Logs'), null, async () => painelLogs(x, await evidenciaDe(x))],
      ['evidencias', tr('Evidências'), x.evidenciaId ? 1 : 0, async () => painelEvidencias(await evidenciaDe(x))]
    ]);
    DS.modal(x.rotina + ' · ' + hora(x.inicio || x.criadoEm), [saida, nav, painel, DS.rodape(h('span', { class: 'ds-form-msg' }, tr('Anexos e comentários em execuções ainda não têm armazenamento no núcleo.')),
      falhou && x.espacoId ? DS.acao('Preparar bug (rascunho)', async () => {
        const dados = { resumo: `[Prumo QA] ${x.rotina}: ${r.status}`.slice(0, 255), descricao: [tr('Execução: {id}', { id: x.id }), tr('Projeto: {p}', { p: x.projeto }), tr('Fluxo: {f}', { f: rotuloTipo(x.tipo) + (x.capability ? ' · ' + x.capability : '') }), tr('Ambiente: {a}', { a: x.ambiente }), tr('Resultado: {r}', { r: r.status + (r.motivo ? ' · ' + r.motivo : '') }), '', r.detalhes || ''].join('\n').slice(0, 8000), rotulos: ['prumo-qa'], ...(x.ticket ? { origem: x.ticket } : {}) };
        const p = await chamar(() => api.propostaCriar(x.espacoId, 'bug', dados, x.ticket || '', '')); if (p) { saida.replaceChildren(DS.alerta(tr('Rascunho de bug criado em Testes › Casos › Propostas. Revise antes de publicar no Jira.'), 'ok')); }
      }, { id: 'exec-bug', icone: 'alerta' }) : null)],
    { tamanho: 'lg', subtitulo: [selo(r?.status || x.estado), DS.chip(rotuloTipo(x.tipo)), x.capability ? DS.chip(x.capability) : null, DS.origem(x.origem === 'AGENDA' ? 'prumo' : 'manual', tr(ORIGENS[x.origem] || x.origem || '—'))] });
  }
  // Evidências CLI/MCP do projeto (rota "evidencias", sempre em modal dentro de Execuções).
  abas.evidencias = async (el) => {
    const e = estado.espaco; const raiz = e?.pastaLocal || estado.root; const alvo = estado.jobId; estado.jobId = undefined;
    if (!raiz) { el.append(DS.estadoTela('vazio', 'Nenhuma pasta de projeto vinculada', 'Vincule a pasta do repositório em Projetos para consultar evidências locais.', [], { compacto: true })); return; }
    const r = await chamar(() => api.evidencias(raiz, alvo)); if (!r) { el.append(DS.estadoTela('erro', 'Não foi possível consultar a evidência.', null, [], { compacto: true })); return; }
    el.append(h('p', { class: 'suave' }, alvo ? tr('Filtrada pela evidência {id}', { id: alvo }) : tr('Resultados reais preservados em .prumo/evidencias do projeto. Código de saída 0 valida a rodada, não cada cenário.')), ...painelEvidencias(r, { vazio: 'Nenhuma evidência para esta consulta.' }));
  };
  async function abrirEvidencia(e, jobId) {
    const raiz = e?.pastaLocal || estado.root; const vivo = DS.modal(tr('Evidência {id}', { id: String(jobId).slice(0, 8) }), DS.carregando(), { tamanho: 'lg' });
    const r = raiz ? await api.evidencias(raiz, jobId) : { ok: false, error: 'PASTA_AUSENTE' }; if (vivo && !vivo.isConnected) return;
    DS.modal(tr('Evidência {id}', { id: String(jobId).slice(0, 8) }), painelEvidencias(r.ok ? r.data : { erro: r.error }), { tamanho: 'lg' });
  }
  window.PrumoOperacao = Object.freeze({ abrirExecucao, abrirEvidencia });
})();
// Textos das políticas de publicação no Qase (auditoria 2.9).
Object.assign(window.PRUMO_EN || (window.PRUMO_EN = {}), {
  'Resultados no Qase': 'Results in Qase', 'Nenhuma política de publicação no Qase': 'No Qase publishing policy',
  'Sem política, as rotinas de run do Qase guardam os resultados só neste computador.': 'Without a policy, Qase run routines keep results on this computer only.',
  'Projeto': 'Project', 'Runs': 'Runs', 'Validade': 'Valid until', 'Usos': 'Uses', 'Estado': 'State', 'Revogar': 'Revoke', 'Política revogada.': 'Policy revoked.'
});
