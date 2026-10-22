/** Testes: tela, repositório e fontes da IDE (código local, GitHub e pipelines). */
'use strict';
// Testes (v40): representação do que existe no Qase e no código do projeto, com a ligação explícita entre eles.
// Fontes: catálogo estático do repositório (testes:catalogo/testes:arquivo), Qase vinculado (servicoConsultar),
// vínculos declarados (relações do projeto) e resultados registrados no Prumo (runs). Uma ligação caso ↔ código só
// existe por anotação no código (qase(31), qase.id(31), @qase(31), "Qase: SFQ-31") ou por vínculo declarado.
(() => {
  const F = window.PrumoFluxos; if (!F) return;
  const { vinc, relacoesDe, outroLado, tipoCaso, rotuloTipoCaso, resultadosLocais, ticketsExternos } = F;
  /** Relê o projeto depois de gravar vínculos, para a tela e os mapas enxergarem a mudança. */
  const atualizarEspaco = async (e) => { const r = await api.espacoObter(e.id); if (r.ok) { estado.espaco = r.data; return r.data; } return e; };
  const nomesNivel = { unitario: 'Unitário', integracao: 'Integração/API', funcional: 'Funcional (E2E)', regressao: 'Regressão', smoke: 'Smoke', desempenho: 'Desempenho', acessibilidade: 'Acessibilidade', indefinido: 'Não classificado' };
  const chipNivel = (t) => h('span', { class: 'tipo t-' + t }, tr(nomesNivel[t] || t));
  const chipTag = (t) => h('span', { class: 'ds-chip ds-tag' }, '@' + t);

  /** Carrega e memoriza o catálogo do código e os casos do Qase do projeto (uma vez por sessão, com "Atualizar"). */
  async function fontes(e, { forcar = false } = {}) {
    const mem = memoriaDaTela('testes', e.id); if (forcar) { delete mem.catalogo; delete mem.casos; delete mem.runsLocais; }
    const vq = vinc(e, 'qase');
    const [cat, casos, runs, local] = await Promise.all([
      mem.catalogo || api.testesCatalogo(e.id).then((r) => (r.ok ? r.data : { erro: r.error })),
      vq ? (mem.casos || F.carregarQase(e, mem, 'casos')) : null,
      mem.runsLocais || api.runs(e.id).then((r) => (r.ok ? { itens: r.data } : { erro: 'Os resultados locais não puderam ser consultados.' })),
      e.manualAtivo !== false ? api.repositorioLocal(e.id).then((r) => (r.ok ? r.data : { casos: [], suites: [], erro: r.error })) : null
    ]);
    mem.catalogo = cat; if (vq) mem.casos = casos; mem.runsLocais = runs;
    return { cat, casos, runs: runs.itens || [], erroRuns: runs.erro, vq, locais: local };
  }
  const casaQase = (vq, ids, casoId) => ids.some((x) => x === String(casoId) || (vq && x === vq.recurso.chave + '-' + casoId));
  /** Modelo unificado: cada linha é um caso do Qase, um teste do código, ou os dois quando ligados explicitamente. */
  function modelo(e, { cat, casos, runs, vq, locais }) {
    const codigo = []; for (const f of cat?.catalogo?.features || []) for (const t of f.testes) codigo.push({ ...t, arquivo: f.arquivo, feature: f.nome });
    const usados = new Set(); const linhas = [];
    const doLocal = new Map(); const idsQase = new Set((casos?.itens || []).map((c) => String(c.id)));
    for (const lc of locais?.casos || []) for (const x of relacoesDe(e, ['caso-local'], lc.id).map((r) => outroLado(r, ['caso-local'], lc.id))) if (x.tipo === 'qase') doLocal.set(String(x.id), lc);
    for (const c of casos?.itens || []) {
      const espelho = doLocal.get(String(c.id));
      const declarados = [...relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)), ...(espelho ? relacoesDe(e, ['caso-local'], espelho.id).map((x) => outroLado(x, ['caso-local'], espelho.id)) : [])].filter((x) => x.tipo === 'automacao').map((x) => x.id);
      const impl = codigo.filter((t) => casaQase(vq, t.qase || [], c.id) || declarados.includes(t.arquivo + ':' + t.linha)); impl.forEach((t) => usados.add(t));
      const autos = relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)).filter((x) => x.tipo === 'automacao');
      const res = resultadosLocais(runs, c.id).sort((a, b) => Date.parse(b.em) - Date.parse(a.em))[0];
      const tags = [...new Set([...(c.tags || []).map((x) => String(x.title || x).toLowerCase()), ...impl.flatMap((t) => t.tags)])];
      linhas.push({ chave: 'qase:' + c.id, titulo: c.title || '—', caso: c, impl, autos, res, tags, niveis: [...new Set(impl.map((t) => t.tipo))], execucao: tipoCaso(c), feature: impl[0]?.feature || null, espelho });
    }
    const execLocal = { manual: 'manual', 'a-automatizar': 'planejado', automatizado: 'automatizado' };
    for (const c of [...(locais?.casos || [])].sort((x, y) => (x.numero || 1e9) - (y.numero || 1e9) || String(x.criadaEm).localeCompare(String(y.criadaEm)))) {
      const publicado = relacoesDe(e, ['caso-local'], c.id).map((x) => outroLado(x, ['caso-local'], c.id)).find((x) => x.tipo === 'qase')?.id;
      if (publicado && idsQase.has(String(publicado))) continue;
      const impl = codigo.filter((t) => relacoesDe(e, ['caso-local'], c.id).some((x) => outroLado(x, ['caso-local'], c.id).id === t.arquivo + ':' + t.linha)); impl.forEach((t) => usados.add(t));
      const tags = [...new Set([...(c.dados.tags || []).map((x) => x.toLowerCase()), ...impl.flatMap((t) => t.tags)])];
      linhas.push({ chave: 'local:' + c.id, titulo: c.titulo, caso: null, local: c, impl, autos: [], res: null, tags, niveis: [...new Set(impl.map((t) => t.tipo))], execucao: execLocal[c.dados.automacao] || 'manual', suiteTitulo: (locais.suites || []).find((x) => x.id === c.suiteLocalId)?.titulo || null, feature: impl[0]?.feature || null, publicado: publicado || null, pendente: !!vq && !publicado });
    }
    for (const t of codigo) if (!usados.has(t)) linhas.push({ chave: 'codigo:' + t.arquivo + ':' + t.linha, titulo: t.titulo, caso: null, impl: [t], autos: [], res: null, tags: t.tags, niveis: [t.tipo], execucao: 'codigo', feature: t.feature, qaseSemCaso: (t.qase || []).length ? t.qase : null });
    const jiraDe = (tipo, id) => relacoesDe(e, [tipo], id).map((x) => outroLado(x, [tipo], id)).filter((x) => x.tipo === 'jira').map((x) => x.id);
    const idPrumo = (c) => (c.numero ? 'P-' + c.numero : 'L-' + c.id.slice(0, 4).toUpperCase());
    for (const l of linhas) {
      l.props = l.caso ? propriedadesDe(l.caso) : l.local ? propriedadesDe(null, l.local.dados) : {};
      l.ids = l.caso ? ['#' + l.caso.id, ...(l.espelho ? [idPrumo(l.espelho)] : [])] : l.local ? [idPrumo(l.local), ...(l.publicado ? ['#' + l.publicado] : [])] : [];
      l.origem = l.caso ? 'qase' : l.local ? 'local' : 'codigo';
      l.jira = l.caso ? [...new Set([...ticketsExternos(l.caso), ...jiraDe('qase', l.caso.id), ...(l.espelho ? jiraDe('caso-local', l.espelho.id) : [])])] : l.local ? [...new Set(jiraDe('caso-local', l.local.id))] : [];
    }
    return { linhas, codigo, ligados: linhas.filter((l) => l.caso && l.impl.length).length };
  }
  const situacao = (l) => {
    if (l.local) return l.impl.length ? { t: 'Caso com código', tom: 'ok' } : l.execucao === 'automatizado' ? { t: 'Automatizado', tom: 'info' } : l.execucao === 'planejado' ? { t: 'A automatizar', tom: 'aviso' } : { t: 'Manual', tom: null };
    if (l.caso && l.impl.length) return { t: 'Caso com código', tom: 'ok' };
    if (l.caso && l.execucao === 'automatizado') return { t: 'Automatizado no Qase, código não encontrado', tom: 'aviso' };
    if (l.caso && l.execucao === 'planejado') return { t: 'A automatizar', tom: 'info' };
    if (l.caso) return { t: 'Manual', tom: null };
    if (l.qaseSemCaso) return { t: tr('Anota Qase {ids}, caso não encontrado', { ids: l.qaseSemCaso.join(', ') }), tom: 'aviso' };
    return { t: 'Código sem caso no Qase', tom: null };
  };

  // ======================= Tela =======================
  // 2.13: Testes tem quatro seções. IDE (código dos testes e das automações), Repositório (casos e suites, no estilo do Qase),
  // Runs (execuções e runs numa lista só) e Planos. Os nomes antigos das subabas continuam abrindo o lugar novo.
  const ABAS = () => [['ide', 'IDE'], ['repositorio', 'Repositório'], ['runs', 'Runs'], ['planos', 'Planos']];
  const SUBABA_ANTIGA = { catalogo: 'repositorio', casos: 'repositorio', suites: 'repositorio', vinculos: 'repositorio', codigo: 'ide', automacao: 'pipelines' };
  const modosIde = (sub) => h('div', { class: 'segmentos sub ds-ide-modos', role: 'group', 'aria-label': 'Modo da IDE' }, [['ide', 'Código'], ['pipelines', 'Pipelines CI/CD']].map(([k, t]) => h('button', { type: 'button', 'data-ide-modo': k, 'aria-pressed': String(k === sub), onclick: () => { (estado.sub ||= {}).testes = k; void mostrar('testes'); } }, t)));
  abas.testes = async (el) => {
    const e = estado.espaco; const itens = ABAS();
    let sub = SUBABA_ANTIGA[estado.sub?.testes] || estado.sub?.testes || 'repositorio'; if (!itens.some(([k]) => k === sub) && sub !== 'pipelines') sub = 'repositorio';
    const aba = sub === 'pipelines' ? 'ide' : sub; // 'pipelines' é o modo CI/CD dentro da aba IDE
    if (!e) {
      el.append(DS.cabecalho({ titulo: 'Testes' }), barraSub('testes', itens, aba), aba === 'ide' ? modosIde(sub) : null, h('div', { id: 'sub-conteudo' }, sub === 'runs' ? null : DS.estadoTela('vazio', 'Nenhum projeto selecionado', 'Selecione ou crie um projeto para continuar.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))])));
      if (sub === 'runs') await F.telaRuns(null, memoriaDaTela('testes', 'todos'), el.querySelector('#sub-conteudo'), false);
      return;
    }
    const vq = vinc(e, 'qase'), vg = vinc(e, 'github'); const manual = e.manualAtivo !== false; const mem = memoriaDaTela('testes', e.id);
    const perm = vq ? await escritaDoProjeto(e) : {}; const esc = !!perm.qase;
    const modoCriar = vq && !manual ? 'direto' : manual ? 'local' : null;
    const acoes = { repositorio: [menuCriar(e, { modoCriar, vq, esc, mem })],
      runs: [DS.acao('Preparar run', () => F.prepararRun(e), { id: 'run-nova', primaria: true, icone: 'mais' })] }[sub] || [];
    // A IDE usa a tela inteira: sem título nem subtítulo, só a barra de seções.
    if (aba !== 'ide') el.append(DS.cabecalho({ titulo: 'Testes', acoes }));
    el.append(barraSub('testes', itens, aba));
    // IDE: arquivos de teste e automação (Código) ou os pipelines de CI/CD (Pipelines); os dois usam a tela inteira.
    if (aba === 'ide') el.append(modosIde(sub));
    const corpo = h('div', { id: 'sub-conteudo', class: aba === 'ide' ? 'ds-ide-cheio' : null }); el.append(corpo);
    if (sub === 'pipelines') await telaPipelines(e, mem, corpo);
    else if (sub === 'ide') await telaCodigo(e, mem, corpo);
    else if (sub === 'repositorio') await repositorio(e, mem, corpo, vq);
    else if (sub === 'planos') await F.telaPlanos(e, mem, corpo);
    else await F.telaRuns(e, mem, corpo, esc);
  };

  // Repositório: todos os cenários numa lista só (casos do Qase, quando vinculado, e testes do código, manuais e automatizados),
  // as propostas em revisão (rascunhos locais que seguem para o Qase depois de revisados), as suites e os vínculos declarados.
  /** Fecha popovers ao clicar fora; guarda um tratador por chave, para cada nova renderização substituir o anterior em vez de somar ouvintes. */
  const foraDosPopovers = new Map(); let ouvindoForaDosPopovers = false;
  function aoClicarFora(chave, fn) {
    foraDosPopovers.set(chave, fn);
    if (!ouvindoForaDosPopovers) { ouvindoForaDosPopovers = true; document.addEventListener('click', (ev) => { for (const f of foraDosPopovers.values()) f(ev); }); }
  }
  const teclasDosPopovers = new Map(); let ouvindoTeclas = false;
  function aoPressionarTecla(chave, fn) {
    teclasDosPopovers.set(chave, fn);
    if (!ouvindoTeclas) { ouvindoTeclas = true; document.addEventListener('keydown', (ev) => { for (const f of teclasDosPopovers.values()) f(ev); }); }
  }
  /** Um botão só para criar: cenário e suíte. O destino depende do projeto (Manual/Prumo e Qase conectados). */
  function menuCriar(e, { modoCriar, vq, esc, mem }) {
    const caixa = h('div', { class: 'rep-criar' }); const lista = h('div', { class: 'rep-criar-lista', id: 'rep-criar-lista', hidden: true });
    const botao = h('button', { type: 'button', class: 'rep-criar-btn', id: 'rep-criar', 'aria-haspopup': 'true', 'aria-controls': 'rep-criar-lista', 'aria-expanded': 'false', disabled: !modoCriar, title: modoCriar ? null : tr('Ative Manual/Prumo ou conecte o Qase em Projetos para criar.') }, DS.icone('mais'), tr('Criar'), h('span', { class: 'rep-caret' }, '▾'));
    const fechar = () => { lista.hidden = true; botao.setAttribute('aria-expanded', 'false'); };
    const item = (id, rotulo, dica, fn) => h('button', { type: 'button', id, class: 'rep-criar-item', onclick: () => { fechar(); fn(); } }, h('b', {}, tr(rotulo)), h('span', {}, tr(dica)));
    lista.append(
      item('pr-nova', 'Novo cenário', modoCriar === 'direto' ? 'Cria direto no Qase' : vq ? 'Escreve no Prumo e publica no Qase' : 'Salvo neste computador', () => { mem.editor = modoCriar === 'direto' ? { direto: true } : {}; void mostrar('testes'); }),
      item('su-nova', 'Nova suíte', modoCriar === 'direto' || (vq && !modoCriar) ? 'Cria no Qase' : 'Organiza os cenários do Prumo', async () => {
        if (modoCriar === 'direto') { F.novaSuite(e, esc); return; }
        const r = await api.repositorioLocal(e.id); F.formularioSuiteLocal(e, r.ok ? r.data.suites : []); }));
    botao.addEventListener('click', (ev) => { ev.stopPropagation(); lista.hidden = !lista.hidden; botao.setAttribute('aria-expanded', String(!lista.hidden)); if (!lista.hidden) lista.querySelector('button')?.focus(); });
    aoClicarFora('criar', (ev) => { if (!lista.hidden && !caixa.contains(ev.target)) fechar(); });
    caixa.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !lista.hidden) { fechar(); botao.focus(); } if (!lista.hidden && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) { ev.preventDefault(); const bs = [...lista.querySelectorAll('button')]; const i = bs.indexOf(document.activeElement); bs[(i + (ev.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length]?.focus(); } });
    caixa.addEventListener('focusout', (ev) => { if (!lista.hidden && !caixa.contains(ev.relatedTarget)) fechar(); });
    caixa.append(botao, lista); return caixa;
  }
  async function repositorio(e, mem, corpo, vq) {
    if (mem.editor) { await telaEditor(e, mem, corpo); return; }
    if (!vq && e.manualAtivo !== false) memoriaDaTela('testes', e.id).totalCasosLocais = 1;
    await visaoGeral(e, mem, corpo);
  }

  // ======================= Cenário: ler como fluxo, escrever no lugar e publicar no Qase =======================
  // Valores de sistema do Qase (IDs do próprio Qase): o que o Prumo escreve aqui é o que o Qase aceita no caso.
  const QASE_SEVERIDADE = [[1, 'Bloqueadora'], [2, 'Crítica'], [3, 'Maior'], [4, 'Normal'], [5, 'Menor'], [6, 'Trivial']];
  const QASE_PRIORIDADE = [[1, 'Alta'], [2, 'Média'], [3, 'Baixa']];
  const QASE_STATUS = [[0, 'Ativo'], [1, 'Rascunho'], [2, 'Obsoleto']];
  const QASE_COMPORTAMENTO = [[1, 'Positivo'], [2, 'Negativo'], [3, 'Destrutivo']];
  const QASE_CAMADA = [[1, 'E2E'], [2, 'API'], [3, 'Unitário']];
  const QASE_TIPO = [[1, 'Funcional'], [2, 'Smoke'], [3, 'Regressão'], [4, 'Segurança'], [5, 'Usabilidade'], [6, 'Performance'], [7, 'Aceitação'], [8, 'Compatibilidade'], [9, 'Integração'], [10, 'Exploratório']];
  const rotuloQase = (lista, v) => (lista.find(([k]) => k === v) || [])[1] || null;
  const STATUS_QASE = { actual: 0, draft: 1, deprecated: 2 };
  const numQase = (v) => (v === null || v === undefined || v === '' ? undefined : typeof v === 'string' && v in STATUS_QASE ? STATUS_QASE[v] : Number.isFinite(Number(v)) ? Number(v) : undefined);
  /** Propriedades do caso, as mesmas do Qase (status, severidade, prioridade, tipo, camada, comportamento, instável), vindas do Qase ou do cenário do Prumo. */
  const propriedadesDe = (c, local) => (local ? { status: local.status, severidade: local.severidade, prioridade: local.prioridade, tipo: local.tipo, camada: local.camada, comportamento: local.comportamento, instavel: !!local.instavel }
    : { status: numQase(c.status), severidade: numQase(c.severity), prioridade: numQase(c.priority), tipo: numQase(c.type), camada: numQase(c.layer), comportamento: numQase(c.behavior), instavel: !!c.is_flaky });
  const valorProp = (lista, v) => (v ? rotuloQase(lista, v) : null);
  const PALAVRAS = ['Dado', 'Quando', 'Então', 'E', 'Mas'];
  const PALAVRA_INGLES = { Given: 'Dado', When: 'Quando', Then: 'Então', And: 'E', But: 'Mas', Dado: 'Dado', Quando: 'Quando', 'Então': 'Então', E: 'E', Mas: 'Mas' };
  const CHAVE_DE_TESTE = /^\s*(test|it|describe|scenario|def test_|func Test|@Test|public void)/i;
  /** Menu de três pontos: <details> que fecha ao escolher um item, ao clicar fora ou com Esc. Itens: [rótulo, ação, { desabilitado, motivo }]. */
  function menuTres(rotulo, itens, { id } = {}) {
    const lista = itens.filter(Boolean); if (!lista.length) return null;
    const d = h('details', { class: 'qs-menu rep-tres', id: id || null }, h('summary', { 'aria-label': tr(rotulo), title: tr(rotulo) }, '⋯'),
      h('div', { class: 'qs-menu-lista', role: 'menu' }, lista.map(([t, fn, o = {}]) => h('button', { type: 'button', role: 'menuitem', disabled: !!o.desabilitado, title: o.motivo ? tr(o.motivo) : null, onclick: (ev) => { ev.stopPropagation(); d.open = false; void fn(); } }, tr(t)))));
    const fora = (ev) => { if (!d.contains(ev.target)) d.open = false; };
    const painel = d.querySelector('.qs-menu-lista'); const fechar = () => { d.open = false; };
    d.addEventListener('toggle', () => {
      document.removeEventListener('click', fora, true); window.removeEventListener('scroll', fechar, true); window.removeEventListener('resize', fechar);
      if (!d.open) return;
      // Posição fixa calculada na abertura: o contêiner da árvore rola e cortava o menu.
      const a = d.querySelector('summary').getBoundingClientRect(); painel.style.position = 'fixed'; painel.style.left = 'auto'; painel.style.right = Math.max(8, document.documentElement.clientWidth - a.right) + 'px';
      const alto = painel.getBoundingClientRect().height; const topo = a.bottom + 4 + alto > window.innerHeight - 8 ? Math.max(8, a.top - 4 - alto) : a.bottom + 4; painel.style.top = topo + 'px';
      // Se algum ancestral (transform, filter) virar referência do "fixed", corrige o deslocamento medido.
      const real = painel.getBoundingClientRect(); const dx = real.right - (document.documentElement.clientWidth - parseFloat(painel.style.right)); const dy = real.top - topo;
      if (Math.abs(dy) > 1 || Math.abs(dx) > 1) { painel.style.top = (topo - dy) + 'px'; painel.style.right = (parseFloat(painel.style.right) + dx) + 'px'; }
      document.addEventListener('click', fora, true); window.addEventListener('scroll', fechar, true); window.addEventListener('resize', fechar);
      d.querySelector('[role=menuitem]:not(:disabled)')?.focus({ preventScroll: true });
    });
    // O menu mora dentro de linhas clicáveis: nem clique nem teclado dele pode abrir o item da linha.
    d.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Escape' && d.open) { ev.preventDefault(); d.open = false; d.querySelector('summary').focus(); } });
    d.addEventListener('click', (ev) => ev.stopPropagation()); return d;
  }
  const iconBtn = (nome, rotulo, fn, { id, gira, desabilitado } = {}) => { const b = h('button', { type: 'button', class: 'rep-ib' + (gira ? ' gira' : ''), id: id || null, title: tr(rotulo), 'aria-label': tr(rotulo), disabled: !!desabilitado }, DS.icone(nome)); if (fn) b.addEventListener('click', fn); return b; };

  /** Regras de qualidade do cenário. Cada uma diz de onde vem (ISTQB, Gherkin, Qase) e pode ser desligada em Configurar; o perfil muda conforme o cenário é manual ou automatizado. */
  const FONTE_QUALIDADE = 'Regras inspiradas nos atributos de caso de teste do ISTQB (título, propósito, pré e pós-condições, passos e resultado esperado, prioridade, rastreabilidade) e nas boas práticas do Gherkin/Cucumber (um comportamento por cenário; Dado, Quando, Então). Servem de guia: não bloqueiam salvar.';
  const REGRAS_QUALIDADE = [
    ['titulo', 'Título claro, com 3 palavras ou mais', 'ISTQB: o título descreve o comportamento verificado, não só a tela.', (d) => (d.titulo || '').trim().split(/\s+/).filter(Boolean).length >= 3],
    ['proposito', 'Propósito explicado', 'ISTQB: o objetivo do teste fica registrado para quem lê depois (PO, QA, dev).', (d) => (d.descricao || '').trim().length >= 10],
    ['pre', 'Pré-condições informadas', 'ISTQB: o que precisa estar pronto antes de executar.', (d) => (d.preCondicoes || '').trim().length > 0],
    ['passos', 'Entre 1 e 12 passos (um comportamento por cenário)', 'Gherkin/Cucumber: cenários curtos, com um único comportamento.', (d) => (d.passos || []).length >= 1 && (d.passos || []).length <= 12],
    ['esperado', 'O resultado é verificável', 'BDD: tem Dado, Quando e Então, nessa ordem. Passos clássicos: o último tem resultado esperado.', (d) => { const p = d.passos || []; if (p.length && p.every((x) => x.formato === 'bdd')) { const w = p.map((x) => x.palavra); return w.indexOf('Dado') >= 0 && w.indexOf('Dado') < w.indexOf('Quando') && w.indexOf('Quando') < w.lastIndexOf('Então'); } return p.length > 0 && !!p.at(-1).esperado; }],
    ['severidade', 'Severidade definida', 'ISTQB e Qase: severidade e prioridade orientam a triagem de falhas.', (d) => d.severidade !== undefined],
    ['tags', 'Tags para filtrar', 'Qase: tags permitem montar planos e filtros (smoke, regressão).', (d) => (d.tags || []).length > 0],
    ['rastro', 'Rastreável: ticket do Jira ou automação ligada', 'Rastreabilidade: o caso aponta para o requisito (Jira) ou para o código que o executa.', (d, c) => (c.jira || 0) > 0 || (c.auto || 0) > 0],
    ['automacao', 'Automatizado: teste do código ligado', 'Perfil automatizado: o caso precisa apontar para o teste que o executa.', (d, c) => (c.auto || 0) > 0, 'automatizado']
  ];
  function qualidadeDoCenario(d, { jira = 0, auto = 0, desligadas = [] } = {}) {
    const perfil = d.automacao === 'automatizado' ? 'automatizado' : 'manual';
    return REGRAS_QUALIDADE.filter(([id, , , , alvo]) => !desligadas.includes(id) && (!alvo || alvo === perfil)).map(([id, texto, porque, teste]) => ({ id, texto, porque, ok: !!teste(d, { jira, auto }) }));
  }
  const lerRegrasDesligadas = () => { try { return JSON.parse(localStorage.getItem('prumo.qualidade.desligadas') || '[]'); } catch { return []; } };
  const gravarRegrasDesligadas = (l) => { try { localStorage.setItem('prumo.qualidade.desligadas', JSON.stringify(l)); } catch { /* sem armazenamento: vale só nesta tela */ } };
  /** Bloco de qualidade com ⓘ (de onde vêm as regras), ⚙ (ligar e desligar regras) e a regra explicada ao passar o mouse. */
  function blocoDeQualidade(obter) {
    const raiz = h('div', { class: 'ed-f ed-qual', id: 'ed-qualidade' }); let config = false;
    const desenhar = () => {
      const desligadas = lerRegrasDesligadas(); const { dados, jira, auto } = obter(); const r = qualidadeDoCenario(dados, { jira, auto, desligadas }); const ok = r.filter((x) => x.ok).length;
      const perfil = dados.automacao === 'automatizado' ? 'automatizado' : 'manual';
      raiz.replaceChildren(h('div', { class: 'ed-qual-topo' }, h('b', {}, tr('Qualidade') + ' · ' + ok + '/' + r.length), DS.info(FONTE_QUALIDADE + ' Perfil atual: ' + perfil + '.', { rotulo: 'Sobre a qualidade do cenário' }), iconBtn('ajustes', config ? 'Fechar configuração' : 'Configurar as regras', () => { config = !config; desenhar(); }, { id: 'ed-qual-config' })),
        h('div', { class: 'ed-qual-barra' }, h('i', { 'data-n': String(r.length ? Math.round((ok / r.length) * 10) : 0) })),
        config ? h('div', { class: 'ed-qual-conf' }, REGRAS_QUALIDADE.filter(([, , , , alvo]) => !alvo || alvo === perfil).map(([id, texto, porque]) => h('label', { title: tr(porque) }, h('input', { type: 'checkbox', checked: !desligadas.includes(id), onchange: (ev) => { const l = lerRegrasDesligadas().filter((x) => x !== id); if (!ev.target.checked) l.push(id); gravarRegrasDesligadas(l); desenhar(); } }), tr(texto))))
          : h('ul', {}, r.map((x) => h('li', { 'data-ok': x.ok ? '1' : '', title: tr(x.porque) }, tr(x.texto)))));
    };
    raiz.atualizar = desenhar; desenhar(); return raiz;
  }
  /** Recorta do arquivo o corpo do teste que começa em `linha` (até o próximo teste ou 40 linhas). */
  function trechoDoTeste(conteudo, linha) {
    const todas = String(conteudo).replace(/\r\n/g, '\n').split('\n'); const ini = Math.max(0, linha - 1); let fim = Math.min(todas.length, ini + 40);
    for (let i = ini + 1; i < fim; i++) if (CHAVE_DE_TESTE.test(todas[i]) && !/^\s{3,}/.test(todas[i])) { fim = i; break; }
    return todas.slice(ini, fim).join('\n').replace(/\s+$/, '');
  }
  /** "Dado que…" gravado no Qase volta a ser palavra + texto; Given/When/Then também. */
  /** Converte os passos do Qase: só vira BDD quando TODOS começam com Dado/Quando/Então/E/Mas e nenhum tem resultado esperado; passo clássico nunca perde o resultado esperado. */
  function passosDoQase(steps) {
    const lista = Array.isArray(steps) ? steps : []; const todosBdd = lista.length > 0 && lista.every((p) => separarPalavra(p.action).palavra && !p.expected_result);
    return lista.map((p) => { const sp = todosBdd ? separarPalavra(p.action) : { palavra: null, texto: String(p.action || '') };
      return { acao: sp.texto, esperado: todosBdd ? '' : (p.expected_result || ''), dados: p.data || '', formato: todosBdd ? 'bdd' : 'normal', ...(todosBdd ? { palavra: sp.palavra } : {}) }; });
  }
  function separarPalavra(texto) { const m = /^(Dado|Quando|Então|Mas|E|Given|When|Then|And|But)\s+(.+)$/s.exec(String(texto || '').trim()); return m ? { palavra: PALAVRA_INGLES[m[1]], texto: m[2] } : { palavra: null, texto: String(texto || '') }; }

  /** Normaliza qualquer origem (Qase, local, código) para o que o painel mostra. */
  async function lerCenario(e, l) {
    const vq = vinc(e, 'qase');
    if (l.caso && vq) {
      const r = await api.servicoConsultar(e.id, 'qase', 'caso', {}, String(l.caso.id)); const c = r.ok ? r.data.dados : l.caso;
      return { erro: r.ok ? null : r.error, descricao: c.description, pre: c.preconditions, pos: c.postconditions, tags: (c.tags || []).map((t) => t.title || t),
        passos: passosDoQase(c.steps).map((p) => ({ palavra: p.palavra || null, texto: p.acao, dados: p.dados, esperado: p.esperado || '' })), jira: l.jira, props: propriedadesDe(c), suite: ((memoriaDaTela('testes', e.id).suites?.itens || []).find((x) => x.id === c.suite_id) || {}).title || null, automacao: l.execucao, criado: c.created_at || c.created, atualizado: c.updated_at || c.updated,
        meta: [rotuloQase(QASE_SEVERIDADE, c.severity), rotuloQase(QASE_PRIORIDADE, c.priority), rotuloQase(QASE_TIPO, c.type), rotuloQase(QASE_COMPORTAMENTO, c.behavior), rotuloQase(QASE_CAMADA, c.layer)].filter(Boolean) };
    }
    if (l.local) {
      const d = l.local.dados;
      return { descricao: d.descricao, pre: d.preCondicoes, pos: d.posCondicoes, tags: d.tags || [], jira: l.jira, requisito: l.local.requisito,
        passos: (d.passos || []).map((p) => ({ palavra: p.formato === 'bdd' ? p.palavra : null, texto: p.acao, dados: p.dados, esperado: p.formato === 'bdd' ? '' : p.esperado })), props: propriedadesDe(null, d), suite: l.local.suiteLocalId ? ((l.suiteTitulo) || null) : null, automacao: l.execucao, criado: l.local.criadaEm, atualizado: l.local.atualizadaEm,
        meta: [rotuloQase(QASE_SEVERIDADE, d.severidade), rotuloQase(QASE_PRIORIDADE, d.prioridade), rotuloQase(QASE_TIPO, d.tipo), rotuloQase(QASE_COMPORTAMENTO, d.comportamento), rotuloQase(QASE_CAMADA, d.camada)].filter(Boolean) };
    }
    return { descricao: '', passos: [], tags: l.tags, jira: [], meta: [], props: {}, automacao: 'codigo' };
  }

  /** O "fluxo": cada passo abre o código da automação (quando existe) ou o resultado esperado, editável nos casos do Prumo. */
  function fluxoDoCenario(e, l, dados, { editarLocal, editar }) {
    const raiz = h('div', { class: 'cp-fluxo' }); let codigo = null; let ultima = 'n';
    const carregarCodigo = () => (codigo ||= l.impl.length ? api.testesArquivo(e.id, l.impl[0].arquivo).then((r) => (r.ok ? trechoDoTeste(r.data.conteudo, l.impl[0].linha) : null)) : Promise.resolve(null));
    const ponta = (rotulo, texto) => (texto ? h('div', { class: 'cp-st cp-b' }, h('span', { class: 'cp-k' }, tr(rotulo)), h('span', {}, texto)) : null);
    raiz.append(ponta('Antes', dados.pre));
    dados.passos.forEach((p, i) => {
      const tipo = p.palavra === 'Dado' ? 'd' : p.palavra === 'Quando' ? 'w' : p.palavra === 'Então' ? 't' : p.palavra ? ultima : 'n'; if (p.palavra === 'Dado' || p.palavra === 'Quando' || p.palavra === 'Então') ultima = tipo;
      const detalhe = h('div', { class: 'cp-det', hidden: true, role: 'status' });
      const no = h('div', { class: 'cp-st', 'data-tipo': tipo, 'data-passo': String(i) });
      const cab = h('button', { type: 'button', class: 'cp-cab', 'aria-expanded': 'false' }, h('span', { class: 'cp-k' }, p.palavra ? tr(p.palavra) : tr('Passo') + ' ' + (i + 1)), h('span', { class: 'cp-t' }, p.texto), (l.impl.length || p.esperado || p.dados || editarLocal) ? h('span', { class: 'cp-seta' }, l.impl.length ? DS.icone('codigo') : h('span', { class: 'cp-caret' }, '▾')) : null);
      cab.addEventListener('click', async () => {
        const abrir = detalhe.hidden; detalhe.hidden = !abrir; cab.setAttribute('aria-expanded', String(abrir)); if (!abrir || detalhe.dataset.pronto) return; detalhe.dataset.pronto = '1';
        if (l.impl.length) {
          detalhe.append(h('div', { class: 'cp-det-rot' }, DS.icone('codigo'), h('button', { type: 'button', class: 'ds-link', onclick: () => abrirNoCodigo(e, l.impl[0].arquivo, l.impl[0].linha) }, l.impl[0].arquivo + ':' + l.impl[0].linha)));
          const pre = h('pre', { class: 'ds-codigo cp-codigo' }, tr('Lendo o arquivo…')); detalhe.append(pre); pre.textContent = (await carregarCodigo()) || tr('Não foi possível ler o arquivo.');
        }
        if (p.dados) detalhe.append(h('div', { class: 'cp-extra' }, h('span', {}, tr('Dados')), p.dados));
        if (p.esperado) detalhe.append(h('div', { class: 'cp-extra cp-esperado' }, h('span', {}, tr('Esperado')), p.esperado));
        if (editarLocal) {
          const esp = h('input', { class: 'cp-in', hidden: !!p.palavra, placeholder: tr('Resultado esperado deste passo'), value: p.esperado || '', maxlength: 2000, 'aria-label': tr('Resultado esperado') });
          const dad = h('input', { class: 'cp-in', placeholder: tr('Dados de teste'), value: p.dados || '', maxlength: 2000, 'aria-label': tr('Dados de teste') });
          const aviso = h('span', { class: 'ds-sub', role: 'status' });
          detalhe.append(h('div', { class: 'cp-edit' }, esp, dad, iconBtn('ok', 'Salvar este passo', async () => { aviso.textContent = '…'; const r = await editarLocal(i, { ...(p.palavra ? {} : { esperado: esp.value }), dados: dad.value }); if (!r.ok) { aviso.textContent = tr('Não foi possível salvar'); return; }
            const g = r.gravado || {}; if (g.dados !== undefined) dad.value = g.dados; if (g.esperado !== undefined && !p.palavra) esp.value = g.esperado;
            aviso.textContent = (g.dados !== undefined && g.dados !== dad.value) || /\[REDACTED\]/.test((g.dados || '') + (g.esperado || '')) ? tr('Salvo; trechos sensíveis (senha, token) foram mascarados.') : tr('Salvo'); }), aviso));
        }
      });
      no.append(cab, detalhe); raiz.append(no);
    });
    if (!dados.passos.length) raiz.append(h('p', { class: 'suave' }, l.local || l.caso ? tr('Nenhum passo escrito ainda. ') : tr('Este teste existe só no código; ainda não há cenário escrito.'), l.local || l.caso ? h('button', { type: 'button', class: 'ds-link', onclick: () => editar(l) }, tr('Escrever passos')) : null));
    raiz.append(ponta('Depois', dados.pos));
    return raiz;
  }

  /** Pontuação de qualidade do cenário aberto (as mesmas regras do editor). */
  function seloQualidade(l, dados) {
    if (!l.caso && !l.local) return null;
    const d = { titulo: l.titulo, descricao: dados.descricao, preCondicoes: dados.pre, posCondicoes: dados.pos, tags: dados.tags, severidade: dados.props?.severidade, automacao: l.execucao === 'automatizado' ? 'automatizado' : 'manual',
      passos: dados.passos.map((p) => ({ formato: p.palavra ? 'bdd' : 'normal', palavra: p.palavra, esperado: p.esperado, dados: p.dados })) };
    const r = qualidadeDoCenario(d, { jira: l.jira.length, auto: l.impl.length, desligadas: lerRegrasDesligadas() }); const ok = r.filter((x) => x.ok).length;
    return h('span', { class: 'cp-qual', title: r.filter((x) => !x.ok).map((x) => '• ' + tr(x.texto)).join('\n') || tr('Todas as regras atendidas'), 'data-nivel': ok === r.length ? 'alto' : ok >= r.length * 0.6 ? 'medio' : 'baixo' }, tr('Qualidade') + ' ' + ok + '/' + r.length);
  }
  /** Propriedades no mesmo desenho do Qase: rótulo pequeno em cima, valor embaixo. */
  function propriedadesDoCaso(l, dados) {
    const p = dados.props || {}; const exec = { manual: 'Manual', planejado: 'A automatizar', automatizado: 'Automatizado', codigo: 'Automatizado (código)' }[dados.automacao || l.execucao];
    const itens = [['Status', valorProp(QASE_STATUS, p.status === 0 ? 1e-9 : p.status) || (p.status === 0 ? 'Ativo' : null)], ['Suíte', dados.suite], ['Severidade', valorProp(QASE_SEVERIDADE, p.severidade)], ['Prioridade', valorProp(QASE_PRIORIDADE, p.prioridade)],
      ['Tipo', valorProp(QASE_TIPO, p.tipo)], ['Camada', valorProp(QASE_CAMADA, p.camada)], ['Comportamento', valorProp(QASE_COMPORTAMENTO, p.comportamento)], ['Instável', p.instavel ? 'Sim' : null], ['Automação', exec],
      ['Tags', dados.tags.length ? dados.tags.map((t) => '@' + t).join(' ') : null], ['Criado', dados.criado ? hora(dados.criado) : null], ['Atualizado', dados.atualizado ? hora(dados.atualizado) : null]];
    return h('dl', { class: 'cp-props' }, itens.filter(([, v]) => v).map(([k, v]) => h('div', {}, h('dt', {}, tr(k)), h('dd', { 'data-prop': k.toLowerCase() }, tr(String(v))))));
  }
  /** Referência do caso (do Qase ou do Prumo) como o mapa de vínculos a guarda. */
  function refDoCaso(e, l) {
    const vq = vinc(e, 'qase');
    return l.caso ? { tipo: 'qase', id: String(l.caso.id), vinculoId: vq.id, origem: vq.recurso.chave } : { tipo: 'caso-local', id: l.local.id, origem: 'prumo' };
  }
  /** Jira, automação e resultado: tudo ligável e removível no próprio caso. */
  function ligacoesDoCenario(e, l, { selo, aoMudar, capacidades = [], features = [] }) {
    const vj = vinc(e, 'jira'); const podeLigar = !!(l.caso || l.local); const tipo = l.caso ? 'qase' : 'caso-local'; const idCaso = l.caso ? String(l.caso.id) : l.local?.id;
    const declaradas = podeLigar ? relacoesDe(e, [tipo], idCaso).map((rel) => ({ rel, ref: outroLado(rel, [tipo], idCaso) })) : [];
    const aviso = h('span', { class: 'ds-sub', role: 'status', 'aria-live': 'polite' });
    const ligar = async (para, justificativa) => { const r = await api.espacoAssociar(e.id, { de: refDoCaso(e, l), para, justificativa }); if (!r.ok && !String(r.error || '').includes('TRACE_DUPLICATE')) { aviso.textContent = r.error; return; } await atualizarEspaco(e); aoMudar(); };
    const desligar = async ({ rel }) => { const r = await api.espacoAssociar(e.id, { de: rel.de, para: rel.para, justificativa: rel.justificativa || 'vínculo' }, true); if (!r.ok) { aviso.textContent = r.error; return; } if (r.data?.canceled) return; await atualizarEspaco(e); aoMudar(); };
    const x = (d) => iconBtn('fechar', 'Remover vínculo', () => desligar(d));
    const entradaJira = vj ? h('input', { class: 'cp-in cp-in-curto', maxlength: 40, placeholder: vj.recurso.chave + '-123', value: ticketInicial || '', 'aria-label': tr('Ticket do Jira') }) : null;
    const adicionarJira = async () => { const chave = entradaJira.value.trim().toUpperCase(); if (!chave) return;
      if (!/^[A-Z][A-Z0-9_]*-\d+$/.test(chave)) { aviso.textContent = tr('Use o formato {k}-123.', { k: vj.recurso.chave }); return; }
      if (!chave.startsWith(vj.recurso.chave + '-')) { aviso.textContent = tr('O ticket deve pertencer ao projeto Jira vinculado.'); return; }
      if (l.jira.includes(chave)) { aviso.textContent = tr('Este ticket já está vinculado.'); return; }
      aviso.textContent = '…'; const t = await api.servicoConsultar(e.id, 'jira', 'ticket', {}, chave); if (!t.ok) { aviso.textContent = /NOT_FOUND/.test(String(t.error)) ? tr('Ticket não encontrado no Jira.') : tr('Não foi possível confirmar o ticket no Jira: ') + t.error; return; }
      aviso.textContent = '';
      await ligar({ tipo: 'jira', id: chave, vinculoId: vj.id, origem: vj.recurso.instancia }, 'Vinculado ao ticket pelo caso, no repositório'); };
    if (entradaJira) { entradaJira.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); void adicionarJira(); } }); entradaJira.addEventListener('input', () => { aviso.textContent = ''; }); }
    const jiraDecl = declaradas.filter((d) => d.ref.tipo === 'jira');
    const autoDecl = declaradas.filter((d) => d.ref.tipo === 'automacao');
    const opcoes = [...capacidades.map((c) => [c, tr('Automação') + ' · ' + c]), ...features.flatMap((ft) => ft.testes.map((t) => [ft.arquivo + ':' + t.linha, ft.nome + ' · ' + t.titulo]))].filter(([v]) => !autoDecl.some((d) => d.ref.id === v) && !l.impl.some((t) => t.arquivo + ':' + t.linha === v));
    const seletor = h('select', { class: 'cp-in cp-in-curto', 'aria-label': tr('Automação ou feature') }, h('option', { value: '' }, tr('Vincular automação…')), opcoes.map(([v, t]) => h('option', { value: v }, t)));
    seletor.addEventListener('change', () => { if (seletor.value) void ligar({ tipo: 'automacao', id: seletor.value, origem: 'qa.project.json' }, 'Automação vinculada ao caso, no repositório'); });
    const item = (icone, rotulo, conteudo) => h('div', { class: 'cp-lig-i' }, h('span', { class: 'cp-lig-ic' }, DS.icone(icone)), h('div', {}, h('b', {}, tr(rotulo)), h('div', { class: 'cp-lig-v' }, conteudo)));
    return h('div', { class: 'cp-ligacoes' },
      item('arquivo', 'Jira', [...l.jira.map((k) => { const d = jiraDecl.find((j) => j.ref.id === k); return h('span', { class: 'cp-lig-tag' }, F.noRef(e, { tipo: 'jira', id: k, vinculoId: vj?.id }, k), d ? x(d) : null); }),
        podeLigar && vj ? h('span', { class: 'cp-lig-add' }, entradaJira, iconBtn('mais', 'Vincular ticket', adicionarJira)) : (l.jira.length ? null : h('span', { class: 'suave' }, tr('nenhum ticket')))]),
      item('codigo', 'Automação', [...l.impl.slice(0, 3).map((t) => h('button', { type: 'button', class: 'ds-link', onclick: () => abrirNoCodigo(e, t.arquivo, t.linha) }, t.arquivo.split('/').at(-1) + ':' + t.linha)),
        ...autoDecl.filter((d) => !l.impl.some((t) => t.arquivo + ':' + t.linha === d.ref.id)).map((d) => h('span', { class: 'cp-lig-tag' }, h('span', { class: 'ds-chip', 'data-tom': 'info' }, d.ref.id), x(d))),
        ...autoDecl.filter((d) => l.impl.some((t) => t.arquivo + ':' + t.linha === d.ref.id)).map((d) => x(d)),
        !l.impl.length && !autoDecl.length ? h('span', { class: 'suave' }, l.execucao === 'automatizado' ? tr('marcado como automatizado, sem teste ligado') : l.execucao === 'planejado' ? tr('a automatizar, sem teste ligado') : tr('manual')) : null,
        podeLigar && opcoes.length ? seletor : null]),
      item('relogio', 'Último resultado', l.res ? selo(l.res.status) : h('span', { class: 'suave' }, tr('ainda não executado'))), aviso);
  }
  /** O código real do teste ligado, sempre visível embaixo do fluxo. */
  function codigoDaAutomacao(e, l) {
    const t = l.impl[0]; const pre = h('pre', { class: 'ds-codigo cp-codigo' }, tr('Lendo o arquivo…'));
    api.testesArquivo(e.id, t.arquivo).then((r) => { pre.textContent = r.ok ? trechoDoTeste(r.data.conteudo, t.linha) : tr('Não foi possível ler o arquivo.'); });
    return h('section', { class: 'cp-codigo-bloco', id: 'caso-painel-codigo-bloco' }, h('div', { class: 'cp-det-rot' }, DS.icone('codigo'), h('b', {}, tr('Código da automação')), h('button', { type: 'button', class: 'ds-link', onclick: () => abrirNoCodigo(e, t.arquivo, t.linha) }, t.arquivo + ':' + t.linha)), pre);
  }

  /** Painel do cenário ao lado da lista: leitura rápida; o resto abre por ícone. */
  async function painelDoCaso(e, l, { aoFechar, situacao, selo, publicar, editar, remover, aoMudar, escrita }) {
    const raiz = h('aside', { class: 'cp', id: 'caso-painel', 'data-chave': l.chave }, DS.carregando('Carregando o cenário…'));
    const dados = await lerCenario(e, l); const vq = vinc(e, 'qase'); const s = situacao(l);
    const aut = await api.espacoAutomacoes(e.id); const capacidades = (aut.ok && aut.data.capacidades) || []; const features = memoriaDaTela('testes', e.id).catalogo?.catalogo?.features || [];
    const sincronia = l.caso ? (l.espelho ? 'Igual ao Qase #' + l.caso.id : 'Do Qase #' + l.caso.id) : l.local ? (vq ? (l.publicado ? 'No Qase #' + l.publicado : 'Só no Prumo, ainda não está no Qase') : 'Só no Prumo') : 'Só no código';
    const editarLocal = l.local ? async (i, campos) => { const d = { ...l.local.dados, passos: l.local.dados.passos.map((p, k) => (k === i ? { ...p, ...campos } : p)) };
      const r = await api.casoLocalSalvar({ espacoId: e.id, id: l.local.id, dados: d, suiteLocalId: l.local.suiteLocalId }); if (r.ok) { l.local.dados = r.data.dados; const gravado = r.data.dados.passos[i] || {}; Object.assign(dados.passos[i], { esperado: gravado.esperado ?? campos.esperado, dados: gravado.dados ?? campos.dados }); } return r.ok ? { ok: true, gravado: r.data.dados.passos[i] } : { ok: false }; } : null;
    raiz.replaceChildren(
      h('div', { class: 'cp-topo' }, h('button', { type: 'button', class: 'cp-voltar', onclick: aoFechar }, '← ' + tr('Lista')), h('span', { class: 'cp-sync' }, h('i', { class: 'cp-dot', 'data-ok': l.caso ? '1' : '' }), tr(sincronia)),
        h('div', { class: 'cp-acoes' }, l.caso || l.local ? iconBtn('editar', 'Editar', () => editar(l), { id: 'caso-painel-editar' }) : null,
          l.impl.length ? iconBtn('codigo', 'Abrir no código', () => abrirNoCodigo(e, l.impl[0].arquivo, l.impl[0].linha), { id: 'caso-painel-codigo' }) : null,
          vq && l.local && !l.publicado ? iconBtn('subir', escrita ? 'Publicar no Qase' : 'Habilite a escrita no Qase em Projetos', () => publicar([l]), { id: 'caso-painel-publicar', desabilitado: !escrita }) : null,
          l.caso || (l.local && !l.local.legado) ? iconBtn('lixeira', l.caso ? (escrita ? 'Arquivar no Qase (obsoleto)' : 'Habilite a escrita no Qase em Projetos') : 'Remover do Prumo', () => remover(l), { id: 'caso-painel-remover', desabilitado: !!l.caso && !escrita }) : null,
          iconBtn('fechar', 'Fechar painel', aoFechar))),
      h('h2', { class: 'cp-titulo' }, l.titulo),
      h('div', { class: 'cp-meta' }, ...l.ids.map((x) => h('b', {}, x)), tr(s.t), seloQualidade(l, dados)),
      propriedadesDoCaso(l, dados),
      dados.erro ? DS.alerta(tr('Não foi possível ler todos os dados no Qase: ') + dados.erro, 'aviso') : null,
      dados.descricao || dados.requisito ? h('p', { class: 'cp-texto' }, dados.descricao || '', dados.requisito ? h('span', { class: 'ds-sub' }, ' ' + tr('Requisito: ') + dados.requisito) : null) : null,
      fluxoDoCenario(e, l, dados, { editarLocal, editar }),
      ligacoesDoCenario(e, l, { selo, aoMudar, capacidades, features }),
      l.impl.length ? codigoDaAutomacao(e, l) : null);
    return raiz;
  }

  /** Editor no próprio lugar: o cenário é escrito como se lê (palavra + frase), sem formulário em janela. */
  async function editorDoCenario(e, existente, { suites, aut, cat, perm, aoSair, publicar, qase = null, suiteInicial = null, ticketInicial = null, tituloInicial = '', descricaoInicial = '' }) {
    const vq = vinc(e, 'qase'); const vj = vinc(e, 'jira'); const d = existente?.dados || {};
    const titulo = h('input', { class: 'ed-titulo', id: 'ed-titulo', placeholder: tr('Nome do cenário'), maxlength: 255, value: existente?.titulo || tituloInicial, 'aria-label': tr('Título') });
    const desc = h('textarea', { class: 'ed-area', id: 'ed-descricao', rows: 2, maxlength: 8000, placeholder: tr('Para que serve este cenário?'), 'aria-label': tr('Propósito') }, d.descricao || descricaoInicial);
    const pre = h('textarea', { class: 'ed-area', id: 'ed-pre', rows: 1, maxlength: 4000, placeholder: tr('O que precisa estar pronto'), 'aria-label': tr('Antes') }, d.preCondicoes || '');
    const pos = h('textarea', { class: 'ed-area', id: 'ed-pos', rows: 1, maxlength: 4000, placeholder: tr('O que deve ficar para trás'), 'aria-label': tr('Depois') }, d.posCondicoes || '');
    let bdd = !(d.passos || []).some((p) => p.formato !== 'bdd') || !(d.passos || []).length;
    const lista = h('div', { class: 'ed-passos', id: 'ed-passos' }); const saida = h('div', { id: 'ed-saida', role: 'status', 'aria-live': 'polite' });
    const proximaPalavra = (ant) => ({ Dado: 'Quando', Quando: 'Então', 'Então': 'E', E: 'E', Mas: 'E' })[ant] || 'Dado';
    function passo(p = {}, depoisDe = null) {
      const linha = h('div', { class: 'ed-passo' }); const texto = h('input', { class: 'passo-acao', maxlength: 2000, value: p.acao || '', placeholder: tr('Descreva o passo'), 'aria-label': tr('Passo') });
      const palavra = h('button', { type: 'button', class: 'ed-kw passo-palavra', 'data-p': p.palavra || 'Dado', title: tr('Trocar a palavra'), 'aria-label': tr('Palavra do passo: {p}. Ativar para trocar', { p: tr(p.palavra || 'Dado') }) }, tr(p.palavra || 'Dado'));
      const esp = h('input', { class: 'passo-esperado', maxlength: 2000, value: p.esperado || '', placeholder: tr('Resultado esperado'), 'aria-label': tr('Resultado esperado') });
      const dad = h('input', { class: 'passo-dados', maxlength: 2000, value: p.dados || '', placeholder: tr('Dados de teste'), 'aria-label': tr('Dados de teste') });
      const extra = h('div', { class: 'ed-extra' }, dad, esp);
      const alinhar = () => { palavra.hidden = !bdd; esp.hidden = bdd; extra.hidden = !(bdd ? dad.value : (dad.value || esp.value || extra.dataset.aberto)); };
      palavra.addEventListener('click', () => { const k = PALAVRAS[(PALAVRAS.indexOf(palavra.dataset.p) + 1) % PALAVRAS.length]; palavra.dataset.p = k; palavra.textContent = tr(k); palavra.setAttribute('aria-label', tr('Palavra do passo: {p}. Ativar para trocar', { p: tr(k) })); });
      texto.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); const n = passo({ palavra: proximaPalavra(palavra.dataset.p) }, linha); n.querySelector('.passo-acao').focus(); } if (ev.key === 'Backspace' && !texto.value && lista.children.length > 1) { ev.preventDefault(); (linha.previousElementSibling || linha.nextElementSibling)?.querySelector('.passo-acao')?.focus(); linha.remove(); } });
      linha.alinhar = alinhar;
      linha.append(h('span', { class: 'ed-bola' }), palavra, texto, iconBtn('mais', 'Dados de teste e resultado esperado', () => { extra.dataset.aberto = extra.dataset.aberto ? '' : '1'; extra.hidden = !extra.dataset.aberto && !(dad.value || (!bdd && esp.value)); if (extra.dataset.aberto) { extra.hidden = false; dad.focus(); } }), iconBtn('fechar', 'Remover passo', () => linha.remove()), extra);
      if (depoisDe) depoisDe.after(linha); else lista.append(linha); alinhar(); return linha;
    }
    for (const p of (d.passos?.length ? d.passos : [{ palavra: 'Dado' }])) passo(p);
    const modo = h('div', { class: 'ed-modo', role: 'group', 'aria-label': tr('Formato dos passos') }, [[true, 'BDD'], [false, 'Passos e resultado']].map(([v, t]) => h('button', { type: 'button', 'aria-pressed': String(bdd === v), onclick: (ev) => { bdd = v; for (const b of modo.children) b.setAttribute('aria-pressed', String(b === ev.currentTarget)); for (const l of lista.children) l.alinhar();
        const perde = bdd && [...lista.children].some((l) => l.querySelector('.passo-esperado').value.trim()); saida.replaceChildren(perde ? DS.alerta(tr('No formato BDD o resultado esperado de cada passo não é usado: ele volta se você retornar a Passos e resultado, mas não é salvo enquanto estiver em BDD.'), 'aviso') : ''); } }, tr(t))));
    /** Grupo de opções de escolha única (clicar de novo desmarca): valores do próprio Qase. */
    const escolha = (id, lista0, v, rot) => { let atual = v; const no = h('div', { class: 'ed-chips', id, role: 'group', 'aria-label': tr(rot) });
      const pintar = () => { for (const b of no.children) b.setAttribute('aria-pressed', String(String(atual) === b.dataset.v)); };
      for (const [k, t] of lista0) no.append(h('button', { type: 'button', class: 'ed-chip', 'data-v': String(k), onclick: () => { atual = String(atual) === String(k) ? undefined : k; pintar(); } }, tr(t)));
      pintar(); no.valor = () => atual; return no; };
    const opt = (lista0, v, vazio) => [h('option', { value: '' }, vazio), ...lista0.map(([k, t]) => h('option', { value: String(k), selected: v === k }, tr(t)))];
    const suite = h('select', { id: 'ed-suite', 'aria-label': tr('Suíte') }, h('option', { value: '' }, tr('Sem suíte')), suites.map((s) => h('option', { value: s.id, selected: s.id === (existente?.suiteLocalId ?? suiteInicial) }, s.titulo)));
    const jira = vj ? h('input', { id: 'ed-jira', maxlength: 40, placeholder: vj.recurso.chave + '-123', value: ticketInicial || '', 'aria-label': tr('Ticket do Jira') }) : null;
    const opcoesAuto = [...(aut || []).map((x) => [x, tr('Automação') + ' · ' + x]), ...(cat || []).flatMap((f) => f.testes.map((t) => [f.arquivo + ':' + t.linha, f.nome + ' · ' + t.titulo]))];
    const auto = h('select', { id: 'ed-auto', 'aria-label': tr('Automação ou feature') }, h('option', { value: '' }, tr('Nenhuma')), opcoesAuto.map(([v, t]) => h('option', { value: v }, t)));
    const tags = h('input', { id: 'ed-tags', maxlength: 400, value: (d.tags || []).join(', '), placeholder: '@regressao, @pedidos', 'aria-label': tr('Tags') });
    const exec = escolha('ed-exec', [['manual', 'Manual'], ['a-automatizar', 'A automatizar'], ['automatizado', 'Automatizado']], d.automacao || 'manual', 'Execução');
    const seletor = (id, lista0, v, rot) => { const no = h('select', { id, 'aria-label': tr(rot) }, h('option', { value: '' }, tr(rot)), lista0.map(([k, t]) => h('option', { value: String(k), selected: v === k }, tr(t)))); no.valor = () => (no.value === '' ? undefined : Number(no.value)); return no; };
    const sev = seletor('ed-sev', QASE_SEVERIDADE, d.severidade, 'Severidade'), pri = seletor('ed-pri', QASE_PRIORIDADE, d.prioridade, 'Prioridade'), sta = seletor('ed-status', QASE_STATUS, d.status, 'Status'), comp = seletor('ed-comp', QASE_COMPORTAMENTO, d.comportamento, 'Comportamento'), cam = seletor('ed-cam', QASE_CAMADA, d.camada, 'Camada'), tip = seletor('ed-tipo', QASE_TIPO, d.tipo, 'Tipo');
    const instavelCx = h('input', { type: 'checkbox', id: 'ed-instavel', checked: !!d.instavel }); const instavel = h('label', { class: 'ed-check' }, instavelCx, tr('Teste instável (flaky)')); instavel.valor = () => instavelCx.checked;
    const campo = (rot, no) => h('div', { class: 'ed-f' }, h('b', {}, tr(rot)), no);
    const num = (no) => (no.valor() === undefined ? undefined : Number(no.valor()));
    const coletar = () => {
      const passos = [...lista.children].map((l) => { const b = bdd; const palavra = l.querySelector('.passo-palavra').dataset.p;
        return { acao: l.querySelector('.passo-acao').value, esperado: b ? '' : l.querySelector('.passo-esperado').value, dados: l.querySelector('.passo-dados').value, formato: b ? 'bdd' : 'normal', ...(b ? { palavra } : {}) }; }).filter((p) => p.acao.trim());
      const dados = { titulo: titulo.value.trim(), descricao: desc.value, preCondicoes: pre.value, posCondicoes: pos.value, passos, automacao: exec.valor() || 'manual',
        tags: tags.value.split(',').map((t) => t.trim().replace(/^@/, '').replace(/\s+/g, '-')).filter(Boolean) };
      for (const [k, no] of [['severidade', sev], ['prioridade', pri], ['status', sta], ['comportamento', comp], ['camada', cam], ['tipo', tip]]) { const v = num(no); if (v !== undefined) dados[k] = v; }
      if (instavel.valor()) dados.instavel = true;
      return dados;
    };
    async function criarNoQase() {
      saida.replaceChildren(); const dados = coletar(); if (dados.titulo.length < 3) { saida.replaceChildren(DS.alerta(tr('Informe um título com pelo menos 3 caracteres.'), 'aviso')); return; }
      const p = corpoParaQase(dados); if (suite.value) p.suiteId = Number(suite.value); const chave = jira?.value.trim().toUpperCase(); if (chave && vj && chave.startsWith(vj.recurso.chave + '-')) p.ticket = chave;
      const r = await executarOperacao(e, 'qase.criar_caso', p);
      if (r?.estado === 'CONFIRMADA') { const mm = memoriaDaTela('testes', e.id); delete mm.casos; delete mm.suites; avisar(tr('Caso criado e confirmado no Qase.')); aoSair(); } else if (r) saida.replaceChildren(/DUPLICATE/.test(JSON.stringify(r)) ? DS.alerta(tr('Já existe um caso com este título nessa suíte do Qase; mude o título.'), 'aviso') : painelResultado(r));
    }
    async function salvarNoQase() {
      if (qase.novo) { await criarNoQase(); return; }
      saida.replaceChildren(); const dados = coletar(); if (dados.titulo.length < 3) { saida.replaceChildren(DS.alerta(tr('Informe um título com pelo menos 3 caracteres.'), 'aviso')); return; }
      const antes = qase.original; const p = { casoId: Number(qase.id) };
      const campos = { titulo: 'titulo', descricao: 'descricao', preCondicoes: 'preCondicoes', posCondicoes: 'posCondicoes', severidade: 'severidade', prioridade: 'prioridade', status: 'status', tipo: 'tipo', comportamento: 'comportamento', camada: 'camada', automacao: 'automacao' };
      for (const [k, v] of Object.entries(campos)) if (dados[v] !== undefined && JSON.stringify(dados[v]) !== JSON.stringify(antes[v])) p[k] = dados[v];
      if (JSON.stringify(dados.tags) !== JSON.stringify(antes.tags || [])) p.tags = dados.tags;
      if (JSON.stringify(dados.passos) !== JSON.stringify(antes.passos || [])) p.passos = dados.passos;
      if (!!dados.instavel !== !!antes.instavel) p.instavel = !!dados.instavel;
      if (Object.keys(p).length === 1) { saida.replaceChildren(DS.alerta(tr('Nenhuma alteração para salvar.'), 'aviso')); return; }
      const r = await executarOperacao(e, 'qase.editar_caso', p);
      if (r?.estado === 'CONFIRMADA') { delete memoriaDaTela('testes', e.id).casos; avisar(tr('Caso atualizado no Qase.')); aoSair(); } else if (r) saida.replaceChildren(painelResultado(r));
    }
    /** Confere os limites antes de enviar e diz qual campo está errado. */
    const problemaNosDados = (dados) => {
      if (dados.titulo.length < 3) return tr('Informe um título com pelo menos 3 caracteres.');
      if (dados.tags.length > 10) return tr('Use no máximo 10 tags.');
      const ruim = dados.tags.find((t) => !/^[A-Za-z0-9_.-]{1,40}$/.test(t)); if (ruim) return tr('A tag "{t}" não é válida: use letras sem acento, números, ponto, hífen ou sublinhado (até 40 caracteres).', { t: ruim });
      if (dados.passos.length > 50) return tr('Use no máximo 50 passos.');
      return null;
    };
    let ocupado = false; let sujo = false; let armado = false; let idSalvo = existente?.id;
    const protegido = async (fn) => { if (ocupado) return; ocupado = true; try { await fn(); } finally { ocupado = false; } };
    async function salvar(depoisPublicar) {
      { const antes = problemaNosDados(coletar()); if (antes) { saida.replaceChildren(DS.alerta(antes, 'aviso')); return; } }
      if (qase) { await salvarNoQase(); return; }
      const dados = coletar(); if (dados.titulo.length < 3) { saida.replaceChildren(DS.alerta(tr('Informe um título com pelo menos 3 caracteres.'), 'aviso')); return; }
      const chave = jira?.value.trim().toUpperCase();
      if (chave && !(chave.startsWith(vj.recurso.chave + '-') && /^[0-9]+$/.test(chave.slice(vj.recurso.chave.length + 1)))) { saida.replaceChildren(DS.alerta(tr('O ticket deve pertencer ao projeto Jira vinculado.'), 'aviso')); return; }
      const r = await api.casoLocalSalvar({ espacoId: e.id, ...(idSalvo ? { id: idSalvo } : {}), dados, suiteLocalId: suite.value || null });
      if (!r.ok) { saida.replaceChildren(DS.alerta(textoErro(r.error), 'falha')); return; }
      idSalvo = r.data.id;
      const ligar = async (para) => { const x = await api.espacoAssociar(e.id, { de: { tipo: 'caso-local', id: r.data.id, origem: 'prumo' }, para, justificativa: 'Declarado ao escrever o cenário no Prumo' }); if (!x.ok && !String(x.error || '').includes('TRACE_DUPLICATE')) { saida.replaceChildren(DS.alerta(tr('Cenário salvo; o vínculo não foi registrado. Tente salvar novamente: ') + x.error, 'aviso')); return false; } return true; };
      if (chave && !await ligar({ tipo: 'jira', id: chave, vinculoId: vj.id, origem: vj.recurso.instancia })) return;
      if (auto.value && !await ligar({ tipo: 'automacao', id: auto.value, origem: 'qa.project.json' })) return;
      await atualizarEspaco(e); avisar(tr('Cenário salvo no Prumo.'));
      if (depoisPublicar) { const novo = (await api.repositorioLocal(e.id)).data?.casos.find((c) => c.id === r.data.id); if (novo) { await publicar([{ local: novo, titulo: novo.titulo }]); } }
      aoSair();
    }
    const qualidade = blocoDeQualidade(() => ({ dados: coletar(), jira: jira?.value.trim() ? 1 : 0, auto: auto.value ? 1 : 0 }));
    const raiz = h('section', { class: 'ed', id: 'ed-raiz' },
      h('div', { class: 'ed-barra' }, h('span', { class: 'ed-trilha' }, tr('Testes › Repositório ›'), ' ', h('b', {}, existente ? tr('Editar cenário') : tr('Novo cenário'))), h('span', { class: 'ed-rasc' }, qase ? (qase.novo ? tr('Criando direto no Qase') : tr('Caso do Qase #') + qase.id + tr(' · edita direto no Qase')) : vq ? (existente?.id && existente.publicado ? tr('Já está no Qase') : tr('Rascunho no Prumo · ainda não está no Qase')) : tr('Salvo neste computador')),
        h('span', { class: 'ed-acoes' }, iconBtn('fechar', 'Descartar', () => { if (sujo && !armado) { armado = true; avisar(tr('Há alterações não salvas. Clique de novo em Descartar para sair sem salvar.')); return; } aoSair(); }, { id: 'ed-descartar' }), iconBtn('ok', qase ? (qase.novo ? 'Criar no Qase' : 'Salvar no Qase') : 'Salvar rascunho', () => protegido(() => salvar(false)), { id: 'pr-salvar', desabilitado: !!qase && !perm.qase }), vq && !qase ? iconBtn('baixar', perm.qase ? 'Salvar e publicar no Qase' : 'Habilite a escrita no Qase em Projetos', () => protegido(() => salvar(true)), { id: 'ed-publicar', gira: true, desabilitado: !perm.qase }) : null)),
      h('div', { class: 'ed-corpo' },
        h('div', { class: 'ed-doc' }, titulo, h('div', { class: 'ed-rot' }, tr('Propósito')), desc, h('div', { class: 'ed-rot' }, tr('Antes'), pre.value ? null : null), pre,
          h('div', { class: 'ed-rot' }, tr('Passo a passo'), DS.info('Enter cria o próximo passo. Clique na palavra (Dado, Quando, Então, E, Mas) para trocar. O botão + abre dados de teste e resultado esperado.', { rotulo: 'Dicas para escrever os passos' }), modo), h('div', { class: 'ed-fluxo' }, lista, h('button', { type: 'button', class: 'ed-add', id: 'pr-add-passo', title: tr('Enter cria o próximo passo. Clique na palavra para trocar.'), onclick: () => { const ult = lista.lastElementChild?.querySelector('.passo-palavra')?.dataset.p; passo({ palavra: proximaPalavra(ult) }).querySelector('.passo-acao').focus(); } }, DS.icone('mais'), tr('Adicionar passo'))),
          h('div', { class: 'ed-rot' }, tr('Depois')), pos, saida),
        h('div', { class: 'ed-rail' }, qualidade, h('div', { class: 'ed-grade' }, campo('Status', sta), campo('Severidade', sev), campo('Prioridade', pri), campo('Tipo', tip), campo('Camada', cam), campo('Comportamento', comp)), instavel,
          campo('Execução', exec), qase && !qase.novo ? null : campo('Suíte', suite), campo('Tags', tags), jira && !(qase && !qase.novo) ? campo('Jira', jira) : null, qase ? null : campo('Automação', auto))));
    setTimeout(() => titulo.focus(), 0);
    raiz.addEventListener('input', () => { sujo = true; armado = false; });
    raiz.addEventListener('input', () => qualidade.atualizar()); raiz.addEventListener('click', () => setTimeout(() => qualidade.atualizar(), 0));
    return raiz;
  }

  /** Dados do cenário no formato que a operação de criar caso no Qase aceita (sem campos vazios). */
  function corpoParaQase(d) {
    const p = { titulo: d.titulo, descricao: d.descricao || '', preCondicoes: d.preCondicoes || '', posCondicoes: d.posCondicoes || '', automacao: d.automacao || 'manual', tags: d.tags || [],
      passos: (d.passos || []).map((s) => ({ acao: s.acao, esperado: s.esperado || '', dados: s.dados || '', ...(s.formato === 'bdd' ? { formato: 'bdd', palavra: s.palavra } : {}) })) };
    for (const [k, v] of [['severidade', d.severidade], ['prioridade', d.prioridade], ['tipo', d.tipo], ['status', d.status], ['comportamento', d.comportamento], ['camada', d.camada], ['instavel', d.instavel]]) if (v !== undefined && v !== null) p[k] = v;
    return p;
  }
  /** Publica cenários do Prumo no Qase: cria a suíte se faltar, cria o caso e deixa o vínculo para a lista não duplicar. */
  async function publicarNoQase(e, itens, { aoConcluir }) {
    const vq = vinc(e, 'qase'); const vj = vinc(e, 'jira'); const mem = memoriaDaTela('testes', e.id);
    if (!vq) { avisar(tr('Qase não vinculado a este projeto.'), true); return; }
    const perm = await escritaDoProjeto(e); if (!perm.qase) { avisar(tr('Habilite a escrita no Qase em Projetos para publicar.'), true); return; }
    const locais = (await api.repositorioLocal(e.id)).data || { casos: [], suites: [] };
    const qs = await F.carregarQase(e, mem, 'suites'); const suitesQase = [...(qs.itens || [])];
    const feitos = []; const falhas = [];
    for (const item of itens) {
      const c = item.local; const d = c.dados; let suiteId;
      const suiteLocal = c.suiteLocalId ? locais.suites.find((s) => s.id === c.suiteLocalId) : null;
      if (suiteLocal) {
        let q = suitesQase.find((s) => String(s.title).trim().toLowerCase() === suiteLocal.titulo.trim().toLowerCase());
        if (!q) { const rs = await executarOperacao(e, 'qase.criar_suite', { titulo: suiteLocal.titulo, descricao: suiteLocal.descricao || '' }); if (!rs || rs.estado !== 'CONFIRMADA') { falhas.push(c.titulo + ': ' + (rs?.erro || tr('suíte não criada'))); continue; } q = { id: Number(rs.remoto?.id), title: suiteLocal.titulo }; suitesQase.push(q); }
        suiteId = Number(q.id);
      }
      const jira = relacoesDe(e, ['caso-local'], c.id).map((x) => outroLado(x, ['caso-local'], c.id)).find((x) => x.tipo === 'jira')?.id;
      const p = corpoParaQase(d);
      if (suiteId) p.suiteId = suiteId; if (jira && vj && jira.startsWith(vj.recurso.chave + '-')) p.ticket = jira;
      const r = await executarOperacao(e, 'qase.criar_caso', p);
      if (!r) continue; if (r.estado !== 'CONFIRMADA') { falhas.push(c.titulo + ': ' + (/DUPLICATE/.test(String(r.erro)) ? tr('já existe um caso com este título nessa suíte do Qase; mude o título') : (r.erro ? textoErro(r.erro) : r.estado))); continue; }
      const x = await api.espacoAssociar(e.id, { de: { tipo: 'caso-local', id: c.id, origem: 'prumo' }, para: { tipo: 'qase', id: String(r.remoto.id), vinculoId: vq.id, origem: vq.recurso.chave }, justificativa: 'Publicado no Qase a partir do Prumo' });
      if (!x.ok && !String(x.error || '').includes('TRACE_DUPLICATE')) falhas.push(c.titulo + ': ' + tr('criado no Qase, vínculo local não gravado')); else feitos.push(c.titulo);
    }
    delete mem.casos; delete mem.suites; await atualizarEspaco(e);
    avisar(feitos.length ? (feitos.length === 1 ? tr('1 cenário publicado no Qase.') : tr('{n} cenários publicados no Qase.', { n: feitos.length })) + (falhas.length ? ' ' + tr('{n} falharam.', { n: falhas.length }) : '') : (falhas[0] || tr('Nada foi publicado.')), !feitos.length);
    aoConcluir();
  }
  /** Janela de confirmação antes de publicar: mostra o que será criado. */
  function dialogoPublicar(e, itens, suitesLocais, suitesQase, publicar) {
    const marcados = new Set(itens.map((i) => i.chave));
    const linhas = itens.map((l) => { const s = suitesLocais.find((x) => x.id === l.local.suiteLocalId); const existe = s && suitesQase.some((q) => String(q.title).trim().toLowerCase() === s.titulo.trim().toLowerCase());
      return h('label', { class: 'pub-it' }, h('input', { type: 'checkbox', checked: true, onchange: (ev) => { if (ev.target.checked) marcados.add(l.chave); else marcados.delete(l.chave); } }), h('span', { class: 'pub-t' }, h('b', {}, l.titulo), h('em', {}, (l.local.dados.passos?.length || 0) + ' ' + tr('passos') + (l.tags.length ? ' · @' + l.tags[0] : ''))), h('span', { class: 'pub-s' }, s ? s.titulo + ' · ' + (existe ? tr('já existe no Qase') : tr('será criada')) : tr('sem suíte'))); });
    const novas = new Set(itens.map((l) => suitesLocais.find((x) => x.id === l.local.suiteLocalId)).filter((s) => s && !suitesQase.some((q) => String(q.title).trim().toLowerCase() === s.titulo.trim().toLowerCase())).map((s) => s.id));
    DS.modal(tr('Publicar {n} cenário(s) no Qase', { n: itens.length }), [DS.info('O Qase pede a sua confirmação antes de gravar cada item. Depois de publicado, o cenário passa a ser o mesmo caso do Qase e deixa de aparecer duplicado.'), h('div', { class: 'pub-lista' }, linhas), h('p', { class: 'ds-sub' }, tr('{c} caso(s) novo(s) · {s} suíte(s) nova(s)', { c: itens.length, s: novas.size })),
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Publicar', async () => { DS.fecharModal(); await publicar(itens.filter((l) => marcados.has(l.chave))); }, { id: 'pub-confirmar', primaria: true }))], { tamanho: 'md' });
  }

  async function telaEditor(e, mem, corpo) {
    const vq = vinc(e, 'qase'); const perm = vq ? await escritaDoProjeto(e) : {};
    const [rep, cat, aut] = await Promise.all([api.repositorioLocal(e.id), api.testesCatalogo(e.id), api.espacoAutomacoes(e.id)]);
    const dados = rep.ok ? rep.data : { casos: [], suites: [] };
    let qase = null; let suitesDoEditor = dados.suites;
    if (mem.editor.direto) { const qs = await F.carregarQase(e, mem, 'suites'); suitesDoEditor = (qs.itens || []).map((x) => ({ id: String(x.id), titulo: x.title || '—' })); qase = { novo: true }; }
    if (mem.editor.qaseId) {
      const r = await api.servicoConsultar(e.id, 'qase', 'caso', {}, String(mem.editor.qaseId)); if (!r.ok) { corpo.append(DS.estadoTela('erro', 'Não foi possível abrir o caso', r.error)); return; }
      const c = r.data.dados; const t = F.tipoCaso(c); const exec = t === 'planejado' ? 'a-automatizar' : t === 'automatizado' ? 'automatizado' : 'manual';
      const original = { titulo: c.title || '', descricao: c.description || '', preCondicoes: c.preconditions || '', posCondicoes: c.postconditions || '', automacao: exec, tags: (c.tags || []).map((x) => x.title || x),
        passos: passosDoQase(c.steps),
        ...(c.severity ? { severidade: c.severity } : {}), ...(c.priority ? { prioridade: c.priority } : {}), ...(c.status !== undefined && c.status !== null ? { status: c.status } : {}), ...(c.type ? { tipo: c.type } : {}), ...(c.behavior ? { comportamento: c.behavior } : {}), ...(c.layer ? { camada: c.layer } : {}), ...(c.is_flaky ? { instavel: true } : {}) };
      qase = { id: mem.editor.qaseId, original };
    }
    const existente = qase?.novo ? null : qase ? { id: null, titulo: qase.original.titulo, dados: qase.original } : mem.editor.id ? dados.casos.find((c) => c.id === mem.editor.id) : null;
    const publicadoNoQase = existente && relacoesDe(e, ['caso-local'], existente.id).some((x) => outroLado(x, ['caso-local'], existente.id).tipo === 'qase');
    const sair = () => { delete mem.editor; void mostrar('testes'); };
    corpo.append(await editorDoCenario(e, existente && { ...existente, publicado: publicadoNoQase }, { ticketInicial: mem.editor.ticket?.chave || null, tituloInicial: mem.editor.ticket?.titulo || '', descricaoInicial: mem.editor.ticket?.descricao || '', suiteInicial: mem.editor.suiteId ?? null, suites: suitesDoEditor, aut: (aut.ok && aut.data.capacidades) || [], cat: (cat.ok && cat.data?.catalogo?.features) || [], perm, aoSair: sair,
      publicar: (itens) => publicarNoQase(e, itens, { aoConcluir: () => {} }), qase }));
  }

  // ======================= Visão geral =======================
  /** Inclui a suíte escolhida e seus descendentes, sem repetir ciclos nos dados recebidos. */
  function suitesDescendentes(suites, chave) {
    const chaves = new Set([chave]); const pendentes = [chave];
    while (pendentes.length) { const pai = pendentes.pop(); for (const suite of suites) if (suite.pai === pai && !chaves.has(suite.key)) { chaves.add(suite.key); pendentes.push(suite.key); } }
    return chaves;
  }
  function suitesEquivalentes(locais, qase) {
    const equivalentes = new Map(); const porChave = new Map(locais.map((suite) => [suite.key, suite])); const resolvendo = new Set();
    const mesmoNome = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    function resolver(local) {
      if (equivalentes.has(local.key)) return equivalentes.get(local.key);
      if (resolvendo.has(local.key)) return null;
      resolvendo.add(local.key);
      const paiLocal = local.pai ? porChave.get(local.pai) : null;
      const paiQase = paiLocal ? resolver(paiLocal) : null;
      resolvendo.delete(local.key);
      if (local.pai && !paiQase) return null;
      const irmas = locais.filter((suite) => suite.pai === local.pai && mesmoNome(suite.titulo, local.titulo));
      const candidatas = qase.filter((suite) => suite.pai === paiQase && mesmoNome(suite.titulo, local.titulo));
      if (irmas.length !== 1 || candidatas.length !== 1) return null;
      equivalentes.set(local.key, candidatas[0].key); return candidatas[0].key;
    }
    locais.forEach(resolver); return equivalentes;
  }
  async function visaoGeral(e, mem, corpo) {
    const area = h('div', { id: 'cat-carregando' }, DS.esqueleto(6)); corpo.append(area);
    const src = await fontes(e); const vq = src.vq;
    // Pedido de publicar o que acabou de ser importado: consumido já aqui, para não sobrar na memória se esta visita terminar em erro ou tela vazia.
    const importados = mem.publicarImportados; delete mem.publicarImportados;
    if (src.cat?.erro) { area.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o repositório', src.cat.erro)); return; }
    if (src.cat?.semPasta && !vq && !src.locais?.casos?.length && !src.locais?.suites?.length) {
      const titulo = e.manualAtivo !== false ? 'Nenhum cenário ainda' : mem.totalCasosLocais ? 'Catálogo de automação não vinculado' : 'Nenhum código de teste vinculado';
      const descricao = e.manualAtivo !== false && !src.locais?.casos?.length ? 'Use Criar › Novo cenário para escrever o primeiro. Para analisar automações do código, vincule uma pasta em Projetos.' : mem.totalCasosLocais
        ? 'Seus casos e suítes locais continuam disponíveis acima. Vincule uma pasta em Projetos apenas se quiser analisar automações do código.'
        : e.manualAtivo === false ? 'O módulo Manual/Prumo está desligado e não há Qase conectado: ligue o Manual ou conecte o Qase em Projetos para criar cenários.' : 'Você já pode criar casos e suítes locais sem Qase ou GitHub. Para analisar automações, vincule uma pasta de código em Projetos.';
      area.replaceChildren(DS.estadoTela('vazio', titulo, descricao, [
        DS.acao('Vincular pasta…', async () => { const x = await chamar(() => api.espacoPasta(e.id)); if (x && !x.canceled) { delete mem.catalogo; void mostrar('testes'); } }, { id: 'cat-vincular', primaria: true }),
        DS.acao('Abrir Projetos', () => void mostrar('projetos'))
      ], { id: 'cat-sem-pasta' }));
      return;
    }
    const m = modelo(e, src); const c = src.cat?.catalogo;
    const f = (mem.fVisao ||= { q: '', agrupar: '', suite: '', sel: '' }); f.filtros ||= {}; f.abertas ||= {};
    const todasTags = [...m.linhas.reduce((acc, l) => { for (const t of l.tags) acc.set(t, (acc.get(t) || 0) + 1); return acc; }, new Map()).entries()].sort((a, b) => b[1] - a[1]);
    const busca = DS.busca({ id: 'cat-busca', placeholder: 'Buscar caso ou teste', rotulo: 'Buscar caso, teste ou arquivo', valor: f.q });
    const lista = h('div', { id: 'cat-lista' });
    const autoQaseSemCodigo = m.linhas.filter((l) => l.caso && !l.impl.length && l.execucao === 'automatizado').length;
    const esc = vq ? !!(await escritaDoProjeto(e)).qase : false;
    const exportarCasos = iconBtn('baixar', 'Exportar casos do Prumo em arquivo JSON', async () => {
      try {
        const dados = { version: 1, casos: (src.locais?.casos || []).filter((caso) => !caso.legado), suites: src.locais?.suites || [] };
        const r = await chamar(() => api.exportarTela('repositorio-json', JSON.stringify(dados, null, 2)));
        if (r?.exported) avisar('Casos do repositório exportados.');
      } catch (erro) { avisar(textoErro(erro?.message || erro), true); }
    }, { id: 'repo-exportar-casos' });
    const manualDesligado = e.manualAtivo === false;
    // Importar lê um arquivo JSON e escolhe o destino: só no Prumo, ou no Prumo e depois publicar no Qase (a publicação segue o diálogo de sempre, com confirmação).
    function abrirImportar() {
      const manual = !manualDesligado; const podeQase = manual && !!vq && esc;
      const motivoQase = !vq ? 'Conecte o Qase em Projetos para publicar.' : !esc ? 'Habilite a escrita no Qase em Projetos para publicar.' : 'Ligue Manual/Prumo para importar.';
      const opcoes = [['prumo', 'Só no Prumo', 'Fica neste computador', manual, 'Ligue Manual/Prumo para importar.'], ['qase', 'No Prumo e publicar no Qase', 'Importa e abre a publicação, com confirmação', podeQase, motivoQase]];
      let destino = (opcoes.find((o) => o[3]) || [])[0] || null; const saida = h('div', { id: 'imp-saida', 'aria-live': 'polite' });
      const escolhas = h('div', { class: 'ds-escolhas', role: 'radiogroup', 'aria-label': tr('Destino da importação') }, opcoes.map(([v, nome, dica, ok, motivo]) => {
        const radio = h('input', { type: 'radio', name: 'imp-destino', id: 'imp-destino-' + v, value: v, checked: v === destino, disabled: !ok }); radio.addEventListener('change', () => { if (radio.checked) destino = v; });
        return h('div', { class: 'ds-escolha', 'data-indisponivel': ok ? null : '' }, h('label', { for: radio.id }, radio, h('span', { class: 'ds-escolha-nome' }, tr(nome)), ok ? h('span', { class: 'ds-sub' }, tr(dica)) : h('span', { class: 'ds-nota-perm' }, DS.icone('cadeado'), h('span', {}, tr(motivo)))));
      }));
      const ligarManual = manual ? null : DS.acao('Ligar Manual/Prumo', async () => { const r = await chamar(() => api.espacoManual(e.id, true)); if (r) { await atualizarEspaco(e); DS.fecharModal(); void mostrar('testes'); } }, { id: 'imp-ligar-manual', compacto: true, classe: 'imp-ligar' });
      const escolherArquivo = DS.acao('Escolher arquivo…', async () => {
        if (!destino) return; const antesR = await api.repositorioLocal(e.id); const antes = new Set(antesR.ok ? antesR.data.casos.map((c) => c.id) : []);
        try {
          const r = await chamar(() => api.repositorioImportar(e.id)); if (!r || r.canceled) return;
          if (r.casos || r.suites) {
            avisar(tr('{c} caso(s) e {s} suíte(s) importado(s) para o Prumo.', { c: r.casos || 0, s: r.suites || 0 }));
            if (destino === 'qase') { const novo = await api.repositorioLocal(e.id); mem.publicarImportados = new Set(novo.ok ? novo.data.casos.filter((c) => !antes.has(c.id)).map((c) => c.id) : []); }
            delete mem.catalogo; DS.fecharModal(); void mostrar('testes');
          } else saida.replaceChildren(DS.alerta(tr('O arquivo não trouxe casos nem suítes.'), 'aviso'));
        } catch (erro) { saida.replaceChildren(DS.alerta(textoErro(erro?.message || erro), 'falha')); }
      }, { id: 'imp-escolher', primaria: true, desabilitado: !destino });
      DS.modal('Importar casos', [h('p', { class: 'suave' }, tr('Escolha o arquivo JSON do repositório do Prumo. Os casos entram como cópias e não substituem os que já existem.')), escolhas, ligarManual, saida, DS.rodape(DS.acao('Cancelar', () => DS.fecharModal(), { id: 'imp-cancelar' }), escolherArquivo)], { tamanho: 'md' });
      if (destino) document.getElementById('imp-destino-' + destino)?.focus();
    }
    const importarCasos = iconBtn('subir', 'Importar casos de um arquivo JSON', () => abrirImportar(), { id: 'repo-importar-casos' });
    const suitesDoQase = vq ? (mem.suites = mem.suites || await F.carregarQase(e, mem, 'suites')).itens.map((x) => ({ key: 'q:' + x.id, titulo: x.title || '—', descricao: x.description || '', pai: x.parent_id != null ? 'q:' + x.parent_id : null })) : [];
    const suitesDoPrumo = (src.locais?.suites || []).map((x) => ({ key: 'l:' + x.id, titulo: x.titulo, pai: x.paiId ? 'l:' + x.paiId : null }));
    const equivalente = suitesEquivalentes(suitesDoPrumo, suitesDoQase);
    const suitesBrutas = [...suitesDoQase, ...suitesDoPrumo.filter((x) => !equivalente.has(x.key))];
    const suiteDe = (l) => (l.caso ? 'q:' + (l.caso.suite_id ?? '') : l.local ? (equivalente.get('l:' + (l.local.suiteLocalId ?? '')) || 'l:' + (l.local.suiteLocalId ?? '')) : 'f:' + (l.impl[0]?.arquivo || ''));
    const arvore = h('nav', { class: 'rep-arvore', id: 'repo-suites', 'aria-label': tr('Suítes') });
    const menuRaizNaBarra = h('span', { class: 'rep-menu-raiz' });
    const contagem = h('span', { class: 'rep-contagem ds-sub', id: 'cat-contagem', role: 'status', 'aria-live': 'polite' });
    const arquivosSoCodigo = [...m.linhas.filter((l) => !l.caso && !l.local && l.impl[0]).reduce((a, l) => a.set(l.impl[0].arquivo, (a.get(l.impl[0].arquivo) || 0) + 1), new Map()).entries()].sort((a, b) => a[0].localeCompare(b[0]));
    function desenharArvore() {
      const filhos = (k) => suitesBrutas.filter((x) => x.pai === k);
      const total = (k) => { const chaves = suitesDescendentes(suitesBrutas, k); return m.linhas.filter((l) => chaves.has(suiteDe(l))).length; };
      const botaoSuite = (k, titulo, n, nivel, icone = 'pasta') => h('button', { type: 'button', class: 'rep-suite', 'data-suite-chave': k, 'aria-current': String((f.suite || '') === k), onclick: () => { f.suite = f.suite === k ? '' : k; desenharArvore(); desenhar(); [...arvore.querySelectorAll('[data-suite-chave]')].find((no) => no.dataset.suiteChave === k)?.focus({ preventScroll: true }); } }, DS.icone(icone === 'codigo' ? 'codigo' : 'pasta'), h('span', { title: titulo }, titulo), h('em', {}, String(n)));
      const botaoComNivel = (...a) => { const b = botaoSuite(...a); b.style.setProperty('--nivel', String(a[3])); return b; };
      // Cada suíte tem um menu ⋯: criar cenário ou suíte, editar e remover. Suíte do Qase só aceita "Novo cenário aqui": o Prumo não edita nem remove suíte do Qase.
      const suitesLocais = src.locais?.suites || []; const manualLigado = e.manualAtivo !== false;
      const novoCenarioEm = (chave) => { const loc = chave.startsWith('l:') ? chave.slice(2) : null; const qid = chave.startsWith('q:') ? chave.slice(2) : null; mem.editor = manualLigado ? { suiteId: loc } : qid ? { direto: true, suiteId: qid } : { direto: true }; void mostrar('testes'); };
      const podeCriarSuiteLocal = manualLigado;
      const comMenu = (chave, botao) => {
        const ehLocal = chave.startsWith('l:'); const local = ehLocal ? suitesLocais.find((x) => x.id === chave.slice(2)) : null; const raiz0 = chave === '';
        const podeNovoCenario = manualLigado || (vq && esc && !raiz0 && chave.startsWith('q:')) || (vq && esc && raiz0);
        const itens = [
          podeNovoCenario ? ['Novo cenário aqui', () => novoCenarioEm(chave)] : null,
          (raiz0 || ehLocal) && podeCriarSuiteLocal ? [raiz0 ? 'Nova suíte' : 'Nova suíte dentro', () => F.formularioSuiteLocal(e, suitesLocais, null, local?.id || null)] : null,
          raiz0 && !manualLigado && vq && esc ? ['Nova suíte no Qase', () => F.novaSuite(e, esc)] : null,
          local ? ['Editar suíte', () => F.formularioSuiteLocal(e, suitesLocais, local)] : null,
          chave.startsWith('q:') ? ['Editar suíte', () => F.editarSuiteQase(e, { id: chave.slice(2), titulo: suitesBrutas.find((x) => x.key === chave)?.titulo || '', descricao: suitesBrutas.find((x) => x.key === chave)?.descricao || '' }), { desabilitado: !esc, motivo: 'Habilite a escrita no Qase em Projetos.' }] : null,
          chave.startsWith('q:') ? ['Apagar suíte', () => F.apagarSuiteQase(e, { id: chave.slice(2) }), { desabilitado: !esc || total(chave) > 0 || filhos(chave).length > 0, motivo: !esc ? 'Habilite a escrita no Qase em Projetos.' : 'Só dá para apagar uma suíte vazia, sem casos nem suítes dentro.' }] : null,
          local ? ['Remover suíte', async () => { const r = await chamar(() => api.suiteLocalSalvar({ espacoId: e.id, id: local.id, remover: true })); if (!r || r.canceled) return; avisar(r.casosMovidos ? tr('Suíte removida do Prumo. {n} cenário(s) subiram para a suíte pai.', { n: r.casosMovidos }) : tr('Suíte removida do Prumo.')); if (f.suite === chave) f.suite = ''; await atualizarEspaco(e); void mostrar('testes'); }] : null
        ];
        const menu = menuTres(raiz0 ? 'Ações do repositório' : 'Ações da suíte', itens);
        const casos = raiz0 ? [] : chave === 'sem-suite' ? m.linhas.filter((l) => (l.caso || l.local) && !suitesBrutas.some((x) => x.key === suiteDe(l))) : m.linhas.filter((l) => suiteDe(l) === chave);
        const aberta = !!f.abertas[chave] && !raiz0; const nivel = botao.style.getPropertyValue('--nivel') || '0';
        const caret = !raiz0 ? h('button', { type: 'button', class: 'rep-caret', 'aria-expanded': String(aberta), 'aria-label': tr(aberta ? 'Recolher {t}' : 'Expandir {t}', { t: botao.querySelector('span')?.textContent || '' }), title: tr(aberta ? 'Recolher' : 'Mostrar os casos'),
          onclick: () => { f.abertas[chave] = !aberta; desenharArvore(); [...arvore.querySelectorAll('.rep-caret')].find((c) => c.closest('.rep-suite-bloco')?.dataset.chave === chave)?.focus({ preventScroll: true }); } }, aberta ? '▾' : '▸') : null;
        // Clicar no nome filtra a lista e também abre a suíte.
        botao.addEventListener('click', () => { if (casos.length) f.abertas[chave] = true; }, true);
        const lista = aberta ? h('div', { class: 'rep-suite-casos', role: 'group', 'aria-label': tr('Casos de {t}', { t: botao.querySelector('span')?.textContent || '' }) },
          ...casos.slice(0, 100).map((l) => h('button', { type: 'button', class: 'rep-suite-caso', 'data-teste': l.chave, 'aria-current': String(f.sel === l.chave), title: l.titulo, onclick: () => abrirLinha(l) },
            h('code', {}, l.caso ? '#' + l.caso.id : l.local?.numero ? 'P-' + l.local.numero : '·'), h('span', {}, l.titulo))),
          casos.length ? null : h('p', { class: 'ds-sub rep-suite-mais' }, tr('Nenhum caso nesta suíte.')),
          casos.length > 100 ? h('p', { class: 'ds-sub rep-suite-mais' }, tr('e mais {n}: use a busca.', { n: casos.length - 100 })) : null) : null;
        botao.style.setProperty('--nivel', nivel);
        const bloco = h('div', { class: 'rep-suite-bloco', 'data-chave': chave }, h('div', { class: 'rep-suite-linha' }, caret, botao, menu), lista); bloco.style.setProperty('--nivel', nivel);
        return bloco;
      };
      const ramo = (k, nivel, vistos = new Set([k])) => filhos(k).filter((x) => !vistos.has(x.key)).map((x) => [comMenu(x.key, botaoComNivel(x.key, x.titulo, total(x.key), nivel)), ...ramo(x.key, nivel + 1, new Set([...vistos, x.key]))]).flat();
      const raizes = suitesBrutas.filter((x) => !x.pai || !suitesBrutas.some((y) => y.key === x.pai));
      const semSuite = m.linhas.filter((l) => (l.caso || l.local) && !suitesBrutas.some((x) => x.key === suiteDe(l))).length;
      arvore.replaceChildren(h('div', { class: 'rep-arvore-topo', 'data-chave': '' }, h('span', { class: 'rep-arvore-titulo' }, h('strong', {}, tr('Suítes')),
        src.casos?.limitacao ? DS.info(src.casos.limitacao, { id: 'cat-limitacao', rotulo: 'Sobre a limitação dos casos do Qase' }) : null),
        h('span', { class: 'rep-arvore-tudo' },
          h('button', { type: 'button', class: 'rep-ib rep-ib-mini', id: 'rep-expandir-tudo', title: tr('Expandir todas as suítes'), 'aria-label': tr('Expandir todas as suítes'), onclick: () => { for (const x of suitesBrutas) f.abertas[x.key] = true; f.abertas['sem-suite'] = true; for (const [arq] of arquivosSoCodigo) f.abertas['f:' + arq] = true; desenharArvore(); } }, '⊞'),
          h('button', { type: 'button', class: 'rep-ib rep-ib-mini', id: 'rep-recolher-tudo', title: tr('Recolher todas as suítes'), 'aria-label': tr('Recolher todas as suítes'), onclick: () => { f.abertas = {}; desenharArvore(); } }, '⊟'))
        ),
        // Sem nenhuma suíte nem automação no código a coluna da árvore some e a lista usa a largura toda: os casos ficam soltos e o menu ⋯ (nova suíte/cenário) vai para a barra de busca.

        ...raizes.map((x) => [comMenu(x.key, botaoComNivel(x.key, x.titulo, total(x.key), 0)), ...ramo(x.key, 1)]).flat(),
        arquivosSoCodigo.length ? h('p', { class: 'rep-arvore-rotulo' }, tr('Automação no código')) : null,
        ...arquivosSoCodigo.map(([arq, n]) => comMenu('f:' + arq, botaoComNivel('f:' + arq, arq.split('/').at(-1), n, 0, 'codigo'))),
        semSuite && suitesBrutas.length ? comMenu('sem-suite', botaoComNivel('sem-suite', tr('Sem suíte'), semSuite, 0)) : null);
      const semArvore = !suitesBrutas.length && !arquivosSoCodigo.length; const menuRaiz = comMenu('', botaoComNivel('', '', 0, 0)).querySelector('.rep-suite-linha > :last-child');
      arvore.hidden = semArvore; area.querySelector('#rep-layout')?.toggleAttribute('data-sem-arvore', semArvore);
      menuRaizNaBarra.replaceChildren(menuRaiz);
    }
    const CAMPOS = [
      ['origem', 'Origem', [['qase', 'Do Qase'], ['local', 'Escritos no Prumo'], ...(vq ? [['pendente', 'Pendentes de publicar']] : []), ['codigo', 'Só no código'], ['jira', 'Com Jira'], ['auto', 'Com automação']],
        (l, v) => ({ qase: l.origem === 'qase', local: l.origem === 'local', pendente: !!l.pendente, codigo: l.origem === 'codigo', jira: l.jira.length > 0, auto: l.impl.length > 0 || l.execucao === 'automatizado' })[v]],
      ['status', 'Status', QASE_STATUS.map(([k, t]) => [String(k), t]), (l, v) => l.props.status !== undefined && String(l.props.status) === v],
      ['severidade', 'Severidade', QASE_SEVERIDADE.map(([k, t]) => [String(k), t]), (l, v) => String(l.props.severidade) === v],
      ['prioridade', 'Prioridade', QASE_PRIORIDADE.map(([k, t]) => [String(k), t]), (l, v) => String(l.props.prioridade) === v],
      ['tipo', 'Tipo', QASE_TIPO.map(([k, t]) => [String(k), t]), (l, v) => String(l.props.tipo) === v],
      ['camada', 'Camada', QASE_CAMADA.map(([k, t]) => [String(k), t]), (l, v) => String(l.props.camada) === v],
      ['comportamento', 'Comportamento', QASE_COMPORTAMENTO.map(([k, t]) => [String(k), t]), (l, v) => String(l.props.comportamento) === v],
      ['execucao', 'Automação', [['manual', 'Manual'], ['planejado', 'A automatizar'], ['automatizado', 'Automatizado']], (l, v) => l.execucao === v],
      ['nivel', 'Nível do teste', Object.entries(nomesNivel).filter(([k]) => m.linhas.some((l) => l.niveis.includes(k))), (l, v) => l.niveis.includes(v)],
      ['tag', 'Tags', todasTags.slice(0, 40).map(([t]) => [t, '@' + t]), (l, v) => l.tags.includes(v)]];
    const ativos = () => CAMPOS.flatMap(([k, rot, ops]) => (f.filtros[k] || []).map((v) => [k, rot, v, (ops.find(([x]) => x === v) || [])[1] || v]));
    const popFiltros = h('div', { class: 'rep-pop', id: 'cat-filtros-pop', hidden: true, 'aria-label': tr('Filtros') });
    const ativosNo = h('div', { class: 'rep-ativos', id: 'cat-ativos' });
    const botaoFiltros = h('button', { type: 'button', class: 'rep-filtros-btn', id: 'cat-filtros', 'aria-controls': 'cat-filtros-pop', 'aria-expanded': 'false' }, DS.icone('filtro'), tr('Filtros'), h('span', { class: 'rep-n' }));
    const avisoLigacao = DS.info('A ligação caso ↔ código vem de anotação no código (qase(31), qase.id(31), @qase(31) ou "Qase: SFQ-31") ou de vínculo declarado; nomes parecidos não ligam nada. Nível e tags vêm da leitura estática; nada foi executado.', { id: 'cat-aviso', rotulo: 'Sobre a ligação entre caso e código' });
    const desenharFiltros = () => {
      const a = ativos(); botaoFiltros.querySelector('.rep-n').textContent = a.length ? String(a.length) : '';
      ativosNo.replaceChildren(...a.map(([k, rot, v, txt]) => h('button', { type: 'button', class: 'rep-ativo', title: tr('Remover filtro'), onclick: () => { f.filtros[k] = f.filtros[k].filter((x) => x !== v); desenharFiltros(); desenhar(); } }, h('b', {}, tr(rot) + ':'), ' ' + tr(txt), ' ×')),
        a.length ? h('button', { type: 'button', class: 'rep-limpar', onclick: () => { f.filtros = {}; desenharFiltros(); desenhar(); } }, tr('Limpar')) : null);
      const disponiveis = (k, ops, teste) => ops.filter(([v]) => (f.filtros[k] || []).includes(v) || m.linhas.some((l) => teste(l, v)));
      popFiltros.replaceChildren(h('div', { class: 'rep-pop-cab' }, h('strong', {}, tr('Filtros avançados')), avisoLigacao), h('div', { class: 'rep-pop-grade' }, ...CAMPOS.map(([k, rot, ops0, teste]) => [k, rot, disponiveis(k, ops0, teste)]).filter(([, , ops]) => ops.length).map(([k, rot, ops]) => h('label', { class: 'rep-pop-sel', ...(k === 'origem' ? { id: 'cat-origem' } : {}) }, h('span', {}, tr(rot)),
        h('select', { 'data-filtro': k, 'aria-label': tr(rot), onchange: (ev) => { f.filtros[k] = ev.target.value ? [ev.target.value] : []; desenharFiltros(); desenhar(); popFiltros.querySelector(`[data-filtro="${k}"]`)?.focus({ preventScroll: true }); } },
          h('option', { value: '' }, tr('Todos')), ops.map(([v, t]) => h('option', { value: v, selected: (f.filtros[k] || [])[0] === v }, tr(t))))))));
    };
    botaoFiltros.addEventListener('click', (ev) => { ev.stopPropagation(); popFiltros.hidden = !popFiltros.hidden; botaoFiltros.setAttribute('aria-expanded', String(!popFiltros.hidden)); if (!popFiltros.hidden) popFiltros.querySelector('select')?.focus(); });
    const fecharFiltros = (ev) => { if (ev.key === 'Escape' && !popFiltros.hidden) { ev.stopPropagation(); popFiltros.hidden = true; botaoFiltros.setAttribute('aria-expanded', 'false'); botaoFiltros.focus(); } };
    botaoFiltros.addEventListener('keydown', fecharFiltros);
    aoPressionarTecla('filtros', (ev) => { if (ev.key === 'Escape' && !popFiltros.hidden) { popFiltros.hidden = true; botaoFiltros.setAttribute('aria-expanded', 'false'); botaoFiltros.focus(); } });
    popFiltros.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); popFiltros.hidden = true; botaoFiltros.setAttribute('aria-expanded', 'false'); botaoFiltros.focus(); } });
    aoClicarFora('filtros', (ev) => { if (!popFiltros.hidden && !popFiltros.contains(ev.target) && ev.target !== botaoFiltros) { popFiltros.hidden = true; botaoFiltros.setAttribute('aria-expanded', 'false'); } });
    desenharFiltros();
    const pendentes = m.linhas.filter((l) => l.pendente);
    const suitesQase = () => (mem.suites?.itens || []);
    const abrirPublicar = (itens) => (itens.length ? dialogoPublicar(e, itens, src.locais?.suites || [], suitesQase(), (sel) => publicarNoQase(e, sel, { aoConcluir: () => void mostrar('testes') })) : avisar(tr('Nada pendente para publicar.')));
    // Importação com destino Qase: logo depois de importar, abre a publicação só dos casos que acabaram de entrar.
    if (importados) { const sel = pendentes.filter((l) => l.local && importados.has(l.local.id)); if (sel.length && esc) queueMicrotask(() => abrirPublicar(sel)); else avisar(tr(!esc ? 'Importado só no Prumo: a escrita no Qase está desligada.' : 'Importado só no Prumo: nenhum caso novo ficou pendente de publicar.'), true); }
    const editar = (l) => { if (l.local) { mem.editor = { id: l.local.id }; void mostrar('testes'); } else if (l.caso) { mem.editor = { qaseId: l.caso.id }; void mostrar('testes'); } };
    /** Cenário do Prumo: remove do computador (confirmação nativa). Caso do Qase: marca como obsoleto, que o Qase deixa desfazer. */
    let removendo = false;
    const remover = async (l) => {
      if (removendo) return; removendo = true; try { await removerCaso(l); } finally { removendo = false; }
    };
    const removerCaso = async (l) => {
      if (l.local?.legado) { const r = await api.propostaDescartar(l.local.id); if (!r.ok) { avisar(textoErro(r.error), true); return; } avisar(tr('Cenário removido do Prumo.')); await atualizarEspaco(e); }
      else if (l.local) { const r = await api.casoLocalSalvar({ espacoId: e.id, id: l.local.id, remover: true }); if (!r.ok) { avisar(textoErro(r.error), true); return; } if (r.data?.canceled) return; avisar(tr('Cenário removido do Prumo.')); await atualizarEspaco(e); }
      else if (l.caso) { const r = await executarOperacao(e, 'qase.editar_caso', { casoId: Number(l.caso.id), status: 2 }); if (!r || r.estado !== 'CONFIRMADA') return; delete mem.casos; avisar(tr('Caso marcado como obsoleto no Qase.')); }
      f.sel = ''; void mostrar('testes');
    };
    const botaoPublicar = pendentes.length ? h('button', { type: 'button', class: 'rep-pub', id: 'rep-publicar', disabled: !esc, title: esc ? tr('Publicar no Qase os cenários que só existem no Prumo') : tr('Habilite a escrita no Qase em Projetos para publicar.'), onclick: () => abrirPublicar(pendentes) }, DS.icone('subir'), tr('Publicar {n}', { n: pendentes.length })) : null;
    const painelSlot = h('div', { class: 'rep-painel', id: 'rep-painel' });
    painelSlot.tabIndex = -1; painelSlot.setAttribute('aria-label', tr('Caso'));
    const layout = () => area.querySelector('#rep-layout');
    let consultaDoPainel = 0;
    const fecharPainel = () => { const chave = f.sel; consultaDoPainel++; f.sel = ''; painelSlot.replaceChildren(); layout()?.removeAttribute('data-painel'); for (const r of area.querySelectorAll('.rep-linha[aria-current]')) r.removeAttribute('aria-current'); ([...area.querySelectorAll('.rep-linha')].find((no) => no.dataset.teste === chave) || busca.input).focus({ preventScroll: true }); };
    async function selecionar(l) {
      const consulta = ++consultaDoPainel;
      f.sel = l.chave; layout()?.setAttribute('data-painel', 'aberto');
      for (const r of area.querySelectorAll('.rep-linha, .rep-suite-caso')) { if (r.dataset.teste === l.chave) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current'); }
      painelSlot.replaceChildren(DS.carregando('Carregando o cenário…'));
      painelSlot.focus({ preventScroll: true });
      const no = await painelDoCaso(e, l, { aoFechar: fecharPainel, situacao, selo, publicar: abrirPublicar, editar, remover, escrita: esc, aoMudar: () => void mostrar('testes') });
      if (consulta === consultaDoPainel && area.isConnected && f.sel === l.chave) painelSlot.replaceChildren(no);
    }
    area.replaceChildren(...[
      h('div', { class: 'rep-layout', id: 'rep-layout' }, arvore, h('div', { class: 'rep-principal' }, h('div', { class: 'rep-barra' }, busca.no, importarCasos, exportarCasos, botaoPublicar, menuRaizNaBarra), ativosNo, contagem, lista), painelSlot),
      src.casos?.proxima != null ? DS.barra(DS.acao('Carregar mais casos do Qase', async () => {
        const offset = src.casos.proxima;
        const proxima = await F.carregarQase(e, mem, 'casos', { offset, limite: 100 });
        if (proxima.erro) return; // Não mascarar falha com dados locais nem perder o que já foi consultado.
        if (proxima.proxima != null && proxima.proxima <= offset) { avisar(tr('O Qase devolveu uma página sem avanço. Atualize a consulta.'), true); return; }
        const unicos = new Map([...src.casos.itens, ...proxima.itens].map(c => [String(c.id), c]));
        mem.casos = { itens: [...unicos.values()], proxima: proxima.proxima, em: proxima.em };
        void mostrar('testes');
      }, { id: 'cat-carregar-mais', icone: 'mais' })) : null,
      c?.truncado ? DS.alerta('Leitura limitada: o repositório tem mais arquivos de teste do que o Prumo lê de uma vez.', 'aviso') : null,
      src.erroRuns ? DS.alerta(tr('Resultados locais indisponíveis. Atualize a consulta para tentar novamente.'), 'falha') : null,
      // Sem nenhum caso, o estado vazio já diz o erro do Qase: não repete a mesma falha numa faixa.
      src.casos?.erro && m.linhas.length ? DS.alerta(tr('Casos do Qase indisponíveis: {e}', { e: textoErro(src.casos.erro) }), 'falha') : null].filter(Boolean));
    const medirArea = () => { const no = layout(); if (!area.isConnected || !no) { tamanho.disconnect(); return; } no.style.setProperty('--rep-altura', Math.max(0, window.innerHeight - no.getBoundingClientRect().top - 20) + 'px'); };
    const tamanho = new ResizeObserver(medirArea); tamanho.observe(area); tamanho.observe(document.documentElement); medirArea();
    area.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && f.sel && popFiltros.hidden) { ev.preventDefault(); fecharPainel(); } });
    const norm = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[@\-]/g, '');
    function passa(l) {
      const q = norm(f.q);
      if (q && !norm(l.titulo + ' ' + l.ids.join(' ') + ' ' + (l.caso ? l.caso.id + ' ' + (vq?.recurso.chave || '') + '-' + l.caso.id : '') + ' ' + l.impl.map((t) => t.arquivo + ' ' + t.titulo).join(' ') + ' ' + l.tags.join(' ')).includes(q)) return false;
      if (f.suite === 'sem-suite') { if (!(l.caso || l.local) || suitesBrutas.some((s) => s.key === suiteDe(l))) return false; }
      else if (f.suite && !suitesDescendentes(suitesBrutas, f.suite).has(suiteDe(l))) return false;
      for (const [k, , ops, teste] of CAMPOS) { const sel = f.filtros[k] || []; if (sel.length && !sel.some((v) => teste(l, v))) return false; }
      return true;
    }
    const iconeTipo = { qase: 'Q', local: 'P', codigo: '</>' };
    const abrirLinha = (l) => void selecionar(l);
    const linhaTabela = (l) => {
      const s = situacao(l); const dados = l.local?.dados; const bdd = (dados?.passos || []).some((p) => p.formato === 'bdd');
      const id = l.ids.join(' · ') || null;
      const sev = dados?.severidade != null ? rotuloQase(QASE_SEVERIDADE, dados.severidade) : null;
      const abrir = (ev) => { if (ev.type === 'click' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrirLinha(l); } };
      const detalhes = [id, tr(s.t), dados?.passos?.length ? tr('{n} passo(s)', { n: dados.passos.length }) : null, sev, ...l.tags.slice(0, 2).map((t) => '@' + t)].filter(Boolean).join(' · ');
      const origemTxt = { qase: 'Qase', local: tr('Prumo'), codigo: tr('Código') }[l.origem];
      return h('div', { class: 'rep-linha', role: 'button', tabindex: 0, 'data-tom': s.tom || '', 'data-teste': l.chave, ...(l.caso ? { 'data-caso': String(l.caso.id) } : {}), ...(l.local ? { 'data-caso-local': l.local.id } : {}), 'aria-label': tr('Abrir {t}. {o}{p}', { t: l.titulo, o: { qase: tr('Do Qase'), local: tr('Escrito no Prumo'), codigo: tr('Só no código') }[l.origem], p: l.pendente ? '. ' + tr('Ainda não está no Qase') : '' }), 'aria-current': f.sel === l.chave ? 'true' : null, onclick: abrir, onkeydown: abrir },
        h('span', { class: 'rep-tipo', 'data-origem': l.origem, title: { qase: tr('Do Qase'), local: tr('Escrito no Prumo'), codigo: tr('Só no código') }[l.origem] }, iconeTipo[l.origem]),
        h('div', { class: 'rep-titulo' }, h('strong', {}, h('span', { class: 'rep-t', title: l.titulo }, l.titulo), bdd ? h('span', { class: 'rep-bdd' }, 'BDD') : null), h('span', { class: 'ds-sub', title: detalhes }, detalhes)),
        h('span', { class: 'rep-marcas' }, l.props?.severidade ? h('span', { class: 'rep-sev', 'data-sev': String(l.props.severidade), title: tr('Severidade') + ': ' + rotuloQase(QASE_SEVERIDADE, l.props.severidade) }) : null, l.pendente ? h('span', { class: 'rep-pend', title: tr('Só no Prumo: ainda não está no Qase') }) : null, l.impl.length ? h('span', { class: 'rep-marca', title: tr('Tem automação no código') }, DS.icone('codigo')) : null, ...l.jira.slice(0, 1).map((k) => h('span', { class: 'rep-marca', 'data-jira': '', title: l.jira.join(', ') }, k)),
          l.res ? selo(l.res.status) : null), menuDoCaso(l));
    };
    const menuDoCaso = (l) => menuTres('Ações do caso', [
      ['Abrir', () => abrirLinha(l)],
      l.local || l.caso ? ['Editar', () => editar(l)] : null,
      l.pendente ? ['Publicar no Qase', () => abrirPublicar([l]), { desabilitado: !esc, motivo: 'Habilite a escrita no Qase em Projetos para publicar.' }] : null,
      l.local ? ['Remover', () => remover(l)] : l.caso ? ['Marcar como obsoleto no Qase', () => remover(l), { desabilitado: !esc, motivo: 'Habilite a escrita no Qase em Projetos.' }] : null]);
    const LOTE = 60;
    const blocoDeLinhas = (ls, id) => { const caixa = h('div', { class: 'rep-lista', ...(id ? { id } : {}) }); let n = 0;
      const mais = () => { caixa.querySelector('.rep-mais')?.remove(); ls.slice(n, n + LOTE).forEach((l) => caixa.append(linhaTabela(l))); n = Math.min(ls.length, n + LOTE);
        if (n < ls.length) caixa.append(h('button', { type: 'button', class: 'rep-mais', onclick: mais }, tr('Mostrar mais ({n})', { n: ls.length - n }))); };
      mais(); return caixa; };
    function desenhar() {
      f.q = busca.input.value.trim();
      // Sem busca, filtro nem suíte escolhida, a lista mostra as suítes e cada uma abre para os seus casos (como no Qase).
      f.agrupar = suitesBrutas.length && !f.suite && !f.q && !ativos().length ? 'suite' : ''; f.gAbertos ||= {};
      const vis = m.linhas.filter(passa);
      // Com um caso aberto a árvore some em janelas médias: o nome da suíte escolhida fica junto da contagem.
      const nomeDaSuite = f.suite === 'sem-suite' ? tr('Sem suíte') : f.suite?.startsWith('f:') ? f.suite.slice(2).split('/').at(-1) : f.suite ? suitesBrutas.find((x) => x.key === f.suite)?.titulo : null;
      contagem.textContent = tr('{a} de {b}', { a: vis.length, b: m.linhas.length }) + (nomeDaSuite ? ' · ' + nomeDaSuite : '');
      if (!m.linhas.length) {
        // Diz o que cada fonte conectada devolveu: com Qase e pasta ligados, falar só da pasta escondia a consulta ao Qase.
        const erroQase = vq && src.casos?.erro; const manual = e.manualAtivo !== false;
        const partes = [vq ? (erroQase ? tr('Qase · {k}: não foi possível consultar ({e}).', { k: vq.recurso.chave, e: textoErro(src.casos.erro) }) : tr('Qase · {k}: nenhum caso retornado.', { k: vq.recurso.chave })) : null,
          c ? tr('Pasta vinculada: nenhum arquivo de teste encontrado.') : null, manual ? tr('Prumo: nenhum caso local ainda.') : tr('Manual/Prumo desligado neste projeto: não dá para escrever nem importar cenários.'), manual || vq ? tr('Use Criar para escrever o primeiro cenário.') : null].filter(Boolean);
        lista.replaceChildren(DS.estadoTela(erroQase ? 'erro' : 'vazio', erroQase ? 'Não foi possível consultar o Qase' : 'Nenhum teste encontrado', partes.join(' '), [manual ? null : DS.acao('Ligar Manual/Prumo', async () => { const r = await chamar(() => api.espacoManual(e.id, true)); if (r) { await atualizarEspaco(e); delete mem.catalogo; void mostrar('testes'); } }, { id: 'cat-ligar-manual', primaria: true, compacto: true }), erroQase ? DS.acao('Tentar novamente', () => { delete mem.casos; void mostrar('testes'); }, { id: 'cat-vazio-atualizar', icone: 'atualizar', compacto: true }) : null])); return;
      }
      if (!vis.length) { lista.replaceChildren(DS.estadoTela('vazio', 'Nenhum teste para este filtro.', null, [DS.acao('Limpar filtros', () => { f.q = ''; busca.input.value = ''; f.suite = ''; f.filtros = {}; desenharArvore(); desenharFiltros(); desenhar(); busca.input.focus(); }, { compacto: true })])); return; }
      const grupos = new Map(); const nomeDaSuiteDe = (l) => { const k = suiteDe(l); return k === '' || k === 'q:' ? tr('Casos sem suíte') : k.startsWith('f:') ? (k.slice(2).split('/').at(-1) || tr('Casos sem suíte')) : (suitesBrutas.find((x) => x.key === k)?.titulo || tr('Casos sem suíte')); };
      const chaveDe = (l) => (f.agrupar === 'suite' ? [nomeDaSuiteDe(l)] : f.agrupar === 'tag' ? (l.tags.length ? l.tags.map((t) => '@' + t) : [tr('Sem tag')]) : f.agrupar === 'feature' ? [l.feature || (l.caso ? tr('Somente no Qase') : tr('Sem feature'))] : f.agrupar === 'nivel' ? (l.niveis.length ? l.niveis.map((n) => tr(nomesNivel[n])) : [tr('Sem código')]) : ['']);
      for (const l of vis) for (const k of chaveDe(l)) { if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(l); }
      const porSuite = f.agrupar === 'suite';
      lista.replaceChildren(...[...grupos.entries()].sort((a, b) => (porSuite ? a[0].localeCompare(b[0]) : b[1].length - a[1].length)).map(([k, ls]) => {
        if (!k) return blocoDeLinhas(ls, 'cat-tabela');
        const d = h('details', { class: 'ds-grupo-testes feature-testes', open: porSuite ? !!f.gAbertos[k] : true, 'data-grupo': k, 'data-feature': k }, h('summary', {}, h('strong', {}, k), h('span', { class: 'ds-n' }, String(ls.length))), porSuite && !f.gAbertos[k] ? null : blocoDeLinhas(ls));
        // Suíte recolhida não monta as linhas: abre sob demanda, como a árvore do Qase.
        if (porSuite) d.addEventListener('toggle', () => { f.gAbertos[k] = d.open; if (d.open && d.children.length < 2) d.append(blocoDeLinhas(ls)); });
        return d;
      }));
    }
    // Arrastar: cenário do Prumo cai numa suíte do Prumo (ou em "Sem suíte"); suíte do Prumo cai dentro de outra ou no título "Suítes" (volta à raiz). Itens do Qase não se movem.
    const suitesLocais = src.locais?.suites || []; let arrastando = null;
    const alvoDe = (no) => no?.closest?.('[data-chave]')?.dataset.chave;
    const destinoValido = (chave) => !!arrastando && (arrastando.tipo === 'caso' ? (chave === 'sem-suite' || chave?.startsWith('l:')) : (chave === '' || chave === 'sem-suite' || (chave?.startsWith('l:') && chave.slice(2) !== arrastando.id)));
    const marcarArrastavel = (ev) => {
      const caso = ev.target.closest?.('.rep-linha[data-caso-local], .rep-suite-caso'); const suite = ev.target.closest?.('.rep-suite-linha');
      const linhaDoCaso = caso && m.linhas.find((l) => l.chave === (caso.dataset.teste)); const chaveSuite = suite && alvoDe(suite);
      if (linhaDoCaso?.local && !linhaDoCaso.caso) caso.draggable = true; else if (chaveSuite?.startsWith('l:') && !suite.closest('.rep-suite-casos')) suite.draggable = true;
    };
    area.addEventListener('pointerdown', marcarArrastavel);
    area.addEventListener('dragstart', (ev) => {
      const caso = ev.target.closest?.('.rep-linha[data-caso-local], .rep-suite-caso'); const suite = ev.target.closest?.('.rep-suite-linha');
      if (caso?.draggable) arrastando = { tipo: 'caso', id: m.linhas.find((l) => l.chave === caso.dataset.teste)?.local?.id };
      else if (suite?.draggable) arrastando = { tipo: 'suite', id: alvoDe(suite).slice(2) };
      else return;
      ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', arrastando.id);
    });
    const limparAlvos = () => { for (const x of arvore.querySelectorAll('[data-alvo]')) x.removeAttribute('data-alvo'); };
    arvore.addEventListener('dragover', (ev) => { const linha = ev.target.closest('.rep-suite-linha, .rep-arvore-topo'); limparAlvos(); if (linha && destinoValido(alvoDe(linha))) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; linha.setAttribute('data-alvo', ''); } });
    area.addEventListener('dragend', () => { arrastando = null; limparAlvos(); });
    arvore.addEventListener('drop', async (ev) => {
      const linha = ev.target.closest('.rep-suite-linha, .rep-arvore-topo'); const chave = alvoDe(linha); const item = arrastando; limparAlvos(); arrastando = null;
      if (!item || !linha || !destinoValido(chave)) return; ev.preventDefault();
      const destino = chave.startsWith('l:') ? chave.slice(2) : null;
      let r;
      if (item.tipo === 'caso') { const l = m.linhas.find((x) => x.local?.id === item.id); if (!l || (l.local.suiteLocalId ?? null) === destino) return; r = await api.casoLocalSalvar({ espacoId: e.id, id: l.local.id, dados: l.local.dados, suiteLocalId: destino }); }
      else { const s = suitesLocais.find((x) => x.id === item.id); if (!s || (s.paiId ?? null) === destino) return; r = await api.suiteLocalSalvar({ espacoId: e.id, id: s.id, titulo: s.titulo, descricao: s.descricao, paiId: destino }); }
      if (!r.ok) { avisar(textoErro(r.error), true); return; }
      avisar(item.tipo === 'caso' ? tr('Cenário movido.') : tr('Suíte movida.')); if (destino) f.abertas[chave] = true; await atualizarEspaco(e); delete mem.catalogo; void mostrar('testes');
    });
    desenharArvore();
    busca.input.addEventListener('input', desenhar);
    if (f.sel) { const atual = m.linhas.find((l) => l.chave === f.sel); if (atual) void selecionar(atual); else f.sel = ''; }
    desenhar();
  }

  // ======================= Código (visão de IDE) =======================
  function abrirNoCodigo(e, arquivo, linha) { DS.fecharModal(); const mem = memoriaDaTela('testes', e.id); mem.ide = { arquivo, linha }; (estado.sub ||= {}).testes = 'codigo'; void mostrar('testes'); }
  // Salvar pede a confirmação nativa do Windows e só grava se o arquivo não mudou fora do Prumo; o fim de linha original é preservado pelo backend.
  const lerArquivoLocal = async (leitor, e, arquivo) => { const r = await leitor(e.id, arquivo); return r.ok ? { ok: true, ...r.data } : { ok: false, erro: r.error }; };
  /** Arquivo do GitHub: sempre somente leitura, mas com o realce do editor. */
  const lerArquivoDoGithub = (e) => async (arquivo) => {
    const res = await api.servicoConsultar(e.id, 'github', 'arquivos', {}, arquivo); if (!res.ok) return { ok: false, erro: res.error };
    const f = res.data.dados; return f?.conteudo == null ? { ok: true, vazio: f?.conteudoOmitido || 'Conteúdo indisponível' } : { ok: true, conteudo: f.conteudo, editavel: false, destacar: true, hash: null, linhas: f.conteudo.split(/\r?\n/).length };
  };
  /** Testes que o catálogo do código informa por arquivo (o mesmo catálogo da tela de Testes; nada é inventado). */
  async function catalogoDoCodigo(e) { const mem = memoriaDaTela('testes', e.id); mem.catalogo ||= await api.testesCatalogo(e.id).then((r) => (r.ok ? r.data : { erro: r.error })); return mem.catalogo.catalogo?.features || null; }
  const catalogoParaIde = (e) => ({
    testesDoArquivo: async (arquivo) => { const features = await catalogoDoCodigo(e); if (!features) return null; return (features.find((f) => f.arquivo === arquivo)?.testes || []).map((t) => ({ linha: t.linha, titulo: t.titulo, chips: [chipNivel(t.tipo), ...t.tags.map(chipTag), ...(t.qase || []).map((q) => h('span', { class: 'ds-chip' }, 'Qase ' + q))] })); },
    arquivosDeTeste: async () => (await catalogoDoCodigo(e))?.map((f) => ({ arquivo: f.arquivo, total: f.testes.length })) || null
  });
  const blocosDoPipeline = (p) => [h('div', { class: 'ds-bloco' }, h('h3', { class: 'ds-h' }, tr('Pipeline')), h('p', { class: 'ds-texto' }, h('strong', {}, p.nome || p.arquivo)), p.arquivo ? h('p', { class: 'ds-sub' }, p.arquivo) : null),
    DS.bloco('Quando roda', p.eventos.length ? h('div', { class: 'ds-chips' }, p.eventos.map((x) => DS.chip(x))) : h('p', { class: 'suave' }, tr('Eventos não identificados no arquivo.'))),
    DS.bloco('Jobs', p.jobs.length ? h('ol', { class: 'ds-lista' }, p.jobs.map((j) => h('li', {}, j))) : h('p', { class: 'suave' }, tr('Nenhum job identificado.')))];

  /** CI/CD remoto: lista somente workflows do GitHub, nunca todos os arquivos do projeto. */
  async function pipelinesDoGithub(e, mem, corpo) {
    const wb = window.PrumoIde.montar(corpo, { e, id: 'ide-pipelines-github', rotuloArvore: tr('Workflows do GitHub'), recursos: {}, lerArquivo: lerArquivoDoGithub(e),
      aoAtivar: (arquivo) => { mem.pipe = { arquivo }; },
      barra: [e.pastaLocal ? DS.acao('Pipelines locais', () => { mem.pipeFonte = 'local'; void mostrar('testes'); }, { compacto: true }) : DS.acao('Trazer para editar', () => trazerDoGithub(e, false), { primaria: true, compacto: true })],
      lateral: (aba) => [DS.bloco('GitHub', h('p', { class: 'ds-texto' }, 'Versão remota — somente leitura. Para editar, trabalhe no clone local; publicar exige envio ao GitHub.')), aba?.doc ? blocosDoPipeline(window.PrumoIde.resumoDoWorkflow(aba.doc.getValue())) : null],
      vazio: { titulo: 'Selecione um workflow', descricao: 'Os arquivos publicados no GitHub aparecem à esquerda.' } });
    wb.definirArvore(h('p', { class: 'ds-doc-grupo' }, 'GitHub · .github/workflows'), DS.carregando('Lendo workflows…'));
    const r = await api.servicoConsultar(e.id, 'github', 'arquivos', {}, '.github/workflows');
    if (!r.ok) { wb.definirArvore(DS.estadoTela('vazio', 'Sem workflows publicados', 'A pasta .github/workflows não existe ou não está acessível no repositório vinculado.', [], { compacto: true })); return; }
    const arquivos = (Array.isArray(r.data.dados) ? r.data.dados : []).filter((x) => x.tipo === 'file' && /\.ya?ml$/i.test(x.nome));
    if (!arquivos.length) { wb.definirArvore(DS.estadoTela('vazio', 'Nenhum pipeline publicado no GitHub.', null, [], { compacto: true })); return; }
    wb.definirArvore(h('p', { class: 'ds-doc-grupo' }, 'GitHub · .github/workflows'), ...arquivos.map((x) => wb.botaoArquivo(x.caminho, x.nome)));
    await wb.abrir(arquivos[0].caminho);
  }
  // Pipelines CI/CD: os workflows do GitHub Actions do MESMO repositório vinculado ao projeto (pasta local), para ler e editar.
  // Salvar altera só o arquivo local; o pipeline passa a valer no GitHub depois que a pessoa enviar o repositório.
  const MODELO_PIPELINE = (nome) => `name: ${nome}\non:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n  testes:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test\n`;
  async function telaPipelines(e, mem, corpo) {
    const vg = vinc(e, 'github');
    if (vg && (mem.pipeFonte === 'github' || !e.pastaLocal)) return pipelinesDoGithub(e, mem, corpo);
    if (!e.pastaLocal) {
      corpo.append(DS.estadoTela('vazio', 'Vincule a pasta do repositório', 'Os pipelines (.github/workflows) são lidos e editados na pasta do repositório vinculada ao projeto. Vincule a pasta em Projetos.', [...(vg ? [DS.acao('Trazer o repositório do GitHub', () => trazerDoGithub(e, false), { id: 'ide-trazer', primaria: true })] : []), DS.acao('Abrir Projetos', () => mostrar('projetos'))], { id: 'pipe-sem-pasta', compacto: true }));
      if (vg || e.vinculos.length) { const legado = h('div', { id: 'pipe-github' }); corpo.append(legado); await montarAutomacoes(legado); semTitulo(legado); }
      return;
    }
    const dados = await chamar(() => api.testesPipelines(e.id)); if (!dados) return;
    const execucoes = vg ? DS.acao('Execuções no GitHub', () => { const alvo = h('div', { id: 'pipe-github' }); DS.modal('Execuções no GitHub Actions', alvo, { tamanho: 'lg' }); montarAutomacoes(alvo).then(() => semTitulo(alvo)); }, { id: 'pipe-github-abrir', compacto: true }) : null;
    const wb = window.PrumoIde.montar(corpo, { e, id: 'ide-pipelines', rotuloArvore: tr('Pipelines do repositório'), recursos: { git: true }, ...catalogoParaIde(e),
      lerArquivo: (arquivo) => lerArquivoLocal(api.testesArquivo, e, arquivo), gravar: (arquivo, texto, hash) => api.testesGravar(e.id, arquivo, texto, hash),
      aoAtivar: (arquivo) => { mem.pipe = { arquivo }; },
      aoSalvar: async () => { const d = await chamar(() => api.testesPipelines(e.id)); if (d) dados.pipelines = d.pipelines; },
      barra: [vg ? DS.acao('Ver no GitHub', () => { mem.pipeFonte = 'github'; void mostrar('testes'); }, { compacto: true }) : null, DS.acao('Novo pipeline', () => novoPipeline(), { id: 'pipe-novo', compacto: true, icone: 'mais' })], executarExtra: [execucoes],
      lateral: (aba) => { const p = aba && dados.pipelines.find((x) => x.arquivo === aba.arquivo); return [...(p ? blocosDoPipeline(p) : []), DS.info('Salvar altera só o arquivo deste computador. O pipeline passa a valer no GitHub depois que você enviar o repositório.')]; },
      vazio: dados.pipelines.length ? undefined : { titulo: 'Nenhum pipeline neste repositório', descricao: 'Não há arquivos em .github/workflows. Use "Novo pipeline" para criar o primeiro.' } });
    wb.definirArvore(h('p', { class: 'ds-doc-grupo' }, tr('{n} pipeline(s)', { n: dados.pipelines.length })), ...dados.pipelines.map((p) => wb.botaoArquivo(p.arquivo, p.nome, p.arquivo.replace('.github/workflows/', ''))));
    function novoPipeline() {
      const nome = h('input', { id: 'pipe-novo-nome', maxlength: 60, placeholder: 'ci.yml' }); const titulo = h('input', { id: 'pipe-novo-titulo', maxlength: 80, value: 'CI' });
      DS.modal('Novo pipeline', [h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Nome do arquivo em .github/workflows', nome, { inteiro: true, ajuda: 'Termina em .yml ou .yaml, sem subpastas.' }), DS.campo('Nome do pipeline', titulo, { inteiro: true })),
        DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar…', async () => {
          const n = nome.value.trim(); if (!n) { avisar(tr('Informe o nome do arquivo.'), true); return; }
          const arquivo = '.github/workflows/' + n; const r = await chamar(() => api.testesGravar(e.id, arquivo, MODELO_PIPELINE(titulo.value.trim() || 'CI'), null)); if (!r || r.canceled) return;
          DS.fecharModal(); mem.pipe = { arquivo: r.arquivo }; void mostrar('testes');
        }, { id: 'pipe-novo-criar', primaria: true }))], { tamanho: 'md' });
      nome.focus();
    }
    const alvo = mem.pipe?.arquivo && dados.pipelines.some((x) => x.arquivo === mem.pipe.arquivo) ? mem.pipe.arquivo : dados.pipelines[0]?.arquivo; if (alvo) await wb.abrir(alvo);
  }

  /** O repositório vinculado é a fonte da IDE, não o catálogo de automações. */
  async function telaCodigo(e, mem, corpo) {
    const vg = vinc(e, 'github');
    if (!e.pastaLocal && !vg) {
      corpo.append(DS.estadoTela('vazio', 'Nenhum repositório vinculado', 'Vincule uma pasta local ou um repositório GitHub em Projetos para explorar e editar o código.', [DS.acao('Criar projeto do zero', () => window.PrumoCodigo.criar(e), { primaria: true }), DS.acao('Usar pasta existente', () => window.PrumoCodigo.origem(e)), DS.acao('Abrir Projetos', () => mostrar('projetos'))]));
      return;
    }
    if (!e.pastaLocal) return codigoGithub(e, vg, corpo);
    const resposta = await api.ideArvore(e.id);
    if (!resposta.ok) { corpo.append(DS.estadoTela('erro', 'Não foi possível abrir o repositório', resposta.error)); return; }
    const dados = resposta.data;
    const envioEstado = h('span', { class: 'ds-sub', id: 'ide-envio-estado', role: 'status', 'aria-live': 'polite' });
    async function atualizarPublicacao() {
      const r = await api.idePublicacao(e.id);
      if (!envioEstado.isConnected) return;
      envioEstado.textContent = r.ok ? r.data.alterados.length + r.data.removidos.length ? tr('{n} arquivo(s) em rascunho local', { n: r.data.alterados.length + r.data.removidos.length }) : tr('Sem alterações desde o último envio') : tr('Não foi possível consultar os envios.') + ' ' + r.error; envioEstado.title = envioEstado.textContent;
    }
    const wb = window.PrumoIde.montar(corpo, { e, id: 'ide', rotuloArvore: tr('Pastas e arquivos do repositório'), recursos: { buscar: true, git: true }, ...catalogoParaIde(e),
      lerArquivo: (arquivo) => lerArquivoLocal(api.ideArquivo, e, arquivo), gravar: (arquivo, texto, hash) => api.ideGravar(e.id, arquivo, texto, hash),
      aoSalvar: atualizarPublicacao,
      aoAtivar: (arquivo, linha) => { mem.ide = { arquivo, linha }; }, recarregarArvore: atualizarArvore,
      estadoDoEnvio: envioEstado,
      acoesDoProjeto: [[tr('Código do projeto'), () => { if (wb.temAlteracoes()) { avisar(tr('Salve os arquivos antes de trocar a origem do código.'), true); return; } window.PrumoCodigo.origem(e); }], [tr('Publicar no GitHub'), () => { if (wb.temAlteracoes()) { avisar(tr('Salve os arquivos antes de enviar ao GitHub.'), true); return; } window.PrumoCodigo.publicar(e); }]],
      criarArquivo: (rel) => api.ideGravar(e.id, rel, '', null),
      terminal: { pasta: e.pastaLocal, executar: (comando) => api.ideComandoExecutar(e.id, comando), saida: (id, desde) => api.ideComandoSaida(id, desde), parar: (id) => api.ideComandoParar(id) } });
    function desenharArvore() {
      wb.definirArvore(h('p', { class: 'ds-doc-grupo' }, dados.pasta + ' — ' + dados.quantidade + ' itens'),
        dados.truncado ? DS.alerta('A árvore atingiu o limite seguro de itens; algumas pastas não foram exibidas.', 'aviso') : null, ...wb.arvore(dados.arvore));
      wb.filtrar();
    }
    async function atualizarArvore() {
      const r = await api.ideArvore(e.id);
      if (r.ok) { dados.arvore = r.data.arvore; dados.quantidade = r.data.quantidade; dados.truncado = r.data.truncado; desenharArvore(); }
    }
    desenharArvore(); void atualizarPublicacao();
    if (mem.ide?.arquivo) await wb.abrir(mem.ide.arquivo, mem.ide.linha);
  }
  async function codigoGithub(e, vg, corpo) {
    const wb = window.PrumoIde.montar(corpo, { e, id: 'ide', rotuloArvore: tr('Arquivos do repositório'), recursos: {}, lerArquivo: lerArquivoDoGithub(e),
      acaoPrincipal: { titulo: 'Repositório do GitHub em leitura', descricao: 'Você pode navegar e abrir os arquivos. Para editar, criar testes e usar o terminal, traga uma cópia para este computador.', rotulo: tr('Trazer o repositório do GitHub'), fn: () => trazerDoGithub(e, false) } });
    async function listar(caminho, destino) {
      destino.replaceChildren(DS.carregando()); const r = await api.servicoConsultar(e.id, 'github', 'arquivos', {}, caminho || '');
      if (!r.ok) { destino.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o repositório', r.error, [], { compacto: true })); return; }
      const itens = Array.isArray(r.data.dados) ? r.data.dados : []; destino.replaceChildren(...itens.sort((a, b) => (a.tipo === b.tipo ? a.nome.localeCompare(b.nome) : a.tipo === 'dir' ? -1 : 1)).map((x) => {
        if (x.tipo === 'dir') { const det = h('details', { class: 'ds-ide-pasta', 'data-pasta': x.caminho }, h('summary', {}, DS.icone('pasta'), h('span', {}, x.nome))); const filhos = h('div'); det.append(filhos); det.addEventListener('toggle', () => { if (det.open && !filhos.childNodes.length) void listar(x.caminho, filhos); }); return det; }
        return wb.botaoArquivo(x.caminho, x.nome);
      }));
    }
    await listar('', wb.arvoreEl);
  }
  /** Bloco "Código que implementa" no modal do caso (usa o catálogo já carregado ou carrega). */
  function blocoCodigoDoCaso(e, id) {
    const alvo = h('div', {}, h('p', { class: 'suave' }, tr('Procurando anotações no código…')));
    void (async () => { if (!e.pastaLocal) { alvo.replaceChildren(h('p', { class: 'suave' }, tr('Vincule a pasta do repositório para localizar o código deste caso.'))); return; }
      const src = await fontes(e); const vq = vinc(e, 'qase'); const declarados = relacoesDe(e, ['qase'], id).map((x) => outroLado(x, ['qase'], id)).filter((x) => x.tipo === 'automacao').map((x) => x.id); const impl = []; for (const f of src.cat?.catalogo?.features || []) for (const t of f.testes) if (casaQase(vq, t.qase || [], id) || declarados.includes(f.arquivo + ':' + t.linha)) impl.push({ ...t, arquivo: f.arquivo });
      alvo.replaceChildren(impl.length ? h('ul', { class: 'ds-lista' }, impl.map((t) => h('li', {}, h('button', { type: 'button', class: 'ds-link seta', onclick: () => abrirNoCodigo(e, t.arquivo, t.linha) }, t.arquivo + ':' + t.linha), h('span', { class: 'ds-sub' }, t.titulo), h('span', { class: 'ds-chips' }, chipNivel(t.tipo), ...t.tags.map(chipTag)))))
        : h('p', { class: 'suave' }, tr('Nenhum teste do código anota este caso (qase({id}) ou "Qase: {id}").', { id }))); })();
    return DS.bloco('Código que implementa', alvo);
  }
  window.PrumoTestes = Object.freeze({ blocoCodigoDoCaso, criarCenarioDoTicket: (e, ticket) => {
    const jira = vinc(e, 'jira');
    if (!jira || !ticket.chave.startsWith(jira.recurso.chave + '-') || estado.espaco?.id !== e.id) { avisar(tr('Selecione o projeto deste ticket antes de criar o cenário.'), true); return; }
    memoriaDaTela('testes', e.id).editor = { ...(e.manualAtivo === false ? { direto: true } : {}), ticket };
    (estado.sub ||= {}).testes = 'repositorio'; DS.fecharModal(); void mostrar('testes');
  } });
})();
