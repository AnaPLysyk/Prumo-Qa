'use strict';
/** Monta formulário de criar ou editar uma rotina programada. */
// ---- Agendamentos ----
function formularioRotina(espacos, existente, aoSalvar) {
  const r = existente; const e0 = r ? r.espacoId : (estado.espaco?.id || espacos[0]?.id);
  const f = r?.frequencia || { tipo: 'intervalo', minutos: 60 }; const fuso0 = r?.fuso || fusoLocal();
  const nome = h('input', { id: 'rotina-nome', maxlength: 120, value: r?.nome || '' });
  const proj = h('select', { id: 'rotina-projeto', disabled: !!r }, espacos.map((e) => h('option', { value: e.id, selected: e.id === e0 }, e.nome)));
  const tipo = selecao('rotina-tipo', TIPOS, r?.tipo || 'smoke'); const cap = h('select', { id: 'rotina-capability' });
  const ticket = h('input', { id: 'rotina-ticket', placeholder: 'SMART-123', value: r?.ticket || '' }); const amb = selecao('rotina-ambiente', AMBIENTES, r?.ambiente || 'local');
  const freq = selecao('rotina-freq', { unico: 'Uma vez', intervalo: 'A cada N minutos', diario: 'Todos os dias', semanal: 'Semanal' }, f.tipo);
  const em = h('input', { id: 'rotina-em', type: 'datetime-local', value: f.tipo === 'unico' ? instanteParaParede(f.em, fuso0) : '' });
  const min = h('input', { id: 'rotina-minutos', type: 'number', min: 1, max: 44640, value: f.minutos ?? 60 }); const hr = h('input', { id: 'rotina-hora', type: 'time', value: f.hora || '09:00' });
  const dias = h('div', { class: 'ds-opcoes', id: 'rotina-dias' }, DIAS.map((d, i) => h('label', { class: 'linha' }, h('input', { type: 'checkbox', value: i, checked: (f.dias || [1, 2, 3, 4, 5]).includes(i) }), tr(d))));
  const fuso = h('input', { id: 'rotina-fuso', value: fuso0, maxlength: 64 });
  const perd = selecao('rotina-perdido', { PULAR: 'Pular o que perdi (registra como perdido)', EXECUTAR_UMA_VEZ: 'Executar uma vez ao voltar' }, r?.politicaPerdido || 'PULAR');
  const tol = h('input', { id: 'rotina-tolerancia', type: 'number', min: 0, max: 1440, value: r?.toleranciaMinutos ?? 10 });
  const k6s = h('input', { id: 'k6-script', value: r?.k6?.script || '', placeholder: 'carga/script.js' }); const k6a = h('input', { id: 'k6-alvo', value: r?.k6?.alvo || 'http://127.0.0.1:8080' });
  const k6u = h('input', { id: 'k6-usuarios', type: 'number', min: 1, max: 50, value: r?.k6?.usuarios ?? 5 }); const k6d = h('input', { id: 'k6-duracao', type: 'number', min: 1, max: 600, value: r?.k6?.duracaoSegundos ?? 30 });
  const gCap = campoA('Automação declarada (capability)', cap, 'rotina-capability'); const gTicket = campoA('Ticket Jira (opcional)', ticket, 'rotina-ticket');
  const gEm = campoA('Data e hora (no fuso informado)', em, 'rotina-em'); const gMin = campoA('Intervalo (minutos)', min, 'rotina-minutos'); const gHr = campoA('Horário', hr, 'rotina-hora'); const gDias = h('div', { class: 'ds-campo inteiro' }, h('span', {}, tr('Dias da semana')), dias);
  const gK6 = h('div', { id: 'bloco-k6', class: 'ds-form inteiro' }, h('p', { class: 'suave inteiro' }, tr('k6 usa o executável oficial instalado. Limites obrigatórios: até 50 usuários virtuais e 600 s. Produção é bloqueada.')), campoA('Script k6 (dentro do projeto)', k6s, 'k6-script'), campoA('Destino (em ambiente local: localhost)', k6a, 'k6-alvo'), campoA('Usuários virtuais (1–50)', k6u, 'k6-usuarios'), campoA('Duração em segundos (1–600)', k6d, 'k6-duracao'));
  const runSel = h('select', { id: 'rotina-run' }); const gRun = campoA('Run do Qase (já criada)', runSel, 'rotina-run');
  const msg = h('div', { id: 'rotina-erro', role: 'alert' });
  const k6aviso = h('p', { class: 'suave inteiro', id: 'k6-disponibilidade' });
  gK6.prepend(k6aviso);
  const atualizar = async () => {
    const t = tipo.value; const exec = ['smoke', 'regressao'].includes(t);
    gCap.hidden = !exec; gK6.hidden = t !== 'k6'; gRun.hidden = t !== 'run-qase'; gTicket.hidden = !['validacao-ticket', 'consulta-jira', 'smoke', 'regressao', 'k6'].includes(t);
    gEm.hidden = freq.value !== 'unico'; gMin.hidden = freq.value !== 'intervalo'; gHr.hidden = !['diario', 'semanal'].includes(freq.value); gDias.hidden = freq.value !== 'semanal';
    const a = await chamar(() => api.espacoAutomacoes(proj.value)); const caps = a?.capacidades || [];
    const runs = ((await chamar(() => api.runs(proj.value))) || []).filter((x) => x.runIdRemoto);
    runSel.replaceChildren(...(runs.length ? runs : [null]).map((x) => (x ? h('option', { value: x.id, selected: x.id === r?.runLocalId }, `${x.titulo} (Qase #${x.runIdRemoto})`) : h('option', { value: '' }, tr('(nenhuma run criada no Qase)')))));
    k6aviso.textContent = a?.k6Disponivel ? tr('k6 encontrado neste computador.') : tr('k6 não encontrado no PATH: a rotina ficará NOT_RUN até instalar o k6 oficial.');
    cap.replaceChildren(...(caps.length ? caps : ['']).map((c) => h('option', { value: c, selected: c === r?.capability }, c || tr('(nenhuma capability declarada)'))));
  };
  for (const c of [tipo, freq, proj]) c.addEventListener('change', atualizar); atualizar();
  const salvar = botao(r ? 'Salvar alterações' : 'Criar rotina', async () => {
    const t = tipo.value; const dados = { nome: nome.value, espacoId: proj.value, tipo: t, ambiente: amb.value, fuso: fuso.value, politicaPerdido: perd.value, toleranciaMinutos: Number(tol.value) };
    if (['smoke', 'regressao'].includes(t)) dados.capability = cap.value; if (ticket.value.trim() && !gTicket.hidden) dados.ticket = ticket.value.trim().toUpperCase();
    if (t === 'k6') dados.k6 = { script: k6s.value, alvo: k6a.value, usuarios: Number(k6u.value), duracaoSegundos: Number(k6d.value) };
    if (t === 'run-qase') dados.runLocalId = runSel.value;
    if (t === 'consulta-jira') dados.operacaoJira = dados.ticket ? 'ticket' : 'tickets';
    dados.frequencia = freq.value === 'unico' ? { tipo: 'unico', em: em.value ? paredeParaISO(em.value, fuso.value) : '' } : freq.value === 'intervalo' ? { tipo: 'intervalo', minutos: Number(min.value) } : freq.value === 'diario' ? { tipo: 'diario', hora: hr.value } : { tipo: 'semanal', dias: [...dias.querySelectorAll('input:checked')].map((i) => Number(i.value)), hora: hr.value };
    const rr = await api.agendaSalvar(r?.id, dados);
    if (!rr.ok) { msg.replaceChildren(h('div', { class: 'nota erro' }, rr.error)); return; } avisar(tr('Rotina salva.')); aoSalvar();
  }, 'rotina-salvar'); salvar.classList.add('primaria');
  // v40: mesmo formulário e mesmos campos, agrupados por fluxo, horário e execução perdida (Design System).
  const nomeC = campoA('Nome', nome, 'rotina-nome'); nomeC.classList.add('inteiro');
  return h('form', { class: 'ds-form', id: 'rotina-form', onsubmit: (ev) => ev.preventDefault() },
    DS.grupo('Fluxo', nomeC, campoA('Projeto Prumo', proj, 'rotina-projeto'), campoA('Tipo de rotina', tipo, 'rotina-tipo'), gCap, gRun, gTicket, campoA('Ambiente', amb, 'rotina-ambiente'), gK6),
    DS.grupo('Quando', campoA('Frequência', freq, 'rotina-freq'), gEm, gMin, gHr, campoA('Fuso horário (nome IANA, ex.: America/Sao_Paulo)', fuso, 'rotina-fuso'), gDias),
    DS.grupo('Se o horário for perdido', campoA('Se o Prumo estiver fechado no horário', perd, 'rotina-perdido'), campoA('Tolerância de atraso (min)', tol, 'rotina-tolerancia'), h('p', { class: 'suave inteiro' }, tr('Computador desligado ou suspenso: o horário vira “perdido”, nunca “executado”.'))),
    msg, h('div', { class: 'ds-form-acoes' }, h('span', { class: 'ds-form-msg suave' }, tr('Testes agendados só executam com autorização vigente.')), botao('Cancelar', aoSalvar, 'rotina-cancelar'), salvar));
}
