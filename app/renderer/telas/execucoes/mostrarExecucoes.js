'use strict';
/** Mostra o histórico de execuções e os detalhes autorizados do Jira. */
// ---- Execuções (histórico centralizado) ----
const duracao = (n) => (n === null || n === undefined ? '—' : n < 1000 ? n + ' ms' : Math.round(n / 100) / 10 + ' s');
async function detalheJira(x, caixa) {
  const p = await chamar(() => api.jiraPrevia(x.id)); if (!p) return;
  caixa.replaceChildren(h('p', { class: 'suave' }, tr('Prévia do comentário para {t} (nada foi enviado):', { t: p.ticket })), h('pre', {}, p.texto), botao('Publicar no Jira…', async () => { const r = await chamar(() => api.jiraPublicar(x.id)); if (r && !r.canceled) { avisar(r.estado === 'PUBLICADO' ? tr('Comentário publicado.') : tr('Publicação não concluída: {e}', { e: r.erro || r.estado }), r.estado !== 'PUBLICADO'); mostrar('execucoes'); } }, 'jira-publicar'));
  if (window.PrumoQualidadeV39) {
    const marcador = document.createComment('posição da prévia Jira');
    caixa.before(marcador);
    window.PrumoQualidadeV39.abrirModal('Prévia do comentário Jira', caixa, () => { if (marcador.isConnected) marcador.replaceWith(caixa); });
  }
}
abas.execucoes = async (el) => {
  el.append(h('h1', {}, tr('Execuções')));
  const espacos = await chamar(api.espacos) || []; const f = estado.filtroExec || (estado.filtroExec = {});
  // Trocar de projeto descarta o filtro anterior: a tela sempre corresponde ao projeto selecionado.
  if (f.selecionadoQuando !== (estado.espaco?.id ?? null)) { for (const k of Object.keys(f)) delete f[k]; f.selecionadoQuando = estado.espaco?.id ?? null; }
  if (!f.espacoId && estado.espaco && f.todos !== true) f.espacoId = estado.espaco.id;
  const proj = h('select', { id: 'f-projeto' }, h('option', { value: '' }, tr('Todos os projetos')), espacos.map((e) => h('option', { value: e.id, selected: e.id === f.espacoId }, e.nome)));
  const tk = h('input', { id: 'f-ticket', placeholder: 'SMART-1', value: f.ticket || '' }); const res = h('select', { id: 'f-resultado' }, h('option', { value: '' }, tr('Qualquer resultado')), ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'ERRO_INFRA', 'INFO'].map((v) => h('option', { value: v, selected: v === f.resultado }, v)));
  const desde = h('input', { id: 'f-desde', type: 'date', value: f.desde || '' }); const ate = h('input', { id: 'f-ate', type: 'date', value: f.ate || '' });
  const filtroTipo = selecao('f-tipo', { '': 'Qualquer tipo', ...TIPOS }, f.tipo || ''); const filtroOrigem = selecao('f-origem', { '': 'Qualquer origem', MANUAL: 'Manual', AGENDA: 'Agenda' }, f.origem || '');
  el.append(h('div', { class: 'barra' }, campoA('Projeto', proj, 'f-projeto'), campoA('Ticket', tk, 'f-ticket'), campoA('Resultado', res, 'f-resultado'),
    campoA('Desde', desde, 'f-desde'), campoA('Até', ate, 'f-ate'),
    campoA('Tipo', filtroTipo, 'f-tipo'), campoA('Origem', filtroOrigem, 'f-origem'),
    botao('Filtrar', () => { if (!desde.reportValidity() || !ate.reportValidity()) return; if (desde.value && ate.value && desde.value > ate.value) { avisar(tr('A data inicial deve ser anterior à data final.'), true); return; } estado.filtroExec = { espacoId: proj.value || undefined, todos: !proj.value, ticket: tk.value.trim().toUpperCase() || undefined, resultado: res.value || undefined, desde: desde.value, ate: ate.value, tipo: filtroTipo.value, origem: filtroOrigem.value, rotinaId: f.rotinaId, selecionadoQuando: f.selecionadoQuando }; mostrar('execucoes'); }, 'f-aplicar'),
    f.rotinaId ? botao('Limpar filtro de rotina', () => { delete estado.filtroExec.rotinaId; mostrar('execucoes'); }) : null));
  const m = await chamar(() => api.metricasExecucoes(f.espacoId)); const cel = (n, t) => h('div', {}, h('b', {}, String(n)), h('span', {}, tr(t)));
  if (m) el.append(h('div', { class: 'grade', id: 'metricas-exec' }, cel(m.execucoes, 'execuções'), cel(m.pass, 'PASS'), cel(m.fail, 'FAIL'), cel(m.blocked, 'BLOCKED'), cel(m.notRun, 'NOT_RUN'), cel(m.consultas, 'consultas (INFO)'), cel(m.rotinasAtivas, 'rotinas ativas'), cel(m.rotinasPausadas, 'rotinas pausadas'),
    cel(m.falhasDeAgendamento, 'falhas de agendamento'), cel(m.comentariosPendentes, 'comentários pendentes'), cel(m.publicacoesConcluidas, 'publicações concluídas')),
    h('p', { class: 'suave' }, tr('Última execução: {a} · Próxima: {b}. Sem porcentagem de qualidade: quantidade de testes não mede qualidade.', { a: m.ultimaExecucao ? hora(m.ultimaExecucao.em) + ' (' + m.ultimaExecucao.resultado + ')' : '—', b: m.proximaExecucao ? hora(m.proximaExecucao) : '—' })));
  const periodo = {}; if (f.desde) periodo.since = new Date(f.desde + 'T00:00:00').toISOString(); if (f.ate) periodo.until = new Date(f.ate + 'T23:59:59.999').toISOString();
  const lista = await chamar(() => api.execucoes({ espacoId: f.espacoId, rotinaId: f.rotinaId, ticket: f.ticket, resultado: f.resultado, ...periodo, limite: 100 })); if (!lista) return;
  lista.execucoes = lista.execucoes.filter(x => (!f.tipo || x.tipo === f.tipo) && (!f.origem || x.origem === f.origem));
  el.append(h('p', { class: 'suave' }, tr('Até 100 registros por consulta. Tipo e origem filtram os registros carregados. O período usa o horário deste computador; os totais acima abrangem todo o projeto.')), botao('Consultar evidências locais', () => { estado.jobId = undefined; mostrar('evidencias'); }, 'exec-evidencias'));
  if (!lista.execucoes.length) el.append(h('div', { class: 'vazio', id: 'exec-vazia' }, tr('Nenhuma execução registrada para este filtro.')));
  else {
    const jiraCx = h('div', { id: 'jira-caixa' });
    el.append(h('div', { class: 'rolagem' }, h('table', { id: 'tabela-exec' }, h('thead', {}, h('tr', {}, ['Quando', 'Projeto', 'Rotina', 'Tipo', 'Ticket', 'Executor', 'Resultado', 'Cenários', 'Duração', 'Jira', ''].map((t) => h('th', {}, tr(t))))),
      h('tbody', {}, lista.execucoes.map((x) => { const r = x.resultado; const c = r?.contagem;
        return h('tr', { 'data-exec': x.id },
          h('td', {}, hora(x.inicio || x.criadoEm), x.estado === 'PERDIDO' ? h('div', { class: 'suave' }, tr('horário planejado: {q}', { q: hora(x.slot) })) : null), h('td', {}, x.projeto), h('td', {}, x.rotina), h('td', {}, rotuloTipo(x.tipo), x.capability ? h('div', { class: 'suave' }, x.capability) : null),
          h('td', {}, x.ticket || '—'), h('td', {}, x.executor), h('td', {}, selo(r?.status || x.estado), r?.motivo ? h('div', { class: 'suave' }, r.motivo) : x.erro ? h('div', { class: 'suave' }, x.erro) : null),
          h('td', {}, c && c.pass + c.fail + c.blocked + c.notRun ? `${c.pass} PASS · ${c.fail} FAIL · ${c.blocked} BLOCKED · ${c.notRun} NOT_RUN` : r && ['PASS', 'FAIL'].includes(r.status) ? tr('sem cenários individuais') : '—'), h('td', {}, duracao(x.duracaoMs)),
          h('td', {}, x.jira.estado === 'NAO_APLICAVEL' ? '—' : selo(x.jira.estado), x.jira.comentarioId ? h('div', { class: 'suave' }, '#' + x.jira.comentarioId) : null),
          h('td', {}, h('details', {}, h('summary', {}, tr('Detalhes')), h('h3', {}, tr('Resumo da execução')), h('p', {}, 'ID: ' + x.id), h('p', {}, tr('Início: ') + hora(x.inicio || x.criadoEm) + ' · ' + tr('Término: ') + hora(x.termino)), h('p', {}, tr('Ambiente: ') + (x.ambiente || '—') + ' · ' + tr('Origem: ') + (x.origem || '—') + ' · ' + tr('Executor: ') + x.executor), h('p', {}, tr('Ticket: ') + (x.ticket || '—') + ' · ' + tr('Rotina: ') + x.rotina), r?.detalhes ? h('pre', {}, r.detalhes) : null, h('h3', {}, tr('Tentativas')), h('ul', {}, x.tentativas.map((t) => h('li', {}, tr('tentativa {n}: ', { n: t.n }), selo(t.estado), t.codigo ? ' ' + t.codigo : ''))),
            x.evidenciaId && x.pastaLocal ? botao('Ver evidência', () => { estado.root = x.pastaLocal; salvarRaiz(); estado.jobId = x.evidenciaId; mostrar('evidencias'); }) : null,
            x.ticket && r && ['PASS', 'FAIL'].includes(r.status) ? botao('Comentário Jira', () => detalheJira(x, jiraCx)) : null)));
      })))), jiraCx);
  }
  await execucoesExternas(el);
};

