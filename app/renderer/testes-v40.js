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
  const ABAS = (vq) => [['catalogo', 'Visão geral'], ['codigo', 'Código'], ...(vq ? [['casos', 'Casos Qase'], ['suites', 'Suites'], ['planos', 'Planos']] : []), ['runs', 'Runs'], ['automacao', 'CI e GitHub']];
  abas.testes = async (el) => {
    const e = estado.espaco;
    if (!e) { const sub0 = ['runs', 'automacao'].includes(estado.sub?.testes) ? estado.sub.testes : 'catalogo'; el.append(DS.cabecalho({ titulo: 'Testes' }), barraSub('testes', [['catalogo', 'Visão geral'], ['runs', 'Runs'], ['automacao', 'CI e GitHub']], sub0), h('div', { id: 'sub-conteudo' }, DS.estadoTela('vazio', 'Nenhum projeto selecionado', 'Selecione ou crie um projeto para continuar.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))]))); return; }
    const vq = vinc(e, 'qase'), vg = vinc(e, 'github'); const itens = ABAS(vq); const mem = memoria('testes', e.id);
    let sub = estado.sub?.testes || 'catalogo'; if (!itens.some(([k]) => k === sub)) sub = 'catalogo';
    const perm = vq ? await escritaDoProjeto(e) : {}; const esc = !!perm.qase;
    const acoes = { catalogo: [DS.acao('Atualizar', async () => { await fontes(e, { forcar: true }); mostrar('testes'); }, { id: 'testes-atualizar', icone: 'atualizar' })],
      casos: [DS.acao('Consulta avançada', () => F.avancadaQase(e), { id: 'testes-avancada', icone: 'filtro' }), DS.acao('Nova proposta de caso', () => F.novaProposta(e), { id: 'pr-nova', primaria: true, icone: 'mais' })],
      suites: [DS.acao('Nova suite', () => F.novaSuite(e, esc), { id: 'su-nova', primaria: true, icone: 'mais' })], planos: [DS.acao('Novo plano', () => F.novoPlano(e, esc), { id: 'plano-novo', primaria: true, icone: 'mais' })],
      runs: vq ? [DS.acao('Preparar run', () => F.prepararRun(e), { id: 'run-nova', primaria: true, icone: 'mais' })] : [] }[sub] || [];
    const origem = e.pastaLocal ? DS.origem('local', tr('Repositório local')) : vg ? DS.origem('github', 'GitHub · ' + vg.recurso.chave) : h('span', { class: 'ds-chip', 'data-tom': 'aviso' }, tr('Sem repositório vinculado'));
    el.append(DS.cabecalho({ titulo: 'Testes', descricao: [h('span', { class: 'ds-chips', id: 'testes-fontes' }, origem, vq ? DS.origem('qase', 'Qase · ' + vq.recurso.chave) : null, vq && !esc ? h('span', { class: 'ds-chip', 'data-escrita-desligada': 'qase', title: tr('Escrita no Qase desligada. Habilite em Conexões.') }, tr('Qase somente leitura')) : null)], acoes }), barraSub('testes', itens, sub));
    const corpo = h('div', { id: 'sub-conteudo' }); el.append(corpo);
    if (sub === 'catalogo') await visaoGeral(e, mem, corpo);
    else if (sub === 'codigo') await telaCodigo(e, mem, corpo);
    else if (sub === 'casos') await F.telaCasos(e, mem, corpo);
    else if (sub === 'suites') await F.telaSuites(e, mem, corpo);
    else if (sub === 'planos') await F.telaPlanos(e, mem, corpo);
    else if (sub === 'runs') await F.telaRuns(e, mem, corpo, esc);
    else { await abaAutomacao(corpo); semTitulo(corpo); }
  };

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
      h('p', { class: 'ds-nota-perm', id: 'cat-aviso' }, DS.icone('escudo'), h('span', {}, tr('A ligação caso ↔ código vem de anotação no código (qase(31), qase.id(31), @qase(31) ou "Qase: SFQ-31") ou de vínculo declarado; nomes parecidos não ligam nada. Nível e tags vêm da leitura estática; nada foi executado.'))),
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
  async function telaCodigo(e, mem, corpo) {
    const vg = vinc(e, 'github');
    if (!e.pastaLocal && !vg) { corpo.append(DS.estadoTela('vazio', 'Nenhum repositório vinculado', 'Vincule a pasta local do repositório ou um repositório do GitHub em Projetos para ver o código de teste.', [DS.acao('Abrir Projetos', () => mostrar('projetos'))])); return; }
    if (!e.pastaLocal) return codigoGithub(e, vg, corpo);
    const src = await fontes(e); const cat = src.cat?.catalogo; if (!cat) { corpo.append(DS.estadoTela('erro', 'Não foi possível ler o repositório', src.cat?.erro || '')); return; }
    const porArquivo = cat.features.map((f) => ({ arquivo: f.arquivo, feature: f.nome, testes: f.testes, tipos: f.tipos }));
    const casosPorId = new Map((src.casos?.itens || []).map((c) => [String(c.id), c]));
    const caixa = h('div', { class: 'ds-ide', id: 'ide' }); const arvoreEl = h('nav', { class: 'ds-ide-arvore', 'aria-label': tr('Arquivos de teste') }); const editor = h('section', { class: 'ds-ide-editor', 'aria-live': 'polite' }); const painel = h('aside', { class: 'ds-ide-painel' });
    caixa.append(arvoreEl, editor, painel); corpo.append(agentesNoCodigo(e), caixa);
    const pasta = (nome, n, nivel) => { const det = h('details', { class: 'ds-ide-pasta', open: nivel < 3 }, h('summary', {}, DS.icone('pasta'), h('span', {}, nome))); for (const [k, sub] of [...n.pastas.entries()].sort()) det.append(pasta(k, sub, nivel + 1)); for (const a of n.arquivos.sort((x, y) => x.arquivo.localeCompare(y.arquivo))) det.append(h('button', { type: 'button', class: 'ds-ide-arquivo', 'data-arquivo': a.arquivo, title: a.arquivo, onclick: () => abrir(a.arquivo) }, DS.icone('codigo'), h('span', {}, a.arquivo.split('/').at(-1)), h('span', { class: 'ds-n' }, String(a.testes.length)))); return det; };
    const raiz = arvore(porArquivo); arvoreEl.append(h('p', { class: 'ds-doc-grupo' }, tr('{n} arquivo(s) · {t} teste(s)', { n: porArquivo.length, t: cat.testes })));
    for (const [k, sub] of [...raiz.pastas.entries()].sort()) arvoreEl.append(pasta(k, sub, 0)); for (const a of raiz.arquivos) arvoreEl.append(h('button', { type: 'button', class: 'ds-ide-arquivo', 'data-arquivo': a.arquivo, onclick: () => abrir(a.arquivo) }, DS.icone('codigo'), h('span', {}, a.arquivo)));
    if (!porArquivo.length) { editor.append(DS.estadoTela('vazio', 'Nenhum arquivo de teste encontrado na pasta vinculada.', 'O Prumo reconhece *.spec/*.test (JS/TS), *.feature e test_*.py.')); return; }
    painel.append(DS.estadoTela('vazio', 'Selecione um teste', 'As conexões do teste com casos, tickets, execuções e agentes aparecem aqui.', [], { compacto: true }));
    async function abrir(arquivo, linha) {
      mem.ide = { arquivo, linha }; for (const b of arvoreEl.querySelectorAll('.ds-ide-arquivo')) b.setAttribute('aria-current', String(b.dataset.arquivo === arquivo));
      editor.replaceChildren(DS.carregando('Lendo arquivo…'));
      const r = await api.testesArquivo(e.id, arquivo); if (!r.ok) { editor.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler o arquivo', r.error)); return; }
      const info = porArquivo.find((x) => x.arquivo === arquivo); const porLinha = new Map((info?.testes || []).map((t) => [t.linha, t]));
      const linhasEl = h('ol', { class: 'ds-ide-linhas', 'data-arquivo': arquivo });
      r.data.conteudo.split(/\r?\n/).forEach((txt, i) => { const t = porLinha.get(i + 1); const li = h('li', { 'data-linha': i + 1, class: t ? 'ds-ide-teste' : null }, h('code', {}, txt || ' '));
        if (t) li.prepend(h('button', { type: 'button', class: 'ds-ide-marca', 'aria-label': tr('Ver conexões do teste {t}', { t: t.titulo }), onclick: () => selecionar(t, li) }, chipNivel(t.tipo), ...(t.qase || []).map((q) => h('span', { class: 'ds-chip', 'data-tom': 'info' }, 'Qase ' + q)), ...t.tags.slice(0, 3).map(chipTag)));
        linhasEl.append(li); });
      editor.replaceChildren(h('div', { class: 'ds-ide-aba' }, DS.icone('codigo'), h('strong', {}, arquivo), h('span', { class: 'ds-sub' }, tr('{n} linhas · {t} teste(s) · somente leitura', { n: r.data.linhas, t: info?.testes.length || 0 }))), linhasEl);
      const alvo = linha && linhasEl.querySelector(`[data-linha="${linha}"]`); if (alvo) { alvo.scrollIntoView({ block: 'center' }); const t = porLinha.get(linha); if (t) selecionar(t, alvo); }
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
  }
  async function codigoGithub(e, vg, corpo) {
    const caixa = h('div', { class: 'ds-ide' }); const arvoreEl = h('nav', { class: 'ds-ide-arvore', 'aria-label': tr('Arquivos do repositório') }); const editor = h('section', { class: 'ds-ide-editor' });
    corpo.append(agentesNoCodigo(e), DS.alerta(tr('Repositório {r} lido pelo GitHub vinculado. Para classificar testes e ler anotações Qase, vincule também a pasta local do repositório.', { r: vg.recurso.chave }), null, 'escudo'), caixa); caixa.append(arvoreEl, editor);
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
