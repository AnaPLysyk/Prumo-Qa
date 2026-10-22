'use strict';
// Prumo Design System (v40): componentes de apresentação comuns às telas. Só monta nós com h()/textContent;
// não chama o núcleo nem guarda dados. Documentação: docs/DESIGN-SYSTEM.md.
const DS = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  let sequenciaAbas = 0;
  const caminhos = {
    busca: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20 20l-4-4'],
    mais: ['M12 5v14', 'M5 12h14'],
    pessoa: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4.5 20c0-3.4 3.4-5.5 7.5-5.5s7.5 2.1 7.5 5.5'],
    fechar: ['M6 6l12 12', 'M18 6L6 18'],
    seta: ['M5 12h14', 'M13 6l6 6-6 6'],
    externo: ['M14 4h6v6', 'M10 14L20 4', 'M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5'],
    atualizar: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4v7h-7'],
    clipe: ['M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.6 8.6a2 2 0 0 1-2.8-2.8L15 7.5'],
    mensagem: ['M4 5h16v11H8l-4 4z'],
    historico: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5', 'M12 7v5l3 2'],
    vinculo: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'],
    alerta: ['M12 3l10 18H2z', 'M12 10v4', 'M12 17.5v.01'],
    ok: ['M5 12.5l4.5 4.5L19 7'],
    relogio: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5l3 2'],
    play: ['M8 5l11 7-11 7z'],
    ramo: ['M6 3v12', 'M6 15a3 3 0 1 0 .01 0', 'M18 6a3 3 0 1 0 .01 0', 'M18 9a9 9 0 0 1-9 9'],
    pausa: ['M8 5v14', 'M16 5v14'],
    arquivo: ['M6 3h8l4 4v14H6z', 'M14 3v4h4'],
    imagem: ['M4 5h16v14H4z', 'M4 16l5-5 4 4 3-3 4 4', 'M15.5 9.5v.01'],
    video: ['M3 6h13v12H3z', 'M16 10l5-3v10l-5-3z'],
    codigo: ['M8 7l-5 5 5 5', 'M16 7l5 5-5 5'],
    baixar: ['M12 4v11', 'M7 10l5 5 5-5', 'M5 20h14'],
    subir: ['M12 15V4', 'M7 9l5-5 5 5', 'M5 20h14'],
    cadeado: ['M6 11h12v10H6z', 'M8 11V8a4 4 0 0 1 8 0v3'],
    vazio: ['M4 7h16v12H4z', 'M4 7l3-3h10l3 3', 'M9 12h6'],
    livro: ['M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z', 'M4 19V5'],
    pasta: ['M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    ajustes: ['M4 7h9', 'M17 7h3', 'M13 5v4', 'M4 17h3', 'M11 17h9', 'M7 15v4'],
    lixeira: ['M4 7h16', 'M10 11v6', 'M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'],
    editar: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
    filtro: ['M4 5h16l-6 7v6l-4 2v-8z'],
    escudo: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'],
    info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 11v6', 'M12 7.5v.01'],
    globo: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3 12h18', 'M12 3a14 14 0 0 1 0 18', 'M12 3a14 14 0 0 0 0 18'],
    pulso: ['M3 12h4l2-6 4 12 2-6h6'],
    workerAtivo: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7.5V12l3 2'],
    workerExecutando: ['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5'],
    workerPausado: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M10 9v6', 'M14 9v6'],
    workerParado: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M9.5 9.5h5v5h-5z']
  };
  function icone(nome, rotulo) {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ds-ic');
    if (rotulo) { s.setAttribute('role', 'img'); s.setAttribute('aria-label', rotulo); } else { s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false'); }
    for (const d of caminhos[nome] || []) { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); s.append(p); }
    return s;
  }
  const t = (x) => (typeof x === 'string' ? tr(x) : x);

  /** Cabeçalho da tela: título, contagem, uma linha de contexto e ações à direita. */
  function cabecalho({ titulo, contagem, descricao, acoes = [], idContagem, info: sobre }) {
    const n = contagem === undefined || contagem === null ? null : h('span', { class: 'ds-contagem', id: idContagem || null, 'aria-label': tr('{n} itens', { n: contagem }) }, String(contagem));
    return h('div', { class: 'ds-cab' }, h('div', { class: 'ds-cab-titulo' }, h('h1', {}, tr(titulo), n, sobre ? info(sobre) : null), descricao ? h('p', { class: 'ds-desc' }, [].concat(descricao).map(t)) : null),
      acoes.filter(Boolean).length ? h('div', { class: 'ds-cab-acoes' }, acoes.filter(Boolean)) : null);
  }
  /** Botão padrão; a ação assíncrona desabilita o botão enquanto roda (mesma regra de plataforma.js). */
  function acao(texto, fn, { id, primaria, compacto, icone: ic, desabilitado, titulo, classe, rotulo } = {}) {
    const b = h('button', { type: 'button', class: ['acao', primaria && 'primaria', compacto && 'compacto', classe].filter(Boolean).join(' '), id: id || null, title: titulo ? tr(titulo) : null, 'aria-label': rotulo || null, disabled: !!desabilitado }, ic ? icone(ic) : null, tr(texto));
    if (fn) b.addEventListener('click', async (e) => { e.stopPropagation(); b.disabled = true; try { await fn(e); } catch { avisar(tr('Falha ao concluir a ação.'), true); } finally { if (b.isConnected) b.disabled = !!desabilitado; } });
    return b;
  }
  function link(texto, fn, { id, rotulo, seta = true, desabilitado, titulo } = {}) {
    const b = h('button', { type: 'button', class: 'ds-link' + (seta ? ' seta' : ''), id: id || null, 'aria-label': rotulo || null, disabled: !!desabilitado, title: titulo ? tr(titulo) : null }, tr(texto));
    if (fn) b.addEventListener('click', (e) => { e.stopPropagation(); fn(e); });
    return b;
  }
  function barra(...filhos) { return h('div', { class: 'ds-barra', role: 'search' }, ...filhos); }
  function busca({ id, placeholder, valor = '', aoEnter, rotulo }) {
    const input = h('input', { id, type: 'search', placeholder: tr(placeholder), 'aria-label': tr(rotulo || placeholder), value: valor, maxlength: 100, autocomplete: 'off' });
    if (!aoEnter) return { input, no: h('div', { class: 'ds-busca' }, icone('busca'), input) };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); aoEnter(); } });
    // Com ação de busca, a lupa também busca: a tela não precisa de um botão "Buscar" separado.
    const lupa = h('button', { type: 'button', class: 'ds-busca-lupa', 'aria-label': tr('Buscar'), title: tr('Buscar'), onclick: () => aoEnter() }, icone('busca'));
    return { input, no: h('div', { class: 'ds-busca' }, lupa, input) };
  }
  function selecao({ id, rotulo, opcoes, valor = '', aoMudar }) {
    const s = h('select', { id, 'aria-label': tr(rotulo) }, opcoes.map(([v, txt]) => h('option', { value: v, selected: String(v) === String(valor) }, t(txt))));
    if (aoMudar) s.addEventListener('change', () => aoMudar(s.value));
    return s;
  }
  /** Tabela padrão. linhas: { attrs, celulas: [nó|texto|{no, classe}], abrir: fn, rotuloAbrir }. */
  function tabela({ id, colunas, linhas, rotuloAbrir = 'Abrir' }) {
    const classeCol = colunas.map((c) => (typeof c === 'object' ? c.classe || '' : ''));
    const cel = (c, i) => { const col = classeCol[i] || ''; return c && typeof c === 'object' && !c.nodeType && !Array.isArray(c) ? h('td', { class: [c.classe, col].filter(Boolean).join(' ') || null }, c.no) : h('td', { class: col || null }, c ?? '—'); };
    const temAbrir = linhas.some((l) => l.abrir);
    const corpo = h('tbody', {}, linhas.map((l) => {
      const tr0 = h('tr', { ...(l.attrs || {}), 'data-clicavel': l.abrir ? '' : null }, l.celulas.map(cel), temAbrir ? h('td', { class: 'ds-acao ds-abrir' }, l.abrir ? link(l.rotuloAbrir || rotuloAbrir, l.abrir, { rotulo: l.rotuloAcessivel || null, desabilitado: l.desabilitado }) : null) : null);
      if (l.abrir && !l.desabilitado) tr0.addEventListener('click', (e) => { if (e.target.closest('button, a, input, select, textarea, summary')) return; tr0.querySelector(':scope > td.ds-abrir button')?.click(); }); // só o "Abrir": outras células de ação (Pausar, Retomar) também usam ds-acao
      return tr0;
    }));
    return h('div', { class: 'ds-tabela-caixa' }, h('table', { id: id || null, class: 'ds-tabela' }, h('thead', {}, h('tr', {}, colunas.map((c) => h('th', { scope: 'col', class: c.classe || null }, t(c.t ?? c))), temAbrir ? h('th', { scope: 'col' }, h('span', { class: 'visually-hidden' }, tr('Ações'))) : null)), corpo));
  }
  const tomEstado = { PASS: 'ok', OK: 'ok', CONFIRMADA: 'ok', ATIVA: 'ok', VIGENTE: 'ok', PUBLICADO: 'ok', CONCLUIDO: 'ok', FAIL: 'falha', ERROR: 'falha', ERRO: 'falha', ERRO_INFRA: 'falha', FALHA: 'falha', BLOCKED: 'aviso', BLOQUEADA: 'aviso', PAUSADA: 'aviso', PERDIDO: 'aviso', PENDENTE: 'info', EXECUTANDO: 'info' };
  function chip(texto, tom) { return h('span', { class: 'ds-chip', 'data-tom': tom || null }, t(texto)); }
  const nomesServico = { jira: 'Jira', qase: 'Qase', github: 'GitHub', prumo: 'Prumo', local: 'Local', manual: 'Manual' };
  function origem(servico, texto) { return h('span', { class: 'ds-origem', 'data-servico': servico }, h('i', { 'aria-hidden': 'true' }), texto ?? nomesServico[servico] ?? servico); }
  /** Estados de tela: 'vazio' | 'erro' | 'bloqueado' | 'carregando'. O texto sempre existe (o modal fecha sozinho quando fica vazio). */
  function estadoTela(tipo, titulo, descricao, acoes = [], { id, compacto } = {}) {
    const ic = tipo === 'erro' ? icone('alerta') : tipo === 'bloqueado' ? icone('cadeado') : tipo === 'carregando' ? h('span', { class: 'ds-giro', 'aria-hidden': 'true' }) : icone('vazio');
    return h('div', { class: 'ds-estado' + (compacto ? ' compacto' : ''), 'data-tipo': tipo, id: id || null, role: tipo === 'erro' ? 'alert' : 'status' }, h('span', { class: 'ds-estado-ic' }, ic), h('strong', {}, t(titulo)), descricao ? h('p', {}, t(descricao)) : null, acoes.filter(Boolean).length ? h('div', { class: 'ds-estado-acoes' }, acoes.filter(Boolean)) : null);
  }
  const carregando = (texto = 'Carregando…') => estadoTela('carregando', texto, null, [], { compacto: true });
  function esqueleto(n = 5) { return h('div', { class: 'ds-esqueleto', role: 'status', 'aria-label': tr('Carregando…') }, Array.from({ length: n }, () => h('i'))); }
  /** Informações curtas no contexto da ação. Floating UI ajusta a dica nas bordas sem mudar o visual do Prumo. */
  function info(texto, { id, rotulo } = {}) {
    const caixa = h('span', { class: 'ds-info', id: id || null });
    const textoId = 'ds-info-texto-' + (++sequenciaAbas);
    const descricao = h('span', { class: 'ds-info-texto', id: textoId, role: 'note' }, [].concat(texto).map(t));
    const botao = h('button', { type: 'button', class: 'ds-info-botao', 'aria-label': tr(rotulo || 'Sobre estes dados'), 'aria-describedby': textoId, 'aria-expanded': 'false' }, icone('info'));
    let parar = null;
    const recolher = () => {
      parar?.(); parar = null;
      document.removeEventListener('pointerdown', fecharFora);
      descricao.removeAttribute('data-flutuante');
      descricao.style.removeProperty('left'); descricao.style.removeProperty('top');
      if (descricao.parentNode !== caixa) caixa.append(descricao);
    };
    const exibir = () => {
      const f = window.PrumoFloatingUI;
      if (!f || parar) return;
      // Move para o próprio diálogo (top layer), fora da área que pode rolar;
      // nunca leva a dica de um modal para trás do modal.
      const destino = caixa.closest('dialog[open]') || document.body;
      destino.append(descricao);
      descricao.setAttribute('data-flutuante', '');
      parar = f.autoUpdate(botao, descricao, () => {
        f.computePosition(botao, descricao, {
          strategy: 'fixed', placement: 'bottom-end',
          middleware: [f.offset(8), f.flip({ padding: 8 }), f.shift({ padding: 10 })]
        }).then(({ x, y }) => {
          if (!parar) return;
          descricao.style.left = x + 'px';
          descricao.style.top = y + 'px';
        }).catch(() => recolher());
      });
    };
    const recolherSeInativa = () => {
      if (!caixa.matches(':hover, :focus-within') && !caixa.hasAttribute('data-aberto')) recolher();
    };
    botao.addEventListener('click', e => {
      e.stopPropagation();
      const aberto = !caixa.hasAttribute('data-aberto');
      caixa.toggleAttribute('data-aberto', aberto);
      botao.setAttribute('aria-expanded', String(aberto));
      if (aberto) {
        document.addEventListener('pointerdown', fecharFora);
        const dialogo = caixa.closest('dialog[open]');
        dialogo?.addEventListener('close', () => {
          caixa.removeAttribute('data-aberto'); botao.setAttribute('aria-expanded', 'false'); recolher();
        }, { once: true });
        exibir();
      } else recolherSeInativa();
    });
    botao.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      caixa.removeAttribute('data-aberto'); botao.setAttribute('aria-expanded', 'false');
      recolher();
    });
    caixa.addEventListener('mouseenter', exibir);
    caixa.addEventListener('mouseleave', recolherSeInativa);
    caixa.addEventListener('focusin', exibir);
    caixa.addEventListener('focusout', () => queueMicrotask(recolherSeInativa));
    function fecharFora(e) {
      if (!caixa.hasAttribute('data-aberto') || caixa.contains(e.target)) return;
      caixa.removeAttribute('data-aberto'); botao.setAttribute('aria-expanded', 'false');
      recolherSeInativa();
    }
    caixa.append(botao, descricao);
    return caixa;
  }
  function alerta(texto, tom, ic) { return h('div', { class: 'ds-alerta', 'data-tom': tom || null, role: tom === 'falha' ? 'alert' : null }, icone(ic || (tom === 'ok' ? 'ok' : tom === 'falha' || tom === 'aviso' ? 'alerta' : 'escudo')), h('div', {}, [].concat(texto).map(t))); }
  function notaPermissao(texto) { return h('p', { class: 'ds-nota-perm' }, icone('cadeado'), h('span', {}, t(texto))); }
  /** Abas: itens [[chave, rótulo, contagem?]]; aoTrocar(chave). Usa aria-selected (tablist). */
  function abasTela(itens, atual, aoTrocar, { id, rotulo = 'Seções', attr = 'data-aba-ds' } = {}) {
    const nav = h('div', { class: 'ds-abas', role: 'tablist', 'aria-label': tr(rotulo), id: id || null });
    const selecionada = itens.some(([k]) => k === atual) ? atual : itens[0]?.[0];
    const marcar = (k) => { for (const b of nav.children) { const ativo = b.getAttribute(attr) === k; b.setAttribute('aria-selected', String(ativo)); b.tabIndex = ativo ? 0 : -1; } };
    for (const [k, txt, n] of itens) nav.append(h('button', { type: 'button', role: 'tab', [attr]: k, tabindex: k === selecionada ? 0 : -1, 'aria-selected': String(k === selecionada), onclick: () => { marcar(k); aoTrocar(k); } }, t(txt), n !== undefined && n !== null ? h('span', { class: 'ds-n' }, String(n)) : null));
    nav.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
      const bs = [...nav.children]; const i = bs.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault();
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? bs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length;
      bs[j].focus(); bs[j].click();
    });
    return nav;
  }
  function campo(rotulo, controle, { ajuda, inteiro, id, oculto } = {}) {
    const l = h('label', { class: 'ds-campo' + (inteiro ? ' inteiro' : ''), for: id || controle?.id || null, hidden: !!oculto }, h('span', {}, tr(rotulo)), controle, ajuda ? h('span', { class: 'ds-dica' }, t(ajuda)) : null);
    return l;
  }
  function grupo(legenda, ...campos) { return h('fieldset', {}, h('legend', {}, tr(legenda)), ...campos); }
  function meta(pares, { linha } = {}) { return h('dl', { class: 'ds-meta' + (linha ? ' linha' : '') }, pares.filter((p) => p && p[1] !== undefined && p[1] !== null && p[1] !== '').map(([k, v]) => h('div', {}, h('dt', {}, tr(k)), h('dd', {}, v)))); }
  function secao(titulo, conteudo, { acoes = [], id } = {}) { return h('section', { class: 'ds-secao', id: id || null }, h('div', { class: 'ds-secao-cab' }, h('h2', {}, tr(titulo)), acoes.length ? h('div', { class: 'ds-cab-acoes' }, acoes) : null), ...[].concat(conteudo).filter(Boolean)); }
  function bloco(titulo, ...conteudo) { return h('div', { class: 'ds-bloco' }, h('h3', { class: 'ds-h' }, tr(titulo)), ...conteudo.flat().filter(Boolean)); }
  function texto(valor, vazio = 'Sem conteúdo informado.') { const v = (valor ?? '').toString().trim(); return h('p', { class: 'ds-texto' + (v ? '' : ' vazio-txt') }, v || tr(vazio)); }
  function recolher(titulo, conteudo, { aberto, id } = {}) { return h('details', { class: 'ds-recolher', open: !!aberto, id: id || null }, h('summary', {}, tr(titulo)), ...[].concat(conteudo).filter(Boolean)); }
  function resumo(itens, { id } = {}) { return h('div', { class: 'ds-resumo', id: id || null }, itens.filter(Boolean).map(([n, rot, tom]) => h('div', { 'data-tom': tom || null, 'data-zero': Number(n ?? 0) === 0 ? '' : null, 'data-texto': Number.isNaN(Number(String(n ?? 0).replace(',', '.'))) ? '' : null }, h('b', {}, String(n ?? 0)), h('span', {}, tr(rot))))); }
  function tempo(eventos) { return h('ol', { class: 'ds-tempo' }, eventos.map((e) => h('li', { 'data-tom': e.tom || null }, e.titulo, e.sub ? h('span', { class: 'ds-sub' }, e.sub) : null))); }
  function modal(titulo, conteudo, { tamanho = 'md', subtitulo, restaurar } = {}) {
    if (!window.PrumoQualidadeV39) return null;
    const corpo = h('div', { class: 'ds-modal' }, ...[].concat(conteudo).filter(Boolean));
    window.PrumoQualidadeV39.abrirModal(titulo, corpo, restaurar, { tamanho, subtitulo });
    return corpo;
  }
  const fecharModal = () => window.PrumoQualidadeV39?.fecharModal();
  function rodape(...filhos) { return h('div', { class: 'ds-modal-rodape' }, ...filhos.flat().filter(Boolean)); }
  /** Abas dentro do modal: cada painel é montado na primeira vez em que é aberto. */
  function abasModal(paineis, inicial) {
    const area = h('div', { class: 'ds-painel' }); const feitos = new Map();
    const prefixo = 'ds-abas-' + (++sequenciaAbas);
    const selecionada = paineis.some(([k]) => k === inicial) ? inicial : paineis[0]?.[0];
    let atual = selecionada;
    const montados = new Set();
    paineis.forEach(([k], i) => {
      const no = h('div', { id: prefixo + '-painel-' + i, role: 'tabpanel', 'aria-labelledby': prefixo + '-aba-' + i, tabindex: 0, hidden: k !== atual, 'data-painel': k });
      feitos.set(k, no); area.append(no);
    });
    const exibir = async (k) => {
      atual = k;
      for (const [chave, no] of feitos) no.hidden = chave !== k;
      if (!montados.has(k)) {
        const i = paineis.findIndex((x) => x[0] === k); if (i < 0) return;
        const p = paineis[i]; const no = feitos.get(k);
        montados.add(k); no.replaceChildren(carregando());
        try { no.replaceChildren(...[].concat(await p[3]()).filter(Boolean)); } catch { no.replaceChildren(estadoTela('erro', 'Não foi possível carregar esta seção.')); }
        no.hidden = atual !== k;
      }
    };
    const nav = abasTela(paineis.map(([k, txt, n]) => [k, txt, n]), selecionada, exibir, { rotulo: 'Seções do detalhe' });
    [...nav.children].forEach((aba, i) => { aba.id = prefixo + '-aba-' + i; aba.setAttribute('aria-controls', prefixo + '-painel-' + i); });
    if (selecionada !== undefined) exibir(selecionada);
    return [nav, area];
  }
  /** Editor de conexões do projeto de qualidade. Exibe vínculos reais, sem executar integrações. */
  /** Conexão configurada pode ficar desligada (sem cabo) sem perder a configuração; a escolha fica neste computador, por projeto. */
  function fluxoProjeto({ nome, codigo, descricao, selecionado, servicos: servicosBase, abrirConexao }) {
    // Estado vem do projeto salvo no backend; localStorage não pode simular desligamento de API.
    const servicos = servicosBase;
    const rotulosEstado = { VALIDO: 'Conectado', ATIVO: 'Conectado', INDISPONIVEL: 'Indisponível', SEM_PERMISSAO: 'Sem permissão', DESATUALIZADO: 'Precisa validar', SEM_CREDENCIAL: 'Conta desconectada' };
    const status = s => s.desligado ? 'Desligado' : rotulosEstado[s.estado] || s.estado || (s.vinculado ? 'Conectado' : 'Não conectado');
    const conectar = s => (s.acoes || []).find(([titulo]) => /^(Conectar|Escolher pasta|Trocar pasta|Verificar)$/.test(titulo));
    const acoes = s => (s.acoes || []).map(([titulo, acao, rotulo]) =>
      link(titulo, acao, { seta: false, rotulo: rotulo || titulo + ' — ' + s.nome }));
    /** Ícones próprios das cinco origens, no mesmo tamanho e traço; a cor vem do estado (cinza desligado, cor da marca quando conectado). */
    const marca = s => {
      const svg = (caminhos, preenchida = false) => {
        const el = document.createElementNS(NS, 'svg');
        el.setAttribute('viewBox', '0 0 24 24'); el.setAttribute('class', 'ds-proj-marca' + (preenchida ? ' preenchida' : ''));
        el.setAttribute('aria-hidden', 'true'); el.setAttribute('focusable', 'false');
        for (const d of caminhos) { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); el.append(p); }
        return el;
      };
      switch (s.servico) {
        case 'jira': return svg(['M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0Z'], true);
        case 'qase': return svg(['M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z', 'M14.6 14.6l4.9 4.9']);
        case 'github': return svg(['M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.4 7.86 10.92.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.69 1.25 3.35.95.11-.75.4-1.25.73-1.54-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.12 3.06.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.28 5.7.41.35.77 1.02.77 2.06v3.05c0 .31.21.67.79.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z'], true);
        case 'local': return svg(['M3.5 7.5a2 2 0 0 1 2-2h3.8l2 2.2h7.2a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z', 'M10.2 12.2l-2 2 2 2', 'M13.8 12.2l2 2-2 2']);
        default: return svg(['M7 3.5h6.5L18 8v12.5H7z', 'M13.5 3.5V8H18', 'M9.5 13h5', 'M9.5 16.5h3.5']);
      }
    };
    const porta = s => {
      const acao = conectar(s);
      return acao
        ? h('button', { class: 'ds-proj-porta', type: 'button', title: acao[0] + ' — ' + s.nome,
            'aria-label': acao[0] + ' — ' + s.nome, onclick: () => acao[1]() }, h('span', { 'aria-hidden': 'true' }))
        : h('span', { class: 'ds-proj-porta', 'aria-label': 'Conexão nativa — ' + s.nome },
            h('span', { 'aria-hidden': 'true' }));
    };
    /** Dois modos por ligação: "Só ver" (nada vai ao serviço) ou "Integrado" (publicar, comentar e editar, sempre com confirmação). */
    const modo = s => !s.modo ? null : h('div', { class: 'ds-proj-modo', role: 'group', 'aria-label': 'Modo de ' + s.nome, 'data-modo': s.modo.integrado ? 'integrado' : 'ver' },
      h('button', { type: 'button', 'aria-pressed': String(!s.modo.integrado), onclick: () => { if (s.modo.integrado) s.modo.aoAlterar(false); } }, 'Só ver'),
      h('button', { type: 'button', 'aria-pressed': String(s.modo.integrado), onclick: () => { if (!s.modo.integrado) s.modo.aoAlterar(true); } }, 'Integrado'),
      s.modo.ajuda ? info(s.modo.ajuda, { rotulo: 'O que muda no modo Integrado' }) : null);
    const modulo = s => h('article', { class: 'ds-proj-modulo', 'data-servico': s.servico,
      'data-vinculado': s.vinculado ? 'sim' : 'nao', 'data-estado': s.estado || '' },
      h('button', { class: 'ds-proj-modulo-emblema', type: 'button', 'aria-label': 'Abrir conexão ' + s.nome, onclick: () => abrirConexao?.(s.servico) }, marca(s)),
      h('div', { class: 'ds-proj-modulo-corpo' },
        h('strong', { class: 'ds-proj-modulo-nome' }, s.nome),
        h('span', { class: 'ds-proj-modulo-status' },
          h('i', { class: 'ds-proj-status-led', 'aria-hidden': 'true' }), status(s)),
        h('span', { class: 'ds-proj-modulo-recurso', title: s.detalhe || '' }, s.detalhe || 'Sem recurso vinculado'),
        modo(s),
        h('div', { class: 'ds-proj-modulo-acoes' }, acoes(s))),
      porta(s));
    const esquerda = ['jira', 'qase', 'manual'].map(id => servicos.find(s => s.servico === id)).filter(Boolean);
    const direita = ['github', 'local'].map(id => servicos.find(s => s.servico === id)).filter(Boolean);
    const qtd = servicos.filter(s => s.servico !== 'manual' && s.vinculado && !s.desligado).length;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ds-proj-cabos');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const centro = h('div', { class: 'ds-proj-hub', 'data-ativo': selecionado ? 'sim' : 'nao' },
      h('div', { class: 'ds-proj-hub-simbolo', 'aria-hidden': 'true' },
        h('span', { class: 'ds-proj-camada ds-proj-camada-1' }),
        h('span', { class: 'ds-proj-camada ds-proj-camada-2' }),
        h('span', { class: 'ds-proj-camada ds-proj-camada-3' })),
      h('span', { class: 'ds-proj-hub-legenda' }, 'NÚCLEO DE QUALIDADE'),
      h('strong', { class: 'ds-proj-hub-nome' }, nome),
      descricao ? h('p', { class: 'ds-proj-hub-descricao' }, descricao) : null,
      ...servicos.map(s => h('button', { type: 'button', class: 'ds-proj-hub-porta', 'data-servico': s.servico,
        'data-vinculado': s.vinculado ? 'sim' : 'nao', 'aria-label': 'Conectar ' + s.nome,
        title: 'Abrir configuração de ' + s.nome, onclick: () => abrirConexao?.(s.servico) })));
    const grafico = h('div', { class: 'ds-proj-grafo', role: 'group',
      'aria-label': 'Mapa de conexões do projeto de qualidade ' + nome },
      svg,
      h('div', { class: 'ds-proj-grafo-col', 'data-lado': 'esquerda' }, esquerda.map(modulo)),
      centro,
      h('div', { class: 'ds-proj-grafo-col', 'data-lado': 'direita' }, direita.map(modulo)));
    // --- Posições: cada módulo e o núcleo podem ser arrastados; a posição fica neste computador, por projeto, e os cabos acompanham.
    // Arrastar nunca desfaz uma conexão: só "Remover" desvincula.
    const chavePosicoes = 'prumo-fluxo:' + (codigo || nome);
    let posicoes = {};
    try { const p = JSON.parse(localStorage.getItem(chavePosicoes) || '{}'); if (p && typeof p === 'object') for (const [k, v] of Object.entries(p)) if (v && Number.isFinite(v.x) && Number.isFinite(v.y)) posicoes[k] = { x: v.x, y: v.y }; } catch { posicoes = {}; }
    const guardarPosicoes = () => { try { if (Object.keys(posicoes).length) localStorage.setItem(chavePosicoes, JSON.stringify(posicoes)); else localStorage.removeItem(chavePosicoes); } catch { /* sem armazenamento: a posição vale só nesta tela */ } };
    const reorganizar = h('button', { type: 'button', class: 'ds-proj-reorganizar', id: 'projeto-reorganizar', hidden: !Object.keys(posicoes).length, onclick: () => { posicoes = {}; guardarPosicoes(); for (const id of noDoElemento.keys()) aplicarPosicao(id); reorganizar.hidden = true; atualizarCabos(); } }, 'Reorganizar');
    const noDoElemento = new Map();
    const telaEstreita = () => typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 950px)').matches;
    function aplicarPosicao(id) { const no = noDoElemento.get(id); if (no) no.style.translate = posicoes[id] && !telaEstreita() ? posicoes[id].x + 'px ' + posicoes[id].y + 'px' : ''; }
    /** Janela redimensionada: reaplica as posições guardadas (ou as ignora no layout empilhado) e mantém cada elemento dentro do painel. */
    function reajustar() {
      if (telaEstreita()) { for (const id of noDoElemento.keys()) aplicarPosicao(id); return; }
      for (const id of Object.keys(posicoes)) if (noDoElemento.has(id)) manterNoPainel(id);
    }
    /** Mantém o elemento dentro do painel: depois de aplicar a posição, corrige o que passou da borda. */
    function manterNoPainel(id) {
      const no = noDoElemento.get(id); aplicarPosicao(id);
      const caixa = grafico.getBoundingClientRect(), r = no.getBoundingClientRect(); let { x, y } = posicoes[id];
      if (r.left < caixa.left) x += caixa.left - r.left; if (r.right > caixa.right) x -= r.right - caixa.right;
      if (r.top < caixa.top) y += caixa.top - r.top; if (r.bottom > caixa.bottom) y -= r.bottom - caixa.bottom;
      posicoes[id] = { x, y }; aplicarPosicao(id);
    }
    function tornarArrastavel(no, id, ehAlca) {
      let ini = null, moveu = false;
      // Sem capturar o ponteiro: o navegador entregaria o clique ao módulo e não ao botão do emblema. Os ouvintes na janela cobrem o arrasto até soltar.
      const mover = ev => {
        if (!ini) return;
        const dx = ev.clientX - ini.px, dy = ev.clientY - ini.py;
        if (!moveu && Math.hypot(dx, dy) < 4) return;
        moveu = true; no.dataset.movendo = 'sim';
        posicoes[id] = { x: ini.x + dx, y: ini.y + dy }; manterNoPainel(id); reorganizar.hidden = false; atualizarCabos();
      };
      const soltar = () => {
        window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', soltar); window.removeEventListener('pointercancel', soltar);
        if (!ini) return;
        ini = null; delete no.dataset.movendo;
        if (moveu) { guardarPosicoes(); setTimeout(() => { moveu = false; }, 0); }
      };
      no.addEventListener('pointerdown', ev => {
        if (ev.button !== 0 || telaEstreita() || !ehAlca(ev.target)) return;
        const base = posicoes[id] || { x: 0, y: 0 };
        ini = { px: ev.clientX, py: ev.clientY, x: base.x, y: base.y }; moveu = false;
        window.addEventListener('pointermove', mover); window.addEventListener('pointerup', soltar); window.addEventListener('pointercancel', soltar);
      });
      // O clique que termina um arrasto não abre o painel da conexão.
      no.addEventListener('click', ev => { if (moveu) { ev.preventDefault(); ev.stopPropagation(); } }, true);
    }
    for (const no of grafico.querySelectorAll('.ds-proj-modulo')) {
      const id = no.dataset.servico; noDoElemento.set(id, no); aplicarPosicao(id);
      tornarArrastavel(no, id, t => !t.closest('a, button.ds-proj-porta, .ds-proj-modulo-acoes, .ds-proj-modo, input, select, textarea, label'));
    }
    noDoElemento.set('nucleo', centro); aplicarPosicao('nucleo');
    tornarArrastavel(centro, 'nucleo', t => !t.closest('button, a, input, select, textarea, .ds-info'));
    const fluxo = h('div', { class: 'ds-proj-fluxo' },
      h('div', { class: 'ds-proj-fluxo-barra' },
        h('span', {}, 'CONEXÕES DO PROJETO · ' + qtd + ' vinculadas'), reorganizar),
      grafico);
    /** A geometria depende de portas reais no DOM; cabos desligados nunca indicam autorização. */
    const atualizarCabos = () => {
      if (!grafico.isConnected) return;
      const box = grafico.getBoundingClientRect();
      if (!box.width || !box.height) return;
      svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
      svg.replaceChildren();
      for (const s of servicos) {
        const no = [...grafico.querySelectorAll('.ds-proj-modulo')].find(n => n.dataset.servico === s.servico);
        const origem = no?.querySelector('.ds-proj-porta');
        const destino = [...centro.querySelectorAll('.ds-proj-hub-porta')].find(n => n.dataset.servico === s.servico);
        if (!origem || !destino || !s.vinculado || s.desligado) continue; // o cabo só existe depois que a conexão é configurada; o Manual/Prumo tem cabo enquanto estiver ativo
        const a = origem.getBoundingClientRect(), b = destino.getBoundingClientRect();
        const x1 = a.left + a.width / 2 - box.left, y1 = a.top + a.height / 2 - box.top;
        const x2 = b.left + b.width / 2 - box.left, y2 = b.top + b.height / 2 - box.top;
        const sentido = x1 < x2 ? 1 : -1;
        const curva = Math.max(25, Math.abs(x2 - x1) * .54);
        const fio = document.createElementNS(NS, 'path');
        fio.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + sentido * curva) + ' ' + y1 +
          ', ' + (x2 - sentido * curva) + ' ' + y2 + ', ' + x2 + ' ' + y2);
        fio.setAttribute('class', 'ds-proj-cabo');
        fio.setAttribute('data-servico', s.servico);
        fio.setAttribute('data-ativo', s.vinculado ? 'sim' : 'nao');
        svg.append(fio);
      }
    };
    if (typeof ResizeObserver === 'function' && typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        if (!grafico.isConnected) return;
        const observer = new ResizeObserver(() => {
          if (!grafico.isConnected) { observer.disconnect(); return; }
          reajustar(); atualizarCabos();
        });
        observer.observe(grafico);
        grafico.closest('details')?.addEventListener('toggle', atualizarCabos);
        atualizarCabos();
      });
    }
    return fluxo;
  }

  /** Trilha de navegação (breadcrumb): o caminho até a tela atual; os anteriores voltam, o último é a página em que a pessoa está. */
  function trilha(itens, { rotulo = 'Você está em', semAtual = false } = {}) {
    const lista = itens.filter(Boolean);
    return h('nav', { class: 'ds-trilha', 'aria-label': tr(rotulo) },
      h('ol', {}, lista.map(([texto, acao], i) => {
        const atual = !semAtual && i === lista.length - 1;
        return h('li', atual ? { 'aria-current': 'page' } : {}, acao && !atual ? h('button', { type: 'button', class: 'ds-trilha-link', onclick: acao }, tr(texto)) : h('span', {}, tr(texto)));
      })));
  }

  /** Foto do usuário: imagem do computador, link ou um dos modelos animados. Fica só neste computador (nunca vai para o servidor) e é mostrada por blob:. */
  const modelosAvatar = [['orbita', 'Órbita'], ['pulso', 'Pulso'], ['onda', 'Onda'], ['radar', 'Radar']];
  /** Biblioteca incluída no app: emojis animados Noto (Google, CC BY 4.0), em assets/avatares. */
  const bibliotecaAvatar = [['1f916', 'Robô'], ['1f680', 'Foguete'], ['1f525', 'Fogo'], ['2728', 'Brilho'], ['1f47e', 'Alienígena'], ['1f4a1', 'Ideia'], ['1f9e0', 'Cérebro'], ['1f31f', 'Estrela']];
  /** Catálogo completo dos emojis animados Noto (código:categoria:nome); as imagens vêm de fonts.gstatic.com só para a grade e, ao escolher, são baixadas e guardadas neste computador. */
  const catalogoNoto = '1f600:s:smile;1f603:s:smile-with-big-eyes;1f604:s:grin;1f601:s:grinning;1f606:s:laughing;1f605:s:grin-sweat;1f602:s:joy;1f923:s:rofl;1f62d:s:loudly-crying;1f609:s:wink;1f617:s:kissing;1f619:s:kissing-smiling-eyes;1f61a:s:kissing-closed-eyes;1f618:s:kissing-heart;1f970:s:heart-face;1f60d:s:heart-eyes;1f929:s:star-struck;1f973:s:partying-face;1fae0:s:melting;1f643:s:upside-down-face;1f642:s:slightly-happy;1f972:s:happy-cry;1f979:s:holding-back-tears;1f60a:s:blush;1f60c:s:relieved;1f60f:s:smirk;1f924:s:drool;1f60b:s:yum;1f61b:s:stuck-out-tongue;1f61d:s:squinting-tongue;1f61c:s:winky-tongue;1f92a:s:zany-face;1faea:s:distorted-face;1f614:s:pensive;1f97a:s:pleading;1f62c:s:grimacing;1f611:s:expressionless;1f610:s:neutral-face;1f636:s:mouth-none;1fae5:s:dotted-line-face;1f910:s:zipper-face;1fae1:s:salute;1f914:s:thinking-face;1f92b:s:shushing-face;1fae2:s:hand-over-mouth;1f92d:s:smiling-eyes-with-hand-over-mouth;1f971:s:yawn;1f917:s:hug-face;1fae3:s:peeking;1f631:s:screaming;1f928:s:raised-eyebrow;1f9d0:s:monocle;1f612:s:unamused;1f644:s:rolling-eyes;1f624:s:triumph;1f620:s:angry;1f621:s:rage;1f92c:s:cursing;1f61e:s:sad;1f613:s:sweat;1f61f:s:worried;1f625:s:concerned;1f622:s:cry;1f641:s:frown;1fae4:s:diagonal-mouth;1f615:s:slightly-frowning;1f630:s:anxious-with-sweat;1f628:s:scared;1f627:s:anguished;1f626:s:gasp;1f62e:s:mouth-open;1f62f:s:surprised;1f632:s:astonished;1f633:s:flushed;1f92f:s:mind-blown;1f616:s:scrunched-mouth;1f623:s:scrunched-eyes;1f629:s:weary;1f62b:s:distraught;1f635:s:x-eyes;1fae8:s:shaking-face;1f974:s:woozy;1f975:s:hot-face;1f976:s:cold-face;1f922:s:sick;1f92e:s:vomit;1fae9:s:tired;1f634:s:sleep;1f62a:s:sleepy;1f927:s:sneeze;1f912:s:thermometer-face;1f915:s:bandage-face;1f637:s:mask;1f925:s:liar;1f607:s:halo;1f920:s:cowboy;1f911:s:money-face;1f913:s:nerd-face;1f60e:s:sunglasses-face;1f978:s:disguise;1f921:s:clown;1f4a9:s:poop;1f608:s:imp-smile;1f47f:s:imp-frown;1f47b:s:ghost;1f480:s:skull;1f916:s:robot;1f479:s:ogre;26c4:s:snowman;1f47d:s:alien;1f47e:s:alien-monster;1f31a:s:moon-face-new;1f31d:s:moon-face-full;1f31e:s:sun-with-face;1f31b:s:moon-face-first-quarter;1f31c:s:moon-face-last-quarter;1f63a:s:smiley-cat;1f638:s:smile-cat;1f639:s:joy-cat;1f63b:s:heart-eyes-cat;1f63c:s:smirk-cat;1f63d:s:kissing-cat;1f640:s:scream-cat;1f63f:s:crying-cat-face;1f63e:s:pouting-cat;1f648:s:see-no-evil-monkey;1f649:s:hear-no-evil-monkey;1f64a:s:speak-no-evil-monkey;2b50:s:star;1f31f:s:glowing-star;2728:s:sparkles;26a1:s:electricity;1f4a5:s:collision;1faef:s:fight;1f525:s:fire;1f4af:s:100;1f389:s:party-popper;1f38a:s:confetti-ball;1f9e1:s:orange-heart;1f49b:s:yellow-heart;1f49a:s:green-heart;1fa75:s:light-blue-heart;1f499:s:blue-heart;1f49c:s:purple-heart;1f90e:s:brown-heart;1f5a4:s:black-heart;1fa76:s:grey-heart;1f90d:s:white-heart;1fa77:s:pink-heart;1f498:s:cupid;1f49d:s:gift-heart;1f496:s:sparkling-heart;1f497:s:heart-grow;1f493:s:beating-heart;1f49e:s:revolving-hearts;1f495:s:two-hearts;1f48c:s:love-letter;1f49f:s:heart-box;1f494:s:broken-heart;1f48b:s:kiss;1fac2:s:hugging;1f463:s:footprints;1fac6:s:fingerprint;1f9e0:s:brain;1fac0:s:anatomical-heart;1fa78:s:blood;1f9a0:s:microbe;1f9b4:s:bone;1f440:s:eyes;1fae6:s:biting-lip;1f443:s:nose;1f442:s:ear;1f9bb:s:hearing-aid;1f9b6:s:foot;1f9b5:s:leg;1f9bf:s:leg-mechanical;1f9be:s:arm-mechanical;1f4aa:s:muscle;1f44f:s:clap;1f44d:s:thumbs-up;1f44e:s:thumbs-down;1faf6:s:heart-hands;1f64c:s:raising-hands;1f450:s:open-hands;1f932:s:palms-up;1f91c:s:fist-rightwards;1f91b:s:fist-leftwards;270a:s:raised-fist;1f44a:s:fist;1faf3:s:palm-down;1faf4:s:palm-up;1faf1:s:rightwards-hand;1faf2:s:leftwards-hand;1faf8:s:push-rightwards;1faf7:s:push-leftwards;1f44b:s:wave;1f91a:s:back-hand;270b:s:raised-hand;1f596:s:vulcan;1f91f:s:love-you-gesture;1f918:s:metal;1f91e:s:crossed-fingers;1faf0:s:hand-with-index-finger-and-thumb-crossed;1f919:s:call-me-hand;1f90c:s:pinched-fingers;1f90f:s:pinch;1f44c:s:ok;1faf5:s:pointing;1f449:s:point-right;1f448:s:point-left;1f446:s:point-up;1f447:s:point-down;1f595:s:middle-finger;1f933:s:selfie;1f64f:s:folded-hands;1f485:s:nail-care;1f91d:s:handshake;1fa82:p:parachute;1fac8:p:hairy-creature;1f483:p:dancer-woman;1f490:a:bouquet;1f339:a:rose;1f940:a:wilted-flower;1f337:a:tulip;1fab7:a:lotus;1f338:a:cherry-blossom;1fabb:a:hyacinth;1f33c:a:blossom;1f342:a:fallen-leaf;1f341:a:maple-leaf;1f344:a:mushroom;1f33f:a:herb;1f331:a:plant;1f343:a:leaves;1f340:a:luck;1f335:a:cactus;1fabe:a:leafless-tree;1f332:a:evergreen-tree;1faa8:a:rock;1f6d8:a:debris;1f30b:a:volcano;1f305:a:sunrise;1f304:a:sunrise-over-mountains;1f30a:a:ocean;1f300:a:cyclone;1f308:a:rainbow;1f4a7:a:droplet;26c5:a:partly-sunny;1fa90:a:ringed-planet;1f30d:a:globe-showing-Europe-Africa;1f30e:a:globe-showing-Americas;1f30f:a:globe-showing-Asia-Australia;1f30c:a:milky-way;1f981:a:lion-face;1f43a:a:wolf;1f43b:a:bear-face;1f43c:a:panda;1f98a:a:fox-face;1f42e:a:cow-face;1f984:a:unicorn;1f98e:a:lizard;1f409:a:dragon;1f996:a:t-rex;1f995:a:dinosaur;1f422:a:turtle;1f40a:a:crocodile;1f40d:a:snake;1f438:a:frog;1f407:a:rabbit;1f400:a:rat;1f429:a:poodle;1f415:a:dog;1f9ae:a:guide-dog;1f416:a:pig;1f40e:a:racehorse;1facf:a:donkey;1f402:a:ox;1f410:a:goat;1f9a5:a:sloth;1f998:a:kangaroo;1f405:a:tiger;1f412:a:monkey;1f98d:a:gorilla;1f9a7:a:orangutan;1f99d:a:raccoon;1f994:a:hedgehog;1f9a6:a:otter;1f987:a:bat;1f426:a:bird;1f413:a:rooster;1f423:a:hatching-chick;1f424:a:baby-chick;1f425:a:hatched-chick;1f985:a:eagle;1f989:a:owl;1fabf:a:goose;1f9a9:a:flamingo;1f99a:a:peacock;1f427:a:penguin;1f9ad:a:seal;1f988:a:shark;1facd:a:orca;1f42c:a:dolphin;1f433:a:whale;1f41f:a:fish;1f421:a:blowfish;1f99e:a:lobster;1f980:a:crab;1f419:a:octopus;1fabc:a:jellyfish;1fae7:a:bubbles;1f982:a:scorpion;1f40c:a:snail;1f41c:a:ant;1f997:a:cricket;1f99f:a:mosquito;1fab3:a:cockroach;1fab0:a:fly;1f41d:a:bee;1f41e:a:lady-bug;1f98b:a:butterfly;1f41b:a:bug;1fab1:a:worm;1f43e:a:paw prints;1f353:c:strawberry;1f352:c:cherries;1f34e:c:red-apple;1f345:c:tomato;1f349:c:watermelon;1f34a:c:tangerine;1f955:c:carrot;1f96d:c:mango;1f34d:c:pineapple;1f33d:c:ear-of-corn;1f34b:c:lemon;1f348:c:melon;1f350:c:pear;1fadb:c:pea-pod;1f96c:c:leafy-green;1fad1:c:bell-pepper;1f95d:c:kiwi-fruit;1f951:c:avocado;1f966:c:broccoli;1f952:c:cucumber;1fad0:c:blueberries;1f347:c:grapes;1fadc:c:root-vegetable;1f954:c:potato;1f9c5:c:onion;1fada:c:ginger;1f9c4:c:garlic;1fad8:c:beans;1f35e:c:bread;1f95e:c:pancakes;1f373:c:cooking;1f9c0:c:cheese-wedge;1f953:c:bacon;1f357:c:poultry-leg;1f354:c:hamburger;1f32d:c:hot-dog;1f968:c:pretzel;1f355:c:pizza;1f32e:c:taco;1f32f:c:burrito;1f35d:c:spaghetti;1f957:c:green-salad;1f35c:c:steaming-bowl;1f362:c:oden;1f361:c:dango;1f368:c:ice-cream;1f366:c:soft-ice-cream;1f967:c:pie;1f369:c:doughnut;1f36a:c:cookie;1f9c2:c:salt;1f37f:c:popcorn;1f9cb:c:bubble-tea;1f9c3:c:beverage-box;1f37c:c:baby-bottle;1f375:c:teacup-without-handle;2615:c:hot-beverage;1fad6:c:teapot;1f9c9:c:mate;1f37b:c:clinking-beer-mugs;1f942:c:clinking-glasses;1f37e:c:bottle-with-popping-cork;1f377:c:wine-glass;1fad7:c:pour;1f379:c:tropical-drink;1f962:c:chopsticks;1f6d1:v:stop-sign;1f6a7:v:construction;1f6a8:v:police-car-light;26fd:v:fuel-pump;1f6df:v:ring-buoy;2693:v:anchor;1f6a6:v:vertical-traffic-light;1f6b2:v:bicycle;1f697:v:automobile;1f69a:v:delivery-truck;1f69c:v:tractor;1f695:v:taxi;1f68c:v:bus;1f682:v:locomotive;26f5:v:sailboat;1f6f6:v:canoe;1f6f8:v:flying-saucer;1f680:v:rocket;1f6eb:v:airplane-departure;1f6ec:v:airplane-arrival;1f3a2:v:roller-coaster;1f3a1:v:ferris-wheel;1f3a0:v:carousel-horse;1f5ff:v:moai;1f3e0:v:house;1f307:v:sunset;1f388:e:balloon;1f382:e:birthday-cake;1f381:e:wrapped-gift;1f386:e:fireworks;1fa94:e:diya-lamp;1fa85:e:piñata;1faa9:e:mirror-ball;1f947:e:gold-medal;1f948:e:silver-medal;1f949:e:bronze-medal;1f3c6:e:trophy;26bd:e:soccer-ball;26be:e:baseball;1f94e:e:softball;1f3c0:e:basketball;1f3c9:e:rugby-football;1f3be:e:tennis;1f3f8:e:badminton;1f94d:e:lacrosse;1f3cf:e:cricket-game;1f3d1:e:field-hockey;1f3d2:e:ice-hockey;1f3bf:e:skis;1f6fc:e:roller-skates;1fa70:e:ballet-shoes;1f6f9:e:skateboard;26f3:e:flag-in-hole;1f3af:e:direct-hit;1f94f:e:flying-disc;1fa83:e:boomerang;1fa81:e:kite;1f3a3:e:fishing-pole;1f94b:e:martial-arts-uniform;1f3b1:e:8-ball;1f3d3:e:ping-pong;1f3b3:e:bowling;1f3b2:e:die;1f3b0:e:slot-machine;1fa84:e:wand;1f4f7:e:camera;1f4f8:e:camera-flash;1fadf:e:splatter;1f3b7:e:saxophone;1f3ba:e:trumpet;1fa8a:e:trombone;1f3b8:e:guitar;1fa95:e:banjo;1f3bb:e:violin;1fa89:e:harp;1f941:e:drum;1fa87:e:maracas;1f4fa:e:television;1f3ac:e:clapper;1f3ad:e:performing-arts;1f4df:o:pager;1f50c:o:electric-plug;1f50b:o:battery-full;1faab:o:battery-low;1f4bf:o:optical-disk;1f4bb:o:laptop-computer;1fa8e:o:treasure;1fa99:o:coin;1f48e:o:gem-stone;1f4b8:o:money-with-wings;1f6d2:o:shopping-cart;1f4a1:o:light-bulb;1f9f9:o:broom;1f9e6:o:socks;1f393:o:graduation-cap;1f451:o:crown;1f48d:o:ring;1faad:o:fan;1f460:o:high-heeled-shoe;1f45f:o:running-shoe;1fa7a:o:stethoscope;1fa8f:o:shovel;1f4da:o:books;1f4ca:o:bar-chart;1f4c8:o:chart-increasing;1f4c9:o:chart-decreasing;1f4e6:o:package;23f0:o:alarm-clock;231b:o:hourglass-done;23f3:o:hourglass-not-done;1f514:o:bell;1f4e3:o:megaphone;1f50e:o:magnifying-glass-tilted-right;1f52e:o:crystal-ball;1f4a3:o:bomb;1faa4:o:mouse-trap;1f512:o:locked;2648:y:Aries;2649:y:Taurus;264a:y:Gemini;264b:y:Cancer;264c:y:Leo;264d:y:Virgo;264e:y:Libra;264f:y:Scorpio;2650:y:Sagittarius;2651:y:Capricorn;2652:y:Aquarius;2653:y:Pisces;26ce:y:Ophiuchus;1f4ac:y:speech-bubble;2757:y:exclamation;2753:y:question;274c:y:cross-mark;1f198:y:sos;1f4f4:y:phone-off;2705:y:check-mark;1f195:y:new;1f193:y:free;1f199:y:up!;1f197:y:ok-button;1f192:y:cool;1f6ae:y:litter;1f3b6:y:musical-notes;2795:y:plus-sign;1f3c1:f:chequered-flag;1f6a9:f:triangular-flag;1f3f4:f:black-flag'.split(';').map(x => { const [cp, k, ...t] = x.split(':'); return { cp, k, t: t.join(':') }; });
  const categoriasNoto = [['t', 'Todas'], ['d', 'Destaques'], ['s', 'Carinhas'], ['a', 'Bichos e natureza'], ['c', 'Comida'], ['e', 'Festa e esportes'], ['v', 'Viagem'], ['o', 'Objetos'], ['y', 'Símbolos']];
  const urlNoto = (cp) => 'https://fonts.gstatic.com/s/e/notoemoji/latest/' + cp + '/512.webp';
  const arquivoBiblioteca = (id) => '../../assets/avatares/' + id + '.webp';
  const chaveAvatar = (u) => 'avatar:' + (u?.login || u?.email || 'usuario');
  const lerAvatar = (u) => { try { return JSON.parse(localStorage.getItem(chaveAvatar(u)) || 'null'); } catch { return null; } };
  const urlsAvatar = new Map();
  function urlDaImagem(a) {
    const k = a.mime + a.base64.length + a.base64.slice(-24);
    if (!urlsAvatar.has(k)) { const bin = atob(a.base64); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); urlsAvatar.set(k, URL.createObjectURL(new Blob([b], { type: a.mime }))); }
    return urlsAvatar.get(k);
  }
  function pintarAvatar(no, u) {
    const a = lerAvatar(u); no.replaceChildren(); no.removeAttribute('data-modelo'); no.classList.remove('com-foto');
    if (a?.tipo === 'imagem') { no.classList.add('com-foto'); no.append(h('img', { src: urlDaImagem(a), alt: '', draggable: 'false' })); }
    else if (a?.tipo === 'biblioteca') { no.classList.add('com-foto'); no.append(h('img', { src: arquivoBiblioteca(a.id), alt: '', draggable: 'false' })); }
    else if (a?.tipo === 'modelo') { no.setAttribute('data-modelo', a.id); no.append(h('i', { 'aria-hidden': 'true' })); }
    else no.textContent = iniciais(u?.nome);
  }
  function avatar(u, { classe = 'conta-iniciais' } = {}) {
    const no = h('span', { class: classe + ' ds-avatar', 'aria-hidden': 'true', 'data-i18n-ignore': '', 'data-avatar': chaveAvatar(u) });
    pintarAvatar(no, u); return no;
  }
  function atualizarAvatares(u) { for (const no of document.querySelectorAll('[data-avatar="' + chaveAvatar(u) + '"]')) pintarAvatar(no, u); }
  function guardarAvatar(u, valor) { try { if (valor) localStorage.setItem(chaveAvatar(u), JSON.stringify(valor)); else localStorage.removeItem(chaveAvatar(u)); } catch { avisar(tr('Não foi possível guardar a foto neste computador.'), true); return false; } atualizarAvatares(u); return true; }
  const LIMITE_FOTO = 2 * 1024 * 1024;
  function trocarFoto(u) {
    const arquivo = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/gif,image/webp', hidden: true, id: 'foto-arquivo', 'aria-label': tr('Escolher imagem do computador') });
    const link = h('input', { type: 'url', id: 'foto-link', placeholder: 'https://…', 'aria-label': tr('Link da imagem'), maxlength: 2000 });
    const msg = h('p', { class: 'ds-avatar-msg', role: 'status' });
    const previa = h('div', { class: 'ds-avatar-previa' });
    const pintarPrevia = () => previa.replaceChildren(avatar(u, { classe: 'ds-avatar-grande' }), msg);
    const aviso = (t) => { msg.textContent = t; };
    const escolher = (valor, texto) => { if (guardarAvatar(u, valor)) { pintarPrevia(); aviso(texto || tr('Foto atualizada.')); } };
    const salvarImagem = (mime, base64) => escolher({ tipo: 'imagem', mime, base64 });
    arquivo.addEventListener('change', () => {
      const f = arquivo.files?.[0]; arquivo.value = ''; if (!f) return;
      if (!/^image\/(png|jpeg|gif|webp)$/.test(f.type)) { aviso(tr('Use uma imagem PNG, JPEG, GIF ou WebP.')); return; }
      if (f.size > LIMITE_FOTO) { aviso(tr('A imagem passa de 2 MB.')); return; }
      const leitor = new FileReader(); leitor.onload = () => salvarImagem(f.type, String(leitor.result).split(',')[1] || ''); leitor.readAsDataURL(f);
    });
    const usarLink = async () => {
      if (!link.value.trim()) { link.focus(); return; }
      aviso(tr('Baixando…'));
      const r = await api.contaImagemLink(link.value.trim());
      if (!r?.ok) { const t = String(r?.error || '').replace(/^[A-Z_]+:\s*/, ''); aviso(t ? t.charAt(0).toUpperCase() + t.slice(1) : tr('Não foi possível usar esse link.')); return; }
      link.value = ''; salvarImagem(r.data.mime, r.data.base64);
    };
    link.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); void usarLink(); } });
    const opcao = (rotulo, conteudo, valor) => h('button', { type: 'button', class: 'ds-avatar-opcao', 'aria-label': tr(rotulo), title: tr(rotulo), onclick: () => escolher(valor) }, conteudo, h('span', {}, tr(rotulo)));
    const busca = h('input', { type: 'search', id: 'foto-busca', placeholder: tr('Buscar'), 'aria-label': tr('Buscar figurinha'), maxlength: 60, autocomplete: 'off' });
    const chips = h('div', { class: 'ds-avatar-chips', role: 'group', 'aria-label': tr('Categorias') });
    const rio = h('div', { class: 'ds-avatar-rio' });
    const fim = h('p', { class: 'ds-avatar-credito' });
    let categoria = 'd'; const pagina = 90; let limite = pagina; let lista = [];
    const escolherNoto = async (cp) => { aviso(tr('Baixando…')); const r = await api.contaImagemLink(urlNoto(cp)); if (!r?.ok) { aviso(tr('Sem internet para baixar essa figurinha. Os destaques funcionam offline.')); return; } salvarImagem(r.data.mime, r.data.base64); };
    const desenharRio = () => {
      const q = busca.value.trim().toLowerCase();
      lista = categoria === 'd' ? [] : catalogoNoto.filter(i => (categoria === 't' || i.k === categoria) && (!q || i.t.toLowerCase().includes(q)));
      rio.replaceChildren();
      if (categoria === 'd') {
        for (const [id, nome] of bibliotecaAvatar) rio.append(opcao(nome, h('img', { src: arquivoBiblioteca(id), alt: '', draggable: 'false' }), { tipo: 'biblioteca', id }));
        fim.replaceChildren(info(tr('Emojis animados Noto, Google (CC BY 4.0).'))); return;
      }
      for (const i of lista.slice(0, limite)) rio.append(h('button', { type: 'button', class: 'ds-avatar-opcao ds-avatar-figurinha', 'aria-label': i.t, title: i.t, onclick: () => escolherNoto(i.cp) }, h('img', { src: urlNoto(i.cp), alt: '', loading: 'lazy', draggable: 'false' })));
      fim.replaceChildren(lista.length ? info(tr('Emojis animados Noto, Google (CC BY 4.0).')) : tr('Nada encontrado.'), lista.length > limite ? acao('Ver mais', () => { limite += pagina; desenharRio(); }, { compacto: true, id: 'foto-ver-mais' }) : null);
    };
    for (const [k, nome] of categoriasNoto.filter(c => c[0] !== 't' || true)) chips.append(h('button', { type: 'button', class: 'ds-avatar-chip', 'data-cat': k, 'aria-pressed': String(k === categoria), onclick: () => { categoria = k; limite = pagina; for (const c of chips.children) c.setAttribute('aria-pressed', String(c.dataset.cat === k)); desenharRio(); } }, tr(nome)));
    busca.addEventListener('input', () => { if (categoria === 'd') { categoria = 't'; for (const c of chips.children) c.setAttribute('aria-pressed', String(c.dataset.cat === 't')); } limite = pagina; desenharRio(); });
    const biblioteca = h('div', {}, busca, chips, rio, fim); desenharRio();
    const modelos = h('div', { class: 'ds-avatar-grade' }, modelosAvatar.map(([id, nome]) => opcao(nome, h('span', { class: 'conta-iniciais ds-avatar', 'data-modelo': id, 'aria-hidden': 'true' }, h('i')), { tipo: 'modelo', id })));
    const doComputador = h('div', { class: 'ds-avatar-painel' }, h('div', { class: 'ds-cab-acoes' }, acao('Escolher do computador', () => arquivo.click(), { id: 'foto-escolher', primaria: true, icone: 'arquivo' }), info(tr('PNG, JPEG, GIF ou WebP, até 2 MB.')), arquivo));
    const porLink = h('div', { class: 'ds-avatar-painel' }, h('div', { class: 'ds-avatar-linha' }, link, acao('Usar link', usarLink, { id: 'foto-usar-link', primaria: true })));
    const paineis = { biblioteca, modelos, computador: doComputador, link: porLink };
    const area = h('div', { class: 'ds-avatar-area' });
    const mostrar_ = (k) => { area.replaceChildren(paineis[k] || biblioteca); };
    const abas = abasTela([['biblioteca', 'Figurinhas'], ['modelos', 'Modelos'], ['computador', 'Do computador'], ['link', 'Por link']], 'biblioteca', mostrar_, { id: 'foto-abas', rotulo: 'Origem da foto' });
    pintarPrevia(); mostrar_('biblioteca');
    modal('Foto do perfil', [previa, abas, area, h('div', { class: 'ds-cab-acoes ds-mt' }, acao('Remover foto', () => escolher(null, tr('Foto removida.')), { id: 'foto-remover', compacto: true }))], { tamanho: 'md' });
  }
  const iniciais = (nome) => (String(nome || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('') || '?').toUpperCase();
  const tom = (s) => tomEstado[s] || null;
  /** Consulta da tela falhou (o motivo já foi para o aviso): estado de erro com "Tentar de novo", nunca tela em branco. */
  const falhaConsulta = (aba, titulo) => estadoTela('erro', titulo || 'Não foi possível carregar esta tela', 'A consulta falhou e o motivo apareceu no aviso. Nada foi alterado.', [acao('Tentar de novo', () => mostrar(aba), { icone: 'atualizar' })], { id: 'falha-consulta' });
  return { icone, cabecalho, acao, link, trilha, fluxoProjeto, barra, busca, selecao, tabela, chip, origem, estadoTela, falhaConsulta, carregando, esqueleto, alerta, info, notaPermissao, abas: abasTela, campo, grupo, meta, secao, bloco, texto, recolher, resumo, tempo, modal, fecharModal, rodape, abasModal, iniciais, avatar, trocarFoto, tom, nomesServico };
})();
// Todas as telas usam a base do Design System. Início e Agentes mantêm largura livre para chat e canvas.
(() => {
  const telas = new Set(['inicio', 'projetos', 'tickets', 'testes', 'agenda', 'evidencias', 'metricas', 'logs', 'conexoes', 'agentes', 'suporte', 'ajuda', 'administracao']);
  const marcar = (aba) => { const c = document.querySelector('#conteudo'); if (!c) return; if (telas.has(aba)) c.dataset.dsTela = aba; else delete c.dataset.dsTela; };
  const base = mostrar;
  mostrar = async function (aba) { if (aba !== 'evidencias') marcar(rotasVirtuais[aba]?.[0] || aba); const r = await base(aba); if (aba !== 'evidencias') marcar(estado.aba); return r; };
})();

/** Componentes simples de formulário do Design System: auxiliares usados por todas as telas. */
/** Componentes compartilhados: campos, botões, dados e estados vazios. */
/** Componentes reutilizáveis: botão de ação e campo de formulário. */
const botao = (texto, fn, id) => h('button', {class:'acao', id, onclick:async e => { const b=e.currentTarget;b.disabled=true; try { await fn(); } catch { avisar('Falha ao concluir a ação.',true); } finally { b.disabled=false; } }}, texto);

const campoPlataforma = (texto, attrs={}) => { const input=h('input', attrs); return {input, no:h('label', {class:'campo'}, texto, input)}; };

/** Apresenta dados estruturados sem alterar a resposta recebida. */
const dadosVisiveis = v => h('pre', {}, JSON.stringify(v,null,2));

/** Apresenta instrução quando nenhuma pasta ou projeto foi selecionado. */
const faltaEspaco = () => h('div',{class:'vazio'},'Selecione um projeto Prumo em Projetos. Uma pasta local é opcional.');
