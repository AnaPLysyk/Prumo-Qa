'use strict';
/** Acrescenta à tela Tickets os detalhes e operações autorizadas do Jira. */
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

