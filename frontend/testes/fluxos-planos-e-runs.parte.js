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
        return { origem: 'local', attrs: { 'data-run': r.id }, abrir: () => r.runIdRemoto ? abrirRunQase(e, { id: r.runIdRemoto, title: r.titulo }, destinoDaLista) : abrirRunLocal(e, r.id, esc), rotulo: tr('Abrir run {t}', { t: r.titulo }), titulo: r.titulo,
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
  async function prepararRun(e, inicial = {}) {
    const mem = memoriaDaTela('testes', e.id);
    // Sem Qase a run usa os testes do código, com id local estável (hash do arquivo e do título) acima de CASO_LOCAL_MIN.
    const idLocal = (s) => { let x = 2166136261; for (const ch of s) { x ^= ch.charCodeAt(0); x = Math.imul(x, 16777619) >>> 0; } return 1e9 + (x % 1e9); };
    const carregarCasosDoRepositorio = async () => {
      if (!vinc(e, 'qase')) {
        const r = await api.testesCatalogo(e.id); const cat = r.ok ? r.data : null; const itens = [];
        for (const f of cat?.catalogo?.features || []) for (const t of f.testes) itens.push({ id: idLocal(f.arquivo + '#' + t.titulo), title: t.titulo, local: true });
        return { itens, erro: r.ok ? null : r.error };
      }
      let pagina = mem.casos || await carregarQase(e, mem, 'casos'); const itens = [...(pagina.itens || [])]; let paginas = 0;
      while (!pagina.erro && pagina.proxima != null && paginas++ < 20) {
        pagina = await carregarQase(e, mem, 'casos', typeof pagina.proxima === 'string' ? { cursor: pagina.proxima, limite: 100 } : { offset: pagina.proxima, limite: 100 });
        itens.push(...(pagina.itens || []));
      }
      return { ...pagina, itens };
    };
    const casos = await carregarCasosDoRepositorio();
    const locais = await api.repositorioLocal(e.id);
    if (locais.ok) casos.itens.push(...locais.data.casos.map(c => ({ id: idLocal(c.id), casoLocalId: c.id, title: c.titulo, local: true })));
    else casos.erro = locais.error;
    const titulo = h('input', { id: 'run-titulo', maxlength: 255, value: inicial.titulo ? tr('Run · {t}', { t: inicial.titulo }) : '' }); const amb = selecaoSimples('run-ambiente', [['teste', 'Teste'], ['homologacao', 'Homologação'], ['local', 'Local']]); const marcados = new Set(inicial.casos || []);
    // Com Qase vinculado, milestone (ativos) e ambiente do próprio Qase são opcionais e seguem na criação da run.
    const marcoQase = h('select', { id: 'run-marco-qase' }, h('option', { value: '' }, tr('Sem milestone'))); const ambQase = h('select', { id: 'run-ambiente-qase' }, h('option', { value: '' }, tr('Sem ambiente do Qase')));
    if (vinc(e, 'qase')) {
      void api.servicoConsultar(e.id, 'qase', 'marcos', { offset: 0, limite: 100 }).then((r) => { if (r.ok) for (const m of (r.data.dados || []).filter((m) => m.estado !== 'completed')) marcoQase.append(h('option', { value: String(m.id) }, m.titulo)); });
      void api.servicoConsultar(e.id, 'qase', 'ambientes', { offset: 0, limite: 100 }).then((r) => { if (r.ok) for (const a of r.data.dados || []) ambQase.append(h('option', { value: String(a.id) }, a.titulo)); });
    }
    const buscaCasos = h('input', { id: 'run-casos-busca', type: 'search', placeholder: tr('Buscar casos do repositório'), 'aria-label': tr('Buscar casos do repositório'), maxlength: 100 });
    const listaCasos = h('div', { id: 'run-casos', class: 'ds-opcoes coluna' }); const contadorCasos = h('span', { class: 'ds-sub', id: 'run-casos-contagem' });
    const desenharCasos = () => {
      const termo = String(buscaCasos.value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const visiveis = casos.itens.filter((c) => !termo || String(c.title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo) || String(c.id).includes(termo));
      contadorCasos.textContent = tr('{n} de {total} casos', { n: visiveis.length, total: casos.itens.length });
      listaCasos.replaceChildren(...visiveis.map((c) => h('label', {}, h('input', { type: 'checkbox', 'data-caso': c.id, checked: marcados.has(c.id), onchange: (ev) => (ev.target.checked ? marcados.add(c.id) : marcados.delete(c.id)) }), c.local ? c.title : `${c.id} · ${c.title}`, ' ', c.local ? null : chipTipoCaso(c))));
    };
    buscaCasos.addEventListener('input', desenharCasos);
    desenharCasos();
    DS.modal('Preparar run', [h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título da run', titulo), DS.campo('Ambiente', amb), vinc(e, 'qase') ? DS.campo('Milestone no Qase', marcoQase) : null, vinc(e, 'qase') ? DS.campo('Ambiente no Qase', ambQase) : null,
      h('div', { class: 'ds-campo inteiro' }, h('span', {}, tr('Casos do repositório ({n})', { n: casos.itens.length })), casos.itens.length ? h('div', { class: 'ds-form-acoes' }, buscaCasos, contadorCasos, listaCasos) : h('p', { class: 'suave' }, casos.erro ? casos.erro : tr('Nenhum caso retornado pelo repositório.')))),
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('A run é preparada neste computador; criá-la no Qase é um passo separado.')), DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Preparar run', async () => { const sel = casos.itens.filter((c) => marcados.has(c.id)).map((c) => ({ casoId: c.id, titulo: String(c.title).slice(0, 255), ...(c.casoLocalId ? { casoLocalId: c.casoLocalId } : {}) })); const r = await chamar(() => api.runPreparar({ espacoId: e.id, titulo: titulo.value, ambiente: amb.value, casos: sel, ...(inicial.planoId ? { planoId: inicial.planoId } : {}), ...(marcoQase.value ? { marcoId: Number(marcoQase.value) } : {}), ...(ambQase.value ? { ambienteQaseId: Number(ambQase.value) } : {}) })); if (r) { avisar(tr('Run preparada localmente. Ainda não existe no Qase.')); DS.fecharModal(); await abrirRunLocal(e, r.id, !!(await escritaDoProjeto(e)).qase); } }, { id: 'run-preparar', primaria: true }))], { tamanho: 'md' });
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
  async function abrirRunLocal(e, id, esc) {
    const rs = await chamar(() => api.runs(e.id)); const r = (rs || []).find((x) => x.id === id); if (!r) return;
    const and = await api.runAndamento(e.id, id);
    const inicios = and.ok ? and.data : [];
    if (!and.ok) avisar(and.error, true);
    const recarregar = () => abrirRunLocal(e, id, esc); const c = contar(r); const saida = h('div', { id: 'run-saida' });
    const dias = h('input', { type: 'number', min: 1, max: 30, value: 7, id: 'pol-run-dias-' + r.id }); const usos = h('input', { type: 'number', min: 1, max: 1000, value: 5, id: 'pol-run-usos-' + r.id });
    const passo = async (fn, msg) => { const x = await chamar(fn); if (x && !x.canceled) { if (msg) avisar(typeof msg === 'function' ? msg(x) : msg); void recarregar(); } return x; };
    const evidencias = h('div', { id: 'run-evidencias-area' });
    const mostrarEvidencias = (x) => { evidencias.replaceChildren(painelDeEvidencias(r, x)); evidencias.scrollIntoView?.({ block: 'nearest' }); };
    const [nav, painel] = DS.abasModal([
      ['casos', tr('Casos'), r.casos.length, () => [DS.resumo([[c.pass, 'PASS', 'ok'], [c.fail, 'FAIL', 'falha'], [c.blocked, 'BLOCKED', 'aviso'], [c.notRun, 'sem resultado'], [c.skipped, 'Pulados'], [c.invalid, 'Inválidos']]),
        listaDosCasosDaRun(e, r, inicios, recarregar, mostrarEvidencias), evidencias]],
      ['publicacao', tr('Publicação'), null, () => [DS.info('Política para publicar resultados desta run por rotina agendada. Sem política, os resultados ficam locais.'), h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Validade (dias)', dias), DS.campo('Máximo de publicações', usos), h('div', { class: 'ds-form-acoes' }, DS.acao('Aprovar política de publicação agendada…', () => passo(() => api.runPolitica(e.id, r.runIdRemoto, Number(dias.value), Number(usos.value)), tr('Política registrada para a run {id}.', { id: r.runIdRemoto })), { id: 'run-politica-' + r.id, desabilitado: !r.runIdRemoto })))]]
    ]);
    DS.modal(r.titulo, [DS.meta([['Origem', DS.origem('prumo', 'Prumo')], ['Run no Qase', r.runIdRemoto ? '#' + r.runIdRemoto + (r.confirmadaNoQase ? ' · ' + tr('confirmada') : '') : tr('ainda não criada')], ['Ambiente', r.ambiente], ['Casos', String(c.total)]], { linha: true }), saida, nav, painel,
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('Cada envio ao Qase pede confirmação nativa.')),
        DS.acao('Iniciar testes manuais', () => { const x = r.casos.find(c => (!c.resultado || c.resultado.status === 'NOT_RUN') && !c.capability) || r.casos.find(c => !c.resultado || c.resultado.status === 'NOT_RUN') || r.casos[0]; if (x) void executarCasoLocal(e, r, x, recarregar); }, { id: 'run-iniciar-' + r.id, icone: 'play' }),
        DS.acao('Editar run', () => editarRunLocal(e, r), { id: 'run-editar-' + r.id }),
        DS.acao('Apagar run', async () => {
          const resultado = await chamar(() => api.runApagar(r.id));
          if (!resultado || resultado.canceled) return;
          avisar(tr('Run apagada localmente. A run do Qase não foi alterada.'));
          DS.fecharModal();
          void mostrar('testes');
        }, { id: 'run-apagar-' + r.id }),
        r.casos.some((x) => x.resultado?.status === 'FAIL') ? DS.acao('Relacionar falhas a tickets…', () => relacionarFalhas(e, r), { id: 'run-bugs-' + r.id, icone: 'alerta' }) : null,
        !r.runIdRemoto ? DS.acao('Criar run no Qase…', () => passo(() => api.runCriar(r.id)), { id: 'run-criar-' + r.id, desabilitado: !esc }) : DS.acao('Conferir no Qase', async () => { const x = await chamar(() => api.servicoConsultar(e.id, 'qase', 'resultados', { limite: 100 }, String(r.runIdRemoto))); if (x) avisar(tr('O Qase retornou {n} resultado(s) para a run {id}.', { n: x.dados.length, id: r.runIdRemoto })); }, { id: 'run-conferir-' + r.id }),
        DS.acao('Executar automações…', () => passo(() => api.runExecutar(r.id), (x) => tr('Execução concluída: {r}', { r: x.executadas.map((z) => z.capability + '=' + z.status).join(', ') || '—' })), { id: 'run-exec-' + r.id, icone: 'play', desabilitado: !r.casos.some((x) => x.capability), titulo: r.casos.some((x) => x.capability) ? null : 'Nenhum caso desta run tem automação declarada.' }),
        DS.acao('Publicar resultados…', () => passo(() => api.runPublicar(r.id, true), (x) => (x.publicados ? tr('{n} resultado(s) publicado(s) e conferidos no Qase.', { n: x.publicados }) : tr('Nada pendente para publicar.'))), { id: 'run-pub-' + r.id, primaria: true, desabilitado: !r.runIdRemoto || !esc }))], { tamanho: 'lg', subtitulo: [DS.origem('prumo', 'Run preparada no Prumo'), selo(r.estado)] });
  }
  // Falhas da run viram tickets locais classificados; a pessoa vincula a um ticket existente ou publica no Jira na tela Tickets.
  function relacionarFalhas(e, r) {
    const n = r.casos.filter((x) => x.resultado?.status === 'FAIL').length; const cls = h('select', { id: 'run-bugs-classificacao' }, [['PRODUTO', 'Bug de produto'], ['OUTRO_BUG', 'Outro bug'], ['MELHORIA', 'Melhoria']].map(([v, t]) => h('option', { value: v }, tr(t))));
    DS.modal('Relacionar falhas a tickets', [DS.info(tr('{n} falha(s) nesta run viram tickets locais em Tickets, só neste computador. Depois você vincula a um ticket existente ou publica no Jira.', { n })),
      h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('O que são essas falhas?', cls, { inteiro: true, ajuda: 'Dá para ajustar caso a caso depois, na tela Tickets.' })),
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar tickets locais', async () => { const x = await chamar(() => api.runBugs(r.id, cls.value)); if (!x) return; avisar(x.length ? tr('{n} ticket(s) local(is) criado(s) em Tickets.', { n: x.length }) : tr('Essas falhas já têm ticket local.')); DS.fecharModal(); mostrar('tickets'); }, { id: 'run-bugs-criar', primaria: true }))], { tamanho: 'md' });
  }

  // ======================= Rastreabilidade =======================
