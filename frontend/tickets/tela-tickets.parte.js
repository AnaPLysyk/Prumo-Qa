/** Tickets: tela unificada de origem local, Jira, Qase e GitHub; seções internas mantêm as regras de cada serviço. */
  // Valores do Qase chegam em inglês e em minúsculas: viram rótulos do aplicativo.
  const rotuloStatusDefeito = (s) => tr({ open: 'Aberto', in_progress: 'Em andamento', resolved: 'Resolvido', invalid: 'Inválido' }[s] || String(s));
  const rotuloSeveridade = (s) => tr({ blocker: 'Bloqueador', critical: 'Crítica', major: 'Maior', normal: 'Normal', minor: 'Menor', trivial: 'Trivial' }[s] || String(s));
  async function tiposJira(e) {
    const m = memoriaDaTela('jira-meta', e.id);
    if (m.tipos) return m;
    const r = await api.servicoConsultar(e.id, 'jira', 'metadados');
    if (r.ok) { m.tipos = (r.data.dados || []).filter((t) => !t.subtarefa); m.erro = null; return m; }
    return { tipos: [], erro: r.error };
  }
  // Ferramentas de tickets ligadas ao projeto (vínculo que não está desligado). Com escrita habilitada (modo Integrado), o Prumo cria direto nelas.
  const ferramentasDoTicket = (e, perm) => [['jira', 'Jira'], ['qase', 'Qase'], ['github', 'GitHub']]
    .map(([servico, nome]) => ({ servico, nome, vinculo: vinc(e, servico), escrita: !!perm[servico] }))
    .filter((x) => x.vinculo && !x.vinculo.desligado);
  abas.tickets = async (el) => {
    const e = estado.espaco; if (!e) return el.append(...semProjetoDS('Tickets'));
    const vj = vinc(e, 'jira'), vq = vinc(e, 'qase'), vg = vinc(e, 'github');
    const perm = await escritaDoProjeto(e);
    const mem = memoriaDaTela('tickets', e.id); const f = (mem.filtros ||= { q: '', origem: '', tipo: '', situacao: '', periodo: '' });
    // Um "Novo ticket" só: cria direto na ferramenta integrada ou, sem nenhuma, fica no Prumo. Ferramenta em Só ver aparece como somente leitura.
    const ferramentas = ferramentasDoTicket(e, perm); const podeCriar = ferramentas.some((x) => x.escrita) || e.manualAtivo !== false;
    const somenteLeitura = ferramentas.filter((x) => !x.escrita).map((x) => h('span', { class: 'ds-chip', 'data-escrita-desligada': x.servico, title: tr('Escrita no {s} desligada. Habilite em Projetos — Conexões.', { s: x.nome }) }, tr('{s} somente leitura', { s: x.nome })));
    const contagem = h('span');
    const cab = DS.cabecalho({ titulo: 'Tickets', contagem: 0, idContagem: 'tk-contagem', descricao: somenteLeitura.length || !podeCriar ? [somenteLeitura.length ? h('span', { class: 'ds-chips' }, somenteLeitura) : null, !podeCriar ? h('span', { class: 'suave', id: 'tk-novo-motivo' }, tr('Para criar tickets, ative Manual/Prumo ou habilite a escrita de Qase, Jira ou GitHub em Projetos.')) : null] : null,
      acoes: [DS.acao('Novo ticket', () => abrirNovoTicket(e, () => buscar()), { id: 'tk-novo', primaria: true, icone: 'mais', desabilitado: !podeCriar })] });
    void contagem;
    const q = DS.busca({ id: 'tk-q', placeholder: 'Buscar por chave ou texto', valor: f.q, aoEnter: () => buscar() });
    const origem = DS.selecao({ id: 'tk-origem', rotulo: 'Origem', opcoes: [['', 'Todas as origens'], vj ? ['jira', 'Jira'] : null, vq ? ['qase', 'Defeitos Qase'] : null, vg ? ['github', 'GitHub Issues'] : null, e.manualAtivo !== false ? ['prumo', 'Locais (Prumo)'] : null].filter(Boolean), valor: f.origem });
    const tipo = DS.selecao({ id: 'tk-tipo', rotulo: 'Tipo', opcoes: [['', 'Todos os tipos']], valor: '' });
    // Situação e período valem igual para todas as origens; cada serviço traduz o próprio status para aberto, em andamento ou concluído.
    const situacao = DS.selecao({ id: 'tk-situacao', rotulo: 'Situação', opcoes: [['', 'Todas as situações'], ['aberto', 'Abertos'], ['andamento', 'Em andamento'], ['concluido', 'Concluídos']], valor: f.situacao, aoMudar: () => void buscar() });
    const periodo = DS.selecao({ id: 'tk-periodo', rotulo: 'Atualizado', opcoes: [['', 'Qualquer data'], ['1', 'Atualizados hoje'], ['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias']], valor: f.periodo, aoMudar: () => void buscar() });
    const fontes = h('div', { class: 'ds-fontes', id: 'tk-fontes', 'aria-live': 'polite' }); const lista = h('div', { id: 'tk-lista' });
    el.append(cab, DS.barra(q.no, origem, vj ? tipo : null, situacao, periodo), fontes, lista);
    if (origem) tipo.disabled = origem.value === 'qase' || origem.value === 'github' || origem.value === 'prumo';
    if (vj) void tiposJira(e).then((m) => { for (const t of m.tipos) tipo.append(h('option', { value: t.nome, selected: t.nome === f.tipo }, t.nome)); });

    const lerFiltros = () => { f.q = q.input.value.trim(); f.origem = origem.value || ''; f.tipo = tipo.value; f.situacao = situacao.value; f.periodo = periodo.value; };
    // "Últimos N dias" inclui hoje: começa à meia-noite local de N-1 dias atrás (AAAA-MM-DD, o formato que o Jira também recebe).
    const inicioDoPeriodo = () => {
      const d = new Date(); d.setDate(d.getDate() - (Number(f.periodo) - 1));
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };
    const dentroDoPeriodo = (valor) => {
      if (!f.periodo) return true;
      const data = Date.parse(valor || '');
      return Number.isFinite(data) && data >= Date.parse(inicioDoPeriodo() + 'T00:00:00');
    };
    const naSituacao = (s) => !f.situacao || s === f.situacao;
    const textoInclui = (valor) => !f.q || String(valor || '').toLocaleLowerCase().includes(f.q.toLocaleLowerCase());
    const atualizarFiltros = () => {
      tipo.disabled = origem.value === 'qase' || origem.value === 'github' || origem.value === 'prumo';
      if (tipo.disabled) tipo.value = '';
      void buscar();
    };
    origem.addEventListener('change', atualizarFiltros);
    tipo.addEventListener('change', () => void buscar());
    async function consultarJira(pagina) {
      const fj = {}; for (const k of ['q', 'tipo', 'situacao']) if (f[k]) fj[k] = f[k];
      if (f.periodo) fj.desde = inicioDoPeriodo();
      const r = await api.servicoConsultar(e.id, 'jira', 'tickets', pagina, undefined, fj);
      if (!r.ok) { avisar(r.error, true); return { erro: r.error }; }
      return { itens: r.data.dados || [], proxima: r.data.proxima, em: r.data.consultadoEm, origem: r.data.origem };
    }
    async function consultarQase(offset) {
      // Aberto e em andamento são um status só no Qase e vão para a API; concluído (resolved ou invalid) filtra o que foi carregado.
      const statusQase = { aberto: 'open', andamento: 'in_progress' }[f.situacao];
      const r = await api.servicoConsultar(e.id, 'qase', 'defeitos', { offset, limite: 25 }, undefined, statusQase ? { status: statusQase } : undefined);
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
      lerFiltros(); const versao = (mem.versao = (mem.versao || 0) + 1);
      lista.replaceChildren(DS.esqueleto(6)); lista.setAttribute('aria-busy', 'true'); fontes.replaceChildren(h('span', { role: 'status' }, h('span', { class: 'ds-giro' }), tr('Consultando…')));
      const [jira, qase, github, locais] = await Promise.all([vj && (!f.origem || f.origem === 'jira') ? consultarJira({ offset: 0, limite: 25 }) : null, vq && (!f.origem || f.origem === 'qase') ? consultarQase(0) : null, vg && (!f.origem || f.origem === 'github') ? consultarGithub(0) : null, e.manualAtivo !== false && (!f.origem || f.origem === 'prumo') ? carregarLocais(e) : null]);
      if (versao !== mem.versao) return;
      mem.jira = jira; mem.qase = qase; mem.github = github; mem.locais = locais; mem.carregado = true; desenhar();
    }
    async function maisJira() { const r = await consultarJira(typeof mem.jira.proxima === 'string' ? { cursor: mem.jira.proxima, limite: 25 } : { offset: mem.jira.proxima, limite: 25 }); if (r.erro) return; mem.jira = { ...r, itens: mem.jira.itens.concat(r.itens) }; desenhar(); }
    async function maisQase() { const r = await consultarQase(mem.qase.proxima); if (r.erro) return; mem.qase = { ...r, itens: mem.qase.itens.concat(r.itens) }; desenhar(); }
    async function maisGithub() { const r = await consultarGithub(mem.github.proxima); if (r.erro) return; mem.github = { ...r, itens: mem.github.itens.concat(r.itens) }; desenhar(); }
    function linhasTabela() {
      const L = [];
      // Rascunho local já publicado: quando o item remoto está na lista, ele aparece uma vez só (linha do serviço, marcada "publicado pelo Prumo").
      const remotosNaLista = new Set([...(mem.jira?.itens || []).map((i) => i.key), ...(vq ? (mem.qase?.itens || []).map((d) => vq.recurso.chave + '-' + d.id) : []), ...(mem.github?.itens || []).map((i) => '#' + i.numero)]);
      const publicadosPeloPrumo = new Set((mem.locais?.itens || []).filter((p) => p.estado === 'PUBLICADA' && p.remoto?.chave && remotosNaLista.has(p.remoto.chave)).map((p) => p.remoto.chave));
      const marcaPrumo = (chave) => (publicadosPeloPrumo.has(chave) ? DS.chip(tr('publicado pelo Prumo'), 'info') : null);
      for (const i of mem.jira?.itens || []) { const x = i.fields || {};
        if (!textoInclui(i.key + ' ' + x.summary) || !naSituacao({ new: 'aberto', indeterminate: 'andamento', done: 'concluido' }[x.status?.statusCategory?.key]) || (f.tipo && x.issuetype?.name !== f.tipo) || !dentroDoPeriodo(x.updated)) continue;
        const n = relacoesDe(e, ['jira', 'jira-bug'], i.key).length;
        L.push({ ordem: Date.parse(x.updated || 0) || 0, attrs: { 'data-ticket': i.key, 'data-origem': 'jira' }, abrir: () => abrirTicket(e, i.key), rotuloAcessivel: null,
          celulas: [DS.origem('jira'), { no: i.key, classe: 'ds-id' }, h('span', { class: 'ds-resumo-texto' }, x.summary || '—', ' ', marcaPrumo(i.key)), x.issuetype?.name ? DS.chip(x.issuetype.name) : '—', x.status?.name ? DS.chip(x.status.name, tomStatusJira(x.status)) : '—', x.priority?.name || '—', vj.recurso.chave, { no: hora(x.updated), classe: 'ds-nowrap' }, n ? DS.chip(tr('{n} vínculo(s)', { n }), 'info') : '—'] }); }
      for (const p of mem.locais?.itens || []) {
        if (p.estado === 'PUBLICADA' && publicadosPeloPrumo.has(p.remoto?.chave)) continue;
        const chave = p.remoto?.chave || ('LOCAL-' + p.id.slice(0, 6).toUpperCase()); const estadoTxt = p.estado === 'VINCULADA' ? tr('Vinculada') : p.estado === 'PUBLICADA' ? tr('Publicada') : tr('Local');
        if (!naSituacao(p.estado === 'VINCULADA' || p.estado === 'PUBLICADA' ? 'concluido' : 'aberto') || !textoInclui(chave + ' ' + p.titulo)) continue;
        const atualizado = Date.parse(p.atualizadaEm || 0) || 0;
        if (!dentroDoPeriodo(p.atualizadaEm)) continue;
        L.push({ ordem: atualizado, attrs: { 'data-local': p.id, 'data-origem': 'prumo' }, abrir: () => abrirLocal(e, p, () => buscar()), rotuloAcessivel: null,
          celulas: [h('span', { class: 'ds-chips' }, DS.origem('prumo', 'Prumo'), DS.chip(origemDoLocal(p))), { no: chave, classe: 'ds-id' }, h('span', { class: 'ds-resumo-texto' }, p.titulo), DS.chip(rotuloClassificacao(p.dados.classificacao)), DS.chip(estadoTxt, p.estado === 'RASCUNHO' || p.estado === 'REVISADA' ? 'aviso' : 'ok'), '—', '—', { no: hora(p.atualizadaEm), classe: 'ds-nowrap' }, p.falhaDeOrigem ? DS.chip(tr('Falha do caso {c}', { c: p.falhaDeOrigem.casoId }), 'info') : '—'] });
      }
      for (const d of mem.qase?.itens || []) {
        if (!naSituacao({ open: 'aberto', in_progress: 'andamento', resolved: 'concluido', invalid: 'concluido' }[d.status]) || !textoInclui(String(d.id) + ' ' + (d.title || ''))) continue;
        const atualizado = Date.parse(d.updated_at || 0) || 0;
        if (!dentroDoPeriodo(d.updated_at)) continue;
        const n = relacoesDe(e, ['qase-defeito'], d.id).length;
        L.push({ ordem: atualizado, attrs: { 'data-defeito': String(d.id), 'data-origem': 'qase' }, abrir: () => abrirDefeito(e, d.id), rotuloAcessivel: null,
          celulas: [DS.origem('qase'), { no: vq.recurso.chave + '-' + d.id, classe: 'ds-id' }, h('span', { class: 'ds-resumo-texto' }, d.title || '—', ' ', marcaPrumo(vq.recurso.chave + '-' + d.id)), DS.chip('Defeito'), d.status != null ? DS.chip(rotuloStatusDefeito(d.status), d.status === 'resolved' ? 'ok' : d.status === 'open' ? 'aviso' : null) : '—', d.severity != null ? rotuloSeveridade(d.severity) : '—', vq.recurso.chave, { no: hora(d.updated_at), classe: 'ds-nowrap' }, n ? DS.chip(tr('{n} vínculo(s)', { n }), 'info') : '—'] });
      }
      for (const i of mem.github?.itens || []) {
        if (!naSituacao(i.estado === 'closed' ? 'concluido' : 'aberto') || !textoInclui('#' + i.numero + ' ' + (i.titulo || ''))) continue;
        const atualizado = Date.parse(i.atualizado || 0) || 0;
        if (!dentroDoPeriodo(i.atualizado)) continue;
        const rot = Array.isArray(i.rotulos) ? i.rotulos : [];
        L.push({ ordem: atualizado, attrs: { 'data-issue': String(i.numero), 'data-origem': 'github' }, abrir: () => abrirIssue(e, i), rotuloAcessivel: null,
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
      const L = linhasTabela(); const n = cab.querySelector('#tk-contagem'); if (n) n.textContent = String(L.length);
      const erros = [mem.jira?.erro, mem.qase?.erro, mem.github?.erro].filter(Boolean);
      if (!L.length) { lista.replaceChildren(erros.length && erros.length === [mem.jira, mem.qase, mem.github, mem.locais].filter(Boolean).length ? DS.estadoTela('erro', 'Não foi possível consultar as fontes', erros.join(' · '), [DS.acao('Tentar novamente', () => buscar())])
        : DS.estadoTela('vazio', 'Nenhum ticket encontrado', mem.qase && !mem.qase.erro && !mem.qase.itens.length && !mem.jira ? 'Nenhum defeito retornado pelo Qase.' : 'Ajuste os filtros ou a origem e busque novamente. Falhas de runs e tickets criados à mão aparecem em Locais (Prumo).')); return; }
      lista.replaceChildren(DS.tabela({ id: 'tk-tabela', colunas: ['Origem', 'ID', 'Resumo', 'Tipo', 'Status', { t: 'Prioridade', classe: 'ds-opcional' }, { t: 'Projeto', classe: 'ds-opcional' }, 'Atualização', { t: 'Vínculos', classe: 'ds-opcional' }], linhas: L }));
    }
    if (mem.carregado) void desenhar(); else void buscar();
  };

  // ======================= Tickets locais (Prumo) =======================
  // Rascunho de bug/melhoria guardado só neste computador: nasce de uma falha de run ou é criado à mão, sem Jira. Pode ser vinculado a um ticket
  // existente (o Prumo só guarda a chave) ou publicado no Jira com confirmação. Nada vai ao Jira sem a pessoa decidir.
  const classificacoesFalha = [['PRODUTO', 'Bug de produto'], ['OUTRO_BUG', 'Outro bug'], ['MELHORIA', 'Melhoria']];
  const rotuloClassificacao = (c) => tr((classificacoesFalha.find((x) => x[0] === c) || [0, 'Sem classificação'])[1]);
  async function carregarLocais(e) {
    const r = await api.propostas(e.id); if (!r.ok) return { erro: r.error, itens: [] };
    return { itens: (r.data || []).filter((p) => p.tipo === 'bug' && p.estado !== 'DESCARTADA') };
  }
  // Como o ticket local nasceu: de uma falha de run, sugerido por IA ou criado à mão.
  const origemDoLocal = (p) => (p.falhaDeOrigem ? tr('Falha de run') : p.origem === 'IA' ? tr('Sugerido por IA') : tr('Manual'));
  function selecaoClassificacao(id, valor) { return h('select', { id }, classificacoesFalha.map(([v, t]) => h('option', { value: v, selected: v === valor }, tr(t)))); }
  // Casos em FAIL nas runs locais do projeto (automação ou teste manual), dos mais recentes aos mais antigos: a origem possível de um ticket.
  async function falhasDasRuns(e) {
    const rs = await api.runs(e.id); if (!rs.ok) return { erro: rs.error, itens: [] };
    const itens = [];
    for (const r of rs.data) for (const c of r.casos.filter((x) => x.resultado?.status === 'FAIL')) itens.push({ id: r.id + '-' + c.casoId, run: r, caso: c });
    return { itens: itens.sort((a, b) => String(b.caso.resultado.em || '').localeCompare(String(a.caso.resultado.em || ''))) };
  }
  const execucaoDaFalha = (f) => (f.caso.resultado?.origem === 'MANUAL' ? tr('Manual') : f.caso.capability ? tr('Automação {c}', { c: f.caso.capability }) : tr('Automação'));
  const detalheDaFalha = (f) => [tr('Run "{r}"', { r: f.run.titulo }), f.run.ambiente, execucaoDaFalha(f), f.caso.resultado?.em ? hora(f.caso.resultado.em) : null].filter(Boolean).join(' · ');
  // Erro junto ao campo: aria-invalid, mensagem ligada por aria-describedby e foco no campo. Sem mensagem, limpa.
  function marcarErro(controle, mensagem) {
    const campo = controle.closest('.ds-campo'); campo?.querySelector('.ds-erro-campo')?.remove();
    controle.removeAttribute('aria-invalid'); controle.removeAttribute('aria-describedby');
    if (!mensagem) return true;
    const id = controle.id + '-erro'; campo?.append(h('span', { class: 'ds-erro-campo', id, 'aria-hidden': 'true' }, mensagem));
    controle.setAttribute('aria-invalid', 'true'); controle.setAttribute('aria-describedby', id); controle.focus();
    return false;
  }
  const minimo3 = (controle, rotulo) => marcarErro(controle, controle.value.trim().length >= 3 ? '' : tr('Preencha {c} com pelo menos 3 caracteres.', { c: tr(rotulo) }));
  // Referência do item criado no mapa de vínculos do projeto.
  const referenciaDoCriado = (e, servico, r) => { const v = vinc(e, servico); return { tipo: { jira: 'jira-bug', qase: 'qase-defeito', github: 'github-issue' }[servico], id: String(servico === 'jira' ? r.remoto.chave : r.remoto.id), vinculoId: v.id, origem: v.recurso.chave }; };
  /** Liga o ticket à falha de origem: run local, cenário (caso do Qase) e evidência da execução. Vínculo repetido conta como feito; devolve o erro ou null. */
  async function vincularFalha(e, item, f) {
    const vq = vinc(e, 'qase');
    const alvos = [{ tipo: 'run', id: f.run.id, origem: 'prumo' },
      vq && f.caso.casoId < 1e9 ? { tipo: 'qase', id: String(f.caso.casoId), vinculoId: vq.id, origem: vq.recurso.chave } : null,
      vq && f.run.runIdRemoto ? { tipo: 'qase-run', id: String(f.run.runIdRemoto), vinculoId: vq.id, origem: vq.recurso.chave } : null,
      f.caso.resultado?.evidenciaId ? { tipo: 'evidencia', id: f.caso.resultado.evidenciaId, origem: 'prumo' } : null].filter(Boolean);
    const justificativa = tr('Aberto a partir da falha do caso #{c} na run "{r}".', { c: f.caso.casoId, r: f.run.titulo }).slice(0, 1000);
    for (const para of alvos) { const r = await api.espacoAssociar(e.id, { de: item, para, justificativa }); if (!r.ok && !/TRACE_DUPLICATE/.test(r.error || '')) return r.error; }
    await atualizarEspaco(e); return null;
  }
  /** Vínculos escolhidos na criação: caso do Qase, cenário do Prumo, automação, evidência de run e outros tickets. Só registra depois que o item existe. */
  function vinculosExtras(e) {
    const vj = vinc(e, 'jira'), vq = vinc(e, 'qase'), vg = vinc(e, 'github'); const escolhidos = new Map(); const cache = {};
    const tipos = [['qase', 'Caso do Qase', !!vq], ['cenario', 'Cenário do Prumo', e.manualAtivo !== false], ['automacao', 'Automação', true], ['evidencia', 'Evidência de run', true],
      ['jira', 'Ticket do Jira', !!vj], ['defeito', 'Defeito do Qase', !!vq], ['issue', 'Issue do GitHub', !!vg], ['local', 'Ticket do Prumo', e.manualAtivo !== false]].filter((x) => x[2]);
    const carregadores = {
      qase: async () => { const r = await api.servicoConsultar(e.id, 'qase', 'casos', { offset: 0, limite: 100 }); return (r.ok ? r.data.dados || [] : []).map((c) => ({ id: String(c.id), rotulo: '#' + c.id + ' ' + (c.titulo || c.title || ''), ref: { tipo: 'qase', id: String(c.id), vinculoId: vq.id, origem: vq.recurso.chave } })); },
      cenario: async () => { const r = await api.repositorioLocal(e.id); return (r.ok ? r.data.casos || [] : []).map((c) => ({ id: c.id, rotulo: c.titulo || c.id, ref: { tipo: 'caso-local', id: c.id, origem: 'prumo' } })); },
      automacao: async () => { const r = await api.espacoAutomacoes(e.id); return (r?.capacidades || []).map((c) => ({ id: c, rotulo: c, ref: { tipo: 'automacao', id: c, origem: 'qa.project.json' } })); },
      evidencia: async () => { const r = await api.runs(e.id); const itens = []; for (const run of r.ok ? r.data : []) for (const c of run.casos) if (c.resultado?.evidenciaId) itens.push({ id: c.resultado.evidenciaId, rotulo: '#' + c.casoId + ' ' + c.titulo + ' · ' + run.titulo, ref: { tipo: 'evidencia', id: c.resultado.evidenciaId, origem: 'prumo' } }); return itens; },
      defeito: async () => { const r = await api.servicoConsultar(e.id, 'qase', 'defeitos', { offset: 0, limite: 100 }); return (r.ok ? r.data.dados || [] : []).map((d) => ({ id: String(d.id), rotulo: vq.recurso.chave + '-' + d.id + ' ' + (d.title || ''), ref: { tipo: 'qase-defeito', id: String(d.id), vinculoId: vq.id, origem: vq.recurso.chave } })); },
      issue: async () => { const r = await api.servicoConsultar(e.id, 'github', 'issues', { offset: 0, limite: 100 }); return (r.ok ? r.data.dados || [] : []).map((i) => ({ id: String(i.numero), rotulo: '#' + i.numero + ' ' + (i.titulo || ''), ref: { tipo: 'github-issue', id: String(i.numero), vinculoId: vg.id, origem: vg.recurso.chave } })); },
      local: async () => { const r = await api.propostas(e.id); return (r.ok ? r.data : []).filter((p) => p.tipo === 'bug' && p.estado !== 'DESCARTADA' && !p.remoto && p.origem === 'PESSOA').map((p) => ({ id: p.id, rotulo: p.titulo, ref: { tipo: 'ticket-local', id: p.id, origem: 'prumo' } })); }
    };
    const tipo = h('select', { id: 'tkn-vinculo-tipo', 'aria-label': tr('Tipo de vínculo') }, tipos.map(([v, t]) => h('option', { value: v }, tr(t))));
    const filtro = h('input', { type: 'search', id: 'tkn-vinculo-filtro', maxlength: 100, autocomplete: 'off', 'aria-label': tr('Buscar para vincular') });
    const opcoes = h('select', { id: 'tkn-vinculo-opcoes', 'aria-label': tr('Item para vincular') });
    const status = h('p', { class: 'ds-sub', role: 'status' }); const chips = h('ul', { class: 'ds-vinculos', id: 'tkn-vinculos', 'aria-label': tr('Vínculos escolhidos') });
    const no = h('div', { class: 'inteiro ds-vinculos-campo' });
    const ehLivre = () => tipo.value === 'jira';
    // Identificador digitado à mão (quando o item não está na lista ou a consulta não o trouxe). Cenário e ticket do Prumo precisam existir no projeto: só pela lista.
    const manual = {
      qase: { ok: (v) => /^\d{1,9}$/.test(v), erro: 'Informe o número do caso, como 31.', consulta: 'caso', monta: (v) => ({ id: v, rotulo: '#' + v, ref: { tipo: 'qase', id: v, vinculoId: vq.id, origem: vq.recurso.chave } }) },
      defeito: { ok: (v) => /^\d{1,9}$/.test(v), erro: 'Informe o número do defeito, como 12.', consulta: 'defeito', monta: (v) => ({ id: v, rotulo: vq.recurso.chave + '-' + v, ref: { tipo: 'qase-defeito', id: v, vinculoId: vq.id, origem: vq.recurso.chave } }) },
      issue: { ok: (v) => /^\d{1,9}$/.test(v), erro: 'Informe o número da issue, como 7.', monta: (v) => ({ id: v, rotulo: '#' + v, ref: { tipo: 'github-issue', id: v, vinculoId: vg.id, origem: vg.recurso.chave } }) },
      automacao: { ok: (v) => /^[A-Za-z0-9_.#:-]{1,100}$/.test(v), erro: 'Use a capability ou capability#cenário, sem espaços.', monta: (v) => ({ id: v, rotulo: v, ref: { tipo: 'automacao', id: v, origem: 'qa.project.json' } }) },
      evidencia: { ok: (v) => /^[A-Za-z0-9_-]{4,100}$/.test(v), erro: 'Informe o ID da evidência.', monta: (v) => ({ id: v, rotulo: tr('Evidência {v}', { v }), ref: { tipo: 'evidencia', id: v, origem: 'prumo' } }) }
    };
    async function itensDoTipo() { const t = tipo.value; if (t === 'jira') return []; if (!cache[t]) cache[t] = await carregadores[t](); return cache[t]; }
    async function desenharOpcoes() {
      const t = tipo.value; status.textContent = ''; filtro.placeholder = ehLivre() ? 'SMART-123' : manual[t] ? tr('Buscar ou digitar o ID') : tr('Buscar…'); opcoes.hidden = ehLivre(); filtro.setAttribute('aria-label', tr(ehLivre() ? 'Chave do ticket' : 'Buscar para vincular'));
      botao.disabled = false; if (ehLivre()) return;
      status.textContent = tr('Lendo…'); const todos = await itensDoTipo(); if (t !== tipo.value) return;
      const q = paraBusca(filtro.value).trim(); const achados = todos.filter((x) => !q || paraBusca(x.rotulo).includes(q)).slice(0, 50);
      opcoes.replaceChildren(...achados.map((x) => h('option', { value: x.id }, x.rotulo))); botao.disabled = !achados.length && !manual[t];
      status.textContent = !todos.length ? tr(manual[t] ? 'Nada na lista. Digite o ID e clique em Adicionar.' : 'Nada para vincular neste tipo.') : !achados.length ? tr(manual[t] ? 'Nenhum resultado para "{q}". Clique em Adicionar para usar como digitado.' : 'Nenhum resultado para "{q}".', { q: filtro.value }) : '';
    }
    function desenharChips() {
      chips.replaceChildren(...[...escolhidos.entries()].map(([k, x]) => h('li', { class: 'ds-vinculo' }, DS.origem(x.servico, x.rotulo), h('button', { type: 'button', class: 'ds-vinculo-remover', 'aria-label': tr('Remover vínculo {r}', { r: x.rotulo }), onclick: () => { escolhidos.delete(k); desenharChips(); (chips.querySelector('button') || tipo).focus(); } }, '×'))));
    }
    const servicoDe = { qase: 'qase', cenario: 'prumo', automacao: 'local', evidencia: 'local', jira: 'jira', defeito: 'qase', issue: 'github', local: 'prumo' };
    async function adicionar() {
      const t = tipo.value; let item;
      if (t === 'jira') {
        const chave = filtro.value.trim().toUpperCase(); if (!/^[A-Z][A-Z0-9_]+-\d+$/.test(chave)) { status.textContent = tr('Informe uma chave como SMART-123.'); filtro.focus(); return; }
        const r = await api.servicoConsultar(e.id, 'jira', 'ticket', {}, chave); if (!r.ok) { status.textContent = tr('Ticket {k} não encontrado no Jira.', { k: chave }); filtro.focus(); return; }
        item = { id: chave, rotulo: chave, ref: { tipo: 'jira', id: chave, vinculoId: vj.id, origem: vj.recurso.chave } };
      } else {
        const lista = await itensDoTipo(); const digitado = filtro.value.trim().replace(/^#/, ''); const q = paraBusca(filtro.value).trim();
        const achados = lista.filter((x) => !q || paraBusca(x.rotulo).includes(q));
        const exato = lista.find((x) => digitado && x.id.toLowerCase() === digitado.toLowerCase());
        // Texto digitado que não é o ID de nenhum item da lista só cai no item selecionado se o tipo não aceitar digitação.
        item = exato || (digitado && manual[t] ? null : achados.length ? achados.find((x) => x.id === opcoes.value) : null);
        if (!item && manual[t] && digitado) {
          if (!manual[t].ok(digitado)) { status.textContent = tr(manual[t].erro); filtro.focus(); return; }
          if (manual[t].consulta) { const r = await api.servicoConsultar(e.id, 'qase', manual[t].consulta, {}, digitado); if (!r.ok) { status.textContent = tr('{t} {v} não encontrado no Qase.', { t: tr(t === 'qase' ? 'Caso' : 'Defeito'), v: digitado }); filtro.focus(); return; } }
          item = manual[t].monta(digitado);
        }
      }
      if (!item) { if (!filtro.value.trim()) status.textContent = tr('Escolha um item ou digite o identificador.'); return; }
      const k = item.ref.tipo + ':' + item.ref.id; if (escolhidos.has(k)) { status.textContent = tr('Este vínculo já foi adicionado.'); return; }
      if (escolhidos.size >= 20) { status.textContent = tr('No máximo 20 vínculos por ticket.'); return; }
      escolhidos.set(k, { ref: item.ref, rotulo: item.rotulo.length > 60 ? item.rotulo.slice(0, 59) + '…' : item.rotulo, servico: servicoDe[t] }); filtro.value = ''; desenharChips(); await desenharOpcoes(); status.textContent = tr('Vínculo adicionado.');
    }
    const botao = DS.acao('Adicionar', adicionar, { id: 'tkn-vinculo-adicionar', compacto: true, icone: 'vinculo' });
    tipo.addEventListener('change', () => { filtro.value = ''; void desenharOpcoes(); }); filtro.addEventListener('input', () => { if (!ehLivre()) void desenharOpcoes(); });
    filtro.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); botao.click(); } });
    no.append(h('div', { class: 'ds-vinculos-linha' }, tipo, filtro, opcoes, botao), status, chips); void desenharOpcoes();
    return { no, itens: () => [...escolhidos.values()].map((x) => x.ref) };
  }
  /** Registra no mapa de vínculos cada vínculo escolhido para o item criado. Repetido conta como feito; devolve o primeiro erro ou null. */
  async function vincularExtras(e, item, refs) {
    const falhas = [];
    for (const para of refs) { const r = await api.espacoAssociar(e.id, { de: item, para, justificativa: tr('Vínculo declarado ao criar o ticket.') }); if (!r.ok && !/TRACE_DUPLICATE/.test(r.error || '')) falhas.push(para.tipo + ' ' + para.id + ' (' + textoErro(r.error) + ')'); }
    if (refs.length) await atualizarEspaco(e);
    return falhas.length ? falhas.join('; ') : null;
  }
  /** Novo ticket: o destino vem das conexões do projeto. Rascunho no Prumo (com Manual/Prumo ativo) ou publicação direta no Qase, Jira ou GitHub
   *  integrados; os que estão em Só ver aparecem indisponíveis, com o caminho para habilitar. A falha de origem liga o ticket à run, ao cenário e às evidências. */
  async function abrirNovoTicket(e, aoCriar) {
    const ferramentas = ferramentasDoTicket(e, await escritaDoProjeto(e)); const mem = memoriaDaTela('tickets', e.id);
    const opcoes = [...(e.manualAtivo !== false ? [{ servico: 'prumo', nome: 'Prumo', escrita: true }] : []), ...['qase', 'jira', 'github'].map((s) => ferramentas.find((x) => x.servico === s)).filter(Boolean)];
    const disponiveis = opcoes.filter((x) => x.escrita);
    const abrirProjetos = () => { DS.fecharModal(); void mostrar('projetos'); };
    if (!disponiveis.length) { DS.modal('Novo ticket', DS.estadoTela('bloqueado', 'Nenhum destino disponível', 'Ative Manual/Prumo ou habilite a escrita de Qase, Jira ou GitHub em Projetos.', [DS.acao('Abrir Projetos', abrirProjetos)]), { tamanho: 'md' }); return; }
    const textos = { prumo: ['Rascunho no Prumo', 'Fica neste computador', 'Salvar rascunho', 'Fica só neste computador.'], qase: ['', 'Publica um defeito', 'Publicar no Qase…'], jira: ['', 'Publica um ticket', 'Publicar no Jira…'], github: ['', 'Publica uma issue', 'Publicar no GitHub…'] };
    const nomeDe = (x) => (x.servico === 'prumo' ? tr(textos.prumo[0]) : x.nome + ' · ' + x.vinculo.recurso.chave);
    let atual = (disponiveis.find((x) => x.servico === mem.destino) || disponiveis[0]).servico;

    // Controles criados uma vez: trocar de destino só mostra ou esconde, e nada do que foi digitado se perde.
    const cls = selecaoClassificacao('tkn-classificacao', 'PRODUTO');
    const tipoGithub = h('select', { id: 'tkn-tipo-github' }, h('option', { value: 'bug' }, tr('Bug')), h('option', { value: 'enhancement' }, tr('Melhoria')));
    const tipoJira = h('select', { id: 'tkn-tipo-jira', disabled: true }, h('option', { value: '' }, tr('Carregando tipos…')));
    const res = h('input', { id: 'tkn-resumo', maxlength: 255, required: true, 'aria-required': 'true' });
    const desc = h('textarea', { id: 'tkn-descricao', rows: 6, maxlength: 8000 });
    const campoTexto = DS.campo('Descrição', desc, { inteiro: true }); const rotuloTexto = campoTexto.firstChild;
    const grupos = { prumo: h('div', { class: 'ds-grupo-destino' }, DS.campo('Classificação', cls)), jira: h('div', { class: 'ds-grupo-destino' }, DS.campo('Tipo de ticket', tipoJira)), github: h('div', { class: 'ds-grupo-destino' }, DS.campo('Tipo', tipoGithub)), qase: h('div', { class: 'ds-grupo-destino' }) };
    const obrigatoriosQase = h('div', { class: 'ds-grupo-destino' });
    let qase = null, metaJira = null, jiraPedido = false, melhoria = false;

    const escolhas = h('div', { class: 'ds-escolhas', role: 'radiogroup', 'aria-labelledby': 'tkn-destino-rotulo' }, opcoes.map((x) => {
      const radio = h('input', { type: 'radio', name: 'tkn-destino', id: 'tkn-destino-' + x.servico, value: x.servico, checked: x.servico === atual, disabled: !x.escrita });
      radio.addEventListener('change', () => { if (radio.checked) trocar(x.servico); });
      return h('div', { class: 'ds-escolha', 'data-indisponivel': x.escrita ? null : '' },
        h('label', { for: radio.id }, radio, DS.origem(x.servico, h('span', { class: 'ds-escolha-nome', title: nomeDe(x) }, nomeDe(x))),
          x.escrita ? h('span', { class: 'ds-sub' }, tr(textos[x.servico][1])) : h('span', { class: 'ds-nota-perm' }, DS.icone('cadeado'), h('span', {}, tr('Só ver neste projeto')))),
        x.escrita ? null : DS.link('Habilitar em Projetos', abrirProjetos, { rotulo: tr('Habilitar escrita do {s} em Projetos', { s: x.nome }) }));
    }));
    const campoDestino = opcoes.length > 1 ? h('div', { class: 'ds-campo inteiro' }, h('span', {}, h('span', { id: 'tkn-destino-rotulo' }, tr('Destino')), ' ', DS.info('Rascunho fica só neste computador e pode ser publicado depois. Qase, Jira e GitHub vêm das conexões deste projeto.', { rotulo: 'Sobre o destino' })), escolhas) : null;

    // Falha de origem: sem falha, escolhendo na lista, ou escolhida (com as evidências do caso).
    let falhas = null, escolhida = null, evidencias = null;
    const areaFalha = h('div', { class: 'inteiro', id: 'tkn-falha' });
    const extras = vinculosExtras(e); const vincularTudo = async (item) => { const falhas = [escolhida ? await vincularFalha(e, item, escolhida) : null, await vincularExtras(e, item, extras.itens())].filter(Boolean); return falhas.length ? falhas.join('; ') : null; };
    const fsFalha = h('fieldset', {}, h('legend', {}, h('span', { id: 'tkn-falha-legenda' }, tr('Rastreabilidade')), ' ', DS.info('Liga o ticket à falha de origem (caso, run e evidências) e a casos, cenários, automações, evidências e outros tickets. Os vínculos só são gravados depois que o ticket existe.', { rotulo: 'Sobre a rastreabilidade' })), h('p', { class: 'ds-falha-secao' }, tr('Falha de origem')), areaFalha, h('p', { class: 'ds-falha-secao' }, tr('Outros vínculos')), extras.no);
    const anuncio = h('span', { class: 'visually-hidden', role: 'status' });
    const citacao = () => {
      if (!escolhida) return '';
      const c = escolhida.caso; const ev = (evidencias?.arquivos || []).map((a) => a.nome);
      return tr('Falha de origem: caso #{id} "{t}", run "{r}"{a}, FAIL em {q}, {x}.', { id: c.casoId, t: c.titulo, r: escolhida.run.titulo, a: escolhida.run.ambiente ? ' (' + escolhida.run.ambiente + ')' : '', q: hora(c.resultado.em), x: execucaoDaFalha(escolhida) }) + (ev.length ? ' ' + tr('Evidências: {n}.', { n: ev.join(', ') }) : '');
    };
    const linhaFalha = (f, acoes) => h('div', { class: 'ds-falha' }, h('div', {}, h('div', { class: 'ds-falha-titulo', title: f.caso.titulo }, h('span', { class: 'ds-tag' }, '#' + f.caso.casoId), ' ', f.caso.titulo), h('div', { class: 'ds-sub' }, detalheDaFalha(f))), acoes);
    async function carregarFalhas() { falhas = null; desenharFalha(); falhas = await falhasDasRuns(e); desenharFalha(); }
    function desenharFalha() {
      if (!falhas) return areaFalha.replaceChildren(h('p', { class: 'suave' }, tr('Lendo runs…')));
      if (falhas.erro) return areaFalha.replaceChildren(h('p', { class: 'suave' }, tr('Não foi possível ler as runs locais.'), ' ', DS.link('Tentar de novo', () => void carregarFalhas(), { seta: false })));
      if (!falhas.itens.length) return areaFalha.replaceChildren(h('p', { class: 'suave' }, tr('Nenhum caso falhou nas runs locais.')));
      if (!escolhida) return areaFalha.replaceChildren(h('div', { class: 'ds-falha' }, h('span', { class: 'suave' }, tr('{n} falha(s) nas runs locais', { n: falhas.itens.length })), DS.acao('Escolher falha', abrirLista, { id: 'tkn-escolher-falha', compacto: true, icone: 'vinculo' })));
      const f = escolhida; const comentario = String(f.caso.resultado?.comentario || '').trim();
      const ev = evidencias === null ? h('p', { class: 'ds-sub' }, tr('Lendo evidências…'))
        : evidencias.erro ? h('p', { class: 'ds-sub' }, tr('Não foi possível ler as evidências.'))
        : evidencias.pastaVinculada === false ? h('p', { class: 'ds-sub' }, tr('Vincule a pasta do projeto para ver as evidências.'))
        : !evidencias.arquivos.length ? h('p', { class: 'ds-sub' }, tr('Sem evidências neste caso.'))
        : h('ul', { class: 'ds-lista', 'aria-labelledby': 'tkn-evidencias-titulo' }, evidencias.arquivos.map((a) => h('li', {}, a.nome, h('span', { class: 'ds-sub' }, (a.origem === 'manual' ? tr('Manual') : tr('Rodada')) + (a.tamanho ? ' · ' + bytes(a.tamanho) : '')))));
      areaFalha.replaceChildren(
        linhaFalha(f, h('div', { class: 'ds-chips' }, DS.link('Trocar', abrirLista, { id: 'tkn-trocar-falha', seta: false, rotulo: tr('Trocar falha de origem') }), DS.link('Remover', () => { escolhida = null; evidencias = null; desenharFalha(); aplicar(); anuncio.textContent = tr('Falha removida.'); document.getElementById('tkn-escolher-falha')?.focus(); }, { seta: false, rotulo: tr('Remover falha de origem') }))),
        comentario ? h('p', { class: 'ds-sub' }, comentario.length > 160 ? comentario.slice(0, 159) + '…' : comentario) : null,
        h('p', { class: 'ds-falha-secao', id: 'tkn-evidencias-titulo' }, tr('Evidências ({n})', { n: evidencias?.arquivos?.length ?? 0 }), ' ', h('span', { class: 'ds-sub' }, tr(atual === 'prumo' ? 'Ficam ligadas ao rascunho, neste computador.' : 'Citadas no texto.'))), ev,
        atual === 'prumo' ? null : DS.recolher('Ver texto incluído', DS.texto(citacao())));
    }
    function abrirLista() {
      const busca = falhas.itens.length > 6 ? DS.busca({ id: 'tkn-falha-busca', placeholder: 'Buscar por caso, run ou ambiente' }) : null;
      const contador = h('p', { class: 'ds-sub', role: 'status', id: 'tkn-falhas-contador' });
      const lista = h('ul', { class: 'ds-falhas', role: 'listbox', id: 'tkn-falhas', 'aria-labelledby': 'tkn-falha-legenda', 'aria-describedby': 'tkn-falhas-contador' });
      const fechar = () => { desenharFalha(); (document.getElementById(escolhida ? 'tkn-trocar-falha' : 'tkn-escolher-falha'))?.focus(); };
      const itens = () => [...lista.querySelectorAll('[role=option]')];
      const mover = (alvo) => { for (const x of itens()) x.tabIndex = x === alvo ? 0 : -1; alvo?.focus(); };
      const filtrar = () => {
        const q = paraBusca(busca?.input.value || '').trim();
        const achadas = falhas.itens.filter((f) => !q || paraBusca(['#' + f.caso.casoId, f.caso.titulo, f.run.titulo, f.run.ambiente].join(' ')).includes(q));
        contador.textContent = !achadas.length ? tr('Nenhuma falha para "{q}".', { q: busca?.input.value || '' }) : achadas.length > 50 ? tr('Mostrando 50 de {t}. Refine a busca.', { t: achadas.length }) : tr('{n} de {t} falhas', { n: achadas.length, t: falhas.itens.length });
        lista.replaceChildren(...achadas.slice(0, 50).map((f, i) => {
          const marcada = escolhida?.id === f.id;
          const li = linhaFalha(f, h('div', { class: 'ds-chips' }, selo('FAIL')));
          Object.assign(li, { tabIndex: marcada || (!escolhida && i === 0) ? 0 : -1, id: 'tkn-falha-' + f.id }); li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(marcada));
          li.addEventListener('click', () => void escolher(f));
          return h('li', { role: 'none' }, li);
        }));
        const primeiro = itens()[0]; if (primeiro && !itens().some((x) => x.tabIndex === 0)) primeiro.tabIndex = 0;
      };
      lista.addEventListener('keydown', (ev) => {
        const todos = itens(); const i = todos.indexOf(document.activeElement);
        if (ev.key === 'ArrowDown') { ev.preventDefault(); mover(todos[Math.min(i + 1, todos.length - 1)]); }
        else if (ev.key === 'ArrowUp') { ev.preventDefault(); if (i <= 0 && busca) busca.input.focus(); else mover(todos[Math.max(i - 1, 0)]); }
        else if (ev.key === 'Home') { ev.preventDefault(); mover(todos[0]); }
        else if (ev.key === 'End') { ev.preventDefault(); mover(todos[todos.length - 1]); }
        else if ((ev.key === 'Enter' || ev.key === ' ') && i >= 0) { ev.preventDefault(); todos[i].click(); }
        else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); fechar(); }
      });
      busca?.input.addEventListener('input', filtrar);
      busca?.input.addEventListener('keydown', (ev) => {
        if (ev.key === 'ArrowDown') { ev.preventDefault(); mover(itens()[0]); }
        else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); if (busca.input.value) { busca.input.value = ''; filtrar(); } else fechar(); }
      });
      areaFalha.replaceChildren(busca ? busca.no : null, contador, lista);
      filtrar(); (busca ? busca.input : itens().find((x) => x.tabIndex === 0))?.focus();
    }
    async function escolher(f) {
      escolhida = f; evidencias = null;
      if (!res.value.trim()) res.value = tr('Falha: {t}', { t: f.caso.titulo }).slice(0, 255);
      const comentario = String(f.caso.resultado?.comentario || '').trim(); if (!desc.value.trim() && comentario) desc.value = comentario.slice(0, 8000);
      desenharFalha(); aplicar(); anuncio.textContent = tr('Falha ligada: caso #{id}.', { id: f.caso.casoId }); document.getElementById('tkn-trocar-falha')?.focus();
      const r = await api.runEvidencias(f.run.id, f.caso.casoId); if (escolhida !== f) return;
      evidencias = r.ok ? { pastaVinculada: r.data.pastaVinculada !== false, arquivos: Array.isArray(r.data.arquivos) ? r.data.arquivos : [] } : { erro: r.error, arquivos: [] };
      const foco = document.activeElement?.id; desenharFalha(); if (foco) document.getElementById(foco)?.focus();
    }

    // Destino: campos próprios, rótulo do texto, subtítulo, nota e botão. Bug ou melhoria acompanha a troca.
    const subtitulo = h('span', { class: 'ds-chips' }); const nota = h('span', { class: 'ds-form-msg' }); const saida = h('div', { id: 'tkn-saida', 'aria-live': 'polite' });
    let fecharAoClicar = false;
    const principal = DS.acao(textos[atual][2], async () => { if (fecharAoClicar) { DS.fecharModal(); aoCriar(); return; } await enviar(); }, { id: 'tkn-criar', primaria: true });
    const escolherTipoJira = () => { if (!metaJira?.tipos.length) return; const t = metaJira.tipos.find((x) => (melhoria ? /melhoria|improvement|story|hist/i : /bug|defeito/i).test(x.nome)) || metaJira.tipos[0]; tipoJira.value = t.id; };
    async function carregarJira() {
      metaJira = await tiposJira(e);
      tipoJira.replaceChildren(...metaJira.tipos.map((t) => h('option', { value: t.id }, t.nome))); tipoJira.disabled = !metaJira.tipos.length; escolherTipoJira();
      if (!metaJira.tipos.length) grupos.jira.append(DS.alerta(tr('Tipos de ticket indisponíveis: {e}', { e: textoErro(metaJira.erro || '') }), 'falha'));
      aplicar();
    }
    function trocar(s) {
      melhoria = atual === 'prumo' ? cls.value === 'MELHORIA' : atual === 'github' ? tipoGithub.value === 'enhancement' : atual === 'jira' ? /melhoria|improvement|story|hist/i.test(tipoJira.selectedOptions[0]?.textContent || '') : melhoria;
      atual = s;
      if (s === 'github') tipoGithub.value = melhoria ? 'enhancement' : 'bug';
      if (s === 'prumo') cls.value = melhoria ? 'MELHORIA' : cls.value === 'MELHORIA' ? 'PRODUTO' : cls.value;
      if (s === 'jira') escolherTipoJira();
      aplicar(); desenharFalha();
    }
    function aplicar() {
      if (atual === 'qase' && !qase) { qase = camposDoDefeitoQase(e, 'tkn'); qase.caixa.classList.add('inteiro'); grupos.qase.append(DS.campo('Severidade', qase.severidade), DS.campo('Milestone', qase.marco)); obrigatoriosQase.append(qase.caixa); }
      if (atual === 'jira' && !jiraPedido) { jiraPedido = true; void carregarJira(); }
      for (const [s, g] of Object.entries(grupos)) g.hidden = s !== atual;
      obrigatoriosQase.hidden = atual !== 'qase';
      rotuloTexto.textContent = tr(atual === 'qase' ? 'Resultado observado *' : 'Descrição');
      desc.toggleAttribute('required', atual === 'qase'); desc.setAttribute('aria-required', String(atual === 'qase'));
      if (atual !== 'qase') marcarErro(desc, '');
      const x = opcoes.find((o) => o.servico === atual);
      subtitulo.replaceChildren(DS.chip(e.nome), DS.origem(atual, nomeDe(x)), escolhida ? DS.chip(tr('Caso #{id}', { id: escolhida.caso.casoId }), 'falha') : null);
      nota.textContent = tr(atual === 'prumo' ? textos.prumo[3] : 'Nada sai sem a sua confirmação.');
      if (!fecharAoClicar) principal.textContent = tr(textos[atual][2]);
      principal.disabled = atual === 'jira' && !metaJira?.tipos.length;
    }
    const concluir = (erro, mensagem, r) => {
      if (erro) { saida.replaceChildren(r ? painelResultado(r) : null, DS.alerta(tr('Criado, mas estes vínculos não foram registrados: {e}', { e: erro }), 'falha')); saida.scrollIntoView({ block: 'nearest' }); fecharAoClicar = true; principal.textContent = tr('Fechar'); principal.disabled = false; return; }
      mem.destino = atual; avisar(mensagem); DS.fecharModal(); aoCriar();
    };
    async function enviar() {
      saida.replaceChildren();
      if (!minimo3(res, 'Resumo') || (atual === 'qase' && !minimo3(desc, 'Resultado observado'))) return;
      if (atual === 'prumo') {
        const dados = { classificacao: cls.value, resumo: res.value.trim(), descricao: desc.value, rotulos: ['prumo-qa'] };
        const r = await api.propostaCriar(e.id, 'bug', dados, '', '', escolhida ? { runLocalId: escolhida.run.id, casoId: escolhida.caso.casoId } : undefined);
        if (!r.ok) { saida.replaceChildren(DS.alerta(textoErro(r.error), 'falha')); return; }
        concluir(await vincularTudo({ tipo: 'ticket-local', id: r.data.id, origem: 'prumo' }), escolhida ? tr('Rascunho salvo e ligado ao caso #{id}.', { id: escolhida.caso.casoId }) : tr('Rascunho salvo no Prumo.'));
        return;
      }
      const texto = desc.value.trim() + (escolhida ? '\n\n' + citacao() : '');
      let operacao, p;
      if (atual === 'qase') {
        const extras = qase.ler(saida); if (!extras) return;
        operacao = 'qase.criar_defeito'; p = { titulo: res.value.trim(), resultadoAtual: texto.slice(0, 8000), ...extras };
      } else if (atual === 'github') {
        operacao = 'github.criar_issue'; p = { titulo: res.value.trim(), corpo: texto.slice(0, 60000), rotulos: [tipoGithub.value, 'prumo-qa'] };
      } else {
        if (!tipoJira.value) return;
        operacao = 'jira.criar_ticket'; p = { tipoId: tipoJira.value, resumo: res.value.trim(), descricao: texto.slice(0, 8000), rotulos: ['prumo-qa'] };
      }
      const r = await executarOperacao(e, operacao, p);
      if (!r) { saida.replaceChildren(h('p', { class: 'suave', role: 'status' }, tr('Nada foi enviado.'))); principal.focus(); return; }
      if (r.estado !== 'CONFIRMADA') { saida.replaceChildren(painelResultado(r)); return; }
      const nome = { qase: 'Qase', jira: 'Jira', github: 'GitHub' }[atual];
      concluir(await vincularTudo(referenciaDoCriado(e, atual, r)), tr('Publicado no {s}: {k}.', { s: nome, k: r.remoto?.chave || '' }), r);
    }

    for (const c of [res, desc]) c.addEventListener('input', () => { if (c.hasAttribute('aria-invalid')) minimo3(c, c === res ? 'Resumo' : 'Resultado observado'); });
    aplicar(); void carregarFalhas();
    DS.modal('Novo ticket', [
      h('form', { class: 'ds-form', id: 'tkn-form', onsubmit: (ev) => ev.preventDefault() }, campoDestino, grupos.prumo, grupos.qase, grupos.jira, grupos.github, DS.campo('Resumo *', res, { inteiro: true }), campoTexto, obrigatoriosQase, fsFalha),
      saida, anuncio, DS.rodape(nota, DS.acao('Cancelar', () => DS.fecharModal(), { id: 'tkn-cancelar' }), principal)], { tamanho: 'md', subtitulo: [subtitulo] });
    res.focus();
  }
  /** Severidade (opções reais do Qase), milestone ativo e campos obrigatórios de defeito: os mesmos ao criar direto e ao publicar um rascunho. */
  function camposDoDefeitoQase(e, prefixo) {
    const severidade = h('select', { id: prefixo + '-severidade-qase' }, [1, 2, 3, 4, 5].map((n) => h('option', { value: String(n), selected: n === 3 }, String(n))));
    // Opções reais do campo de sistema "severity" do Qase (ID enviado no POST, nome mostrado); sem leitura, ficam os números.
    void api.servicoConsultar(e.id, 'qase', 'campos-sistema').then((r) => {
      const campo = r.ok ? (r.data.dados || []).find((c) => String(c.slug).toLowerCase() === 'severity') : null;
      const opcoes = (campo?.options || []).filter((o) => Number(o.id) >= 1);
      if (!opcoes.length) return;
      const padrao = opcoes.find((o) => o.is_default) || opcoes.find((o) => String(o.slug).toLowerCase() === 'normal') || opcoes[0];
      severidade.replaceChildren(...opcoes.map((o) => h('option', { value: String(o.id), selected: o === padrao }, o.title || o.slug || String(o.id))));
    });
    // Milestone (só os ativos) e campos personalizados obrigatórios do Qase para defeitos; a lista vem do próprio Qase.
    const marco = h('select', { id: prefixo + '-marco-qase' }, h('option', { value: '' }, tr('Sem milestone')));
    const obrigatorios = []; const caixa = h('div', { id: prefixo + '-campos-qase' });
    void api.servicoConsultar(e.id, 'qase', 'marcos', { offset: 0, limite: 100 }).then((r) => { if (r.ok) for (const m of (r.data.dados || []).filter((m) => m.estado !== 'completed')) marco.append(h('option', { value: String(m.id) }, m.titulo)); });
    void api.servicoConsultar(e.id, 'qase', 'campos-personalizados', { offset: 0, limite: 100 }, undefined, { tipo: 'defect' }).then((r) => {
      if (!r.ok) { caixa.replaceChildren(DS.alerta(tr('Não foi possível ler os campos personalizados do Qase: {e}', { e: textoErro(r.error) }), 'aviso')); return; }
      for (const c of (r.data.dados || []).filter((c) => c.obrigatorio)) {
        const entrada = Array.isArray(c.opcoes) && c.opcoes.length ? h('select', { 'data-campo-qase': String(c.id) }, h('option', { value: '' }, tr('Escolha…')), c.opcoes.map((o) => h('option', { value: o.id, selected: c.padrao != null && String(c.padrao) === o.id }, o.titulo)))
          : h('input', { 'data-campo-qase': String(c.id), maxlength: 2000, placeholder: c.dica || '', value: c.padrao || '' });
        obrigatorios.push({ id: String(c.id), titulo: c.titulo, entrada });
        caixa.append(DS.campo(c.titulo + ' *', entrada));
      }
    });
    /** Opções prontas para o Qase, ou null depois de apontar o primeiro campo obrigatório vazio. */
    const ler = (saida) => {
      const vazio = obrigatorios.find((c) => !c.entrada.value.trim());
      if (vazio) { saida.replaceChildren(DS.alerta(tr('Preencha o campo obrigatório do Qase: {c}', { c: vazio.titulo }), 'aviso')); vazio.entrada.focus(); return null; }
      return { severidade: Number(severidade.value), ...(marco.value ? { marcoId: Number(marco.value) } : {}), campos: Object.fromEntries(obrigatorios.map((c) => [c.id, c.entrada.value.trim()])) };
    };
    return { severidade, marco, caixa, ler };
  }
  async function abrirLocal(e, p, aoMudar) {
    const vj = vinc(e, 'jira'), vq = vinc(e, 'qase'), vg = vinc(e, 'github'); const perm = await escritaDoProjeto(e); const aberta = p.estado === 'RASCUNHO' || p.estado === 'REVISADA';
    const chave = h('input', { id: 'tkl-chave', maxlength: 40, placeholder: 'SMART-123', 'aria-label': tr('Ticket existente') }); const cls = selecaoClassificacao('tkl-nova-classificacao', p.dados.classificacao); const saida = h('div', { id: 'tkl-detalhe-saida', 'aria-live': 'polite' });
    const fecharEMudar = () => { DS.fecharModal(); aoMudar(); };
    const opcoesDestino = [['local', 'Manter rascunho local']];
    if (vj && perm.jira) opcoesDestino.push(['jira', 'Publicar ticket no Jira · '+vj.recurso.chave]);
    if (vq && perm.qase && p.dados.classificacao !== 'MELHORIA') opcoesDestino.push(['qase', 'Publicar em Defeitos Qase · '+vq.recurso.chave]);
    if (vg && perm.github) opcoesDestino.push(['github', 'Publicar em GitHub Issues · '+vg.recurso.chave]);
    const destinosExternos = opcoesDestino.filter(([valor]) => valor !== 'local');
    const caixasDestino = destinosExternos.map(([valor, rotulo], indice) => {
      const entrada = h('input', { type: 'checkbox', id: 'tkl-destino-' + valor, value: valor, checked: indice === 0 });
      return { valor, entrada, campo: DS.campo(rotulo, entrada) };
    });
    const destinosMarcados = () => caixasDestino.filter((x) => x.entrada.checked).map((x) => x.valor);
    const destino = h('div', { id: 'tkl-destinos', class: 'ds-form-grid', 'data-selecao-destinos': 'multipla' }, ...caixasDestino.map((x) => x.campo));
    const qase = vq ? camposDoDefeitoQase(e, 'tkl') : null;
    const campoSeveridade = h('div', { id: 'tkl-campo-severidade' });
    const avisoDestino = h('p', { class:'suave', id:'tkl-ajuda-destino' });
    const atualizarDestino = () => {
      const marcados = destinosMarcados();
      campoSeveridade.replaceChildren(...(marcados.includes('qase') ? [DS.campo('Severidade no Qase', qase.severidade), DS.campo('Milestone no Qase', qase.marco), qase.caixa] : []));
      avisoDestino.textContent = marcados.length ? tr('Os destinos marcados serão publicados com uma única confirmação. Se um falhar, os demais sucessos serão mantidos.')
        : tr('Nenhum destino externo marcado: o ticket permanecerá somente como rascunho local.');
    };
    for (const x of caixasDestino) x.entrada.addEventListener('change', atualizarDestino);
    atualizarDestino();
    const publicar = async () => {
      const marcados = destinosMarcados();
      if (!marcados.length) { avisar('Rascunho mantido localmente. Nenhuma publicação externa foi feita.'); fecharEMudar(); return; }
      let tipoId;
      if (marcados.includes('jira') && !p.dados.tipoId) {
        const m = await tiposJira(e); const preferido = p.dados.classificacao === 'MELHORIA' ? m.tipos.find((t) => /melhoria|improvement|story|hist/i.test(t.nome)) : m.tipos.find((t) => /bug|defeito/i.test(t.nome));
        tipoId = (preferido || m.tipos[0])?.id;
      }
      const opQase = marcados.includes('qase') ? qase.ler(saida) : null; if (marcados.includes('qase') && !opQase) return;
      const r = await api.propostaPublicar(p.id, tipoId, marcados[0], opQase?.severidade, opQase?.marcoId, opQase && Object.keys(opQase.campos).length ? opQase.campos : undefined, marcados);
      if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } if (r.data.canceled) return;
      const resultados = r.data.destinos || []; const falhas = resultados.filter((x) => x.estado !== 'CONFIRMADA');
      if (!falhas.length) { avisar('Publicado em ' + marcados.join(', ') + '.'); fecharEMudar(); }
      else saida.replaceChildren(DS.alerta(tr('Publicação parcial: {n} destino(s) falharam. Os sucessos foram mantidos; revise o rascunho para tentar novamente.', { n: falhas.length }), 'aviso'));
    };
    DS.modal(p.titulo, h('div', { class: 'ds-detalhe' }, h('section', { class: 'ds-detalhe-main', id: 'tkl-painel', 'data-local': p.id },
      DS.bloco('Descrição', DS.texto(p.dados.descricao, 'Sem descrição.')),
      p.falhaDeOrigem ? DS.bloco('Falha de origem', h('p', {}, tr('Caso {c} da run local {r}.', { c: p.falhaDeOrigem.casoId, r: p.falhaDeOrigem.runLocalId.slice(0, 8) }))) : null,
      p.remoto?.chave ? DS.bloco(p.estado === 'VINCULADA' ? 'Ticket vinculado' : 'Ticket publicado', h('p', {}, p.remoto.chave, p.remoto.url ? ' · ' + p.remoto.url : '')) : null,
      aberta ? DS.bloco('Vincular a um ticket que já existe', [h('p', { class: 'suave' }, tr('Informe a chave do ticket. O Prumo guarda o vínculo, sem consultar nem alterar o Jira.')), h('div', { class: 'ds-cab-acoes' }, chave, DS.acao('Vincular', async () => { const r = await api.propostaVincular(p.id, chave.value); if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } avisar(tr('Ticket local vinculado a {k}.', { k: r.data.remoto.chave })); await atualizarEspaco(e); fecharEMudar(); }, { id: 'tkl-vincular', primaria: true }))]) : null, saida),
      h('aside', {}, DS.meta([['Origem', DS.origem('prumo', 'Prumo · neste computador')], ['Como nasceu', origemDoLocal(p)], ['Classificação', rotuloClassificacao(p.dados.classificacao)], ['Estado', p.estado === 'VINCULADA' ? tr('Vinculada') : p.estado === 'PUBLICADA' ? tr('Publicada') : tr('Local, sem integração')], ['Criado', hora(p.criadaEm)]]),
        aberta ? h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Ações')), DS.campo('Classificação', cls),
          DS.acao('Salvar classificação', async () => { const r = await api.propostaEditar(p.id, { ...p.dados, classificacao: cls.value }); if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } avisar(tr('Classificação atualizada.')); fecharEMudar(); }, { id: 'tkl-classificar' }),
          DS.campo('Destinos da publicação', destino), campoSeveridade, avisoDestino,
          DS.acao('Confirmar destino…', publicar, { id: 'tkl-publicar', primaria: true }),
          DS.acao('Descartar', async () => { const r = await api.propostaDescartar(p.id); if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } fecharEMudar(); }, { id: 'tkl-descartar' })) : null)),
    { tamanho: 'lg', subtitulo: [DS.origem('prumo'), DS.chip(origemDoLocal(p)), DS.chip(rotuloClassificacao(p.dados.classificacao))] });
  }

  async function abrirTicketLocalPorId(e, id) {
    const r = await api.propostas(e.id); if (!r.ok) { avisar(r.error, true); return; }
    const p = r.data.find(x => x.id === id && x.tipo === 'bug' && x.estado !== 'DESCARTADA');
    if (!p) { avisar(tr('Ticket local não encontrado neste projeto.'), true); return; }
    abrirLocal(e, p, () => void mostrar('tickets'));
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
      DS.bloco(tr('Comentários ({n})', { n: comentarios.length }), comentarios.length ? h('ul', { class: 'ds-lista' }, comentarios.map((c) => h('li', { class: 'ds-comentario' }, h('span', { class: 'ds-avatar', 'aria-hidden': 'true' }, DS.iniciais(c.author?.displayName)), h('div', {}, h('strong', {}, c.author?.displayName || tr('Autor não informado')), c.updated || c.created ? h('span', { class: 'ds-sub' }, hora(c.updated || c.created)) : null, DS.texto(textoExterno(c.body)))))) : h('p', { class: 'suave' }, com.ok ? tr('Nenhum comentário.') : tr('Comentários indisponíveis: {e}', { e: textoErro(com.error) })),
        h('div', { class: 'ds-campo ds-mt' }, caixaTexto), h('div', { class: 'ds-cab-acoes ds-mt' }, DS.acao('Comentar…', async () => { resultadoOp(resultados, await executarOperacao(e, 'jira.comentar', { ticket: chave, texto: caixaTexto.value })); }, { id: 'tk-comentar', desabilitado: !esc }), !esc ? escritaDesligada('jira') : null)),
      DS.recolher(tr('Histórico de alterações ({n})', { n: hist.ok ? hist.data.dados.length : 0 }), hist.ok ? (hist.data.dados.length ? DS.tempo(hist.data.dados.map((z) => ({ titulo: z.mudancas.map((m) => `${m.campo}: ${m.de ?? '—'} → ${m.para ?? '—'}`).join('; '), sub: hora(z.em) + ' · ' + (z.por || '—') }))) : h('p', { class: 'suave' }, tr('Sem alterações registradas.'))) : h('p', { class: 'suave' }, tr('Indisponível: {e}', { e: textoErro(hist.error) }))),
      DS.bloco(tr('Anexos ({n})', { n: anexos.ok ? anexos.data.dados.length : 0 }), anexos.ok && anexos.data.dados.length ? h('div', { class: 'ds-arquivos' }, anexos.data.dados.map((a) => h('div', { class: 'ds-arquivo' }, h('span', { class: 'ds-arquivo-ic' }, DS.icone(/^image\//.test(a.tipo || '') ? 'imagem' : /^video\//.test(a.tipo || '') ? 'video' : 'arquivo')), h('div', {}, h('strong', {}, a.nome), h('span', { class: 'ds-sub' }, (a.bytes != null ? bytes(a.bytes) : '') + (a.em ? ' · ' + hora(a.em) : '')))))) : h('p', { class: 'suave' }, anexos.ok ? tr('Nenhum anexo.') : tr('Anexos indisponíveis: {e}', { e: textoErro(anexos.error) })),
        h('div', { class: 'ds-cab-acoes ds-mt' }, DS.acao('Anexar arquivo…', async () => { resultadoOp(resultados, await executarOperacao(e, 'jira.anexar', { ticket: chave }, { tipo: 'arquivo' })); }, { id: 'tk-anexar', icone: 'clipe', desabilitado: !esc }))));
    const aside = h('aside', {}, DS.meta([['Origem', DS.origem('jira', 'Jira · ' + vj.recurso.chave)], ['Tipo', x.issuetype?.name], ['Status', x.status?.name ? DS.chip(x.status.name, tomStatusJira(x.status)) : null], ['Prioridade', x.priority?.name], ['Responsável', x.assignee?.displayName || tr('Não atribuído')], ['Relator', x.reporter?.displayName], ['Atualizado', x.updated ? hora(x.updated) : null], ['Consultado', hora(t.data.consultadoEm)]]),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Ações')),
        trSel.options.length ? DS.campo('Mudar status', trSel) : h('p', { class: 'suave' }, trans.ok ? tr('Nenhuma transição disponível para este ticket.') : tr('Transições indisponíveis agora; tente de novo em instantes.')), trSel.options.length ? DS.acao('Aplicar transição…', async () => { const r = await executarOperacao(e, 'jira.transicionar', { ticket: chave, transicaoId: trSel.value }); if (r?.estado === 'CONFIRMADA') void abrirTicket(e, chave); else resultadoOp(resultados, r); }, { id: 'tk-transicionar', desabilitado: !esc || trSel.disabled }) : null,
        DS.acao('Editar resumo e descrição…', () => editarTicket(e, chave, x), { id: 'tk-editar', icone: 'editar', desabilitado: !esc }),
        DS.acao('Preparar bug relacionado…', () => abrirCriar(e, { origem: chave }), { id: 'tk-bug', icone: 'alerta' }),
        DS.acao('Criar cenário para validar este ticket', () => window.PrumoTestes.criarCenarioDoTicket(e, { chave, titulo: 'Validar ' + chave + ' · ' + (x.summary || ''), descricao: textoExterno(x.description) }), { id: 'tk-criar-cenario', desabilitado: window.PrumoConta?.soVer('testes') || (e.manualAtivo === false && !vinc(e, 'qase')) }),
        DS.acao('Importar como contexto', async () => { const r = await chamar(() => api.servicoImportar(e.id, chave)); if (r && !r.canceled) avisar(tr('Contexto importado como RASCUNHO.')); }, { id: 'tk-importar' }),
        !esc ? escritaDesligada('jira') : null));
    DS.modal(chave + ' · ' + (x.summary || ''), h('div', { class: 'ds-detalhe' }, main, aside), { tamanho: 'lg', subtitulo: [DS.origem('jira'), x.issuetype?.name ? DS.chip(x.issuetype.name) : null, x.status?.name ? DS.chip(x.status.name, tomStatusJira(x.status)) : null, x.priority?.name ? DS.chip(tr('Prioridade {p}', { p: x.priority.name })) : null] });
  }
  function editarTicket(e, chave, x) {
    const resumo = h('input', { id: 'tk-ed-resumo', maxlength: 255, value: x.summary || '' }); const desc = h('textarea', { id: 'tk-ed-descricao', rows: 10, maxlength: 8000 }); desc.value = textoExterno(x.description);
    const saida = h('div', { id: 'tk-ed-saida' }); const r0 = resumo.value, d0 = desc.value;
    DS.modal(tr('Editar {k}', { k: chave }), [DS.trilha([['Tickets', () => DS.fecharModal()], [chave, () => abrirTicket(e, chave)], ['Editar']], { semAtual: false }), h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Resumo', resumo, { inteiro: true }), DS.campo('Descrição', desc, { inteiro: true, ajuda: 'Texto simples. O Jira converte para o formato do ticket; segredos são mascarados.' })), saida,
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('A alteração é enviada após a confirmação nativa.')), DS.acao('Salvar no Jira…', async () => {
        const p = { ticket: chave }; if (resumo.value !== r0) p.resumo = resumo.value; if (desc.value !== d0) p.descricao = desc.value;
        if (Object.keys(p).length === 1) { saida.replaceChildren(DS.alerta('Nenhuma alteração para salvar.', 'aviso')); return; }
        const r = await executarOperacao(e, 'jira.editar', p); if (r?.estado === 'CONFIRMADA') void abrirTicket(e, chave); else if (r) saida.replaceChildren(painelResultado(r));
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
      !esc ? DS.alerta('Escrita no Jira desligada. Habilite em Projetos para criar tickets.', 'aviso', 'cadeado') : null,
      m.erro ? DS.alerta(tr('Tipos de ticket indisponíveis: {e}', { e: textoErro(m.erro) }), 'falha') : null,
      h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Tipo de ticket', tipo), DS.campo('Ticket de origem (opcional)', org), DS.campo('Resumo', res, { inteiro: true }), DS.campo('Descrição', desc, { inteiro: true }), DS.campo('Rótulos (separados por vírgula)', rot, { inteiro: true })), saida,
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('{p} · confirmação nativa antes de enviar', { p: 'Jira ' + vj.recurso.chave })), DS.acao('Cancelar', () => DS.fecharModal(), { id: 'tk-novo-cancelar' }), DS.acao('Revisar e criar…', async () => {
        const p = { tipoId: tipo.value, resumo: res.value, descricao: desc.value, rotulos: rot.value.split(/[,\s]+/).filter(Boolean), ...(org.value.trim() ? { origem: org.value.trim().toUpperCase() } : {}) };
        const r = await executarOperacao(e, 'jira.criar_ticket', p); if (!r) return; saida.replaceChildren(painelResultado(r));
        if (r.estado === 'CONFIRMADA' && defeito && vq && r.remoto?.chave) {
          const a = await api.espacoAssociar(e.id, { de: { tipo: 'qase-defeito', id: String(defeito.id), vinculoId: vq.id, origem: vq.recurso.chave }, para: { tipo: 'jira-bug', id: r.remoto.chave, vinculoId: vj.id, origem: vj.recurso.chave }, justificativa: tr('Ticket aberto no Prumo a partir do defeito Qase {id}', { id: defeito.id }) });
          saida.append(a.ok || /TRACE_DUPLICATE/.test(a.error || '') ? DS.alerta(tr('Vínculo registrado: Defeito Qase {d} → {k}.', { d: defeito.id, k: r.remoto.chave }), 'ok') : DS.alerta(tr('Ticket criado, mas o vínculo não foi registrado: {e}', { e: textoErro(a.error) }), 'falha'));
          await atualizarEspaco(e);
        }
      }, { id: 'tk-novo-criar', primaria: true, desabilitado: !esc || !m.tipos.length }))], { tamanho: 'md' });
  }
  async function abrirDefeito(e, id) {
    const vq = vinc(e, 'qase'), vj = vinc(e, 'jira'); if (!vq) { avisar(tr('Qase não vinculado a este projeto.'), true); return; }
    const carregando = DS.modal(tr('Defeito {id}', { id }), DS.carregando('Consultando o Qase…'), { tamanho: 'lg' });
    const r = await api.servicoConsultar(e.id, 'qase', 'defeito', {}, String(id)); if (carregando && !carregando.isConnected) return;
    if (!r.ok) { avisar(r.error, true); DS.modal(tr('Defeito {id}', { id }), DS.estadoTela('erro', 'Não foi possível abrir o defeito', r.error), { tamanho: 'md' }); return; }
    const d = r.data.dados; e = estado.espaco?.id === e.id ? estado.espaco : e; const permQase = !!(await escritaDoProjeto(e)).qase;
    const tickets = e.relacoes.filter((x) => x.de.tipo === 'qase-defeito' && x.de.id === String(id) && x.para.tipo === 'jira-bug');
    const lista = (v) => (Array.isArray(v) ? v : []);
    const main = h('section', { class: 'ds-detalhe-main', id: 'def-detalhe' },
      DS.bloco('Resultado observado', DS.texto(d.actual_result || d.description, 'Sem descrição retornada.')),
      lista(d.runs).length ? DS.bloco('Runs relacionadas', h('div', { class: 'ds-celula-nos' }, lista(d.runs).map((x) => h('span', { class: 'ds-no', 'data-servico': 'qase' }, h('i'), tr('Run {id}', { id: x }))))) : null,
      lista(d.results).length ? DS.bloco('Resultados relacionados', h('div', { class: 'ds-celula-nos' }, lista(d.results).map((x) => h('span', { class: 'ds-no', 'data-servico': 'qase' }, h('i'), String(x))))) : null,
      DS.bloco(tr('Anexos ({n})', { n: lista(d.attachments).length }), lista(d.attachments).length ? h('ul', { class: 'ds-lista' }, lista(d.attachments).map((a) => h('li', {}, a.filename || a.name || a.hash || tr('Anexo'), h('span', { class: 'ds-sub' }, a.size ? bytes(a.size) : '')))) : h('p', { class: 'suave' }, tr('Nenhum anexo.'))),
      blocoRelacoes(e, ['qase-defeito'], id),
      DS.recolher('Dados retornados pelo Qase', h('pre', { class: 'ds-codigo' }, JSON.stringify(d, null, 2))));
    const aside = h('aside', {}, DS.meta([['Origem', DS.origem('qase', 'Qase · ' + vq.recurso.chave)], ['Status', d.status != null ? String(d.status) : null], ['Severidade', d.severity != null ? String(d.severity) : null], ['Tags', lista(d.tags).map((x) => x.title || x).join(', ') || null], ['Atualizado', d.updated_at ? hora(d.updated_at) : null], ['Consultado', hora(r.data.consultadoEm)]]),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Jira')),
        tickets.length ? h('div', { class: 'ds-celula-nos' }, tickets.map((x) => noRef(e, x.para, x.para.id))) : null,
        vj ? (tickets.length ? h('p', { class: 'suave' }, tr('Já existe ticket relacionado a este defeito.')) : DS.acao('Abrir ticket no Jira…', () => abrirCriar(e, { resumo: `[Qase ${vq.recurso.chave}-${id}] ${d.title || ''}`.slice(0, 255), descricao: [tr('Defeito Qase: {k}-{id}', { k: vq.recurso.chave, id }), d.severity != null ? tr('Severidade: {s}', { s: d.severity }) : '', '', d.actual_result || ''].filter((z) => z !== null).join('\n').slice(0, 8000), defeito: { id } }), { id: 'def-jira', icone: 'mais' })) : h('p', { class: 'suave' }, tr('Vincule o Jira para abrir um ticket a partir deste defeito.')),
        DS.notaPermissao('Título, resultado, comentários e anexos são somente leitura no Prumo; só o status muda, com confirmação. Para um defeito novo, use Novo ticket com o Qase integrado ao projeto.')),
      blocoStatusDefeito(e, d, id, permQase));
    DS.modal(tr('Defeito {id}', { id: vq.recurso.chave + '-' + id }) + ' · ' + (d.title || ''), h('div', { class: 'ds-detalhe' }, main, aside), { tamanho: 'lg', subtitulo: [DS.origem('qase'), DS.chip('Defeito'), d.status != null ? DS.chip(String(d.status)) : null, d.severity != null ? DS.chip(tr('Severidade {s}', { s: d.severity })) : null] });
  }

  // Status do defeito no Qase (PATCH /v1/defect/{code}/status/{id}): em andamento, resolvido ou inválido. A versão lida (updated_at)
  // vai junto para recusar a mudança se alguém alterou o defeito no Qase depois que esta tela o leu.
  function blocoStatusDefeito(e, d, id, permitido) {
    const opcoes = [['in_progress', 'Em andamento'], ['resolved', 'Resolvido'], ['invalid', 'Inválido']].filter(([v]) => v !== d.status);
    const sel = h('select', { id: 'def-status-novo', 'aria-label': tr('Novo status') }, opcoes.map(([v, t]) => h('option', { value: v }, tr(t))));
    const motivo = !permitido ? tr('Escrita no Qase desligada. Habilite em Projetos — Conexões.') : !d.updated_at ? tr('O Qase não informou a data de atualização; sem ela o Prumo não muda o status com segurança.') : null;
    return h('div', { class: 'ds-acoes-col', id: 'def-status' }, h('h3', { class: 'ds-h' }, tr('Status no Qase')), DS.campo('Novo status', sel),
      DS.acao('Mudar status…', async () => { const x = await executarOperacao(e, 'qase.status_defeito', { defeitoId: Number(id), status: sel.value, versao: d.updated_at }); if (x?.estado === 'CONFIRMADA') { DS.fecharModal(); await abrirDefeito(e, id); } }, { id: 'def-status-mudar', desabilitado: !!motivo, titulo: motivo }),
      motivo ? h('p', { class: 'suave' }, motivo) : null);
  }

  // Issue do GitHub: somente leitura no Prumo; os dados vêm da listagem do repositório vinculado.
  function abrirIssue(e, i) {
    const vg = vinc(e, 'github'); if (!vg) { avisar(tr('GitHub não vinculado a este projeto.'), true); return; }
    const rot = Array.isArray(i.rotulos) ? i.rotulos : [];
    const main = h('section', { class: 'ds-detalhe-main', id: 'issue-detalhe' }, DS.bloco('Descrição', DS.texto(i.corpo, 'Sem descrição.')));
    const aside = h('aside', {}, DS.meta([['Origem', DS.origem('github', 'GitHub · ' + vg.recurso.chave)], ['Estado', i.estado === 'open' ? tr('Aberta') : i.estado === 'closed' ? tr('Fechada') : String(i.estado)], ['Rótulos', rot.join(', ') || null], ['Autor', i.autor || null], ['Comentários', String(i.comentarios ?? 0)], ['Atualizada', i.atualizado ? hora(i.atualizado) : null], ['Link', i.url ? h('code', {}, i.url) : null]]),
      DS.notaPermissao('Issues do GitHub são somente leitura aqui. Para uma issue nova, use Novo ticket com o GitHub integrado ao projeto; edição e comentários não têm contrato.'));
    DS.modal('#' + i.numero + ' · ' + (i.titulo || ''), h('div', { class: 'ds-detalhe' }, main, aside), { tamanho: 'lg', subtitulo: [DS.origem('github'), DS.chip('Issue')] });
  }

  // ======================= Casos (Qase) =======================
