/** Reúne trecho visual da função runs para o bundle fluxos-v40. */
  async function novoPlano(e, esc) {
    const mem = memoria('testes', e.id); const casos = mem.casos || (mem.casos = await carregarQase(e, mem, 'casos'));
    const titulo = h('input', { id: 'plano-titulo', maxlength: 255 }); const marcados = new Set(); const saida = h('div', { id: 'plano-saida' });
    DS.modal('Novo plano no Qase', [!esc ? DS.alerta('Escrita no Qase desligada. Habilite em Conexões para criar planos.', 'aviso', 'cadeado') : null, h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título do plano', titulo, { inteiro: true }),
      h('div', { class: 'ds-campo inteiro' }, h('span', {}, tr('Casos ({n})', { n: casos.itens.length })), casos.itens.length ? h('div', { class: 'ds-opcoes coluna', id: 'plano-casos' }, casos.itens.map((c) => h('label', {}, h('input', { type: 'checkbox', 'data-caso': c.id, onchange: (ev) => (ev.target.checked ? marcados.add(c.id) : marcados.delete(c.id)) }), `${c.id} · ${c.title}`))) : h('p', { class: 'suave' }, tr('Nenhum caso retornado pelo Qase.')))), saida,
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar plano…', async () => { const r = await executarOperacao(e, 'qase.criar_plano', { titulo: titulo.value || 'Plano Prumo', casos: [...marcados] }); if (r) { saida.replaceChildren(painelResultado(r)); if (r.estado === 'CONFIRMADA') delete mem.planos; } }, { id: 'plano-criar', primaria: true, desabilitado: !esc }))], { tamanho: 'md' });
  }
  async function telaPlanos(e, mem, corpo) {
    const area = h('div', { id: 'planos-area' }, DS.esqueleto(5)); const fonte = h('div'); corpo.append(DS.barra(DS.acao('Atualizar', async () => { delete mem.planos; await carregar(); }, { id: 'planos-atualizar', icone: 'atualizar' })), fonte, area);
    async function carregar() {
      area.replaceChildren(DS.esqueleto(5)); const p = (mem.planos = mem.planos || await carregarQase(e, mem, 'planos')); fonte.replaceChildren(fonteQase(p, 'plano(s)'));
      if (p.erro && !p.itens.length) { area.replaceChildren(DS.estadoTela('erro', 'Não foi possível consultar os planos', p.erro)); return; }
      if (!p.itens.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhum plano retornado pelo Qase')); return; }
      area.replaceChildren(DS.tabela({ id: 'planos-tabela', colunas: ['ID', 'Plano', 'Casos', 'Atualizado'], linhas: p.itens.map((x) => ({ attrs: { 'data-plano': String(x.id) }, abrir: () => abrirPlano(e, x), rotuloAcessivel: tr('Abrir plano {id}', { id: x.id }), celulas: [{ no: String(x.id), classe: 'ds-id' }, h('div', {}, x.title || '—', x.description ? h('span', { class: 'ds-sub' }, String(x.description).slice(0, 160)) : null), x.cases_count != null ? String(x.cases_count) : '—', quando(x.updated_at || x.updated)] })) }));
    }
    await carregar();
  }
  async function abrirPlano(e, x) {
    const vivo = DS.modal(tr('Plano {id}', { id: x.id }), DS.carregando('Consultando o Qase…'), { tamanho: 'md' });
    const r = await api.servicoConsultar(e.id, 'qase', 'plano', {}, String(x.id)); if (vivo && !vivo.isConnected) return;
    if (!r.ok) { DS.modal(tr('Plano {id}', { id: x.id }), DS.estadoTela('erro', 'Não foi possível abrir o plano', r.error), { tamanho: 'md' }); return; }
    const d = r.data.dados || {}; const casos = Array.isArray(d.cases) ? d.cases : [];
    DS.modal(tr('Plano {id}', { id: x.id }) + ' · ' + (d.title || x.title || ''), h('div', { class: 'ds-detalhe-main' }, DS.meta([['Origem', DS.origem('qase', 'Qase · ' + vinc(e, 'qase').recurso.chave)], ['Casos', String(casos.length || d.cases_count || 0)], ['Atualizado', quando(d.updated_at || x.updated_at)], ['Consultado', quando(r.data.consultadoEm)]], { linha: true }),
      d.description ? DS.bloco('Descrição', DS.texto(d.description)) : null,
      DS.bloco('Casos do plano', casos.length ? h('div', { class: 'ds-celula-nos' }, casos.map((c) => noRef(e, { tipo: 'qase', id: String(c.case_id ?? c.id), vinculoId: vinc(e, 'qase').id }, tr('Caso {id}', { id: c.case_id ?? c.id })))) : h('p', { class: 'suave' }, tr('O Qase não retornou casos para este plano.')))), { tamanho: 'md', subtitulo: [DS.origem('qase'), DS.chip('Plano')] });
  }
  // ---- Runs: locais (preparadas no Prumo) e do Qase ----
  // Códigos de estado de run documentados pela API do Qase; código desconhecido aparece como está.
  const estadoRunQase = (x) => { const m = { 0: ['Ativa', 'info'], 1: ['Concluída', 'ok'], 2: ['Interrompida', 'aviso'], 3: ['Em andamento', 'info'] }[x.status]; const c = DS.chip(x.status_text || (m ? m[0] : tr('Estado {s}', { s: x.status })), m?.[1]); c.title = tr('Código do Qase: {s}', { s: x.status }); return c; };
  const contar = (r) => { const s = r.casos.map((c) => c.resultado?.status ?? 'NOT_RUN'); const n = (x) => s.filter((y) => y === x).length; return { total: s.length, pass: n('PASS'), fail: n('FAIL'), blocked: n('BLOCKED'), notRun: n('NOT_RUN') }; };
  function barraResultado(c) { const t = Math.max(1, c.total); const seg = (n, v) => { const s = h('span'); s.style.width = (n / t) * 100 + '%'; s.style.background = `var(${v})`; return s; }; return h('div', { class: 'ds-coluna' }, h('div', { class: 'ds-progresso', role: 'img', 'aria-label': `${c.pass} PASS · ${c.fail} FAIL · ${c.blocked} BLOCKED · ${c.notRun} NOT_RUN` }, seg(c.pass, '--ok'), seg(c.fail, '--falha'), seg(c.blocked, '--aviso'), seg(c.notRun, '--linha')), h('span', { class: 'ds-sub' }, `${c.pass} PASS · ${c.fail} FAIL · ${c.blocked} BLOCKED · ${c.notRun} NOT_RUN`)); }
  // Runs = tudo o que roda ou rodou: execuções locais (manuais e agendadas), runs preparadas no Prumo e runs do Qase, numa lista só.
  const SITUACOES = [['', 'Qualquer situação'], ['andamento', 'Em andamento'], ['concluida', 'Concluídas'], ['falha', 'Com falha']];
  const ORIGENS_RUN = [['', 'Qualquer origem'], ['exec', 'Execuções locais'], ['prumo', 'Runs preparadas'], ['qase', 'Runs do Qase']];
  const situacaoExec = (x) => (['PENDENTE', 'EXECUTANDO'].includes(x.estado) ? 'andamento' : ['FAIL', 'BLOCKED', 'ERRO_INFRA'].includes(x.resultado?.status) || ['ERRO', 'PERDIDO'].includes(x.estado) ? 'falha' : 'concluida');
  const situacaoPrumo = (r) => (['PREPARADA', 'CRIADA', 'PARCIAL'].includes(r.estado) ? 'andamento' : r.casos.some((c) => c.resultado?.status === 'FAIL') ? 'falha' : 'concluida');
  const situacaoQase = (x) => ([0, 3].includes(x.status) ? 'andamento' : x.stats?.failed > 0 ? 'falha' : 'concluida');
  async function telaRuns(e, mem, corpo, esc) {
    const vq = e ? vinc(e, 'qase') : null; const filtro = mem.filtroRuns || (mem.filtroRuns = { origem: '', situacao: '' });
    const rotinaId = estado.filtroExec?.rotinaId; if (rotinaId) filtro.origem = 'exec';
    const area = h('div', { id: 'runs-area' }, DS.esqueleto(5)); const fonte = h('div'); const resumo = h('div', { id: 'runs-resumo' });
    const org = DS.selecao({ id: 'runs-f-origem', rotulo: 'Origem', opcoes: ORIGENS_RUN.filter(([k]) => vq || k !== 'qase'), valor: filtro.origem, aoMudar: (v) => { filtro.origem = v; desenhar(); } });
    const sit = DS.selecao({ id: 'runs-f-situacao', rotulo: 'Situação', opcoes: SITUACOES, valor: filtro.situacao, aoMudar: (v) => { filtro.situacao = v; desenhar(); } });
    corpo.append(DS.barra(org, sit, DS.acao('Atualizar', async () => { delete mem.runsQase; await carregar(); }, { id: 'runs-atualizar', icone: 'atualizar' }),
      rotinaId ? DS.acao('Limpar filtro de rotina', () => { delete estado.filtroExec.rotinaId; mostrar('runs'); }, { id: 'runs-limpar-rotina', compacto: true }) : null,
      DS.acao('Evidências CLI/MCP', () => { estado.jobId = undefined; mostrar('evidencias'); }, { id: 'exec-evidencias', icone: 'escudo', titulo: 'Evidências de validação gravadas na pasta do projeto' })), resumo, fonte, area);
    let dados = null;
    function desenhar() {
      if (!dados) return;
      const { rl, remotas, execs, ligadas } = dados; const passa = (origem, sitDaLinha) => (!filtro.origem || filtro.origem === origem) && (!filtro.situacao || filtro.situacao === sitDaLinha);
      const linhasExec = execs.filter((x) => passa('exec', situacaoExec(x))).map((x) => { const r = x.resultado; const c = r?.contagem && r.contagem.pass + r.contagem.fail + r.contagem.blocked + r.contagem.notRun ? r.contagem : null;
        return { attrs: { 'data-exec': x.id }, abrir: () => window.PrumoOperacao.abrirExecucao(x), rotuloAcessivel: tr('Abrir execução {n}', { n: x.rotina }),
          celulas: [h('div', {}, h('strong', {}, x.rotina), h('span', { class: 'ds-sub' }, [x.ticket, x.id.slice(0, 8), e ? null : x.projeto].filter(Boolean).join(' · '))), h('div', {}, DS.chip(x.origem === 'AGENDA' ? 'Agenda' : 'Manual'), h('span', { class: 'ds-sub' }, rotuloTipo(x.tipo))), '—',
            c ? String(c.pass + c.fail + c.blocked + c.notRun) : '—', c ? h('div', {}, barraResultado({ total: c.pass + c.fail + c.blocked + c.notRun, pass: c.pass, fail: c.fail, blocked: c.blocked, notRun: c.notRun }), h('span', { class: 'ds-sub ds-m0' }, `${c.pass} PASS · ${c.fail} FAIL · ${c.blocked} BLOCKED · ${c.notRun} NOT_RUN`)) : r && ['PASS', 'FAIL'].includes(r.status) ? h('span', { class: 'ds-falta' }, tr('sem cenários individuais')) : '—',
            h('div', {}, selo(r?.status || x.estado), r?.motivo ? h('span', { class: 'ds-sub' }, r.motivo) : x.erro ? h('span', { class: 'ds-sub' }, x.erro) : null, x.jira && x.jira.estado !== 'NAO_APLICAVEL' ? h('span', { class: 'ds-sub' }, 'Jira ', selo(x.jira.estado), x.jira.comentarioId ? ' #' + x.jira.comentarioId : '') : null, h('span', { class: 'ds-sub' }, quando(x.inicio || x.criadoEm)))] }; });
      const linhasPrumo = rl.filter((r) => passa('prumo', situacaoPrumo(r))).map((r) => { const c = contar(r); return { attrs: { 'data-run': r.id }, abrir: () => abrirRunLocal(e, r.id, esc), rotuloAcessivel: tr('Abrir run {t}', { t: r.titulo }), celulas: [h('div', {}, h('strong', {}, r.titulo), h('span', { class: 'ds-sub' }, r.runIdRemoto ? tr('Qase #{id}{c}', { id: r.runIdRemoto, c: r.confirmadaNoQase ? ' · ' + tr('confirmada') : '' }) : tr('ainda não criada no Qase'))), DS.origem('prumo', 'Prumo'), r.ambiente, String(c.total), barraResultado(c), selo(r.estado)] }; });
      const linhasQase = remotas.itens.filter((x) => !ligadas.has(String(x.id)) && passa('qase', situacaoQase(x))).map((x) => ({ attrs: { 'data-run-qase': String(x.id) }, abrir: () => abrirRunQase(e, x), rotuloAcessivel: tr('Abrir run do Qase {id}', { id: x.id }), celulas: [h('div', {}, h('strong', {}, x.title || tr('Run {id}', { id: x.id })), h('span', { class: 'ds-sub' }, tr('Qase #{id}', { id: x.id, c: '' }))), DS.origem('qase', 'Qase'), x.environment?.title || '—', x.cases_count != null ? String(x.cases_count) : '—', x.stats ? barraResultado({ total: x.stats.total || 0, pass: x.stats.passed || 0, fail: x.stats.failed || 0, blocked: x.stats.blocked || 0, notRun: x.stats.untested || 0 }) : '—', x.status != null ? estadoRunQase(x) : '—'] }));
      const linhas = [...linhasExec, ...linhasPrumo, ...linhasQase];
      area.replaceChildren(linhas.length ? DS.tabela({ id: 'runs-tabela', colunas: ['Run', 'Origem', { t: 'Ambiente', classe: 'ds-opcional' }, { t: 'Casos', classe: 'ds-opcional' }, 'Resultados', 'Estado'], linhas })
        : DS.estadoTela('vazio', 'Nenhuma run encontrada', filtro.origem || filtro.situacao ? 'Nenhuma run combina com os filtros escolhidos.' : 'Execuções aparecem aqui quando uma rotina roda ou é executada agora; use "Preparar run" para escolher casos do Qase.', [], { id: 'runs-vazio' }));
    }
    async function carregar() {
      area.replaceChildren(DS.esqueleto(5));
      const [locais, remotas, lista, m] = await Promise.all([e ? api.runs(e.id) : Promise.resolve({ ok: true, data: [] }), vq ? (mem.runsQase || carregarQase(e, mem, 'runs', { limite: 50 })) : Promise.resolve({ itens: [], em: null }), chamar(() => api.execucoes({ espacoId: e?.id, rotinaId, limite: 100 })), chamar(() => api.metricasExecucoes(e?.id))]); if (vq) mem.runsQase = remotas;
      const rl = locais.ok ? locais.data : []; const ligadas = new Set(rl.map((r) => String(r.runIdRemoto)).filter((x) => x !== 'null' && x !== 'undefined'));
      dados = { rl, remotas, execs: lista?.execucoes || [], ligadas };
      resumo.replaceChildren(m ? DS.resumo([[m.execucoes, 'execuções'], [m.pass, 'PASS', 'ok'], [m.fail, 'FAIL', 'falha'], [m.blocked, 'BLOCKED', 'aviso'], [m.notRun, 'NOT_RUN'], [m.consultas, 'consultas (INFO)'], [m.falhasDeAgendamento, 'falhas de agendamento', m.falhasDeAgendamento ? 'falha' : null], [m.comentariosPendentes, 'comentários pendentes', m.comentariosPendentes ? 'aviso' : null]], { id: 'metricas-exec' }) : '');
      fonte.replaceChildren(h('div', { class: 'ds-fontes' }, h('span', { role: 'status' }, DS.origem('prumo', 'Prumo'), tr('{n} execução(ões) e {r} run(s) preparada(s) neste computador', { n: dados.execs.length, r: rl.length })), !vq ? null : remotas.erro ? h('span', { role: 'status' }, DS.origem('qase', 'Qase'), ' ', DS.chip(remotas.erro, 'falha')) : h('span', { role: 'status' }, DS.origem('qase', 'Qase'), tr('{n} run(s) · consultado {q}', { n: remotas.itens.length, q: quando(remotas.em) }))));
      desenhar();
    }
    await carregar();
  }
  async function prepararRun(e) {
    const mem = memoria('testes', e.id); const casos = mem.casos || (mem.casos = await carregarQase(e, mem, 'casos'));
    const titulo = h('input', { id: 'run-titulo', maxlength: 255 }); const amb = selecaoSimples('run-ambiente', [['teste', 'Teste'], ['homologacao', 'Homologação'], ['local', 'Local']]); const marcados = new Set();
    DS.modal('Preparar run', [h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título da execução', titulo), DS.campo('Ambiente', amb),
      h('div', { class: 'ds-campo inteiro' }, h('span', {}, tr('Cenários ({n})', { n: casos.itens.length })), casos.itens.length ? h('div', { id: 'run-casos', class: 'ds-opcoes coluna' }, casos.itens.map((c) => h('label', {}, h('input', { type: 'checkbox', 'data-caso': c.id, onchange: (ev) => (ev.target.checked ? marcados.add(c.id) : marcados.delete(c.id)) }), `${c.id} · ${c.title}`, ' ', chipTipoCaso(c)))) : h('p', { class: 'suave' }, casos.erro ? casos.erro : tr('Nenhum caso retornado pelo Qase.')))),
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('A run é preparada neste computador; criá-la no Qase é um passo separado.')), DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Preparar run', async () => { const sel = casos.itens.filter((c) => marcados.has(c.id)).map((c) => ({ casoId: c.id, titulo: String(c.title).slice(0, 255) })); const r = await chamar(() => api.runPreparar({ espacoId: e.id, titulo: titulo.value, ambiente: amb.value, casos: sel })); if (r) { avisar(tr('Run preparada localmente. Ainda não existe no Qase.')); DS.fecharModal(); mostrar('testes'); } }, { id: 'run-preparar', primaria: true }))], { tamanho: 'md' });
  }
  async function abrirRunLocal(e, id, esc) {
    const rs = await chamar(() => api.runs(e.id)); const r = (rs || []).find((x) => x.id === id); if (!r) return;
    const recarregar = () => abrirRunLocal(e, id, esc); const c = contar(r); const saida = h('div', { id: 'run-saida' });
    const casoSel = h('select', { id: 'man-caso-' + r.id }, r.casos.filter((x) => !x.capability || x.resultado?.origem === 'MANUAL' || !x.resultado).map((x) => h('option', { value: x.casoId }, `${x.casoId} · ${x.titulo}`)));
    const st = selecaoSimples('man-status-' + r.id, [['PASS', 'PASS'], ['FAIL', 'FAIL'], ['BLOCKED', 'BLOCKED']]); const cm = h('input', { id: 'man-comentario-' + r.id, maxlength: 2000 });
    const dias = h('input', { type: 'number', min: 1, max: 30, value: 7, id: 'pol-run-dias-' + r.id }); const usos = h('input', { type: 'number', min: 1, max: 1000, value: 5, id: 'pol-run-usos-' + r.id });
    const passo = async (fn, msg) => { const x = await chamar(fn); if (x && !x.canceled) { if (msg) avisar(typeof msg === 'function' ? msg(x) : msg); recarregar(); } return x; };
    const [nav, painel] = DS.abasModal([
      ['casos', tr('Casos'), r.casos.length, () => [DS.resumo([[c.pass, 'PASS', 'ok'], [c.fail, 'FAIL', 'falha'], [c.blocked, 'BLOCKED', 'aviso'], [c.notRun, 'sem resultado']]),
        DS.tabela({ colunas: ['Caso', 'Automação', 'Resultado', 'Origem do resultado', 'Publicado'], linhas: r.casos.map((x) => ({ attrs: { 'data-caso': x.casoId }, abrir: () => abrirCaso(e, x.casoId), rotuloAcessivel: tr('Abrir caso {id}', { id: x.casoId }), celulas: [h('div', {}, String(x.casoId), h('span', { class: 'ds-sub' }, x.titulo)), x.capability ? x.capability + (x.casoRunner ? ' #' + x.casoRunner : '') : DS.chip('Manual'), h('div', {}, selo(x.resultado?.status ?? 'NOT_RUN'), x.resultado?.comentario ? h('span', { class: 'ds-sub' }, x.resultado.comentario.slice(0, 160)) : null), x.resultado ? (x.resultado.origem === 'MANUAL' ? tr('declarado manualmente') : tr('execução')) + ' · ' + x.resultado.granularidade : '—', x.publicado ? DS.chip('Publicado', 'ok') : DS.chip('Local')] })) })]],
      ['manual', tr('Resultado manual'), null, () => [DS.info('Registra o resultado observado por você, marcado como MANUAL. Não substitui resultado de automação.'), h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Caso', casoSel), DS.campo('Resultado', st), DS.campo('Comentário do resultado manual', cm, { inteiro: true }), h('div', { class: 'ds-form-acoes' }, DS.acao('Declarar resultado manual…', () => passo(() => api.runResultado(r.id, Number(casoSel.value), st.value, cm.value), tr('Resultado manual registrado (marcado MANUAL).')), { primaria: true })))]],
      ['publicacao', tr('Publicação'), null, () => [DS.info('Política para publicar resultados desta run por rotina agendada. Sem política, os resultados ficam locais.'), h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Validade (dias)', dias), DS.campo('Máximo de publicações', usos), h('div', { class: 'ds-form-acoes' }, DS.acao('Aprovar política de publicação agendada…', () => passo(() => api.runPolitica(e.id, r.runIdRemoto, Number(dias.value), Number(usos.value)), tr('Política registrada para a run {id}.', { id: r.runIdRemoto })), { id: 'run-politica-' + r.id, desabilitado: !r.runIdRemoto })))]]
    ]);
    DS.modal(r.titulo, [DS.meta([['Origem', DS.origem('prumo', 'Prumo')], ['Run no Qase', r.runIdRemoto ? '#' + r.runIdRemoto + (r.confirmadaNoQase ? ' · ' + tr('confirmada') : '') : tr('ainda não criada')], ['Ambiente', r.ambiente], ['Estado', selo(r.estado)], ['Casos', String(c.total)]], { linha: true }), saida, nav, painel,
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('Cada envio ao Qase pede confirmação nativa.')),
        r.casos.some((x) => x.resultado?.status === 'FAIL') ? DS.acao('Preparar bugs das falhas', async () => { const x = await chamar(() => api.runBugs(r.id)); if (x) avisar(tr('{n} rascunho(s) de bug em Testes › Casos › Propostas.', { n: x.length })); }, { id: 'run-bugs-' + r.id, icone: 'alerta' }) : null,
        !r.runIdRemoto ? DS.acao('Criar run no Qase…', () => passo(() => api.runCriar(r.id)), { id: 'run-criar-' + r.id, desabilitado: !esc }) : DS.acao('Conferir no Qase', async () => { const x = await chamar(() => api.servicoConsultar(e.id, 'qase', 'resultados', { limite: 100 }, String(r.runIdRemoto))); if (x) avisar(tr('O Qase retornou {n} resultado(s) para a run {id}.', { n: x.dados.length, id: r.runIdRemoto })); }, { id: 'run-conferir-' + r.id }),
        DS.acao('Executar automações…', () => passo(() => api.runExecutar(r.id), (x) => tr('Execução concluída: {r}', { r: x.executadas.map((z) => z.capability + '=' + z.status).join(', ') || '—' })), { id: 'run-exec-' + r.id, icone: 'play', desabilitado: !r.casos.some((x) => x.capability), titulo: r.casos.some((x) => x.capability) ? null : 'Nenhum caso desta run tem automação declarada.' }),
        DS.acao('Publicar resultados…', () => passo(() => api.runPublicar(r.id, false), (x) => (x.publicados ? tr('{n} resultado(s) publicado(s) e conferidos no Qase.', { n: x.publicados }) : tr('Nada pendente para publicar.'))), { id: 'run-pub-' + r.id, primaria: true, desabilitado: !r.runIdRemoto || !esc }))], { tamanho: 'lg', subtitulo: [DS.origem('prumo', 'Run preparada no Prumo'), selo(r.estado)] });
  }
  async function abrirRunQase(e, x) {
    const vivo = DS.modal(tr('Run {id}', { id: x.id }), DS.carregando('Consultando o Qase…'), { tamanho: 'lg' });
    const r = await api.servicoConsultar(e.id, 'qase', 'resultados', { limite: 100 }, String(x.id)); if (vivo && !vivo.isConnected) return;
    const res = r.ok ? r.data.dados : [];
    DS.modal((x.title || tr('Run {id}', { id: x.id })), [DS.meta([['Origem', DS.origem('qase', 'Qase · ' + vinc(e, 'qase').recurso.chave)], ['ID', '#' + x.id], ['Estado', x.status != null ? estadoRunQase(x) : '—'], ['Casos', x.cases_count != null ? String(x.cases_count) : '—'], ['Consultado', r.ok ? quando(r.data.consultadoEm) : '—']], { linha: true }),
      DS.info('Run consultada no Qase. Resultados externos não são evidência de execução local.'),
      DS.bloco(tr('Resultados ({n})', { n: res.length }), !r.ok ? DS.estadoTela('erro', 'Resultados indisponíveis', r.error) : res.length ? DS.tabela({ colunas: ['Caso', 'Status', 'Tipo', 'Duração', 'Término'], linhas: res.map((z) => ({ abrir: () => abrirCaso(e, z.case_id), rotuloAcessivel: tr('Abrir caso {id}', { id: z.case_id }), celulas: [String(z.case_id), DS.chip(String(z.status), z.status === 'passed' ? 'ok' : z.status === 'failed' ? 'falha' : z.status === 'blocked' ? 'aviso' : null), z.is_api_result ? tr('automação (API)') : tr('manual'), z.time_spent_ms != null ? duracao(z.time_spent_ms) : '—', quando(z.end_time)] })) }) : h('p', { class: 'suave' }, tr('Nenhum resultado registrado nesta run.')))], { tamanho: 'lg', subtitulo: [DS.origem('qase'), DS.chip('Run do Qase')] });
  }

  // ======================= Rastreabilidade =======================
