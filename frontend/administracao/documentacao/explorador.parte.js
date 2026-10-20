/** Administracao: indexa e apresenta a arvore de arquivos. */
  /** Índice de arquivos: caminho → { tela, papel, descrição, funções, canais em que aparece }. */
  function indexar(mapa) {
    const arquivos = new Map();
    for (const t of mapa.telas) {
      for (const a of t.frontend) arquivos.set(a.caminho, { ...a, tela: t.id, papel: 'interface' });
      for (const [papel, lista] of Object.entries(t.backend)) for (const a of lista) arquivos.set(a.caminho, { ...a, tela: t.id, papel });
      for (const a of t.testes) arquivos.set(a.caminho, { ...a, funcoes: [], usadoPor: 0, tela: t.id, papel: 'teste' });
    }
    return arquivos;
  }

  /** Árvore como o Explorer do VS Code: pastas recolhíveis, arquivo selecionado em destaque, busca que abre o caminho. */
  function arvore(arquivos, aoEscolher) {
    const abertas = new Set(['frontend', 'backend', 'testes']); let selecionado = null, filtro = '';
    const raiz = h('div', { class: 'adm-arvore', role: 'tree', 'aria-label': tr('Arquivos do aplicativo') });
    function montar() {
      const casa = (a) => !filtro || paraBusca(a.caminho + ' ' + (a.descricao || '') + ' ' + a.funcoes.join(' ')).includes(filtro);
      const nos = {}; for (const a of [...arquivos.values()].filter(casa)) { let n = nos; const partes = a.caminho.split('/'); partes.slice(0, -1).forEach((p) => { n = (n[p] ||= {}); }); (n['\0'] ||= []).push(a); }
      const pasta = (nome, n, prefixo, nivel) => {
        const caminho = prefixo ? prefixo + '/' + nome : nome, aberta = !!filtro || abertas.has(caminho);
        const linha = comNivel(h('button', { type: 'button', class: 'adm-no adm-pasta-no', role: 'treeitem', 'aria-expanded': String(aberta), onclick: () => { aberta ? abertas.delete(caminho) : abertas.add(caminho); montar(); } }, h('span', { class: 'adm-seta', 'aria-hidden': 'true' }, aberta ? '▾' : '▸'), h('span', { 'data-i18n-ignore': '' }, nome)), nivel);
        return [linha, ...(aberta ? filhos(n, caminho, nivel + 1) : [])];
      };
      const filhos = (n, prefixo, nivel) => [...Object.keys(n).filter((k) => k !== '\0').sort((a, b) => String(a).localeCompare(String(b))).flatMap((k) => pasta(k, n[k], prefixo, nivel)),
        ...(n['\0'] || []).sort((a, b) => a.caminho.localeCompare(b.caminho)).map((a) => comNivel(h('button', { type: 'button', class: 'adm-no adm-arquivo-no' + (a.caminho === selecionado ? ' ativo' : ''), role: 'treeitem', 'aria-selected': String(a.caminho === selecionado), 'data-caminho': a.caminho, title: a.descricao || a.caminho, onclick: () => aoEscolher(a.caminho) }, h('span', { class: 'adm-ponto', 'data-papel': a.papel, 'aria-hidden': 'true' }), h('span', { 'data-i18n-ignore': '' }, nomeDe(a.caminho))), nivel))];
      raiz.replaceChildren(...filhos(nos, '', 0));
      if (!raiz.children.length) raiz.append(h('p', { class: 'adm-vazio' }, tr('Nada encontrado.')));
    }
    function marcar(caminho) { selecionado = caminho; const partes = caminho.split('/'); for (let i = 1; i < partes.length; i++) abertas.add(partes.slice(0, i).join('/')); montar(); raiz.querySelector('.adm-arquivo-no.ativo')?.scrollIntoView({ block: 'nearest' }); }
    function filtrar(q) { filtro = paraBusca(q.trim()); montar(); }
    montar();
    return { no: raiz, marcar, filtrar };
  }

