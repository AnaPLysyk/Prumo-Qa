/** Administracao: desenha as ligacoes entre os arquivos. */
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

