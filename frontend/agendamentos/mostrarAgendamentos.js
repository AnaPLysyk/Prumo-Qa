'use strict';
/** Carrega agendamentos e suas opções de criação e execução. */
abas.agenda = async (el) => {
  el.append(h('h1', {}, tr('Agendamentos')));
  const espacos = await chamar(api.espacos); if (!espacos) return; if (!espacos.length) return el.append(h('div', { class: 'vazio' }, tr('Crie um projeto Prumo em Projetos para agendar rotinas.')));
  const w = await atualizarWorker(); const recarregar = () => mostrar('agenda');
  el.append(h('div', { class: 'nota', id: 'agenda-worker' }, h('strong', {}, textoWorker(w)), ' · ', tr('Próxima execução: {quando}', { quando: w?.proximaExecucao ? hora(w.proximaExecucao) : tr('nenhuma agendada') }), ' · ', tr('pendentes: {n}', { n: w?.pendentes ?? 0 }),
    h('div', { class: 'barra' }, botao(w?.pausado ? 'Retomar todos os agendamentos' : 'Pausar todos os agendamentos', async () => { if (await chamar(() => api.workerPausa(!w?.pausado))) recarregar(); }, 'agenda-pausa')),
    h('p', { class: 'suave' }, tr('Computador desligado ou suspenso: o horário vira “perdido”, nunca “executado”.'))));
  const slot = h('div', { id: 'rotina-slot' }); el.append(botao('Nova rotina', () => { slot.replaceChildren(formularioRotina(espacos, null, () => { slot.replaceChildren(); recarregar(); })); }, 'rotina-nova'), slot);
  const lista = await chamar(() => api.agendaListar(estado.espaco?.id)); if (!lista) return;
  el.append(h('h2', {}, tr('Rotinas')));
  if (!lista.length) el.append(h('div', { class: 'vazio', id: 'agenda-vazia' }, tr('Nenhuma rotina criada ainda.')));
  for (const r of lista) el.append(cartaoRotina(r, espacos, recarregar));
  const perm = await chamar(() => api.agendaPermissoes(estado.espaco?.id)); if (perm) el.append(blocoPoliticas(espacos, perm, recarregar));
  el.append(h('h2', {}, tr('Prumo residente')), h('div', { class: 'nota', id: 'residente' }, h('p', {}, tr('Ao fechar a janela, o Prumo continua na bandeja do sistema para executar as rotinas. Para parar tudo, use "Sair do Prumo" no menu do ícone da bandeja: isso encerra o worker e os processos filhos.')),
    ...[['iniciarComWindows', 'Iniciar o Prumo com o sistema (desligado por padrão; só você pode ligar)'], ['notificarAgenda', 'Avisar quando uma rotina falhar, for bloqueada ou concluir']].map(([k, t]) => h('label', { class: 'opcao' }, h('input', { type: 'checkbox', id: 'pref-' + k, checked: !!estado.prefs?.[k], onchange: async (e) => { const r = await chamar(() => api.salvarPreferencias({ [k]: e.target.checked })); if (r) estado.prefs = r.preferencias; } }), tr(t)))));
};

