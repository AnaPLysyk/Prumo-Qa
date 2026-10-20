/** Tickets: listagem, busca, filtros e fontes Jira, Qase, GitHub e locais. */
  // Valores do Qase chegam em inglês e em minúsculas: viram rótulos do aplicativo.
  const rotuloStatusDefeito = (s) => tr({ open: 'Aberto', in_progress: 'Em andamento', resolved: 'Resolvido', invalid: 'Inválido' }[s] || String(s));
  const rotuloSeveridade = (s) => tr({ blocker: 'Bloqueador', critical: 'Crítica', major: 'Maior', normal: 'Normal', minor: 'Menor', trivial: 'Trivial' }[s] || String(s));
  async function tiposJira(e) {
    const m = memoriaDaTela('jira-meta', e.id);
    if (!m.tipos) { const r = await api.servicoConsultar(e.id, 'jira', 'metadados'); m.tipos = r.ok ? (r.data.dados || []).filter((t) => !t.subtarefa) : []; m.erro = r.ok ? null : r.error; }
    return m;
  }
  abas.tickets = async (el) => {
    const e = estado.espaco; if (!e) return el.append(...semProjetoDS('Tickets'));
    const vj = vinc(e, 'jira'), vq = vinc(e, 'qase'), vg = vinc(e, 'github');
    const perm = await escritaDoProjeto(e); const escJira = !!perm.jira;
    const mem = memoriaDaTela('tickets', e.id); const f = (mem.filtros ||= { q: '', origem: '', tipo: '', status: '', desde: '', ate: '' });
    const fontesCab = [vj && DS.origem('jira', 'Jira · ' + vj.recurso.chave), vq && DS.origem('qase', 'Qase · ' + vq.recurso.chave), vg && DS.origem('github', 'GitHub · ' + vg.recurso.chave), DS.origem('prumo', tr('Locais (Prumo)')),
      vj && !escJira ? h('span', { class: 'ds-chip', 'data-escrita-desligada': 'jira', title: tr('Escrita no Jira desligada. Habilite em Conexões.') }, tr('Jira somente leitura')) : null].filter(Boolean);
    const contagem = h('span');
    const cab = DS.cabecalho({ titulo: 'Tickets', contagem: 0, idContagem: 'tk-contagem', descricao: fontesCab.some((x) => x.hasAttribute('data-escrita-desligada')) ? [h('span', { class: 'ds-chips' }, fontesCab.filter((x) => x.hasAttribute('data-escrita-desligada')))] : null,
      acoes: [vj && DS.acao('Consulta avançada', () => avancada(e), { id: 'tk-avancada', icone: 'filtro' }), DS.acao('Novo rascunho local', () => abrirLocalNovo(e, () => buscar()), { id: 'tk-novo-local', icone: 'mais', primaria: !vj }), vj && DS.acao('Novo ticket', () => abrirCriar(e, {}), { id: 'tk-novo', primaria: true, icone: 'mais' })] });
    void contagem;
    const q = DS.busca({ id: 'tk-q', placeholder: 'Buscar por chave ou texto', valor: f.q, aoEnter: () => buscar() });
    const origem = DS.selecao({ id: 'tk-origem', rotulo: 'Origem', opcoes: [['', 'Todas as origens'], vj ? ['jira', 'Jira'] : null, vq ? ['qase', 'Defeitos Qase'] : null, vg ? ['github', 'GitHub Issues'] : null, ['prumo', 'Locais (Prumo)']].filter(Boolean), valor: f.origem, aoMudar: () => { tipo.disabled = origem.value === 'qase' || origem.value === 'github' || origem.value === 'prumo'; } });
    const tipo = DS.selecao({ id: 'tk-tipo', rotulo: 'Tipo', opcoes: [['', 'Todos os tipos']], valor: '' });
    const status = h('input', { id: 'tk-status', placeholder: tr('Filtrar por status'), 'aria-label': tr('Status'), list: 'tk-status-opcoes', maxlength: 60, value: f.status, autocomplete: 'off' });
    const sugestoes = h('datalist', { id: 'tk-status-opcoes' });
    const desde = h('input', { id: 'tk-desde', type: 'date', 'aria-label': tr('Atualizado desde'), value: f.desde }); const ate = h('input', { id: 'tk-ate', type: 'date', 'aria-label': tr('Atualizado até'), value: f.ate });
    for (const c of [status, desde, ate]) c.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); void buscar(); } });
    const fontes = h('div', { class: 'ds-fontes', id: 'tk-fontes', 'aria-live': 'polite' }); const lista = h('div', { id: 'tk-lista' });
    el.append(cab, DS.barra(q.no, origem, vj ? tipo : null, status, sugestoes, h('span', { class: 'ds-periodo' }, tr('Atualizado'), desde, tr('até'), ate), DS.acao('Buscar', () => buscar(), { id: 'tk-buscar', icone: 'busca' })), fontes, lista);
    if (origem) tipo.disabled = origem.value === 'qase' || origem.value === 'github' || origem.value === 'prumo';
    if (vj) void tiposJira(e).then((m) => { for (const t of m.tipos) tipo.append(h('option', { value: t.nome, selected: t.nome === f.tipo }, t.nome)); });

    const lerFiltros = () => { f.q = q.input.value.trim(); f.origem = origem.value || ''; f.tipo = tipo.value; f.status = status.value.trim(); f.desde = desde.value; f.ate = ate.value; };
    async function consultarJira(pagina) {
      const fj = {}; for (const k of ['q', 'tipo', 'status', 'desde', 'ate']) if (f[k]) fj[k] = f[k];
      const r = await api.servicoConsultar(e.id, 'jira', 'tickets', pagina, undefined, fj);
      if (!r.ok) { avisar(r.error, true); return { erro: r.error }; }
      return { itens: r.data.dados || [], proxima: r.data.proxima, em: r.data.consultadoEm, origem: r.data.origem };
    }
    async function consultarQase(offset) {
      // Status oficial do Qase (ex.: open) vai para a API e filtra todas as páginas; outro texto só filtra o que já foi carregado.
      const statusQase = ['open', 'in_progress', 'resolved', 'invalid'].includes(f.status) ? { status: f.status } : undefined;
      const r = await api.servicoConsultar(e.id, 'qase', 'defeitos', { offset, limite: 25 }, undefined, statusQase);
      if (!r.ok) { avisar(r.error, true); return { erro: r.error }; }
      return { itens: r.data.dados || [], proxima: r.data.proxima, em: r.data.consultadoEm, origem: r.data.origem };
    }
    // GitHub Issues abertas do repositório vinculado (a API mistura PRs; o núcleo já os retira).
    async function consultarGithub(offset) {
      const r = await api.servicoConsultar(e.id, 'github', 'issues', { offset, limite: 25 });
      if (!r.ok) { avisar(r.error, true); return { erro: r.error }; }
      return { itens: r.data.dados || [], proxima: r.data.proxima, em: r.data.consultadoEm, origem: r.data.origem };
    }
    async function buscar() {
      if (desde.value && ate.value && desde.value > ate.value) { avisar(tr('A data inicial deve ser anterior à data final.'), true); return; }
      lerFiltros(); const versao = (mem.versao = (mem.versao || 0) + 1);
      lista.replaceChildren(DS.esqueleto(6)); lista.setAttribute('aria-busy', 'true'); fontes.replaceChildren(h('span', { role: 'status' }, h('span', { class: 'ds-giro' }), tr('Consultando…')));
      const [jira, qase, github, locais] = await Promise.all([vj && (!f.origem || f.origem === 'jira') ? consultarJira({ offset: 0, limite: 25 }) : null, vq && (!f.origem || f.origem === 'qase') ? consultarQase(0) : null, vg && (!f.origem || f.origem === 'github') ? consultarGithub(0) : null, !f.origem || f.origem === 'prumo' ? carregarLocais(e) : null]);
      if (versao !== mem.versao) return;
      mem.jira = jira; mem.qase = qase; mem.github = github; mem.locais = locais; mem.carregado = true; desenhar();
    }
    async function maisJira() { const r = await consultarJira(typeof mem.jira.proxima === 'string' ? { cursor: mem.jira.proxima, limite: 25 } : { offset: mem.jira.proxima, limite: 25 }); if (r.erro) return; mem.jira = { ...r, itens: mem.jira.itens.concat(r.itens) }; desenhar(); }
    async function maisQase() { const r = await consultarQase(mem.qase.proxima); if (r.erro) return; mem.qase = { ...r, itens: mem.qase.itens.concat(r.itens) }; desenhar(); }
    async function maisGithub() { const r = await consultarGithub(mem.github.proxima); if (r.erro) return; mem.github = { ...r, itens: mem.github.itens.concat(r.itens) }; desenhar(); }
    function linhasTabela() {
      const L = []; const st = f.status.toLowerCase(); const qq = f.q.toLowerCase();
      // Rascunho local já publicado: quando o item remoto está na lista, ele aparece uma vez só (linha do serviço, marcada "publicado pelo Prumo").
      const remotosNaLista = new Set([...(mem.jira?.itens || []).map((i) => i.key), ...(vq ? (mem.qase?.itens || []).map((d) => vq.recurso.chave + '-' + d.id) : []), ...(mem.github?.itens || []).map((i) => '#' + i.numero)]);
      const publicadosPeloPrumo = new Set((mem.locais?.itens || []).filter((p) => p.estado === 'PUBLICADA' && p.remoto?.chave && remotosNaLista.has(p.remoto.chave)).map((p) => p.remoto.chave));
      const marcaPrumo = (chave) => (publicadosPeloPrumo.has(chave) ? DS.chip(tr('publicado pelo Prumo'), 'info') : null);
      for (const i of mem.jira?.itens || []) { const x = i.fields || {}; const n = relacoesDe(e, ['jira', 'jira-bug'], i.key).length;
        L.push({ ordem: Date.parse(x.updated || 0) || 0, attrs: { 'data-ticket': i.key, 'data-origem': 'jira' }, abrir: () => abrirTicket(e, i.key), rotuloAcessivel: null,
          celulas: [DS.origem('jira'), { no: i.key, classe: 'ds-id' }, h('span', { class: 'ds-resumo-texto' }, x.summary || '—', ' ', marcaPrumo(i.key)), x.issuetype?.name ? DS.chip(x.issuetype.name) : '—', x.status?.name ? DS.chip(x.status.name, tomStatusJira(x.status)) : '—', x.priority?.name || '—', vj.recurso.chave, { no: hora(x.updated), classe: 'ds-nowrap' }, n ? DS.chip(tr('{n} vínculo(s)', { n }), 'info') : '—'] }); }
      for (const p of mem.locais?.itens || []) {
        if (p.estado === 'PUBLICADA' && publicadosPeloPrumo.has(p.remoto?.chave)) continue;
        const chave = p.remoto?.chave || ('LOCAL-' + p.id.slice(0, 6).toUpperCase()); const estadoTxt = p.estado === 'VINCULADA' ? tr('Vinculada') : p.estado === 'PUBLICADA' ? tr('Publicada') : tr('Local');
        if (st && !estadoTxt.toLowerCase().includes(st)) continue; if (qq && !(chave + ' ' + p.titulo).toLowerCase().includes(qq)) continue;
        L.push({ ordem: Date.parse(p.atualizadaEm || 0) || 0, attrs: { 'data-local': p.id, 'data-origem': 'prumo' }, abrir: () => abrirLocal(e, p, () => buscar()), rotuloAcessivel: null,
          celulas: [h('span', { class: 'ds-chips' }, DS.origem('prumo', 'Prumo'), DS.chip(origemDoLocal(p))), { no: chave, classe: 'ds-id' }, h('span', { class: 'ds-resumo-texto' }, p.titulo), DS.chip(rotuloClassificacao(p.dados.classificacao)), DS.chip(estadoTxt, p.estado === 'RASCUNHO' || p.estado === 'REVISADA' ? 'aviso' : 'ok'), '—', '—', { no: hora(p.atualizadaEm), classe: 'ds-nowrap' }, p.falhaDeOrigem ? DS.chip(tr('Falha do caso {c}', { c: p.falhaDeOrigem.casoId }), 'info') : '—'] });
      }
      for (const d of mem.qase?.itens || []) {
        if (st && !String(d.status ?? '').toLowerCase().includes(st)) continue; if (qq && !(String(d.id) + ' ' + (d.title || '')).toLowerCase().includes(qq)) continue;
        const n = relacoesDe(e, ['qase-defeito'], d.id).length;
        L.push({ ordem: Date.parse(d.updated_at || 0) || 0, attrs: { 'data-defeito': String(d.id), 'data-origem': 'qase' }, abrir: () => abrirDefeito(e, d.id), rotuloAcessivel: null,
          celulas: [DS.origem('qase'), { no: vq.recurso.chave + '-' + d.id, classe: 'ds-id' }, h('span', { class: 'ds-resumo-texto' }, d.title || '—', ' ', marcaPrumo(vq.recurso.chave + '-' + d.id)), DS.chip('Defeito'), d.status != null ? DS.chip(rotuloStatusDefeito(d.status), d.status === 'resolved' ? 'ok' : d.status === 'open' ? 'aviso' : null) : '—', d.severity != null ? rotuloSeveridade(d.severity) : '—', vq.recurso.chave, { no: hora(d.updated_at), classe: 'ds-nowrap' }, n ? DS.chip(tr('{n} vínculo(s)', { n }), 'info') : '—'] });
      }
      for (const i of mem.github?.itens || []) {
        if (st && !String(i.estado ?? '').toLowerCase().includes(st)) continue; if (qq && !('#' + i.numero + ' ' + (i.titulo || '')).toLowerCase().includes(qq)) continue;
        const rot = Array.isArray(i.rotulos) ? i.rotulos : [];
        L.push({ ordem: Date.parse(i.atualizado || 0) || 0, attrs: { 'data-issue': String(i.numero), 'data-origem': 'github' }, abrir: () => abrirIssue(e, i), rotuloAcessivel: null,
          celulas: [DS.origem('github'), { no: '#' + i.numero, classe: 'ds-id' }, h('span', { class: 'ds-resumo-texto' }, i.titulo || '—', ' ', marcaPrumo('#' + i.numero)), rot.length ? DS.chip(rot.slice(0, 2).join(', ')) : DS.chip('Issue'), DS.chip(i.estado === 'open' ? tr('Aberta') : i.estado === 'closed' ? tr('Fechada') : String(i.estado), i.estado === 'open' ? 'aviso' : 'ok'), '—', vg.recurso.chave, { no: hora(i.atualizado), classe: 'ds-nowrap' }, '—'] });
      }
      return L.sort((a, b) => b.ordem - a.ordem);
    }
    function linhaFonte(servico, r, mais) {
      if (!r) return null; const nome = { jira: 'Jira', qase: 'Qase', github: 'GitHub' }[servico];
      if (r.erro) return h('span', { role: 'status', 'data-fonte': servico }, DS.origem(servico, nome), ' ', DS.chip(r.erro, 'falha'));
      return h('span', { role: 'status', 'data-fonte': servico }, DS.origem(servico, nome), tr(servico === 'jira' ? '{n} ticket(s) · consultado {q}' : servico === 'github' ? '{n} issue(s) aberta(s) · consultado {q}' : '{n} defeito(s) · consultado {q}', { n: r.itens.length, q: hora(r.em) }), r.proxima !== null && r.proxima !== undefined ? DS.link('Carregar mais', mais, { id: 'tk-mais-' + servico, seta: false }) : null);
    }
    function desenhar() {
      lista.setAttribute('aria-busy', 'false');
      fontes.replaceChildren(...[linhaFonte('jira', mem.jira, maisJira), linhaFonte('qase', mem.qase, maisQase), linhaFonte('github', mem.github, maisGithub), mem.locais ? h('span', { role: 'status', 'data-fonte': 'prumo' }, DS.origem('prumo', 'Prumo'), tr('{n} ticket(s) local(is) neste computador', { n: mem.locais.itens.length })) : null].filter(Boolean));
      sugestoes.replaceChildren(...[...new Set((mem.jira?.itens || []).map((i) => i.fields?.status?.name).filter(Boolean))].map((s) => h('option', { value: s })));
      const L = linhasTabela(); const n = cab.querySelector('#tk-contagem'); if (n) n.textContent = String(L.length);
      const erros = [mem.jira?.erro, mem.qase?.erro, mem.github?.erro].filter(Boolean);
      if (!L.length) { lista.replaceChildren(erros.length && erros.length === [mem.jira, mem.qase, mem.github, mem.locais].filter(Boolean).length ? DS.estadoTela('erro', 'Não foi possível consultar as fontes', erros.join(' · '), [DS.acao('Tentar novamente', () => buscar())])
        : DS.estadoTela('vazio', 'Nenhum ticket encontrado', mem.qase && !mem.qase.erro && !mem.qase.itens.length && !mem.jira ? 'Nenhum defeito retornado pelo Qase.' : 'Ajuste os filtros ou a origem e busque novamente. Falhas de runs e tickets criados à mão aparecem em Locais (Prumo).')); return; }
      lista.replaceChildren(DS.tabela({ id: 'tk-tabela', colunas: ['Origem', 'ID', 'Resumo', 'Tipo', 'Status', { t: 'Prioridade', classe: 'ds-opcional' }, { t: 'Projeto', classe: 'ds-opcional' }, 'Atualização', { t: 'Vínculos', classe: 'ds-opcional' }], linhas: L }));
    }
    if (mem.carregado) void desenhar(); else void buscar();
  };
