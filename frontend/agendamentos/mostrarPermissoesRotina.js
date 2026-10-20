'use strict';
/** Apresenta as políticas de execução e autorização das rotinas. */
function blocoPoliticas(espacos, permissoes, recarregar) {
  const p0 = estado.espaco?.id || espacos[0]?.id; const proj = h('select', { id: 'pol-projeto' }, espacos.map((e) => h('option', { value: e.id, selected: e.id === p0 }, e.nome)));
  const tickets = h('input', { id: 'pol-tickets', placeholder: 'SMART-1, SMART-2' }); const dias = h('input', { id: 'pol-dias', type: 'number', min: 1, max: 30, value: 7 }); const max = h('input', { id: 'pol-max', type: 'number', min: 1, max: 1000, value: 20 });
  const tipos = h('div', { class: 'dias-semana', id: 'pol-tipos' }, ['smoke', 'regressao', 'validacao-ticket', 'k6'].map((t) => h('label', { class: 'linha' }, h('input', { type: 'checkbox', value: t, checked: t !== 'k6' }), rotuloTipo(t))));
  return h('div', { id: 'politicas' }, h('h2', {}, tr('Política de publicação de comentários no Jira')),
    h('p', { class: 'suave' }, tr('Só comenta no Jira com uma política aprovada por você.')),
    h('div', { class: 'formulario' }, campoA('Projeto Prumo', proj, 'pol-projeto'), campoA('Tickets autorizados (separados por vírgula)', tickets, 'pol-tickets'), h('div', { class: 'campo' }, h('span', {}, tr('Tipos de rotina')), tipos), campoA('Validade (dias)', dias, 'pol-dias'), campoA('Máximo de comentários', max, 'pol-max'),
      botao('Aprovar política…', async () => {
        const dados = { espacoId: proj.value, tickets: tickets.value.split(/[,\s]+/).map((x) => x.trim().toUpperCase()).filter(Boolean), tipos: [...tipos.querySelectorAll('input:checked')].map((i) => i.value), dias: Number(dias.value), maxPublicacoes: Number(max.value) };
        const x = await chamar(() => api.agendaPolitica(dados)); if (x && !x.canceled) { avisar(tr('Política registrada.')); recarregar(); }
      }, 'pol-salvar')),
    permissoes.publicacoes.length ? h('ul', {}, permissoes.publicacoes.map((p) => h('li', {}, selo(p.estado), ' ', p.tickets.join(', '), ' · ', p.tipos.join(', '), ' · ', tr('até {quando}', { quando: hora(p.validaAte) }), ' · ', tr('usadas {a}/{b}', { a: p.usadas, b: p.maxPublicacoes }), ' ',
      p.estado === 'VIGENTE' ? botao('Revogar política', async () => { if (await chamar(() => api.agendaRevogarPolitica(p.id))) recarregar(); }) : null))) : h('p', { class: 'suave' }, tr('Nenhuma política criada: nenhuma rotina agendada comenta no Jira.')));
}
