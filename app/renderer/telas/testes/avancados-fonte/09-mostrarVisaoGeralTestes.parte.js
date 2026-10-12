/** Mostra a visão geral do catálogo e resultados. Parte de testes-v40.js; nao carregar isoladamente. */
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
