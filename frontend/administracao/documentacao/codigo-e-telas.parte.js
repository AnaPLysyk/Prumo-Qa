/** Administracao: mostra o codigo com explicacoes e organiza a Documentacao Viva. */
  /** Código do arquivo com a explicação: o que faz, papel na arquitetura, funções, canais e quem usa. */
  function leitor(mapa, arquivos) {
    const caixa = h('section', { class: 'adm-leitor', 'aria-live': 'polite', 'aria-label': tr('Código e explicação') });
    async function mostrar(caminho) {
      const a = arquivos.get(caminho); if (!a) return;
      const t = mapa.telas.find((x) => x.id === a.tela);
      const canais = (t?.canais || []).filter((c) => c.api === caminho || c.telas.includes(caminho));
      const explicacao = h('div', { class: 'adm-explica' },
        h('div', { class: 'adm-explica-topo' }, h('span', { class: 'adm-ponto', 'data-papel': a.papel, 'aria-hidden': 'true' }), h('strong', { 'data-i18n-ignore': '' }, nomeDe(caminho)), h('span', { class: 'adm-papel-chip' }, tr(PAPEIS[a.papel] || a.papel))),
        h('code', { class: 'adm-caminho', 'data-i18n-ignore': '' }, caminho),
        h('p', { class: 'adm-desc', 'data-i18n-ignore': '' }, a.descricao || tr('Sem descrição na primeira linha.')),
        mapa.papeis[a.papel] ? h('p', { class: 'adm-papel-desc', 'data-i18n-ignore': '' }, mapa.papeis[a.papel]) : null,
        a.funcoes.length ? h('div', { class: 'adm-chips', 'data-i18n-ignore': '' }, a.funcoes.slice(0, 24).map((f) => h('span', { class: 'adm-chip' }, f + '()'))) : null,
        canais.length ? h('div', { class: 'adm-chips', 'data-i18n-ignore': '' }, canais.map((c) => h('span', { class: 'adm-chip canal' }, c.canal))) : null,
        a.usadoPor ? h('p', { class: 'adm-usado' }, tr('Usado por {n} arquivo(s).', { n: a.usadoPor })) : null);
      const codigo = h('div', { class: 'adm-codigo', role: 'region', 'aria-label': tr('Código de {a}', { a: nomeDe(caminho) }) }, DS.carregando());
      caixa.replaceChildren(explicacao, codigo);
      const r = await chamar(() => api.administracaoCodigo(caminho)); if (!caixa.isConnected || !r) { if (!r) codigo.replaceChildren(DS.alerta('Código indisponível para este arquivo.', 'aviso')); return; }
      const pre = h('pre', { 'data-i18n-ignore': '' }), linhas = r.texto.split('\n');
      linhas.forEach((l, i) => pre.append(h('span', { class: 'adm-ln' }, String(i + 1)), l + '\n'));
      codigo.replaceChildren(pre, r.truncado ? DS.alerta('Arquivo grande: mostrando os primeiros 200 KB.', 'aviso') : null);
    }
    caixa.append(DS.estadoTela('vazio', 'Escolha um arquivo', 'Na árvore à esquerda ou numa bolinha do fluxo. O código aparece aqui com a explicação.', [], { compacto: true }));
    return { no: caixa, mostrar };
  }

  function documentacao(area, mapa) {
    const arquivos = indexar(mapa);
    const busca = DS.busca({ id: 'adm-busca', placeholder: 'Procurar arquivo, função ou canal', rotulo: 'Procurar na documentação' });
    const telaSel = DS.selecao({ id: 'adm-tela', rotulo: 'Tela', opcoes: mapa.telas.map((t) => [t.id, tr(t.id)]), valor: 'agentes', aoMudar: (v) => { telaAtual = v; fx.desenhar(v, selecionado); } });
    let telaAtual = mapa.telas.some((t) => t.id === 'agentes') ? 'agentes' : mapa.telas[0]?.id, selecionado = null;
    const escolher = (caminho) => { const a = arquivos.get(caminho); if (!a) return; if (busca.input.value && !paraBusca(a.caminho + ' ' + (a.descricao || '') + ' ' + a.funcoes.join(' ')).includes(paraBusca(busca.input.value))) { busca.input.value = ''; arv.filtrar(''); } selecionado = caminho; telaAtual = a.tela; telaSel.value = a.tela; arv.marcar(caminho); fx.desenhar(a.tela, caminho); void lt.mostrar(caminho); };
    const arv = arvore(arquivos, escolher), fx = fluxo(mapa, arquivos, escolher), lt = leitor(mapa, arquivos);
    const alternar = DS.acao('Tela inteira', () => { const inteira = fx.alternar(); alternar.lastChild.textContent = tr(inteira ? 'Caminho do arquivo' : 'Tela inteira'); alternar.setAttribute('aria-pressed', String(inteira)); }, { id: 'adm-fluxo-modo', compacto: true });
    busca.input.addEventListener('input', () => arv.filtrar(busca.input.value));
    const origem = DS.info(tr('Gerado do código da versão {v} no build ({quando}). Procure pelo nome da tela do menu: a fonte visual fica em frontend/<tela>/, e a lógica em backend/<tela>/. Arquivos de servidor HTTP aparecem na seção servidor/; não edite cópias de dist/.', { v: mapa.versao + (mapa.commit ? ' · ' + mapa.commit : ''), quando: new Date(mapa.geradoEm).toLocaleString() }), { id: 'adm-origem' });
    const ide = h('div', { class: 'adm-ide', id: 'adm-telas' },
      h('aside', { class: 'adm-col adm-col-arvore' }, h('div', { class: 'adm-col-topo' }, h('span', {}, tr('Arquivos')), origem), busca.no, arv.no),
      h('section', { class: 'adm-col adm-col-fluxo' }, h('div', { class: 'adm-col-topo' }, h('span', {}, tr('Fluxo')), h('span', { class: 'adm-fluxo-acoes' }, telaSel, alternar)), fx.no),
      h('section', { class: 'adm-col adm-col-codigo' }, lt.no));
    area.replaceChildren(ide);
    fx.desenhar(telaAtual, null);
    // O explorador ocupa a altura que sobra na janela.
    const medir = () => { if (!ide.isConnected) { removeEventListener('resize', medir); return; } ide.style.height = Math.max(420, innerHeight - ide.getBoundingClientRect().top - 16) + 'px'; };
    requestAnimationFrame(medir); addEventListener('resize', medir);
  }

