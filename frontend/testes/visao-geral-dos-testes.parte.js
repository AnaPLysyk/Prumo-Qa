/** Reúne trecho visual da função testes para o bundle testes-v40. */
'use strict';
// Testes (v40): representação do que existe no Qase e no código do projeto, com a ligação explícita entre eles.
// Fontes: catálogo estático do repositório (testes:catalogo/testes:arquivo), Qase vinculado (servicoConsultar),
// vínculos declarados (relações do projeto) e resultados registrados no Prumo (runs). Uma ligação caso ↔ código só
// existe por anotação no código (qase(31), qase.id(31), @qase(31), "Qase: SFQ-31") ou por vínculo declarado.
(() => {
  const F = window.PrumoFluxos; if (!F) return;
  const { vinc, memoria, relacoesDe, outroLado, tipoCaso, chipTipoCaso, rotuloTipoCaso, resultadosLocais, ticketsExternos } = F;
  const nomesNivel = { unitario: 'Unitário', integracao: 'Integração/API', funcional: 'Funcional (E2E)', regressao: 'Regressão', smoke: 'Smoke', desempenho: 'Desempenho', acessibilidade: 'Acessibilidade', indefinido: 'Não classificado' };
  const chipNivel = (t) => h('span', { class: 'tipo t-' + t }, tr(nomesNivel[t] || t));
  const chipTag = (t) => h('span', { class: 'ds-chip ds-tag' }, '@' + t);

  /** Carrega e memoriza o catálogo do código e os casos do Qase do projeto (uma vez por sessão, com "Atualizar"). */
  async function fontes(e, { forcar = false } = {}) {
    const mem = memoria('testes', e.id); if (forcar) { delete mem.catalogo; delete mem.casos; delete mem.runsLocais; }
    const vq = vinc(e, 'qase');
    const [cat, casos, runs] = await Promise.all([
      mem.catalogo || api.testesCatalogo(e.id).then((r) => (r.ok ? r.data : { erro: r.error })),
      vq ? (mem.casos || F.carregarQase(e, mem, 'casos')) : null,
      mem.runsLocais || api.runs(e.id).then((r) => (r.ok ? r.data : []))
    ]);
    mem.catalogo = cat; if (vq) mem.casos = casos; mem.runsLocais = runs;
    return { cat, casos, runs, vq };
  }
  const casaQase = (vq, ids, casoId) => ids.some((x) => x === String(casoId) || (vq && x === vq.recurso.chave + '-' + casoId));
  /** Modelo unificado: cada linha é um caso do Qase, um teste do código, ou os dois quando ligados explicitamente. */
  function modelo(e, { cat, casos, runs, vq }) {
    const codigo = []; for (const f of cat?.catalogo?.features || []) for (const t of f.testes) codigo.push({ ...t, arquivo: f.arquivo, feature: f.nome });
    const usados = new Set(); const linhas = [];
    for (const c of casos?.itens || []) {
      const declarados = relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)).filter((x) => x.tipo === 'automacao').map((x) => x.id);
      const impl = codigo.filter((t) => casaQase(vq, t.qase || [], c.id) || declarados.includes(t.arquivo + ':' + t.linha)); impl.forEach((t) => usados.add(t));
      const autos = relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)).filter((x) => x.tipo === 'automacao');
      const res = resultadosLocais(runs, c.id).sort((a, b) => Date.parse(b.em) - Date.parse(a.em))[0];
      const tags = [...new Set([...(c.tags || []).map((x) => String(x.title || x).toLowerCase()), ...impl.flatMap((t) => t.tags)])];
      linhas.push({ chave: 'qase:' + c.id, titulo: c.title || '—', caso: c, impl, autos, res, tags, niveis: [...new Set(impl.map((t) => t.tipo))], execucao: tipoCaso(c), feature: impl[0]?.feature || null });
    }
    for (const t of codigo) if (!usados.has(t)) linhas.push({ chave: 'codigo:' + t.arquivo + ':' + t.linha, titulo: t.titulo, caso: null, impl: [t], autos: [], res: null, tags: t.tags, niveis: [t.tipo], execucao: 'codigo', feature: t.feature, qaseSemCaso: (t.qase || []).length ? t.qase : null });
    return { linhas, codigo, ligados: linhas.filter((l) => l.caso && l.impl.length).length };
  }
  const situacao = (l) => {
    if (l.caso && l.impl.length) return { t: 'Caso com código', tom: 'ok' };
    if (l.caso && l.execucao === 'automatizado') return { t: 'Automatizado no Qase, código não encontrado', tom: 'aviso' };
    if (l.caso && l.execucao === 'planejado') return { t: 'Automação planejada', tom: 'info' };
    if (l.caso) return { t: 'Manual', tom: null };
    if (l.qaseSemCaso) return { t: tr('Anota Qase {ids}, caso não encontrado', { ids: l.qaseSemCaso.join(', ') }), tom: 'aviso' };
    return { t: 'Código sem caso no Qase', tom: null };
  };

  // ======================= Tela =======================
  // 2.13: Testes tem quatro seções. IDE (código dos testes e das automações), Repositório (casos e suites, no estilo do Qase),
  // Runs (execuções e runs numa lista só) e Planos. Os nomes antigos das subabas continuam abrindo o lugar novo.
  const ABAS = () => [['ide', 'IDE'], ['repositorio', 'Repositório'], ['runs', 'Runs'], ['planos', 'Planos']];
  const SUBABA_ANTIGA = { catalogo: 'repositorio', casos: 'repositorio', suites: 'repositorio', vinculos: 'repositorio', codigo: 'ide', automacao: 'pipelines' };
  const modosIde = (sub) => h('div', { class: 'segmentos sub ds-ide-modos', role: 'group', 'aria-label': 'Modo da IDE' }, [['ide', 'Código'], ['pipelines', 'Pipelines CI/CD']].map(([k, t]) => h('button', { type: 'button', 'data-ide-modo': k, 'aria-pressed': String(k === sub), onclick: () => { (estado.sub ||= {}).testes = k; mostrar('testes'); } }, t)));
  abas.testes = async (el) => {
    const e = estado.espaco; const itens = ABAS();
    let sub = SUBABA_ANTIGA[estado.sub?.testes] || estado.sub?.testes || 'repositorio'; if (!itens.some(([k]) => k === sub) && sub !== 'pipelines') sub = 'repositorio';
    const aba = sub === 'pipelines' ? 'ide' : sub; // 'pipelines' é o modo CI/CD dentro da aba IDE
    if (!e) {
      el.append(DS.cabecalho({ titulo: 'Testes' }), barraSub('testes', itens, aba), aba === 'ide' ? modosIde(sub) : null, h('div', { id: 'sub-conteudo' }, sub === 'runs' ? null : DS.estadoTela('vazio', 'Nenhum projeto selecionado', 'Selecione ou crie um projeto para continuar.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))])));
      if (sub === 'runs') await F.telaRuns(null, memoria('testes', 'todos'), el.querySelector('#sub-conteudo'), false);
      return;
    }
    const vq = vinc(e, 'qase'), vg = vinc(e, 'github'); const mem = memoria('testes', e.id);
    const perm = vq ? await escritaDoProjeto(e) : {}; const esc = !!perm.qase;
    const acoes = { repositorio: [DS.acao('Atualizar', async () => { await fontes(e, { forcar: true }); delete mem.casos; mostrar('testes'); }, { id: 'testes-atualizar', icone: 'atualizar' }),
        ...(vq ? [DS.acao('Consulta avançada', () => F.avancadaQase(e), { id: 'testes-avancada', icone: 'filtro' }), DS.acao('Nova suite', () => F.novaSuite(e, esc), { id: 'su-nova', icone: 'mais' })] : []),
        DS.acao('Nova proposta de caso', () => F.novaProposta(e), { id: 'pr-nova', primaria: true, icone: 'mais' })],
      planos: [DS.acao('Novo plano', () => F.novoPlano(e, esc), { id: 'plano-novo', primaria: true, icone: 'mais' })],
      runs: vq ? [DS.acao('Preparar run', () => F.prepararRun(e), { id: 'run-nova', primaria: true, icone: 'mais' })] : [] }[sub] || [];
    const origem = e.pastaLocal ? DS.origem('local', tr('Repositório local')) : vg ? DS.origem('github', 'GitHub · ' + vg.recurso.chave) : h('span', { class: 'ds-chip', 'data-tom': 'aviso' }, tr('Sem repositório vinculado'));
    // A IDE usa a tela inteira: sem título nem subtítulo, só a barra de seções.
    if (aba !== 'ide') el.append(DS.cabecalho({ titulo: 'Testes', descricao: [h('span', { class: 'ds-chips', id: 'testes-fontes' }, origem, vq ? DS.origem('qase', 'Qase · ' + vq.recurso.chave) : null, vq && !esc ? h('span', { class: 'ds-chip', 'data-escrita-desligada': 'qase', title: tr('Escrita no Qase desligada. Habilite em Conexões.') }, tr('Qase somente leitura')) : null)], acoes }));
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
  async function repositorio(e, mem, corpo, vq) {
    await visaoGeral(e, mem, corpo);
    await F.telaPropostas(e, mem, corpo);
    if (vq) { const suites = h('div', { id: 'repo-suites' }); await F.telaSuites(e, mem, suites); corpo.append(DS.secao('Suites', suites)); }
    const vinculos = h('div', { id: 'repo-vinculos' }); await F.telaVinculos(e, mem, vinculos); corpo.append(DS.secao('Vínculos declarados', vinculos));
  }

  // ======================= Visão geral =======================
  async function visaoGeral(e, mem, corpo) {
    const area = h('div', { id: 'cat-carregando' }, DS.esqueleto(6)); corpo.append(area);
    const src = await fontes(e); const vq = src.vq;
    if (src.cat?.erro) { area.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o repositório', src.cat.erro)); return; }
    if (src.cat?.semPasta && !vq) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhuma fonte de testes vinculada', 'Vincule a pasta do repositório (ou o repositório do GitHub) e o projeto do Qase em Projetos.', [DS.acao('Vincular pasta…', async () => { const x = await chamar(() => api.espacoPasta(e.id)); if (x && !x.canceled) { delete mem.catalogo; mostrar('testes'); } }, { id: 'cat-vincular', primaria: true }), DS.acao('Abrir Projetos', () => mostrar('projetos'))], { id: 'cat-sem-pasta' })); return; }
    const m = modelo(e, src); const c = src.cat?.catalogo;
    const f = (mem.fVisao ||= { q: '', fonte: '', nivel: '', execucao: '', tags: [], agrupar: 'tag' }); const tagsAtivas = new Set(f.tags);
    const todasTags = [...m.linhas.reduce((acc, l) => { for (const t of l.tags) acc.set(t, (acc.get(t) || 0) + 1); return acc; }, new Map()).entries()].sort((a, b) => b[1] - a[1]);
    const busca = DS.busca({ id: 'cat-busca', placeholder: 'Buscar caso, teste, arquivo ou ID', valor: f.q });
    const fonte = DS.selecao({ id: 'cat-fonte', rotulo: 'Fonte', opcoes: [['', 'Todas as fontes'], ['ligados', 'Caso com código'], ['qase', 'Só no Qase'], ['codigo', 'Só no código']], valor: f.fonte });
    const nivel = DS.selecao({ id: 'cat-nivel', rotulo: 'Nível', opcoes: [['', 'Todos os níveis'], ...Object.entries(nomesNivel).filter(([k]) => m.linhas.some((l) => l.niveis.includes(k)))], valor: f.nivel });
    const execucao = DS.selecao({ id: 'cat-execucao', rotulo: 'Execução', opcoes: [['', 'Manual e automatizado'], ['manual', 'Manual'], ['automatizado', 'Automatizado'], ['planejado', 'Automação planejada']], valor: f.execucao });
    const agrupar = DS.selecao({ id: 'cat-agrupar', rotulo: 'Agrupar por', opcoes: [['tag', 'Agrupar por tag'], ['feature', 'Agrupar por feature'], ['nivel', 'Agrupar por nível'], ['', 'Sem agrupamento']], valor: f.agrupar });
    const chips = h('div', { class: 'met-barra', id: 'cat-tipos', role: 'group', 'aria-label': tr('Tags') }, todasTags.slice(0, 30).map(([t, n]) => h('label', { class: 'chip-modulo' }, h('input', { type: 'checkbox', 'data-tag': t, checked: tagsAtivas.has(t), onchange: (ev) => { if (ev.target.checked) tagsAtivas.add(t); else tagsAtivas.delete(t); desenhar(); } }), '@' + t + ' · ' + n)));
    const lista = h('div', { id: 'cat-lista' });
    const autoQaseSemCodigo = m.linhas.filter((l) => l.caso && !l.impl.length && l.execucao === 'automatizado').length;
    corpo.replaceChildren(...[
      DS.resumo([[src.casos ? src.casos.itens.length : '—', 'casos no Qase'], [m.codigo.length, 'testes no código'], [m.ligados, 'casos com código', m.ligados ? 'ok' : null], [m.linhas.filter((l) => l.caso && !l.impl.length).length, 'casos sem código'], [autoQaseSemCodigo, 'automatizados no Qase sem código', autoQaseSemCodigo ? 'aviso' : null], [m.linhas.filter((l) => !l.caso).length, 'testes sem caso']], { id: 'cat-resumo' }),
      DS.barra(busca.no, fonte, nivel, execucao, agrupar), todasTags.length ? chips : null, lista,
      DS.info('A ligação caso ↔ código vem de anotação no código (qase(31), qase.id(31), @qase(31) ou "Qase: SFQ-31") ou de vínculo declarado; nomes parecidos não ligam nada. Nível e tags vêm da leitura estática; nada foi executado.', { id: 'cat-aviso' }),
      c?.truncado ? DS.alerta('Leitura limitada: o repositório tem mais arquivos de teste do que o Prumo lê de uma vez.', 'aviso') : null,
      src.casos?.erro ? DS.alerta(tr('Casos do Qase indisponíveis: {e}', { e: src.casos.erro }), 'falha') : null].filter(Boolean));
    function passa(l) {
      const q = f.q.toLowerCase();
      if (q && !(l.titulo + ' ' + (l.caso ? l.caso.id + ' ' + (vq?.recurso.chave || '') + '-' + l.caso.id : '') + ' ' + l.impl.map((t) => t.arquivo + ' ' + t.titulo).join(' ') + ' ' + l.tags.join(' ')).toLowerCase().includes(q)) return false;
      if (f.fonte === 'ligados' && !(l.caso && l.impl.length)) return false; if (f.fonte === 'qase' && !(l.caso && !l.impl.length)) return false; if (f.fonte === 'codigo' && l.caso) return false;
      if (f.nivel && !l.niveis.includes(f.nivel)) return false;
      if (f.execucao === 'manual' && !(l.caso && l.execucao === 'manual' && !l.impl.length)) return false;
      if (f.execucao === 'automatizado' && !(l.impl.length || l.execucao === 'automatizado')) return false;
      if (f.execucao === 'planejado' && l.execucao !== 'planejado') return false;
      if (tagsAtivas.size && !l.tags.some((t) => tagsAtivas.has(t))) return false;
      return true;
    }
    const linhaTabela = (l) => {
      const s = situacao(l); const t0 = l.impl[0];
      return { attrs: { 'data-teste': l.chave, ...(l.caso ? { 'data-caso': String(l.caso.id) } : {}) }, rotuloAcessivel: tr('Abrir {t}', { t: l.titulo }),
        abrir: () => (l.caso ? F.abrirCaso(e, l.caso.id) : abrirNoCodigo(e, t0.arquivo, t0.linha)),
        celulas: [h('div', {}, h('span', { class: 'ds-resumo-texto' }, l.titulo), h('span', { class: 'ds-sub' }, [l.caso ? DS.origem('qase', (vq?.recurso.chave || 'Qase') + '-' + l.caso.id) : null, ...l.impl.slice(0, 2).map((t) => h('button', { type: 'button', class: 'ds-link', onclick: (ev) => { ev.stopPropagation(); abrirNoCodigo(e, t.arquivo, t.linha); } }, t.arquivo.split('/').at(-1) + ':' + t.linha)), l.impl.length > 2 ? '+' + (l.impl.length - 2) : null].filter(Boolean))),
          DS.chip(s.t, s.tom), l.niveis.length ? h('span', { class: 'ds-chips' }, l.niveis.map(chipNivel)) : h('span', { class: 'ds-falta' }, tr('sem código')),
          l.tags.length ? h('span', { class: 'ds-chips' }, l.tags.slice(0, 4).map(chipTag), l.tags.length > 4 ? h('span', { class: 'ds-sub' }, '+' + (l.tags.length - 4)) : null) : '—',
          l.res ? selo(l.res.status) : h('span', { class: 'ds-falta' }, tr('sem resultado'))] };
    };
    function desenhar() {
      f.q = busca.input.value.trim(); f.fonte = fonte.value; f.nivel = nivel.value; f.execucao = execucao.value; f.agrupar = agrupar.value; f.tags = [...tagsAtivas];
      const vis = m.linhas.filter(passa);
      if (!m.linhas.length) { lista.replaceChildren(DS.estadoTela('vazio', 'Nenhum teste encontrado', c ? 'Nenhum arquivo de teste encontrado na pasta vinculada.' : 'Nenhum caso retornado pelo Qase.')); return; }
      if (!vis.length) { lista.replaceChildren(DS.estadoTela('vazio', 'Nenhum teste para este filtro.')); return; }
      const grupos = new Map(); const chaveDe = (l) => (f.agrupar === 'tag' ? (l.tags.length ? l.tags.map((t) => '@' + t) : [tr('Sem tag')]) : f.agrupar === 'feature' ? [l.feature || (l.caso ? tr('Somente no Qase') : tr('Sem feature'))] : f.agrupar === 'nivel' ? (l.niveis.length ? l.niveis.map((n) => tr(nomesNivel[n])) : [tr('Sem código')]) : ['']);
      for (const l of vis) for (const k of chaveDe(l)) { if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(l); }
      const colunas = ['Caso ou teste', 'Situação', 'Nível', 'Tags', 'Resultado no Prumo'];
      lista.replaceChildren(...[...grupos.entries()].sort((a, b) => b[1].length - a[1].length).map(([k, ls]) => (k ? h('details', { class: 'ds-grupo-testes feature-testes', open: true, 'data-grupo': k, 'data-feature': k }, h('summary', {}, h('strong', {}, k), h('span', { class: 'ds-n' }, String(ls.length))), DS.tabela({ colunas, linhas: ls.map(linhaTabela) })) : DS.tabela({ id: 'cat-tabela', colunas, linhas: ls.map(linhaTabela) }))));
    }
    busca.input.addEventListener('input', desenhar); for (const s of [fonte, nivel, execucao, agrupar]) s.addEventListener('change', desenhar);
    desenhar();
  }

  // ======================= Código (visão de IDE) =======================
  function abrirNoCodigo(e, arquivo, linha) { DS.fecharModal(); const mem = memoria('testes', e.id); mem.ide = { arquivo, linha }; (estado.sub ||= {}).testes = 'codigo'; mostrar('testes'); }
  function arvore(arquivos) { const raiz = { pastas: new Map(), arquivos: [] }; for (const a of arquivos) { const partes = a.arquivo.split('/'); let n = raiz; for (const p of partes.slice(0, -1)) { if (!n.pastas.has(p)) n.pastas.set(p, { pastas: new Map(), arquivos: [] }); n = n.pastas.get(p); } n.arquivos.push(a); } return raiz; }
  // Trazer (clonar) ou atualizar o repositório do GitHub vinculado: usa o git deste computador e a confirmação nativa; ao terminar, a IDE passa a editar a pasta.
  async function trazerDoGithub(e, atualizar) {
    const r = await chamar(() => api.espacoTrazer(e.id)); if (!r || r.canceled) return;
    avisar(atualizar ? tr('Repositório atualizado do GitHub.') : r.vinculada === false ? tr('Repositório trazido, mas a pasta ainda não foi vinculada ao projeto.') : tr('Repositório trazido do GitHub e vinculado ao projeto.'));
    mostrar('testes');
  }
  const pastaDoPrumo = (e) => !!e.pastaLocal && /[\\/]repositorios[\\/]/.test(e.pastaLocal);

  // Editor de arquivo (CodeMirror embutido, sem rede) usado pela IDE e pelos pipelines. Salvar pede a confirmação nativa do Windows e
  // só grava se o arquivo não mudou fora do Prumo; o fim de linha original é preservado pelo backend.
  function abrirEditor({ e, editor, arquivo, dados, aoDescartar, aoSalvar }) {
    const modo = /\.tsx?$/i.test(arquivo) ? { name: 'javascript', typescript: true } : /\.[cm]?jsx?$/i.test(arquivo) ? 'javascript' : /\.py$/i.test(arquivo) ? 'python' : /\.feature$/i.test(arquivo) ? 'gherkin' : /\.ya?ml$/i.test(arquivo) ? 'yaml' : null;
    const host = h('div', { class: 'ds-ide-cm' }); const estadoEl = h('span', { class: 'ds-sub', id: 'ide-estado', role: 'status' }, tr('Editando'));
    let hashAtual = dados.hash; let sujo = false; let armado = false;
    const salvarBtn = DS.acao('Salvar', () => salvar(), { id: 'ide-salvar', primaria: true, compacto: true, titulo: 'Ctrl+S' });
    const descartarBtn = DS.acao('Descartar', () => { if (sujo && !armado) { armado = true; descartarBtn.lastChild.textContent = tr('Descartar alterações?'); return; } aoDescartar(); }, { id: 'ide-descartar', compacto: true });
    editor.replaceChildren(h('div', { class: 'ds-ide-aba' }, DS.icone('codigo'), h('strong', {}, arquivo), estadoEl, salvarBtn, descartarBtn), host);
    const cm = window.CodeMirror(host, { value: String(dados.conteudo).replace(/\r\n/g, '\n'), mode: modo, lineNumbers: true, indentUnit: 2, tabSize: 2, indentWithTabs: false, theme: 'prumo', viewportMargin: 40,
      extraKeys: { 'Ctrl-S': () => salvar(), 'Cmd-S': () => salvar(), Tab: (c) => c.execCommand(c.somethingSelected() ? 'indentMore' : 'insertSoftTab'), 'Shift-Tab': (c) => c.execCommand('indentLess') } });
    cm.setSize('100%', '100%'); cm.on('change', () => { sujo = true; armado = false; descartarBtn.lastChild.textContent = tr('Descartar'); estadoEl.textContent = tr('Alterações não salvas'); });
    requestAnimationFrame(() => { cm.refresh(); cm.focus(); });
    async function salvar() {
      if (!sujo) { estadoEl.textContent = tr('Nada a salvar'); return; }
      const r = await chamar(() => api.testesGravar(e.id, arquivo, cm.getValue(), hashAtual)); if (!r || r.canceled) return;
      hashAtual = r.hash; sujo = false; estadoEl.textContent = tr('Salvo · {n} linhas', { n: r.linhas }); avisar(tr('Arquivo salvo.')); if (aoSalvar) await aoSalvar(r);
    }
  }

  // Pipelines CI/CD: os workflows do GitHub Actions do MESMO repositório vinculado ao projeto (pasta local), para ler e editar.
  // Salvar altera só o arquivo local; o pipeline passa a valer no GitHub depois que a pessoa enviar o repositório.
  const MODELO_PIPELINE = (nome) => `name: ${nome}\non:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n  testes:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test\n`;
  async function telaPipelines(e, mem, corpo) {
    const vg = vinc(e, 'github');
    if (!e.pastaLocal) {
      corpo.append(DS.estadoTela('vazio', 'Vincule a pasta do repositório', 'Os pipelines (.github/workflows) são lidos e editados na pasta do repositório vinculada ao projeto. Vincule a pasta em Projetos.', [...(vg ? [DS.acao('Trazer o repositório do GitHub', () => trazerDoGithub(e, false), { id: 'ide-trazer', primaria: true })] : []), DS.acao('Abrir Projetos', () => mostrar('projetos'))], { id: 'pipe-sem-pasta', compacto: true }));
      if (vg || e.vinculos.length) { const legado = h('div', { id: 'pipe-github' }); corpo.append(legado); await abaAutomacao(legado); semTitulo(legado); }
      return;
    }
    const dados = await chamar(() => api.testesPipelines(e.id)); if (!dados) return;
    const caixa = h('div', { class: 'ds-ide', id: 'ide-pipelines' }); const arvoreEl = h('nav', { class: 'ds-ide-arvore', 'aria-label': tr('Pipelines do repositório') }); const editor = h('section', { class: 'ds-ide-editor', 'aria-live': 'polite' }); const painel = h('aside', { class: 'ds-ide-painel' });
    caixa.append(arvoreEl, editor, painel); corpo.append(caixa);
    arvoreEl.append(h('div', { class: 'ds-ide-barra' }, DS.acao('Novo pipeline', () => novoPipeline(), { id: 'pipe-novo', compacto: true, icone: 'mais' }), vg ? DS.acao('Execuções no GitHub', () => { const alvo = h('div', { id: 'pipe-github' }); DS.modal('Execuções no GitHub Actions', alvo, { tamanho: 'lg' }); abaAutomacao(alvo).then(() => semTitulo(alvo)); }, { id: 'pipe-github-abrir', compacto: true }) : null),
      h('p', { class: 'ds-doc-grupo' }, tr('{n} pipeline(s)', { n: dados.pipelines.length })));
    for (const p of dados.pipelines) arvoreEl.append(h('button', { type: 'button', class: 'ds-ide-arquivo', 'data-arquivo': p.arquivo, onclick: () => abrir(p.arquivo) }, DS.icone('codigo'), h('span', {}, p.nome), h('span', { class: 'ds-sub' }, p.arquivo.replace('.github/workflows/', ''))));
    if (!dados.pipelines.length) { editor.append(DS.estadoTela('vazio', 'Nenhum pipeline neste repositório', 'Não há arquivos em .github/workflows. Use "Novo pipeline" para criar o primeiro.', [], { id: 'pipe-vazio' })); painel.append(h('p', { class: 'suave' }, tr('Um pipeline só roda no GitHub depois que você enviar o repositório.'))); return; }
    async function abrir(arquivo) {
      mem.pipe = { arquivo }; for (const b of arvoreEl.querySelectorAll('.ds-ide-arquivo')) b.setAttribute('aria-current', String(b.dataset.arquivo === arquivo));
      editor.replaceChildren(DS.carregando('Lendo arquivo…'));
      const r = await api.testesArquivo(e.id, arquivo); if (!r.ok) { editor.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o arquivo', r.error)); return; }
      const p = dados.pipelines.find((x) => x.arquivo === arquivo); const linhasEl = h('ol', { class: 'ds-ide-linhas', 'data-arquivo': arquivo });
      r.data.conteudo.split(/\r?\n/).forEach((txt, i) => linhasEl.append(h('li', { 'data-linha': i + 1 }, h('code', {}, txt || ' '))));
      const editavel = r.data.editavel === true;
      editor.replaceChildren(h('div', { class: 'ds-ide-aba' }, DS.icone('codigo'), h('strong', {}, arquivo), h('span', { class: 'ds-sub' }, tr('{n} linhas · somente leitura', { n: r.data.linhas })),
        editavel ? DS.acao('Editar', () => abrirEditor({ e, editor, arquivo, dados: r.data, aoDescartar: () => abrir(arquivo), aoSalvar: async () => { const d = await chamar(() => api.testesPipelines(e.id)); if (d) { dados.pipelines = d.pipelines; resumo(arquivo); } } }), { id: 'ide-editar', compacto: true })
          : h('span', { class: 'ds-chip', 'data-tom': 'aviso', id: 'ide-bloqueado', title: tr('O arquivo contém o que parece um segredo; o Prumo não o exibe para edição. Edite em outro editor.') }, tr('Edição bloqueada'))), linhasEl);
      resumo(arquivo); if (mem.pipe?.editar && editavel) { delete mem.pipe.editar; editor.querySelector('#ide-editar')?.click(); }
    }
    function resumo(arquivo) {
      const p = dados.pipelines.find((x) => x.arquivo === arquivo); if (!p) return;
      painel.replaceChildren(h('div', { class: 'ds-bloco' }, h('h3', { class: 'ds-h' }, tr('Pipeline')), h('p', { class: 'ds-texto' }, h('strong', {}, p.nome)), h('p', { class: 'ds-sub' }, p.arquivo)),
        DS.bloco('Quando roda', p.eventos.length ? h('div', { class: 'ds-chips' }, p.eventos.map((x) => DS.chip(x))) : h('p', { class: 'suave' }, tr('Eventos não identificados no arquivo.'))),
        DS.bloco('Jobs', p.jobs.length ? h('ol', { class: 'ds-lista' }, p.jobs.map((j) => h('li', {}, j))) : h('p', { class: 'suave' }, tr('Nenhum job identificado.'))),
        DS.info('Salvar altera só o arquivo deste computador. O pipeline passa a valer no GitHub depois que você enviar o repositório.'));
    }
    function novoPipeline() {
      const nome = h('input', { id: 'pipe-novo-nome', maxlength: 60, placeholder: 'ci.yml' }); const titulo = h('input', { id: 'pipe-novo-titulo', maxlength: 80, value: 'CI' });
      DS.modal('Novo pipeline', [h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Nome do arquivo em .github/workflows', nome, { inteiro: true, ajuda: 'Termina em .yml ou .yaml, sem subpastas.' }), DS.campo('Nome do pipeline', titulo, { inteiro: true })),
        DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar…', async () => {
          const n = nome.value.trim(); if (!n) { avisar(tr('Informe o nome do arquivo.'), true); return; }
          const arquivo = '.github/workflows/' + n; const r = await chamar(() => api.testesGravar(e.id, arquivo, MODELO_PIPELINE(titulo.value.trim() || 'CI'), null)); if (!r || r.canceled) return;
          DS.fecharModal(); mem.pipe = { arquivo: r.arquivo, editar: true }; mostrar('testes');
        }, { id: 'pipe-novo-criar', primaria: true }))], { tamanho: 'md' });
      nome.focus();
    }
    const alvo = mem.pipe?.arquivo && dados.pipelines.some((x) => x.arquivo === mem.pipe.arquivo) ? mem.pipe.arquivo : dados.pipelines[0].arquivo; await abrir(alvo);
  }

  async function telaCodigo(e, mem, corpo) {
    const vg = vinc(e, 'github');
    if (!e.pastaLocal && !vg) { corpo.append(DS.estadoTela('vazio', 'Nenhum repositório vinculado', 'Vincule a pasta local do repositório ou um repositório do GitHub em Projetos para ver o código de teste.', [DS.acao('Abrir Projetos', () => mostrar('projetos'))])); return; }
    if (!e.pastaLocal) return codigoGithub(e, vg, corpo);
    const src = await fontes(e); const cat = src.cat?.catalogo; if (!cat) { corpo.append(DS.estadoTela('erro', 'Não foi possível ler o repositório', src.cat?.erro || '')); return; }
    const porArquivo = cat.features.map((f) => ({ arquivo: f.arquivo, feature: f.nome, testes: f.testes, tipos: f.tipos }));
    const casosPorId = new Map((src.casos?.itens || []).map((c) => [String(c.id), c]));
    const caixa = h('div', { class: 'ds-ide', id: 'ide' }); const arvoreEl = h('nav', { class: 'ds-ide-arvore', 'aria-label': tr('Arquivos de teste') }); const editor = h('section', { class: 'ds-ide-editor', 'aria-live': 'polite' }); const painel = h('aside', { class: 'ds-ide-painel' });
    caixa.append(arvoreEl, editor, painel); corpo.append(caixa, agentesNoCodigo(e));
    const pasta = (nome, n, nivel) => { const det = h('details', { class: 'ds-ide-pasta', open: nivel < 3 }, h('summary', {}, DS.icone('pasta'), h('span', {}, nome))); for (const [k, sub] of [...n.pastas.entries()].sort()) det.append(pasta(k, sub, nivel + 1)); for (const a of n.arquivos.sort((x, y) => x.arquivo.localeCompare(y.arquivo))) det.append(h('button', { type: 'button', class: 'ds-ide-arquivo', 'data-arquivo': a.arquivo, title: a.arquivo, onclick: () => abrir(a.arquivo) }, DS.icone('codigo'), h('span', {}, a.arquivo.split('/').at(-1)), h('span', { class: 'ds-n' }, String(a.testes.length)))); return det; };
    const raiz = arvore(porArquivo); arvoreEl.append(h('p', { class: 'ds-doc-grupo' }, tr('{n} arquivo(s) · {t} teste(s)', { n: porArquivo.length, t: cat.testes })));
    for (const [k, sub] of [...raiz.pastas.entries()].sort()) arvoreEl.append(pasta(k, sub, 0)); for (const a of raiz.arquivos) arvoreEl.append(h('button', { type: 'button', class: 'ds-ide-arquivo', 'data-arquivo': a.arquivo, onclick: () => abrir(a.arquivo) }, DS.icone('codigo'), h('span', {}, a.arquivo)));
    arvoreEl.prepend(h('div', { class: 'ds-ide-barra' }, DS.acao('Novo arquivo', () => novoArquivo(), { id: 'ide-novo', compacto: true, icone: 'mais' }), vinc(e, 'github') && pastaDoPrumo(e) ? DS.acao('Atualizar do GitHub', () => trazerDoGithub(e, true), { id: 'ide-atualizar-github', compacto: true, titulo: 'Atualiza a cópia deste computador só por avanço; suas mudanças não são sobrescritas' }) : null));
    if (!porArquivo.length) { editor.append(DS.estadoTela('vazio', 'Nenhum arquivo de teste encontrado na pasta vinculada.', 'O Prumo reconhece *.spec/*.test (JS/TS), *.feature e test_*.py. Use "Novo arquivo" para criar a primeira automação.')); if (mem.ide?.novo) novoArquivo(mem.ide.novo); return; }
    painel.append(DS.estadoTela('vazio', 'Selecione um teste', 'As conexões do teste com casos, tickets, execuções e agentes aparecem aqui.', [], { compacto: true }));
    async function abrir(arquivo, linha) {
      const quererEditar = !!mem.ide?.editar && mem.ide.arquivo === arquivo; mem.ide = { arquivo, linha }; for (const b of arvoreEl.querySelectorAll('.ds-ide-arquivo')) b.setAttribute('aria-current', String(b.dataset.arquivo === arquivo));
      editor.replaceChildren(DS.carregando('Lendo arquivo…'));
      const r = await api.testesArquivo(e.id, arquivo); if (!r.ok) { editor.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o arquivo', r.error)); return; }
      const info = porArquivo.find((x) => x.arquivo === arquivo); const porLinha = new Map((info?.testes || []).map((t) => [t.linha, t]));
      const linhasEl = h('ol', { class: 'ds-ide-linhas', 'data-arquivo': arquivo });
      r.data.conteudo.split(/\r?\n/).forEach((txt, i) => { const t = porLinha.get(i + 1); const li = h('li', { 'data-linha': i + 1, class: t ? 'ds-ide-teste' : null }, h('code', {}, txt || ' '));
        if (t) li.prepend(h('button', { type: 'button', class: 'ds-ide-marca', 'aria-label': tr('Ver conexões do teste {t}', { t: t.titulo }), onclick: () => selecionar(t, li) }, chipNivel(t.tipo), ...(t.qase || []).map((q) => h('span', { class: 'ds-chip', 'data-tom': 'info' }, 'Qase ' + q)), ...t.tags.slice(0, 3).map(chipTag)));
        linhasEl.append(li); });
      const editavel = r.data.editavel === true; const bloqueado = r.data.editavel === false;
      editor.replaceChildren(h('div', { class: 'ds-ide-aba' }, DS.icone('codigo'), h('strong', {}, arquivo), h('span', { class: 'ds-sub' }, tr('{n} linhas · {t} teste(s) · somente leitura', { n: r.data.linhas, t: info?.testes.length || 0 })),
        editavel ? DS.acao('Editar', () => editarArquivo(arquivo, r.data), { id: 'ide-editar', compacto: true }) : null,
        bloqueado ? h('span', { class: 'ds-chip', 'data-tom': 'aviso', id: 'ide-bloqueado', title: tr('O arquivo contém o que parece um segredo; o Prumo não o exibe para edição. Edite em outro editor.') }, tr('Edição bloqueada')) : null), linhasEl);
      if (editavel && quererEditar) { editarArquivo(arquivo, r.data); return; }
      const alvo = linha && linhasEl.querySelector(`[data-linha="${linha}"]`); if (alvo) { alvo.scrollIntoView({ block: 'center' }); const t = porLinha.get(linha); if (t) selecionar(t, alvo); }
    }
    const editarArquivo = (arquivo, dados) => abrirEditor({ e, mem, editor, arquivo, dados, aoDescartar: () => abrir(arquivo, mem.ide?.linha), aoSalvar: async () => { await fontes(e, { forcar: true }); } });
    const modeloDeTeste = (caminho, casoId, titulo) => {
      const chave = vinc(e, 'qase')?.recurso?.chave; const ref = casoId && chave ? `${chave}-${casoId}` : null; const nome = titulo || 'descreva o cenário';
      if (/\.feature$/i.test(caminho)) return `${ref ? `# Qase: ${ref}\n` : ''}Feature: ${nome}\n\n  Scenario: ${nome}\n    Given o sistema está pronto\n    When a pessoa executa o passo\n    Then o resultado esperado aparece\n`;
      if (/\.py$/i.test(caminho)) return `${ref ? `# Qase: ${ref}\n` : ''}def test_${(nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase() || 'cenario')}():\n    # passos do cenário\n    assert True\n`;
      return `${ref ? `// Qase: ${ref}\n` : ''}test(${JSON.stringify(nome)}, async () => {\n  // passos do cenário\n});\n`;
    };
    function novoArquivo(inicio) {
      const caminho = h('input', { id: 'ide-novo-caminho', maxlength: 300, placeholder: 'tests/e2e/login.spec.ts', value: inicio ? `tests/${String(inicio.titulo || 'caso-' + inicio.casoId).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'novo'}.spec.ts` : '' });
      const caso = h('input', { id: 'ide-novo-caso', type: 'number', min: 1, placeholder: vinc(e, 'qase') ? '31' : '', value: inicio?.casoId || '', disabled: !vinc(e, 'qase') });
      const titulo = h('input', { id: 'ide-novo-titulo', maxlength: 200, value: inicio?.titulo || '' });
      if (mem.ide) delete mem.ide.novo;
      DS.modal('Novo arquivo de teste', [h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() },
        DS.campo('Caminho dentro da pasta do projeto', caminho, { inteiro: true, ajuda: 'Nome de teste: *.spec.ts, *.test.js, *.feature ou test_*.py.' }), DS.campo('Título do cenário', titulo, { inteiro: true }),
        DS.campo('Caso do Qase (opcional)', caso, { inteiro: true, ajuda: 'Grava a anotação "Qase: CHAVE-ID" no arquivo, que liga a automação ao caso.' })),
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar…', async () => {
        const c = caminho.value.trim(); if (!c) { avisar(tr('Informe o caminho do arquivo.'), true); return; }
        const r = await chamar(() => api.testesGravar(e.id, c, modeloDeTeste(c, caso.value ? Number(caso.value) : null, titulo.value.trim()), null)); if (!r || r.canceled) return;
        DS.fecharModal(); await fontes(e, { forcar: true }); mem.ide = { arquivo: r.arquivo, editar: true }; mostrar('testes');
      }, { id: 'ide-novo-criar', primaria: true }))], { tamanho: 'md' });
      caminho.focus();
    }
    function selecionar(t, li) {
      for (const x of editor.querySelectorAll('.ds-ide-teste[aria-current]')) x.removeAttribute('aria-current'); li.setAttribute('aria-current', 'true');
      const casos = (t.qase || []).map((q) => ({ q, c: casaQase(vinc(e, 'qase'), [q], q.replace(/^.*-/, '')) ? casosPorId.get(q.replace(/^.*-/, '')) : null }));
      const tickets = casos.flatMap(({ c }) => (c ? [...ticketsExternos(c), ...relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)).filter((x) => x.tipo === 'jira').map((x) => x.id)] : []));
      const res = casos.flatMap(({ c }) => (c ? resultadosLocais(src.runs, c.id) : [])).sort((a, b) => Date.parse(b.em) - Date.parse(a.em));
      painel.replaceChildren(...[h('div', { class: 'ds-bloco' }, h('h3', { class: 'ds-h' }, tr('Teste')), h('p', { class: 'ds-texto' }, h('strong', {}, t.titulo)), h('p', { class: 'ds-sub' }, tr('linha {l}', { l: t.linha }) + (t.fim ? '–' + t.fim : '')), h('div', { class: 'ds-chips' }, chipNivel(t.tipo), DS.chip(tr('confiança {c}', { c: t.confianca })), ...t.tags.map(chipTag)), h('p', { class: 'ds-sub' }, tr('Classificação: {m}', { m: t.motivo }))),
        t.passos.length ? DS.bloco('Passos no código', h('ol', { class: 'ds-lista' }, t.passos.map((p) => h('li', {}, p)))) : null,
        DS.bloco('Caso no Qase', casos.length ? h('div', { class: 'ds-celula-nos' }, casos.map(({ q, c }) => (c ? F.noRef(e, { tipo: 'qase', id: String(c.id), vinculoId: vinc(e, 'qase')?.id }, tr('Caso {id}', { id: c.id }) + ' · ' + rotuloTipoCaso[tipoCaso(c)]) : h('span', { class: 'ds-chip', 'data-tom': 'aviso', title: tr('O código anota este ID, mas o caso não veio na consulta ao Qase vinculado.') }, 'Qase ' + q + ' · ' + tr('não encontrado'))))) : h('p', { class: 'suave' }, tr('Nenhuma anotação Qase neste teste.'))),
        tickets.length ? DS.bloco('Tickets', h('div', { class: 'ds-celula-nos' }, [...new Set(tickets)].map((k) => F.noRef(e, { tipo: 'jira', id: k, vinculoId: vinc(e, 'jira')?.id }, k)))) : null,
        DS.bloco('Resultados no Prumo', res.length ? DS.tempo(res.slice(0, 5).map((x) => ({ tom: DS.tom(x.status), titulo: h('span', {}, selo(x.status), ' ', x.run.titulo), sub: hora(x.em) + ' · ' + (x.origem === 'MANUAL' ? tr('declarado manualmente') : tr('execução de automação')) }))) : h('p', { class: 'suave' }, tr('Nenhum resultado registrado no Prumo para este teste.')))].filter(Boolean));
    }
    // Sem arquivo escolhido: abre o que mais liga código a casos do Qase (depois, o que tem mais testes).
    const peso = (x) => x.testes.filter((t) => (t.qase || []).length).length * 1000 + x.testes.length; const inicial = [...porArquivo].sort((x, y) => peso(y) - peso(x))[0];
    const alvo = mem.ide?.arquivo && porArquivo.some((x) => x.arquivo === mem.ide.arquivo) ? mem.ide : { arquivo: inicial.arquivo, linha: inicial.testes.find((t) => (t.qase || []).length)?.linha };
    await abrir(alvo.arquivo, alvo.linha);
    if (mem.ide?.novo) novoArquivo(mem.ide.novo);
  }
  async function codigoGithub(e, vg, corpo) {
    const caixa = h('div', { class: 'ds-ide' }); const arvoreEl = h('nav', { class: 'ds-ide-arvore', 'aria-label': tr('Arquivos do repositório') }); const editor = h('section', { class: 'ds-ide-editor' });
    corpo.append(DS.barra(DS.acao('Trazer o repositório do GitHub', () => trazerDoGithub(e, false), { id: 'ide-trazer', primaria: true, titulo: 'Baixa uma cópia para este computador e a vincula ao projeto, para editar na IDE' })), DS.info(tr('Repositório {r} lido pelo GitHub vinculado, somente leitura. Traga uma cópia para este computador para editar, criar automações e classificar testes.', { r: vg.recurso.chave })), caixa, agentesNoCodigo(e)); caixa.append(arvoreEl, editor);
    async function listar(caminho, destino) {
      destino.replaceChildren(DS.carregando()); const r = await api.servicoConsultar(e.id, 'github', 'arquivos', {}, caminho || '');
      if (!r.ok) { destino.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o repositório', r.error, [], { compacto: true })); return; }
      const itens = Array.isArray(r.data.dados) ? r.data.dados : []; destino.replaceChildren(...itens.sort((a, b) => (a.tipo === b.tipo ? a.nome.localeCompare(b.nome) : a.tipo === 'dir' ? -1 : 1)).map((x) => {
        if (x.tipo === 'dir') { const det = h('details', { class: 'ds-ide-pasta' }, h('summary', {}, DS.icone('pasta'), h('span', {}, x.nome))); const filhos = h('div'); det.append(filhos); det.addEventListener('toggle', () => { if (det.open && !filhos.childNodes.length) listar(x.caminho, filhos); }); return det; }
        return h('button', { type: 'button', class: 'ds-ide-arquivo', onclick: () => abrir(x.caminho) }, DS.icone('codigo'), h('span', {}, x.nome));
      }));
    }
    async function abrir(caminho) {
      editor.replaceChildren(DS.carregando('Lendo arquivo…')); const r = await api.servicoConsultar(e.id, 'github', 'arquivos', {}, caminho);
      if (!r.ok) { editor.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o arquivo', r.error)); return; }
      const d = r.data.dados; editor.replaceChildren(h('div', { class: 'ds-ide-aba' }, DS.icone('codigo'), h('strong', {}, d.caminho), h('span', { class: 'ds-sub' }, tr('GitHub · somente leitura'))), d.conteudo === null ? DS.estadoTela('vazio', d.conteudoOmitido || 'Conteúdo indisponível') : h('ol', { class: 'ds-ide-linhas' }, d.conteudo.split(/\r?\n/).map((txt, i) => h('li', { 'data-linha': i + 1 }, h('code', {}, txt || ' ')))));
    }
    editor.append(DS.estadoTela('vazio', 'Selecione um arquivo', null, [], { compacto: true })); await listar('', arvoreEl);
  }
  /** Quem pode agir neste código: políticas reais do projeto (o agente lê pelo MCP; escrever no repositório é só da pessoa). */
  function agentesNoCodigo(e) {
    const linha = h('div', { class: 'ds-fontes', id: 'ide-agentes', 'aria-live': 'polite' }, h('span', {}, DS.carregando('Consultando permissões dos agentes…')));
    api.agentesEstado(e.id).then((r) => {
      if (!r.ok) { linha.replaceChildren(h('span', { class: 'suave' }, tr('Permissões dos agentes indisponíveis.'))); return; }
      const m = new Map(r.data.matriz.map((c) => [c.id, c])); const rot = { PERMITIDO: 'permitido', EXIGE_AUTORIZACAO: 'exige autorização', BLOQUEADO: 'bloqueado', SOMENTE_PESSOA: 'somente pessoa' };
      const item = (id, texto) => { const c = m.get(id); if (!c) return null; return h('span', { title: c.motivo || '' }, DS.icone(c.estado === 'BLOQUEADO' ? 'cadeado' : 'escudo'), tr(texto), ': ', h('strong', {}, tr(rot[c.estado] || c.estado))); };
      linha.replaceChildren(h('span', {}, h('strong', {}, tr('Agentes neste código'))), item('consultar_contexto', 'ler contexto'), item('propor_casos', 'propor casos'), item('executar_testes', 'executar testes'), item('github_escrita', 'branch, commit e PR'), DS.link('Ajustar em Agentes', () => mostrar('agentes'), { seta: true }));
    });
    return linha;
  }
  /** Bloco "Código que implementa" no modal do caso (usa o catálogo já carregado ou carrega). */
  function blocoCodigoDoCaso(e, id) {
    const alvo = h('div', {}, h('p', { class: 'suave' }, tr('Procurando anotações no código…')));
    (async () => { if (!e.pastaLocal) { alvo.replaceChildren(h('p', { class: 'suave' }, tr('Vincule a pasta do repositório para localizar o código deste caso.'))); return; }
      const src = await fontes(e); const vq = vinc(e, 'qase'); const declarados = relacoesDe(e, ['qase'], id).map((x) => outroLado(x, ['qase'], id)).filter((x) => x.tipo === 'automacao').map((x) => x.id); const impl = []; for (const f of src.cat?.catalogo?.features || []) for (const t of f.testes) if (casaQase(vq, t.qase || [], id) || declarados.includes(f.arquivo + ':' + t.linha)) impl.push({ ...t, arquivo: f.arquivo });
      alvo.replaceChildren(impl.length ? h('ul', { class: 'ds-lista' }, impl.map((t) => h('li', {}, h('button', { type: 'button', class: 'ds-link seta', onclick: () => abrirNoCodigo(e, t.arquivo, t.linha) }, t.arquivo + ':' + t.linha), h('span', { class: 'ds-sub' }, t.titulo), h('span', { class: 'ds-chips' }, chipNivel(t.tipo), ...t.tags.map(chipTag)))))
        : h('p', { class: 'suave' }, tr('Nenhum teste do código anota este caso (qase({id}) ou "Qase: {id}").', { id }))); })();
    return DS.bloco('Código que implementa', alvo);
  }
  window.PrumoTestes = Object.freeze({ blocoCodigoDoCaso, abrirNoCodigo });
})();
