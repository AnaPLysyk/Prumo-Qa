'use strict';
/** Mostra a tela Administração: a documentação viva (arquivos, fluxo da tela e código com explicação) e o estado do sistema. */
(() => {
  const PAPEIS = { interface: 'Interface', api: 'Canal (api)', regras: 'Regra', banco: 'Dados (banco)', integracoes: 'Integração', tipos: 'Tipos', outros: 'Outro', teste: 'Teste' };
  const COLUNAS = [['tela', 'Tela'], ['interface', 'Interface'], ['canal', 'Canais'], ['api', 'API'], ['nucleo', 'Regras e dados'], ['teste', 'Testes']];
  const normal = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const nomeDe = (c) => c.split('/').pop();
  const comNivel = (no, nivel) => { no.style.setProperty('--nivel', String(nivel)); return no; };

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
      const casa = (a) => !filtro || normal(a.caminho + ' ' + (a.descricao || '') + ' ' + a.funcoes.join(' ')).includes(filtro);
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
    function filtrar(q) { filtro = normal(q.trim()); montar(); }
    montar();
    return { no: raiz, marcar, filtrar };
  }

  /** Fluxo da tela em canvas: bolinhas por coluna (tela → interface → canais → API → regras e dados → testes) ligadas pelo que o código chama. */
  function fluxo(mapa, arquivos, aoEscolher) {
    const NS = 'http://www.w3.org/2000/svg'; const sv = (tag, at) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(at || {})) e.setAttribute(k, v); return e; };
    const caixa = h('div', { class: 'adm-fluxo', role: 'region', 'aria-label': tr('Fluxo da tela') });
    let inteira = false, ultimo = null;
    function desenhar(telaId, selecionado) {
      ultimo = [telaId, selecionado];
      const t = mapa.telas.find((x) => x.id === telaId); if (!t) { caixa.replaceChildren(); return; }
      const backend = Object.entries(t.backend).filter(([p]) => p !== 'api').flatMap(([, l]) => l);
      const chamados = new Set(t.canais.flatMap((c) => c.chama));
      const ligado = (a) => a.funcoes.some((f) => chamados.has(f)); const soltos = backend.filter((a) => !ligado(a) && a.caminho !== selecionado);
      // Só o que os canais chamam (e o arquivo escolhido); o resto vira um item de contagem para o fluxo continuar legível.
      const nucleo = [...backend.filter((a) => ligado(a) || a.caminho === selecionado)];
      const colunas = { tela: [{ id: 'tela:' + t.id, rotulo: t.id, dica: t.descricao }], interface: t.frontend.map((a) => ({ id: a.caminho, rotulo: nomeDe(a.caminho), dica: a.descricao })),
        canal: t.canais.map((c) => ({ id: 'canal:' + c.canal, rotulo: c.canal, dica: c.ponte ? 'window.prumo.' + c.ponte : c.canal })), api: (t.backend.api || []).map((a) => ({ id: a.caminho, rotulo: nomeDe(a.caminho), dica: a.descricao })),
        nucleo: [...nucleo.map((a) => ({ id: a.caminho, rotulo: nomeDe(a.caminho), dica: a.descricao, fraco: !ligado(a) })), ...(soltos.length ? [{ id: 'soltos:' + t.id, rotulo: tr('+{n} sem ligação direta', { n: soltos.length }), dica: soltos.map((a) => nomeDe(a.caminho)).join(', '), fraco: true }] : [])], teste: t.testes.map((a) => ({ id: a.caminho, rotulo: nomeDe(a.caminho), dica: a.descricao })) };
      const arestas = [...t.frontend.map((a) => ['tela:' + t.id, a.caminho]),
        ...t.canais.flatMap((c) => [...c.telas.filter((f) => arquivos.has(f) && arquivos.get(f).tela === t.id).map((f) => [f, 'canal:' + c.canal]), ['canal:' + c.canal, c.api],
          ...backend.filter((a) => a.funcoes.some((f) => c.chama.includes(f))).map((a) => [c.api, a.caminho])]),
        ...t.testes.map((a) => ['tela:' + t.id, a.caminho])];
      // Com um arquivo escolhido, só o caminho dele: quem leva até ele (acima) e o que ele aciona (abaixo).
      if (selecionado && !inteira) {
        const foco = new Set([selecionado]); const andar = (de, para) => { const fila = [selecionado]; while (fila.length) { const x = fila.shift(); for (const e of arestas) if (e[de] === x && !foco.has(e[para])) { foco.add(e[para]); fila.push(e[para]); } } };
        andar(1, 0); andar(0, 1);
        for (const k of Object.keys(colunas)) colunas[k] = colunas[k].filter((n) => foco.has(n.id));
      }
      // Fluxograma de cima para baixo: um nível por faixa (só os que têm itens), itens quebrando linha conforme a largura.
      const usadas = COLUNAS.filter(([k]) => colunas[k].length);
      const W = Math.max(320, (caixa.clientWidth || 600) - 16), LARG = 190, ALT = 30, porLinha = Math.max(1, Math.floor((W - 24) / LARG));
      const pos = new Map(); const faixas = []; let y = 8;
      for (const [chave, rotulo] of usadas) { const lista = colunas[chave], linhas = Math.ceil(lista.length / porLinha); faixas.push({ chave, rotulo, lista, y }); y += 26 + linhas * ALT + 22; }
      const H = y; const svg = sv('svg', { class: 'adm-fluxo-svg', viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': tr('Fluxo da tela {t}', { t: t.id }) });
      const camadaLinhas = sv('g', {}); svg.append(camadaLinhas);
      for (const { chave, rotulo, lista, y: y0 } of faixas) {
        const titulo = sv('text', { x: 12, y: y0 + 14, class: 'adm-fluxo-coluna' }); titulo.textContent = tr(rotulo) + ' · ' + lista.length; svg.append(titulo);
        const n0 = Math.min(porLinha, lista.length), margem = Math.max(12, (W - n0 * LARG) / 2);
        lista.forEach((n, k) => {
          const x = margem + (k % porLinha) * LARG + 10, yy = y0 + 26 + Math.floor(k / porLinha) * ALT + ALT / 2; pos.set(n.id, { x, y: yy });
          const g = sv('g', { class: 'adm-bolinha' + (n.fraco ? ' fraco' : '') + (n.id === selecionado ? ' ativo' : ''), 'data-no': n.id, 'data-coluna': chave, tabindex: arquivos.has(n.id) ? '0' : '-1', role: arquivos.has(n.id) ? 'button' : 'presentation' });
          const dica = sv('title', { 'data-i18n-ignore': '' }); dica.textContent = (n.dica || n.rotulo); g.append(dica, sv('circle', { cx: x, cy: yy, r: n.id === selecionado ? 8 : 6 }));
          const txt = sv('text', { x: x + 13, y: yy + 4, 'data-i18n-ignore': '' }); const cabe = Math.floor((LARG - 26) / 7); txt.textContent = n.rotulo.length > cabe ? n.rotulo.slice(0, cabe - 1) + '…' : n.rotulo; g.append(txt);
          if (arquivos.has(n.id)) { const ir = () => aoEscolher(n.id); g.addEventListener('click', ir); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(); } }); }
          g.addEventListener('pointerenter', () => svg.querySelectorAll(`[data-de="${CSS.escape(n.id)}"],[data-para="${CSS.escape(n.id)}"]`).forEach((l) => l.classList.add('destaque')));
          g.addEventListener('pointerleave', () => svg.querySelectorAll('.destaque').forEach((l) => l.classList.remove('destaque')));
          svg.append(g);
        });
      }
      for (const [de, para] of arestas) {
        const a = pos.get(de), b = pos.get(para); if (!a || !b) continue; const my = (a.y + b.y) / 2;
        const ligado = de === selecionado || para === selecionado;
        camadaLinhas.append(sv('path', { d: `M${a.x},${a.y + 7} C${a.x},${my} ${b.x},${my} ${b.x},${b.y - 7}`, class: 'adm-ligacao' + (ligado ? ' destaque fixo' : ''), 'data-de': de, 'data-para': para }));
      }
      caixa.replaceChildren(svg);
      caixa.querySelector('.adm-bolinha.ativo')?.scrollIntoView?.({ block: 'nearest' });
    }
    function alternar() { inteira = !inteira; if (ultimo) desenhar(...ultimo); return inteira; }
    return { no: caixa, desenhar, alternar };
  }

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
    const escolher = (caminho) => { const a = arquivos.get(caminho); if (!a) return; if (busca.input.value && !normal(a.caminho + ' ' + (a.descricao || '') + ' ' + a.funcoes.join(' ')).includes(normal(busca.input.value))) { busca.input.value = ''; arv.filtrar(''); } selecionado = caminho; telaAtual = a.tela; telaSel.value = a.tela; arv.marcar(caminho); fx.desenhar(a.tela, caminho); void lt.mostrar(caminho); };
    const arv = arvore(arquivos, escolher), fx = fluxo(mapa, arquivos, escolher), lt = leitor(mapa, arquivos);
    const alternar = DS.acao('Tela inteira', () => { const inteira = fx.alternar(); alternar.lastChild.textContent = tr(inteira ? 'Caminho do arquivo' : 'Tela inteira'); alternar.setAttribute('aria-pressed', String(inteira)); }, { id: 'adm-fluxo-modo', compacto: true });
    busca.input.addEventListener('input', () => arv.filtrar(busca.input.value));
    const origem = DS.info(tr('Gerado do código da versão {v} no build ({quando}). Procure pelo nome da tela do menu: a mesma pasta existe em frontend/ e backend/.', { v: mapa.versao + (mapa.commit ? ' · ' + mapa.commit : ''), quando: new Date(mapa.geradoEm).toLocaleString() }), { id: 'adm-origem' });
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

  function sistema(area, mapa) {
    const tot = mapa.totais;
    area.replaceChildren(
      DS.resumo([[tot.telas, 'telas'], [tot.arquivosFrontend, 'arquivos de interface'], [tot.canais, 'canais da janela'], [tot.arquivosBackend, 'arquivos do backend'], [tot.testes, 'testes']], { id: 'adm-resumo' }),
      DS.secao('Versão', DS.meta([['Versão', mapa.versao], ['Commit do build', mapa.commit || tr('não registrado')], ['Mapa gerado em', new Date(mapa.geradoEm).toLocaleString()]])),
      DS.secao('Usuários e permissões', DS.alerta(window.PrumoConta?.sessao()?.loginAtivo
        ? 'Login ligado: cada pessoa entra com a própria conta e cada tela respeita o papel dela (abas Usuários e Permissões). O worker de agendamentos, a bandeja e o servidor MCP continuam rodando com a conta deste computador.'
        : 'Login desligado: o Prumo usa a conta deste computador e todas as telas ficam liberadas. Ative o login na aba Usuários. As políticas de cada projeto (Agentes) e a confirmação nativa do sistema para executar e publicar continuam valendo.', 'info')));
  }

  // 2.11: Usuários, Permissões, Agentes e Configurações gerais ficam em gerenciarAcessos.js.
  const ACESSOS = ['usuarios', 'permissoes', 'agentes', 'geral'];
  abas.administracao = async (el) => {
    el.append(DS.cabecalho({ titulo: 'Administração', info: 'Usuários, permissões por tela, agentes da plataforma, configurações gerais e documentação viva desta versão.' }));
    const area = h('div', { id: 'adm-area' }, DS.carregando());
    const sub = estado.sub?.administracao || 'usuarios'; let mapa = null;
    const trocar = async (k) => {
      (estado.sub ||= {}).administracao = k;
      if (ACESSOS.includes(k)) return window.PrumoAdministracaoAcessos[k](area);
      mapa ||= await chamar(() => api.administracaoMapa());
      if (!mapa) { area.replaceChildren(DS.estadoTela('erro', 'Documentação indisponível', 'O mapa é gerado no build do aplicativo. Gere de novo com npm run build.', [], { id: 'adm-erro' })); return; }
      if (k === 'sistema') sistema(area, mapa); else documentacao(area, mapa);
    };
    el.append(DS.abas([['usuarios', 'Usuários'], ['permissoes', 'Permissões'], ['agentes', 'Agentes'], ['geral', 'Configurações gerais'], ['documentacao', 'Documentação viva'], ['sistema', 'Sistema']], sub, trocar, { id: 'adm-abas', rotulo: 'Seções da administração' }), area);
    await trocar(sub);
  };
})();
