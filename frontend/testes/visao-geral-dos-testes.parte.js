/** Reúne trecho visual da função testes para o bundle testes-v40. */
'use strict';
// Testes (v40): representação do que existe no Qase e no código do projeto, com a ligação explícita entre eles.
// Fontes: catálogo estático do repositório (testes:catalogo/testes:arquivo), Qase vinculado (servicoConsultar),
// vínculos declarados (relações do projeto) e resultados registrados no Prumo (runs). Uma ligação caso ↔ código só
// existe por anotação no código (qase(31), qase.id(31), @qase(31), "Qase: SFQ-31") ou por vínculo declarado.
(() => {
  const F = window.PrumoFluxos; if (!F) return;
  const { vinc, relacoesDe, outroLado, tipoCaso, rotuloTipoCaso, resultadosLocais, ticketsExternos } = F;
  const nomesNivel = { unitario: 'Unitário', integracao: 'Integração/API', funcional: 'Funcional (E2E)', regressao: 'Regressão', smoke: 'Smoke', desempenho: 'Desempenho', acessibilidade: 'Acessibilidade', indefinido: 'Não classificado' };
  const chipNivel = (t) => h('span', { class: 'tipo t-' + t }, tr(nomesNivel[t] || t));
  const chipTag = (t) => h('span', { class: 'ds-chip ds-tag' }, '@' + t);

  /** Carrega e memoriza o catálogo do código e os casos do Qase do projeto (uma vez por sessão, com "Atualizar"). */
  async function fontes(e, { forcar = false } = {}) {
    const mem = memoriaDaTela('testes', e.id); if (forcar) { delete mem.catalogo; delete mem.casos; delete mem.runsLocais; }
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
    const vq = vinc(e, 'qase'), vg = vinc(e, 'github'); const mem = memoriaDaTela('testes', e.id);
    const perm = vq ? await escritaDoProjeto(e) : {}; const esc = !!perm.qase;
    const acoes = { repositorio: [DS.acao('Atualizar', async () => { await fontes(e, { forcar: true }); delete mem.casos; void mostrar('testes'); }, { id: 'testes-atualizar', icone: 'atualizar' }),
        ...(vq ? [DS.acao('Consulta avançada', () => F.avancadaQase(e), { id: 'testes-avancada', icone: 'filtro' }), DS.acao('Nova suite', () => F.novaSuite(e, esc), { id: 'su-nova', icone: 'mais' })] : []),
        ...(vq ? [DS.acao('Nova proposta de caso', () => F.novaProposta(e), { id: 'pr-nova', icone: 'mais' }),
          DS.acao('Novo caso no Qase', () => F.novoCasoQase(e), { id: 'qase-novo', primaria: true, icone: 'mais', desabilitado: !esc, titulo: !esc ? 'Habilite a escrita no Qase em Conexões.' : null })]
          : [DS.acao('Novo caso local', () => F.novaProposta(e), { id: 'pr-nova', primaria: true, icone: 'mais' })])],
      planos: [DS.acao('Novo plano', () => F.novoPlano(e, esc), { id: 'plano-novo', primaria: true, icone: 'mais' })],
      runs: [DS.acao('Preparar run', () => F.prepararRun(e), { id: 'run-nova', primaria: true, icone: 'mais' })] }[sub] || [];
    const origem = e.pastaLocal ? DS.origem('local', tr('Repositório local')) : vg ? DS.origem('github', 'GitHub · ' + vg.recurso.chave) : !vq ? DS.origem('prumo', 'Casos locais no Prumo') : h('span', { class: 'ds-chip', 'data-tom': 'aviso' }, tr('Sem repositório vinculado'));
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
    if (!vq) await F.telaCasosLocais(e, mem, corpo);
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
    if (src.cat?.semPasta && !vq) {
      const titulo = mem.totalCasosLocais ? 'Catálogo de automação não vinculado' : 'Nenhum código de teste vinculado';
      const descricao = mem.totalCasosLocais
        ? 'Seus casos e suítes locais continuam disponíveis acima. Vincule uma pasta em Projetos apenas se quiser analisar automações do código.'
        : 'Você já pode criar casos e suítes locais sem Qase ou GitHub. Para analisar automações, vincule uma pasta de código em Projetos.';
      area.replaceChildren(DS.estadoTela('vazio', titulo, descricao, [
        DS.acao('Vincular pasta…', async () => { const x = await chamar(() => api.espacoPasta(e.id)); if (x && !x.canceled) { delete mem.catalogo; void mostrar('testes'); } }, { id: 'cat-vincular', primaria: true }),
        DS.acao('Abrir Projetos', () => void mostrar('projetos'))
      ], { id: 'cat-sem-pasta' }));
      return;
    }
    const m = modelo(e, src); const c = src.cat?.catalogo;
    const f = (mem.fVisao ||= { q: '', fonte: '', nivel: '', execucao: '', tags: [], agrupar: 'tag' }); const tagsAtivas = new Set(f.tags);
    const todasTags = [...m.linhas.reduce((acc, l) => { for (const t of l.tags) acc.set(t, (acc.get(t) || 0) + 1); return acc; }, new Map()).entries()].sort((a, b) => b[1] - a[1]);
    const busca = DS.busca({ id: 'cat-busca', placeholder: 'Buscar caso ou teste', rotulo: 'Buscar caso, teste ou arquivo', valor: f.q });
    const fonte = DS.selecao({ id: 'cat-fonte', rotulo: 'Fonte', opcoes: [['', 'Todas as fontes'], ['ligados', 'Caso com código'], ['qase', 'Só no Qase'], ['codigo', 'Só no código']], valor: f.fonte });
    const nivel = DS.selecao({ id: 'cat-nivel', rotulo: 'Nível', opcoes: [['', 'Todos os níveis'], ...Object.entries(nomesNivel).filter(([k]) => m.linhas.some((l) => l.niveis.includes(k)))], valor: f.nivel });
    const execucao = DS.selecao({ id: 'cat-execucao', rotulo: 'Execução', opcoes: [['', 'Manual e automatizado'], ['manual', 'Manual'], ['automatizado', 'Automatizado'], ['planejado', 'Automação planejada']], valor: f.execucao });
    const agrupar = DS.selecao({ id: 'cat-agrupar', rotulo: 'Agrupar por', opcoes: [['tag', 'Agrupar por tag'], ['feature', 'Agrupar por feature'], ['nivel', 'Agrupar por nível'], ['', 'Sem agrupamento']], valor: f.agrupar });
    const chips = h('div', { class: 'met-barra', id: 'cat-tipos', role: 'group', 'aria-label': tr('Tags') }, todasTags.slice(0, 30).map(([t, n]) => h('label', { class: 'chip-modulo' }, h('input', { type: 'checkbox', 'data-tag': t, checked: tagsAtivas.has(t), onchange: (ev) => { if (ev.target.checked) tagsAtivas.add(t); else tagsAtivas.delete(t); desenhar(); } }), '@' + t + ' · ' + n)));
    const lista = h('div', { id: 'cat-lista' });
    const autoQaseSemCodigo = m.linhas.filter((l) => l.caso && !l.impl.length && l.execucao === 'automatizado').length;
    area.replaceChildren(...[
      DS.resumo([[src.casos ? src.casos.itens.length : '—', 'casos carregados do Qase'], [m.codigo.length, 'testes no código'], [m.ligados, 'casos com código', m.ligados ? 'ok' : null], [m.linhas.filter((l) => l.caso && !l.impl.length).length, 'casos sem código'], [autoQaseSemCodigo, 'automatizados no Qase sem código', autoQaseSemCodigo ? 'aviso' : null], [m.linhas.filter((l) => !l.caso).length, 'testes sem caso']], { id: 'cat-resumo' }),
      DS.barra(busca.no, fonte, nivel, execucao, agrupar), todasTags.length ? chips : null, lista,
      src.casos?.proxima != null ? DS.barra(DS.acao('Carregar mais casos do Qase', async () => {
        const offset = src.casos.proxima;
        const proxima = await F.carregarQase(e, mem, 'casos', { offset, limite: 100 });
        if (proxima.erro) return; // Não mascarar falha com dados locais nem perder o que já foi consultado.
        if (proxima.proxima != null && proxima.proxima <= offset) { avisar(tr('O Qase devolveu uma página sem avanço. Atualize a consulta.'), true); return; }
        const unicos = new Map([...src.casos.itens, ...proxima.itens].map(c => [String(c.id), c]));
        mem.casos = { itens: [...unicos.values()], proxima: proxima.proxima, em: proxima.em };
        void mostrar('testes');
      }, { id: 'cat-carregar-mais', icone: 'mais' })) : null,
      DS.info('A ligação caso ↔ código vem de anotação no código (qase(31), qase.id(31), @qase(31) ou "Qase: SFQ-31") ou de vínculo declarado; nomes parecidos não ligam nada. Nível e tags vêm da leitura estática; nada foi executado.', { id: 'cat-aviso' }),
      c?.truncado ? DS.alerta('Leitura limitada: o repositório tem mais arquivos de teste do que o Prumo lê de uma vez.', 'aviso') : null,
      src.casos?.erro ? DS.alerta(tr('Casos do Qase indisponíveis: {e}', { e: src.casos.erro }), 'falha') : null, src.casos?.limitacao ? DS.info(src.casos.limitacao) : null].filter(Boolean));
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
