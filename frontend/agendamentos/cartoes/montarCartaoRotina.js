'use strict';
/** Exibe as rotinas e suas autorizações no cartão de agendamento. */
const seloAut = (a) => h('li', {}, h('code', {}, a.capability), ' ', selo(a.estado), a.validaAte ? ' · ' + tr('até {quando}', { quando: hora(a.validaAte) }) : '', a.usos ? ' · ' + tr('usos {n}', { n: a.usos }) : '');
function cartaoRotina(r, espacos, recarregar) {
  const proj = espacos.find((e) => e.id === r.espacoId); const dias = h('input', { type: 'number', min: 1, max: 30, value: 7, id: 'aut-dias-' + r.id }); const usos = h('input', { type: 'number', min: 1, max: 1000, value: 20, id: 'aut-usos-' + r.id });
  const precisaAut = ['smoke', 'regressao', 'validacao-ticket', 'k6', 'run-qase'].includes(r.tipo);
  const ult = r.ultimaExecucao;
  return h('section', { class: 'agenda-rotina', 'data-rotina': r.id },
    h('h2', {}, r.nome, ' ', selo(r.estado)),
    h('p', { class: 'suave' }, tr('Projeto: {nome}', { nome: proj?.nome || '—' }) + ' · ' + rotuloTipo(r.tipo) + (r.capability ? ' · ' + r.capability : '') + ' · ' + tr('ambiente {a}', { a: tr(AMBIENTES[r.ambiente] || r.ambiente) }) + (r.ticket ? ' · ' + r.ticket : '')),
    h('p', {}, textoFrequencia(r), ' · ', tr('Próxima execução: {quando}', { quando: r.proximaExecucao ? hora(r.proximaExecucao) : tr('nenhuma') })),
    h('p', {}, tr('Última execução: '), ult ? [hora(ult.em), ' ', selo(ult.resultado || ult.estado), ult.motivo ? h('div', { class: 'suave' }, ult.motivo) : null] : tr('ainda não executada')),
    h('details', {}, h('summary', {}, tr('O que esta rotina pode fazer')), h('ul', {}, r.permissoes.map((p) => h('li', {}, p)))),
    precisaAut ? h('div', {}, h('strong', {}, tr('Autorização para execução agendada')), r.autorizacoes.length ? h('ul', {}, r.autorizacoes.map(seloAut)) : h('p', { class: 'suave' }, tr('Sem automação associada.'))) : null,
    r.erros.length ? h('details', {}, h('summary', {}, tr('Problemas recentes ({n})', { n: r.erros.length })), h('ul', {}, r.erros.map((x) => h('li', {}, h('code', {}, x.codigo || ''), ' ', x.motivo)))) : null,
    h('div', { class: 'agenda-acoes' },
      botao('Editar', async () => { const el = $('#rotina-slot'); el.replaceChildren(formularioRotina(espacos, r, () => { el.replaceChildren(); recarregar(); })); el.scrollIntoView({ block: 'nearest' }); }),
      r.estado === 'ATIVA' ? botao('Pausar', async () => { if (await chamar(() => api.agendaEstado(r.id, 'pausar'))) recarregar(); }) : r.estado !== 'CONCLUIDA' ? botao('Retomar', async () => { if (await chamar(() => api.agendaEstado(r.id, 'retomar'))) recarregar(); }) : null,
      r.estado !== 'DESATIVADA' && r.estado !== 'CONCLUIDA' ? botao('Desativar', async () => { if (await chamar(() => api.agendaEstado(r.id, 'desativar'))) recarregar(); }) : null,
      botao('Executar agora', async () => { const x = await chamar(() => api.agendaExecutar(r.id)); if (x) { avisar(tr('Rotina enfileirada. Testes pedem a sua autenticação do sistema.')); setTimeout(recarregar, 1500); } }),
      botao('Histórico desta rotina', () => { estado.filtroExec = { rotinaId: r.id, selecionadoQuando: estado.espaco?.id ?? null }; mostrar('runs'); }),
      botao('Excluir', async () => { const x = await chamar(() => api.agendaExcluir(r.id)); if (x && !x.canceled) recarregar(); })),
    precisaAut ? h('div', { class: 'agenda-acoes' }, campoA('Validade (dias, 1–30)', dias, 'aut-dias-' + r.id), campoA('Máximo de execuções', usos, 'aut-usos-' + r.id),
      botao('Autorizar execuções agendadas…', async () => { const x = await chamar(() => api.agendaAutorizar(r.id, Number(dias.value), Number(usos.value))); if (x && !x.canceled) { avisar(tr('Autorização registrada.')); recarregar(); } }),
      ...r.autorizacoes.filter((a) => a.id && a.estado === 'VIGENTE').map((a) => botao('Revogar ' + a.capability, async () => { if (await chamar(() => api.agendaRevogar(a.id))) recarregar(); }))) : null);
}
