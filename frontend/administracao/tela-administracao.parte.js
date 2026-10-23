/** Administração: tela, documentação e navegação internas. */
'use strict';
/** Mostra a tela Administração: a documentação viva (arquivos, fluxo da tela e código com explicação) e o estado do sistema. */
(() => {
  const PAPEIS = { interface: 'Interface', api: 'Canal (api)', regras: 'Regra', banco: 'Dados (banco)', integracoes: 'Integração', tipos: 'Tipos', servidor: 'API HTTP (Render)', outros: 'Outro', teste: 'Teste' };
  const COLUNAS = [['tela', 'Tela'], ['interface', 'Interface'], ['canal', 'Canais'], ['api', 'API'], ['nucleo', 'Regras e dados'], ['teste', 'Testes']];
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
    /** A largura da coluna mudou (divisória, recolher ou janela): o fluxo se redistribui. */
    function redesenhar() { if (ultimo) desenhar(...ultimo); }
    return { no: caixa, desenhar, alternar, redesenhar };
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
    const escolher = (caminho) => { const a = arquivos.get(caminho); if (!a) return; if (busca.input.value && !paraBusca(a.caminho + ' ' + (a.descricao || '') + ' ' + a.funcoes.join(' ')).includes(paraBusca(busca.input.value))) { busca.input.value = ''; arv.filtrar(''); } selecionado = caminho; telaAtual = a.tela; telaSel.value = a.tela; arv.marcar(caminho); if (painel.codigoFechado) { painel.codigoFechado = false; aplicar(); } fx.desenhar(a.tela, caminho); void lt.mostrar(caminho); };
    const arv = arvore(arquivos, escolher), fx = fluxo(mapa, arquivos, escolher), lt = leitor(mapa, arquivos);
    const alternar = DS.acao('Tela inteira', () => { const inteira = fx.alternar(); alternar.lastChild.textContent = tr(inteira ? 'Caminho do arquivo' : 'Tela inteira'); alternar.setAttribute('aria-pressed', String(inteira)); }, { id: 'adm-fluxo-modo', compacto: true });
    busca.input.addEventListener('input', () => arv.filtrar(busca.input.value));
    const origem = DS.info(tr('Gerado do código da versão {v} no build ({quando}). Procure pelo nome da tela do menu: a fonte visual fica em frontend/<tela>/, e a lógica em backend/<tela>/. Arquivos de servidor HTTP aparecem na seção servidor/; não edite cópias de dist/.', { v: mapa.versao + (mapa.commit ? ' · ' + mapa.commit : ''), quando: new Date(mapa.geradoEm).toLocaleString() }), { id: 'adm-origem' });

    // Colunas ajustáveis: Arquivos e Código recolhem num trilho, as divisórias mudam a largura e o Código pode ocupar a área toda.
    // As medidas ficam só neste computador (preferência visual de quem usa).
    const CHAVE = 'prumo-docviva-colunas';
    const salvo = (() => { try { return JSON.parse(localStorage.getItem(CHAVE) || '{}') || {}; } catch { return {}; } })();
    const painel = { arvore: Number(salvo.arvore) || 250, codigo: Number(salvo.codigo) || 460, arvoreFechada: !!salvo.arvoreFechada, codigoFechado: true, amplo: false };
    const guardar = () => { try { localStorage.setItem(CHAVE, JSON.stringify({ arvore: painel.arvore, codigo: painel.codigo, arvoreFechada: painel.arvoreFechada })); } catch { /* sem armazenamento: vale só nesta visita */ } };
    const botaoMini = (rotulo, simbolo, fn, id) => h('button', { type: 'button', class: 'adm-mini', id, title: tr(rotulo), 'aria-label': tr(rotulo), onclick: fn }, simbolo);
    const trilho = (rotulo, fn, id) => h('button', { type: 'button', class: 'adm-trilho', id, title: tr('Mostrar {c}', { c: tr(rotulo) }), 'aria-label': tr('Mostrar {c}', { c: tr(rotulo) }), onclick: fn }, h('span', { 'aria-hidden': 'true' }, '›'), h('span', { class: 'adm-trilho-rotulo' }, tr(rotulo)));
    const recolherArvore = botaoMini('Recolher Arquivos', '‹', () => { painel.arvoreFechada = true; painel.amplo = false; aplicar(); guardar(); }, 'adm-arvore-recolher');
    const ampliarCodigo = botaoMini('Ampliar Código', '⤢', () => { painel.amplo = !painel.amplo; aplicar(); }, 'adm-codigo-ampliar');
    const fecharCodigo = botaoMini('Fechar Código', '×', () => { painel.codigoFechado = true; painel.amplo = false; aplicar(); }, 'adm-codigo-fechar');
    const divisor = (rotulo, lado) => {
      const d = h('div', { class: 'adm-divisor', role: 'separator', tabindex: '0', 'aria-orientation': 'vertical', 'aria-label': tr(rotulo), title: tr('Arraste para ajustar a largura; duplo clique volta ao padrão') });
      const limites = () => { const total = ide.getBoundingClientRect().width; return lado === 'arvore' ? [180, Math.max(200, Math.min(520, total - painel.codigo - 300))] : [300, Math.max(320, total - (painel.arvoreFechada ? 44 : painel.arvore) - 260)]; };
      const ajustar = (largura) => { const [min, max] = limites(); painel[lado] = Math.round(Math.min(max, Math.max(min, largura))); aplicar(); };
      d.addEventListener('pointerdown', (ev) => {
        if (d.dataset.inativo) return; ev.preventDefault(); d.setPointerCapture(ev.pointerId); d.classList.add('arrastando');
        const x0 = ev.clientX, l0 = painel[lado];
        const mover = (m) => ajustar(lado === 'arvore' ? l0 + (m.clientX - x0) : l0 - (m.clientX - x0));
        const soltar = () => { d.classList.remove('arrastando'); d.removeEventListener('pointermove', mover); d.removeEventListener('pointerup', soltar); d.removeEventListener('pointercancel', soltar); guardar(); };
        d.addEventListener('pointermove', mover); d.addEventListener('pointerup', soltar); d.addEventListener('pointercancel', soltar);
      });
      d.addEventListener('dblclick', () => { painel[lado] = lado === 'arvore' ? 250 : 460; aplicar(); guardar(); });
      d.addEventListener('keydown', (ev) => {
        const passo = ev.shiftKey ? 64 : 24; const sinal = lado === 'arvore' ? 1 : -1;
        if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { ev.preventDefault(); ajustar(painel[lado] + (ev.key === 'ArrowRight' ? passo : -passo) * sinal); guardar(); }
        else if (ev.key === 'Home' || ev.key === 'End') { ev.preventDefault(); const [min, max] = limites(); ajustar((ev.key === 'Home') === (lado === 'arvore') ? min : max); guardar(); }
      });
      return d;
    };
    const divisorArvore = divisor('Largura de Arquivos', 'arvore'), divisorCodigo = divisor('Largura de Código', 'codigo');
    const colArvore = h('aside', { class: 'adm-col adm-col-arvore' }, trilho('Arquivos', () => { painel.arvoreFechada = false; painel.amplo = false; aplicar(); guardar(); }, 'adm-arvore-mostrar'),
      h('div', { class: 'adm-col-topo' }, h('span', {}, tr('Arquivos')), h('span', { class: 'adm-col-acoes' }, origem, recolherArvore)), busca.no, arv.no);
    const colFluxo = h('section', { class: 'adm-col adm-col-fluxo' }, trilho('Fluxo', () => { painel.amplo = false; aplicar(); }, 'adm-fluxo-mostrar'),
      h('div', { class: 'adm-col-topo' }, h('span', {}, tr('Fluxo')), h('span', { class: 'adm-fluxo-acoes' }, telaSel, alternar)), fx.no);
    const colCodigo = h('section', { class: 'adm-col adm-col-codigo' }, trilho('Código', () => { painel.codigoFechado = false; aplicar(); }, 'adm-codigo-mostrar'),
      h('div', { class: 'adm-col-topo' }, h('span', {}, tr('Código')), h('span', { class: 'adm-col-acoes' }, ampliarCodigo, fecharCodigo)), lt.no);
    const ide = h('div', { class: 'adm-ide', id: 'adm-telas' }, colArvore, divisorArvore, colFluxo, divisorCodigo, colCodigo);
    function aplicar() {
      const arvoreFechada = painel.arvoreFechada || painel.amplo;
      ide.style.setProperty('--adm-arvore', arvoreFechada ? '44px' : painel.arvore + 'px');
      ide.style.setProperty('--adm-fluxo', painel.amplo ? '44px' : 'minmax(240px, 1fr)');
      ide.style.setProperty('--adm-codigo', painel.codigoFechado ? '44px' : painel.amplo ? 'minmax(0, 1fr)' : painel.codigo + 'px');
      ide.dataset.arvore = arvoreFechada ? 'fechada' : 'aberta';
      ide.dataset.codigo = painel.codigoFechado ? 'fechado' : painel.amplo ? 'amplo' : 'aberto';
      if (arvoreFechada) divisorArvore.dataset.inativo = ''; else delete divisorArvore.dataset.inativo;
      if (painel.codigoFechado || painel.amplo) divisorCodigo.dataset.inativo = ''; else delete divisorCodigo.dataset.inativo;
      for (const [d, lado] of [[divisorArvore, 'arvore'], [divisorCodigo, 'codigo']]) { d.setAttribute('aria-valuenow', String(painel[lado])); d.tabIndex = d.dataset.inativo === undefined ? 0 : -1; }
      const rotuloAmpliar = tr(painel.amplo ? 'Voltar às três colunas' : 'Ampliar Código');
      ampliarCodigo.setAttribute('aria-pressed', String(painel.amplo)); ampliarCodigo.title = rotuloAmpliar; ampliarCodigo.setAttribute('aria-label', rotuloAmpliar);
    }
    area.replaceChildren(ide);
    aplicar();
    fx.desenhar(telaAtual, null);
    // O fluxo acompanha a largura da coluna (divisória, recolher, ampliar ou janela).
    let largura = 0, pedido = 0;
    const observador = new ResizeObserver(() => { if (!ide.isConnected) { observador.disconnect(); return; } const w = fx.no.clientWidth; if (Math.abs(w - largura) < 24) return; largura = w; cancelAnimationFrame(pedido); pedido = requestAnimationFrame(() => fx.redesenhar()); });
    observador.observe(fx.no);
    // O explorador ocupa a altura que sobra na janela.
    const medir = () => { if (!ide.isConnected) { removeEventListener('resize', medir); return; } ide.style.height = Math.max(420, innerHeight - ide.getBoundingClientRect().top - 16) + 'px'; };
    requestAnimationFrame(medir); addEventListener('resize', medir);
  }

  function sistema(area, mapa) {
    const tot = mapa.totais;
    area.replaceChildren(
      DS.resumo([[tot.telas, 'telas'], [tot.arquivosFrontend, 'arquivos de interface'], [tot.canais, 'canais da janela'], [tot.arquivosBackend, 'arquivos do backend'], [tot.testes, 'testes']], { id: 'adm-resumo' }),
      DS.secao('Versão', DS.meta([['Versão', mapa.versao], ['Commit do build', mapa.commit || tr('não registrado')], ['Mapa gerado em', new Date(mapa.geradoEm).toLocaleString()]])),
      DS.secao('Usuários e permissões', DS.alerta('Cada pessoa entra com a própria conta e cada tela respeita o papel dela (abas Usuários e Permissões). O worker de agendamentos, a bandeja e o servidor MCP continuam rodando com a conta deste computador.', 'info')));
  }

  // Administração: usuários, permissões, agentes, configurações e chamados ficam nesta fonte.
  const ACESSOS = ['usuarios', 'permissoes', 'agentes', 'geral'];
  abas.administracao = async (el) => {
    el.append(DS.cabecalho({ titulo: 'Administração', info: 'Usuários, permissões por tela, agentes da plataforma, chamados de suporte, configurações gerais e documentação viva desta versão.' }));
    const area = h('div', { id: 'adm-area' }, DS.carregando());
    const sub = estado.sub?.administracao || 'usuarios'; let mapa = null;
    const trocar = async (k) => {
      (estado.sub ||= {}).administracao = k;
      if (ACESSOS.includes(k)) return window.PrumoAdministracaoAcessos[k](area);
      if (k === 'chamados') return window.PrumoAdministracaoChamados.mostrar(area);
      mapa ||= await chamar(() => api.administracaoMapa());
      if (!mapa) { area.replaceChildren(DS.estadoTela('erro', 'Documentação indisponível', 'O mapa é gerado no build do aplicativo. Gere de novo com npm run build.', [], { id: 'adm-erro' })); return; }
      if (k === 'sistema') sistema(area, mapa); else documentacao(area, mapa);
    };
    el.append(DS.abas([['usuarios', 'Usuários'], ['permissoes', 'Permissões'], ['agentes', 'Agentes'], ['chamados', 'Chamados'], ['geral', 'Configurações gerais'], ['documentacao', 'Documentação viva'], ['sistema', 'Sistema']], sub, trocar, { id: 'adm-abas', rotulo: 'Seções da administração' }), area);
    await trocar(sub);
  };
})();


'use strict';
/** Administração › Usuários, Permissões, Agentes e Configurações gerais: contas, papéis por tela e regras gerais dos agentes da plataforma. */
// Compartilhado pelas seções da tela: alterar exige acesso de uso, não só de consulta.
const podeAlterarAdministracao = () => !window.PrumoConta || window.PrumoConta.pode('administracao') && !window.PrumoConta.soVer('administracao');
window.PrumoAdministracaoAcessos = (() => {
  const ROTULO_NIVEL = { NENHUM: 'Sem acesso', VER: 'Ver', USAR: 'Usar' };
  const ROTULO_ESTADO = { ATIVO: 'Ativa', PENDENTE: 'Aguarda aprovação', DESATIVADO: 'Desativada' };
  const TOM_ESTADO = { ATIVO: 'ok', PENDENTE: 'info', DESATIVADO: 'aviso' };
  const quando = (iso) => (iso ? new Date(iso).toLocaleString() : tr('nunca'));

  /** Senha temporária mostrada uma única vez, com botão de copiar. */
  function segredoUmaVez(titulo, explicacao, valor, depois) {
    DS.modal(titulo, [DS.alerta(explicacao, 'aviso'), h('code', { id: 'adm-segredo', class: 'entrada-codigo', 'data-i18n-ignore': '' }, valor),
      DS.rodape(DS.acao('Copiar', async () => { try { await navigator.clipboard.writeText(valor); avisar(tr('Copiado.')); } catch { avisar(tr('Não foi possível copiar; anote o valor.'), true); } }, { id: 'adm-segredo-copiar' }),
        DS.acao('Fechar', () => { DS.fecharModal(); depois?.(); }, { primaria: true, id: 'adm-segredo-fechar' }))], { tamanho: 'sm' });
  }

  /* ---------- Usuários ---------- */
  function novaConta(papeis, recarregar) {
    const nome = h('input', { id: 'nova-nome', type: 'text', maxlength: 80 });
    const login = h('input', { id: 'nova-login', type: 'text', maxlength: 40, autocapitalize: 'off', spellcheck: 'false' });
    const papel = DS.selecao({ id: 'nova-papel', rotulo: 'Papel', opcoes: papeis.map((p) => [p.id, p.nome]), valor: 'qa' });
    const admin = h('input', { id: 'nova-admin', type: 'checkbox' });
    DS.modal('Nova conta', [h('p', { class: 'suave' }, tr('O Prumo gera uma senha temporária. Entregue-a à pessoa: ela troca a senha no primeiro acesso.')),
      DS.campo('Nome', nome), DS.campo('Login', login), DS.campo('Papel', papel),
      h('label', { class: 'adm-admin' }, admin, ' ', tr('Admin: vê a tela Administração')),
      DS.rodape(DS.acao('Criar conta', async () => {
        const r = await chamar(() => api.usuariosCriar(login.value, nome.value, papel.value, admin.checked)); if (!r) return;
        DS.fecharModal(); segredoUmaVez('Senha temporária de ' + r.conta.nome, 'Entregue esta senha à pessoa por um canal seguro. Ela aparece só agora; no primeiro acesso a pessoa define a própria senha.', r.senhaTemporaria, recarregar);
      }, { primaria: true, id: 'nova-criar' }))], { tamanho: 'sm' });
  }

  async function usuarios(area) {
    area.replaceChildren(DS.carregando());
    const [lista, papeis] = await Promise.all([chamar(() => api.usuariosListar()), chamar(() => api.papeisListar())]);
    if (!lista || !papeis) return area.replaceChildren(DS.falhaConsulta('administracao'));
    const recarregar = () => usuarios(area); const alterar = podeAlterarAdministracao();
    const agir = (fn, ok) => async () => { const r = await chamar(fn); if (r) { if (ok) avisar(tr(ok)); void recarregar(); } };
    const linhas = lista.contas.map((c) => {
      const eu = c.id === lista.voce;
      const papel = DS.selecao({ id: 'papel-' + c.login, rotulo: 'Papel de ' + c.login, opcoes: papeis.papeis.map((p) => [p.id, p.nome]), valor: c.papel, aoMudar: async (v) => { const r = await chamar(() => api.usuariosAlterar(c.id, { papel: v })); if (r) avisar(tr('Papel alterado.')); void recarregar(); } });
      papel.disabled = !alterar || eu;
      // Marca admin: só ela libera a tela Administração; o papel cuida das telas de trabalho.
      const admin = h('input', { type: 'checkbox', id: 'admin-' + c.login, 'aria-label': tr('Admin: {n}', { n: c.login }), title: eu ? tr('Você não pode tirar a própria marca de admin.') : null });
      admin.checked = !!c.admin; admin.disabled = !alterar || eu || c.estado !== 'ATIVO';
      admin.addEventListener('change', async () => { const r = await chamar(() => api.usuariosAlterar(c.id, { admin: admin.checked })); if (r) avisar(tr(admin.checked ? 'Conta marcada como admin.' : 'Marca de admin retirada.')); void recarregar(); });
      const acoes = alterar ? [
        c.estado === 'PENDENTE' ? DS.acao('Aprovar', agir(() => api.usuariosAlterar(c.id, { estado: 'ATIVO' }), 'Cadastro aprovado.'), { compacto: true, primaria: true, id: 'aprovar-' + c.login }) : null,
        !eu ? DS.acao('Redefinir senha', async () => { const r = await chamar(() => api.usuariosSenha(c.id)); if (r) segredoUmaVez('Senha temporária de ' + c.nome, 'Entregue esta senha à pessoa por um canal seguro. Ela aparece só agora; no próximo acesso a pessoa define a própria senha.', r.senhaTemporaria, recarregar); }, { compacto: true, id: 'redefinir-' + c.login }) : null,
        c.bloqueada ? DS.acao('Desbloquear', agir(() => api.usuariosDesbloquear(c.id), 'Conta desbloqueada.'), { compacto: true, id: 'desbloquear-' + c.login }) : null,
        !eu && c.estado === 'ATIVO' ? DS.acao('Desativar', agir(() => api.usuariosAlterar(c.id, { estado: 'DESATIVADO' }), 'Conta desativada.'), { compacto: true, classe: 'perigo', id: 'desativar-' + c.login }) : null,
        !eu && c.estado === 'DESATIVADO' ? DS.acao('Reativar', agir(() => api.usuariosAlterar(c.id, { estado: 'ATIVO' }), 'Conta reativada.'), { compacto: true, id: 'reativar-' + c.login }) : null,
        !eu && c.estado !== 'ATIVO' ? DS.acao('Excluir', agir(() => api.usuariosExcluir(c.id), 'Conta excluída.'), { compacto: true, classe: 'perigo', id: 'excluir-' + c.login }) : null
      ].filter(Boolean) : [];
      return { attrs: { 'data-conta': c.login }, celulas: [
        h('div', {}, h('strong', { 'data-i18n-ignore': '' }, c.nome), eu ? [' ', DS.chip('você', 'info')] : null, h('div', { class: 'suave' }, semTraducao(c.login))),
        { no: papel }, { no: h('label', { class: 'adm-admin' }, admin) }, { no: h('div', { class: 'adm-estado' }, DS.chip(ROTULO_ESTADO[c.estado], TOM_ESTADO[c.estado]), c.bloqueada ? DS.chip('Bloqueada', 'falha') : null, c.trocarSenha ? DS.chip('Senha temporária', 'aviso') : null) },
        quando(c.ultimoAcesso), { no: h('div', { class: 'adm-acoes' }, ...acoes), classe: 'ds-acao' }] };
    });
    const conta = (e) => lista.contas.filter((c) => c.estado === e).length;
    area.replaceChildren(
      DS.resumo([[conta('ATIVO'), 'ativas', 'ok'], [conta('PENDENTE'), 'aguardam aprovação', 'info'], [conta('DESATIVADO'), 'desativadas'], [lista.contas.filter((c) => c.bloqueada).length, 'bloqueadas', 'falha']], { id: 'adm-usuarios-resumo' }),
      h('div', { class: 'adm-barra' }, h('p', { class: 'suave' }, tr('O papel define as telas de trabalho (aba Permissões). A tela Administração só aparece para quem tem a marca Admin.')),
        alterar ? DS.acao('Nova conta', () => novaConta(papeis.papeis, recarregar), { primaria: true, icone: 'mais', id: 'adm-nova-conta' }) : null),
      DS.tabela({ id: 'adm-usuarios', colunas: ['Pessoa', 'Papel', 'Admin', 'Situação', 'Último acesso', 'Ações'], linhas }));
  }

  /* ---------- Permissões ---------- */
  async function permissoes(area) {
    area.replaceChildren(DS.carregando());
    const d = await chamar(() => api.papeisListar()); if (!d) return area.replaceChildren(DS.falhaConsulta('administracao'));
    const alterar = podeAlterarAdministracao(); const editados = new Map(d.papeis.map((p) => [p.id, { ...p.telas }]));
    const sujos = new Set(); const salvar = DS.acao('Salvar permissões', async () => {
      for (const id of sujos) { const p = d.papeis.find((x) => x.id === id); const r = await chamar(() => api.papeisSalvar({ id, nome: p.nome, descricao: p.descricao, telas: editados.get(id) })); if (!r) return; }
      avisar(tr('Permissões salvas. Valem no próximo pedido de cada pessoa.')); void permissoes(area);
    }, { primaria: true, id: 'perm-salvar', desabilitado: true });
    const celula = (p, m) => {
      if (p.fixo) return { no: DS.chip(ROTULO_NIVEL.USAR, 'ok') };
      const s = DS.selecao({ id: 'perm-' + p.id + '-' + m.id, rotulo: p.nome + ' em ' + m.rotulo, opcoes: d.niveis.map((n) => [n, ROTULO_NIVEL[n]]), valor: editados.get(p.id)[m.id] || 'NENHUM',
        aoMudar: (v) => { editados.get(p.id)[m.id] = v; sujos.add(p.id); salvar.disabled = false; s.dataset.nivel = v; } });
      s.dataset.nivel = s.value; s.disabled = !alterar; return { no: s };
    };
    const cabecalho = d.papeis.map((p) => ({ t: h('span', { class: 'perm-papel' }, h('span', { 'data-i18n-ignore': '' }, p.nome), h('span', { class: 'suave' }, tr('{n} conta(s)', { n: p.contas }))) }));
    const tabela = DS.tabela({ id: 'perm-matriz', colunas: ['Tela', ...cabecalho], linhas: d.modulos.filter((m) => m.id !== 'administracao').map((m) => ({ attrs: { 'data-tela': m.id }, celulas: [h('strong', {}, tr(m.rotulo)), ...d.papeis.map((p) => celula(p, m))] })) });
    const papeisEditaveis = d.papeis.filter((p) => !p.fixo);
    area.replaceChildren(
      DS.alerta('Sem acesso: a tela some do menu. Ver: só consulta. Usar: consulta e altera. A regra vale no servidor, não só na tela. A Administração não está aqui: ela depende da marca Admin na aba Usuários.', 'info'),
      h('div', { class: 'adm-barra' }, alterar ? [DS.acao('Novo papel', () => novoPapel(d, () => permissoes(area)), { icone: 'mais', id: 'perm-novo' }), salvar] : DS.notaPermissao('Seu papel só permite consultar as permissões.')),
      h('div', { class: 'perm-caixa' }, tabela),
      DS.secao('Papéis', h('ul', { class: 'adm-lista perm-lista' }, d.papeis.map((p) => h('li', { class: 'adm-arquivo', 'data-papel': p.id }, h('strong', { 'data-i18n-ignore': '' }, p.nome), h('span', { class: 'adm-desc', 'data-i18n-ignore': '' }, p.descricao || '—'),
        h('span', { class: 'suave' }, p.fixo ? tr('Fixo: todas as telas de trabalho.') : tr('{n} conta(s)', { n: p.contas }) + (p.id === d.papelDoCadastro ? ' · ' + tr('papel de novos cadastros') : '')),
        alterar && !p.fixo ? h('div', {}, DS.acao('Excluir papel', async () => { const r = await chamar(() => api.papeisExcluir(p.id)); if (r) { avisar(tr('Papel excluído.')); void permissoes(area); } }, { compacto: true, classe: 'perigo', id: 'perm-excluir-' + p.id, desabilitado: p.contas > 0 || p.id === d.papelDoCadastro, titulo: p.contas > 0 ? 'Troque o papel das contas antes de excluir.' : null })) : null)))),
      papeisEditaveis.length ? null : DS.texto(null, 'Nenhum papel editável.'));
  }

  function novoPapel(d, depois) {
    const nome = h('input', { id: 'papel-nome', type: 'text', maxlength: 40 });
    const descricao = h('input', { id: 'papel-descricao', type: 'text', maxlength: 200 });
    const copiar = DS.selecao({ id: 'papel-base', rotulo: 'Começar igual a', opcoes: d.papeis.map((p) => [p.id, p.nome]), valor: 'leitor' });
    DS.modal('Novo papel', [DS.campo('Nome', nome), DS.campo('Descrição', descricao), DS.campo('Começar com as permissões de', copiar, { ajuda: 'Depois ajuste cada tela na matriz.' }),
      DS.rodape(DS.acao('Criar papel', async () => {
        const base = d.papeis.find((p) => p.id === copiar.value); const telas = { ...base.telas }; if (base.fixo) telas.administracao = 'NENHUM';
        const r = await chamar(() => api.papeisSalvar({ nome: nome.value, descricao: descricao.value, telas })); if (!r) return;
        DS.fecharModal(); avisar(tr('Papel criado.')); depois();
      }, { primaria: true, id: 'papel-criar' }))], { tamanho: 'sm' });
  }

  /* ---------- Agentes da plataforma ---------- */
  async function agentes(area) {
    area.replaceChildren(DS.carregando());
    const d = await chamar(() => api.plataformaAgentes()); if (!d) return area.replaceChildren(DS.falhaConsulta('administracao'));
    const alterar = podeAlterarAdministracao();
    const caixa = (id, marcado, desabilitado) => h('input', { type: 'checkbox', id, checked: marcado, disabled: desabilitado || !alterar });
    const ligados = new Map(d.agentes.map((a) => [a.id, caixa('agente-' + a.id, a.ligado, a.fixo)]));
    const externa = caixa('plataforma-ia-externa', d.iaExterna); const orquestracao = caixa('plataforma-orquestracao', d.orquestracao);
    const perfis = { ...(d.perfis || {}) };
    function editarPerfil(a) {
      if (!alterar || a.fixo) return;
      const dados = perfis[a.id] || { nome: a.nome, profissao: a.profissao, especialidade: a.especialidade, tom: '' };
      const campos = ['nome', 'profissao', 'especialidade', 'tom'].map(k => h('input', { id: 'adm-agente-' + k, type: 'text', maxlength: k === 'tom' ? 200 : k === 'especialidade' ? 160 : 100, value: dados[k] || '' }));
      const robo = h('select', { id: 'adm-agente-robo' }, Array.from({ length: 9 }, (_, i) =>
        h('option', { value: String(i), selected: (dados.robo ?? d.agentes.findIndex(x => x.id === a.id)) === i }, 'Robô ' + (i + 1))));
      DS.modal('Perfil oficial do agente', [
        h('p', { class: 'suave' }, 'Alterações valem para todas as contas deste computador. O agente conserva as mesmas capacidades e limites de segurança.'),
        ...['Nome', 'Profissão', 'Especialidade', 'Tom e personalidade'].map((rot, i) => DS.campo(rot, campos[i])), DS.campo('Aparência do robô', robo),
        DS.rodape(DS.acao('Salvar perfil', () => {
          const [nome, profissao, especialidade, tom] = campos.map(x => x.value.trim());
          if (!nome || !profissao || !especialidade) { avisar('Preencha nome, profissão e especialidade.', true); return; }
          perfis[a.id] = { nome, profissao, especialidade, tom, robo: Number(robo.value) };
          DS.fecharModal(); avisar('Perfil preparado. Salve as regras dos agentes para aplicar.');
        }, { primaria: true, id: 'adm-agente-perfil-salvar' }))
      ], { tamanho: 'md' });
    }
    const linhas = d.agentes.map((a) => ({ attrs: { 'data-agente': a.id }, celulas: [
      { no: h('div', {}, h('label', { class: 'opcao', for: 'agente-' + a.id }, ligados.get(a.id), h('strong', { 'data-i18n-ignore': '' }, a.nome)), alterar && !a.fixo ? DS.acao('Editar perfil', () => editarPerfil(a), { id: 'adm-perfil-' + a.id }) : null) },
      h('div', {}, h('span', {}, tr(a.profissao)), h('div', { class: 'suave' }, tr(a.dominio))),
      a.fixo ? DS.chip('Sempre ligado', 'info') : a.capacidades.length ? h('span', { class: 'suave', 'data-i18n-ignore': '' }, a.capacidades.join(' · ')) : '—'] }));
    area.replaceChildren(
      DS.alerta('Estas regras valem para todos os projetos deste computador, no chat e no servidor MCP. Um projeto pode restringir mais, mas não liberar o que está desligado aqui.', 'info'),
      DS.secao('Agentes', [DS.tabela({ id: 'plataforma-agentes', colunas: ['Agente', 'Papel e área', 'Capacidades'], linhas }),
        h('p', { class: 'suave' }, tr('Agente desligado não responde no chat, sai da escolha de agentes e das políticas do MCP. O Prumo Orchestrator conduz a conversa e fica sempre ligado.'))]),
      DS.secao('Regras gerais', [
        h('label', { class: 'opcao', for: 'plataforma-orquestracao' }, orquestracao, tr('O Orchestrator pode combinar vários agentes numa mesma resposta')),
        h('label', { class: 'opcao', for: 'plataforma-ia-externa' }, externa, tr('Permitir Claude Code e Codex no chat (cada pessoa ainda autoriza o próprio cliente)')),
        h('p', { class: 'suave' }, tr('Desligar a IA externa não afeta o resto do Prumo: as respostas usam só os dados deste computador.')),
        d.alteradoEm ? h('p', { class: 'suave', id: 'plataforma-alterado' }, tr('Última alteração: '), semTraducao(quando(d.alteradoEm) + (d.por ? ' · ' + d.por : ''))) : null,
        alterar ? DS.rodape(DS.acao('Salvar regras dos agentes', async () => {
          const desligados = d.agentes.filter((a) => !a.fixo && !ligados.get(a.id).checked).map((a) => a.id);
          const r = await chamar(() => api.plataformaSalvar({ desligados, iaExterna: externa.checked, orquestracao: orquestracao.checked, perfis })); if (!r) return;
          avisar(tr('Regras dos agentes salvas.')); void agentes(area);
        }, { primaria: true, id: 'plataforma-salvar' })) : DS.notaPermissao('Seu papel só permite consultar estas regras.')
      ], { id: 'plataforma-regras' }));
  }

  /* ---------- Configurações gerais ---------- */
  async function geral(area) {
    area.replaceChildren(DS.carregando());
    const [c, d] = await Promise.all([chamar(() => api.acessoConfiguracao()), chamar(() => api.papeisListar())]);
    if (!c || !d) return area.replaceChildren(DS.falhaConsulta('administracao'));
    const alterar = podeAlterarAdministracao();
    const modoEmail = window.PrumoConta?.sessao?.()?.identidadeRemota === true;
    const caixa = (id, v) => h('input', { type: 'checkbox', id, checked: v, disabled: !alterar });
    const numero = (id, v, min, max) => h('input', { type: 'number', id, value: v, min, max, step: 1, disabled: !alterar });
    const aberto = caixa('geral-cadastro', c.cadastroAberto); const aprovar = caixa('geral-aprovar', c.aprovarCadastros); const duasEtapas = caixa('geral-duas-etapas', !!c.exigirDuasEtapas);
    const papel = DS.selecao({ id: 'geral-papel', rotulo: 'Papel de novos cadastros', opcoes: d.papeis.filter((p) => p.id !== 'administrador').map((p) => [p.id, p.nome]), valor: c.papelDoCadastro }); papel.disabled = !alterar;
    const inatividade = numero('geral-inatividade', c.minutosDeInatividade, 5, 720); const tentativas = numero('geral-tentativas', c.tentativasAntesDoBloqueio, 3, 20); const bloqueio = numero('geral-bloqueio', c.minutosDeBloqueio, 1, 240);
    // OAuth pertence à instalação e é configurado somente pela Administração, nunca pelo usuário comum.
    const githubId=h('input',{type:'text',id:'adm-github-client-id',value:c.githubClientId||'',maxlength:60,autocomplete:'off',spellcheck:'false',disabled:!alterar});
    const githubSegredo=h('input',{type:'password',id:'adm-github-client-secret',value:'',maxlength:300,autocomplete:'new-password',spellcheck:'false',disabled:!alterar});
    const githubConfiguracao=DS.secao('GitHub · autorização de repositórios',[
      DS.info('Uma vez por instalação: registre um OAuth App no GitHub em Settings > Developer settings > OAuth apps. Isso não é solicitado às pessoas que conectarem seus repositórios.'),
      h('p',{class:'suave'},'GitHub: https://github.com/settings/developers · Nome do aplicativo: Prumo QA · Homepage URL: site oficial do Prumo · Callback URL: http://127.0.0.1/callback'),
      DS.campo('Client ID do OAuth App',githubId),
      DS.campo('Client Secret (guardado no cofre do computador)',githubSegredo,{ajuda:c.githubClientId?'Deixe em branco para manter o segredo já guardado.':'Obrigatório na primeira configuração. Nunca copie para o código.'}),
      alterar?DS.rodape(DS.acao('Salvar integração GitHub',async()=>{
        const id=githubId.value.trim(),segredo=githubSegredo.value;
        if(!id){avisar('Informe o Client ID do OAuth App.',true);githubId.focus();return;}
        try{
          const salvo=await chamar(()=>api.acessoGithub(id,segredo));
          if(salvo)avisar('Integração do GitHub configurada neste computador.');
        }finally{githubSegredo.value='';}
      },{id:'adm-github-oauth-salvar',primaria:true})):DS.notaPermissao('Somente a Administração pode configurar o OAuth App.')
    ],{id:'adm-github-oauth'});
    area.replaceChildren(
      DS.secao('Cadastro pela tela de entrada', [h('label', { class: 'opcao', for: 'geral-cadastro' }, aberto, tr('Permitir que a pessoa crie a própria conta')), h('label', { class: 'opcao', for: 'geral-aprovar' }, aprovar, tr('Novos cadastros precisam de aprovação da Administração')), DS.campo('Papel de novos cadastros', papel, { ajuda: 'Nunca administrador: esse papel só a Administração dá.' })]),
      DS.secao('Sessão e bloqueio', [h('div', { class: 'adm-form' }, DS.campo('Minutos sem uso até pedir login de novo', inatividade), DS.campo('Tentativas erradas antes de bloquear a conta', tentativas), DS.campo('Minutos de bloqueio', bloqueio)),
        h('label', { class: 'opcao', for: 'geral-duas-etapas' }, duasEtapas, tr('Exigir verificação em duas etapas (código por e-mail ao entrar) de todas as contas com e-mail')), DS.info('Contas sem e-mail (criadas aqui ou pelo GitHub/Google) entram só com a senha. Sem o serviço do Prumo no ar, quem precisa do código não consegue entrar.', { rotulo: 'Sobre as duas etapas' })]),
      modoEmail ? DS.secao('Acesso do MVP', [DS.info('O acesso utiliza e-mail e código único. GitHub e Google não fazem parte do login desta etapa; as integrações de trabalho ficam em Projetos.', { rotulo: 'Como funciona' })]) : null,
      githubConfiguracao,
      alterar ? DS.rodape(DS.acao('Salvar configurações', async () => {
        const r = await chamar(() => api.acessoSalvar({ cadastroAberto: aberto.checked, aprovarCadastros: aprovar.checked, papelDoCadastro: papel.value, minutosDeInatividade: Number(inatividade.value), tentativasAntesDoBloqueio: Number(tentativas.value), minutosDeBloqueio: Number(bloqueio.value), exigirDuasEtapas: duasEtapas.checked }));
        if (r) avisar(tr('Configurações salvas.'));
      }, { primaria: true, id: 'geral-salvar' })) : DS.notaPermissao('Seu papel só permite consultar estas configurações.'));
  }

  return { usuarios, permissoes, agentes, geral };
})();


'use strict';
/** Administração › Chamados: todos os chamados de suporte numa tela só, com o texto, quem abriu, imagens e vídeo, resposta e estado. */
window.PrumoAdministracaoChamados = (() => {
  const rotulos = () => window.PrumoSuporte || { ESTADO: { NOVO: 'Novo', EM_ANALISE: 'Em análise', RESOLVIDO: 'Resolvido', FECHADO: 'Fechado' }, TOM: {}, CATEGORIA: { bug: 'Bug', melhoria: 'Melhoria', sugestao: 'Sugestão' }, tamanho: (b) => b + ' B' };
  const blocoDeTexto = (t) => h('pre', { class: 'ds-codigo chamado-texto', 'data-i18n-ignore': '' }, t);

  /** Chave de administração: a mesma de PRUMO_SUPORTE_CHAVE_ADMIN no serviço. Fica só no cofre do sistema e nunca volta para a tela. */
  function formularioDaChave(area, configurada) {
    const chave = h('input', { id: 'chamados-chave', type: 'password', maxlength: 200, autocomplete: 'off', spellcheck: 'false', placeholder: configurada ? tr('(já guardada; informe outra para trocar)') : '' });
    return DS.secao('Chave de administração do suporte', [DS.info('A mesma chave configurada no serviço do Prumo (PRUMO_SUPORTE_CHAVE_ADMIN, no Render), com 32 caracteres ou mais. Ela fica só no cofre do sistema deste computador.', { rotulo: 'Sobre a chave' }),
      h('div', { class: 'adm-form' }, DS.campo('Chave', chave)),
      podeAlterarAdministracao() ? h('div', { class: 'ds-cab-acoes ds-mt' }, DS.acao('Salvar chave', async () => { const r = await chamar(() => api.chamadosChave(chave.value)); chave.value = ''; if (r) { avisar(r.configurada ? tr('Chave guardada.') : tr('Chave apagada.')); void mostrar(area); } }, { id: 'chamados-salvar-chave', primaria: !configurada, compacto: true })) : null], { id: 'chamados-config' });
  }

  async function verAnexo(numero, a, lugar) {
    lugar.replaceChildren(DS.carregando());
    const r = await chamar(() => api.chamadosAnexo(numero, a.indice)); if (!r) { lugar.replaceChildren(); return; }
    const bytes = Uint8Array.from(atob(r.base64), (c) => c.charCodeAt(0)); const url = URL.createObjectURL(new Blob([bytes], { type: r.tipo }));
    const midia = r.tipo.startsWith('video/') ? h('video', { src: url, controls: true, class: 'chamado-midia', 'aria-label': a.nome }) : h('img', { src: url, alt: a.nome, class: 'chamado-midia' });
    lugar.replaceChildren(midia);
  }

  /** Um chamado por inteiro, com resposta e mudança de estado para quem pode alterar. */
  async function abrirChamado(numero, area) {
    const c = await chamar(() => api.chamadosDetalhe(numero)); if (!c) return;
    const { ESTADO, TOM, CATEGORIA, tamanho } = rotulos(); const d = c.dados;
    const anexos = c.anexos.map((a) => { const lugar = h('div', { class: 'chamado-anexo-ver' });
      return h('div', { class: 'chamado-anexo', 'data-anexo': a.indice }, h('p', {}, DS.icone(a.tipo.startsWith('video') ? 'video' : 'imagem'), ' ', semTraducao(a.nome), h('span', { class: 'suave' }, ' · ' + tamanho(a.tamanho))),
        a.recebido ? DS.acao(a.tipo.startsWith('video') ? 'Ver vídeo' : 'Ver imagem', () => verAnexo(numero, a, lugar), { id: 'chamado-ver-' + a.indice, compacto: true }) : h('p', { class: 'suave' }, tr('Ainda não recebido.')), lugar); });
    const resposta = h('textarea', { id: 'chamado-resposta', rows: 4, maxlength: 4000, placeholder: tr('Escreva a resposta que a pessoa vai ver em Meus chamados') });
    const estado = DS.selecao({ id: 'chamado-estado', rotulo: 'Estado', opcoes: Object.entries(ESTADO), valor: c.estado });
    DS.modal(tr('Chamado #{n}', { n: c.numero }), [
      h('p', { class: 'chamado-titulo' }, semTraducao(d.titulo)),
      DS.meta([['Tipo', tr(CATEGORIA[d.categoria] || d.categoria)], ['Estado', DS.chip(ESTADO[c.estado] || c.estado, TOM[c.estado])], ['Quem abriu', d.contato ? h('span', {}, semTraducao(d.contato.nome + (d.contato.email ? ' · ' + d.contato.email : '')), ' ', DS.info('Nome e e-mail informados no chamado pelo aplicativo de quem abriu; o serviço não os confirma. A resposta chega só a quem tem a chave do chamado.')) : tr('não informado')], ['Versão', d.versao ? semTraducao(d.versao) : null], ['Sistema', d.sistema ? semTraducao(d.sistema) : null], ['Aberto em', hora(c.criadoEm)], ['Atualizado em', hora(c.atualizadoEm)]]),
      DS.secao('Descrição', [blocoDeTexto(d.descricao)]), d.passos ? DS.secao('Passos para reproduzir', [blocoDeTexto(d.passos)]) : null, d.esperado ? DS.secao('Resultado ou benefício esperado', [blocoDeTexto(d.esperado)]) : null,
      d.diagnostico ? DS.secao('Diagnóstico da interface', [blocoDeTexto(d.diagnostico)]) : null,
      anexos.length ? DS.secao('Imagens e vídeo', anexos, { id: 'chamado-anexos' }) : null,
      DS.secao('Respostas', c.respostas.length ? c.respostas.map((x) => h('div', { class: 'ds-bloco' }, h('p', { class: 'suave' }, hora(x.em)), h('p', { 'data-i18n-ignore': '' }, x.texto))) : [h('p', { class: 'suave' }, tr('Nenhuma resposta ainda.'))], { id: 'chamado-respostas' }),
      podeAlterarAdministracao() ? DS.secao('Responder e mudar o estado', [DS.campo('Resposta', resposta, { inteiro: true }), h('div', { class: 'ds-cab-acoes ds-mt' },
        DS.acao('Responder', async () => { const r = await chamar(() => api.chamadosResponder(c.numero, resposta.value)); if (r) { avisar(tr('Resposta enviada.')); DS.fecharModal(); void abrirChamado(numero, area); } }, { id: 'chamado-responder', primaria: true }),
        DS.campo('Estado', estado), DS.acao('Mudar estado', async () => { const r = await chamar(() => api.chamadosEstado(c.numero, estado.value)); if (r) { avisar(tr('Estado atualizado.')); DS.fecharModal(); void mostrar(area); } }, { id: 'chamado-estado-salvar' }))]) : DS.notaPermissao('Seu papel só permite consultar os chamados.')
    ], { tamanho: 'lg', subtitulo: d.contato?.nome });
  }

  async function mostrar(area) {
    area.replaceChildren(DS.carregando());
    const cfg = await chamar(() => api.chamadosConfiguracao()); if (!cfg) return;
    if (!cfg.configurada) { area.replaceChildren(DS.alerta('Para ver os chamados, informe a chave de administração do suporte.', 'info'), formularioDaChave(area, false)); return; }
    const { ESTADO, TOM, CATEGORIA } = rotulos();
    let filtro = (estado.sub?.chamadosFiltro) || '';
    const lista = h('div', { id: 'chamados-lista' }, DS.carregando());
    const carregar = async () => {
      lista.replaceChildren(DS.carregando());
      const r = await chamar(() => api.chamadosListar(filtro || undefined)); if (!r) { lista.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler os chamados', 'Confira a chave de administração e se o serviço do Prumo está no ar.', [], { id: 'chamados-erro' })); return; }
      if (!r.chamados.length) { lista.replaceChildren(DS.estadoTela('vazio', filtro ? 'Nenhum chamado neste estado' : 'Nenhum chamado recebido', 'Os chamados abertos pela tela de Suporte aparecem aqui.', [], { id: 'chamados-vazio' })); return; }
      lista.replaceChildren(DS.tabela({ id: 'chamados-tabela', colunas: ['Nº', 'Título', 'Tipo', 'Quem abriu', 'Estado', 'Atualizado', 'Anexos'], linhas: r.chamados.map((c) => ({
        attrs: { 'data-chamado': c.numero }, abrir: () => abrirChamado(c.numero, area), rotuloAcessivel: tr('Abrir chamado {n}', { n: c.numero }),
        celulas: ['#' + c.numero, semTraducao(c.titulo), tr(CATEGORIA[c.categoria] || c.categoria), c.contato ? semTraducao(c.contato) : '—', DS.chip(ESTADO[c.estado] || c.estado, TOM[c.estado]), hora(c.atualizadoEm), String(c.anexos)] })) }));
    };
    const seletor = DS.selecao({ id: 'chamados-filtro', rotulo: 'Estado', opcoes: [['', 'Todos'], ...Object.entries(ESTADO)], valor: filtro, aoMudar: (v) => { filtro = v; (estado.sub ||= {}).chamadosFiltro = v; void carregar(); } });
    area.replaceChildren(DS.secao('Chamados de suporte', [h('p', { class: 'suave' }, tr('Os chamados que as pessoas abrem pela tela de Suporte, sem precisar de conta no GitHub. Ficam guardados no repositório privado da equipe.')), lista],
      { acoes: [seletor, DS.acao('Atualizar', () => carregar(), { id: 'chamados-atualizar', icone: 'atualizar', compacto: true })], id: 'chamados' }), formularioDaChave(area, true));
    await carregar();
  }

  return { mostrar };
})();
