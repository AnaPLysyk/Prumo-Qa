'use strict';
// Agendamentos: rotinas e permissoes do worker.
// Usa os mesmos canais da agenda e da fila; nenhum resultado é calculado aqui. Horário perdido nunca vira executado.
(() => {
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
    const mem = memoriaDaTela('agenda', 'filtros'); mem.projeto ??= estado.espaco?.id || '';
    const lista = await chamar(() => api.agendaListar(mem.projeto || undefined)); if (!lista) return el.append(DS.cabecalho({ titulo: 'Agendamentos' }), DS.falhaConsulta('agenda'));
    const novo = () => abrirFormulario(espacos, null, recarregar);
    el.append(DS.cabecalho({ titulo: 'Agendamentos', contagem: lista.length, info: 'Rotinas de QA por projeto: fluxo, horário, autorização e destino dos resultados.',
      acoes: [DS.acao('Políticas e preferências', () => abrirPoliticas(espacos, recarregar), { id: 'agenda-politicas', icone: 'escudo' }), DS.acao(w?.pausado ? 'Retomar todos os agendamentos' : 'Pausar todos os agendamentos', async () => { if (await chamar(() => api.workerPausa(!w?.pausado))) recarregar(); }, { id: 'agenda-pausa', icone: w?.pausado ? 'play' : 'pausa' }), DS.acao('Nova rotina', novo, { id: 'rotina-nova', primaria: true, icone: 'mais' })] }));
    const ativas = lista.filter((r) => r.estado === 'ATIVA').length, pausadas = lista.filter((r) => r.estado === 'PAUSADA').length, semAut = lista.filter((r) => PRECISA_AUT.includes(r.tipo) && r.estado === 'ATIVA' && !r.autorizacoes.some((a) => a.estado === 'VIGENTE')).length;
    el.append(h('div', { id: 'agenda-worker' }, DS.resumo([[w?.proximaExecucao ? hora(w.proximaExecucao) : '—', 'próxima execução'], [w?.pendentes ?? 0, 'pendentes na fila'], [ativas, 'rotinas ativas', 'ok'], [pausadas, 'pausadas', pausadas ? 'aviso' : null], [semAut, 'ativas sem autorização', semAut ? 'aviso' : null]])));
    const busca = DS.busca({ id: 'agenda-busca', placeholder: 'Buscar rotina', valor: mem.q || '' });
    const proj = DS.selecao({ id: 'agenda-projeto', rotulo: 'Projeto', opcoes: [['', 'Todos os projetos'], ...espacos.map((e) => [e.id, e.nome])], valor: mem.projeto, aoMudar: (v) => { mem.projeto = v; recarregar(); } });
    const est = DS.selecao({ id: 'agenda-estado', rotulo: 'Estado', opcoes: [['', 'Todos os estados'], ...Object.entries(ESTADOS_ROTINA)], valor: mem.estado || '' });
    const area = h('div', { id: 'agenda-lista' });
    el.append(DS.barra(busca.no, proj, est, DS.info('Horário perdido nunca conta como execução.')), area);
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
            ult ? h('div', {}, selo(ult.resultado || ult.estado), h('span', { class: 'ds-sub' }, hora(ult.em))) : h('span', { class: 'ds-falta' }, tr('ainda não executada')), autorizacaoChip(r), selo(r.estado), alternar ? { no: alternar, classe: 'ds-acao' } : ''] };
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
        DS.bloco('Última execução', ult ? h('p', {}, selo(ult.resultado || ult.estado), ' ', hora(ult.em), ult.motivo ? h('span', { class: 'ds-sub' }, ult.motivo) : null) : h('p', { class: 'suave' }, tr('ainda não executada'))),
        DS.bloco('Regras da rotina', h('ul', { class: 'ds-lista' }, h('li', {}, h('strong', {}, tr('Aprovação')), h('span', { class: 'ds-sub' }, precisa ? (vigente ? tr('Autorização vigente até {q}{u}.', { q: hora(vigente.validaAte), u: vigente.usos ? ' · ' + tr('usos {n}', { n: vigente.usos }) : '' }) : tr('Sem autorização vigente: a execução agendada fica BLOCKED até você autorizar.')) : tr('Consulta sem execução de testes: não exige autorização.'))),
          h('li', {}, h('strong', {}, tr('Em caso de falha')), h('span', { class: 'ds-sub' }, tr('O resultado FAIL, BLOCKED ou ERRO fica registrado em Execuções; o aviso segue as preferências de notificação.'))),
          h('li', {}, h('strong', {}, tr('Resultados')), h('span', { class: 'ds-sub' }, r.tipo === 'run-qase' ? tr('Execuções do Prumo; publicação na run do Qase somente com política aprovada.') : r.ticket ? tr('Execuções do Prumo; comentário no Jira somente com política aprovada.') : tr('Execuções do Prumo, com etapas, logs e evidências.'))))),
        DS.recolher('O que esta rotina pode fazer', h('ul', { class: 'ds-lista' }, r.permissoes.map((x) => h('li', {}, x)))),
        r.erros.length ? DS.recolher(tr('Problemas recentes ({n})', { n: r.erros.length }), h('ul', { class: 'ds-lista' }, r.erros.map((x) => h('li', {}, h('code', {}, x.codigo || ''), ' ', x.motivo))), { aberto: true }) : null]],
      ['autorizacao', tr('Autorização'), r.autorizacoes.length || null, () => (precisa ? [h('p', { class: 'suave' }, tr('Autoriza a execução agendada das automações desta rotina, com validade e limite de usos. Cada autorização pede confirmação do sistema.')),
        r.autorizacoes.length ? h('ul', { class: 'ds-lista' }, r.autorizacoes.map((a) => h('li', {}, h('code', {}, a.capability), ' ', selo(a.estado), h('span', { class: 'ds-sub' }, [a.validaAte ? tr('até {quando}', { quando: hora(a.validaAte) }) : '', a.usos ? tr('usos {n}', { n: a.usos }) : ''].filter(Boolean).join(' · ')), a.id && a.estado === 'VIGENTE' ? DS.acao('Revogar ' + a.capability, async () => { if (await chamar(() => api.agendaRevogar(a.id))) reabrir(); }, { compacto: true }) : null))) : h('p', { class: 'suave' }, tr('Sem automação associada.')),
        h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Validade (dias, 1–30)', dias), DS.campo('Máximo de execuções', usos), h('div', { class: 'ds-form-acoes' }, DS.acao('Autorizar execuções agendadas…', async () => { const x = await chamar(() => api.agendaAutorizar(r.id, Number(dias.value), Number(usos.value))); if (x && !x.canceled) { avisar(tr('Autorização registrada.')); reabrir(); } }, { primaria: true })))]
        : [DS.estadoTela('vazio', 'Esta rotina não exige autorização', 'Consultas não executam testes nem escrevem em serviços.', [], { compacto: true })])],
      ['execucoes', tr('Execuções'), null, async () => { const x = await chamar(() => api.execucoes({ rotinaId: r.id, limite: 20 })); const l = x?.execucoes || [];
        return l.length ? [DS.tabela({ colunas: ['Iniciada em', 'Origem', 'Duração', 'Resultado'], linhas: l.map((y) => ({ attrs: { 'data-exec-rotina': y.id }, abrir: () => window.PrumoOperacao.abrirExecucao(y), celulas: [hora(y.inicio || y.criadoEm), y.origem === 'AGENDA' ? tr('Agenda') : tr('Manual'), duracaoDaExecucao(y.duracaoMs), h('div', {}, selo(y.resultado?.status || y.estado), y.resultado?.motivo ? h('span', { class: 'ds-sub' }, y.resultado.motivo) : null)] })) }), DS.link('Ver todas em Execuções', () => { estado.filtroExec = { rotinaId: r.id, selecionadoQuando: estado.espaco?.id ?? null }; mostrar('execucoes'); })]
          : [DS.estadoTela('vazio', 'Nenhuma execução desta rotina', null, [], { compacto: true })]; }]
    ]);
    DS.modal(r.nome, [nav, painel, DS.rodape(
      DS.acao('Excluir', async () => { const x = await chamar(() => api.agendaExcluir(r.id)); if (x && !x.canceled) { DS.fecharModal(); recarregar(); } }, { classe: 'perigo' }), h('span', { class: 'ds-form-msg' }),
      r.estado !== 'DESATIVADA' && r.estado !== 'CONCLUIDA' ? DS.acao('Desativar', async () => { if (await chamar(() => api.agendaEstado(r.id, 'desativar'))) reabrir(); }) : null,
      r.estado === 'ATIVA' ? DS.acao('Pausar', async () => { if (await chamar(() => api.agendaEstado(r.id, 'pausar'))) reabrir(); }, { icone: 'pausa' }) : r.estado !== 'CONCLUIDA' ? DS.acao('Retomar', async () => { if (await chamar(() => api.agendaEstado(r.id, 'retomar'))) reabrir(); }, { icone: 'play' }) : null,
      DS.acao('Editar', () => abrirFormulario(espacos, r, recarregar), { icone: 'editar' }),
      DS.acao('Executar agora', async () => { const x = await chamar(() => api.agendaExecutar(r.id)); if (x) { avisar(tr('Rotina enfileirada. Testes pedem a sua autenticação do sistema.')); setTimeout(() => { if (estado.aba === 'agenda' && document.querySelector('#qualidade-dialog')?.open) reabrir(); }, 1500); } }, { primaria: true, icone: 'play' }))],
    { tamanho: 'lg', subtitulo: [selo(r.estado), DS.chip(fluxoDe(r)), p ? DS.origem('prumo', p.nome) : null, autorizacaoChip(r)] });
  }
  async function abrirPoliticas(espacos, recarregar) {
    const perm = await chamar(() => api.agendaPermissoes(estado.espaco?.id)); if (!perm) return;
    const prefs = [['iniciarComWindows', 'Iniciar o Prumo com o sistema (desligado por padrão; só você pode ligar)'], ['notificarAgenda', 'Avisar quando uma rotina falhar, for bloqueada ou concluir']].map(([k, t]) => h('label', {}, h('input', { type: 'checkbox', id: 'pref-' + k, checked: !!estado.prefs?.[k], onchange: async (e) => { const r = await chamar(() => api.salvarPreferencias({ [k]: e.target.checked })); if (r) estado.prefs = r.preferencias; } }), tr(t)));
    const [nav, painel] = DS.abasModal([
      ['jira', tr('Comentários no Jira'), perm.publicacoes.length || null, () => [blocoPoliticas(espacos, perm, () => { DS.fecharModal(); recarregar(); })]],
      ['qase', tr('Resultados no Qase'), (perm.escritas || []).length || null, () => [politicasQase(perm.escritas || [], espacos, () => { DS.fecharModal(); recarregar(); })]],
      ['residente', tr('Prumo residente'), null, () => [h('p', { id: 'residente' }, tr('Ao fechar a janela, o Prumo continua na bandeja do sistema para executar as rotinas. Para parar tudo, use "Sair do Prumo" no menu do ícone da bandeja: isso encerra o worker e os processos filhos.')), h('div', { class: 'ds-opcoes coluna' }, prefs)]]
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

})();
