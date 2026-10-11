'use strict';
// Agendamentos, Execuções (histórico centralizado), Início e preferências do Prumo residente (2.8).
// Apresentação apenas: nenhuma regra de agenda, autorização ou resultado é calculada aqui; tudo vem do processo principal.
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const TIPOS = { 'consulta-jira': 'Consulta Jira', smoke: 'Smoke', regressao: 'Regressão', 'validacao-ticket': 'Validação por ticket', 'analise-mudancas': 'Análise de mudanças', k6: 'Desempenho (k6)' };
const AMBIENTES = { local: 'Local', teste: 'Teste', homologacao: 'Homologação', producao: 'Produção' };
const rotuloTipo = (t) => tr(TIPOS[t] || t);

// ---- Horário de parede <-> instante (somente para o formulário; o cálculo real de horários é do núcleo) ----
function desvioMin(ms, fuso) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: fuso, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ms)).filter((x) => x.type !== 'literal').map((x) => [x.type, +x.value]));
  return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000) / 60000;
}
function paredeParaISO(valor, fuso) {
  const [d, t] = valor.split('T'); const [Y, M, D] = d.split('-').map(Number); const [hh, mm] = t.split(':').map(Number);
  const parede = Date.UTC(Y, M - 1, D, hh, mm); let ms = parede - desvioMin(parede, fuso) * 60000; ms = parede - desvioMin(ms, fuso) * 60000;
  const off = desvioMin(ms, fuso); const a = Math.abs(off);
  return `${valor}:00${off >= 0 ? '+' : '-'}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}
function instanteParaParede(iso, fuso) {
  const ms = Date.parse(iso); const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: fuso, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(ms)).filter((x) => x.type !== 'literal').map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
const fusoLocal = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };
function textoFrequencia(r) {
  const f = r.frequencia;
  if (f.tipo === 'unico') return tr('Uma vez em {quando}', { quando: hora(f.em) });
  if (f.tipo === 'intervalo') return tr('A cada {n} min', { n: f.minutos });
  if (f.tipo === 'diario') return tr('Todo dia às {hora} ({fuso})', { hora: f.hora, fuso: r.fuso });
  return tr('Semanal: {dias} às {hora} ({fuso})', { dias: f.dias.map((d) => tr(DIAS[d])).join(', '), hora: f.hora, fuso: r.fuso });
}
const campoA = (rotulo, el, id) => h('label', { class: 'campo', for: id }, tr(rotulo), el);
const selecao = (id, opcoes, atual) => h('select', { id }, Object.entries(opcoes).map(([v, t]) => h('option', { value: v, selected: v === atual }, tr(t))));
const estadoOrb = (w) => (!w || !w.executando ? 'parado' : w.emExecucao ? 'executando' : 'ocioso');
const nivelWorker = (w) => (!w || !w.executando || !w.trava?.vivo ? 'falha' : w.pausado ? 'aviso' : 'ok');
const textoWorker = (w) => (!w || !w.executando || !w.trava?.vivo ? tr('Worker parado') : w.pausado ? tr('Agendamentos pausados') : w.emExecucao ? tr('Executando uma rotina') : tr('Worker ativo'));

// ---- Barra superior: esfera, estado do worker, tema e idioma ----
async function atualizarWorker() {
  const r = await api.workerEstado(); if (!r.ok) return null; const w = r.data; estado.worker = w;
  const chip = $('#worker-estado'); if (chip) { chip.dataset.nivel = nivelWorker(w); chip.replaceChildren(h('i'), textoWorker(w)); chip.title = tr('Próxima execução: {quando}', { quando: w.proximaExecucao ? hora(w.proximaExecucao) : tr('nenhuma agendada') }); }
  qc.definirEstado(estadoOrb(w)); return w;
}
function montarControles() {
  const caixa = $('#controles'); if (!caixa) return;
  const tema = h('select', { id: 'tema', 'aria-label': tr('Tema') }, [['sistema', 'Seguir sistema'], ['claro', 'Claro'], ['escuro', 'Escuro']].map(([v, t]) => h('option', { value: v, selected: v === (estado.prefs?.tema || 'sistema') }, tr(t))));
  const idioma = h('select', { id: 'idioma', 'aria-label': tr('Idioma') }, [['pt-BR', 'Português (Brasil)'], ['en', 'English']].map(([v, t]) => h('option', { value: v, selected: v === (estado.prefs?.idioma || 'pt-BR') }, t)));
  tema.addEventListener('change', async () => { aplicarTema(tema.value); estado.prefs = { ...(estado.prefs || {}), tema: tema.value }; await chamar(() => api.salvarPreferencias({ tema: tema.value })); });
  idioma.addEventListener('change', async () => { await chamar(() => api.salvarPreferencias({ idioma: idioma.value })); await definirIdioma(idioma.value); });
  caixa.replaceChildren(tema, idioma);
}
function aplicarTema(t) { document.documentElement.dataset.tema = t || 'sistema'; qc.definirEstado(estadoOrb(estado.worker)); }
async function definirIdioma(i) {
  PrumoI18n.definir(i); estado.prefs = { ...(estado.prefs || {}), idioma: i }; document.documentElement.lang = i;
  PrumoI18n.traduzirDocumento(); montarControles(); await atualizarWorker(); await mostrar(estado.aba);
}

// ---- Início ----
abas.inicio = async (el) => {
  const w = estado.worker || (await atualizarWorker()); const m = await chamar(() => api.metricasExecucoes(estado.espaco?.id));
  el.append(h('div', { class: 'qc-hero' }, qc.campo(112, estadoOrb(w), tr('Esfera do Prumo QA')),
    h('div', {}, h('h1', {}, 'Prumo QA'), h('p', {}, tr('Plataforma de engenharia de qualidade: projetos, contextos, tickets, testes, agendamentos, execuções e evidências em um só lugar. Funciona manualmente, sem IA; agentes são assistentes opcionais.')),
      h('p', { class: 'qc-legenda' }, estadoOrb(w) === 'executando' ? tr('A esfera gira porque há uma rotina em execução agora.') : tr('A esfera fica parada quando nada está em execução.')))));
  el.append(h('h2', {}, tr('Agora')), h('div', { class: 'grade', id: 'inicio-estado' },
    h('div', {}, h('b', {}, textoWorker(w)), h('span', {}, tr('estado do worker'))),
    h('div', {}, h('b', {}, m?.proximaExecucao ? hora(m.proximaExecucao) : '—'), h('span', {}, tr('próxima execução'))),
    h('div', {}, h('b', {}, String(m?.rotinasAtivas ?? 0)), h('span', {}, tr('rotinas ativas'))),
    h('div', {}, h('b', {}, String(m?.execucoes ?? 0)), h('span', {}, tr('execuções registradas')))));
  el.append(h('h2', {}, tr('Atalhos')), h('div', { class: 'barra' }, [['projetos', 'Projetos'], ['agenda', 'Agendamentos'], ['execucoes', 'Execuções'], ['conexoes', 'Conexões'], ['ajuda', 'Ajuda']].map(([a, t]) => h('button', { class: 'acao', onclick: () => mostrar(a) }, tr(t)))));
  el.append(h('p', { class: 'suave' }, tr('Fechar a janela mantém o Prumo na bandeja do Windows para que as rotinas continuem. Use o ícone da bandeja para abrir ou sair. Se o computador estiver desligado ou suspenso, nada é executado nesse período.')));
};

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
  const dias = h('div', { class: 'dias-semana', id: 'rotina-dias' }, DIAS.map((d, i) => h('label', { class: 'linha' }, h('input', { type: 'checkbox', value: i, checked: (f.dias || [1, 2, 3, 4, 5]).includes(i) }), tr(d))));
  const fuso = h('input', { id: 'rotina-fuso', value: fuso0, maxlength: 64 });
  const perd = selecao('rotina-perdido', { PULAR: 'Pular o que perdi (registra como perdido)', EXECUTAR_UMA_VEZ: 'Executar uma vez ao voltar' }, r?.politicaPerdido || 'PULAR');
  const tol = h('input', { id: 'rotina-tolerancia', type: 'number', min: 0, max: 1440, value: r?.toleranciaMinutos ?? 10 });
  const k6s = h('input', { id: 'k6-script', value: r?.k6?.script || '', placeholder: 'carga/script.js' }); const k6a = h('input', { id: 'k6-alvo', value: r?.k6?.alvo || 'http://127.0.0.1:8080' });
  const k6u = h('input', { id: 'k6-usuarios', type: 'number', min: 1, max: 50, value: r?.k6?.usuarios ?? 5 }); const k6d = h('input', { id: 'k6-duracao', type: 'number', min: 1, max: 600, value: r?.k6?.duracaoSegundos ?? 30 });
  const gCap = campoA('Automação declarada (capability)', cap, 'rotina-capability'); const gTicket = campoA('Ticket Jira (opcional)', ticket, 'rotina-ticket');
  const gEm = campoA('Data e hora (no fuso informado)', em, 'rotina-em'); const gMin = campoA('Intervalo (minutos)', min, 'rotina-minutos'); const gHr = campoA('Horário', hr, 'rotina-hora'); const gDias = h('div', { class: 'campo' }, h('span', {}, tr('Dias da semana')), dias);
  const gK6 = h('div', { id: 'bloco-k6' }, h('p', { class: 'suave' }, tr('k6 usa o executável oficial instalado. Limites obrigatórios: até 50 usuários virtuais e 600 s. Produção é bloqueada.')), campoA('Script k6 (dentro do projeto)', k6s, 'k6-script'), campoA('Destino (em ambiente local: localhost)', k6a, 'k6-alvo'), campoA('Usuários virtuais (1–50)', k6u, 'k6-usuarios'), campoA('Duração em segundos (1–600)', k6d, 'k6-duracao'));
  const msg = h('div', { id: 'rotina-erro', role: 'alert' });
  const k6aviso = h('p', { class: 'suave', id: 'k6-disponibilidade' });
  gK6.prepend(k6aviso);
  const atualizar = async () => {
    const t = tipo.value; const exec = ['smoke', 'regressao'].includes(t);
    gCap.hidden = !exec; gK6.hidden = t !== 'k6'; gTicket.hidden = !['validacao-ticket', 'consulta-jira', 'smoke', 'regressao', 'k6'].includes(t);
    gEm.hidden = freq.value !== 'unico'; gMin.hidden = freq.value !== 'intervalo'; gHr.hidden = !['diario', 'semanal'].includes(freq.value); gDias.hidden = freq.value !== 'semanal';
    const a = await chamar(() => api.espacoAutomacoes(proj.value)); const caps = a?.capacidades || [];
    k6aviso.textContent = a?.k6Disponivel ? tr('k6 encontrado neste computador.') : tr('k6 não encontrado no PATH: a rotina ficará NOT_RUN até instalar o k6 oficial.');
    cap.replaceChildren(...(caps.length ? caps : ['']).map((c) => h('option', { value: c, selected: c === r?.capability }, c || tr('(nenhuma capability declarada)'))));
  };
  for (const c of [tipo, freq, proj]) c.addEventListener('change', atualizar); atualizar();
  const salvar = botao(r ? 'Salvar alterações' : 'Criar rotina', async () => {
    const t = tipo.value; const dados = { nome: nome.value, espacoId: proj.value, tipo: t, ambiente: amb.value, fuso: fuso.value, politicaPerdido: perd.value, toleranciaMinutos: Number(tol.value) };
    if (['smoke', 'regressao'].includes(t)) dados.capability = cap.value; if (ticket.value.trim() && !gTicket.hidden) dados.ticket = ticket.value.trim().toUpperCase();
    if (t === 'k6') dados.k6 = { script: k6s.value, alvo: k6a.value, usuarios: Number(k6u.value), duracaoSegundos: Number(k6d.value) };
    if (t === 'consulta-jira') dados.operacaoJira = dados.ticket ? 'ticket' : 'tickets';
    dados.frequencia = freq.value === 'unico' ? { tipo: 'unico', em: em.value ? paredeParaISO(em.value, fuso.value) : '' } : freq.value === 'intervalo' ? { tipo: 'intervalo', minutos: Number(min.value) } : freq.value === 'diario' ? { tipo: 'diario', hora: hr.value } : { tipo: 'semanal', dias: [...dias.querySelectorAll('input:checked')].map((i) => Number(i.value)), hora: hr.value };
    const rr = await api.agendaSalvar(r?.id, dados);
    if (!rr.ok) { msg.replaceChildren(h('div', { class: 'nota erro' }, rr.error)); return; } avisar(tr('Rotina salva.')); aoSalvar();
  }, 'rotina-salvar');
  return h('div', { class: 'formulario', id: 'rotina-form' }, h('h2', {}, tr(r ? 'Editar rotina' : 'Nova rotina')), campoA('Nome', nome, 'rotina-nome'), campoA('Projeto Prumo', proj, 'rotina-projeto'), campoA('Tipo de rotina', tipo, 'rotina-tipo'), gCap, gTicket, gK6, campoA('Ambiente', amb, 'rotina-ambiente'),
    campoA('Frequência', freq, 'rotina-freq'), gEm, gMin, gHr, gDias, campoA('Fuso horário (nome IANA, ex.: America/Sao_Paulo)', fuso, 'rotina-fuso'), campoA('Se o Prumo estiver fechado no horário', perd, 'rotina-perdido'), campoA('Tolerância de atraso (min)', tol, 'rotina-tolerancia'), msg, salvar, ' ', botao('Cancelar', aoSalvar, 'rotina-cancelar'));
}
const seloAut = (a) => h('li', {}, h('code', {}, a.capability), ' ', selo(a.estado), a.validaAte ? ' · ' + tr('até {quando}', { quando: hora(a.validaAte) }) : '', a.usos ? ' · ' + tr('usos {n}', { n: a.usos }) : '');
function cartaoRotina(r, espacos, recarregar) {
  const proj = espacos.find((e) => e.id === r.espacoId); const dias = h('input', { type: 'number', min: 1, max: 30, value: 7, id: 'aut-dias-' + r.id }); const usos = h('input', { type: 'number', min: 1, max: 1000, value: 20, id: 'aut-usos-' + r.id });
  const precisaAut = ['smoke', 'regressao', 'validacao-ticket', 'k6'].includes(r.tipo);
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
      botao('Executar agora', async () => { const x = await chamar(() => api.agendaExecutar(r.id)); if (x) { avisar(tr('Rotina enfileirada. Testes pedem a sua autenticação do Windows.')); setTimeout(recarregar, 1500); } }),
      botao('Histórico desta rotina', () => { estado.filtroExec = { rotinaId: r.id, selecionadoQuando: estado.espaco?.id ?? null }; mostrar('execucoes'); }),
      botao('Excluir', async () => { const x = await chamar(() => api.agendaExcluir(r.id)); if (x && !x.canceled) recarregar(); })),
    precisaAut ? h('div', { class: 'agenda-acoes' }, campoA('Validade (dias, 1–30)', dias, 'aut-dias-' + r.id), campoA('Máximo de execuções', usos, 'aut-usos-' + r.id),
      botao('Autorizar execuções agendadas…', async () => { const x = await chamar(() => api.agendaAutorizar(r.id, Number(dias.value), Number(usos.value))); if (x && !x.canceled) { avisar(tr('Autorização registrada.')); recarregar(); } }),
      ...r.autorizacoes.filter((a) => a.id && a.estado === 'VIGENTE').map((a) => botao('Revogar ' + a.capability, async () => { if (await chamar(() => api.agendaRevogar(a.id))) recarregar(); }))) : null);
}
function blocoPoliticas(espacos, permissoes, recarregar) {
  const p0 = estado.espaco?.id || espacos[0]?.id; const proj = h('select', { id: 'pol-projeto' }, espacos.map((e) => h('option', { value: e.id, selected: e.id === p0 }, e.nome)));
  const tickets = h('input', { id: 'pol-tickets', placeholder: 'SMART-1, SMART-2' }); const dias = h('input', { id: 'pol-dias', type: 'number', min: 1, max: 30, value: 7 }); const max = h('input', { id: 'pol-max', type: 'number', min: 1, max: 1000, value: 20 });
  const tipos = h('div', { class: 'dias-semana', id: 'pol-tipos' }, ['smoke', 'regressao', 'validacao-ticket', 'k6'].map((t) => h('label', { class: 'linha' }, h('input', { type: 'checkbox', value: t, checked: t !== 'k6' }), rotuloTipo(t))));
  return h('div', { id: 'politicas' }, h('h2', {}, tr('Política de publicação de comentários no Jira')),
    h('p', { class: 'suave' }, tr('Rotinas agendadas só comentam no Jira se existir uma política aprovada por você, restrita a tickets, tipos de rotina, validade e quantidade. O comentário mostra o resultado e nunca altera o status do ticket. Para publicar manualmente, use Execuções.')),
    h('div', { class: 'formulario' }, campoA('Projeto Prumo', proj, 'pol-projeto'), campoA('Tickets autorizados (separados por vírgula)', tickets, 'pol-tickets'), h('div', { class: 'campo' }, h('span', {}, tr('Tipos de rotina')), tipos), campoA('Validade (dias)', dias, 'pol-dias'), campoA('Máximo de comentários', max, 'pol-max'),
      botao('Aprovar política…', async () => {
        const dados = { espacoId: proj.value, tickets: tickets.value.split(/[,\s]+/).map((x) => x.trim().toUpperCase()).filter(Boolean), tipos: [...tipos.querySelectorAll('input:checked')].map((i) => i.value), dias: Number(dias.value), maxPublicacoes: Number(max.value) };
        const x = await chamar(() => api.agendaPolitica(dados)); if (x && !x.canceled) { avisar(tr('Política registrada.')); recarregar(); }
      }, 'pol-salvar')),
    permissoes.publicacoes.length ? h('ul', {}, permissoes.publicacoes.map((p) => h('li', {}, selo(p.estado), ' ', p.tickets.join(', '), ' · ', p.tipos.join(', '), ' · ', tr('até {quando}', { quando: hora(p.validaAte) }), ' · ', tr('usadas {a}/{b}', { a: p.usadas, b: p.maxPublicacoes }), ' ',
      p.estado === 'VIGENTE' ? botao('Revogar política', async () => { if (await chamar(() => api.agendaRevogarPolitica(p.id))) recarregar(); }) : null))) : h('p', { class: 'suave' }, tr('Nenhuma política criada: nenhuma rotina agendada comenta no Jira.')));
}
abas.agenda = async (el) => {
  el.append(h('h1', {}, tr('Agendamentos')), h('p', {}, tr('Crie rotinas de QA (consulta Jira, smoke, regressão, validação por ticket, análise de mudanças e k6) que o Prumo executa sozinho enquanto estiver aberto ou na bandeja do Windows.')));
  const espacos = await chamar(api.espacos); if (!espacos) return; if (!espacos.length) return el.append(h('div', { class: 'vazio' }, tr('Crie um projeto Prumo em Projetos para agendar rotinas.')));
  const w = await atualizarWorker(); const recarregar = () => mostrar('agenda');
  el.append(h('div', { class: 'nota', id: 'agenda-worker' }, h('strong', {}, textoWorker(w)), ' · ', tr('Próxima execução: {quando}', { quando: w?.proximaExecucao ? hora(w.proximaExecucao) : tr('nenhuma agendada') }), ' · ', tr('pendentes: {n}', { n: w?.pendentes ?? 0 }),
    h('div', { class: 'barra' }, botao(w?.pausado ? 'Retomar todos os agendamentos' : 'Pausar todos os agendamentos', async () => { if (await chamar(() => api.workerPausa(!w?.pausado))) recarregar(); }, 'agenda-pausa')),
    h('p', { class: 'suave' }, tr('Pausar impede novas execuções; o que já está rodando termina sem ser corrompido. Se o computador estiver desligado ou suspenso, nada é executado e o horário é registrado como perdido, nunca como executado.'))));
  const slot = h('div', { id: 'rotina-slot' }); el.append(botao('Nova rotina', () => { slot.replaceChildren(formularioRotina(espacos, null, () => { slot.replaceChildren(); recarregar(); })); }, 'rotina-nova'), slot);
  const lista = await chamar(() => api.agendaListar(estado.espaco?.id)); if (!lista) return;
  el.append(h('h2', {}, tr('Rotinas')));
  if (!lista.length) el.append(h('div', { class: 'vazio', id: 'agenda-vazia' }, tr('Nenhuma rotina criada ainda.')));
  for (const r of lista) el.append(cartaoRotina(r, espacos, recarregar));
  const perm = await chamar(() => api.agendaPermissoes(estado.espaco?.id)); if (perm) el.append(blocoPoliticas(espacos, perm, recarregar));
  el.append(h('h2', {}, tr('Prumo residente')), h('div', { class: 'nota', id: 'residente' }, h('p', {}, tr('Ao fechar a janela, o Prumo continua na bandeja do Windows para executar as rotinas. Para parar tudo, use "Sair do Prumo" no menu do ícone da bandeja: isso encerra o worker e os processos filhos.')),
    ...[['iniciarComWindows', 'Iniciar o Prumo com o Windows (desligado por padrão; só você pode ligar)'], ['notificarAgenda', 'Avisar quando uma rotina falhar, for bloqueada ou concluir']].map(([k, t]) => h('label', { class: 'opcao' }, h('input', { type: 'checkbox', id: 'pref-' + k, checked: !!estado.prefs?.[k], onchange: async (e) => { const r = await chamar(() => api.salvarPreferencias({ [k]: e.target.checked })); if (r) estado.prefs = r.preferencias; } }), tr(t)))));
};

// ---- Execuções (histórico centralizado) ----
const duracao = (n) => (n === null || n === undefined ? '—' : n < 1000 ? n + ' ms' : Math.round(n / 100) / 10 + ' s');
async function detalheJira(x, caixa) {
  const p = await chamar(() => api.jiraPrevia(x.id)); if (!p) return;
  caixa.replaceChildren(h('p', { class: 'suave' }, tr('Prévia do comentário para {t} (nada foi enviado):', { t: p.ticket })), h('pre', {}, p.texto), botao('Publicar no Jira…', async () => { const r = await chamar(() => api.jiraPublicar(x.id)); if (r && !r.canceled) { avisar(r.estado === 'PUBLICADO' ? tr('Comentário publicado.') : tr('Publicação não concluída: {e}', { e: r.erro || r.estado }), r.estado !== 'PUBLICADO'); mostrar('execucoes'); } }, 'jira-publicar'));
}
abas.execucoes = async (el) => {
  el.append(h('h1', {}, tr('Execuções')), h('p', {}, tr('Histórico centralizado do Prumo: rotinas agendadas e manuais, com resultado, evidência e comentário Jira. Consultar esta tela não conta como execução de QA.')));
  const espacos = await chamar(api.espacos) || []; const f = estado.filtroExec || (estado.filtroExec = {});
  // Trocar de projeto descarta o filtro anterior: a tela sempre corresponde ao projeto selecionado.
  if (f.selecionadoQuando !== (estado.espaco?.id ?? null)) { for (const k of Object.keys(f)) delete f[k]; f.selecionadoQuando = estado.espaco?.id ?? null; }
  if (!f.espacoId && estado.espaco && f.todos !== true) f.espacoId = estado.espaco.id;
  const proj = h('select', { id: 'f-projeto' }, h('option', { value: '' }, tr('Todos os projetos')), espacos.map((e) => h('option', { value: e.id, selected: e.id === f.espacoId }, e.nome)));
  const tk = h('input', { id: 'f-ticket', placeholder: 'SMART-1', value: f.ticket || '' }); const res = h('select', { id: 'f-resultado' }, h('option', { value: '' }, tr('Qualquer resultado')), ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'ERRO_INFRA', 'INFO'].map((v) => h('option', { value: v, selected: v === f.resultado }, v)));
  el.append(h('div', { class: 'barra' }, campoA('Projeto', proj, 'f-projeto'), campoA('Ticket', tk, 'f-ticket'), campoA('Resultado', res, 'f-resultado'),
    botao('Filtrar', () => { estado.filtroExec = { espacoId: proj.value || undefined, todos: !proj.value, ticket: tk.value.trim().toUpperCase() || undefined, resultado: res.value || undefined, rotinaId: f.rotinaId, selecionadoQuando: f.selecionadoQuando }; mostrar('execucoes'); }, 'f-aplicar'),
    f.rotinaId ? botao('Limpar filtro de rotina', () => { delete estado.filtroExec.rotinaId; mostrar('execucoes'); }) : null));
  const m = await chamar(() => api.metricasExecucoes(f.espacoId)); const cel = (n, t) => h('div', {}, h('b', {}, String(n)), h('span', {}, tr(t)));
  if (m) el.append(h('div', { class: 'grade', id: 'metricas-exec' }, cel(m.execucoes, 'execuções'), cel(m.pass, 'PASS'), cel(m.fail, 'FAIL'), cel(m.blocked, 'BLOCKED'), cel(m.notRun, 'NOT_RUN'), cel(m.consultas, 'consultas (INFO)'), cel(m.rotinasAtivas, 'rotinas ativas'), cel(m.rotinasPausadas, 'rotinas pausadas'),
    cel(m.falhasDeAgendamento, 'falhas de agendamento'), cel(m.comentariosPendentes, 'comentários pendentes'), cel(m.publicacoesConcluidas, 'publicações concluídas')),
    h('p', { class: 'suave' }, tr('Última execução: {a} · Próxima: {b}. Sem porcentagem de qualidade: quantidade de testes não mede qualidade.', { a: m.ultimaExecucao ? hora(m.ultimaExecucao.em) + ' (' + m.ultimaExecucao.resultado + ')' : '—', b: m.proximaExecucao ? hora(m.proximaExecucao) : '—' })));
  const lista = await chamar(() => api.execucoes({ espacoId: f.espacoId, rotinaId: f.rotinaId, ticket: f.ticket, resultado: f.resultado, limite: 100 })); if (!lista) return;
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
          h('td', {}, h('details', {}, h('summary', {}, tr('Detalhes')), r?.detalhes ? h('pre', {}, r.detalhes) : null, h('ul', {}, x.tentativas.map((t) => h('li', {}, tr('tentativa {n}: ', { n: t.n }), selo(t.estado), t.codigo ? ' ' + t.codigo : ''))),
            x.evidenciaId && x.pastaLocal ? botao('Ver evidência', () => { estado.root = x.pastaLocal; salvarRaiz(); estado.jobId = x.evidenciaId; mostrar('evidencias'); }) : null,
            x.ticket && r && ['PASS', 'FAIL'].includes(r.status) ? botao('Comentário Jira', () => detalheJira(x, jiraCx)) : null)));
      })))), jiraCx);
  }
  await execucoesExternas(el);
};

// ---- Aviso de eventos do worker (consulta periódica: a ponte não expõe canais de evento livres) ----
async function consultarEventos() {
  try {
    const r = await api.workerEventos(estado.ultimoEvento || 0); if (!r.ok) return; estado.ultimoEvento = r.data.ultimo;
    for (const e of r.data.eventos) {
      if (e.tipo === 'NAVEGAR') { mostrar(e.destino); continue; }
      const erro = ['EXECUCAO_FALHOU', 'EXECUCAO_BLOQUEADA', 'PUBLICACAO_JIRA_FALHOU', 'WORKER_INTERROMPIDO'].includes(e.tipo);
      avisar(`${e.titulo}: ${e.detalhe}`, erro);
      if (e.tipo !== 'AGENDAMENTO_INICIADO' && estado.prefs && estado.prefs.notificarAgenda !== false && estado.prefs.som && !estado.prefs.silenciar) tocarSom();
      if (['agenda', 'execucoes', 'inicio'].includes(estado.aba)) setTimeout(() => mostrar(estado.aba), 300);
    }
    await atualizarWorker();
  } catch { /* a janela pode estar fechando */ }
}
async function iniciarAgenda() {
  const brand = document.querySelector('.marca img'); if (brand) brand.replaceWith(qc.orb(30, 'ocioso'));
  const p = await chamar(api.preferencias); if (p) { estado.prefs = p.preferencias; aplicarTema(p.preferencias.tema); PrumoI18n.definir(p.preferencias.idioma); document.documentElement.lang = p.preferencias.idioma; }
  montarControles(); PrumoI18n.traduzirDocumento(); await atualizarWorker(); await consultarEventos();
  setInterval(consultarEventos, 3000);
}
