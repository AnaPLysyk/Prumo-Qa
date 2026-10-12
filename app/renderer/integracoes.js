'use strict';
// Telas das integrações (2.9): Tickets, Testes, Planos e Runs, Vínculos, Automações (GitHub), Agentes e escrita nas Conexões.
// Apresentação apenas: cada botão chama um canal IPC validado; a confirmação nativa, a idempotência e a política ficam no processo principal.
const area = (rotulo, ...f) => h('div', { class: 'campo' }, h('span', {}, rotulo), ...f);
const campoTexto = (rotulo, id, attrs = {}) => { const input = h('textarea', { id, rows: attrs.rows || 3, maxlength: attrs.maxlength || 4000 }); if (attrs.value) input.value = attrs.value; return { input, no: h('label', { class: 'campo' }, rotulo, input) }; };
const selecaoSimples = (id, opcoes, atual) => h('select', { id }, opcoes.map(([v, t]) => h('option', { value: v, selected: v === atual }, t)));
const seloOp = (s) => selo(s === 'CONFIRMADA' ? 'VALIDADO' : s === 'ENVIADA' ? 'PENDENTE' : s === 'BLOQUEADA' ? 'BLOCKED' : s === 'FALHA' ? 'ERRO' : s);
const nomeServ = { jira: 'Jira', qase: 'Qase', github: 'GitHub' };

/** Estado da habilitação de escrita por serviço no projeto selecionado. */
async function escritaDoProjeto(e) { const r = await chamar(() => api.escritaEstado(e.id)); const m = {}; for (const s of r?.servicos || []) m[s.servico] = s.escrita; return m; }
const vazio = () => document.createDocumentFragment();
const avisoEscrita = (servico, habilitada) => (habilitada ? vazio() : h('div', { class: 'nota', 'data-escrita-desligada': servico }, 'Escrita no ' + nomeServ[servico] + ' desligada. Habilite em Conexões.'));
/** Executa uma operação externa: a janela só pede; o principal confirma de forma nativa, executa e reconcilia. */
async function executarOperacao(e, operacao, parametros, anexo) {
  const r = await chamar(() => api.operacaoExecutar(e.id, operacao, parametros, anexo)); if (!r || r.canceled) return null;
  if (r.estado === 'CONFIRMADA') avisar(r.reutilizada ? 'Operação já concluída antes; nada foi duplicado.' : 'Operação concluída e confirmada no serviço.');
  else if (r.estado === 'BLOQUEADA') avisar('Operação bloqueada: ' + (r.erro || ''), true);
  else avisar('Operação não confirmada (' + r.estado + (r.erro ? ' · ' + r.erro : '') + '). Pode tentar de novo sem duplicar.', true);
  return r;
}
const linkRemoto = (r) => (r?.remoto ? [(r.remoto.chave || r.remoto.id || ''), r.remoto.url ? ' · ' + r.remoto.url : ''].join('') : '');
function painelResultado(r) { return r ? h('div', { class: 'nota', 'data-resultado-operacao': r.estado }, seloOp(r.estado), ' ', r.resumo, linkRemoto(r) ? h('div', { class: 'suave' }, linkRemoto(r)) : null, r.erro ? h('div', { class: 'suave' }, r.erro) : null) : null; }
const semProjetoServico = (el, servico) => { const e = estado.espaco; if (!e) { el.append(faltaEspaco()); return null; } if (!e.vinculos.some(v => v.servico === servico)) return null; return e; };

// ---------------- Tickets ----------------
const ticketsBase = abas.tickets;
abas.tickets = async (el) => {
  await ticketsBase(el); const e = semProjetoServico(el, 'jira'); if (!e) return;
  const avancados = [...el.childNodes].filter(n => n.nodeName !== 'H1');
  el.append(h('details', { class: 'qualidade-consulta-avancada' }, h('summary', {}, 'Consulta avançada e campos de critérios'), ...avancados));
  const perm = await escritaDoProjeto(e); const on = !!perm.jira;
  const q = campoPlataforma('Chave ou texto', { id: 'tk-q', maxlength: 100 }); const tipo = campoPlataforma('Tipo', { id: 'tk-tipo', maxlength: 60 }); const status = campoPlataforma('Status', { id: 'tk-status', maxlength: 60 });
  const desde = campoPlataforma('Atualizado desde', { id: 'tk-desde', type: 'date' }); const ate = campoPlataforma('Até', { id: 'tk-ate', type: 'date' }); const lista = h('div', { id: 'tk-lista' }); const detalhe = h('div', { id: 'tk-detalhe' }); const criarCx = h('div', { id: 'tk-criar' });
  el.append(h('h2', {}, 'Buscar tickets do Jira'), 
    h('div', { class: 'barra' }, q.no, tipo.no, status.no, desde.no, ate.no, botao('Buscar', () => buscar({ offset: 0, limite: 25 }), 'tk-buscar')), lista, detalhe, h('details', { class: 'mais', id: 'tk-criar-caixa' }, h('summary', {}, 'Criar ticket'), avisoEscrita('jira', on), criarCx));
  async function buscar(pagina) {
    const f = {}; for (const [k, c] of [['q', q], ['tipo', tipo], ['status', status], ['desde', desde], ['ate', ate]]) if (c.input.value.trim()) f[k] = c.input.value.trim();
    const r = await chamar(() => api.servicoConsultar(e.id, 'jira', 'tickets', pagina, undefined, f)); if (!r) return;
    const itens = r.dados || []; lista.replaceChildren(h('p', { class: 'suave' }, 'Consulta atual · ' + hora(r.consultadoEm) + ' · ' + itens.length + ' ticket(s) nesta página · sem cache'),
      itens.length ? h('div', { class: 'rolagem' }, h('table', { id: 'tk-tabela' }, h('thead', {}, h('tr', {}, ['Chave', 'Resumo', 'Tipo', 'Status', 'Responsável', 'Atualizado', ''].map(t => h('th', {}, t)))),
        h('tbody', {}, itens.map(i => { const f2 = i.fields || {}; return h('tr', { 'data-ticket': i.key }, h('td', {}, h('strong', {}, i.key)), h('td', {}, f2.summary || ''), h('td', {}, f2.issuetype?.name || '—'), h('td', {}, f2.status?.name || '—'), h('td', {}, f2.assignee?.displayName || '—'), h('td', {}, f2.updated ? hora(f2.updated) : '—'), h('td', {}, botao('Detalhar', () => abrir(i.key)))); })))) : h('div', { class: 'vazio' }, 'Nenhum ticket para estes filtros.'),
      r.proxima !== null ? botao('Próxima página', () => buscar(typeof r.proxima === 'string' ? { cursor: r.proxima, limite: 25 } : { offset: r.proxima, limite: 25 })) : null);
  }
  async function abrir(chave) {
    const [t, com, hist, anexos, trans] = await Promise.all([api.servicoConsultar(e.id, 'jira', 'ticket', {}, chave), api.servicoConsultar(e.id, 'jira', 'comentarios', { limite: 20 }, chave), api.servicoConsultar(e.id, 'jira', 'historico', { limite: 20 }, chave), api.servicoConsultar(e.id, 'jira', 'anexos', {}, chave), api.servicoConsultar(e.id, 'jira', 'transicoes', {}, chave)]);
    if (!t.ok) { avisar(t.error, true); return; } const d = t.data.dados, f = d.fields || {}; const vj = e.vinculos.find(v => v.servico === 'jira'); const criterio = vj?.campoAceite ? textoExterno(f[vj.campoAceite]) : null;
    const novoTexto = campoTexto('Comentário (texto simples)', 'tk-comentario'); const trSel = h('select', { id: 'tk-transicao' }, (trans.ok ? trans.data.dados : []).map(x => h('option', { value: x.id }, x.nome + (x.para ? ' → ' + x.para : ''))));
    const filhos = [...(f.subtasks || []).map(s => 'Subtarefa ' + s.key), f.parent ? 'Pai ' + f.parent.key : null, ...((f.issuelinks || []).map(l => 'Vínculo ' + (l.inwardIssue?.key || l.outwardIssue?.key || '?')))].filter(Boolean);
    detalhe.replaceChildren(h('section', { class: 'nota', id: 'tk-painel', 'data-ticket': chave }, h('h2', {}, chave + ' · ' + (f.summary || '')), h('p', { class: 'suave' }, [f.issuetype?.name, f.status?.name, f.priority?.name, f.assignee?.displayName].filter(Boolean).join(' · ') + ' · fonte: ' + t.data.origem + ' · ' + hora(t.data.consultadoEm)),
      h('h2', {}, 'Descrição'), h('pre', {}, textoExterno(f.description) || '(sem descrição)'), h('h2', {}, 'Critérios de aceite'), criterio ? h('pre', {}, criterio) : h('p', { class: 'suave' }, 'Campo de critérios não configurado para este projeto (Tickets > Descobrir campos).'),
      filhos.length ? h('p', {}, filhos.join(' · ')) : null,
      h('details', {}, h('summary', {}, 'Comentários (' + (com.ok ? com.data.dados.length : 0) + ')'), ...(com.ok ? com.data.dados.map(c => h('div', { class: 'nota' }, h('strong', {}, c.author?.displayName || ''), h('pre', {}, textoExterno(c.body)))) : [])),
      h('details', {}, h('summary', {}, 'Histórico de alterações'), ...(hist.ok ? hist.data.dados.map(x => h('p', {}, hora(x.em) + ' · ' + (x.por || '—') + ' · ' + x.mudancas.map(m => `${m.campo}: ${m.de ?? '—'} → ${m.para ?? '—'}`).join('; '))) : [h('p', { class: 'suave' }, 'Indisponível: ' + (hist.error || ''))])),
      h('details', {}, h('summary', {}, 'Anexos (' + (anexos.ok ? anexos.data.dados.length : 0) + ')'), ...(anexos.ok ? anexos.data.dados.map(a => h('p', {}, a.nome + ' · ' + a.bytes + ' bytes')) : [])),
      h('div', { class: 'agenda-acoes' }, botao('Importar como contexto (rascunho)', async () => { const r = await chamar(() => api.servicoImportar(e.id, chave)); if (r && !r.canceled) avisar('Contexto importado como RASCUNHO.'); }), botao('Preencher bug a partir deste ticket', () => formCriar(chave))),
      avisoEscrita('jira', on), h('div', { class: 'formulario' }, novoTexto.no, botao('Comentar no ticket…', async () => { const r = await executarOperacao(e, 'jira.comentar', { ticket: chave, texto: novoTexto.input.value }); if (r) detalhe.append(painelResultado(r)); }, 'tk-comentar'),
        h('label', { class: 'campo' }, 'Mudar status', trSel), botao('Mudar status…', async () => { const r = await executarOperacao(e, 'jira.transicionar', { ticket: chave, transicaoId: trSel.value }); if (r) { detalhe.append(painelResultado(r)); abrir(chave); } }, 'tk-transicionar'),
        botao('Anexar arquivo…', async () => { const r = await executarOperacao(e, 'jira.anexar', { ticket: chave }, { tipo: 'arquivo' }); if (r) detalhe.append(painelResultado(r)); }, 'tk-anexar'))));
  }
  async function formCriar(origem, abrir = true) {
    const meta = await chamar(() => api.servicoConsultar(e.id, 'jira', 'metadados')); const tipos = (meta?.dados || []).filter(t => !t.subtarefa); const sel = selecaoSimples('tk-novo-tipo', tipos.map(t => [t.id, t.nome]));
    const resumo = campoPlataforma('Resumo', { id: 'tk-novo-resumo', maxlength: 255 }); const desc = campoTexto('Descrição', 'tk-novo-descricao', { maxlength: 8000, rows: 5 }); const org = campoPlataforma('Ticket de origem (opcional)', { id: 'tk-novo-origem', value: origem || '' }); const rot = campoPlataforma('Rótulos (separados por vírgula)', { id: 'tk-novo-rotulos', value: 'prumo-qa' });
    const saida = h('div', { id: 'tk-novo-saida' });
    criarCx.replaceChildren(h('div', { class: 'formulario' }, h('label', { class: 'campo' }, 'Tipo de ticket', sel), resumo.no, desc.no, org.no, rot.no,
      botao('Revisar e criar…', async () => { const p = { tipoId: sel.value, resumo: resumo.input.value, descricao: desc.input.value, rotulos: rot.input.value.split(/[,\s]+/).filter(Boolean), ...(org.input.value.trim() ? { origem: org.input.value.trim().toUpperCase() } : {}) }; const r = await executarOperacao(e, 'jira.criar_ticket', p); saida.replaceChildren(painelResultado(r) || ''); }, 'tk-novo-criar'), saida));
    const cx = $('#tk-criar-caixa'); if (cx && abrir) cx.open = true; criarCx.scrollIntoView({ block: 'nearest' });
  }
  await formCriar('', false);
};

// ---------------- Testes (propostas, suites e edição) ----------------
const testesBase = abas.testes;
const passoRow = (p = {}) => { const a = h('input', { class: 'passo-acao', placeholder: 'Ação', maxlength: 2000, value: p.acao || '' }); const x = h('input', { class: 'passo-esperado', placeholder: 'Resultado esperado', maxlength: 2000, value: p.esperado || '' }); return h('div', { class: 'passo' }, a, x, botao('Remover passo', async function () { }, undefined)); };
function formularioProposta(e, existente, aoSalvar) {
  const d = existente?.dados || {}; const titulo = campoPlataforma('Título do caso', { id: 'pr-titulo', maxlength: 255, value: d.titulo || '' }); const desc = campoTexto('Descrição', 'pr-descricao', { value: d.descricao || '', rows: 3 }); const pre = campoTexto('Pré-condições', 'pr-pre', { value: d.preCondicoes || '', rows: 2 });
  const passos = h('div', { id: 'pr-passos' }); const novoPasso = (p) => { const l = passoRow(p); l.querySelector('button').onclick = () => l.remove(); passos.append(l); }; for (const p of d.passos?.length ? d.passos : [{}]) novoPasso(p);
  const suite = campoPlataforma('ID da suite no Qase (opcional)', { id: 'pr-suite', type: 'number', value: d.suiteId || '' }); const prio = campoPlataforma('Prioridade (ID do Qase, opcional)', { id: 'pr-prioridade', type: 'number', value: d.prioridade ?? '' });
  const auto = h('select', { id: 'pr-automacao' }, [['manual', 'Manual'], ['a-automatizar', 'Manual, a automatizar'], ['automatizado', 'Automatizado']].map(([v, t]) => h('option', { value: v, selected: v === (d.automacao || 'manual') }, t))); const ticket = campoPlataforma('Ticket Jira de origem (opcional)', { id: 'pr-ticket', value: d.ticket || '', maxlength: 40 });
  const req = campoPlataforma('Requisito que o caso cobre', { id: 'pr-requisito', maxlength: 500, value: existente?.requisito || '' }); const risco = campoPlataforma('Risco', { id: 'pr-risco', maxlength: 300, value: existente?.risco || '' }); const saida = h('div', { id: 'pr-saida', role: 'alert' });
  return h('div', { class: 'formulario', id: 'pr-form' }, h('h2', {}, existente ? 'Editar proposta de caso' : 'Nova proposta de caso'), titulo.no, desc.no, pre.no, h('div', { class: 'campo' }, h('span', {}, 'Passos'), passos, botao('Adicionar passo', () => novoPasso({}), 'pr-add-passo')), h('label', { class: 'campo' }, 'Tipo de automação', auto), suite.no, prio.no, ticket.no, req.no, risco.no, saida,
    botao(existente ? 'Salvar alterações' : 'Salvar rascunho', async () => {
      const dados = { titulo: titulo.input.value, descricao: desc.input.value, preCondicoes: pre.input.value, passos: [...passos.querySelectorAll('.passo')].map(l => ({ acao: l.querySelector('.passo-acao').value, esperado: l.querySelector('.passo-esperado').value })).filter(p => p.acao.trim()), automacao: auto.value };
      if (suite.input.value) dados.suiteId = Number(suite.input.value); if (prio.input.value !== '') dados.prioridade = Number(prio.input.value); if (ticket.input.value.trim()) dados.ticket = ticket.input.value.trim().toUpperCase();
      const r = await (existente ? api.propostaEditar(existente.id, dados, req.input.value, risco.input.value) : api.propostaCriar(e.id, 'caso', dados, req.input.value, risco.input.value));
      if (!r.ok) { saida.replaceChildren(h('div', { class: 'nota erro' }, r.error)); return; } avisar('Proposta salva como rascunho. Nada foi enviado ao Qase.'); aoSalvar();
    }, 'pr-salvar'), ' ', botao('Cancelar', aoSalvar));
}
function cartaoProposta(e, p, perm, recarregar) {
  const rev = p.revisao; const checks = ['duplicidade', 'requisito', 'risco', 'cobertura'].map(k => h('label', { class: 'opcao linha' }, h('input', { type: 'checkbox', 'data-rev': k }), ({ duplicidade: 'Conferi duplicidade', requisito: 'O requisito está informado e coberto', risco: 'Avaliei o risco', cobertura: 'Avaliei a cobertura' })[k]));
  return h('section', { class: 'agenda-rotina', 'data-proposta': p.id }, h('h2', {}, p.titulo, ' ', selo(p.estado)), h('p', { class: 'suave' }, p.tipo === 'caso' ? 'Caso de teste' : 'Bug', ' · ', p.origem === 'IA' ? 'Sugerido por IA' + (p.cliente ? ' (' + p.cliente + ')' : '') : p.origem === 'PRUMO' ? 'Preparado pelo Prumo a partir de uma falha' : 'Criado por você', ' · ', hora(p.criadaEm)),
    p.similares.length ? h('div', { class: 'nota' }, 'Parecida com ' + p.similares.length + ' proposta(s) existente(s): confira duplicidade antes de publicar.') : null,
    p.requisito ? h('p', {}, 'Requisito: ' + p.requisito) : null, p.risco ? h('p', {}, 'Risco: ' + p.risco) : null,
    p.tipo === 'caso' ? h('details', {}, h('summary', {}, 'Passos (' + (p.dados.passos || []).length + ')'), h('ol', {}, (p.dados.passos || []).map(s => h('li', {}, s.acao + (s.esperado ? ' → ' + s.esperado : '')))))
      : h('details', {}, h('summary', {}, 'Descrição'), h('pre', {}, p.dados.descricao || '')),
    rev ? h('p', { class: 'suave' }, 'Revisada por ' + rev.por + ' em ' + hora(rev.em)) : null, p.remoto ? h('p', {}, 'Publicada: ' + (p.remoto.chave || p.remoto.id) + (p.remoto.url ? ' · ' + p.remoto.url : '')) : null,
    p.estado === 'RASCUNHO' || p.estado === 'REVISADA' ? h('div', {}, h('div', { class: 'dias-semana' }, checks), h('div', { class: 'agenda-acoes' },
      botao('Confirmar revisão…', async () => { const v = Object.fromEntries([...checks].map(c => { const i = c.querySelector('input'); return [i.dataset.rev, i.checked]; })); const r = await api.propostaRevisar(p.id, v); if (!r.ok) avisar(r.error, true); else if (!r.data.canceled) { avisar('Revisão registrada.'); recarregar(); } }),
      p.tipo === 'caso' ? botao('Editar', () => { const cx = $('#pr-slot'); cx.replaceChildren(formularioProposta(e, p, () => { cx.replaceChildren(); recarregar(); })); }) : null,
      botao('Publicar…', async () => { let tipoId; if (p.tipo === 'bug' && !p.dados.tipoId) { const m = await chamar(() => api.servicoConsultar(e.id, 'jira', 'metadados')); const tipos = (m?.dados || []).filter(t => !t.subtarefa); tipoId = (tipos.find(t => /bug|defeito/i.test(t.nome)) || tipos[0])?.id; }
        const r = await api.propostaPublicar(p.id, tipoId); if (!r.ok) { avisar(r.error, true); return; } if (r.data.canceled) return; avisar(r.data.estado === 'CONFIRMADA' ? 'Proposta publicada e confirmada.' : 'Publicação não confirmada: ' + (r.data.erro || r.data.estado), r.data.estado !== 'CONFIRMADA'); recarregar(); }, 'pr-publicar-' + p.id),
      botao('Descartar', async () => { if (await chamar(() => api.propostaDescartar(p.id))) recarregar(); }))) : null);
}
abas.testes = async (el) => {
  await testesBase(el); const e = semProjetoServico(el, 'qase'); if (!e) return; const perm = await escritaDoProjeto(e); const on = !!perm.qase;
  const slot = h('div', { id: 'pr-slot' }); const recarregar = () => mostrar('testes');
  el.append(h('h2', {}, 'Propostas de casos e bugs'), h('p', { class: 'suave' }, 'Rascunhos: nada sai sem a sua revisão.'), avisoEscrita('qase', on),
    botao('Nova proposta de caso', () => slot.replaceChildren(formularioProposta(e, null, () => { slot.replaceChildren(); recarregar(); })), 'pr-nova'), slot);
  const ps = await chamar(() => api.propostas(e.id)); const lista = (ps || []).filter(p => p.estado !== 'DESCARTADA');
  if (!lista.length) el.append(h('div', { class: 'vazio', id: 'pr-vazia' }, 'Nenhuma proposta ainda.')); for (const p of lista) el.append(cartaoProposta(e, p, perm, recarregar));
  const suiteT = campoPlataforma('Título da suite', { id: 'su-titulo', maxlength: 255 }); const edId = campoPlataforma('ID do caso a editar', { id: 'ed-caso', type: 'number' }); const edT = campoPlataforma('Novo título', { id: 'ed-titulo', maxlength: 255 }); const asId = campoPlataforma('ID do caso', { id: 'as-caso', type: 'number' }); const asT = campoPlataforma('Ticket Jira', { id: 'as-ticket', maxlength: 40 }); const saida = h('div', { id: 'ts-saida' });
  el.append(h('h2', {}, 'Suites, edição e associação (operações diretas)'),  h('div', { class: 'formulario' },
    suiteT.no, botao('Criar suite…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'qase.criar_suite', { titulo: suiteT.input.value })) || ''); }, 'su-criar'),
    edId.no, edT.no, botao('Editar caso…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'qase.editar_caso', { casoId: Number(edId.input.value), titulo: edT.input.value })) || ''); }, 'ed-salvar'),
    asId.no, asT.no, botao('Associar caso ao ticket…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'qase.associar_ticket', { casoId: Number(asId.input.value), ticket: asT.input.value.trim().toUpperCase() })) || ''); }, 'as-salvar'), saida));
};

// ---------------- Planos e Runs ----------------
abas.runs = async (el) => {
  el.append(h('h1', {}, 'Features'));
  const e = semProjetoServico(el, 'qase'); if (!e) { if (estado.espaco) el.append(h('div', { class: 'vazio' }, 'Vincule o Qase em Conexões.')); return; }
  const perm = await escritaDoProjeto(e); const on = !!perm.qase; const recarregar = () => mostrar('runs'); const nova = h('div', { id: 'run-nova' }); const saida = h('div', { id: 'run-saida' });
  el.append(avisoEscrita('qase', on), h('h2', {}, 'Nova execução'), nova);
  const casos = await chamar(() => api.servicoConsultar(e.id, 'qase', 'casos', { limite: 100 })); const lista = casos?.dados || []; const titulo = campoPlataforma('Título da execução', { id: 'run-titulo', maxlength: 255 });
  const amb = selecaoSimples('run-ambiente', [['teste', 'Teste'], ['homologacao', 'Homologação'], ['local', 'Local']]); const marcados = new Set();
  nova.append(h('div', { class: 'formulario' }, titulo.no, h('label', { class: 'campo' }, 'Ambiente', amb), h('div', { class: 'campo' }, h('span', {}, 'Cenários (' + lista.length + ')'), lista.length ? h('div', { id: 'run-casos' }, lista.map(c => h('label', { class: 'opcao linha' }, h('input', { type: 'checkbox', 'data-caso': c.id, onchange: (ev) => (ev.target.checked ? marcados.add(c.id) : marcados.delete(c.id)) }), `${c.id} · ${c.title}`))) : h('p', { class: 'suave' }, 'Nenhum caso retornado pelo Qase.')),
    botao('Preparar run', async () => { const sel = lista.filter(c => marcados.has(c.id)).map(c => ({ casoId: c.id, titulo: String(c.title).slice(0, 255) })); const r = await chamar(() => api.runPreparar({ espacoId: e.id, titulo: titulo.input.value, ambiente: amb.value, casos: sel })); if (r) { avisar('Run preparada localmente. Ainda não existe no Qase.'); recarregar(); } }, 'run-preparar'),
    botao('Criar plano com os casos marcados…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'qase.criar_plano', { titulo: titulo.input.value || 'Plano Prumo', casos: [...marcados] })) || ''); }, 'plano-criar')), saida);
  const runs = await chamar(() => api.runs(e.id)); el.append(h('h2', {}, 'Execuções do projeto'));
  if (!runs?.length) el.append(h('div', { class: 'vazio', id: 'runs-vazio' }, 'Nenhuma execução preparada.')); for (const r of runs || []) el.append(cartaoRun(e, r, on, recarregar));
};
function cartaoRun(e, r, on, recarregar) {
  const resultados = r.casos.map(c => c.resultado?.status ?? 'NOT_RUN'); const conta = (s) => resultados.filter(x => x === s).length; const manual = h('div', { class: 'agenda-acoes' });
  const casoSel = h('select', { id: 'man-caso-' + r.id }, r.casos.filter(c => !c.capability || c.resultado?.origem === 'MANUAL' || !c.resultado).map(c => h('option', { value: c.casoId }, `${c.casoId} · ${c.titulo}`))); const st = selecaoSimples('man-status-' + r.id, [['PASS', 'PASS'], ['FAIL', 'FAIL'], ['BLOCKED', 'BLOCKED']]); const cm = campoPlataforma('Comentário do resultado manual', { id: 'man-comentario-' + r.id, maxlength: 2000 });
  manual.append(h('label', {}, 'Caso', casoSel), h('label', {}, 'Resultado', st), cm.no, botao('Declarar resultado manual…', async () => { const x = await chamar(() => api.runResultado(r.id, Number(casoSel.value), st.value, cm.input.value)); if (x && !x.canceled) { avisar('Resultado manual registrado (marcado MANUAL).'); recarregar(); } }));
  const dias = h('input', { type: 'number', min: 1, max: 30, value: 7, id: 'pol-run-dias-' + r.id }); const usos = h('input', { type: 'number', min: 1, max: 1000, value: 5, id: 'pol-run-usos-' + r.id });
  return h('section', { class: 'agenda-rotina', 'data-run': r.id }, h('h2', {}, r.titulo, ' ', selo(r.estado)), h('p', { class: 'suave' }, 'Ambiente ' + r.ambiente + ' · ' + (r.runIdRemoto ? 'Qase #' + r.runIdRemoto + (r.confirmadaNoQase ? ' · confirmada no Qase' : '') : 'ainda não criada no Qase') + ' · ' + resultados.length + ' caso(s): ' + conta('PASS') + ' PASS · ' + conta('FAIL') + ' FAIL · ' + conta('BLOCKED') + ' BLOCKED · ' + conta('NOT_RUN') + ' sem resultado'),
    h('div', { class: 'rolagem' }, h('table', {}, h('thead', {}, h('tr', {}, ['Caso', 'Automação', 'Resultado', 'Origem', 'Publicado'].map(t => h('th', {}, t)))), h('tbody', {}, r.casos.map(c => h('tr', { 'data-caso': c.casoId }, h('td', {}, c.casoId + ' · ' + c.titulo), h('td', {}, c.capability ? c.capability + (c.casoRunner ? ' #' + c.casoRunner : '') : 'manual'), h('td', {}, selo(c.resultado?.status ?? 'NOT_RUN'), c.resultado?.comentario ? h('div', { class: 'suave' }, c.resultado.comentario.slice(0, 160)) : null), h('td', {}, c.resultado ? c.resultado.origem + ' · ' + c.resultado.granularidade : '—'), h('td', {}, c.publicado ? 'sim' : 'não')))))),
    h('div', { class: 'agenda-acoes' }, !r.runIdRemoto ? botao('Criar run no Qase…', async () => { const y = await chamar(() => api.runCriar(r.id)); if (y && !y.canceled) recarregar(); }, 'run-criar-' + r.id) : null,
      botao('Executar automações…', async () => { const x = await chamar(() => api.runExecutar(r.id)); if (x && !x.canceled) { avisar('Execução concluída: ' + x.executadas.map(z => z.capability + '=' + z.status).join(', ')); recarregar(); } }, 'run-exec-' + r.id),
      botao('Publicar resultados…', async () => { const x = await chamar(() => api.runPublicar(r.id, false)); if (x && !x.canceled) { avisar(x.publicados ? x.publicados + ' resultado(s) publicado(s) e conferidos no Qase.' : 'Nada pendente para publicar.'); recarregar(); } }, 'run-pub-' + r.id)),
    h('details', { class: 'mais' }, h('summary', {}, 'Mais ações'), h('div', { class: 'agenda-acoes' },
      botao('Publicar com anexo de evidência…', async () => { const x = await chamar(() => api.runPublicar(r.id, true)); if (x && !x.canceled) recarregar(); }),
      botao('Conferir no Qase', async () => { const x = await chamar(() => api.servicoConsultar(e.id, 'qase', 'resultados', { limite: 100 }, String(r.runIdRemoto))); if (x) avisar('O Qase retornou ' + x.dados.length + ' resultado(s) para a run ' + r.runIdRemoto + '.'); }, 'run-conferir-' + r.id),
      botao('Preparar bugs das falhas', async () => { const x = await chamar(() => api.runBugs(r.id)); if (x) { avisar(x.length + ' rascunho(s) de bug em Testes > Propostas.'); } }), botao('Encerrar run no Qase…', async () => { const x = await executarOperacao(e, 'qase.completar_run', { runId: r.runIdRemoto }); void x; }, 'run-completar-' + r.id)),
    manual, h('div', { class: 'agenda-acoes' }, h('label', {}, 'Política de publicação agendada (dias)', dias), h('label', {}, 'Máximo de publicações', usos), botao('Aprovar política de publicação agendada…', async () => { const x = await chamar(() => api.runPolitica(e.id, r.runIdRemoto, Number(dias.value), Number(usos.value))); if (x && !x.canceled) avisar('Política registrada para a run ' + r.runIdRemoto + '.'); }, 'run-politica-' + r.id))),
    h('p', { class: 'suave' }, 'Para repetir sozinho: em Agendamentos, crie uma rotina "Run do Qase". Sem política, os resultados ficam locais.'));
}

// ---------------- Vínculos ----------------
abas.vinculos = async (el) => {
  el.append(h('h1', {}, 'Vínculos'));
  const e = estado.espaco; if (!e) return el.append(faltaEspaco()); const m = await chamar(() => api.vinculosMapa(e.id)); if (!m) return;
  const origemTxt = { DECLARADO_PELO_USUARIO: 'declarado por você', REGISTRADO_PELO_PRUMO: 'registrado pelo Prumo', OBSERVADO: 'observado em execução' }; const nome = (id) => m.nos.find(n => n.id === id)?.rotulo || id;
  el.append(h('div', { class: 'nota', id: 'vinc-aviso' }, m.aviso), h('h2', {}, 'Declarar automação de um caso'), h('p', { class: 'suave' }, 'Cenário → automação (capability ou capability#cenário).'));
  const caso = campoPlataforma('ID do caso no Qase', { id: 'vinc-caso', type: 'number' }); const cap = campoPlataforma('Capability ou capability#cenário', { id: 'vinc-cap', maxlength: 100 }); const motivo = campoPlataforma('Justificativa', { id: 'vinc-just', maxlength: 500, value: 'Declarado pela pessoa' });
  el.append(h('div', { class: 'formulario' }, caso.no, cap.no, motivo.no, botao('Declarar vínculo', async () => { const qv = e.vinculos.find(v => v.servico === 'qase'); if (!qv) { avisar('Vincule o Qase primeiro.', true); return; } const r = await chamar(() => api.espacoAssociar(e.id, { de: { tipo: 'qase', id: String(caso.input.value), vinculoId: qv.id, origem: qv.recurso.chave }, para: { tipo: 'automacao', id: cap.input.value.trim(), origem: 'qa.project.json' }, justificativa: motivo.input.value })); if (r) { avisar('Vínculo declarado.'); mostrar('vinculos'); } }, 'vinc-salvar')));
  el.append(h('h2', {}, 'Relações'), m.arestas.length ? h('div', { class: 'rolagem' }, h('table', { id: 'vinc-tabela' }, h('thead', {}, h('tr', {}, ['De', 'Relação', 'Para', 'Origem'].map(t => h('th', {}, t)))), h('tbody', {}, m.arestas.map(a => h('tr', {}, h('td', {}, nome(a.de)), h('td', {}, a.tipo + (a.nota ? ' · ' + a.nota : '')), h('td', {}, nome(a.para)), h('td', {}, origemTxt[a.origem])))))) : h('div', { class: 'vazio' }, 'Nenhuma relação ainda.'));
  el.append(h('h2', {}, 'Lacunas de cadastro'), m.lacunas.length ? h('ul', { id: 'vinc-lacunas' }, m.lacunas.map(l => h('li', {}, l.mensagem))) : h('p', { class: 'suave' }, 'Nenhuma lacuna de cadastro encontrada.'));
  el.append(h('h2', {}, 'Operações externas recentes'), m.operacoesRecentes.length ? h('ul', { id: 'vinc-operacoes' }, m.operacoesRecentes.map(o => h('li', {}, seloOp(o.estado), ' ', o.resumo, ' · ', hora(o.em), o.remoto?.chave ? ' · ' + o.remoto.chave : ''))) : h('p', { class: 'suave' }, 'Nenhuma operação externa registrada.'));
};

// ---------------- Automações: GitHub ----------------
const automacoesBase = abas.automacoes;
abas.automacoes = async (el) => {
  await automacoesBase(el); const e = semProjetoServico(el, 'github'); if (!e) return; const perm = await escritaDoProjeto(e); const on = !!perm.github; const saida = h('div', { id: 'gh-saida' });
  const ciCx = h('div', { id: 'gh-ci' }); el.append(h('h2', {}, 'Execuções de CI (GitHub Actions)'), botao('Carregar execuções', async () => {
    const r = await chamar(() => api.servicoConsultar(e.id, 'github', 'workflows', { limite: 15 })); if (!r) return;
    const concl = (c) => selo(c === 'success' ? 'PASS' : c === 'failure' ? 'FAIL' : (c || 'NOT_RUN').toUpperCase());
    const jobs = async (w) => { const x = await chamar(() => api.servicoConsultar(e.id, 'github', 'jobs', {}, String(w.id))); if (!x) return; ciCx.append(h('div', { class: 'nota' }, x.dados.map(y => h('p', {}, y.nome + ' · ' + y.estado + ' · ' + (y.conclusao || '—') + ' · ' + y.etapas.filter(s2 => s2.conclusao === 'failure').map(s2 => 'falhou: ' + s2.nome).join(', '))))); };
    const linha = (w) => h('tr', {}, h('td', {}, String(w.numero ?? w.id)), h('td', {}, w.nome || ''), h('td', {}, w.branch || ''), h('td', {}, w.estado || ''), h('td', {}, concl(w.conclusao)), h('td', {}, botao('Jobs', () => jobs(w))));
    const tabela = h('div', { class: 'rolagem' }, h('table', { id: 'gh-ci-tabela' }, h('thead', {}, h('tr', {}, ['#', 'Workflow', 'Branch', 'Estado', 'Conclusão', ''].map(t => h('th', {}, t)))), h('tbody', {}, r.dados.map(linha))));
    ciCx.replaceChildren(r.dados.length ? tabela : h('div', { class: 'vazio' }, 'Nenhuma execução retornada.'),
      h('p', { class: 'suave' }, 'Logs e artefatos: use o link da execução no GitHub.'));
  }, 'gh-ci-carregar'), ciCx);
  const branch = campoPlataforma('Branch de trabalho (prumo/...)', { id: 'gh-branch', value: 'prumo/novos-testes', maxlength: 80 }); const caminho = campoPlataforma('Arquivo de teste (ex.: tests/login.spec.ts)', { id: 'gh-caminho', maxlength: 300 }); const conteudo = campoTexto('Conteúdo do arquivo', 'gh-conteudo', { rows: 8, maxlength: 262144 }); const msg = campoPlataforma('Mensagem do commit', { id: 'gh-msg', maxlength: 200, value: 'test: propor cenário' }); const pr = campoPlataforma('Título do Pull Request', { id: 'gh-pr', maxlength: 200 });
  el.append(h('h2', {}, 'Propor testes no repositório'), h('p', { class: 'suave' }, 'Escreve só em prumo/…, nunca na principal. PR nasce como rascunho.'), avisoEscrita('github', on), h('div', { class: 'formulario' }, branch.no,
    botao('Criar branch…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'github.criar_branch', { nome: branch.input.value })) || ''); }, 'gh-criar-branch'), caminho.no, conteudo.no, msg.no,
    botao('Gravar arquivo no branch…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'github.commitar_arquivo', { branch: branch.input.value, caminho: caminho.input.value, conteudo: conteudo.input.value, mensagem: msg.input.value })) || ''); }, 'gh-commit'), pr.no,
    botao('Abrir Pull Request (rascunho)…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'github.abrir_pr', { branch: branch.input.value, titulo: pr.input.value, corpo: 'Proposto pelo Prumo QA para revisão.' })) || ''); }, 'gh-pr-abrir'), saida));
};

// ---------------- Agentes ----------------
const agentesLegado = abas.agentes;
abas.agentes = async (el) => {
  el.append(h('h1', {}, 'Agentes'));
  const e = estado.espaco; if (e) {
    const s = await chamar(() => api.agentesEstado(e.id)); if (s) {
      const esp = new Set(s.configuracao.especializacoes); const pol = { ...s.configuracao.politicas };
      el.append(h('div', { class: 'nota', id: 'ag-aviso' }, s.configuracao.padrao ? 'Configuração padrão: todas as especializações habilitadas.' : 'Configuração personalizada por você.', ' Propostas feitas por IA neste projeto: ', h('strong', {}, String(s.propostasIA)), '.'),
        h('h2', {}, 'Especializações'), h('div', { id: 'ag-especializacoes' }, s.especializacoes.map(x => h('label', { class: 'opcao linha', title: x.skill }, h('input', { type: 'checkbox', 'data-esp': x.id, checked: esp.has(x.id), onchange: (ev) => (ev.target.checked ? esp.add(x.id) : esp.delete(x.id)) }), x.rotulo + ' ', h('span', { class: 'suave' }, '(' + x.skill + ')')))),
        h('h2', {}, 'Capacidades'), h('div', { class: 'rolagem' }, h('table', { id: 'ag-matriz' }, h('thead', {}, h('tr', {}, ['Capacidade', 'Estado', 'Política', 'Por quê'].map(t => h('th', {}, t)))), h('tbody', {}, s.matriz.map(c => h('tr', { 'data-cap': c.id }, h('td', {}, c.rotulo, c.ferramenta ? h('div', { class: 'suave' }, c.ferramenta) : null), h('td', {}, selo(c.estado)),
          h('td', {}, c.editavel.length ? h('select', { 'data-pol': c.id, onchange: (ev) => { pol[c.id] = ev.target.value; } }, c.editavel.map(v => h('option', { value: v, selected: (pol[c.id] ?? c.editavel[0]) === v }, v === 'BLOQUEADO' ? 'Bloquear' : v === 'EXIGE_AUTORIZACAO' ? 'Permitir com autorização' : 'Permitir'))) : 'Somente pessoa'), h('td', {}, c.motivo)))))),
        botao('Salvar permissões…', async () => { const r = await chamar(() => api.agentesSalvar(e.id, [...esp], pol)); if (r && !r.canceled) { avisar('Permissões salvas.'); mostrar('agentes'); } }, 'ag-salvar'), h('h2', {}, 'Conexão com Claude e Codex'));
    }
  } else el.append(h('div', { class: 'nota' }, 'Selecione um projeto para configurar permissões.'));
  await agentesLegado(el);
};

// ---------------- Conexões: escrita externa ----------------
const conexoesBase = abas.conexoes;
abas.conexoes = async (el) => {
  await conexoesBase(el); const e = estado.espaco; if (!e) return; const perm = await escritaDoProjeto(e);
  el.append(h('h2', {}, 'Escrita externa neste projeto'), h('p', { class: 'suave' }, 'Escrita desligada por padrão. Cada operação pede confirmação.'),
    h('div', { id: 'escrita-servicos' }, ['jira', 'qase', 'github'].map(sv => h('div', { class: 'nota', 'data-escrita': sv }, h('strong', {}, nomeServ[sv]), ' ', perm[sv] ? selo('VALIDO') : null, ' ', perm[sv] ? 'escrita habilitada' : 'somente leitura', ' ', botao(perm[sv] ? 'Desabilitar escrita' : 'Habilitar escrita…', async () => { const r = await chamar(() => api.escritaHabilitar(e.id, sv, !perm[sv])); if (r && !r.canceled) mostrar('conexoes'); }, 'escrita-' + sv)))));
  const ops = await chamar(() => api.operacoes(e.id, 15)); if (ops?.length) el.append(h('h2', {}, 'Operações externas recentes'), h('ul', { id: 'conexoes-operacoes' }, ops.map(o => h('li', {}, seloOp(o.estado), ' ', o.resumo, ' · ', hora(o.atualizadoEm)))));
};

// ---------------- Métricas: módulos escolhíveis, três visuais, escolha lembrada neste computador ----------------
const lerPrefMet = () => { try { return JSON.parse(localStorage.getItem('metricas-modulos')) || {}; } catch { return {}; } };
const gravarPrefMet = (p) => { try { localStorage.setItem('metricas-modulos', JSON.stringify(p)); } catch { /* sem armazenamento */ } };
const corVar = (c) => getComputedStyle(document.documentElement).getPropertyValue(c).trim() || '#888';
const celula = (n, rot) => h('div', {}, h('b', {}, String(n)), h('span', {}, rot));
function visualItens(itens, visual) {
  const total = itens.reduce((s, i) => s + (i.n || 0), 0); const max = Math.max(1, ...itens.map(i => i.n || 0));
  if (visual === 'numeros') return h('div', { class: 'grade' }, itens.map(i => celula(i.n, i.rot)));
  if (visual === 'barras') return h('div', { class: 'barras' }, itens.map(i => { const p = h('div', { class: 'preenche' }); if (i.cor) p.style.background = corVar(i.cor); requestAnimationFrame(() => { p.style.width = Math.round(((i.n || 0) / max) * 100) + '%'; }); p.style.width = '0%';
    return h('div', { class: 'linha-b' }, h('span', {}, i.rot), h('div', { class: 'trilho' }, p), h('span', { class: 'num' }, String(i.n))); }));
  if (!total) return h('p', { class: 'suave' }, 'Sem dados para mostrar.');
  const cores = itens.map(i => corVar(i.cor || '--acento')); let acc = 0;
  const fatias = itens.map((i, k) => { const ini = acc; acc += ((i.n || 0) / total) * 360; return cores[k] + ' ' + ini + 'deg ' + acc + 'deg'; });
  const rosca = h('div', { class: 'rosca', role: 'img', 'aria-label': itens.map(i => i.rot + ': ' + i.n).join(', ') }); rosca.style.background = 'conic-gradient(' + fatias.join(', ') + ')';
  return h('div', { class: 'rosca-caixa' }, rosca, h('div', { class: 'legenda' }, itens.map((i, k) => h('span', {}, (() => { const d = h('i'); d.style.background = cores[k]; return d; })(), i.rot + ' · ' + i.n))));
}
abas.metricas = async (el) => {
  el.append(h('h1', {}, 'Métricas')); if (!estado.root) return el.append(semProjeto());
  const v = await chamar(() => api.visao(estado.root)); if (!v) return; const m = v.metrics;
  const ag = await chamar(() => api.metricasExecucoes(estado.espaco?.id)); const ops = estado.espaco ? await chamar(() => api.operacoes(estado.espaco.id, 50)) : null;
  if (!m.complete) el.append(h('div', { class: 'nota' }, 'Histórico parcial: ' + m.problems.length + ' registro(s) inválido(s) ou truncado(s) foram excluídos; os números abaixo são parciais.'));
  const contaOps = (s) => (ops || []).filter(o => o.estado === s).length;
  const defs = [
    { id: 'atividade', rotulo: 'Atividade', visuais: ['numeros', 'barras'], itens: () => [{ n: m.totalOperations, rot: 'interações registradas' }, { n: m.mcpCalls, rot: 'chamadas via MCP' }, { n: m.coverageReviews, rot: 'revisões de cobertura' }, { n: m.contextAnalyses, rot: 'análises de contexto' }, { n: m.findings, rot: 'achados' }, { n: m.recommendations, rot: 'recomendações' }, { n: m.gaps, rot: 'lacunas identificadas' }, { n: m.candidateRedundancies, rot: 'redundâncias candidatas' }, { n: m.executionsRequested, rot: 'execuções solicitadas' }, { n: m.executions.PASS, rot: 'PASS' }, { n: m.executions.FAIL, rot: 'FAIL' }, { n: m.executions.BLOCKED, rot: 'BLOCKED' }, { n: m.executions.NOT_RUN, rot: 'NOT_RUN' }, { n: m.errors, rot: 'erros' }, { n: m.unfinished, rot: 'sem término observado' }] },
    { id: 'resultados', rotulo: 'Resultados', visuais: ['numeros', 'barras', 'rosca'], itens: () => [{ n: m.executions.PASS, rot: 'PASS', cor: '--ok' }, { n: m.executions.FAIL, rot: 'FAIL', cor: '--falha' }, { n: m.executions.BLOCKED, rot: 'BLOCKED', cor: '--aviso' }, { n: m.executions.NOT_RUN, rot: 'NOT_RUN', cor: '--neutro' }] },
    { id: 'agenda', rotulo: 'Agenda', visuais: ['numeros', 'barras'], itens: () => ag ? [{ n: ag.execucoes, rot: 'execuções' }, { n: ag.pass, rot: 'PASS', cor: '--ok' }, { n: ag.fail, rot: 'FAIL', cor: '--falha' }, { n: ag.rotinasAtivas, rot: 'rotinas ativas' }, { n: ag.falhasDeAgendamento, rot: 'falhas de agendamento', cor: '--falha' }, { n: ag.comentariosPendentes, rot: 'comentários pendentes', cor: '--aviso' }] : [] },
    { id: 'externas', rotulo: 'Operações externas', visuais: ['numeros', 'barras', 'rosca'], itens: () => ops ? [{ n: contaOps('CONFIRMADA'), rot: 'confirmadas', cor: '--ok' }, { n: contaOps('FALHA'), rot: 'com falha', cor: '--falha' }, { n: contaOps('BLOQUEADA'), rot: 'bloqueadas', cor: '--aviso' }, { n: contaOps('ENVIADA'), rot: 'sem confirmação', cor: '--neutro' }] : [] }
  ];
  const pref = lerPrefMet(); const ativos = new Set(pref.ativos || ['atividade', 'resultados']); const visual = { ...(pref.visual || {}) };
  const corpo = h('div', { id: 'met-corpo' });
  const salvar = () => gravarPrefMet({ ativos: [...ativos], visual });
  const desenhar = () => corpo.replaceChildren(...defs.filter(d => ativos.has(d.id)).map(d => {
    const atual = d.visuais.includes(visual[d.id]) ? visual[d.id] : 'numeros'; const nomes = { numeros: 'Números', barras: 'Barras', rosca: 'Rosca' };
    const seg = h('div', { class: 'segmentos', role: 'group', 'aria-label': 'Visual' }, d.visuais.map(k => h('button', { type: 'button', 'aria-pressed': String(k === atual), onclick: () => { visual[d.id] = k; salvar(); desenhar(); } }, nomes[k])));
    const itens = d.itens();
    return h('section', { class: 'modulo', 'data-modulo': d.id }, h('div', { class: 'modulo-topo' }, h('h2', {}, d.rotulo), seg), itens.length ? visualItens(itens, atual) : h('p', { class: 'suave' }, 'Selecione um projeto para ver estes dados.'));
  }));
  el.append(h('div', { class: 'met-barra', role: 'group', 'aria-label': 'Módulos' }, defs.map(d => h('label', { class: 'chip-modulo' }, h('input', { type: 'checkbox', checked: ativos.has(d.id), onchange: (e) => { if (e.target.checked) ativos.add(d.id); else ativos.delete(d.id); salvar(); desenhar(); } }), d.rotulo))), corpo);
  desenhar();
  el.append(h('details', { class: 'modulo' }, h('summary', {}, 'Detalhes'),
    h('p', {}, 'Última atividade: ', h('strong', {}, hora(m.lastActivity)), ' · Duração média: ', h('strong', {}, ms(m.averageDurationMs))),
    h('p', { class: 'suave' }, 'Tokens e custos: ' + m.providerMetrics + '. Alterações aplicadas pela IA: não observadas pelo Prumo.'),
    h('p', { class: 'suave' }, 'Última chamada MCP de: ' + (v.lastMcpClient || 'nenhum cliente') + ' (identidade declarada pelo cliente). ' + v.connection),
    h('p', { class: 'suave' }, 'Dados em: ', h('code', {}, v.directory))));
};

// ---------------- Testes: catálogo do repositório + casos, planos e automação em subabas ----------------
const nomesTipo = { unitario: 'Unitário', integracao: 'Integração', funcional: 'Funcional', regressao: 'Regressão', smoke: 'Smoke', desempenho: 'Desempenho', acessibilidade: 'Acessibilidade', indefinido: 'Indefinido' };
const barraSub = (pai, itens, atual) => h('div', { class: 'segmentos sub', role: 'group', 'aria-label': 'Seção' }, itens.map(([k, t]) => h('button', { type: 'button', 'data-sub': k, 'aria-pressed': String(k === atual), onclick: () => { (estado.sub ||= {})[pai] = k; mostrar(pai); } }, t)));
const semTitulo = (no) => { no.querySelector('h1')?.remove(); return no; };
const abaCasosQase = abas.testes; const abaRuns = abas.runs; const abaAutomacao = abas.automacoes; const abaVinculos = abas.vinculos; const abaRastreio = abas.rastreabilidade;
async function catalogoRepo(el) {
  const e = estado.espaco; if (!e) return el.append(faltaEspaco());
  const r = await chamar(() => api.testesCatalogo(e.id)); if (!r) return;
  if (r.semPasta) return el.append(h('div', { class: 'vazio', id: 'cat-sem-pasta' }, 'Vincule a pasta do repositório para ler os testes.'), botao('Vincular pasta…', async () => { const x = await chamar(() => api.espacoPasta(e.id)); if (x && !x.canceled) mostrar('testes'); }, 'cat-vincular'));
  const c = r.catalogo; const pref = (() => { try { return JSON.parse(localStorage.getItem('catalogo-filtro')) || {}; } catch { return {}; } })();
  const ativos = new Set(pref.tipos || []); const busca = h('input', { id: 'cat-busca', type: 'search', placeholder: 'Buscar feature ou teste', 'aria-label': 'Buscar feature ou teste', value: pref.busca || '' }); const lista = h('div', { id: 'cat-lista' });
  const salvar = () => { try { localStorage.setItem('catalogo-filtro', JSON.stringify({ tipos: [...ativos], busca: busca.value })); } catch { /* sem armazenamento */ } };
  const chips = h('div', { class: 'met-barra', id: 'cat-tipos', role: 'group', 'aria-label': 'Tipo' }, Object.keys(nomesTipo).filter(t => c.porTipo[t]).map(t => h('label', { class: 'chip-modulo t-' + t }, h('input', { type: 'checkbox', 'data-tipo': t, checked: ativos.has(t), onchange: (ev) => { if (ev.target.checked) ativos.add(t); else ativos.delete(t); salvar(); desenhar(); } }), nomesTipo[t] + ' · ' + c.porTipo[t])));
  const desenhar = () => {
    const q = busca.value.trim().toLowerCase(); let visiveis = 0;
    const nos = c.features.map(f => { const testes = f.testes.filter(t => (!ativos.size || ativos.has(t.tipo)) && (!q || (f.nome + ' ' + t.titulo).toLowerCase().includes(q))); if (!testes.length) return null; visiveis += testes.length;
      return h('details', { class: 'feature-testes', 'data-feature': f.nome }, h('summary', {}, h('strong', {}, f.nome), ' ', h('span', { class: 'suave' }, f.arquivo + ' · ' + testes.length), ' ', f.tipos.map(t => h('span', { class: 'tipo t-' + t }, nomesTipo[t]))),
        h('ul', { class: 'testes-lista' }, testes.map(t => h('li', { 'data-tipo': t.tipo }, h('span', { class: 'tipo t-' + t.tipo, title: t.motivo + ' · confiança ' + t.confianca }, nomesTipo[t.tipo]), ' ', t.titulo, ' ', h('span', { class: 'suave' }, 'L' + t.linha + ' · ' + t.confianca),
          t.passos.length ? h('ol', { class: 'passos-lista' }, t.passos.map(p => h('li', {}, p))) : null))));
    }).filter(Boolean);
    lista.replaceChildren(...(nos.length ? nos : [h('div', { class: 'vazio' }, 'Nenhum teste para este filtro.')]));
    $('#cat-contagem') && ($('#cat-contagem').textContent = visiveis + ' / ' + c.testes);
  };
  busca.addEventListener('input', () => { salvar(); desenhar(); });
  el.append(h('div', { class: 'cat-resumo', id: 'cat-resumo' }, h('div', {}, h('b', {}, String(c.testes)), h('span', {}, 'testes')), h('div', {}, h('b', {}, String(c.features.length)), h('span', {}, 'features')), h('div', {}, h('b', { id: 'cat-contagem' }, c.testes + ' / ' + c.testes), h('span', {}, 'mostrando'))),
    c.testes ? h('div', {}, chips, busca) : h('div', { class: 'vazio' }, 'Nenhum arquivo de teste encontrado na pasta vinculada.'), lista,
    c.truncado ? h('div', { class: 'nota' }, 'Leitura limitada: o repositório tem mais arquivos de teste do que o Prumo lê de uma vez.') : '',
    h('p', { class: 'suave', id: 'cat-aviso' }, c.aviso));
  desenhar();
}
abas.testes = async (el) => {
  el.append(h('h1', {}, 'Testes'));
  const e = estado.espaco; const temQase = !!e?.vinculos.some(v => v.servico === 'qase');
  const itens = [['catalogo', 'Catálogo'], ...(temQase ? [['casos', 'Casos e propostas']] : []), ['runs', 'Planos e execuções'], ['automacao', 'Automação']];
  let sub = estado.sub?.testes || 'catalogo'; if (!itens.some(([k]) => k === sub)) sub = 'catalogo';
  const corpo = h('div', { id: 'sub-conteudo' }); el.append(barraSub('testes', itens, sub), corpo);
  if (sub === 'catalogo') await catalogoRepo(corpo); else if (sub === 'casos') semTitulo(await (async () => { await abaCasosQase(corpo); return corpo; })()); else if (sub === 'runs') await abaRuns(corpo); else await abaAutomacao(corpo);
  semTitulo(corpo);
};
abas.rastreabilidade = async (el) => {
  el.append(h('h1', {}, 'Rastreabilidade')); const sub = estado.sub?.rastreabilidade || 'mapa';
  const corpo = h('div', { id: 'sub-conteudo' }); el.append(barraSub('rastreabilidade', [['mapa', 'Mapa'], ['vinculos', 'Vínculos']], sub), corpo);
  if (sub === 'vinculos') await abaVinculos(corpo); else await abaRastreio(corpo);
  semTitulo(corpo);
};
