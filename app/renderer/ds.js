'use strict';
// Prumo Design System (v40): componentes de apresentação comuns às telas. Só monta nós com h()/textContent;
// não chama o núcleo nem guarda dados. Documentação: docs/DESIGN-SYSTEM.md.
const DS = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const caminhos = {
    busca: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20 20l-4-4'],
    mais: ['M12 5v14', 'M5 12h14'],
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
    pausa: ['M8 5v14', 'M16 5v14'],
    arquivo: ['M6 3h8l4 4v14H6z', 'M14 3v4h4'],
    imagem: ['M4 5h16v14H4z', 'M4 16l5-5 4 4 3-3 4 4', 'M15.5 9.5v.01'],
    video: ['M3 6h13v12H3z', 'M16 10l5-3v10l-5-3z'],
    codigo: ['M8 7l-5 5 5 5', 'M16 7l5 5-5 5'],
    baixar: ['M12 4v11', 'M7 10l5 5 5-5', 'M5 20h14'],
    cadeado: ['M6 11h12v10H6z', 'M8 11V8a4 4 0 0 1 8 0v3'],
    vazio: ['M4 7h16v12H4z', 'M4 7l3-3h10l3 3', 'M9 12h6'],
    livro: ['M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z', 'M4 19V5'],
    pasta: ['M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    editar: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
    filtro: ['M4 5h16l-6 7v6l-4 2v-8z'],
    escudo: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'],
    pulso: ['M3 12h4l2-6 4 12 2-6h6']
  };
  function icone(nome, rotulo) {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ds-ic');
    if (rotulo) { s.setAttribute('role', 'img'); s.setAttribute('aria-label', rotulo); } else { s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false'); }
    for (const d of caminhos[nome] || []) { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); s.append(p); }
    return s;
  }
  const t = (x) => (typeof x === 'string' ? tr(x) : x);

  /** Cabeçalho da tela: título, contagem, uma linha de contexto e ações à direita. */
  function cabecalho({ titulo, contagem, descricao, acoes = [], idContagem }) {
    const n = contagem === undefined || contagem === null ? null : h('span', { class: 'ds-contagem', id: idContagem || null, 'aria-label': tr('{n} itens', { n: contagem }) }, String(contagem));
    return h('div', { class: 'ds-cab' }, h('div', { class: 'ds-cab-titulo' }, h('h1', {}, tr(titulo), n), descricao ? h('p', { class: 'ds-desc' }, [].concat(descricao).map(t)) : null),
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
    if (aoEnter) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); aoEnter(); } });
    return { input, no: h('div', { class: 'ds-busca' }, icone('busca'), input) };
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
  function alerta(texto, tom, ic) { return h('div', { class: 'ds-alerta', 'data-tom': tom || null, role: tom === 'falha' ? 'alert' : null }, icone(ic || (tom === 'ok' ? 'ok' : tom === 'falha' || tom === 'aviso' ? 'alerta' : 'escudo')), h('div', {}, [].concat(texto).map(t))); }
  function notaPermissao(texto) { return h('p', { class: 'ds-nota-perm' }, icone('cadeado'), h('span', {}, t(texto))); }
  /** Abas: itens [[chave, rótulo, contagem?]]; aoTrocar(chave). Usa aria-selected (tablist). */
  function abasTela(itens, atual, aoTrocar, { id, rotulo = 'Seções', attr = 'data-aba-ds' } = {}) {
    const nav = h('div', { class: 'ds-abas', role: 'tablist', 'aria-label': tr(rotulo), id: id || null });
    const marcar = (k) => { for (const b of nav.children) b.setAttribute('aria-selected', String(b.getAttribute(attr) === k)); };
    for (const [k, txt, n] of itens) nav.append(h('button', { type: 'button', role: 'tab', [attr]: k, 'aria-selected': String(k === atual), onclick: () => { marcar(k); aoTrocar(k); } }, t(txt), n !== undefined && n !== null ? h('span', { class: 'ds-n' }, String(n)) : null));
    nav.addEventListener('keydown', (e) => { if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return; const bs = [...nav.children]; const i = bs.indexOf(document.activeElement); if (i < 0) return; const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length; bs[j].focus(); bs[j].click(); });
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
  function resumo(itens, { id } = {}) { return h('div', { class: 'ds-resumo', id: id || null }, itens.filter(Boolean).map(([n, rot, tom]) => h('div', { 'data-tom': tom || null }, h('b', {}, String(n ?? 0)), h('span', {}, tr(rot))))); }
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
    const exibir = async (k) => {
      for (const [chave, no] of feitos) no.hidden = chave !== k;
      if (!feitos.has(k)) { const p = paineis.find((x) => x[0] === k); const no = h('div', { role: 'tabpanel', 'data-painel': k }, carregando()); feitos.set(k, no); area.append(no); try { no.replaceChildren(...[].concat(await p[3]()).filter(Boolean)); } catch { no.replaceChildren(estadoTela('erro', 'Não foi possível carregar esta seção.')); } }
    };
    const nav = abasTela(paineis.map(([k, txt, n]) => [k, txt, n]), inicial || paineis[0][0], exibir, { rotulo: 'Seções do detalhe' });
    exibir(inicial || paineis[0][0]);
    return [nav, area];
  }
  const iniciais = (nome) => (String(nome || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('') || '?').toUpperCase();
  const tom = (s) => tomEstado[s] || null;
  /** Consulta da tela falhou (o motivo já foi para o aviso): estado de erro com "Tentar de novo", nunca tela em branco. */
  const falhaConsulta = (aba, titulo) => estadoTela('erro', titulo || 'Não foi possível carregar esta tela', 'A consulta falhou e o motivo apareceu no aviso. Nada foi alterado.', [acao('Tentar de novo', () => mostrar(aba), { icone: 'atualizar' })], { id: 'falha-consulta' });
  return { icone, cabecalho, acao, link, barra, busca, selecao, tabela, chip, origem, estadoTela, falhaConsulta, carregando, esqueleto, alerta, notaPermissao, abas: abasTela, campo, grupo, meta, secao, bloco, texto, recolher, resumo, tempo, modal, fecharModal, rodape, abasModal, iniciais, tom, nomesServico };
})();
// Telas que usam o layout do Design System (largura útil maior e barras sem caixa).
(() => {
  const telas = new Set(['tickets', 'testes', 'agenda', 'execucoes', 'rastreabilidade', 'suporte', 'ajuda']);
  const virtuais = { runs: 'testes', automacoes: 'testes', vinculos: 'rastreabilidade' };
  const marcar = (aba) => { const c = document.querySelector('#conteudo'); if (!c) return; if (telas.has(aba)) c.dataset.dsTela = aba; else delete c.dataset.dsTela; };
  const base = mostrar;
  mostrar = async function (aba) { if (aba !== 'evidencias') marcar(virtuais[aba] || aba); const r = await base(aba); if (aba !== 'evidencias') marcar(estado.aba); return r; };
})();
// Textos do estado de falha de consulta (auditoria 2.9): ficam com o componente para não redefinir chaves dos arquivos i18n-en-*.
Object.assign(window.PRUMO_EN || (window.PRUMO_EN = {}), {
  'Não foi possível carregar esta tela': 'This screen could not be loaded',
  'A consulta falhou e o motivo apareceu no aviso. Nada foi alterado.': 'The query failed and the reason was shown in the notice. Nothing was changed.',
  'Tentar de novo': 'Try again'
});
