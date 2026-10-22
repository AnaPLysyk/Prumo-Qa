/** Página da run do Qase no desenho do Qase: ações no topo, abas, casos por suíte, resumo à direita e painel lateral do caso. */
  // Status de resultado do Qase, na ordem em que o Qase os mostra: [chave, rótulo, tom do chip, variável de cor, letra].
  const STATUS_QASE = [['passed', 'Passed', 'ok', '--ok', 'P'], ['failed', 'Failed', 'falha', '--falha', 'F'], ['blocked', 'Blocked', 'aviso', '--aviso', 'B'], ['skipped', 'Skipped', null, '--suave', 'S'], ['invalid', 'Invalid', 'falha', '--acento', 'I'], ['untested', 'Untested', null, '--linha', '–'], ['in_progress', 'Em andamento', 'info', '--acento', '▶']];
  const RESULTADOS_QASE = STATUS_QASE.filter(([k]) => !['untested', 'in_progress'].includes(k));
  const corDoStatus = (s) => (STATUS_QASE.find(([k]) => k === s) || STATUS_QASE[5])[3];
  const rotuloDoStatus = (s) => tr((STATUS_QASE.find(([k]) => k === s) || [s, s])[1]);
  const tomDoResultado = (s) => (STATUS_QASE.find(([k]) => k === s) || [])[2] || null;
  const chipDoStatus = (s) => { const c = DS.chip(rotuloDoStatus(s), tomDoResultado(s)); c.classList.add('qs-status'); c.dataset.status = s; return c; };
  const nomeDeCaso = (catalogo, id) => catalogo.get(String(id))?.title || tr('Caso {id}', { id });
  function contagemDaRunQase(x, casos) {
    const n = {}; for (const [k] of STATUS_QASE) n[k] = x.stats?.[k] ?? casos.filter((z) => z.status === k).length;
    if (x.stats?.untested != null) n.untested = Math.max(0, n.untested - n.in_progress);
    const feitos = STATUS_QASE.reduce((s, [k]) => s + (['untested', 'in_progress'].includes(k) ? 0 : n[k]), 0); const total = Math.max(x.stats?.total ?? x.cases_count ?? 0, feitos + n.untested + (n.in_progress || 0), casos.length);
    if (x.stats?.untested == null) n.untested = Math.max(0, total - feitos - (n.in_progress || 0));
    return { n, total, feitos, concluido: total ? Math.round((feitos / total) * 100) : 0 };
  }
  /** Rosca de resultados da run: no centro, a taxa de conclusão (casos com resultado). */
  function roscaDaRun({ n, total, feitos, concluido }) {
    let acc = 0; const paradas = STATUS_QASE.filter(([k]) => n[k] > 0).map(([k, , , cor]) => { const de = acc; acc += (n[k] / Math.max(total, 1)) * 100; return `var(${cor}) ${de}% ${acc}%`; });
    const el = h('div', { class: 'qs-rosca', role: 'img', 'aria-label': tr('{p}% concluído', { p: concluido }) }, h('div', { class: 'qs-rosca-centro' }, h('span', { class: 'ds-sub' }, tr('Taxa de conclusão')), h('strong', {}, concluido + '%'), h('span', { class: 'ds-sub' }, tr('{a} de {b}', { a: feitos, b: total }))));
    el.style.background = paradas.length ? `conic-gradient(${paradas.join(', ')})` : 'var(--linha)'; return el;
  }
  /** Barra empilhada de resultados (uma fatia por status) usada nas suítes. */
  function barraEmpilhada(contagem, total) {
    const b = h('div', { class: 'qs-barra', role: 'img', 'aria-label': STATUS_QASE.filter(([k]) => contagem[k]).map(([k]) => `${contagem[k]} ${rotuloDoStatus(k)}`).join(' · ') });
    for (const [k, , , cor] of STATUS_QASE) if (contagem[k]) { const f = h('span'); f.style.width = (contagem[k] / Math.max(total, 1)) * 100 + '%'; f.style.background = `var(${cor})`; b.append(f); } return b;
  }
  /** Menu de três pontos: <details> que fecha ao escolher um item ou ao clicar fora. Itens: [rótulo, ação, { status, desabilitado }]. */
  function menuDe(rotulo, itens, { id } = {}) {
    const d = h('details', { class: 'qs-menu', id: id || null }, h('summary', { 'aria-label': tr(rotulo), title: tr(rotulo) }, '⋯'),
      h('div', { class: 'qs-menu-lista', role: 'menu' }, itens.filter(Boolean).map(([t, fn, o = {}]) => h('button', { type: 'button', role: 'menuitem', disabled: !!o.desabilitado, 'data-status': o.status || null, onclick: (ev) => { ev.stopPropagation(); d.open = false; void fn(); } }, o.status ? h('i', { 'data-cor': o.status }) : null, tr(t)))));
    const fora = (ev) => { if (!d.contains(ev.target)) d.open = false; };
    d.addEventListener('toggle', () => { document.removeEventListener('click', fora, true); if (d.open) document.addEventListener('click', fora, true); });
    d.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && d.open) { ev.preventDefault(); ev.stopPropagation(); d.open = false; d.querySelector('summary').focus(); } });
    d.addEventListener('click', (ev) => ev.stopPropagation()); return d;
  }
  const baixarCsv = (nome, linhas) => {
    const texto = linhas.map((l) => l.map((c) => { const t = String(c ?? ''); return /[",\n;]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' })); const a = h('a', { href: url, download: nome }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  const quandoFoi = (iso) => (iso ? hora(iso) : null);

  async function resultadosCompletosDaRun(e, id) {
    const dados = []; let pagina = { limite: 100 }; const vistas = new Set();
    for (let n = 0; n < 100; n++) {
      const r = await api.servicoConsultar(e.id, 'qase', 'resultados', pagina, String(id));
      if (!r.ok) return r;
      dados.push(...r.data.dados);
      const proxima = r.data.proxima;
      if (proxima == null) return { ...r, data: { ...r.data, dados } };
      if (vistas.has(String(proxima))) break;
      vistas.add(String(proxima));
      pagina = typeof proxima === 'string' ? { cursor: proxima, limite: 100 } : { offset: proxima, limite: 100 };
    }
    return { ok: false, error: tr('A consulta de resultados ficou incompleta. Tente novamente.') };
  }

  /** Página da run. `destino`: { corpo, voltar }, a área onde ela aparece e como voltar à lista de onde veio. */
  async function abrirRunQase(e, x, destino) {
    const { corpo, voltar } = destino; corpo.replaceChildren(DS.carregando('Consultando o Qase…'));
    const mem = memoriaDaTela('testes', e.id); const vq = vinc(e, 'qase');
    const [r, detalhe, casos, suites, perm] = await Promise.all([resultadosCompletosDaRun(e, x.id), api.servicoConsultar(e.id, 'qase', 'run', {}, String(x.id)),
      mem.casos || carregarQase(e, mem, 'casos'), mem.suitesQase || carregarQase(e, mem, 'suites'), escritaDoProjeto(e)]); if (!corpo.isConnected) return;
    if (!r.ok || !detalhe.ok) {
      corpo.replaceChildren(DS.estadoTela('erro', 'Não foi possível abrir a run', !detalhe.ok ? detalhe.error : r.error, [DS.acao('Tentar novamente', () => abrirRunQase(e, x, destino), { icone: 'atualizar' }), DS.acao('Voltar', () => voltar())]));
      return;
    }
    if (casos && !casos.erro) mem.casos = casos; if (suites && !suites.erro) mem.suitesQase = suites;
    const andamento = await api.runAndamento(e.id, 'qase-' + x.id);
    const inicios = andamento.ok ? andamento.data : [];
    if (!andamento.ok) avisar(tr('Não foi possível consultar quem iniciou os testes.') + ' ' + andamento.error, true);
    const esc = !!perm.qase; const run = { ...x, ...(detalhe.ok && detalhe.data.dados ? detalhe.data.dados : {}) }; const res = r.ok ? r.data.dados : [];
    const catalogo = new Map((casos?.itens || []).map((c) => [String(c.id), c])); const nomesDeSuite = new Map((suites?.itens || []).map((s) => [Number(s.id), s.title]));
    // Um caso pode ter mais de um resultado na run; vale o mais recente.
    const ultimo = new Map(); for (const z of res) { const a = ultimo.get(Number(z.case_id)); if (!a || !(Date.parse(a.end_time) > Date.parse(z.end_time))) ultimo.set(Number(z.case_id), z); }
    const ids = [...new Set([...(run.cases || []).map((k) => Number(k?.case_id ?? k?.id ?? k)), ...ultimo.keys()])].filter(Number.isFinite);
    const linhas = ids.map((id) => ({ id, titulo: nomeDeCaso(catalogo, id), suiteId: catalogo.get(String(id))?.suite_id ?? null, res: ultimo.get(id) || null, historico: res.filter((z) => Number(z.case_id) === id).sort((a, b) => Date.parse(b.end_time) - Date.parse(a.end_time)), status: ultimo.get(id)?.status || 'untested' }));
    for (const l of linhas) { l.inicio = inicios.find(i => i.casoId === l.id); if (l.status === 'untested' && l.inicio) l.status = 'in_progress'; }
    let c = contagemDaRunQase(run, linhas); const codigo = (id) => vq.recurso.chave + '-' + id;
    const filtro = { q: '', campo: 'all', status: new Set() }; const selecionados = new Set(); let aba = 'casos', aberta = null, consultaDoCaso = 0, focoAnterior = null, casoDoFoco = null;
    const raiz = h('div', { class: 'qs-run', id: 'qs-run', 'data-run-qase': String(x.id) }); const principal = h('div', { class: 'qs-run-principal' }); const lateral = h('aside', { class: 'qs-run-lateral', 'aria-label': tr('Resumo da run') }); const gaveta = h('aside', { class: 'qs-gaveta', id: 'qs-gaveta', hidden: true, 'aria-label': tr('Caso da run') });
    raiz.append(principal, lateral, gaveta); corpo.replaceChildren(raiz);
    // O topo já está abaixo da navegação de Testes. Só as colunas rolam dentro dessa área útil.
    const medirArea = () => { if (!raiz.isConnected) { tamanho.disconnect(); return; } raiz.style.setProperty('--qs-altura', Math.max(0, window.innerHeight - raiz.getBoundingClientRect().top - 16) + 'px'); };
    const tamanho = new ResizeObserver(medirArea); tamanho.observe(raiz); tamanho.observe(corpo); tamanho.observe(document.documentElement); medirArea();
    raiz.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && !gaveta.hidden) { ev.preventDefault(); fecharGaveta(); return; }
      const tab = ev.target.closest('[role="tab"]'); if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(ev.key)) return;
      const itens = [...tab.parentElement.querySelectorAll('[role="tab"]')]; const i = itens.indexOf(tab);
      const proximo = itens[ev.key === 'Home' ? 0 : ev.key === 'End' ? itens.length - 1 : (i + (ev.key === 'ArrowRight' ? 1 : -1) + itens.length) % itens.length]; ev.preventDefault(); proximo.click();
    });
    const recarregar = () => { delete mem.runsQase; return abrirRunQase(e, x, destino); };
    async function enviar(resultados) { const proximo = linhas.find(l => ['untested', 'in_progress'].includes(l.status) && !resultados.some(r => r.casoId === l.id)); const o = await executarOperacao(e, 'qase.publicar_resultados', { runId: Number(x.id), resultados }); if (o?.estado === 'CONFIRMADA') await abrirRunQase(e, x, { ...destino, casoInicial: proximo?.id }); }
    const enviarStatus = (alvos, status) => (status === 'passed' || status === 'skipped' ? enviar(alvos.map((l) => ({ casoId: l.id, status, comentario: '' }))) : abrirGaveta(alvos, 'enviar', status));

    // ---------- Cabeçalho e ações ----------
    const exportar = () => baixarCsv(`run-${x.id}.csv`, [['ID', 'Título', 'Status', 'Duração (ms)', 'Término', 'Comentário'], ...linhas.map((l) => [codigo(l.id), l.titulo, l.status, l.res?.time_spent_ms ?? '', l.res?.end_time ?? '', l.res?.comment ?? ''])]);
    const encerrar = async () => { const o = await executarOperacao(e, 'qase.completar_run', { runId: Number(x.id) }); if (o?.estado === 'CONFIRMADA') await recarregar(); };
    const primeiroPendente = () => linhas.find((l) => l.status === 'in_progress') || linhas.find((l) => l.status === 'untested') || linhas[0];
    const automacoes = async () => {
      const runs = await chamar(() => api.runs(e.id)); if (!runs) return;
      let local = runs.find(r => r.runIdRemoto === Number(x.id));
      if (!local) local = await chamar(() => api.runPreparar({ espacoId: e.id, titulo: run.title || 'Run ' + x.id, ambiente: 'teste', runIdRemoto: Number(x.id), casos: linhas.map(l => ({ casoId: l.id, titulo: l.titulo })) }));
      if (local) await abrirRunLocal(e, local.id, esc);
    };
    const cab = h('div', { class: 'qs-cab' }, h('button', { type: 'button', class: 'qs-voltar', 'aria-label': tr('Voltar'), title: tr('Voltar'), onclick: () => voltar() }, '←'), h('h2', { class: 'qs-titulo', title: run.title || tr('Run {id}', { id: x.id }) }, run.title || tr('Run {id}', { id: x.id })),
      run.status != null ? estadoRunQase(run) : null, DS.chip('#' + x.id));
    const acoes = h('div', { class: 'qs-acoes' }, DS.acao('Iniciar testes manuais', () => { const l = primeiroPendente(); if (l) void abrirGaveta([l], 'enviar'); }, { id: 'qs-iniciar', icone: 'play', desabilitado: !esc || !linhas.length }), DS.acao('Rodar de novo', () => { void prepararRun(e, { planoId: run.plan_id || undefined, casos: ids, titulo: run.title }); }, { id: 'qs-rodar-de-novo', icone: 'atualizar', desabilitado: !ids.length, titulo: !ids.length ? 'Esta run ainda não tem casos.' : null }),
      DS.acao('Automações desta run', automacoes, { id: 'qs-automacoes', icone: 'play', desabilitado: !ids.length || window.PrumoConta?.soVer('testes') }), DS.acao('Exportar', exportar, { id: 'qs-exportar', icone: 'baixar' }), menuDe('Mais ações', [['Encerrar run', encerrar, { desabilitado: !esc }]], { id: 'qs-mais' }), !esc ? DS.info('Escrita no Qase desligada. Habilite em Projetos.') : null);
    const descricao = run.description ? h('details', { class: 'qs-descricao' }, h('summary', {}, tr('Descrição')), h('p', { class: 'ds-texto' }, run.description)) : null;
    const resumoCompacto = h('div', { class: 'qs-run-resumo', 'aria-label': tr('Resumo da run') }, h('strong', {}, tr('{p}% concluído', { p: c.concluido })), h('span', { class: 'ds-sub' }, tr('{a} de {b}', { a: c.feitos, b: c.total })), barraEmpilhada(c.n, c.total));
    const abas = h('div', { class: 'qs-abas', role: 'tablist', 'aria-label': tr('Seções da run') }); const conteudo = h('div', { class: 'qs-conteudo' });
    const desenharAbas = () => abas.replaceChildren(...[['casos', 'Casos', linhas.length], ['tempo', 'Linha do tempo', null]].map(([k, t, n]) => h('button', { type: 'button', role: 'tab', tabindex: aba === k ? 0 : -1, 'data-aba': k, 'aria-selected': String(aba === k), onclick: () => { aba = k; desenharAbas(); desenharConteudo(); abas.querySelector(`[data-aba="${k}"]`).focus({ preventScroll: true }); } }, tr(t), n != null ? h('span', { class: 'ds-n' }, String(n)) : null)));

    // ---------- Busca, filtro e lista por suíte ----------
    const busca = h('input', { type: 'search', class: 'qs-busca', id: 'qs-busca', placeholder: tr('Buscar…'), 'aria-label': tr('Buscar casos'), oninput: (ev) => { filtro.q = ev.target.value; desenharLista(); } });
    const campo = h('select', { class: 'qs-campo', 'aria-label': tr('Campo da busca'), onchange: (ev) => { filtro.campo = ev.target.value; desenharLista(); } }, [['all', 'Em todos os campos'], ['title', 'Título'], ['id', 'ID'], ['comment', 'Comentário']].map(([v, t]) => h('option', { value: v }, tr(t))));
    const chips = h('div', { class: 'qs-chips' });
    const menuFiltro = menuDe('Adicionar filtro', STATUS_QASE.map(([k, rotulo]) => [rotulo, () => { filtro.status.has(k) ? filtro.status.delete(k) : filtro.status.add(k); desenharLista(); }, { status: k }]), { id: 'qs-filtro' });
    menuFiltro.querySelector('summary').replaceChildren(tr('Adicionar filtro'));
    const botaoLote = DS.acao('Enviar resultado', () => abrirGaveta(linhas.filter((l) => selecionados.has(l.id)), 'enviar'), { id: 'qs-enviar-lote', compacto: true, icone: 'ok' });
    const lista = h('div', { class: 'qs-lista', id: 'run-qase-casos' });
    const passaNoFiltro = (l) => {
      if (filtro.status.size && !filtro.status.has(l.status)) return false; const q = filtro.q.trim().toLowerCase(); if (!q) return true;
      const campos = { title: [l.titulo], id: [String(l.id), codigo(l.id)], comment: [l.res?.comment || ''] }; return (filtro.campo === 'all' ? [...campos.title, ...campos.id, ...campos.comment] : campos[filtro.campo]).some((t) => t.toLowerCase().includes(q));
    };
    function linhaDoCaso(l) {
      const marcado = h('input', { type: 'checkbox', 'aria-label': tr('Selecionar {t}', { t: l.titulo }), checked: selecionados.has(l.id), onchange: (ev) => { ev.target.checked ? selecionados.add(l.id) : selecionados.delete(l.id); atualizarLote(); } });
      const kebab = menuDe('Ações do caso', [...RESULTADOS_QASE.map(([k, rotulo]) => [rotulo, () => enviarStatus([l], k), { status: k, desabilitado: !esc }]), ['Abrir caso', () => abrirCaso(e, l.id)]]);
      const ativar = (ev) => { if (ev.target.closest('input, button, .qs-menu')) return; abrirGaveta([l], 'enviar'); };
      return h('div', { class: 'qs-caso', role: 'row', tabindex: 0, 'data-caso-qase': String(l.id), 'data-status': l.status, 'aria-current': String(aberta === l.id), onclick: ativar, onkeydown: (ev) => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target === ev.currentTarget) { ev.preventDefault(); abrirGaveta([l], 'enviar'); } } },
        marcado, h('span', { class: 'qs-id' }, String(l.id)), chipDoStatus(l.status), h('span', { class: 'qs-caso-titulo', title: l.titulo }, l.titulo, ...marcaDoAndamento(l.inicio, l.res?.end_time)), h('span', { class: 'qs-duracao' }, l.res?.time_spent_ms != null ? duracaoDaExecucao(l.res.time_spent_ms) : '—'), kebab);
    }
    function grupoDeSuite(suiteId, ls) {
      const contagem = {}; for (const [k] of STATUS_QASE) contagem[k] = ls.filter((l) => l.status === k).length; const tempo = ls.reduce((s, l) => s + (l.res?.time_spent_ms || 0), 0);
      const todos = h('input', { type: 'checkbox', 'aria-label': tr('Selecionar a suíte inteira'), checked: ls.every((l) => selecionados.has(l.id)), onclick: (ev) => ev.stopPropagation(), onchange: (ev) => { for (const l of ls) ev.target.checked ? selecionados.add(l.id) : selecionados.delete(l.id); desenharLista(); atualizarLote(); } });
      return h('details', { class: 'qs-suite', open: true, 'data-suite': String(suiteId ?? '') }, h('summary', {}, h('span', { class: 'qs-seta', 'aria-hidden': 'true' }, '▾'), todos, h('strong', {}, suiteId == null ? tr('Casos sem suíte') : (nomesDeSuite.get(Number(suiteId)) || tr('Suíte {id}', { id: suiteId }))), h('span', { class: 'qs-espaco' }), h('span', { class: 'qs-duracao' }, DS.icone('relogio'), duracaoDaExecucao(tempo)), barraEmpilhada(contagem, ls.length)), ...ls.map(linhaDoCaso));
    }
    function atualizarLote() {
      botaoLote.hidden = !selecionados.size; botaoLote.disabled = !esc || !selecionados.size;
      const n = lista.querySelector('.qs-selecionar-n'); if (n) { n.hidden = !selecionados.size; n.textContent = selecionados.size ? tr('{n} selecionado(s)', { n: selecionados.size }) : ''; }
      const vis = linhas.filter(passaNoFiltro); const todos = lista.querySelector('.qs-selecionar input'); if (todos) { todos.checked = !!vis.length && vis.every((l) => selecionados.has(l.id)); todos.indeterminate = vis.some((l) => selecionados.has(l.id)) && !todos.checked; }
      for (const grupo of lista.querySelectorAll('.qs-suite')) { const ls = vis.filter((l) => String(l.suiteId ?? '') === grupo.dataset.suite); const b = grupo.querySelector('summary input'); if (b) { b.checked = ls.every((l) => selecionados.has(l.id)); b.indeterminate = ls.some((l) => selecionados.has(l.id)) && !b.checked; } }
    }
    function desenharLista() {
      const vis = linhas.filter(passaNoFiltro); const grupos = new Map(); for (const l of vis) { const k = l.suiteId ?? null; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(l); }
      chips.replaceChildren(...[...filtro.status].map((k) => h('button', { type: 'button', class: 'qs-chip', onclick: () => { filtro.status.delete(k); desenharLista(); (chips.querySelector('button') || menuFiltro.querySelector('summary')).focus(); }, 'aria-label': tr('Remover filtro {s}', { s: rotuloDoStatus(k) }) }, tr('Status: {s}', { s: rotuloDoStatus(k) }), ' ×')));
      const todos = h('input', { type: 'checkbox', 'aria-label': tr('Selecionar todos'), checked: !!vis.length && vis.every((l) => selecionados.has(l.id)), onchange: (ev) => { for (const l of vis) ev.target.checked ? selecionados.add(l.id) : selecionados.delete(l.id); desenharLista(); atualizarLote(); lista.querySelector('.qs-selecionar input')?.focus(); } });
      lista.replaceChildren(!r.ok ? DS.estadoTela('erro', 'Resultados indisponíveis', r.error, [], { compacto: true }) : null,
        h('div', { class: 'qs-selecionar' }, vis.length ? h('label', {}, todos, tr('Selecionar todos')) : null, h('span', { class: 'ds-sub qs-selecionar-n', hidden: true, 'aria-live': 'polite' }), botaoLote),
        vis.length ? h('div', { class: 'qs-colunas', role: 'row' }, h('span'), h('span', {}, 'ID'), h('span', {}, tr('Status')), h('span', {}, tr('Título')), h('span', {}, tr('Duração')), h('span')) : null,
        ...[...grupos].map(([k, ls]) => grupoDeSuite(k, ls)), vis.length ? null : h('p', { class: 'suave' }, linhas.length ? tr('Nenhum caso combina com a busca ou o filtro.') : tr('Esta run ainda não tem casos.')), !vis.length && linhas.length ? DS.acao('Limpar filtros', () => { filtro.q = ''; filtro.campo = 'all'; filtro.status.clear(); busca.value = ''; campo.value = 'all'; desenharLista(); busca.focus(); }, { compacto: true, id: 'qs-limpar-filtros' }) : null);
      atualizarLote();
    }
    const linhaDoTempo = () => { const maior = Math.max(1, ...res.map((z) => z.time_spent_ms || 0));
      return res.length ? h('ol', { class: 'qs-tempo' }, res.map((z) => { const barra = h('span', { class: 'qs-tempo-barra' }); barra.style.width = Math.max(2, ((z.time_spent_ms || 0) / maior) * 100) + '%'; barra.style.background = `var(${corDoStatus(z.status)})`;
        return h('li', {}, h('span', { class: 'qs-tempo-nome' }, nomeDeCaso(catalogo, z.case_id)), h('span', { class: 'qs-tempo-trilho' }, barra), h('span', { class: 'ds-sub' }, duracaoDaExecucao(z.time_spent_ms || 0))); })) : h('p', { class: 'suave' }, tr('Sem resultados para desenhar.')); };
    function desenharConteudo() {
      if (aba === 'tempo') { conteudo.replaceChildren(linhaDoTempo()); return; }
      conteudo.replaceChildren(h('div', { class: 'qs-barra-filtros' }, busca, campo, menuFiltro), chips, lista); desenharLista();
    }

    // ---------- Resumo à direita ----------
    const somaDeTempo = linhas.reduce((s, l) => s + (l.res?.time_spent_ms || 0), 0); const fins = res.map((z) => Date.parse(z.end_time)).filter(Number.isFinite);
    const etiquetas = (run.tags || []).map((t) => t.title || t).filter(Boolean);
    const detalhes = [[tr('Status'), run.status != null ? estadoRunQase(run) : null], [tr('Iniciada por'), run.author?.name || run.user?.name], [tr('Iniciada em'), quandoFoi(run.start_time)], [tr('Tempo total'), somaDeTempo ? duracaoDaExecucao(somaDeTempo) : null],
      [tr('Tempo decorrido'), fins.length > 1 ? duracaoDaExecucao(Math.max(...fins) - Math.min(...fins)) : null], [tr('Finalizada em'), quandoFoi(run.end_time)], [tr('Ambiente'), run.environment?.title || run.environment?.slug], [tr('Milestone'), run.milestone?.title], [tr('Plano'), run.plan_id ? '#' + run.plan_id : null], [tr('Etiquetas'), etiquetas.join(', ') || null]].filter(([, v]) => v);
    lateral.replaceChildren(roscaDaRun(c), h('dl', { class: 'qs-detalhes' }, detalhes.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v)))));

    // ---------- Painel lateral do caso (execução, enviar resultado, histórico) ----------
    function fecharGaveta() { consultaDoCaso++; aberta = null; gaveta.hidden = true; raiz.removeAttribute('data-gaveta'); desenharLista(); const alvo = casoDoFoco != null ? lista.querySelector(`[data-caso-qase="${casoDoFoco}"]`) : focoAnterior; (alvo?.isConnected ? alvo : busca).focus({ preventScroll: true }); }
    async function abrirGaveta(alvos, aba0, statusInicial) {
      if (!alvos.length || !alvos[0]) return; const l = alvos[0]; const lote = alvos.length > 1; const consulta = ++consultaDoCaso;
      focoAnterior = document.activeElement; casoDoFoco = focoAnterior?.closest('[data-caso-qase]')?.dataset.casoQase ?? (lote ? null : l.id);
      aberta = lote ? null : l.id; raiz.setAttribute('data-gaveta', ''); gaveta.hidden = false; gaveta.tabIndex = -1; gaveta.replaceChildren(DS.carregando('Consultando o caso…')); desenharLista(); gaveta.focus({ preventScroll: true });
      const rc = lote ? null : await api.servicoConsultar(e.id, 'qase', 'caso', {}, String(l.id)); if (consulta !== consultaDoCaso || !raiz.isConnected) return;
      if (!lote && !rc?.ok) {
        gaveta.replaceChildren(DS.estadoTela('erro', 'Não foi possível consultar o caso', rc?.error, [DS.acao('Tentar novamente', () => abrirGaveta(alvos, aba0, statusInicial), { icone: 'atualizar' }), DS.acao('Fechar', fecharGaveta)], { compacto: true }));
        return;
      }
      if (!lote && esc && l.status === 'untested' && !l.inicio) {
        const iniciada = await api.runAndamento(e.id, 'qase-' + x.id, l.id);
        if (consulta !== consultaDoCaso || !raiz.isConnected) return;
        if (!iniciada.ok) { gaveta.replaceChildren(DS.estadoTela('erro', 'Não foi possível iniciar o caso', iniciada.error, [DS.acao('Tentar novamente', () => abrirGaveta(alvos, aba0, statusInicial))])); return; }
        l.inicio = iniciada.data[0]; l.status = 'in_progress'; c = contagemDaRunQase(run, linhas); resumoCompacto.replaceChildren(h('strong', {}, tr('{p}% concluído', { p: c.concluido })), h('span', { class: 'ds-sub' }, tr('{a} de {b}', { a: c.feitos, b: c.total })), barraEmpilhada(c.n, c.total)); lateral.replaceChildren(roscaDaRun(c), h('dl', { class: 'qs-detalhes' }, detalhes.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v))))); desenharLista();
      }
      const dados = rc?.ok ? rc.data.dados : {}; const passos = Array.isArray(dados.steps) ? dados.steps : []; let atual = aba0;
      const topo = h('div', { class: 'qs-gaveta-topo' }), corpoDaGaveta = h('div', { class: 'qs-gaveta-corpo' }), meta = h('dl', { class: 'qs-detalhes qs-gaveta-meta' });
      const abasDaGaveta = lote ? [['enviar', 'Enviar resultado']] : [['execucao', 'Execução'], ['enviar', 'Enviar resultado'], ['historico', 'Histórico']];
      const desenharTopo = () => topo.replaceChildren(h('div', { class: 'qs-gaveta-acoes' }, lote ? h('strong', {}, tr('{n} casos selecionados', { n: alvos.length })) : DS.acao('Rodar de novo', () => { void prepararRun(e, { planoId: run.plan_id || undefined, casos: [l.id], titulo: l.titulo }); }, { compacto: true, icone: 'atualizar' }),
        h('button', { type: 'button', class: 'ds-wb-mini', 'aria-label': tr('Fechar painel do caso'), onclick: fecharGaveta }, '×')),
        h('div', { class: 'qs-abas', role: 'tablist' }, abasDaGaveta.map(([k, t]) => h('button', { type: 'button', role: 'tab', tabindex: atual === k ? 0 : -1, 'data-aba-gaveta': k, 'aria-selected': String(atual === k), onclick: () => { atual = k; desenharTopo(); desenharCorpo(); topo.querySelector(`[data-aba-gaveta="${k}"]`).focus({ preventScroll: true }); } }, tr(t)))));
      function execucao() {
        const rs = l.res; const anexos = Array.isArray(rs?.attachments) ? rs.attachments : [];
        return [h('h3', { class: 'ds-h' }, h('span', { class: 'qs-id' }, codigo(l.id)), ' ', l.titulo), chipDoStatus(l.status),
          DS.bloco('Descrição', DS.texto(dados.description, 'Sem descrição.')), dados.preconditions ? DS.bloco('Pré-condições', DS.texto(dados.preconditions)) : null,
          DS.bloco('Resultado obtido', rs?.comment ? DS.texto(rs.comment) : h('p', { class: 'suave' }, tr('Ainda sem resultado nesta run.'))),
          passos.length ? DS.bloco(tr('Passos ({n})', { n: passos.length }), h('ol', { class: 'qs-passos' }, passos.map((p, i) => { const sr = Array.isArray(rs?.steps) ? rs.steps[i]?.status : null; return h('li', {}, h('span', { class: 'qs-id' }, String(p.position ?? i + 1)), h('div', {}, h('strong', {}, p.action || '—'), p.data ? h('span', { class: 'ds-sub' }, tr('Dados: {d}', { d: p.data })) : null, p.expected_result ? h('span', { class: 'ds-sub' }, tr('Esperado: {r}', { r: p.expected_result })) : null), sr ? chipDoStatus(sr) : null); }))) : null,
          DS.bloco('Evidências', anexos.length ? h('ul', { class: 'ds-evid-lista', id: 'qs-anexos' }, anexos.map((a) => h('li', { class: 'ds-evid-arquivo' }, h('div', { class: 'ds-evid-cab' }, DS.icone((a.mime || '').startsWith('image/') ? 'imagem' : 'arquivo'), h('strong', {}, a.filename || a.hash || '—'), a.size != null ? h('span', { class: 'ds-sub' }, tamanhoDoArquivo(a.size)) : null)))) : h('p', { class: 'suave' }, tr('O resultado atual não tem anexos no Qase.')))];
      }
      function historico() { return l.historico.length ? [h('ol', { class: 'qs-historico' }, l.historico.map((z) => h('li', {}, chipDoStatus(z.status), h('span', { class: 'ds-sub' }, [quandoFoi(z.end_time), z.time_spent_ms != null ? duracaoDaExecucao(z.time_spent_ms) : null, z.is_api_result ? tr('automação (API)') : tr('manual')].filter(Boolean).join(' · ')), z.comment ? h('p', { class: 'ds-texto' }, z.comment) : null)))] : [h('p', { class: 'suave' }, tr('Nenhum resultado registrado para este caso.'))]; }
      function formulario() {
        const marcas = passos.map(() => null); const notas = passos.map(() => ''); const anexosNovos = []; let status = statusInicial || null; let salvando = false;
        const comentario = h('textarea', { id: 'qr-comentario', rows: 3, maxlength: 2000, placeholder: tr('O que foi observado'), 'aria-label': tr('Comentário do resultado') }); const erro = h('p', { class: 'ds-sub', role: 'alert' });
        const gerais = RESULTADOS_QASE.map(([s, rotulo]) => h('button', { type: 'button', class: 'qs-resultado', 'data-status': s, disabled: !esc, onclick: () => { status = s; marcar(); } }, h('i', { 'data-cor': s }), tr(rotulo)));
        const enviarBtn = DS.acao('Enviar resultado…', () => confirmarEnvio(), { id: 'qr-enviar', primaria: true }); enviarBtn.disabled = true;
        const linhasDePasso = passos.map((p, i) => { const nota = h('input', { type: 'text', maxlength: 2000, hidden: true, placeholder: tr('Comentário do passo'), 'aria-label': tr('Comentário do passo {n}', { n: p.position ?? i + 1 }), oninput: (ev) => { notas[i] = ev.target.value; } });
          const bs = ['passed', 'failed', 'blocked'].map((s) => h('button', { type: 'button', class: 'qs-passo-r', 'data-status': s, disabled: !esc, title: rotuloDoStatus(s), 'aria-label': rotuloDoStatus(s) + ' · ' + tr('passo {n}', { n: p.position ?? i + 1 }), onclick: () => { marcas[i] = marcas[i] === s ? null : s; sugerir(); marcar(); } }, STATUS_QASE.find(([k]) => k === s)[4]));
          return { bs, nota, el: h('li', {}, h('span', { class: 'qs-id' }, String(p.position ?? i + 1)), h('div', { class: 'qs-passo-texto' }, h('strong', {}, p.action || '—'), p.data ? h('span', { class: 'ds-sub' }, tr('Dados: {d}', { d: p.data })) : null, p.expected_result ? h('span', { class: 'ds-sub' }, tr('Esperado: {r}', { r: p.expected_result })) : null, nota), h('div', { class: 'qs-passo-botoes' }, bs)) }; });
        // Mesmas regras padrão do Qase: um passo com falha reprova o caso; todos os passos passados aprovam.
        function sugerir() { if (marcas.includes('failed')) status = 'failed'; else if (marcas.includes('blocked')) status = 'blocked'; else if (marcas.length && marcas.every((m) => m === 'passed')) status = 'passed'; }
        function marcar() { gerais.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.status === status))); linhasDePasso.forEach((p, i) => { p.bs.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.status === marcas[i]))); p.nota.hidden = !(marcas[i] === 'failed' || marcas[i] === 'blocked'); }); enviarBtn.disabled = !esc || !status; erro.textContent = ''; }
        async function confirmarEnvio() {
          if (!status || salvando) return;
          if (!['passed', 'skipped'].includes(status) && comentario.value.trim().length < 3) { erro.textContent = tr('Descreva o que aconteceu (mínimo de 3 caracteres).'); comentario.focus(); return; }
          const completo = !lote && passos.length > 0 && marcas.every(Boolean);
          salvando = true; enviarBtn.disabled = true;
          try { await enviar(alvos.map((a) => ({ casoId: a.id, status, ...(!lote && l.inicio ? { tempoMs: Math.min(31536000000, Math.max(0, Date.now() - Date.parse(l.inicio.em))) } : {}), comentario: comentario.value.trim(), ...(!lote && anexosNovos.length ? { anexos: anexosNovos.map((z) => z.hash) } : {}), ...(completo ? { passos: passos.map((_, i) => ({ status: marcas[i], comentario: notas[i].trim() })) } : {}) }))); } finally { salvando = false; marcar(); }
        }
        const novosEl = h('ul', { class: 'ds-evid-lista', id: 'qr-anexos-novos' });
        const anexarBtn = DS.acao('Anexar arquivo…', async () => { const o = await executarOperacao(e, 'qase.anexar', {}, { tipo: 'arquivo' }); if (o?.estado === 'CONFIRMADA' && o.remoto?.id) { anexosNovos.push({ hash: o.remoto.id, nome: o.remoto.detalhes?.arquivo || o.remoto.id }); novosEl.replaceChildren(...anexosNovos.map((z) => h('li', { class: 'ds-evid-arquivo' }, h('div', { class: 'ds-evid-cab' }, DS.icone('arquivo'), h('strong', {}, z.nome), DS.chip('Novo'))))); } }, { id: 'qr-anexar', compacto: true, icone: 'mais', desabilitado: !esc || lote });
        const nodos = [h('h3', { class: 'ds-h' }, lote ? tr('{n} casos selecionados', { n: alvos.length }) : l.titulo), ...(!lote ? marcaDoAndamento(l.inicio, l.res?.end_time) : []), !lote && dados.description ? DS.bloco('Descrição', DS.texto(dados.description)) : null, !lote && dados.preconditions ? DS.bloco('Pré-condições', DS.texto(dados.preconditions)) : null, !esc ? DS.info('Escrita no Qase desligada. Habilite em Projetos.') : null, h('div', { class: 'qs-resultados', role: 'group', 'aria-label': tr('Resultado') }, gerais),
          !lote && passos.length ? h('ol', { class: 'qs-passos qs-passos-form' }, linhasDePasso.map((p) => p.el)) : null, !lote && passos.length ? h('p', { class: 'ds-sub' }, tr('Marque todos os passos para enviar o resultado de cada um; sem isso vai só o resultado do caso.')) : null,
          comentario, h('div', { class: 'qs-evid-form' }, anexarBtn), novosEl, erro, h('div', { class: 'ds-cab-acoes' }, enviarBtn, DS.acao('Cancelar', fecharGaveta, { compacto: true }))];
        queueMicrotask(marcar); return nodos;
      }
      function desenharCorpo() { corpoDaGaveta.replaceChildren(...[].concat(atual === 'execucao' ? execucao() : atual === 'historico' ? historico() : formulario()).filter(Boolean)); }
      const rs = l.res; const feito = rs?.end_time ? Date.parse(rs.end_time) : null; const inicio = feito && rs.time_spent_ms != null ? feito - rs.time_spent_ms : null;
      if (!lote) meta.replaceChildren(...[[tr('Caso'), codigo(l.id)], [tr('Executado por'), rs?.author?.name || rs?.user?.name], [tr('Iniciado em'), inicio ? hora(new Date(inicio).toISOString()) : null], [tr('Duração'), rs?.time_spent_ms != null ? duracaoDaExecucao(rs.time_spent_ms) : null], [tr('Finalizado em'), quandoFoi(rs?.end_time)], [tr('Tipo de resultado'), rs ? (rs.is_api_result ? tr('Automatizado') : tr('Manual')) : null]].filter(([, v]) => v).map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v))));
      desenharTopo(); desenharCorpo(); gaveta.replaceChildren(topo, h('div', { class: 'qs-gaveta-grade' }, corpoDaGaveta, meta));
    }

    principal.replaceChildren(cab, acoes, descricao, resumoCompacto, abas, conteudo); desenharAbas(); desenharConteudo();
    if (destino.casoInicial != null) { const l = linhas.find(l => l.id === destino.casoInicial); if (l) await abrirGaveta([l], 'enviar'); }
  }
