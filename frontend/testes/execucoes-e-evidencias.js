'use strict';
/** Testes: visualiza Runs e evidencias locais. */
(() => {
  const ORIGENS = { MANUAL: 'Manual', AGENDA: 'Agenda' };
  const cenarios = (x) => { const c = x.resultado?.contagem; if (!c || !(c.pass + c.fail + c.blocked + c.notRun)) return null; return c; };
  // Evidência de uma execução: consultada uma vez e compartilhada pelas abas Logs e Evidências.
  function evidenciaDe(x) { if (!x.evidenciaId || !x.pastaLocal) return Promise.resolve(null); return (x._ev ||= api.evidencias(x.pastaLocal, x.evidenciaId).then((r) => (r.ok ? r.data : { erro: r.error }))); }
  function cartaoArquivo(ic, titulo, sub, ...acoes) { return h('div', { class: 'ds-arquivo' }, h('span', { class: 'ds-arquivo-ic' }, DS.icone(ic)), h('div', { class: 'ds-flex1' }, h('strong', {}, titulo), sub ? h('span', { class: 'ds-sub' }, sub) : null, acoes.length ? h('div', { class: 'ds-cab-acoes ds-mt' }, acoes) : null)); }
  const exportar = (dados, primeiro) => DS.acao('Exportar JSON…', async () => { const s = await chamar(() => api.exportarTela('evidencia-json', JSON.stringify(dados, null, 2))); if (s?.exported) avisar(tr('Evidência exportada.')); }, { id: primeiro ? 'evidencia-exportar' : null, compacto: true, icone: 'baixar' });
  function painelEvidencias(ev, { vazio = 'Nenhuma evidência registrada para esta execução.' } = {}) {
    if (!ev) return [DS.estadoTela('vazio', vazio, 'Consultas e execuções bloqueadas antes de rodar não produzem arquivos.', [], { compacto: true })];
    if (ev.erro) return [DS.estadoTela('erro', 'Evidência indisponível', ev.erro, [], { compacto: true })];
    if (!ev.results.length) return [DS.estadoTela('vazio', ev.reason || vazio, null, [], { compacto: true })];
    return ev.results.slice().reverse().map((e, i) => h('div', { class: 'ds-bloco', 'data-evidencia': e.jobId || '' }, h('h3', { class: 'ds-h' }, e.capability, ' ', selo(e.status)),
      h('p', { class: 'suave ds-mb' }, hora(e.endedAt) + ' · ' + tr('código de saída {c}', { c: e.exitCode ?? 'n/d' }) + ' · ' + tr('escopo da evidência: {s}', { s: e.evidenceScope }) + ' · ' + (e.executed ? tr('executado') : tr('não executado'))),
      e.reason ? DS.alerta(e.reason, e.status === 'PASS' ? 'ok' : e.status === 'FAIL' ? 'falha' : 'aviso') : null,
      h('div', { class: 'ds-arquivos' }, cartaoArquivo('codigo', tr('Registro da evidência (JSON)'), e.evidencePath, exportar(ev, i === 0)), e.stdout ? cartaoArquivo('arquivo', tr('Saída padrão (stdout)'), tr('{n} caracteres', { n: e.stdout.length })) : null, e.stderr ? cartaoArquivo('alerta', tr('Saída de erro (stderr)'), tr('{n} caracteres', { n: e.stderr.length })) : null),
      e.cases.length ? DS.bloco(tr('Cenários individuais ({n})', { n: e.cases.length }), DS.tabela({ colunas: ['Cenário', 'Resultado', 'Evidência'], linhas: e.cases.map((c) => ({ celulas: [c.id, selo(c.status), h('span', { class: 'ds-resumo-texto' }, c.evidence)] })) })) : h('p', { class: 'suave' }, tr('Sem resultados individuais verificáveis.')))).concat([DS.info(['Capturas de tela, vídeos e relatórios só aparecem quando o executor os registra; nenhum arquivo é presumido.'].concat(ev.trust ? [' ', ev.trust] : []))]);
  }
  function painelLogs(x, ev) {
    const blocos = [];
    if (ev && !ev.erro) for (const e of ev.results) { if (e.stdout) blocos.push(DS.bloco(tr('stdout · {c}', { c: e.capability }), h('pre', { class: 'ds-codigo' }, e.stdout))); if (e.stderr) blocos.push(DS.bloco(tr('stderr · {c}', { c: e.capability }), h('pre', { class: 'ds-codigo' }, e.stderr))); }
    if (ev?.erro) blocos.unshift(DS.alerta('Não foi possível consultar os arquivos de log desta execução.', 'falha'));
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
      ['resumo', tr('Resumo'), null, () => [DS.meta([['ID', h('code', {}, x.id)], ['Projeto', x.projeto], ['Rotina', x.rotina], ['Fluxo', rotuloTipo(x.tipo)], ['Automação', x.capability || '—'], ['Ambiente', x.ambiente || '—'], ['Ticket', x.ticket || '—'], ['Origem', tr(ORIGENS[x.origem] || x.origem || '—')], ['Executor', x.executor], ['Iniciada em', hora(x.inicio || x.criadoEm)], ['Terminada em', x.termino ? hora(x.termino) : null], ['Duração', duracaoDaExecucao(x.duracaoMs)]], { linha: true }),
        x.estado === 'PERDIDO' ? DS.alerta(tr('Horário perdido ({q}): nada foi executado.', { q: hora(x.slot) }), 'aviso') : null,
        r?.motivo ? DS.alerta(r.motivo, r.status === 'PASS' ? 'ok' : r.status === 'FAIL' ? 'falha' : 'aviso') : null,
        c ? DS.resumo([[c.pass, 'PASS', 'ok'], [c.fail, 'FAIL', 'falha'], [c.blocked, 'BLOCKED', 'aviso'], [c.notRun, 'NOT_RUN']]) : null,
        r?.detalhes ? DS.bloco('Detalhes do resultado', DS.texto(r.detalhes)) : null,
        x.ticket ? DS.bloco('Jira', h('p', {}, selo(x.jira.estado), x.jira.comentarioId ? ' #' + x.jira.comentarioId : ''), r && ['PASS', 'FAIL'].includes(r.status) ? DS.acao('Comentário Jira', () => jiraPrevia(x, jiraCx), { icone: 'mensagem' }) : null, jiraCx) : null]],
      ['etapas', tr('Etapas'), x.tentativas.length || null, () => [DS.tempo([{ titulo: tr('Enfileirada'), sub: hora(x.criadoEm) + ' · ' + tr(ORIGENS[x.origem] || x.origem || ''), tom: 'info' },
        ...x.tentativas.map((t) => ({ titulo: h('span', {}, tr('Tentativa {n}', { n: t.n }), ' ', selo(t.estado), t.codigo ? ' ' + t.codigo : ''), sub: hora(t.inicio) + (t.fim ? ' → ' + hora(t.fim) : ''), tom: DS.tom(t.estado) })),
        { titulo: h('span', {}, tr('Resultado'), ' ', selo(r?.status || x.estado)), sub: x.termino ? hora(x.termino) : tr('sem término registrado'), tom: DS.tom(r?.status || x.estado) }]),
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
  // Evidências CLI/MCP do projeto, consultadas em modal dentro de Testes › Runs.
  abas.evidencias = async (el) => {
    const e = estado.espaco; const raiz = e?.pastaLocal || estado.root; const alvo = estado.jobId; estado.jobId = undefined;
    if (!raiz) { el.append(DS.estadoTela('vazio', 'Nenhuma pasta de projeto vinculada', 'Vincule a pasta do repositório em Projetos para consultar evidências locais.', [], { compacto: true })); return; }
    const r = await chamar(() => api.evidencias(raiz, alvo));
    if (!r) {
      el.append(DS.estadoTela('erro', 'Não foi possível consultar a evidência',
        'Os registros não foram carregados; nenhuma evidência foi alterada.',
        [DS.acao('Tentar novamente', () => { estado.jobId = alvo; el.replaceChildren(); return abas.evidencias(el); }, { icone: 'atualizar' })],
        { compacto: true, id: 'evidencias-falha-consulta' }));
      return;
    }
    el.append(alvo ? h('p', { class: 'suave' }, tr('Filtrada pela evidência {id}', { id: alvo })) : DS.info('Resultados reais preservados em .prumo/evidencias do projeto. Código de saída 0 valida a rodada, não cada cenário.'), ...painelEvidencias(r, { vazio: 'Nenhuma evidência para esta consulta.' }));
  };
  async function abrirEvidencia(e, jobId) {
    const raiz = e?.pastaLocal || estado.root; const vivo = DS.modal(tr('Evidência {id}', { id: String(jobId).slice(0, 8) }), DS.carregando(), { tamanho: 'lg' });
    const r = raiz ? await api.evidencias(raiz, jobId) : { ok: false, error: 'PASTA_AUSENTE' }; if (vivo && !vivo.isConnected) return;
    DS.modal(tr('Evidência {id}', { id: String(jobId).slice(0, 8) }), painelEvidencias(r.ok ? r.data : { erro: r.error }), { tamanho: 'lg' });
  }
  window.PrumoOperacao = Object.freeze({ abrirExecucao, abrirEvidencia });
})();
