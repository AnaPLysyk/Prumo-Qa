/** Reúne trecho visual da função runs para o bundle fluxos-v40. */
  async function novoPlano(e, esc) {
    const mem = memoriaDaTela('testes', e.id); const casos = mem.casos || (mem.casos = await carregarQase(e, mem, 'casos'));
    if (casos.erro) {
      DS.modal('Novo plano no Qase', DS.estadoTela('erro', 'Não foi possível consultar os casos do Qase', casos.erro,
        [DS.acao('Tentar novamente', async () => { delete mem.casos; await novoPlano(e, esc); }, { icone: 'atualizar' })]));
      return;
    }
    const titulo = h('input', { id: 'plano-titulo', maxlength: 255 }); const marcados = new Set(); const saida = h('div', { id: 'plano-saida' });
    const busca = h('input', { id: 'plano-casos-busca', type: 'search', placeholder: tr('Buscar casos'), 'aria-label': tr('Buscar casos'), maxlength: 120 });
    const lista = h('div', { class: 'ds-opcoes coluna', id: 'plano-casos' }); const pagina = h('div', { class: 'ds-paginacao', id: 'plano-casos-pagina' });
    const contador = h('span', { class: 'ds-sub', id: 'plano-casos-contador', role: 'status', 'aria-live': 'polite' });
    let paginaAtual = 1; const porPagina = 100;
    const desenharCasos = () => {
      const q = busca.value.trim().toLocaleLowerCase();
      const filtrados = casos.itens.filter((c) => !q || `${c.id} ${c.title}`.toLocaleLowerCase().includes(q));
      const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina)); paginaAtual = Math.min(paginaAtual, totalPaginas);
      const visiveis = filtrados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);
      contador.textContent = tr('{n} caso(s) · {m} selecionado(s)', { n: filtrados.length, m: marcados.size });
      lista.replaceChildren(...visiveis.map((c) => h('label', {}, h('input', { type: 'checkbox', 'data-caso': c.id, checked: marcados.has(String(c.id)), onchange: (ev) => { if (ev.target.checked) marcados.add(String(c.id)); else marcados.delete(String(c.id)); desenharCasos(); } }), `${c.id} · ${c.title}`)));
      pagina.replaceChildren(totalPaginas > 1 ? DS.acao(tr('Anterior'), () => { paginaAtual--; desenharCasos(); }, { compacto: true, desabilitado: paginaAtual === 1 }) : null, h('span', {}, tr('Página {n} de {m}', { n: paginaAtual, m: totalPaginas })), totalPaginas > 1 ? DS.acao(tr('Próxima'), () => { paginaAtual++; desenharCasos(); }, { compacto: true, desabilitado: paginaAtual === totalPaginas }) : null);
    };
    busca.addEventListener('input', () => { paginaAtual = 1; desenharCasos(); }); desenharCasos();
    DS.modal('Novo plano no Qase', [!esc ? DS.alerta('Escrita no Qase desligada. Habilite em Projetos para criar planos.', 'aviso', 'cadeado') : null, h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título do plano', titulo, { inteiro: true }),
      h('div', { class: 'ds-campo inteiro' }, h('div', { class: 'plano-casos-cab' }, h('span', {}, tr('Casos ({n})', { n: casos.itens.length })), contador), casos.itens.length ? h('div', { class: 'plano-casos-selecao' }, busca, lista, pagina) : h('p', { class: 'suave' }, vinc(e, 'qase') ? tr('Nenhum caso retornado pelo Qase.') : tr('Nenhum teste encontrado no código. Vincule a pasta do repositório ou conecte o Qase.')))), saida,
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar plano…', async () => { const r = await executarOperacao(e, 'qase.criar_plano', { titulo: titulo.value || 'Plano Prumo', casos: [...marcados] }); if (r) { saida.replaceChildren(painelResultado(r)); if (r.estado === 'CONFIRMADA') delete mem.planos; } }, { id: 'plano-criar', primaria: true, desabilitado: !esc }))], { tamanho: 'md' });
  }
  // ---- Runs: locais (preparadas no Prumo) e do Qase ----
  // Códigos de estado de run documentados pela API do Qase; código desconhecido aparece como está.
  const estadoRunQase = (x) => { const m = { 0: ['Ativa', 'info'], 1: ['Concluída', 'ok'], 2: ['Interrompida', 'aviso'], 3: ['Em andamento', 'info'] }[x.status]; const c = DS.chip(x.status_text || (m ? m[0] : tr('Estado {s}', { s: x.status })), m?.[1]); c.title = tr('Código do Qase: {s}', { s: x.status }); return c; };
  const contar = (r) => { const s = r.casos.map((c) => c.resultado?.status ?? 'NOT_RUN'); const n = (x) => s.filter((y) => y === x).length; return { total: s.length, pass: n('PASS'), fail: n('FAIL'), blocked: n('BLOCKED'), skipped: n('SKIPPED'), invalid: n('INVALID'), notRun: n('NOT_RUN') }; };
  function barraResultado(c, { compacta = false } = {}) {
    const t = Math.max(1, c.total); const seg = (n, v) => { const s = h('span'); s.style.width = (n / t) * 100 + '%'; s.style.background = `var(${v})`; return s; };
    const descricao = `${c.pass} PASS \u00b7 ${c.fail} FAIL \u00b7 ${c.blocked} BLOCKED \u00b7 ${c.notRun} NOT_RUN \u00b7 ${c.skipped || 0} SKIPPED \u00b7 ${c.invalid || 0} INVALID`;
    const legenda = compacta ? [['pass', '\u2713', c.pass, 'PASS'], ['fail', '\u00d7', c.fail, 'FAIL'], ['blocked', '!', c.blocked, 'BLOCKED'], ['not-run', '\u25cb', c.notRun, 'NOT_RUN']].map(([estado, icone, n, titulo]) => h('span', { 'data-resultado': estado, title: titulo, 'aria-hidden': 'true' }, icone + ' ' + n)) : descricao;
    return h('div', { class: 'ds-coluna' }, h('div', { class: 'ds-progresso', role: 'img', 'aria-label': descricao }, seg(c.pass, '--ok'), seg(c.fail, '--falha'), seg(c.blocked, '--aviso'), seg(c.notRun, '--linha'), seg(c.skipped || 0, '--suave'), seg(c.invalid || 0, '--acento')), h('span', { class: 'ds-sub' }, legenda));
  }
  // Runs = tudo o que roda ou rodou: execuções locais (manuais e agendadas), runs preparadas no Prumo e runs do Qase, numa lista só.
  /** Linha no mesmo formato da lista de casos do repositório: ícone de origem (Q = Qase, P = Prumo), título com detalhes e o resultado à direita. */
  function linhaRep({ origem, titulo, sub, lado, abrir, rotulo, attrs }) {
    const ativar = (ev) => { if (ev.type === 'click' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrir(); } };
    return h('div', { class: 'rep-linha', role: 'button', tabindex: 0, 'aria-label': rotulo, onclick: ativar, onkeydown: ativar, ...(attrs || {}) },
      h('span', { class: 'rep-tipo', 'data-origem': origem, title: origem === 'qase' ? tr('Do Qase') : tr('Escrito no Prumo') }, origem === 'qase' ? 'Q' : 'P'),
      h('div', { class: 'rep-titulo' }, h('strong', {}, h('span', { class: 'rep-t' }, titulo)), sub ? h('span', { class: 'ds-sub' }, sub) : null), lado || null);
  }
  const listaDeRuns = (linhas, id) => h('div', { class: 'rep-lista', id: id || 'runs-lista' }, linhas.map(linhaRep));
  const resultadoDaRun = (barra, estadoRun) => h('div', { class: 'ds-run-lado' }, barra, estadoRun);
  function passaFiltroRun(linha, filtro) {
    const busca = String(filtro.busca || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const texto = String(linha.texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (busca && !texto.includes(busca)) return false;
    if (filtro.origem && linha.origem !== filtro.origem) return false;
    if (filtro.status && !linha.statuses.some((s) => s.valor === filtro.status)) return false;
    if (filtro.ambiente && linha.ambiente !== filtro.ambiente) return false;
    if (filtro.de && (!linha.data || linha.data < filtro.de)) return false;
    if (filtro.ate && (!linha.data || linha.data > filtro.ate)) return false;
    return true;
  }
  async function telaRuns(e, mem, corpo, esc) {
    const vq = e ? vinc(e, 'qase') : null; const rotinaId = estado.filtroExec?.rotinaId;
    const destinoDaLista = { corpo, voltar: () => { corpo.replaceChildren(); return telaRuns(e, mem, corpo, esc); } };
    // Uma run do Prumo aberta (pela lista, ao preparar ou vindo da página da run do Qase) ocupa a área no lugar da lista.
    if (e && mem.runAberta) return abrirRunLocal(e, mem.runAberta, esc, destinoDaLista);
    const area = h('div', { id: 'runs-area' }, DS.esqueleto(5)); const fonte = h('div');
    const filtro = mem.filtrosRuns || (mem.filtrosRuns = { busca: '', origem: '', status: '', ambiente: '', de: '', ate: '', aberto: false });
    const busca = DS.busca({ id: 'runs-busca', placeholder: 'Buscar runs', rotulo: 'Buscar runs por título ou ID', valor: filtro.busca });
    const origem = DS.selecao({ id: 'runs-filtro-origem', rotulo: 'Origem', opcoes: [['', 'Todas as origens'], ['exec', 'Execuções'], ['prumo', 'Runs do Prumo'], ['qase', 'Runs do Qase']], valor: filtro.origem, aoMudar: (v) => { filtro.origem = v; desenhar(); } });
    const status = DS.selecao({ id: 'runs-filtro-status', rotulo: 'Status ou resultado', opcoes: [['', 'Todos os status']], valor: filtro.status, aoMudar: (v) => { filtro.status = v; desenhar(); } });
    const ambiente = DS.selecao({ id: 'runs-filtro-ambiente', rotulo: 'Ambiente', opcoes: [['', 'Todos os ambientes']], valor: filtro.ambiente, aoMudar: (v) => { filtro.ambiente = v; desenhar(); } });
    const de = h('input', { id: 'runs-filtro-de', type: 'date', value: filtro.de, 'aria-label': tr('Data inicial'), onchange: (ev) => { filtro.de = ev.target.value; desenhar(); } });
    const ate = h('input', { id: 'runs-filtro-ate', type: 'date', value: filtro.ate, 'aria-label': tr('Data final'), onchange: (ev) => { filtro.ate = ev.target.value; desenhar(); } });
    const resumoFiltros = h('span', { class: 'ds-sub', id: 'runs-filtro-contagem', role: 'status', 'aria-live': 'polite' });
    const ajudaFiltros = DS.info(e ? tr('Filtros limitados ao espaço selecionado: {n}. Aplicados aos resultados carregados.', { n: e.nome }) : tr('Filtros aplicados aos resultados carregados.'));
    function limparFiltros() {
      Object.assign(filtro, { busca: '', origem: '', status: '', ambiente: '', de: '', ate: '' });
      busca.input.value = ''; origem.value = ''; status.value = ''; ambiente.value = ''; de.value = ''; ate.value = '';
      desenhar();
    }
    const filtros = h('details', { class: 'ds-recolher runs-filtros', open: filtro.aberto, ontoggle: (ev) => { filtro.aberto = ev.currentTarget.open; } },
      h('summary', {}, tr('Filtros avançados'), ajudaFiltros),
      DS.barra(busca.no, origem, status, ambiente),
      h('div', { class: 'ds-form runs-filtros-periodo' }, DS.campo('Data inicial', de), DS.campo('Data final', ate)),
      DS.barra(resumoFiltros, DS.acao('Limpar filtros', limparFiltros, { id: 'runs-filtros-limpar', compacto: true })));
    if (rotinaId) corpo.append(DS.barra(DS.acao('Limpar filtro de rotina', () => { delete estado.filtroExec.rotinaId; void mostrar('runs'); }, { id: 'runs-limpar-rotina', compacto: true })));
    corpo.append(filtros, fonte, area);
    busca.input.addEventListener('input', () => { filtro.busca = busca.input.value; desenhar(); });
    let dados = null;
    function desenhar() {
      if (!dados) return;
      const { rl, remotas, execs } = dados; const passa = (origem) => !rotinaId || origem === 'exec';
      const ambienteECasos = (amb, n) => [amb && amb !== '—' ? amb : null, n ? tr('{n} caso(s)', { n }) : null];
      const dataLocal = (valor) => { const d = new Date(valor); return Number.isFinite(d.getTime()) ? [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-') : ''; };
      const statusDaLinha = (valor) => [...new Set(valor.filter((x) => x != null && x !== '').map(String))].map((v) => ({ valor: v, rotulo: tr(v) }));
      const estadosQase = { 0: 'Ativa', 1: 'Concluída', 2: 'Interrompida', 3: 'Em andamento' };
      const linhasExec = execs.filter(() => passa('exec')).map((x) => { const r = x.resultado; const c = r?.contagem && r.contagem.pass + r.contagem.fail + r.contagem.blocked + r.contagem.notRun ? r.contagem : null; const total = c ? c.pass + c.fail + c.blocked + c.notRun : 0;
        return { origem: 'local', attrs: { 'data-exec': x.id }, abrir: () => window.PrumoOperacao.abrirExecucao(x), rotulo: tr('Abrir execução {n}', { n: x.rotina }), titulo: x.rotina,
          sub: [x.ticket, x.id.slice(0, 8), e ? null : x.projeto, x.origem === 'AGENDA' ? 'Agenda' : 'Manual', rotuloTipo(x.tipo), hora(x.inicio || x.criadoEm)].filter(Boolean).join(' · '),
          lado: resultadoDaRun(c ? barraResultado({ total, pass: c.pass, fail: c.fail, blocked: c.blocked, notRun: c.notRun }, { compacta: true }) : null, selo(r?.status || x.estado)),
          filtro: { origem: 'exec', texto: [x.rotina, x.id, x.ticket, x.projeto, x.ambiente, x.resultado?.status, x.estado].filter(Boolean).join(' '), ambiente: x.ambiente || '', data: dataLocal(x.inicio || x.criadoEm), statuses: statusDaLinha([r?.status, x.estado]) } }; });
      const linhasPrumo = rl.filter(r => passa('prumo') && !remotas.itens.some(x => Number(x.id) === r.runIdRemoto)).map((r) => { const c = contar(r);
        return { origem: 'local', attrs: { 'data-run': r.id }, abrir: () => r.runIdRemoto ? abrirRunQase(e, { id: r.runIdRemoto, title: r.titulo }, destinoDaLista) : abrirRunLocal(e, r.id, esc, destinoDaLista), rotulo: tr('Abrir run {t}', { t: r.titulo }), titulo: r.titulo,
          sub: [r.runIdRemoto ? tr('Qase #{id}{c}', { id: r.runIdRemoto, c: r.confirmadaNoQase ? ' · ' + tr('confirmada') : '' }) : tr('ainda não criada no Qase'), ...ambienteECasos(r.ambiente, c.total)].filter(Boolean).join(' · '),
          lado: resultadoDaRun(barraResultado(c, { compacta: true }), selo(r.estado)),
          filtro: { origem: 'prumo', texto: [r.titulo, r.id, r.runIdRemoto, r.planoId, r.ambiente, r.estado].filter(Boolean).join(' '), ambiente: r.ambiente || '', data: dataLocal(r.criadaEm), statuses: statusDaLinha([r.estado, ...r.casos.map((x) => x.resultado?.status)]) } }; });
      const linhasQase = remotas.itens.filter((x) => passa('qase')).map((x) => ({ origem: 'qase', attrs: { 'data-run-qase': String(x.id) }, abrir: () => abrirRunQase(e, x, destinoDaLista), rotulo: tr('Abrir run do Qase {id}', { id: x.id }), titulo: x.title || tr('Run {id}', { id: x.id }),
        sub: [tr('Qase #{id}', { id: x.id }), ...ambienteECasos(x.environment?.title, x.cases_count)].filter(Boolean).join(' · '),
        lado: resultadoDaRun(x.stats ? barraResultado({ total: x.stats.total || 0, pass: x.stats.passed || 0, fail: x.stats.failed || 0, blocked: x.stats.blocked || 0, notRun: x.stats.untested || 0 }, { compacta: true }) : null, x.status != null ? estadoRunQase(x) : null),
        filtro: { origem: 'qase', texto: [x.title, x.id, x.plan_id, x.environment?.title, x.status_text, x.status].filter(Boolean).join(' '), ambiente: x.environment?.title || '', data: dataLocal(x.start_time || x.created_at || x.created), statuses: statusDaLinha([x.status == null ? null : 'qase:' + x.status]), statusRotulos: x.status == null ? [] : [{ valor: 'qase:' + x.status, rotulo: x.status_text || tr(estadosQase[x.status] || 'Estado {s}', { s: x.status }) }] } }));
      const linhas = [...linhasExec, ...linhasPrumo, ...linhasQase]; const todosStatus = new Map();
      for (const linha of linhas) for (const s of [...linha.filtro.statuses, ...(linha.filtro.statusRotulos || [])]) todosStatus.set(s.valor, s.rotulo);
      status.replaceChildren(h('option', { value: '' }, tr('Todos os status')),
        ...[...todosStatus].sort((a, b) => a[1].localeCompare(b[1])).map(([valor, rotulo]) => h('option', { value: valor, selected: filtro.status === valor }, rotulo)),
        ...(filtro.status && !todosStatus.has(filtro.status) ? [h('option', { value: filtro.status, selected: true }, tr(filtro.status))] : []));
      const todosAmbientes = [...new Set(linhas.map((l) => l.filtro.ambiente).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      ambiente.replaceChildren(h('option', { value: '' }, tr('Todos os ambientes')),
        ...todosAmbientes.map((valor) => h('option', { value: valor, selected: filtro.ambiente === valor }, tr(valor))),
        ...(filtro.ambiente && !todosAmbientes.includes(filtro.ambiente) ? [h('option', { value: filtro.ambiente, selected: true }, tr(filtro.ambiente))] : []));
      const visiveis = linhas.filter((l) => passaFiltroRun(l.filtro, filtro));
      const temFiltro = [filtro.busca, filtro.origem, filtro.status, filtro.ambiente, filtro.de, filtro.ate].some(Boolean);
      resumoFiltros.textContent = temFiltro ? tr('{n} de {total} runs', { n: visiveis.length, total: linhas.length }) : '';
      area.replaceChildren(visiveis.length ? listaDeRuns(visiveis)
        : linhas.length ? DS.estadoTela('vazio', 'Nenhuma run combina com os filtros', 'Ajuste ou limpe os filtros para ver outras runs.', [DS.acao('Limpar filtros', limparFiltros, { compacto: true })], { id: 'runs-sem-resultado-filtro' })
        : dados.erros.length ? DS.estadoTela('erro', 'Não foi possível consultar todas as runs', dados.erros.join(' '),
            [DS.acao('Tentar novamente', async () => { delete mem.runsQase; await carregar(); }, { icone: 'atualizar' })], { id: 'runs-falha-consulta' })
        : DS.estadoTela('vazio', 'Nenhuma run encontrada', 'Execuções aparecem aqui quando uma rotina roda ou é executada agora; use "Preparar run" para escolher casos do Qase.', [], { id: 'runs-vazio' }));
    }
    async function carregar() {
      area.replaceChildren(DS.esqueleto(5));
      const [locais, remotas, lista] = await Promise.all([e ? api.runs(e.id) : Promise.resolve({ ok: true, data: [] }), vq ? (mem.runsQase || carregarQase(e, mem, 'runs', { limite: 50 })) : Promise.resolve({ itens: [], em: null }), chamar(() => api.execucoes({ espacoId: e?.id, rotinaId, limite: 100 }))]); if (vq) mem.runsQase = remotas;
      const rl = locais?.ok ? locais.data : [];
      const erros = [!locais?.ok && e ? 'Runs locais indisponíveis.' : null,
        !lista ? 'Execuções não puderam ser consultadas.' : null,
        remotas.erro ? 'Runs do Qase indisponíveis.' : null].filter(Boolean);
      dados = { rl, remotas, execs: lista?.execucoes || [], erros };
      fonte.replaceChildren(erros.length ? DS.alerta(erros.join(' ') + ' As informações disponíveis podem estar incompletas.', 'falha') : null);
      desenhar();
    }
    await carregar();
  }
  // Casos sem id no Qase (testes do código e cenários do Prumo) usam um id local estável (hash) acima de CASO_LOCAL_MIN.
  const idLocalDoCaso = (s) => { let x = 2166136261; for (const ch of s) { x ^= ch.charCodeAt(0); x = Math.imul(x, 16777619) >>> 0; } return 1e9 + (x % 1e9); };
  const ORIGEM_DO_CASO = { qase: 'Qase', prumo: 'Prumo', codigo: 'Código' };
  /** Casos que podem entrar numa run, como no Qase: os do Qase com a suíte deles, os cenários do Prumo com as suítes locais e, sem Qase, os testes do código por arquivo. */
  async function carregarCasosDoRepositorio(e) {
    const mem = memoriaDaTela('testes', e.id); const vq = vinc(e, 'qase'); const itens = []; const erros = [];
    if (vq) {
      let pagina = mem.casos || await carregarQase(e, mem, 'casos'); const lista = [...(pagina.itens || [])]; let paginas = 0;
      while (!pagina.erro && pagina.proxima != null && paginas++ < 20) {
        pagina = await carregarQase(e, mem, 'casos', typeof pagina.proxima === 'string' ? { cursor: pagina.proxima, limite: 100 } : { offset: pagina.proxima, limite: 100 });
        lista.push(...(pagina.itens || []));
      }
      if (pagina.erro) erros.push(pagina.erro);
      const suites = mem.suitesQase || await carregarQase(e, mem, 'suites'); if (suites && !suites.erro) mem.suitesQase = suites;
      const nomes = new Map((suites?.itens || []).map((s) => [Number(s.id), s.title]));
      for (const c of lista) itens.push({ casoId: Number(c.id), titulo: c.title || '—', origem: 'qase', rotulo: vq.recurso.chave + '-' + c.id, grupo: 'q:' + (c.suite_id ?? ''), suite: c.suite_id != null ? nomes.get(Number(c.suite_id)) || tr('Suíte {id}', { id: c.suite_id }) : null, caso: c });
    } else {
      const r = await api.testesCatalogo(e.id); if (!r.ok) erros.push(r.error);
      for (const f of (r.ok && r.data?.catalogo?.features) || []) for (const t of f.testes) itens.push({ casoId: idLocalDoCaso(f.arquivo + '#' + t.titulo), titulo: t.titulo, origem: 'codigo', rotulo: tr('código'), grupo: 'f:' + f.arquivo, suite: f.arquivo });
    }
    const locais = await api.repositorioLocal(e.id);
    if (locais.ok) { const nomes = new Map(locais.data.suites.map((s) => [s.id, s.titulo])); for (const c of [...locais.data.casos].sort((a, b) => (a.numero || 0) - (b.numero || 0))) itens.push({ casoId: idLocalDoCaso(c.id), casoLocalId: c.id, titulo: c.titulo, origem: 'prumo', rotulo: c.numero ? 'P-' + c.numero : 'P', grupo: 'l:' + (c.suiteLocalId ?? ''), suite: c.suiteLocalId ? nomes.get(c.suiteLocalId) || null : null }); }
    else erros.push(locais.error);
    return { itens, erro: erros.filter(Boolean).join(' ') || null };
  }
  const tituloDoGrupo = (c) => c.suite || (c.origem === 'qase' ? tr('Casos sem suíte') : c.origem === 'prumo' ? tr('Cenários sem suíte') : tr('Testes do código'));
  /** Suítes na ordem do repositório (Qase, Prumo, código) e por nome; "sem suíte" fica por último em cada origem. */
  function gruposDosCasos(itens) {
    const grupos = new Map(); for (const c of itens) { if (!grupos.has(c.grupo)) grupos.set(c.grupo, { chave: c.grupo, titulo: tituloDoGrupo(c), origem: c.origem, itens: [] }); grupos.get(c.grupo).itens.push(c); }
    const ordem = { qase: 0, prumo: 1, codigo: 2 }; const semSuite = (g) => (/^[ql]:$/.test(g.chave) ? 1 : 0);
    return [...grupos.values()].sort((a, b) => ordem[a.origem] - ordem[b.origem] || semSuite(a) - semSuite(b) || a.titulo.localeCompare(b.titulo));
  }
  /** O que vai para runs:preparar e runs:editar: o caso, o título e a suíte em que ele aparece. */
  const casoParaRun = (c) => ({ casoId: c.casoId, titulo: String(c.titulo).slice(0, 255), ...(c.casoLocalId ? { casoLocalId: c.casoLocalId } : {}), ...(c.suite ? { suite: String(c.suite).slice(0, 255) } : {}) });

  /** Escolha dos casos da run no estilo do Qase: suítes à esquerda (marcar a suíte inteira) e os casos à direita, com busca e o total escolhido. */
  function seletorDeCasos(fonte, marcados, aoMudar = () => {}) {
    const grupos = gruposDosCasos(fonte.itens); let foco = null; let termo = '';
    const caixasArvore = [], caixasLista = [], contadores = [];
    const quantos = (ls) => ls.filter((c) => marcados.has(c.casoId)).length;
    const marcar = (ls, sim) => { for (const c of ls) sim ? marcados.add(c.casoId) : marcados.delete(c.casoId); sincronizar(); aoMudar(); };
    const caixa = (lista, ls, rotulo, extra = {}) => { const x = h('input', { type: 'checkbox', 'aria-label': rotulo, ...extra, onchange: (ev) => marcar(ls, ev.target.checked) }); lista.push([x, ls]); return x; };
    const contador = (ls) => { const s = h('span', { class: 'rs-n' }); contadores.push([s, ls]); return s; };
    const arvore = h('div', { class: 'rs-suites', role: 'group', 'aria-label': tr('Suítes do repositório') });
    const lista = h('div', { id: 'run-casos', class: 'rs-casos' });
    const resumo = h('p', { class: 'rs-resumo', id: 'run-casos-contagem', role: 'status', 'aria-live': 'polite' });
    const busca = h('input', { id: 'run-casos-busca', type: 'search', class: 'qs-busca', placeholder: tr('Buscar casos do repositório'), 'aria-label': tr('Buscar casos do repositório'), maxlength: 100, oninput: (ev) => { termo = paraBusca(ev.target.value.trim()); desenharCasos(); } });
    function sincronizar() {
      for (const [x, ls] of [...caixasArvore, ...caixasLista]) { const n = quantos(ls); x.checked = !!ls.length && n === ls.length; x.indeterminate = n > 0 && n < ls.length; }
      for (const [s, ls] of contadores) { const n = quantos(ls); s.textContent = n ? tr('{n} de {t}', { n, t: ls.length }) : String(ls.length); }
      const escolhidos = fonte.itens.filter((c) => marcados.has(c.casoId)); const suites = new Set(escolhidos.map((c) => c.grupo)).size;
      resumo.textContent = escolhidos.length ? tr('{n} caso(s) de {s} suíte(s) na run', { n: escolhidos.length, s: suites }) : tr('Nenhum caso escolhido. Marque uma suíte inteira ou os casos que quiser.');
    }
    const focar = (chave) => { foco = chave; desenharArvore(); desenharCasos(); };
    function desenharArvore() {
      caixasArvore.length = 0; contadores.length = 0;
      const linha = (chave, titulo, ls, origem) => h('div', { class: 'rs-suite' + (foco === chave ? ' ativa' : ''), 'data-grupo': chave ?? 'todos' },
        caixa(caixasArvore, ls, chave === null ? tr('Marcar todos os casos do repositório') : tr('Marcar a suíte {s} inteira', { s: titulo })),
        h('button', { type: 'button', class: 'rs-suite-nome', 'aria-pressed': String(foco === chave), title: titulo, onclick: () => focar(chave) }, origem ? h('span', { class: 'rs-origem', 'data-origem': origem }, ORIGEM_DO_CASO[origem]) : null, h('span', { class: 'rs-suite-texto' }, titulo)), contador(ls));
      arvore.replaceChildren(linha(null, tr('Todos os casos'), fonte.itens), ...grupos.map((g) => linha(g.chave, g.titulo, g.itens, g.origem)));
    }
    function desenharCasos() {
      caixasLista.length = 0;
      const vis = (foco ? grupos.filter((g) => g.chave === foco) : grupos).map((g) => ({ g, ls: g.itens.filter((c) => !termo || paraBusca(c.titulo + ' ' + c.rotulo + ' ' + c.casoId).includes(termo)) })).filter((x) => x.ls.length);
      const mostrados = vis.flatMap((x) => x.ls);
      lista.replaceChildren(
        mostrados.length ? h('label', { class: 'rs-todos' }, caixa(caixasLista, mostrados, tr('Marcar os casos mostrados')), tr('Marcar os {n} caso(s) mostrados', { n: mostrados.length }))
          : h('p', { class: 'suave rs-vazio' }, fonte.itens.length ? tr('Nenhum caso combina com a busca.') : fonte.erro || tr('Nenhum caso no repositório deste projeto. Escreva cenários em Testes › Repositório.')),
        ...vis.map(({ g, ls }) => h('section', { class: 'rs-grupo', 'data-grupo': g.chave }, foco ? null : h('h4', { class: 'rs-grupo-titulo' }, h('span', { class: 'rs-origem', 'data-origem': g.origem }, ORIGEM_DO_CASO[g.origem]), h('span', {}, g.titulo)),
          ...ls.map((c) => h('label', { class: 'rs-caso' }, caixa(caixasLista, [c], tr('Marcar {t}', { t: c.titulo }), { 'data-caso': String(c.casoId) }), h('span', { class: 'qs-id' }, c.rotulo), h('span', { class: 'rs-caso-titulo', title: c.titulo }, c.titulo), c.caso ? chipTipoCaso(c.caso) : null)))));
      sincronizar();
    }
    desenharArvore(); desenharCasos();
    return { no: h('div', { class: 'rs' }, h('div', { class: 'rs-topo' }, busca, resumo), h('div', { class: 'rs-corpo' }, arvore, lista)), escolhidos: () => fonte.itens.filter((c) => marcados.has(c.casoId)) };
  }

  async function prepararRun(e, inicial = {}) {
    const fonte = await carregarCasosDoRepositorio(e);
    const titulo = h('input', { id: 'run-titulo', maxlength: 255, value: inicial.titulo ? tr('Run · {t}', { t: inicial.titulo }) : tr('Run de {d}', { d: new Date().toLocaleDateString() }) });
    const amb = selecaoSimples('run-ambiente', [['teste', 'Teste'], ['homologacao', 'Homologação'], ['local', 'Local']]); const marcados = new Set(inicial.casos || []);
    // Com Qase vinculado, milestone (ativos) e ambiente do próprio Qase são opcionais e seguem na criação da run.
    const marcoQase = h('select', { id: 'run-marco-qase' }, h('option', { value: '' }, tr('Sem milestone'))); const ambQase = h('select', { id: 'run-ambiente-qase' }, h('option', { value: '' }, tr('Sem ambiente do Qase')));
    if (vinc(e, 'qase')) {
      void api.servicoConsultar(e.id, 'qase', 'marcos', { offset: 0, limite: 100 }).then((r) => { if (r.ok) for (const m of (r.data.dados || []).filter((m) => m.estado !== 'completed')) marcoQase.append(h('option', { value: String(m.id) }, m.titulo)); });
      void api.servicoConsultar(e.id, 'qase', 'ambientes', { offset: 0, limite: 100 }).then((r) => { if (r.ok) for (const a of r.data.dados || []) ambQase.append(h('option', { value: String(a.id) }, a.titulo)); });
    }
    const preparar = DS.acao('Preparar run', async () => {
      const escolhidos = sel.escolhidos(); if (!escolhidos.length) return;
      const r = await chamar(() => api.runPreparar({ espacoId: e.id, titulo: titulo.value, ambiente: amb.value, casos: escolhidos.map(casoParaRun), ...(inicial.planoId ? { planoId: inicial.planoId } : {}), ...(marcoQase.value ? { marcoId: Number(marcoQase.value) } : {}), ...(ambQase.value ? { ambienteQaseId: Number(ambQase.value) } : {}) }));
      if (r) { avisar(tr('Run preparada com {n} caso(s). Ela ainda não existe no Qase.', { n: escolhidos.length })); DS.fecharModal(); await abrirRunLocal(e, r.id); }
    }, { id: 'run-preparar', primaria: true });
    const sel = seletorDeCasos(fonte, marcados, () => { preparar.disabled = !marcados.size; }); preparar.disabled = !marcados.size;
    DS.modal('Nova run', [DS.info('Uma run reúne os casos que você vai executar agora: um caso, vários ou suítes inteiras. Ela é preparada neste computador; criá-la no Qase é um passo separado.'),
      h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título da run', titulo), DS.campo('Ambiente', amb), vinc(e, 'qase') ? DS.campo('Milestone no Qase', marcoQase) : null, vinc(e, 'qase') ? DS.campo('Ambiente no Qase', ambQase) : null),
      h('div', { class: 'ds-campo inteiro rs-campo' }, h('span', {}, tr('Casos do repositório ({n})', { n: fonte.itens.length })), sel.no),
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), preparar)], { tamanho: 'lg' });
  }
  /** Incluir e tirar casos de uma run do Prumo que ainda não existe no Qase: o mesmo seletor da criação, já com os casos dela marcados. */
  async function editarCasosDaRun(e, r, linhas, aoSalvar) {
    const fonte = await carregarCasosDoRepositorio(e);
    // Casos da run que saíram do repositório continuam na lista com o título guardado na run.
    for (const l of linhas) if (!fonte.itens.some((x) => x.casoId === l.id)) fonte.itens.push({ casoId: l.id, casoLocalId: l.c.casoLocalId, titulo: l.titulo, origem: l.c.casoLocalId ? 'prumo' : l.id >= 1e9 ? 'codigo' : 'qase', rotulo: l.rotulo, grupo: 'r:', suite: tr('Fora do repositório') });
    const marcados = new Set(linhas.map((l) => l.id));
    const salvar = DS.acao('Salvar casos da run', async () => {
      const escolhidos = sel.escolhidos(); if (!escolhidos.length) return;
      const x = await chamar(() => api.runEditar(r.id, r.titulo, r.ambiente, escolhidos.map(casoParaRun)));
      if (!x || x.canceled) return; avisar(tr('Run atualizada: {n} caso(s).', { n: escolhidos.length })); DS.fecharModal(); await aoSalvar();
    }, { id: 'run-casos-salvar', primaria: true });
    const sel = seletorDeCasos(fonte, marcados, () => { salvar.disabled = !marcados.size; });
    DS.modal('Casos da run', [DS.info('Marque ou desmarque casos e suítes. Os casos que ficam guardam o resultado; tirar um caso que já tem resultado pede confirmação.'), sel.no,
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), salvar)], { tamanho: 'lg', subtitulo: r.titulo });
  }
  function editarRunLocal(e, r) {
    const titulo = h('input', { id: 'run-editar-titulo', maxlength: 255, value: r.titulo });
    const ambiente = selecaoSimples('run-editar-ambiente', [['teste', 'Teste'], ['homologacao', 'Homologação'], ['local', 'Local']], r.ambiente);
    DS.modal(tr('Editar run'), [h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() },
      DS.campo('Título da run', titulo), DS.campo('Ambiente', ambiente)),
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Salvar alterações', async () => {
        const atualizada = await chamar(() => api.runEditar(r.id, titulo.value, ambiente.value));
        if (!atualizada) return;
        avisar(tr('Run atualizada localmente.'));
        DS.fecharModal();
        void mostrar('testes');
      }, { id: 'run-editar-salvar', primaria: true }))], { tamanho: 'md' });
  }
  function politicaDaRun(e, r, passo) {
    const dias = h('input', { type: 'number', min: 1, max: 30, value: 7, id: 'pol-run-dias-' + r.id }); const usos = h('input', { type: 'number', min: 1, max: 1000, value: 5, id: 'pol-run-usos-' + r.id });
    DS.modal('Publicação agendada', [DS.info('Política para rotinas agendadas publicarem os resultados desta run no Qase. Sem política, os resultados ficam neste computador até você publicar.'),
      h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Validade (dias)', dias), DS.campo('Máximo de publicações', usos)),
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Aprovar política de publicação agendada…', async () => { const x = await passo(() => api.runPolitica(e.id, r.runIdRemoto, Number(dias.value), Number(usos.value)), tr('Política registrada para a run {id}.', { id: r.runIdRemoto })); if (x && !x.canceled) DS.fecharModal(); }, { id: 'run-politica-' + r.id, primaria: true }))], { tamanho: 'md', subtitulo: r.titulo });
  }

  /** Página da run preparada no Prumo, no mesmo desenho da run do Qase: casos por suíte com o resultado de cada um, marcar em lote,
   * painel do caso (execução, resultado e evidências) e o resumo ao lado. Sem `destino`, abre a página em Testes › Runs. */
  async function abrirRunLocal(e, id, esc, destino) {
    const mem = memoriaDaTela('testes', e.id);
    if (!destino) { mem.runAberta = id; (estado.sub ||= {}).testes = 'runs'; return mostrar('testes'); }
    const { corpo, voltar } = destino; mem.runAberta = id;
    if (!corpo.querySelector('.qs-run')) corpo.replaceChildren(DS.carregando('Abrindo a run…'));
    const [rs, and, repo] = await Promise.all([api.runs(e.id), api.runAndamento(e.id, id), api.repositorioLocal(e.id)]); if (!corpo.isConnected) return;
    const sair = () => { delete mem.runAberta; return voltar(); };
    const r = rs.ok ? rs.data.find((x) => x.id === id) : null;
    if (!r) { corpo.replaceChildren(DS.estadoTela('erro', rs.ok ? 'Run não encontrada' : 'Não foi possível abrir a run', rs.ok ? 'Ela pode ter sido apagada deste computador.' : rs.error, [DS.acao('Voltar às runs', sair)])); return; }
    const inicios = and.ok ? and.data : []; if (!and.ok) avisar(and.error, true);
    const vq = vinc(e, 'qase'); const soVer = !!window.PrumoConta?.soVer('testes'); const travada = !!r.runIdRemoto;
    const locais = new Map((repo.ok ? repo.data.casos : []).map((c) => [c.id, c])); const suitesLocais = new Map((repo.ok ? repo.data.suites : []).map((s) => [s.id, s.titulo]));
    const catalogo = new Map((mem.casos?.itens || []).map((c) => [Number(c.id), c])); const suitesQase = new Map((mem.suitesQase?.itens || []).map((s) => [Number(s.id), s.title]));
    const PARA = { PASS: 'passed', FAIL: 'failed', BLOCKED: 'blocked', SKIPPED: 'skipped', INVALID: 'invalid' };
    const DE = { passed: 'PASS', failed: 'FAIL', blocked: 'BLOCKED', skipped: 'SKIPPED', invalid: 'INVALID' };
    const linhas = r.casos.map((c) => {
      const local = c.casoLocalId ? locais.get(c.casoLocalId) : null; const qase = !c.casoLocalId && c.casoId < 1e9 ? catalogo.get(c.casoId) : null;
      const suite = c.suite || (local?.suiteLocalId ? suitesLocais.get(local.suiteLocalId) : null) || (qase?.suite_id != null ? suitesQase.get(Number(qase.suite_id)) : null) || (c.casoLocalId ? tr('Cenários sem suíte') : c.casoId >= 1e9 ? tr('Testes do código') : tr('Casos sem suíte'));
      const inicio = inicios.find((i) => i.casoId === c.casoId);
      const status = c.resultado && c.resultado.status !== 'NOT_RUN' ? PARA[c.resultado.status] : inicio ? 'in_progress' : 'untested';
      const rotulo = local?.numero ? 'P-' + local.numero : c.casoLocalId ? 'P' : c.casoId >= 1e9 ? tr('código') : vq ? vq.recurso.chave + '-' + c.casoId : String(c.casoId);
      return { c, id: c.casoId, titulo: c.titulo, suite, status, inicio, rotulo, local, protegido: c.resultado?.origem === 'EXECUCAO' && c.resultado.status !== 'NOT_RUN' };
    });
    const cont = contagemDaRunQase({ cases_count: linhas.length }, linhas);
    const filtro = { q: '', status: new Set() }; const selecionados = new Set(); let aberta = null, consultaDoCaso = 0, focoAnterior = null;
    const raiz = h('div', { class: 'qs-run qs-run-local', id: 'run-local', 'data-run': r.id }); const principal = h('div', { class: 'qs-run-principal' }); const lateral = h('aside', { class: 'qs-run-lateral', 'aria-label': tr('Resumo da run') }); const gaveta = h('aside', { class: 'qs-gaveta', id: 'qs-gaveta', hidden: true, 'aria-label': tr('Caso da run') });
    raiz.append(principal, lateral, gaveta); corpo.replaceChildren(raiz);
    const medirArea = () => { if (!raiz.isConnected) { tamanho.disconnect(); return; } raiz.style.setProperty('--qs-altura', Math.max(0, window.innerHeight - raiz.getBoundingClientRect().top - 16) + 'px'); };
    const tamanho = new ResizeObserver(medirArea); tamanho.observe(raiz); tamanho.observe(corpo); tamanho.observe(document.documentElement); medirArea();
    raiz.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !gaveta.hidden) { ev.preventDefault(); fecharGaveta(); } });
    const recarregar = (casoInicial) => abrirRunLocal(e, id, esc, { ...destino, casoInicial });
    const passo = async (fn, msg) => { const x = await chamar(fn); if (x && !x.canceled) { if (msg) avisar(typeof msg === 'function' ? msg(x) : msg); await recarregar(); } return x; };
    const pendenteManual = (depoisDe) => linhas.find((l) => l.id !== depoisDe && ['untested', 'in_progress'].includes(l.status) && !l.c.capability);
    const primeiroPendente = () => linhas.find((l) => l.status === 'in_progress') || pendenteManual() || linhas.find((l) => l.status === 'untested');

    // ---------- Resultados ----------
    async function declarar(alvos, k, comentario) {
      const ids = alvos.filter((l) => !l.protegido).map((l) => l.id);
      if (!ids.length) { avisar(tr('Esses casos têm resultado de automação. Rode a automação de novo para mudar o resultado.'), true); return null; }
      const x = await chamar(() => (ids.length === 1 ? api.runResultado(r.id, ids[0], DE[k], comentario) : api.runResultados(r.id, ids, DE[k], comentario)));
      if (!x || x.canceled) return null;
      if (x.mantidos?.length) avisar(tr('{n} caso(s) com resultado de automação ficaram como estavam.', { n: x.mantidos.length }));
      return x;
    }
    const marcarStatus = async (alvos, k) => { if (k === 'passed' || k === 'skipped') { if (await declarar(alvos, k, '')) await recarregar(); } else await abrirGaveta(alvos, 'enviar', k); };
    async function tirar(alvos) {
      const sai = new Set(alvos.map((l) => l.id)); const ficam = linhas.filter((l) => !sai.has(l.id));
      if (!ficam.length) { avisar(tr('A run precisa de pelo menos um caso. Para descartar a run inteira, use Apagar run.'), true); return; }
      const x = await chamar(() => api.runEditar(r.id, r.titulo, r.ambiente, ficam.map((l) => casoParaRun({ casoId: l.id, casoLocalId: l.c.casoLocalId, titulo: l.titulo, suite: l.suite }))));
      if (!x || x.canceled) return; selecionados.clear(); avisar(tr('{n} caso(s) tirado(s) da run.', { n: alvos.length })); await recarregar();
    }

    // ---------- Cabeçalho, composição e ações ----------
    const ESTADOS = { PREPARADA: ['Preparada', null], CRIADA: ['Criada no Qase', 'info'], EXECUTADA: ['Executada', 'ok'], PARCIAL: ['Em andamento', 'info'], PUBLICADA: ['Publicada no Qase', 'ok'] };
    const [rotuloEstado, tomEstado] = ESTADOS[r.estado] || [r.estado, null];
    const cab = h('div', { class: 'qs-cab' }, h('button', { type: 'button', class: 'qs-voltar', 'aria-label': tr('Voltar às runs'), title: tr('Voltar às runs'), onclick: sair }, '←'), h('h2', { class: 'qs-titulo', title: r.titulo }, r.titulo),
      DS.chip(tr(rotuloEstado), tomEstado), DS.origem('prumo', 'Prumo'), r.runIdRemoto ? DS.chip('Qase #' + r.runIdRemoto) : null);
    const comAutomacao = linhas.filter((l) => l.c.capability).length; const nSuites = new Set(linhas.map((l) => l.suite)).size;
    const ambientes = { teste: 'Teste', homologacao: 'Homologação', local: 'Local' };
    const composicao = h('div', { class: 'qs-composicao', id: 'run-composicao' }, h('strong', {}, tr('{n} caso(s) de {s} suíte(s)', { n: linhas.length, s: nSuites })),
      h('span', {}, tr('{m} manual(is) · {a} com automação', { m: linhas.length - comAutomacao, a: comAutomacao })), h('span', {}, tr('Ambiente: {a}', { a: tr(ambientes[r.ambiente] || r.ambiente) })),
      DS.info(travada ? 'Uma run pode ter um caso, vários ou suítes inteiras. Esta já existe no Qase: para outros casos, prepare uma run nova.' : 'Uma run pode ter um caso, vários ou suítes inteiras. Em "Casos da run" você inclui ou tira casos enquanto ela ainda não existe no Qase.'));
    const exportar = () => baixarCsv(`run-${r.titulo.replace(/[^\w-]+/g, '-').slice(0, 40) || r.id}.csv`, [['ID', 'Título', 'Suíte', 'Status', 'Executado por', 'Quando', 'Comentário'], ...linhas.map((l) => [l.rotulo, l.titulo, l.suite, l.c.resultado?.status || (l.status === 'in_progress' ? 'IN_PROGRESS' : 'NOT_RUN'), l.c.resultado?.por || (l.c.resultado?.origem === 'EXECUCAO' ? 'Automação' : ''), l.c.resultado?.em || '', l.c.resultado?.comentario || ''])]);
    const conferir = async () => { const x = await chamar(() => api.servicoConsultar(e.id, 'qase', 'resultados', { limite: 100 }, String(r.runIdRemoto))); if (x) avisar(tr('O Qase retornou {n} resultado(s) para a run {id}.', { n: x.dados.length, id: r.runIdRemoto })); };
    const apagar = async () => { const x = await chamar(() => api.runApagar(r.id)); if (!x || x.canceled) return; avisar(tr('Run apagada localmente. A run do Qase não foi alterada.')); await sair(); };
    const acoes = h('div', { class: 'qs-acoes' },
      DS.acao('Iniciar testes manuais', () => { const l = primeiroPendente(); if (l) void abrirGaveta([l], 'enviar'); }, { id: 'run-iniciar-' + r.id, icone: 'play', primaria: true, desabilitado: soVer || !linhas.some((l) => ['untested', 'in_progress'].includes(l.status)) }),
      DS.acao('Casos da run', () => editarCasosDaRun(e, r, linhas, recarregar), { id: 'run-casos-' + r.id, icone: 'mais', desabilitado: soVer || travada, titulo: travada ? 'A run já existe no Qase: para outros casos, prepare uma run nova.' : null }),
      comAutomacao ? DS.acao('Executar automações…', () => passo(() => api.runExecutar(r.id), (x) => tr('Execução concluída: {r}', { r: x.executadas.map((z) => z.capability + '=' + z.status).join(', ') || '—' })), { id: 'run-exec-' + r.id, icone: 'play', desabilitado: soVer }) : null,
      DS.acao('Exportar', exportar, { id: 'run-exportar-' + r.id, icone: 'baixar' }),
      menuDe('Mais ações', [['Editar título e ambiente', () => editarRunLocal(e, r), { desabilitado: soVer }],
        travada ? ['Conferir no Qase', conferir] : ['Criar run no Qase…', () => passo(() => api.runCriar(r.id)), { desabilitado: soVer || !vq || !esc }],
        travada ? ['Publicar resultados no Qase…', () => passo(() => api.runPublicar(r.id, true), (x) => (x.publicados ? tr('{n} resultado(s) publicado(s) e conferidos no Qase.', { n: x.publicados }) : tr('Nada pendente para publicar.'))), { desabilitado: soVer || !esc }] : null,
        travada ? ['Publicação agendada…', () => politicaDaRun(e, r, passo), { desabilitado: soVer }] : null,
        linhas.some((l) => l.status === 'failed') ? ['Relacionar falhas a tickets…', () => relacionarFalhas(e, r), { desabilitado: soVer }] : null,
        ['Apagar run', apagar, { desabilitado: soVer }]], { id: 'run-mais-' + r.id }),
      vq && !esc ? DS.info('Escrita no Qase desligada: criar a run e publicar resultados no Qase ficam indisponíveis. Habilite em Projetos.') : null);
    const resumoCompacto = h('div', { class: 'qs-run-resumo', 'aria-label': tr('Resumo da run') }, h('strong', {}, tr('{p}% concluído', { p: cont.concluido })), h('span', { class: 'ds-sub' }, tr('{a} de {b}', { a: cont.feitos, b: cont.total })), barraEmpilhada(cont.n, cont.total));

    // ---------- Busca, filtro e casos por suíte ----------
    const busca = h('input', { type: 'search', class: 'qs-busca', id: 'run-busca', placeholder: tr('Buscar por título ou ID…'), 'aria-label': tr('Buscar casos da run'), oninput: (ev) => { filtro.q = ev.target.value; desenharLista(); } });
    const chips = h('div', { class: 'qs-chips' });
    const menuFiltro = menuDe('Adicionar filtro', STATUS_QASE.map(([k, rotulo]) => [rotulo, () => { filtro.status.has(k) ? filtro.status.delete(k) : filtro.status.add(k); desenharLista(); }, { status: k }]), { id: 'run-filtro' });
    menuFiltro.querySelector('summary').replaceChildren(tr('Adicionar filtro'));
    const loteResultado = DS.acao('Marcar resultado', () => abrirGaveta(linhas.filter((l) => selecionados.has(l.id)), 'enviar'), { id: 'run-lote-resultado', compacto: true, icone: 'ok' });
    const loteTirar = DS.acao('Tirar da run', () => tirar(linhas.filter((l) => selecionados.has(l.id))), { id: 'run-lote-tirar', compacto: true, desabilitado: travada });
    const lista = h('div', { class: 'qs-lista', id: 'run-local-casos' });
    const passaNoFiltro = (l) => { if (filtro.status.size && !filtro.status.has(l.status)) return false; const q = paraBusca(filtro.q.trim()); return !q || paraBusca(l.titulo + ' ' + l.rotulo + ' ' + l.suite + ' ' + (l.c.resultado?.comentario || '')).includes(q); };
    const quemExecutou = (l) => (l.c.resultado && l.c.resultado.status !== 'NOT_RUN' ? (l.c.resultado.origem === 'EXECUCAO' ? tr('Automação') : l.c.resultado.por || tr('Manual')) : l.c.capability ? tr('Automação: {c}', { c: l.c.capability }) : tr('Manual'));
    function linhaDoCaso(l) {
      const marcado = h('input', { type: 'checkbox', 'aria-label': tr('Selecionar {t}', { t: l.titulo }), checked: selecionados.has(l.id), onchange: (ev) => { ev.target.checked ? selecionados.add(l.id) : selecionados.delete(l.id); atualizarLote(); } });
      const kebab = menuDe('Ações do caso', [...RESULTADOS_QASE.map(([k, rotulo]) => [rotulo, () => marcarStatus([l], k), { status: k, desabilitado: soVer || l.protegido }]), ['Abrir caso', () => abrirGaveta([l], 'execucao')], ['Evidências', () => abrirGaveta([l], 'evidencias')], ['Tirar da run', () => tirar([l]), { desabilitado: soVer || travada }]]);
      const ativar = (ev) => { if (ev.target.closest('input, button, .qs-menu')) return; void abrirGaveta([l], l.status === 'untested' || l.status === 'in_progress' ? 'enviar' : 'execucao'); };
      return h('div', { class: 'qs-caso', role: 'row', tabindex: 0, 'data-caso': String(l.id), 'data-status': l.status, 'aria-current': String(aberta === l.id), onclick: ativar, onkeydown: (ev) => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target === ev.currentTarget) { ev.preventDefault(); ativar(ev); } } },
        marcado, h('span', { class: 'qs-id' }, l.rotulo), chipDoStatus(l.status), h('span', { class: 'qs-caso-titulo', title: l.titulo }, l.titulo, ...marcaDoAndamento(l.inicio, l.c.resultado?.em)), h('span', { class: 'qs-quem', title: quemExecutou(l) }, quemExecutou(l)), kebab);
    }
    function grupoDeSuite(nome, ls) {
      const contagem = {}; for (const [k] of STATUS_QASE) contagem[k] = ls.filter((l) => l.status === k).length;
      const todos = h('input', { type: 'checkbox', 'aria-label': tr('Selecionar a suíte {s} inteira', { s: nome }), checked: ls.every((l) => selecionados.has(l.id)), onclick: (ev) => ev.stopPropagation(), onchange: (ev) => { for (const l of ls) ev.target.checked ? selecionados.add(l.id) : selecionados.delete(l.id); desenharLista(); } });
      return h('details', { class: 'qs-suite', open: true, 'data-suite': nome }, h('summary', {}, h('span', { class: 'qs-seta', 'aria-hidden': 'true' }, '▾'), todos, h('strong', {}, nome), h('span', { class: 'ds-sub' }, tr('{n} caso(s)', { n: ls.length })), h('span', { class: 'qs-espaco' }), barraEmpilhada(contagem, ls.length)), ...ls.map(linhaDoCaso));
    }
    function atualizarLote() {
      const n = selecionados.size; loteResultado.hidden = loteTirar.hidden = !n; loteResultado.disabled = soVer || !n; loteTirar.disabled = soVer || travada || !n;
      const rotulo = lista.querySelector('.qs-selecionar-n'); if (rotulo) { rotulo.hidden = !n; rotulo.textContent = n ? tr('{n} selecionado(s)', { n }) : ''; }
      const vis = linhas.filter(passaNoFiltro); const todos = lista.querySelector('.qs-selecionar input'); if (todos) { todos.checked = !!vis.length && vis.every((l) => selecionados.has(l.id)); todos.indeterminate = vis.some((l) => selecionados.has(l.id)) && !todos.checked; }
      for (const g of lista.querySelectorAll('.qs-suite')) { const ls = vis.filter((l) => l.suite === g.dataset.suite); const b = g.querySelector('summary input'); if (b) { b.checked = !!ls.length && ls.every((l) => selecionados.has(l.id)); b.indeterminate = ls.some((l) => selecionados.has(l.id)) && !b.checked; } }
    }
    function desenharLista() {
      const vis = linhas.filter(passaNoFiltro); const grupos = new Map(); for (const l of vis) { if (!grupos.has(l.suite)) grupos.set(l.suite, []); grupos.get(l.suite).push(l); }
      chips.replaceChildren(...[...filtro.status].map((k) => h('button', { type: 'button', class: 'qs-chip', onclick: () => { filtro.status.delete(k); desenharLista(); }, 'aria-label': tr('Remover filtro {s}', { s: rotuloDoStatus(k) }) }, tr('Status: {s}', { s: rotuloDoStatus(k) }), ' ×')));
      const todos = h('input', { type: 'checkbox', 'aria-label': tr('Selecionar todos'), onchange: (ev) => { for (const l of vis) ev.target.checked ? selecionados.add(l.id) : selecionados.delete(l.id); desenharLista(); } });
      lista.replaceChildren(h('div', { class: 'qs-selecionar' }, vis.length ? h('label', {}, todos, tr('Selecionar todos')) : null, h('span', { class: 'ds-sub qs-selecionar-n', hidden: true, 'aria-live': 'polite' }), loteResultado, loteTirar),
        vis.length ? h('div', { class: 'qs-colunas', role: 'row' }, h('span'), h('span', {}, 'ID'), h('span', {}, tr('Status')), h('span', {}, tr('Título')), h('span', {}, tr('Executado por')), h('span')) : null,
        ...[...grupos].map(([nome, ls]) => grupoDeSuite(nome, ls)),
        vis.length ? null : h('p', { class: 'suave' }, tr('Nenhum caso combina com a busca ou o filtro.')), vis.length ? null : DS.acao('Limpar filtros', () => { filtro.q = ''; filtro.status.clear(); busca.value = ''; desenharLista(); busca.focus(); }, { compacto: true, id: 'run-limpar-filtros' }));
      atualizarLote();
    }

    // ---------- Resumo à direita ----------
    const comResultado = linhas.filter((l) => l.c.resultado && l.c.resultado.status !== 'NOT_RUN').length; const publicados = linhas.filter((l) => l.c.publicado).length;
    const detalhes = [[tr('Origem'), DS.origem('prumo', 'Prumo')], [tr('Run no Qase'), r.runIdRemoto ? '#' + r.runIdRemoto + (r.confirmadaNoQase ? ' · ' + tr('confirmada') : '') : tr('ainda não criada')], [tr('Ambiente'), tr(ambientes[r.ambiente] || r.ambiente)],
      [tr('Criada em'), hora(r.criadaEm)], [tr('Atualizada em'), hora(r.atualizadaEm)], [tr('Publicados no Qase'), r.runIdRemoto ? tr('{a} de {b}', { a: publicados, b: comResultado }) : null], [tr('Com automação'), comAutomacao ? tr('{n} caso(s)', { n: comAutomacao }) : null]].filter(([, v]) => v);
    lateral.replaceChildren(roscaDaRun(cont), h('dl', { class: 'qs-detalhes' }, detalhes.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v)))));

    // ---------- Painel do caso: execução, resultado e evidências ----------
    function fecharGaveta() { consultaDoCaso++; aberta = null; gaveta.hidden = true; raiz.removeAttribute('data-gaveta'); desenharLista(); const alvo = focoAnterior?.isConnected ? focoAnterior : busca; alvo.focus({ preventScroll: true }); }
    async function abrirGaveta(alvos, aba0, statusInicial) {
      if (!alvos.length || !alvos[0]) return; const l = alvos[0]; const lote = alvos.length > 1; const consulta = ++consultaDoCaso;
      if (gaveta.hidden) focoAnterior = document.activeElement;
      aberta = lote ? null : l.id; raiz.setAttribute('data-gaveta', ''); gaveta.hidden = false; gaveta.tabIndex = -1; desenharLista();
      let atual = lote ? 'enviar' : aba0; const corpoDaGaveta = h('div', { class: 'qs-gaveta-corpo' }); const topo = h('div', { class: 'qs-gaveta-topo' });
      const abasDaGaveta = lote ? [['enviar', 'Marcar resultado']] : [['execucao', 'Execução'], ['enviar', 'Enviar resultado'], ['evidencias', 'Evidências']];
      const desenharTopo = () => topo.replaceChildren(h('div', { class: 'qs-gaveta-acoes' }, h('strong', { class: 'qs-gaveta-nome' }, lote ? tr('{n} casos selecionados', { n: alvos.length }) : l.rotulo + ' · ' + l.titulo), h('button', { type: 'button', class: 'ds-wb-mini', 'aria-label': tr('Fechar painel do caso'), onclick: fecharGaveta }, '×')),
        h('div', { class: 'qs-abas', role: 'tablist' }, abasDaGaveta.map(([k, t]) => h('button', { type: 'button', role: 'tab', tabindex: atual === k ? 0 : -1, 'data-aba-gaveta': k, 'aria-selected': String(atual === k), onclick: () => { atual = k; desenharTopo(); void desenharCorpo(); topo.querySelector(`[data-aba-gaveta="${k}"]`).focus({ preventScroll: true }); } }, tr(t)))));
      async function desenharCorpo() {
        corpoDaGaveta.replaceChildren(DS.carregando());
        if (atual === 'evidencias') { corpoDaGaveta.replaceChildren(painelDeEvidencias(r, l.c)); return; }
        if (atual === 'execucao') { corpoDaGaveta.replaceChildren(...await execucaoDoCaso(e, r, l)); return; }
        if (lote) { corpoDaGaveta.replaceChildren(...resultadoEmLote(alvos, statusInicial)); return; }
        await executarCasoLocal(e, r, l.c, { alvo: corpoDaGaveta, statusInicial: statusInicial ? DE[statusInicial] : null, aoSalvar: (seguinte) => recarregar(seguinte?.casoId) });
      }
      desenharTopo(); gaveta.replaceChildren(topo, corpoDaGaveta); await desenharCorpo(); if (consulta === consultaDoCaso) gaveta.focus({ preventScroll: true });
    }
    function resultadoEmLote(alvos, statusInicial) {
      let status = statusInicial || null; const erro = h('p', { class: 'ds-sub', role: 'alert' });
      const comentario = h('textarea', { id: 'run-lote-comentario', rows: 3, maxlength: 2000, placeholder: tr('O que foi observado'), 'aria-label': tr('Comentário do resultado') });
      const salvar = DS.acao('Salvar resultado', async () => {
        if (!status) return; if (!['passed', 'skipped'].includes(status) && comentario.value.trim().length < 3) { erro.textContent = tr('Descreva o que aconteceu (mínimo de 3 caracteres).'); comentario.focus(); return; }
        if (await declarar(alvos, status, comentario.value.trim())) { selecionados.clear(); await recarregar(); }
      }, { id: 'run-lote-salvar', primaria: true, desabilitado: soVer || !status });
      const botoes = RESULTADOS_QASE.map(([k, rotulo]) => h('button', { type: 'button', class: 'qs-resultado', 'data-status': k, disabled: soVer, 'aria-pressed': String(status === k), onclick: () => { status = k; botoes.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.status === k))); salvar.disabled = soVer; erro.textContent = ''; } }, h('i', { 'data-cor': k }), tr(rotulo)));
      const protegidos = alvos.filter((x) => x.protegido).length;
      return [h('p', { class: 'ds-sub' }, tr('O mesmo resultado vale para os {n} casos escolhidos.', { n: alvos.length })), protegidos ? DS.info(tr('{n} caso(s) com resultado de automação não mudam.', { n: protegidos })) : null,
        h('div', { class: 'qs-resultados', role: 'group', 'aria-label': tr('Resultado') }, botoes), comentario, erro, h('div', { class: 'ds-cab-acoes' }, salvar, DS.acao('Cancelar', fecharGaveta, { compacto: true }))];
    }

    principal.replaceChildren(cab, composicao, acoes, resumoCompacto, h('div', { class: 'qs-conteudo' }, h('div', { class: 'qs-barra-filtros' }, busca, menuFiltro), chips, lista)); desenharLista();
    if (destino.casoInicial != null) { const l = linhas.find((x) => x.id === destino.casoInicial); if (l) await abrirGaveta([l], 'enviar'); }
  }
  // Falhas da run viram tickets locais classificados; a pessoa vincula a um ticket existente ou publica no Jira na tela Tickets.
  function relacionarFalhas(e, r) {
    const n = r.casos.filter((x) => x.resultado?.status === 'FAIL').length; const cls = h('select', { id: 'run-bugs-classificacao' }, [['PRODUTO', 'Bug de produto'], ['OUTRO_BUG', 'Outro bug'], ['MELHORIA', 'Melhoria']].map(([v, t]) => h('option', { value: v }, tr(t))));
    DS.modal('Relacionar falhas a tickets', [DS.info(tr('{n} falha(s) nesta run viram tickets locais em Tickets, só neste computador. Depois você vincula a um ticket existente ou publica no Jira.', { n })),
      h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('O que são essas falhas?', cls, { inteiro: true, ajuda: 'Dá para ajustar caso a caso depois, na tela Tickets.' })),
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar tickets locais', async () => { const x = await chamar(() => api.runBugs(r.id, cls.value)); if (!x) return; avisar(x.length ? tr('{n} ticket(s) local(is) criado(s) em Tickets.', { n: x.length }) : tr('Essas falhas já têm ticket local.')); DS.fecharModal(); mostrar('tickets'); }, { id: 'run-bugs-criar', primaria: true }))], { tamanho: 'md' });
  }

  // ======================= Rastreabilidade =======================
