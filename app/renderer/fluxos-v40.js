'use strict';
// Grupo B (v40): Tickets, Testes e Rastreabilidade com o Design System. Apresentação apenas: cada leitura e escrita usa
// os canais IPC existentes (servicoConsultar, operacaoExecutar, propostas, runs, espacoAssociar). Nenhuma relação é
// deduzida por nome; escrita externa continua desligada por padrão e confirmada pelo processo principal.
(() => {
  const vinc = (e, s) => e?.vinculos.find((v) => v.servico === s) || null;
  const memoria = (tela, id) => ((estado.ds ||= {})[tela + ':' + id] ||= {});
  const quando = (iso) => (iso ? hora(iso) : '—');
  const semProjetoDS = (titulo) => [DS.cabecalho({ titulo }), DS.estadoTela('vazio', 'Nenhum projeto selecionado', 'Selecione ou crie um projeto para continuar.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))])];
  const relacoesDe = (e, tipos, id) => (e?.relacoes || []).filter((r) => [r.de, r.para].some((x) => tipos.includes(x.tipo) && String(x.id) === String(id)));
  const outroLado = (r, tipos, id) => ([r.de, r.para].find((x) => !(tipos.includes(x.tipo) && String(x.id) === String(id))) || r.para);
  const vigente = (e, ref) => !ref.vinculoId || e.vinculos.some((v) => v.id === ref.vinculoId);
  const servicoDoTipo = { jira: 'jira', 'jira-bug': 'jira', qase: 'qase', 'qase-run': 'qase', 'qase-defeito': 'qase', github: 'github', 'github-pr': 'github', 'github-commit': 'github', automacao: 'local', evidencia: 'local', execucao: 'local', run: 'prumo', contexto: 'prumo', pasta: 'local', projeto: 'prumo', servico: 'prumo' };
  const escritaDesligada = (servico) => DS.notaPermissao(tr('Escrita no {s} desligada. Habilite em Conexões.', { s: DS.nomesServico[servico] }));
  const atualizarEspaco = async (e) => { const r = await api.espacoObter(e.id); if (r.ok) { estado.espaco = r.data; return r.data; } return e; };
  const resultadoOp = (destino, r) => { if (r && destino?.isConnected) destino.append(painelResultado(r)); return r; };
  const tomStatusJira = (s) => ({ done: 'ok', indeterminate: 'info', new: null }[s?.statusCategory?.key] ?? null);

  /** Nós clicáveis da rastreabilidade e das relações dentro dos modais. */
  function noRef(e, ref, rotulo) {
    const servico = servicoDoTipo[ref.tipo] || 'prumo'; const ok = vigente(e, ref);
    const abrir = { jira: () => abrirTicket(e, ref.id), 'jira-bug': () => abrirTicket(e, ref.id), qase: () => abrirCaso(e, ref.id), 'qase-defeito': () => abrirDefeito(e, ref.id) }[ref.tipo];
    if (!abrir) return h('span', { class: 'ds-no', 'data-servico': servico }, h('i'), rotulo || ref.id);
    const b = h('button', { type: 'button', class: 'ds-no', 'data-servico': servico, 'aria-label': tr('Abrir {t} {id}', { t: ref.tipo, id: ref.id }), disabled: !ok, title: ok ? null : tr('Vínculo original removido; consulta não autorizada ao vínculo atual.') }, h('i'), rotulo || ref.id);
    if (ok) b.addEventListener('click', abrir);
    return b;
  }
  function blocoRelacoes(e, tipos, id) {
    const rels = relacoesDe(e, tipos, id);
    return DS.bloco('Vínculos no Prumo', rels.length ? h('div', { class: 'ds-celula-nos' }, rels.map((r) => { const o = outroLado(r, tipos, id); return noRef(e, o, ({ qase: 'Caso ', 'qase-defeito': 'Defeito ', automacao: '', 'jira-bug': 'Bug ' }[o.tipo] ?? '') + o.id); }))
      : h('p', { class: 'suave' }, tr('Nenhum vínculo declarado.')), DS.link('Ver na rastreabilidade', () => { DS.fecharModal(); (estado.ds ||= {}).rastroBusca = String(id); mostrar('rastreabilidade'); }));
  }

  // ======================= Tickets =======================
  async function tiposJira(e) {
    const m = memoria('jira-meta', e.id);
    if (!m.tipos) { const r = await api.servicoConsultar(e.id, 'jira', 'metadados'); m.tipos = r.ok ? (r.data.dados || []).filter((t) => !t.subtarefa) : []; m.erro = r.ok ? null : r.error; }
    return m;
  }
  abas.tickets = async (el) => {
    const e = estado.espaco; if (!e) return el.append(...semProjetoDS('Tickets'));
    const vj = vinc(e, 'jira'), vq = vinc(e, 'qase');
    if (!vj && !vq) return el.append(DS.cabecalho({ titulo: 'Tickets' }), DS.estadoTela('vazio', 'Nenhuma fonte de tickets vinculada', tr('Vincule um projeto Jira ou Qase a {p} em Conexões.', { p: e.nome }), [DS.acao('Abrir Conexões', () => mostrar('conexoes'))]));
    const perm = await escritaDoProjeto(e); const escJira = !!perm.jira;
    const mem = memoria('tickets', e.id); const f = (mem.filtros ||= { q: '', origem: '', tipo: '', status: '', desde: '', ate: '' });
    const fontesCab = [vj && DS.origem('jira', 'Jira · ' + vj.recurso.chave), vq && DS.origem('qase', 'Qase · ' + vq.recurso.chave),
      vj && !escJira ? h('span', { class: 'ds-chip', 'data-escrita-desligada': 'jira', title: tr('Escrita no Jira desligada. Habilite em Conexões.') }, tr('Jira somente leitura')) : null].filter(Boolean);
    const contagem = h('span');
    const cab = DS.cabecalho({ titulo: 'Tickets', contagem: 0, idContagem: 'tk-contagem', descricao: [h('span', { class: 'ds-chips' }, fontesCab)],
      acoes: [vj && DS.acao('Consulta avançada', () => avancada(e), { id: 'tk-avancada', icone: 'filtro' }), vj && DS.acao('Novo ticket', () => abrirCriar(e, {}), { id: 'tk-novo', primaria: true, icone: 'mais' })] });
    void contagem;
    const q = DS.busca({ id: 'tk-q', placeholder: 'Buscar por chave ou texto', valor: f.q, aoEnter: () => buscar() });
    const origem = vj && vq ? DS.selecao({ id: 'tk-origem', rotulo: 'Origem', opcoes: [['', 'Todas as origens'], ['jira', 'Jira'], ['qase', 'Defeitos Qase']], valor: f.origem, aoMudar: () => { tipo.disabled = origem.value === 'qase'; } }) : null;
    const tipo = DS.selecao({ id: 'tk-tipo', rotulo: 'Tipo', opcoes: [['', 'Todos os tipos']], valor: '' });
    const status = h('input', { id: 'tk-status', placeholder: tr('Status'), 'aria-label': tr('Status'), list: 'tk-status-opcoes', maxlength: 60, value: f.status, autocomplete: 'off' });
    const sugestoes = h('datalist', { id: 'tk-status-opcoes' });
    const desde = h('input', { id: 'tk-desde', type: 'date', 'aria-label': tr('Atualizado desde'), value: f.desde }); const ate = h('input', { id: 'tk-ate', type: 'date', 'aria-label': tr('Atualizado até'), value: f.ate });
    for (const c of [status, desde, ate]) c.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); buscar(); } });
    const fontes = h('div', { class: 'ds-fontes', id: 'tk-fontes', 'aria-live': 'polite' }); const lista = h('div', { id: 'tk-lista' });
    el.append(cab, DS.barra(q.no, origem, vj ? tipo : null, status, sugestoes, h('span', { class: 'ds-periodo' }, tr('Atualizado'), desde, tr('até'), ate), DS.acao('Buscar', () => buscar(), { id: 'tk-buscar', icone: 'busca' })), fontes, lista);
    if (origem) tipo.disabled = origem.value === 'qase';
    if (vj) tiposJira(e).then((m) => { for (const t of m.tipos) tipo.append(h('option', { value: t.nome, selected: t.nome === f.tipo }, t.nome)); });

    const lerFiltros = () => { f.q = q.input.value.trim(); f.origem = origem?.value || ''; f.tipo = tipo.value; f.status = status.value.trim(); f.desde = desde.value; f.ate = ate.value; };
    async function consultarJira(pagina) {
      const fj = {}; for (const k of ['q', 'tipo', 'status', 'desde', 'ate']) if (f[k]) fj[k] = f[k];
      const r = await api.servicoConsultar(e.id, 'jira', 'tickets', pagina, undefined, fj);
      if (!r.ok) { avisar(r.error, true); return { erro: r.error }; }
      return { itens: r.data.dados || [], proxima: r.data.proxima, em: r.data.consultadoEm, origem: r.data.origem };
    }
    async function consultarQase(offset) {
      const r = await api.servicoConsultar(e.id, 'qase', 'defeitos', { offset, limite: 25 });
      if (!r.ok) { avisar(r.error, true); return { erro: r.error }; }
      return { itens: r.data.dados || [], proxima: r.data.proxima, em: r.data.consultadoEm, origem: r.data.origem };
    }
    async function buscar() {
      if (desde.value && ate.value && desde.value > ate.value) { avisar(tr('A data inicial deve ser anterior à data final.'), true); return; }
      lerFiltros(); const versao = (mem.versao = (mem.versao || 0) + 1);
      lista.replaceChildren(DS.esqueleto(6)); lista.setAttribute('aria-busy', 'true'); fontes.replaceChildren(h('span', { role: 'status' }, h('span', { class: 'ds-giro' }), tr('Consultando…')));
      const [jira, qase] = await Promise.all([vj && f.origem !== 'qase' ? consultarJira({ offset: 0, limite: 25 }) : null, vq && f.origem !== 'jira' ? consultarQase(0) : null]);
      if (versao !== mem.versao) return;
      mem.jira = jira; mem.qase = qase; mem.carregado = true; desenhar();
    }
    async function maisJira() { const r = await consultarJira(typeof mem.jira.proxima === 'string' ? { cursor: mem.jira.proxima, limite: 25 } : { offset: mem.jira.proxima, limite: 25 }); if (r.erro) return; mem.jira = { ...r, itens: mem.jira.itens.concat(r.itens) }; desenhar(); }
    async function maisQase() { const r = await consultarQase(mem.qase.proxima); if (r.erro) return; mem.qase = { ...r, itens: mem.qase.itens.concat(r.itens) }; desenhar(); }
    function linhasTabela() {
      const L = []; const st = f.status.toLowerCase(); const qq = f.q.toLowerCase();
      for (const i of mem.jira?.itens || []) { const x = i.fields || {}; const n = relacoesDe(e, ['jira', 'jira-bug'], i.key).length;
        L.push({ ordem: Date.parse(x.updated || 0) || 0, attrs: { 'data-ticket': i.key, 'data-origem': 'jira' }, abrir: () => abrirTicket(e, i.key), rotuloAcessivel: null,
          celulas: [DS.origem('jira'), { no: i.key, classe: 'ds-id' }, h('span', { class: 'ds-resumo-texto' }, x.summary || '—'), x.issuetype?.name ? DS.chip(x.issuetype.name) : '—', x.status?.name ? DS.chip(x.status.name, tomStatusJira(x.status)) : '—', x.priority?.name || '—', vj.recurso.chave, { no: quando(x.updated), classe: 'ds-nowrap' }, n ? DS.chip(tr('{n} vínculo(s)', { n }), 'info') : '—'] }); }
      for (const d of mem.qase?.itens || []) {
        if (st && !String(d.status ?? '').toLowerCase().includes(st)) continue; if (qq && !(String(d.id) + ' ' + (d.title || '')).toLowerCase().includes(qq)) continue;
        const n = relacoesDe(e, ['qase-defeito'], d.id).length;
        L.push({ ordem: Date.parse(d.updated_at || 0) || 0, attrs: { 'data-defeito': String(d.id), 'data-origem': 'qase' }, abrir: () => abrirDefeito(e, d.id), rotuloAcessivel: null,
          celulas: [DS.origem('qase'), { no: vq.recurso.chave + '-' + d.id, classe: 'ds-id' }, h('span', { class: 'ds-resumo-texto' }, d.title || '—'), DS.chip('Defeito'), d.status != null ? DS.chip(String(d.status), d.status === 'resolved' ? 'ok' : d.status === 'open' ? 'aviso' : null) : '—', d.severity != null ? String(d.severity) : '—', vq.recurso.chave, { no: quando(d.updated_at), classe: 'ds-nowrap' }, n ? DS.chip(tr('{n} vínculo(s)', { n }), 'info') : '—'] });
      }
      return L.sort((a, b) => b.ordem - a.ordem);
    }
    function linhaFonte(servico, r, mais) {
      if (!r) return null; const nome = servico === 'jira' ? 'Jira' : 'Qase';
      if (r.erro) return h('span', { role: 'status', 'data-fonte': servico }, DS.origem(servico, nome), ' ', DS.chip(r.erro, 'falha'));
      return h('span', { role: 'status', 'data-fonte': servico }, DS.origem(servico, nome), tr(servico === 'jira' ? '{n} ticket(s) · consultado {q}' : '{n} defeito(s) · consultado {q}', { n: r.itens.length, q: quando(r.em) }), r.proxima !== null && r.proxima !== undefined ? DS.link('Carregar mais', mais, { id: 'tk-mais-' + servico, seta: false }) : null);
    }
    function desenhar() {
      lista.setAttribute('aria-busy', 'false');
      fontes.replaceChildren(...[linhaFonte('jira', mem.jira, maisJira), linhaFonte('qase', mem.qase, maisQase)].filter(Boolean));
      sugestoes.replaceChildren(...[...new Set((mem.jira?.itens || []).map((i) => i.fields?.status?.name).filter(Boolean))].map((s) => h('option', { value: s })));
      const L = linhasTabela(); const n = $('#tk-contagem'); if (n) n.textContent = String(L.length);
      const erros = [mem.jira?.erro, mem.qase?.erro].filter(Boolean);
      if (!L.length) { lista.replaceChildren(erros.length && erros.length === [mem.jira, mem.qase].filter(Boolean).length ? DS.estadoTela('erro', 'Não foi possível consultar as fontes', erros.join(' · '), [DS.acao('Tentar novamente', () => buscar())])
        : DS.estadoTela('vazio', 'Nenhum ticket encontrado', mem.qase && !mem.qase.erro && !mem.qase.itens.length && !mem.jira ? 'Nenhum defeito retornado pelo Qase.' : 'Ajuste os filtros ou a origem e busque novamente.')); return; }
      lista.replaceChildren(DS.tabela({ id: 'tk-tabela', colunas: ['Origem', 'ID', 'Resumo', 'Tipo', 'Status', { t: 'Prioridade', classe: 'ds-opcional' }, { t: 'Projeto', classe: 'ds-opcional' }, 'Atualização', { t: 'Vínculos', classe: 'ds-opcional' }], linhas: L }));
    }
    if (mem.carregado) desenhar(); else buscar();
  };

  async function avancada(e) {
    const caixa = h('div', { class: 'ds-avancada' }, h('p', { class: 'suave' }, tr('Consulta direta ao Jira vinculado: detalhe por chave, comentários e descoberta do campo de critérios de aceite.')));
    DS.modal('Consulta avançada · Jira', caixa, { tamanho: 'lg' }); await consultaManual(caixa, 'jira', { tickets: 'Tickets do projeto', ticket: 'Detalhe de ticket', campos: 'Descobrir campos de critérios de aceite', comentarios: 'Comentários de ticket' });
  }

  async function abrirTicket(e, chave) {
    const vj = vinc(e, 'jira'); if (!vj) { avisar(tr('Jira não vinculado a este projeto.'), true); return; }
    const carregando = DS.modal(chave, DS.carregando('Consultando o Jira…'), { tamanho: 'lg' });
    const consulta = (op, p = {}) => api.servicoConsultar(e.id, 'jira', op, p, chave);
    const [t, com, hist, anexos, trans, perm] = await Promise.all([consulta('ticket'), consulta('comentarios', { limite: 50 }), consulta('historico', { limite: 30 }), consulta('anexos'), consulta('transicoes'), escritaDoProjeto(e)]);
    if (carregando && !carregando.isConnected) return;
    if (!t.ok) { avisar(t.error, true); DS.modal(chave, DS.estadoTela('erro', 'Não foi possível abrir o ticket', t.error), { tamanho: 'md' }); return; }
    const d = t.data.dados, x = d.fields || {}; const esc = !!perm.jira; const resultados = h('div', { id: 'tk-resultados' });
    const criterio = vj.campoAceite ? textoExterno(x[vj.campoAceite]) : null;
    const nativos = [...(x.subtasks || []).map((s) => ['Subtarefa', s.key]), x.parent ? ['Pai', x.parent.key] : null, ...(x.issuelinks || []).map((l) => [l.type?.name || 'Vínculo', l.inwardIssue?.key || l.outwardIssue?.key])].filter((p) => p && p[1]);
    const comentarios = com.ok ? com.data.dados : [];
    const caixaTexto = h('textarea', { id: 'tk-comentario', rows: 3, maxlength: 4000, disabled: !esc, placeholder: tr(esc ? 'Escreva um comentário' : 'Escrita no Jira desligada') });
    const trSel = h('select', { id: 'tk-transicao', 'aria-label': tr('Transição'), disabled: !esc || !(trans.ok && trans.data.dados.length) }, (trans.ok ? trans.data.dados : []).map((z) => h('option', { value: z.id }, z.nome + (z.para ? ' → ' + z.para : ''))));
    const main = h('section', { class: 'ds-detalhe-main', id: 'tk-painel', 'data-ticket': chave }, resultados,
      DS.bloco('Descrição', DS.texto(textoExterno(x.description), 'Sem descrição.')),
      DS.bloco('Critérios de aceite', criterio ? DS.texto(criterio) : h('p', { class: 'suave' }, tr('Campo de critérios não configurado para este projeto (Consulta avançada › Descobrir campos).'))),
      nativos.length ? DS.bloco('Relações no Jira', h('div', { class: 'ds-celula-nos' }, nativos.map(([rot, k]) => noRef(e, { tipo: 'jira', id: k, vinculoId: vj.id }, tr(rot) + ' ' + k)))) : null,
      blocoRelacoes(e, ['jira', 'jira-bug'], chave),
      DS.bloco(tr('Comentários ({n})', { n: comentarios.length }), comentarios.length ? h('ul', { class: 'ds-lista' }, comentarios.map((c) => h('li', { class: 'ds-comentario' }, h('span', { class: 'ds-avatar', 'aria-hidden': 'true' }, DS.iniciais(c.author?.displayName)), h('div', {}, h('strong', {}, c.author?.displayName || tr('Autor não informado')), c.updated || c.created ? h('span', { class: 'ds-sub' }, quando(c.updated || c.created)) : null, DS.texto(textoExterno(c.body)))))) : h('p', { class: 'suave' }, com.ok ? tr('Nenhum comentário.') : tr('Comentários indisponíveis: {e}', { e: com.error })),
        h('div', { class: 'ds-campo ds-mt' }, caixaTexto), h('div', { class: 'ds-cab-acoes ds-mt' }, DS.acao('Comentar…', async () => { resultadoOp(resultados, await executarOperacao(e, 'jira.comentar', { ticket: chave, texto: caixaTexto.value })); }, { id: 'tk-comentar', desabilitado: !esc }), !esc ? escritaDesligada('jira') : null)),
      DS.recolher(tr('Histórico de alterações ({n})', { n: hist.ok ? hist.data.dados.length : 0 }), hist.ok ? (hist.data.dados.length ? DS.tempo(hist.data.dados.map((z) => ({ titulo: z.mudancas.map((m) => `${m.campo}: ${m.de ?? '—'} → ${m.para ?? '—'}`).join('; '), sub: quando(z.em) + ' · ' + (z.por || '—') }))) : h('p', { class: 'suave' }, tr('Sem alterações registradas.'))) : h('p', { class: 'suave' }, tr('Indisponível: {e}', { e: hist.error }))),
      DS.bloco(tr('Anexos ({n})', { n: anexos.ok ? anexos.data.dados.length : 0 }), anexos.ok && anexos.data.dados.length ? h('div', { class: 'ds-arquivos' }, anexos.data.dados.map((a) => h('div', { class: 'ds-arquivo' }, h('span', { class: 'ds-arquivo-ic' }, DS.icone(/^image\//.test(a.tipo || '') ? 'imagem' : /^video\//.test(a.tipo || '') ? 'video' : 'arquivo')), h('div', {}, h('strong', {}, a.nome), h('span', { class: 'ds-sub' }, (a.bytes != null ? bytes(a.bytes) : '') + (a.em ? ' · ' + quando(a.em) : '')))))) : h('p', { class: 'suave' }, anexos.ok ? tr('Nenhum anexo.') : tr('Anexos indisponíveis: {e}', { e: anexos.error })),
        h('div', { class: 'ds-cab-acoes ds-mt' }, DS.acao('Anexar arquivo…', async () => { resultadoOp(resultados, await executarOperacao(e, 'jira.anexar', { ticket: chave }, { tipo: 'arquivo' })); }, { id: 'tk-anexar', icone: 'clipe', desabilitado: !esc }))));
    const aside = h('aside', {}, DS.meta([['Origem', DS.origem('jira', 'Jira · ' + vj.recurso.chave)], ['Tipo', x.issuetype?.name], ['Status', x.status?.name ? DS.chip(x.status.name, tomStatusJira(x.status)) : null], ['Prioridade', x.priority?.name], ['Responsável', x.assignee?.displayName || tr('Não atribuído')], ['Relator', x.reporter?.displayName], ['Atualizado', x.updated ? quando(x.updated) : null], ['Consultado', quando(t.data.consultadoEm)]]),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Ações')),
        trSel.options.length ? DS.campo('Mudar status', trSel) : h('p', { class: 'suave' }, trans.ok ? tr('Nenhuma transição disponível para este ticket.') : tr('Transições indisponíveis: {e}', { e: trans.error })), trSel.options.length ? DS.acao('Aplicar transição…', async () => { const r = await executarOperacao(e, 'jira.transicionar', { ticket: chave, transicaoId: trSel.value }); if (r?.estado === 'CONFIRMADA') abrirTicket(e, chave); else resultadoOp(resultados, r); }, { id: 'tk-transicionar', desabilitado: !esc || trSel.disabled }) : null,
        DS.acao('Editar resumo e descrição…', () => editarTicket(e, chave, x), { id: 'tk-editar', icone: 'editar', desabilitado: !esc }),
        DS.acao('Preparar bug relacionado…', () => abrirCriar(e, { origem: chave }), { id: 'tk-bug', icone: 'alerta' }),
        DS.acao('Importar como contexto', async () => { const r = await chamar(() => api.servicoImportar(e.id, chave)); if (r && !r.canceled) avisar(tr('Contexto importado como RASCUNHO.')); }, { id: 'tk-importar' }),
        !esc ? escritaDesligada('jira') : null));
    DS.modal(chave + ' · ' + (x.summary || ''), h('div', { class: 'ds-detalhe' }, main, aside), { tamanho: 'lg', subtitulo: [DS.origem('jira'), x.issuetype?.name ? DS.chip(x.issuetype.name) : null, x.status?.name ? DS.chip(x.status.name, tomStatusJira(x.status)) : null, x.priority?.name ? DS.chip(tr('Prioridade {p}', { p: x.priority.name })) : null] });
  }
  function editarTicket(e, chave, x) {
    const resumo = h('input', { id: 'tk-ed-resumo', maxlength: 255, value: x.summary || '' }); const desc = h('textarea', { id: 'tk-ed-descricao', rows: 10, maxlength: 8000 }); desc.value = textoExterno(x.description);
    const saida = h('div', { id: 'tk-ed-saida' }); const r0 = resumo.value, d0 = desc.value;
    DS.modal(tr('Editar {k}', { k: chave }), [h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Resumo', resumo, { inteiro: true }), DS.campo('Descrição', desc, { inteiro: true, ajuda: 'Texto simples. O Jira converte para o formato do ticket; segredos são mascarados.' })), saida,
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('A alteração é enviada após a confirmação nativa.')), DS.acao('Cancelar', () => abrirTicket(e, chave)), DS.acao('Salvar no Jira…', async () => {
        const p = { ticket: chave }; if (resumo.value !== r0) p.resumo = resumo.value; if (desc.value !== d0) p.descricao = desc.value;
        if (Object.keys(p).length === 1) { saida.replaceChildren(DS.alerta('Nenhuma alteração para salvar.', 'aviso')); return; }
        const r = await executarOperacao(e, 'jira.editar', p); if (r?.estado === 'CONFIRMADA') abrirTicket(e, chave); else if (r) saida.replaceChildren(painelResultado(r));
      }, { id: 'tk-ed-salvar', primaria: true }))], { tamanho: 'md' });
    resumo.focus();
  }
  /** Novo ticket no Jira. Com `defeito`, registra o vínculo Defeito Qase → ticket após a criação confirmada (sem duplicar). */
  async function abrirCriar(e, { origem = '', resumo = '', descricao = '', defeito = null } = {}) {
    const vj = vinc(e, 'jira'), vq = vinc(e, 'qase'); if (!vj) { avisar(tr('Jira não vinculado a este projeto.'), true); return; }
    const perm = await escritaDoProjeto(e); const esc = !!perm.jira; const m = await tiposJira(e);
    const preferido = (m.tipos.find((t) => /bug|defeito/i.test(t.nome)) || m.tipos[0])?.id;
    const tipo = h('select', { id: 'tk-novo-tipo' }, m.tipos.map((t) => h('option', { value: t.id, selected: (origem || defeito) ? t.id === preferido : false }, t.nome)));
    const res = h('input', { id: 'tk-novo-resumo', maxlength: 255, value: resumo }); const desc = h('textarea', { id: 'tk-novo-descricao', rows: 7, maxlength: 8000 }); desc.value = descricao;
    const org = h('input', { id: 'tk-novo-origem', value: origem, maxlength: 40, placeholder: 'SMART-123' }); const rot = h('input', { id: 'tk-novo-rotulos', value: 'prumo-qa', maxlength: 200 });
    const saida = h('div', { id: 'tk-novo-saida', 'aria-live': 'polite' });
    DS.modal(defeito ? tr('Novo ticket a partir do defeito {id}', { id: defeito.id }) : 'Novo ticket no Jira', [
      !esc ? DS.alerta('Escrita no Jira desligada. Habilite em Conexões para criar tickets.', 'aviso', 'cadeado') : null,
      m.erro ? DS.alerta(tr('Tipos de ticket indisponíveis: {e}', { e: m.erro }), 'falha') : null,
      h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Tipo de ticket', tipo), DS.campo('Ticket de origem (opcional)', org), DS.campo('Resumo', res, { inteiro: true }), DS.campo('Descrição', desc, { inteiro: true }), DS.campo('Rótulos (separados por vírgula)', rot, { inteiro: true })), saida,
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('{p} · confirmação nativa antes de enviar', { p: 'Jira ' + vj.recurso.chave })), DS.acao('Cancelar', () => DS.fecharModal(), { id: 'tk-novo-cancelar' }), DS.acao('Revisar e criar…', async () => {
        const p = { tipoId: tipo.value, resumo: res.value, descricao: desc.value, rotulos: rot.value.split(/[,\s]+/).filter(Boolean), ...(org.value.trim() ? { origem: org.value.trim().toUpperCase() } : {}) };
        const r = await executarOperacao(e, 'jira.criar_ticket', p); if (!r) return; saida.replaceChildren(painelResultado(r));
        if (r.estado === 'CONFIRMADA' && defeito && vq && r.remoto?.chave) {
          const a = await api.espacoAssociar(e.id, { de: { tipo: 'qase-defeito', id: String(defeito.id), vinculoId: vq.id, origem: vq.recurso.chave }, para: { tipo: 'jira-bug', id: r.remoto.chave, vinculoId: vj.id, origem: vj.recurso.chave }, justificativa: tr('Ticket aberto no Prumo a partir do defeito Qase {id}', { id: defeito.id }) });
          saida.append(a.ok || /TRACE_DUPLICATE/.test(a.error || '') ? DS.alerta(tr('Vínculo registrado: Defeito Qase {d} → {k}.', { d: defeito.id, k: r.remoto.chave }), 'ok') : DS.alerta(tr('Ticket criado, mas o vínculo não foi registrado: {e}', { e: a.error }), 'falha'));
          await atualizarEspaco(e);
        }
      }, { id: 'tk-novo-criar', primaria: true, desabilitado: !esc || !m.tipos.length }))], { tamanho: 'md' });
  }
  async function abrirDefeito(e, id) {
    const vq = vinc(e, 'qase'), vj = vinc(e, 'jira'); if (!vq) { avisar(tr('Qase não vinculado a este projeto.'), true); return; }
    const carregando = DS.modal(tr('Defeito {id}', { id }), DS.carregando('Consultando o Qase…'), { tamanho: 'lg' });
    const r = await api.servicoConsultar(e.id, 'qase', 'defeito', {}, String(id)); if (carregando && !carregando.isConnected) return;
    if (!r.ok) { avisar(r.error, true); DS.modal(tr('Defeito {id}', { id }), DS.estadoTela('erro', 'Não foi possível abrir o defeito', r.error), { tamanho: 'md' }); return; }
    const d = r.data.dados; e = estado.espaco?.id === e.id ? estado.espaco : e;
    const tickets = e.relacoes.filter((x) => x.de.tipo === 'qase-defeito' && x.de.id === String(id) && x.para.tipo === 'jira-bug');
    const lista = (v) => (Array.isArray(v) ? v : []);
    const main = h('section', { class: 'ds-detalhe-main', id: 'def-detalhe' },
      DS.bloco('Resultado observado', DS.texto(d.actual_result || d.description, 'Sem descrição retornada.')),
      lista(d.runs).length ? DS.bloco('Runs relacionadas', h('div', { class: 'ds-celula-nos' }, lista(d.runs).map((x) => h('span', { class: 'ds-no', 'data-servico': 'qase' }, h('i'), tr('Run {id}', { id: x }))))) : null,
      lista(d.results).length ? DS.bloco('Resultados relacionados', h('div', { class: 'ds-celula-nos' }, lista(d.results).map((x) => h('span', { class: 'ds-no', 'data-servico': 'qase' }, h('i'), String(x))))) : null,
      DS.bloco(tr('Anexos ({n})', { n: lista(d.attachments).length }), lista(d.attachments).length ? h('ul', { class: 'ds-lista' }, lista(d.attachments).map((a) => h('li', {}, a.filename || a.name || a.hash || tr('Anexo'), h('span', { class: 'ds-sub' }, a.size ? bytes(a.size) : '')))) : h('p', { class: 'suave' }, tr('Nenhum anexo.'))),
      blocoRelacoes(e, ['qase-defeito'], id),
      DS.recolher('Dados retornados pelo Qase', h('pre', { class: 'ds-codigo' }, JSON.stringify(d, null, 2))));
    const aside = h('aside', {}, DS.meta([['Origem', DS.origem('qase', 'Qase · ' + vq.recurso.chave)], ['Status', d.status != null ? String(d.status) : null], ['Severidade', d.severity != null ? String(d.severity) : null], ['Tags', lista(d.tags).map((x) => x.title || x).join(', ') || null], ['Atualizado', d.updated_at ? quando(d.updated_at) : null], ['Consultado', quando(r.data.consultadoEm)]]),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Jira')),
        tickets.length ? h('div', { class: 'ds-celula-nos' }, tickets.map((x) => noRef(e, x.para, x.para.id))) : null,
        vj ? (tickets.length ? h('p', { class: 'suave' }, tr('Já existe ticket relacionado a este defeito.')) : DS.acao('Abrir ticket no Jira…', () => abrirCriar(e, { resumo: `[Qase ${vq.recurso.chave}-${id}] ${d.title || ''}`.slice(0, 255), descricao: [tr('Defeito Qase: {k}-{id}', { k: vq.recurso.chave, id }), d.severity != null ? tr('Severidade: {s}', { s: d.severity }) : '', '', d.actual_result || ''].filter((z) => z !== null).join('\n').slice(0, 8000), defeito: { id } }), { id: 'def-jira', icone: 'mais' })) : h('p', { class: 'suave' }, tr('Vincule o Jira para abrir um ticket a partir deste defeito.')),
        DS.notaPermissao('Defeitos do Qase são somente leitura no Prumo: criação, edição, comentários e anexos não têm contrato.')));
    DS.modal(tr('Defeito {id}', { id: vq.recurso.chave + '-' + id }) + ' · ' + (d.title || ''), h('div', { class: 'ds-detalhe' }, main, aside), { tamanho: 'lg', subtitulo: [DS.origem('qase'), DS.chip('Defeito'), d.status != null ? DS.chip(String(d.status)) : null, d.severity != null ? DS.chip(tr('Severidade {s}', { s: d.severity })) : null] });
  }

  // ======================= Casos (Qase) =======================
  const tipoCaso = (c) => { if (typeof c.isManual === 'boolean') return c.isManual ? (c.isToBeAutomated ? 'planejado' : 'manual') : 'automatizado'; return ({ 0: 'manual', 1: 'planejado', 2: 'automatizado' })[c.automation] || 'indefinido'; };
  const rotuloTipoCaso = { manual: 'Manual', planejado: 'Automação planejada', automatizado: 'Automatizado', indefinido: 'Não informado' };
  const chipTipoCaso = (c) => { const t = tipoCaso(c); return DS.chip(rotuloTipoCaso[t], t === 'automatizado' ? 'info' : t === 'planejado' ? 'aviso' : null); };
  const resultadosLocais = (runs, casoId) => runs.flatMap((r) => r.casos.filter((c) => c.casoId === Number(casoId) && c.resultado).map((c) => ({ run: r, ...c.resultado })));
  const ticketsExternos = (c) => (Array.isArray(c.external_issues) ? c.external_issues.flatMap((x) => (x.issues || []).map((i) => i.id)) : []);
  async function abrirCaso(e, id) {
    const vq = vinc(e, 'qase'); if (!vq) { avisar(tr('Qase não vinculado a este projeto.'), true); return; }
    const carregando = DS.modal(tr('Caso {id}', { id }), DS.carregando('Consultando o Qase…'), { tamanho: 'lg' });
    const [r, runs, perm, aut] = await Promise.all([api.servicoConsultar(e.id, 'qase', 'caso', {}, String(id)), api.runs(e.id), escritaDoProjeto(e), api.espacoAutomacoes(e.id)]);
    if (carregando && !carregando.isConnected) return;
    if (!r.ok) { avisar(r.error, true); DS.modal(tr('Caso {id}', { id }), DS.estadoTela('erro', 'Não foi possível abrir o caso', r.error), { tamanho: 'md' }); return; }
    const c = r.data.dados; const esc = !!perm.qase; e = estado.espaco?.id === e.id ? estado.espaco : e;
    const locais = resultadosLocais(runs.ok ? runs.data : [], id).sort((a, b) => Date.parse(b.em) - Date.parse(a.em));
    const autos = relacoesDe(e, ['qase'], id).map((x) => outroLado(x, ['qase'], id)).filter((x) => x.tipo === 'automacao');
    const tks = [...new Set([...ticketsExternos(c), ...relacoesDe(e, ['qase'], id).map((x) => outroLado(x, ['qase'], id)).filter((x) => x.tipo === 'jira').map((x) => x.id)])];
    const passos = Array.isArray(c.steps) ? c.steps : []; const saida = h('div', { id: 'caso-saida' });
    const main = h('section', { class: 'ds-detalhe-main', id: 'caso-detalhe', 'data-caso': String(id) }, saida,
      DS.bloco('Descrição', DS.texto(c.description, 'Sem descrição.')),
      DS.bloco('Pré-condições', DS.texto(c.preconditions, 'Sem pré-condições.')),
      DS.bloco(tr('Passos ({n})', { n: passos.length }), passos.length ? DS.tabela({ colunas: ['#', 'Ação', 'Dados', 'Resultado esperado'], linhas: passos.map((p, i) => ({ celulas: [String(p.position ?? i + 1), DS.texto(p.action), p.data ? DS.texto(p.data) : '—', DS.texto(p.expected_result, '—')] })) }) : h('p', { class: 'suave' }, tr('Nenhum passo cadastrado.'))),
      c.postconditions ? DS.bloco('Pós-condições', DS.texto(c.postconditions)) : null,
      window.PrumoTestes ? window.PrumoTestes.blocoCodigoDoCaso(e, id) : null,
      DS.bloco('Resultados no Prumo', locais.length ? DS.tempo(locais.map((x) => ({ tom: DS.tom(x.status), titulo: h('span', {}, selo(x.status), ' ', x.run.titulo), sub: quando(x.em) + ' · ' + (x.origem === 'MANUAL' ? tr('declarado manualmente') : tr('execução de automação')) + (x.granularidade === 'RODADA' ? ' · ' + tr('escopo da rodada') : '') + (x.comentario ? ' · ' + x.comentario.slice(0, 160) : '') }))) : h('p', { class: 'suave' }, tr('Nenhum resultado registrado no Prumo para este caso.'))),
      DS.recolher('Dados retornados pelo Qase', h('pre', { class: 'ds-codigo' }, JSON.stringify(c, null, 2))));
    const capSel = h('select', { id: 'caso-cap', 'aria-label': tr('Automação') }, ((aut.ok && aut.data.capacidades) || []).map((x) => h('option', { value: x }, x)));
    const tkIn = h('input', { id: 'caso-ticket', class: 'ds-w-sm', placeholder: 'SMART-123', maxlength: 40, 'aria-label': tr('Ticket Jira') });
    const aside = h('aside', {}, DS.meta([['Origem', DS.origem('qase', 'Qase · ' + vq.recurso.chave)], ['Tipo de execução', chipTipoCaso(c)], ['Situação no Prumo', locais[0] ? h('span', {}, selo(locais[0].status), ' ', h('span', { class: 'suave' }, quando(locais[0].em))) : DS.chip('Sem resultado')], ['Suite', c.suite_id != null ? String(c.suite_id) : null], ['Prioridade', c.priority != null ? String(c.priority) : null], ['Severidade', c.severity != null ? String(c.severity) : null], ['Tags', (c.tags || []).map((x) => x.title || x).join(', ') || null], ['Atualizado', c.updated_at || c.updated ? quando(c.updated_at || c.updated) : null]]),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Automação relacionada')), autos.length ? h('div', { class: 'ds-celula-nos' }, autos.map((a) => noRef(e, a, a.id))) : h('p', { class: 'suave' }, tr('Nenhuma automação declarada no Prumo.')),
        h('p', { class: 'ds-nota-perm' }, DS.icone('escudo'), h('span', {}, tr('Automação vinculada não aprova o caso: só um resultado registrado comprova a execução.'))),
        capSel.options.length ? h('div', { class: 'ds-cab-acoes' }, capSel, DS.acao('Declarar', async () => { const x = await chamar(() => api.espacoAssociar(e.id, { de: { tipo: 'qase', id: String(id), vinculoId: vq.id, origem: vq.recurso.chave }, para: { tipo: 'automacao', id: capSel.value, origem: 'qa.project.json' }, justificativa: tr('Declarado pela pessoa') })); if (x) { await atualizarEspaco(e); avisar(tr('Vínculo declarado.')); abrirCaso(estado.espaco, id); } }, { id: 'caso-declarar', compacto: true })) : null),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Tickets')), tks.length ? h('div', { class: 'ds-celula-nos' }, tks.map((k) => noRef(e, { tipo: 'jira', id: k, vinculoId: vinc(e, 'jira')?.id }, k))) : h('p', { class: 'suave' }, tr('Nenhum ticket associado.')),
        h('div', { class: 'ds-cab-acoes' }, tkIn, DS.acao('Associar…', async () => { resultadoOp(saida, await executarOperacao(e, 'qase.associar_ticket', { casoId: Number(id), ticket: tkIn.value.trim().toUpperCase() })); }, { id: 'caso-associar', compacto: true, desabilitado: !esc }))),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Ações')), DS.acao('Editar caso…', () => editarCaso(e, id, c), { id: 'caso-editar', icone: 'editar', desabilitado: !esc }), !esc ? escritaDesligada('qase') : null));
    DS.modal(tr('Caso {id}', { id }) + ' · ' + (c.title || ''), h('div', { class: 'ds-detalhe' }, main, aside), { tamanho: 'lg', subtitulo: [DS.origem('qase'), chipTipoCaso(c), locais[0] ? selo(locais[0].status) : DS.chip('Não executado no Prumo')] });
  }
  function editarCaso(e, id, c) {
    const tipo0 = tipoCaso(c) === 'planejado' ? 'a-automatizar' : tipoCaso(c) === 'automatizado' ? 'automatizado' : 'manual';
    const titulo = h('input', { id: 'caso-ed-titulo', maxlength: 255, value: c.title || '' }); const desc = h('textarea', { id: 'caso-ed-descricao', rows: 4, maxlength: 8000 }); desc.value = c.description || '';
    const pre = h('textarea', { id: 'caso-ed-pre', rows: 3, maxlength: 4000 }); pre.value = c.preconditions || '';
    const auto = h('select', { id: 'caso-ed-automacao' }, [['manual', 'Manual'], ['a-automatizar', 'Manual, a automatizar'], ['automatizado', 'Automatizado']].map(([v, txt]) => h('option', { value: v, selected: v === tipo0 }, tr(txt))));
    const passos = h('div', { id: 'caso-ed-passos', class: 'ds-lista' }); const linha = (p = {}) => { const a = h('input', { class: 'passo-acao', placeholder: tr('Ação'), maxlength: 2000, value: p.action || '', 'aria-label': tr('Ação') }); const d = h('input', { class: 'passo-dados', placeholder: tr('Dados'), maxlength: 2000, value: p.data || '', 'aria-label': tr('Dados') }); const x = h('input', { class: 'passo-esperado', placeholder: tr('Resultado esperado'), maxlength: 2000, value: p.expected_result || '', 'aria-label': tr('Resultado esperado') });
      const l = h('div', { class: 'ds-cab-acoes ds-passo-linha' }, a, d, x, h('button', { type: 'button', class: 'ds-icone-btn', 'aria-label': tr('Remover passo'), onclick: () => l.remove() }, DS.icone('fechar'))); for (const i of [a, d, x]) i.style.flex = '1'; passos.append(l); };
    for (const p of (c.steps?.length ? c.steps : [{}])) linha(p);
    const saida = h('div', { id: 'caso-ed-saida' });
    DS.modal(tr('Editar caso {id}', { id }), [h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título', titulo, { inteiro: true }), DS.campo('Tipo de execução', auto), h('span'), DS.campo('Descrição', desc, { inteiro: true }), DS.campo('Pré-condições', pre, { inteiro: true }),
      h('div', { class: 'ds-campo inteiro' }, h('span', {}, tr('Passos')), passos, h('div', {}, DS.link('Adicionar passo', () => linha({}), { seta: false })))), saida,
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('Qase {p} · confirmação nativa antes de enviar', { p: vinc(e, 'qase')?.recurso.chave })), DS.acao('Cancelar', () => abrirCaso(e, id)), DS.acao('Salvar no Qase…', async () => {
        const p = { casoId: Number(id) }; if (titulo.value !== (c.title || '')) p.titulo = titulo.value; if (desc.value !== (c.description || '')) p.descricao = desc.value; if (pre.value !== (c.preconditions || '')) p.preCondicoes = pre.value; if (auto.value !== tipo0) p.automacao = auto.value;
        const novos = [...passos.children].map((l) => ({ acao: l.querySelector('.passo-acao').value, dados: l.querySelector('.passo-dados').value, esperado: l.querySelector('.passo-esperado').value })).filter((s) => s.acao.trim());
        const antigos = (c.steps || []).map((s) => ({ acao: s.action || '', dados: s.data || '', esperado: s.expected_result || '' })); if (JSON.stringify(novos) !== JSON.stringify(antigos)) p.passos = novos;
        if (Object.keys(p).length === 1) { saida.replaceChildren(DS.alerta('Nenhuma alteração para salvar.', 'aviso')); return; }
        const r = await executarOperacao(e, 'qase.editar_caso', p); if (r?.estado === 'CONFIRMADA') { delete memoria('testes', e.id).casos; abrirCaso(e, id); } else if (r) saida.replaceChildren(painelResultado(r));
      }, { id: 'caso-ed-salvar', primaria: true }))], { tamanho: 'md' });
  }

  // ======================= Testes =======================
  async function carregarQase(e, mem, op, pagina = { limite: 100 }) {
    const r = await api.servicoConsultar(e.id, 'qase', op, pagina);
    if (!r.ok) { avisar(r.error, true); return { erro: r.error, itens: [] }; }
    return { itens: Array.isArray(r.data.dados) ? r.data.dados : [], proxima: r.data.proxima, em: r.data.consultadoEm };
  }
  const fonteQase = (r, rotulo, mais) => h('div', { class: 'ds-fontes', 'aria-live': 'polite' }, r.erro ? h('span', { role: 'status' }, DS.origem('qase', 'Qase'), ' ', DS.chip(r.erro, 'falha')) : h('span', { role: 'status' }, DS.origem('qase', 'Qase'), tr('{n} {r} · consultado {q}', { n: r.itens.length, r: tr(rotulo), q: quando(r.em) }), r.proxima != null && mais ? DS.link('Carregar mais', mais, { seta: false }) : null));
  abas.testes = async (el) => {
    const e = estado.espaco;
    if (!e) { const sub0 = ['runs', 'automacao'].includes(estado.sub?.testes) ? estado.sub.testes : 'catalogo'; el.append(DS.cabecalho({ titulo: 'Testes' }), barraSub('testes', [['catalogo', 'Catálogo'], ['runs', 'Runs'], ['automacao', 'Automação']], sub0), h('div', { id: 'sub-conteudo' }, DS.estadoTela('vazio', 'Nenhum projeto selecionado', 'Selecione ou crie um projeto para continuar.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))]))); return; }
    const vq = vinc(e, 'qase'); const mem = memoria('testes', e.id);
    const itens = [['catalogo', 'Catálogo'], ...(vq ? [['casos', 'Casos'], ['suites', 'Suites'], ['planos', 'Planos']] : []), ['runs', 'Runs'], ['automacao', 'Automação']];
    let sub = estado.sub?.testes || 'catalogo'; if (!itens.some(([k]) => k === sub)) sub = 'catalogo';
    const perm = vq ? await escritaDoProjeto(e) : {}; const esc = !!perm.qase;
    const acoes = { casos: [DS.acao('Consulta avançada', () => avancadaQase(e), { id: 'testes-avancada', icone: 'filtro' }), DS.acao('Nova proposta de caso', () => novaProposta(e), { id: 'pr-nova', primaria: true, icone: 'mais' })], suites: [DS.acao('Nova suite', () => novaSuite(e, esc), { id: 'su-nova', primaria: true, icone: 'mais' })], planos: [DS.acao('Novo plano', () => novoPlano(e, esc), { id: 'plano-novo', primaria: true, icone: 'mais' })], runs: vq ? [DS.acao('Preparar run', () => prepararRun(e), { id: 'run-nova', primaria: true, icone: 'mais' })] : [] }[sub] || [];
    el.append(DS.cabecalho({ titulo: 'Testes', descricao: [h('span', { class: 'ds-chips' }, DS.origem(e.pastaLocal ? 'local' : 'ausente', e.pastaLocal ? tr('Repositório local') : tr('Sem pasta local')), vq ? DS.origem('qase', 'Qase · ' + vq.recurso.chave) : null, vq && !esc ? h('span', { class: 'ds-chip', 'data-escrita-desligada': 'qase', title: tr('Escrita no Qase desligada. Habilite em Conexões.') }, tr('Qase somente leitura')) : null)], acoes }), barraSub('testes', itens, sub));
    const corpo = h('div', { id: 'sub-conteudo' }); el.append(corpo);
    if (sub === 'catalogo') await catalogoRepo(corpo);
    else if (sub === 'casos') await telaCasos(e, mem, corpo);
    else if (sub === 'suites') await telaSuites(e, mem, corpo);
    else if (sub === 'planos') await telaPlanos(e, mem, corpo);
    else if (sub === 'runs') await telaRuns(e, mem, corpo, esc);
    else { await abaAutomacao(corpo); semTitulo(corpo); }
  };
  async function avancadaQase(e) {
    const caixa = h('div', { class: 'ds-avancada' }, h('p', { class: 'suave' }, tr('Consulta direta ao Qase vinculado: suites, casos, detalhe com passos e planos, com os dados retornados.')));
    DS.modal('Consulta avançada · Qase', caixa, { tamanho: 'lg' }); await consultaManual(caixa, 'qase', { suites: 'Suites', casos: 'Casos manuais e automatizados', caso: 'Detalhe e passos do caso', planos: 'Planos' });
  }
  function novaProposta(e) { DS.modal('Nova proposta de caso', formularioProposta(e, null, () => { DS.fecharModal(); mostrar('testes'); }), { tamanho: 'md' }); }
  async function telaCasos(e, mem, corpo) {
    const f = (mem.fCasos ||= { q: '', tipo: '', suite: '' });
    const q = DS.busca({ id: 'caso-busca', placeholder: 'Buscar por ID, título ou tag', valor: f.q });
    const tipo = DS.selecao({ id: 'caso-tipo', rotulo: 'Tipo de execução', opcoes: [['', 'Todos os tipos'], ['manual', 'Manual'], ['automatizado', 'Automatizado'], ['planejado', 'Automação planejada']], valor: f.tipo });
    const suite = DS.selecao({ id: 'caso-suite', rotulo: 'Suite', opcoes: [['', 'Todas as suites']], valor: '' });
    const area = h('div', { id: 'casos-area' }, DS.esqueleto(6)); const fonte = h('div');
    corpo.append(DS.barra(q.no, tipo, suite, DS.acao('Atualizar', async () => { delete mem.casos; await carregar(); }, { id: 'casos-atualizar', icone: 'atualizar' })), fonte, area);
    const slot = h('div', { id: 'pr-slot' }); const propostas = h('div', { id: 'pr-lista' });
    corpo.append(DS.secao('Propostas em revisão', [h('p', { class: 'suave' }, tr('Rascunhos locais de casos e bugs. Nada é publicado sem revisão e confirmação.')), slot, propostas]));
    const [runs] = await Promise.all([api.runs(e.id)]); const rl = runs.ok ? runs.data : [];
    const desenhar = () => {
      f.q = q.input.value.trim(); f.tipo = tipo.value; f.suite = suite.value; const qq = f.q.toLowerCase();
      const casos = (mem.casos?.itens || []).filter((c) => (!f.tipo || tipoCaso(c) === f.tipo) && (!f.suite || String(c.suite_id) === f.suite) && (!qq || (c.id + ' ' + (c.title || '') + ' ' + (c.tags || []).map((x) => x.title || x).join(' ')).toLowerCase().includes(qq)));
      if (mem.casos?.erro && !mem.casos.itens.length) { area.replaceChildren(DS.estadoTela('erro', 'Não foi possível consultar os casos', mem.casos.erro, [DS.acao('Tentar novamente', async () => { delete mem.casos; await carregar(); })])); return; }
      if (!casos.length) { area.replaceChildren(DS.estadoTela('vazio', mem.casos?.itens.length ? 'Nenhum caso para estes filtros' : 'Nenhum caso retornado pelo Qase', mem.casos?.itens.length ? 'Ajuste a busca, o tipo ou a suite.' : null)); return; }
      const nomeSuite = (sid) => (mem.suites?.itens || []).find((s) => s.id === sid)?.title;
      area.replaceChildren(DS.tabela({ id: 'casos-tabela', colunas: ['ID', 'Caso', 'Tipo', { t: 'Automação no Prumo', classe: 'ds-opcional' }, 'Ticket', 'Resultado no Prumo'], linhas: casos.map((c) => {
        const autos = relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)).filter((x) => x.tipo === 'automacao'); const tk = [...new Set([...ticketsExternos(c), ...relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)).filter((x) => x.tipo === 'jira').map((x) => x.id)])];
        const ult = resultadosLocais(rl, c.id).sort((a, b) => Date.parse(b.em) - Date.parse(a.em))[0];
        return { attrs: { 'data-caso': String(c.id) }, abrir: () => abrirCaso(e, c.id), rotuloAcessivel: tr('Abrir caso {id}', { id: c.id }),
          celulas: [{ no: String(c.id), classe: 'ds-id' }, h('div', {}, h('span', { class: 'ds-resumo-texto' }, c.title || '—'), nomeSuite(c.suite_id) ? h('span', { class: 'ds-sub' }, nomeSuite(c.suite_id)) : null), chipTipoCaso(c), autos.length ? h('span', { class: 'ds-celula-nos' }, autos.map((a) => h('span', { class: 'ds-no', 'data-servico': 'local' }, h('i'), a.id))) : h('span', { class: 'ds-falta' }, tr('não declarada')), tk.length ? tk.join(', ') : '—', ult ? selo(ult.status) : h('span', { class: 'ds-falta' }, tr('sem resultado'))] };
      }) }));
    };
    async function carregar() {
      area.replaceChildren(DS.esqueleto(6));
      const [casos, suites] = await Promise.all([mem.casos ? mem.casos : carregarQase(e, mem, 'casos'), mem.suites ? mem.suites : carregarQase(e, mem, 'suites')]);
      mem.casos = casos; mem.suites = suites; fonte.replaceChildren(fonteQase(casos, 'caso(s)', casos.proxima != null ? async () => { const r = await carregarQase(e, mem, 'casos', { offset: casos.proxima, limite: 100 }); if (!r.erro) { mem.casos = { ...r, itens: mem.casos.itens.concat(r.itens) }; fonte.replaceChildren(fonteQase(mem.casos, 'caso(s)')); desenhar(); } } : null));
      suite.replaceChildren(h('option', { value: '' }, tr('Todas as suites')), ...suites.itens.map((s) => h('option', { value: String(s.id), selected: String(s.id) === f.suite }, s.title)));
      desenhar();
    }
    q.input.addEventListener('input', desenhar); tipo.addEventListener('change', desenhar); suite.addEventListener('change', desenhar);
    const perm = await escritaDoProjeto(e); const ps = await chamar(() => api.propostas(e.id)); const vivas = (ps || []).filter((p) => p.estado !== 'DESCARTADA');
    if (!vivas.length) propostas.append(DS.estadoTela('vazio', 'Nenhuma proposta em revisão', null, [], { id: 'pr-vazia', compacto: true })); for (const p of vivas) propostas.append(cartaoProposta(e, p, perm, () => mostrar('testes')));
    await carregar();
  }
  function novaSuite(e, esc) {
    const titulo = h('input', { id: 'su-titulo', maxlength: 255 }); const saida = h('div', { id: 'ts-saida' });
    DS.modal('Nova suite no Qase', [!esc ? DS.alerta('Escrita no Qase desligada. Habilite em Conexões para criar suites.', 'aviso', 'cadeado') : null, h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título da suite', titulo, { inteiro: true })), saida,
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar suite…', async () => { const r = await executarOperacao(e, 'qase.criar_suite', { titulo: titulo.value }); if (r) { saida.replaceChildren(painelResultado(r)); if (r.estado === 'CONFIRMADA') delete memoria('testes', e.id).suites; } }, { id: 'su-criar', primaria: true, desabilitado: !esc }))], { tamanho: 'sm' });
    titulo.focus();
  }
  async function telaSuites(e, mem, corpo) {
    const area = h('div', { id: 'suites-area' }, DS.esqueleto(5)); const fonte = h('div'); corpo.append(DS.barra(DS.acao('Atualizar', async () => { delete mem.suites; await carregar(); }, { id: 'suites-atualizar', icone: 'atualizar' })), fonte, area);
    async function carregar() {
      area.replaceChildren(DS.esqueleto(5)); const s = (mem.suites = mem.suites || await carregarQase(e, mem, 'suites')); fonte.replaceChildren(fonteQase(s, 'suite(s)'));
      if (s.erro && !s.itens.length) { area.replaceChildren(DS.estadoTela('erro', 'Não foi possível consultar as suites', s.erro)); return; }
      if (!s.itens.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhuma suite retornada pelo Qase')); return; }
      area.replaceChildren(DS.tabela({ id: 'suites-tabela', colunas: ['ID', 'Suite', 'Casos', 'Suite pai'], rotuloAbrir: 'Ver casos', linhas: s.itens.map((x) => ({ attrs: { 'data-suite': String(x.id) }, abrir: () => { (mem.fCasos ||= {}).suite = String(x.id); (estado.sub ||= {}).testes = 'casos'; mostrar('testes'); }, celulas: [{ no: String(x.id), classe: 'ds-id' }, h('div', {}, x.title || '—', x.description ? h('span', { class: 'ds-sub' }, String(x.description).slice(0, 160)) : null), x.cases_count != null ? String(x.cases_count) : '—', x.parent_id != null ? String(x.parent_id) : '—'] })) }));
    }
    await carregar();
  }
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
  async function telaRuns(e, mem, corpo, esc) {
    const vq = vinc(e, 'qase'); if (!vq) { corpo.append(DS.estadoTela('vazio', 'Qase não vinculado', 'Vincule o Qase em Conexões para preparar e acompanhar runs.', [DS.acao('Abrir Conexões', () => mostrar('conexoes'))], { id: 'runs-vazio' })); return; }
    const area = h('div', { id: 'runs-area' }, DS.esqueleto(5)); const fonte = h('div');
    corpo.append(DS.barra(DS.acao('Atualizar', async () => { delete mem.runsQase; await carregar(); }, { id: 'runs-atualizar', icone: 'atualizar' })), fonte, area);
    async function carregar() {
      area.replaceChildren(DS.esqueleto(5));
      const [locais, remotas] = await Promise.all([api.runs(e.id), mem.runsQase || carregarQase(e, mem, 'runs', { limite: 50 })]); mem.runsQase = remotas;
      const rl = locais.ok ? locais.data : []; const ligadas = new Set(rl.map((r) => String(r.runIdRemoto)).filter((x) => x !== 'null' && x !== 'undefined'));
      fonte.replaceChildren(h('div', { class: 'ds-fontes' }, h('span', { role: 'status' }, DS.origem('prumo', 'Prumo'), tr('{n} run(s) preparada(s) neste computador', { n: rl.length })), remotas.erro ? h('span', { role: 'status' }, DS.origem('qase', 'Qase'), ' ', DS.chip(remotas.erro, 'falha')) : h('span', { role: 'status' }, DS.origem('qase', 'Qase'), tr('{n} run(s) · consultado {q}', { n: remotas.itens.length, q: quando(remotas.em) }))));
      const linhas = [...rl.map((r) => { const c = contar(r); return { attrs: { 'data-run': r.id }, abrir: () => abrirRunLocal(e, r.id, esc), rotuloAcessivel: tr('Abrir run {t}', { t: r.titulo }), celulas: [h('div', {}, h('strong', {}, r.titulo), h('span', { class: 'ds-sub' }, r.runIdRemoto ? tr('Qase #{id}{c}', { id: r.runIdRemoto, c: r.confirmadaNoQase ? ' · ' + tr('confirmada') : '' }) : tr('ainda não criada no Qase'))), DS.origem('prumo', 'Prumo'), r.ambiente, String(c.total), barraResultado(c), selo(r.estado)] }; }),
        ...remotas.itens.filter((x) => !ligadas.has(String(x.id))).map((x) => ({ attrs: { 'data-run-qase': String(x.id) }, abrir: () => abrirRunQase(e, x), rotuloAcessivel: tr('Abrir run do Qase {id}', { id: x.id }), celulas: [h('div', {}, h('strong', {}, x.title || tr('Run {id}', { id: x.id })), h('span', { class: 'ds-sub' }, tr('Qase #{id}', { id: x.id, c: '' }))), DS.origem('qase', 'Qase'), x.environment?.title || '—', x.cases_count != null ? String(x.cases_count) : '—', x.stats ? barraResultado({ total: x.stats.total || 0, pass: x.stats.passed || 0, fail: x.stats.failed || 0, blocked: x.stats.blocked || 0, notRun: x.stats.untested || 0 }) : '—', x.status != null ? estadoRunQase(x) : '—'] }))];
      area.replaceChildren(linhas.length ? DS.tabela({ id: 'runs-tabela', colunas: ['Run', 'Origem', { t: 'Ambiente', classe: 'ds-opcional' }, { t: 'Casos', classe: 'ds-opcional' }, 'Resultados', 'Estado'], linhas }) : DS.estadoTela('vazio', 'Nenhuma run preparada', 'Use "Preparar run" para escolher os casos e o ambiente.', [], { id: 'runs-vazio' }));
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
      ['manual', tr('Resultado manual'), null, () => [h('p', { class: 'suave' }, tr('Registra o resultado observado por você, marcado como MANUAL. Não substitui resultado de automação.')), h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Caso', casoSel), DS.campo('Resultado', st), DS.campo('Comentário do resultado manual', cm, { inteiro: true }), h('div', { class: 'ds-form-acoes' }, DS.acao('Declarar resultado manual…', () => passo(() => api.runResultado(r.id, Number(casoSel.value), st.value, cm.value), tr('Resultado manual registrado (marcado MANUAL).')), { primaria: true })))]],
      ['publicacao', tr('Publicação'), null, () => [h('p', { class: 'suave' }, tr('Política para publicar resultados desta run por rotina agendada. Sem política, os resultados ficam locais.')), h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Validade (dias)', dias), DS.campo('Máximo de publicações', usos), h('div', { class: 'ds-form-acoes' }, DS.acao('Aprovar política de publicação agendada…', () => passo(() => api.runPolitica(e.id, r.runIdRemoto, Number(dias.value), Number(usos.value)), tr('Política registrada para a run {id}.', { id: r.runIdRemoto })), { id: 'run-politica-' + r.id, desabilitado: !r.runIdRemoto })))]]
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
      DS.alerta('Run consultada no Qase. Resultados externos não são evidência de execução local.', null, 'escudo'),
      DS.bloco(tr('Resultados ({n})', { n: res.length }), !r.ok ? DS.estadoTela('erro', 'Resultados indisponíveis', r.error) : res.length ? DS.tabela({ colunas: ['Caso', 'Status', 'Tipo', 'Duração', 'Término'], linhas: res.map((z) => ({ abrir: () => abrirCaso(e, z.case_id), rotuloAcessivel: tr('Abrir caso {id}', { id: z.case_id }), celulas: [String(z.case_id), DS.chip(String(z.status), z.status === 'passed' ? 'ok' : z.status === 'failed' ? 'falha' : z.status === 'blocked' ? 'aviso' : null), z.is_api_result ? tr('automação (API)') : tr('manual'), z.time_spent_ms != null ? duracao(z.time_spent_ms) : '—', quando(z.end_time)] })) }) : h('p', { class: 'suave' }, tr('Nenhum resultado registrado nesta run.')))], { tamanho: 'lg', subtitulo: [DS.origem('qase'), DS.chip('Run do Qase')] });
  }

  // ======================= Rastreabilidade =======================
  abas.rastreabilidade = async (el) => {
    const e = estado.espaco; const sub = estado.sub?.rastreabilidade === 'vinculos' ? 'vinculos' : 'mapa';
    if (!e) { el.append(DS.cabecalho({ titulo: 'Rastreabilidade' }), barraSub('rastreabilidade', [['mapa', 'Trilha'], ['vinculos', 'Relações']], sub), h('div', { id: 'sub-conteudo' }, DS.estadoTela('vazio', 'Nenhum projeto selecionado', 'Selecione ou crie um projeto para continuar.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))]))); return; }
    const espacos = (await chamar(api.espacos)) || [];
    el.append(DS.cabecalho({ titulo: 'Rastreabilidade', descricao: 'Ticket → caso → automação → execução → evidência → defeito. Somente vínculos declarados, registrados por fluxos do Prumo, observados em execuções ou lidos estaticamente no código.',
      acoes: [DS.acao('Declarar vínculo', () => declarar(e), { id: 'rastro-declarar', primaria: true, icone: 'vinculo' })] }), barraSub('rastreabilidade', [['mapa', 'Trilha'], ['vinculos', 'Relações']], sub));
    const m = await chamar(() => api.vinculosMapa(e.id)); if (!m) return el.append(DS.falhaConsulta('rastreabilidade'));
    const corpo = h('div', { id: 'sub-conteudo' }); el.append(corpo);
    for (const aviso of m.avisos || []) corpo.append(DS.alerta(aviso, 'aviso'));
    const projSel = espacos.length > 1 ? DS.selecao({ id: 'rastro-projeto', rotulo: 'Projeto', opcoes: espacos.map((x) => [x.id, x.nome]), valor: e.id, aoMudar: (v) => { const x = espacos.find((y) => y.id === v); if (x) { estado.espaco = x; estado.root = x.raizContextos; salvarRaiz(); mostrar('rastreabilidade'); } } }) : null;
    if (sub === 'vinculos') return relacoes(e, m, corpo, projSel);
    trilha(e, m, corpo, projSel);
  };
  function grafo(m) {
    const nos = new Map(m.nos.map((n) => [n.id, n])); const viz = new Map();
    for (const a of m.arestas) for (const [x, y] of [[a.de, a.para], [a.para, a.de]]) { if (!viz.has(x)) viz.set(x, []); viz.get(x).push({ id: y, aresta: a }); }
    const vizinhos = (id, tipos) => (viz.get(id) || []).filter((v) => tipos.includes(nos.get(v.id)?.tipo));
    return { nos, vizinhos };
  }
  const refDoNo = (n) => { const [tipo, ...resto] = n.id.split(':'); const id = resto[0] ?? n.id; return { tipo: n.tipo === 'run' ? 'run' : tipo, id }; };
  function botaoNo(e, n, origem) {
    const ref = refDoNo(n); const servico = servicoDoTipo[n.tipo] || 'prumo'; const desat = n.estado === 'DESATUALIZADO';
    const abrir = { jira: () => abrirTicket(e, ref.id), 'jira-bug': () => abrirTicket(e, ref.id), qase: () => abrirCaso(e, ref.id), 'qase-defeito': () => abrirDefeito(e, ref.id), evidencia: () => window.PrumoOperacao?.abrirEvidencia(e, ref.id), run: () => abrirRunLocal(e, ref.id, false) }[n.tipo];
    const texto = n.tipo === 'jira' ? ref.id : n.rotulo;
    if (!abrir) return h('span', { class: 'ds-no', 'data-servico': servico, 'data-origem': origem || null, title: n.detalhe || null }, h('i'), texto);
    const b = h('button', { type: 'button', class: 'ds-no', 'data-servico': servico, 'data-origem': origem || null, 'aria-label': tr('Abrir {t} {id}', { t: n.tipo, id: ref.id }), title: desat ? tr('Vínculo original removido; consulta não autorizada ao vínculo atual.') : (n.detalhe || null), disabled: desat }, h('i'), texto);
    if (!desat) b.addEventListener('click', abrir);
    return b;
  }
  function trilha(e, m, corpo, projSel) {
    const { nos, vizinhos } = grafo(m); const linhas = []; const usados = new Set();
    const colher = (ids, tipos) => { const out = new Map(); for (const id of ids) for (const v of vizinhos(id, tipos)) if (!out.has(v.id)) out.set(v.id, v); return [...out.values()]; };
    const montar = (ticket, casos) => {
      const base = [ticket?.id, ...casos.map((c) => c.id)].filter(Boolean);
      const autos = colher(casos.map((c) => c.id), ['automacao']); const evid = colher(base, ['evidencia']); const runs = colher(casos.map((c) => c.id), ['run']);
      const bugs = colher(base, ['jira-bug']); const defs = colher([...base, ...bugs.map((b) => b.id)], ['qase-defeito']);
      const origens = new Set([...casos, ...autos, ...evid, ...runs, ...bugs, ...defs].map((v) => v.aresta?.origem).filter(Boolean));
      for (const x of [ticket, ...casos, ...autos, ...bugs, ...defs].filter(Boolean)) usados.add(x.id);
      linhas.push({ ticket: ticket ? nos.get(ticket.id) : null, features: colher(autos.map((a) => a.id), ['feature']), casos, autos, execs: [...runs, ...evid], defs: [...bugs, ...defs], origens });
    };
    for (const t of m.nos.filter((n) => n.tipo === 'jira')) montar({ id: t.id }, vizinhos(t.id, ['qase']));
    for (const c of m.nos.filter((n) => n.tipo === 'qase' && !usados.has(n.id))) montar(null, [{ id: c.id, aresta: null }]);
    // Cenários sem Qase continuam visíveis na trilha estática da feature.
    for (const f of m.nos.filter((n) => n.tipo === 'feature')) {
      const autos = vizinhos(f.id, ['automacao']).filter((a) => !usados.has(a.id));
      if (!autos.length) continue;
      autos.forEach((a) => usados.add(a.id));
      linhas.push({ ticket: null, features: [{ id: f.id, aresta: null }], casos: [], autos, execs: [], defs: [], origens: new Set(autos.map((a) => a.aresta.origem)) });
    }
    // Defeito do Qase e bug do Jira relacionados ficam na mesma trilha; o que sobrar vira uma linha própria.
    for (const d of m.nos.filter((n) => (n.tipo === 'qase-defeito' || n.tipo === 'jira-bug') && !usados.has(n.id))) {
      if (usados.has(d.id)) continue; const juntos = [{ id: d.id, aresta: null }, ...vizinhos(d.id, ['qase-defeito', 'jira-bug']).filter((v) => !usados.has(v.id))];
      for (const x of juntos) usados.add(x.id); linhas.push({ ticket: null, casos: [], autos: [], execs: [], defs: juntos, origens: new Set(juntos.map((v) => v.aresta?.origem).filter(Boolean)) });
    }
    const mem = memoria('rastro', e.id); const busca = DS.busca({ id: 'rastro-busca', placeholder: 'Buscar ticket, caso, automação ou evidência', valor: estado.ds?.rastroBusca ?? mem.q ?? '', rotulo: 'Buscar relações' }); if (estado.ds) delete estado.ds.rastroBusca;
    const mostrarSel = DS.selecao({ id: 'rastro-filtro', rotulo: 'Mostrar', opcoes: [['', 'Todas as trilhas'], ['lacunas', 'Com vínculos ausentes'], ['observado', 'Com resultado observado']], valor: mem.filtro || '' });
    const area = h('div', { id: 'rastro-area' });
    const celula = (lista, origemPadrao) => (lista.length ? h('div', { class: 'ds-celula-nos' }, lista.map((v) => botaoNo(e, nos.get(v.id) || { id: v.id, tipo: 'prumo', rotulo: v.id }, v.aresta?.origem || origemPadrao))) : h('span', { class: 'ds-falta' }, tr('ausente')));
    const textoLinha = (l) => [l.ticket, ...[...(l.features || []), ...l.casos, ...l.autos, ...l.execs, ...l.defs].map((v) => nos.get(v.id))].filter(Boolean).map((n) => n.rotulo + ' ' + n.id + ' ' + (n.detalhe || '')).join(' ').toLowerCase();
    const desenhar = () => {
      const q = busca.input.value.trim().toLowerCase(); mem.q = busca.input.value; mem.filtro = mostrarSel.value;
      const vis = linhas.filter((l) => (!q || textoLinha(l).includes(q)) && (mostrarSel.value !== 'lacunas' || !l.ticket || !l.casos.length || !l.autos.length || !l.execs.length) && (mostrarSel.value !== 'observado' || l.origens.has('OBSERVADO')));
      if (!linhas.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhuma relação registrada', 'Declare vínculos entre tickets e casos, ou execute fluxos do Prumo para registrar resultados.', [DS.acao('Declarar vínculo', () => declarar(e))])); return; }
      if (!vis.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhuma trilha para estes filtros')); return; }
      area.replaceChildren(DS.tabela({ id: 'rastro-tabela', colunas: ['Ticket', 'Feature', 'Caso', 'Automação', 'Execução · evidência', 'Defeito', 'Comprovação'], linhas: vis.map((l) => ({ attrs: { 'data-relacao-navegavel': '' }, celulas: [l.ticket ? botaoNo(e, l.ticket) : h('span', { class: 'ds-falta' }, tr('sem ticket')), celula(l.features || [], 'OBSERVADO_NO_CODIGO'), celula(l.casos, 'DECLARADO_PELO_USUARIO'), celula(l.autos), celula(l.execs), l.defs.length ? celula(l.defs) : '—',
        l.origens.has('OBSERVADO') ? DS.chip('Resultado observado', 'ok') : l.origens.has('OBSERVADO_NO_CODIGO') ? DS.chip('Lido no código · sem execução', 'info') : l.origens.size ? DS.chip(l.origens.has('REGISTRADO_PELO_PRUMO') ? 'Registrado pelo Prumo' : 'Declarado', 'info') : DS.chip('Sem comprovação')] })) }),
        h('div', { class: 'ds-legenda' }, h('span', { class: 'ds-no', 'data-origem': 'DECLARADO_PELO_USUARIO' }, tr('declarado pela pessoa')), h('span', { class: 'ds-no', 'data-origem': 'REGISTRADO_PELO_PRUMO' }, tr('registrado pelo Prumo')), h('span', { class: 'ds-no', 'data-origem': 'OBSERVADO' }, tr('observado em execução')), h('span', { class: 'ds-no', 'data-origem': 'OBSERVADO_NO_CODIGO' }, tr('lido no código · sem execução')), h('span', {}, tr('Vínculo declarado não comprova cobertura nem aprovação.'))));
    };
    busca.input.addEventListener('input', desenhar); mostrarSel.addEventListener('change', desenhar);
    corpo.append(DS.barra(busca.no, mostrarSel, projSel, h('span', { class: 'ds-meta-barra' }, tr('{n} trilha(s) · {l} lacuna(s)', { n: linhas.length, l: m.lacunas.length }))), area);
    if (m.lacunas.length) corpo.append(DS.secao(tr('Vínculos ausentes ({n})', { n: m.lacunas.length }), h('ul', { class: 'ds-lista', id: 'rastro-lacunas' }, m.lacunas.map((l) => h('li', {}, l.mensagem)))));
    desenhar();
  }
  function relacoes(e, m, corpo, projSel) {
    const origemTxt = { DECLARADO_PELO_USUARIO: 'Declarado por você', REGISTRADO_PELO_PRUMO: 'Registrado pelo Prumo', OBSERVADO: 'Observado em execução', OBSERVADO_NO_CODIGO: 'Lido no código · sem execução' };
    const { nos } = grafo(m); const nome = (id) => nos.get(id);
    corpo.append(projSel ? DS.barra(projSel) : null, h('div', { id: 'vinc-aviso', class: 'ds-alerta' }, DS.icone('escudo'), h('div', {}, m.aviso)));
    corpo.append(DS.secao(tr('Relações ({n})', { n: m.arestas.length }), m.arestas.length ? DS.tabela({ id: 'vinc-tabela', colunas: ['De', 'Relação', 'Para', 'Origem'], linhas: m.arestas.map((a) => ({ celulas: [botaoNo(e, nome(a.de) || { id: a.de, tipo: 'prumo', rotulo: a.de }), a.tipo + (a.nota ? ' · ' + a.nota : ''), botaoNo(e, nome(a.para) || { id: a.para, tipo: 'prumo', rotulo: a.para }), DS.chip(origemTxt[a.origem], a.origem === 'OBSERVADO' ? 'ok' : null)] })) }) : DS.estadoTela('vazio', 'Nenhuma relação ainda.', null, [], { compacto: true })));
    corpo.append(DS.secao('Lacunas de cadastro', m.lacunas.length ? h('ul', { id: 'vinc-lacunas', class: 'ds-lista' }, m.lacunas.map((l) => h('li', {}, l.mensagem))) : h('p', { class: 'suave' }, tr('Nenhuma lacuna de cadastro encontrada.'))));
    corpo.append(DS.secao('Operações externas recentes', m.operacoesRecentes.length ? h('ul', { id: 'vinc-operacoes', class: 'ds-lista' }, m.operacoesRecentes.map((o) => h('li', {}, seloOp(o.estado), ' ', o.resumo, h('span', { class: 'ds-sub' }, hora(o.em) + (o.remoto?.chave ? ' · ' + o.remoto.chave : ''))))) : h('p', { class: 'suave' }, tr('Nenhuma operação externa registrada.'))));
  }
  function declarar(e) {
    const vj = vinc(e, 'jira'), vq = vinc(e, 'qase'); const recarregar = () => { DS.fecharModal(); mostrar('rastreabilidade'); };
    const ticket = h('input', { id: 'rastro-ticket', placeholder: 'SMART-1', maxlength: 40 }), caso = h('input', { id: 'rastro-caso', placeholder: '31', maxlength: 20 }), porque = h('input', { id: 'rastro-justificativa', maxlength: 1000 });
    const vcaso = h('input', { id: 'vinc-caso', type: 'number', min: 1 }), vcap = h('input', { id: 'vinc-cap', maxlength: 100, placeholder: 'unit ou unit#C1' }), vjust = h('input', { id: 'vinc-just', maxlength: 500, value: tr('Declarado pela pessoa') });
    const [nav, painel] = DS.abasModal([
      ['tc', tr('Ticket ↔ caso'), null, () => (vj && vq ? [h('p', { class: 'suave' }, tr('O Prumo confere o ticket e o caso nos projetos vinculados antes de registrar.')), h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Chave do ticket', ticket), DS.campo('ID do caso no Qase', caso), DS.campo('Justificativa', porque, { inteiro: true }), h('div', { class: 'ds-form-acoes' }, DS.acao('Conferir origens e declarar vínculo', async () => {
        const t = await chamar(() => api.servicoConsultar(e.id, 'jira', 'ticket', {}, ticket.value.trim().toUpperCase())); if (!t) return; const c = await chamar(() => api.servicoConsultar(e.id, 'qase', 'caso', {}, caso.value.trim())); if (!c) return;
        const r = await chamar(() => api.espacoAssociar(e.id, { de: { tipo: 'jira', id: ticket.value.trim().toUpperCase(), vinculoId: vj.id, origem: t.origem }, para: { tipo: 'qase', id: String(c.dados.id), vinculoId: vq.id, origem: c.origem }, justificativa: porque.value })); if (r) { avisar(tr('Vínculo declarado.')); recarregar(); } }, { id: 'rastro-salvar', primaria: true })))] : [DS.estadoTela('vazio', 'Vincule Jira e Qase deste projeto para declarar uma associação ticket–caso.', null, [DS.acao('Abrir Conexões', () => { DS.fecharModal(); mostrar('conexoes'); })], { compacto: true })])],
      ['ca', tr('Caso → automação'), null, () => (vq ? [h('p', { class: 'suave' }, tr('Cenário do Qase → automação declarada no qa.project.json (capability ou capability#cenário).')), h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('ID do caso no Qase', vcaso), DS.campo('Capability ou capability#cenário', vcap), DS.campo('Justificativa', vjust, { inteiro: true }), h('div', { class: 'ds-form-acoes' }, DS.acao('Declarar vínculo', async () => {
        const r = await chamar(() => api.espacoAssociar(e.id, { de: { tipo: 'qase', id: String(vcaso.value), vinculoId: vq.id, origem: vq.recurso.chave }, para: { tipo: 'automacao', id: vcap.value.trim(), origem: 'qa.project.json' }, justificativa: vjust.value })); if (r) { avisar(tr('Vínculo declarado.')); recarregar(); } }, { id: 'vinc-salvar', primaria: true })))] : [DS.estadoTela('vazio', 'Vincule o Qase primeiro.', null, [], { compacto: true })])]
    ]);
    DS.modal('Declarar vínculo', [nav, painel, DS.alerta('Um vínculo declarado registra a sua decisão. Não comprova cobertura nem execução.', null, 'escudo')], { tamanho: 'md' });
  }
  window.PrumoFluxos = Object.freeze({ abrirTicket, abrirDefeito, abrirCaso, abrirCriar, abrirRunLocal, telaCasos, telaSuites, telaPlanos, telaRuns, novaProposta, novaSuite, novoPlano, prepararRun, avancadaQase, carregarQase, tipoCaso, chipTipoCaso, rotuloTipoCaso, resultadosLocais, ticketsExternos, memoria, vinc, relacoesDe, outroLado, noRef });
})();


