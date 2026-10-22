/** IDE de Testes: workbench (barra de atividades, abas, painel inferior, barra de status e atalhos) compartilhado por Código e Pipelines. */
'use strict';
// Layout inspirado nas partes do VS Code (barra de atividades, barra lateral, editor com abas, painel e barra de status). O editor é o Monaco, o mesmo do VS Code,
// numa página isolada (telas/editor-de-codigo); tudo que escreve (salvar, criar) continua nos canais do Prumo com confirmação nativa.
(() => {
  const TIPOS_DE_ARQUIVO = [[/\.(?:[cm]?[jt]sx?)$/i, 'script', 'codigo'], [/\.py$/i, 'python', 'codigo'], [/\.feature$/i, 'feature', 'livro'], [/\.(?:ya?ml|json|toml|ini)$/i, 'config', 'arquivo'],
    [/\.(?:md|txt)$/i, 'doc', 'livro'], [/\.(?:png|jpe?g|gif|svg|webp)$/i, 'imagem', 'imagem']];
  const tipoDoArquivo = (nome) => TIPOS_DE_ARQUIVO.find(([re]) => re.test(nome)) || [null, 'texto', 'arquivo'];
  const recuo = (linha) => linha.length - linha.trimStart().length;

  /** Botão de arquivo do explorador, com ícone e cor por tipo. */
  function botaoDeArquivo(arquivo, nome, aoAbrir, detalhe, aoFixar) {
    const [, tipo, ic] = tipoDoArquivo(arquivo);
    return h('button', { type: 'button', class: 'ds-ide-arquivo', 'data-arquivo': arquivo, 'data-tipo': tipo, title: arquivo, onclick: () => aoAbrir(arquivo), ondblclick: () => aoFixar?.(arquivo) },
      DS.icone(ic), h('span', {}, nome), detalhe ? h('span', { class: 'ds-sub' }, detalhe) : null);
  }

  /** Resumo de um workflow lido do texto (usado quando o arquivo vem do GitHub, sem passar pelo backend). */
  function resumoDoWorkflow(texto) {
    const linhas = texto.split(/\r?\n/); const nome = /^name:\s*["']?(.+?)["']?\s*$/m.exec(texto)?.[1] || null;
    const noJobs = linhas.findIndex((l) => /^jobs:\s*$/.test(l));
    const jobs = noJobs < 0 ? [] : linhas.slice(noJobs + 1).filter((l) => /^ {2}[\w-]+:\s*$/.test(l)).map((l) => l.trim().slice(0, -1));
    const eventos = []; const inicio = linhas.findIndex((l) => /^["']?on["']?:/.test(l));
    if (inicio >= 0) { const em = linhas[inicio].replace(/^["']?on["']?:\s*/, '').replace(/[\[\]\s]/g, ''); if (em) eventos.push(...em.split(',')); else for (const l of linhas.slice(inicio + 1)) { if (/^\S/.test(l) && l.trim()) break; const m = /^ {2}([\w-]+):/.exec(l); if (m) eventos.push(m[1]); } }
    return { nome, eventos, jobs };
  }

  /** Lê um diff unificado de um arquivo e devolve os trechos da versão nova: linhas novas (add), alteradas (mod) e o ponto onde algo foi removido (del). */
  function trechosDoDiff(diff) {
    const itens = []; let nova = 0, dentro = false, removidas = 0, adicionadas = [];
    const fecharBloco = () => {
      if (adicionadas.length) itens.push({ de: adicionadas[0], ate: adicionadas.at(-1), tipo: removidas ? 'mod' : 'add' });
      else if (removidas) itens.push({ de: Math.max(1, nova), ate: Math.max(1, nova), tipo: 'del' });
      removidas = 0; adicionadas = [];
    };
    for (const l of String(diff || '').split('\n')) {
      const cab = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(l);
      if (cab) { fecharBloco(); nova = Number(cab[1]); dentro = true; continue; }
      if (!dentro || l.startsWith('\\')) continue;
      if (l.startsWith('+')) adicionadas.push(nova++); else if (l.startsWith('-')) removidas++; else { fecharBloco(); nova++; }
    }
    fecharBloco(); return itens;
  }

  /** Verificação simples no navegador (não substitui o validador do GitHub Actions): JSON e estrutura básica de YAML. */
  function problemasDe(arquivo, texto) {
    const p = []; const linhas = texto.split(/\r?\n/);
    if (/\.json$/i.test(arquivo)) {
      try { JSON.parse(texto); } catch (x) { const m = /position (\d+)/.exec(x.message); p.push({ linha: m ? texto.slice(0, Number(m[1])).split('\n').length : 1, nivel: 'erro', texto: x.message }); }
      return p;
    }
    if (!/\.ya?ml$/i.test(arquivo)) return p;
    let bloco = -1;
    linhas.forEach((l, i) => {
      if (bloco >= 0 && (!l.trim() || recuo(l) > bloco)) return; bloco = -1;
      if (/^\s*\t/.test(l)) p.push({ linha: i + 1, nivel: 'erro', texto: tr('Tabulação no recuo: YAML só aceita espaços.') });
      if (/:\s*[|>][+-]?\s*$/.test(l)) { bloco = recuo(l); return; }
      const s = l.replace(/#.*$/, '').replace(/\$\{\{.*?\}\}/g, '').replace(/(["']).*?\1/g, '');
      const conta = (a, b) => s.split(a).length - s.split(b).length;
      if (conta('[', ']') !== 0 || conta('{', '}') !== 0) p.push({ linha: i + 1, nivel: 'aviso', texto: tr('Colchetes ou chaves sem par nesta linha.') });
    });
    if (!/\.github\/workflows\//.test(arquivo)) return p;
    if (!linhas.some((l) => /^["']?on["']?:/.test(l))) p.push({ linha: 1, nivel: 'erro', texto: tr('O workflow não tem "on:" (quando ele roda).') });
    const noJobs = linhas.findIndex((l) => /^jobs:/.test(l));
    if (noJobs < 0) { p.push({ linha: 1, nivel: 'erro', texto: tr('O workflow não tem "jobs:".') }); return p; }
    const cabecas = []; for (let i = noJobs + 1; i < linhas.length; i++) { if (/^\S/.test(linhas[i]) && linhas[i].trim()) break; if (/^ {2}[\w-]+:\s*$/.test(linhas[i])) cabecas.push(i); }
    if (!cabecas.length) p.push({ linha: noJobs + 1, nivel: 'erro', texto: tr('Nenhum job declarado em "jobs:".') });
    cabecas.forEach((inicio, k) => {
      const corpo = linhas.slice(inicio + 1, cabecas[k + 1] ?? linhas.length).join('\n'); const nome = linhas[inicio].trim().slice(0, -1);
      if (!/^ {4}(runs-on|uses):/m.test(corpo)) p.push({ linha: inicio + 1, nivel: 'erro', texto: tr('O job "{n}" não tem "runs-on".', { n: nome }) });
      if (!/^ {4}(steps|uses):/m.test(corpo)) p.push({ linha: inicio + 1, nivel: 'erro', texto: tr('O job "{n}" não tem "steps".', { n: nome }) });
    });
    return p;
  }

  /**
   * Monta o workbench dentro de `corpo`. `o`: e, id, rotuloArvore, recursos {buscar, git}, lerArquivo(arquivo) -> {ok, conteudo, editavel, hash, linhas, motivo, destacar, vazio} | {ok:false, erro},
   * gravar(arquivo, texto, hash), aoAtivar(arquivo, linha), aoSalvar(r, arquivo), lateral(aba|null) -> nós do painel à direita, barra (nós do explorador),
   * recarregarArvore(), testesDoArquivo(arquivo), arquivosDeTeste(), executarExtra (nós), vazio {titulo, descricao}.
   */
  function montar(corpo, o) {
    const { e, id = 'ide', recursos = {} } = o; const abas = []; const saida = [];
    let ativa = null, ultimoEsc = 0, acordeK = false, cursor = null, buscarPorPedido = null, quebra = false, minimapa = true, fonte = 14, armado = false, visao = 'explorador', painelAba = o.lateral ? 'detalhes' : 'problemas', problemas = [], rModo = 'arquivo', rItens = [], rSel = 0;
    const registrar = (texto) => { saida.push(new Date().toLocaleTimeString('pt-BR') + '  ' + texto); if (painelAba === 'saida') desenharPainel(); };
    const nomeDe = (arquivo) => arquivo.split('/').pop();

    const caixa = h('div', { class: 'ds-ide ds-wb', id, 'data-lateral': window.innerWidth < 720 ? 'fechada' : 'aberta', 'data-painel': 'fechado' });
    const atividades = h('nav', { class: 'ds-wb-atividades', 'aria-label': tr('Barra de atividades') });
    const lateral = h('div', { class: 'ds-ide-arvore ds-wb-lateral' });
    const visoes = Object.fromEntries(['explorador', 'buscar', 'git', 'executar'].map((k) => [k, h('section', { class: 'ds-wb-visao', 'data-visao': k, hidden: k !== 'explorador' })]));
    const arvoreEl = h('nav', { class: 'ds-wb-arvore', 'aria-label': o.rotuloArvore });
    lateral.append(...Object.values(visoes));
    let detalhes = [];

    // ---------- Editor: abas, trilha, área e painel inferior ----------
    const listaAbas = h('div', { class: 'ds-wb-abas', role: 'tablist', 'aria-label': tr('Arquivos abertos') });
    const salvarBtn = DS.acao('Salvar', () => salvar(), { id: 'ide-salvar', primaria: true, compacto: true, titulo: 'Ctrl+S', desabilitado: true });
    const descartarBtn = DS.acao('Descartar', () => descartar(), { id: 'ide-descartar', compacto: true, desabilitado: true });
    const bloqueadoEl = h('span', { class: 'ds-chip', id: 'ide-bloqueado', hidden: true, 'data-tom': 'aviso', title: tr('O arquivo contém o que parece um segredo; o Prumo não o exibe para edição. Edite em outro editor.') }, tr('Edição bloqueada'));
    const trilha = h('nav', { class: 'ds-wb-trilha', 'aria-label': tr('Caminho do arquivo') });
    const area = h('div', { class: 'ds-wb-area' }); const vistaEl = h('div', { class: 'ds-wb-vista', hidden: true });
    const editorDeCodigo = window.PrumoEditorDeCodigo.criar((m) => aoEventoDoEditor(m)); area.append(editorDeCodigo.quadro, vistaEl);
    // Preferências do editor (quebra de linha, minimapa, tamanho da fonte) ficam neste computador, para quem passa horas aqui.
    try { const g = JSON.parse(localStorage.getItem('prumo.ide.editor') || '{}'); if (typeof g.quebra === 'boolean') quebra = g.quebra; if (typeof g.minimapa === 'boolean') minimapa = g.minimapa; if (Number.isFinite(g.fonte)) fonte = Math.max(10, Math.min(28, g.fonte)); } catch { /* sem armazenamento: usa o padrão */ }
    const guardarOpcoes = () => { try { localStorage.setItem('prumo.ide.editor', JSON.stringify({ quebra, minimapa, fonte })); } catch { /* sem armazenamento */ } };
    editorDeCodigo.opcoes({ quebra, minimapa, fonte });
    const btn = (rotulo, fn, texto, extra = {}) => h('button', { type: 'button', class: 'ds-wb-mini', 'aria-label': tr(rotulo), title: tr(rotulo), onclick: fn, ...extra }, texto);
    const painelBaixo = h('section', { class: 'ds-wb-painel', 'aria-label': tr('Painel inferior') });
    const abasPainel = h('div', { class: 'ds-wb-painel-abas', role: 'tablist', 'aria-label': tr('Painel inferior') });
    const conteudoPainel = h('div', { class: 'ds-wb-painel-corpo', role: 'tabpanel' });
    const terminalDaIde = o.terminal ? window.PrumoTerminalDaIde.criar((m) => aoEventoDoTerminal(m)) : null;
    painelBaixo.append(h('div', { class: 'ds-wb-painel-cab' }, abasPainel, btn('Recolher ou expandir painel', alternarPainel, '⌄', { id: 'ide-painel-alternar', 'aria-expanded': 'false' })), conteudoPainel, ...(terminalDaIde ? [terminalDaIde.quadro] : []));
    const editor = h('section', { class: 'ds-ide-editor ds-wb-editor' }, h('div', { class: 'ds-wb-abas-barra' }, listaAbas, h('div', { class: 'ds-wb-abas-acoes' }, bloqueadoEl, salvarBtn, descartarBtn)), trilha, area, painelBaixo);

    // ---------- Barra de status ----------
    const ramoTxt = h('span', {}, '—'); const ramoBtn = h('button', { type: 'button', class: 'ds-wb-status-item', title: tr('Controle de código-fonte'), onclick: () => trocarVisao('git') }, DS.icone('ramo'), ramoTxt);
    const problemasEl = h('button', { type: 'button', class: 'ds-wb-status-item ds-wb-status-problemas', id: 'ide-contagem-problemas', title: tr('Problemas'), hidden: true, onclick: () => escolherPainel('problemas') });
    const estadoEl = h('span', { id: 'ide-estado', class: 'ds-wb-status-item', role: 'status', 'aria-live': 'polite' });
    const posBtn = h('button', { type: 'button', class: 'ds-wb-status-item', title: 'Ctrl+G', onclick: () => abrirRapida('linha') }, '');
    const quebraBtn = h('button', { type: 'button', class: 'ds-wb-status-item', id: 'ide-quebra', title: tr('Quebra de linha automática'), 'aria-pressed': 'false', onclick: () => alternarQuebra() }, tr('Quebra de linha'));
    const linguagemEl = h('span', { class: 'ds-wb-status-item' }); const recuoEl = h('span', { class: 'ds-wb-status-item' }); const eolEl = h('span', { class: 'ds-wb-status-item' });
    if (o.estadoDoEnvio) o.estadoDoEnvio.classList.add('ds-wb-status-item');
    const status = h('footer', { class: 'ds-wb-status' }, ramoBtn, ...(o.estadoDoEnvio ? [o.estadoDoEnvio] : []), problemasEl, estadoEl, h('span', { class: 'ds-wb-espaco' }), posBtn, quebraBtn, recuoEl, h('span', { class: 'ds-wb-status-item' }, 'UTF-8'), eolEl, linguagemEl);

    // ---------- Entrada rápida (Ctrl+P, Ctrl+Shift+P, Ctrl+G) e confirmação ----------
    const rIn = h('input', { type: 'text', 'aria-label': tr('Abrir arquivo ou comando'), role: 'combobox', 'aria-expanded': 'true', 'aria-controls': id + '-rapida-lista', 'aria-autocomplete': 'list', autocomplete: 'off', spellcheck: 'false' });
    const rLista = h('ul', { id: id + '-rapida-lista', role: 'listbox', 'aria-label': tr('Resultados') });
    const rapida = h('div', { class: 'ds-wb-rapida', hidden: true, onmousedown: (ev) => { if (ev.target === rapida) fecharRapida(); } }, h('div', { class: 'ds-wb-rapida-caixa' }, rIn, rLista));
    const contexto = h('div', { class: 'ds-wb-contexto', role: 'menu', hidden: true });
    caixa.append(atividades, lateral, editor, status, rapida, contexto);
    corpo.append(caixa);

    function confirmar(titulo, texto, ok) {
      return new Promise((resolver) => {
        const fim = (v) => { dlg.remove(); resolver(v); };
        const cancelar = DS.acao('Cancelar', () => fim(false), { compacto: true });
        const dlg = h('div', { class: 'ds-wb-dialogo', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': titulo, onkeydown: (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); fim(false); } } },
          h('strong', {}, titulo), h('p', {}, texto), h('div', { class: 'ds-wb-dialogo-acoes' }, cancelar, DS.acao(ok, () => fim(true), { primaria: true, compacto: true, id: 'ide-confirmar' })));
        caixa.append(dlg); cancelar.focus();
      });
    }
    const temAlteracoes = () => abas.some((a) => a.doc && !a.doc.isClean());
    const sair = async (fn) => { if (temAlteracoes() && !await confirmar(tr('Alterações não salvas'), tr('Há arquivos com alterações não salvas. Sair mesmo assim?'), tr('Sair sem salvar'))) return; fn(); };
    const irParaTestes = (sub) => sair(() => { (estado.sub ||= {}).testes = sub; void mostrar('testes'); });

    // ---------- Abas ----------
    function desenharAbas() {
      listaAbas.replaceChildren(...abas.map((a, i) => {
        const sujo = a.doc && !a.doc.isClean(); const sel = a === ativa;
        return h('div', { class: 'ds-wb-aba', 'data-ativa': String(sel), 'data-previa': String(!!a.previa), oncontextmenu: (ev) => { ev.preventDefault(); abrirMenuDeItens(a.titulo, itensDaAba(a), ev.clientX, ev.clientY, ev.currentTarget.querySelector('button'), a.chave); } },
          h('button', { type: 'button', role: 'tab', class: 'ds-wb-aba-titulo', id: id + '-aba-' + i, 'aria-selected': String(sel), tabindex: sel ? 0 : -1, title: a.chave, 'data-aba': a.chave,
            onclick: () => ativar(a), ondblclick: () => fixar(a), onauxclick: (ev) => { if (ev.button === 1) void fechar(a); },
            onkeydown: (ev) => { const d = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0; if (!d) return; ev.preventDefault(); const v = abas[(i + d + abas.length) % abas.length]; ativar(v); listaAbas.querySelector('[aria-selected="true"]')?.focus(); } },
            DS.icone(a.vista && !a.doc ? 'filtro' : tipoDoArquivo(a.titulo)[2]), h('span', {}, a.titulo), sujo ? h('span', { class: 'ds-wb-ponto', role: 'img', 'aria-label': tr('Não salvo') }, '●') : null),
          h('button', { type: 'button', class: 'ds-wb-fechar', 'aria-label': tr('Fechar {n}', { n: a.titulo }), onclick: () => void fechar(a) }, '×'));
      }));
      marcarAtual();
    }
    function marcarAtual() {
      for (const b of arvoreEl.querySelectorAll('[data-arquivo]')) b.setAttribute('aria-current', String(b.dataset.arquivo === ativa?.arquivo));
    }
    function desenharTrilha() {
      const partes = ativa ? ativa.chave.replace(/^diff:/, '').split('/') : [];
      trilha.replaceChildren(...(ativa?.tipo === 'diff' ? [h('span', {}, tr('Diferenças')), '›'] : []), ...partes.flatMap((p, i) => [i ? h('span', { 'aria-hidden': 'true' }, '›') : null, i === partes.length - 1 ? h('strong', { 'aria-current': 'page' }, p) : h('span', {}, p)]));
      trilha.hidden = !ativa;
    }
    /** Tudo que o editor isolado conta: texto alterado, cursor, problemas do Monaco e atalhos que ele devolve. */
    function aoEventoDoEditor(m) {
      const aba = abas.find((a) => a.chave === m.id);
      if (m.t === 'alterou' && aba?.doc) {
        if (typeof m.texto === 'string') aba.doc.texto = m.texto; aba.doc.limpo = !m.sujo; if (m.sujo) aba.previa = false;
        if (aba === ativa) { armado = false; aba.msg = null; descartarBtn.lastChild.textContent = tr('Descartar'); atualizarStatus(); }
        desenharAbas();
      } else if (m.t === 'cursor' && aba === ativa) { cursor = m; atualizarStatus(); }
      else if (m.t === 'problemas' && aba) { aba.marcadores = m.lista; if (aba === ativa) { desenharPainel(); atualizarStatus(); } }
      else if (m.t === 'atalho') atalho(m.chave);
      else if (m.t === 'orquestrador') window.PrumoOrquestrador?.preparar(tr('Sobre {a}, linhas {l}: ', { a: ativa?.arquivo || '', l: m.linha === m.fim ? m.linha : m.linha + '-' + m.fim }) + (m.texto ? '«' + m.texto + '»' : ''));
      else if (m.t === 'erro') { avisar(tr('O editor de código não carregou.'), true); registrar(tr('Falha no editor: {e}', { e: m.texto })); }
    }
    function atalho(chave) {
      ({ Esc: escDoZen, zen: () => alternarZen(), s: () => salvar(), w: () => ativa && fechar(ativa), p: () => abrirRapida('arquivo'), 'S+p': () => abrirRapida('comando'), b: alternarLateral, j: () => alternarPainel(), '`': alternarTerminal,
        'S+f': () => recursos.buscar && trocarVisao('buscar'), 'S+g': () => recursos.git && trocarVisao('git') })[chave]?.();
    }
    const comandoDoEditor = (nome, extra) => { if (!ativa?.doc) { avisar(tr('Abra um arquivo de texto para usar este comando.'), true); return; } editorDeCodigo.comando(nome, extra); };
    const localizar = (comSubstituir) => comandoDoEditor(comSubstituir ? 'substituir' : 'localizar');
    /** Modo foco: só o editor, por cima da janela. Ctrl+K Z entra e sai; Esc duas vezes também sai. */
    function alternarZen(forcar) {
      const ligar = typeof forcar === 'boolean' ? forcar : caixa.dataset.zen !== 'sim';
      if (ligar) caixa.dataset.zen = 'sim'; else delete caixa.dataset.zen;
      if (ligar) avisar(tr('Modo foco ligado. Esc duas vezes ou Ctrl+K Z para sair.'));
      if (ativa?.doc) editorDeCodigo.comando('foco');
    }
    function escDoZen() { if (caixa.dataset.zen !== 'sim') return; if (Date.now() - ultimoEsc < 700) alternarZen(false); ultimoEsc = Date.now(); }
    const ATALHOS = [['Ctrl+P', 'Abrir arquivo (> comandos, : linha, @ símbolos)'], ['Ctrl+Shift+P', 'Comandos da IDE'], ['Ctrl+S', 'Salvar'], ['Ctrl+W', 'Fechar aba'], ['Ctrl+B', 'Barra lateral'], ['Ctrl+J', 'Painel inferior'], ['Ctrl+`', 'Terminal'],
      ['Ctrl+Shift+F', 'Buscar nos arquivos'], ['Ctrl+Shift+G', 'Controle de código-fonte'], ['Ctrl+K Z', 'Modo foco'], ['Ctrl+F / Ctrl+H', 'Localizar e substituir'], ['Ctrl+G', 'Ir para a linha'], ['Ctrl+Shift+O', 'Ir para símbolo'],
      ['F12', 'Ir para a definição'], ['Alt+F12', 'Espiar a definição'], ['F2', 'Renomear símbolo'], ['Shift+Alt+F', 'Formatar documento'], ['Ctrl+/', 'Comentar linha'], ['Ctrl+Espaço', 'Sugestões'], ['Alt+clique', 'Vários cursores'], ['F1', 'Paleta do editor']];
    function mostrarAtalhos() {
      DS.modal('Atalhos da IDE', [h('table', { class: 'ds-wb-atalhos' }, h('tbody', {}, ATALHOS.map(([k, d]) => h('tr', {}, h('td', {}, h('kbd', {}, k)), h('td', {}, tr(d))))))], { tamanho: 'md' });
    }
    function alternarQuebra() { quebra = !quebra; editorDeCodigo.opcoes({ quebra }); quebraBtn.setAttribute('aria-pressed', String(quebra)); guardarOpcoes(); }
    function alternarMinimapa() { minimapa = !minimapa; editorDeCodigo.opcoes({ minimapa }); guardarOpcoes(); }
    function mudarFonte(passo) { fonte = Math.max(10, Math.min(28, fonte + passo)); editorDeCodigo.opcoes({ fonte }); guardarOpcoes(); }
    function atualizarStatus() {
      const a = ativa; const sujo = !!a?.doc && !a.doc.isClean(); const c = a?.doc && cursor?.id === a.chave ? cursor : null;
      linguagemEl.textContent = c ? (c.linguagem === 'plaintext' ? tr('Texto simples') : c.rotulo) : '';
      posBtn.textContent = c ? tr('Ln {l}, Col {c}', { l: c.linha, c: c.coluna }) + (c.selecionados ? ' · ' + tr('{n} selecionado(s)', { n: c.selecionados }) : '') : '';
      recuoEl.textContent = c ? tr(c.espacos ? 'Espaços: {n}' : 'Tabulação: {n}', { n: c.tab }) : ''; eolEl.textContent = c ? c.eol : '';
      estadoEl.textContent = !a ? '' : a.tipo === 'diff' ? tr('Diferenças · somente leitura') : sujo ? tr('Alterações não salvas') : a.msg || (a.somenteLeitura ? tr('Somente leitura') : tr('Salvo'));
      estadoEl.dataset.sujo = String(sujo);
      salvarBtn.disabled = !a?.doc || a.somenteLeitura; descartarBtn.disabled = !a?.doc || a.somenteLeitura;
      salvarBtn.hidden = descartarBtn.hidden = !a?.doc; quebraBtn.hidden = !a?.doc; quebraBtn.setAttribute('aria-pressed', String(quebra));
      const marcas = a?.marcadores || []; const erros = marcas.filter((p) => p.nivel === 'erro').length; const avisos = marcas.length - erros;
      problemasEl.hidden = !a?.doc; problemasEl.textContent = '⊗ ' + erros + '  ⚠ ' + avisos; problemasEl.dataset.tom = erros ? 'falha' : avisos ? 'aviso' : 'ok';
      recuoEl.hidden = eolEl.hidden = !a?.doc; bloqueadoEl.hidden = !(a && !a.doc && a.tipo !== 'diff' && a.somenteLeitura && !a.vazio);
    }
    /** Tela de abertura da IDE: o que fazer primeiro, o retrato do projeto e os arquivos recentes. */
    const chaveRecentes = 'prumo.ide.recentes.' + (e.id || 'p');
    const lerRecentes = () => { try { return JSON.parse(localStorage.getItem(chaveRecentes) || '[]').filter((x) => typeof x === 'string').slice(0, 6); } catch { return []; } };
    const lembrar = (arquivo) => { try { localStorage.setItem(chaveRecentes, JSON.stringify([arquivo, ...lerRecentes().filter((x) => x !== arquivo)].slice(0, 6))); } catch { /* sem armazenamento */ } };
    const CORES_LINGUAGEM = ['var(--acento)', 'var(--ok)', 'var(--aviso)', '#c3a6ff', '#ff9f7a', '#6fd3e8'];
    function retratoDoRepositorio() {
      const arquivos = [...new Set([...arvoreEl.querySelectorAll('[data-arquivo]')].map((b) => b.dataset.arquivo))];
      const porTipo = new Map(); for (const a of arquivos) { const t = (/\.(\w+)$/.exec(a)?.[1] || 'outros').toLowerCase(); porTipo.set(t, (porTipo.get(t) || 0) + 1); }
      const topo = [...porTipo].sort((x, y) => y[1] - x[1]).slice(0, 5); const resto = arquivos.length - topo.reduce((n, [, q]) => n + q, 0);
      return { arquivos: arquivos.length, pastas: arvoreEl.querySelectorAll('details.ds-ide-pasta').length, tipos: resto > 0 ? [...topo, ['outros', resto]] : topo };
    }
    function boasVindas() {
      const secao = (texto) => h('h3', { class: 'ds-wb-bv-secao' }, tr(texto));
      const linha = (icone, texto, atalhoDe, fn) => h('button', { type: 'button', class: 'ds-wb-bv-linha', onclick: fn }, DS.icone(icone), h('span', {}, tr(texto)), atalhoDe ? h('kbd', {}, atalhoDe) : null);
      const r = retratoDoRepositorio(); const recentes = lerRecentes().filter((a) => arquivosDaArvore().includes(a) || !arquivosDaArvore().length);
      const comecar = [linha('arquivo', 'Abrir arquivo', 'Ctrl+P', () => abrirRapida('arquivo')), linha('play', 'Comandos', 'Ctrl+Shift+P', () => abrirRapida('comando')),
        recursos.buscar ? linha('busca', 'Buscar nos arquivos', 'Ctrl+Shift+F', () => trocarVisao('buscar')) : null, o.terminal ? linha('codigo', 'Terminal', 'Ctrl+`', alternarTerminal) : null,
        typeof o.criarArquivo === 'function' ? linha('mais', 'Novo arquivo', '', () => void novoNo(false, '')) : null, typeof o.criarArquivo === 'function' ? linha('pasta', 'Nova pasta', '', () => void novoNo(true, '')) : null,
        linha('livro', 'Atalhos do teclado', '', mostrarAtalhos), window.PrumoOrquestrador ? linha('mensagem', 'Pedir ajuda ao Orquestrador', '', () => window.PrumoOrquestrador.preparar('')) : null,
        o.testesDoArquivo ? linha('ok', 'Ver os testes do arquivo aberto', '', () => (ativa?.doc ? escolherPainel('testes') : avisar(tr('Abra um arquivo para ver os testes dele.'), true))) : null];
      const pintar = (no, q, i) => { no.style.background = CORES_LINGUAGEM[i % CORES_LINGUAGEM.length]; if (q) no.style.flex = String(q); return no; };
      const barra = h('div', { class: 'ds-wb-bv-barra', role: 'img', 'aria-label': tr('Arquivos por tipo') }, ...r.tipos.map(([t, q], i) => pintar(h('i', { title: (t === 'outros' ? tr('outros') : '.' + t) + ': ' + q }), q, i)));
      return h('div', { class: 'ds-wb-bv' },
        h('div', { class: 'ds-wb-bv-topo' }, h('img', { class: 'ds-wb-bv-marca', src: '../../assets/prumo-icon.png', alt: '', width: 56, height: 56 }),
          h('div', {}, h('h2', {}, 'Prumo IDE'), h('p', { class: 'ds-wb-bv-sub' }, '// ' + (e.nome || tr('este projeto'))))),
        o.acaoPrincipal ? h('div', { class: 'ds-wb-bv-aviso', role: 'note' }, h('div', {}, h('strong', {}, tr(o.acaoPrincipal.titulo)), h('p', {}, tr(o.acaoPrincipal.descricao))), DS.acao(o.acaoPrincipal.rotulo, o.acaoPrincipal.fn, { primaria: true, compacto: true })) : null,
        h('div', { class: 'ds-wb-bv-colunas' },
          h('section', {}, secao('Começar'), h('div', { class: 'ds-wb-bv-lista' }, ...comecar)),
          h('section', {}, secao('Projeto'), h('div', { class: 'ds-wb-bv-cartao' },
              h('div', { class: 'ds-wb-bv-numeros' }, h('div', {}, h('b', {}, String(r.arquivos)), h('span', {}, tr('arquivos'))), h('div', {}, h('b', {}, String(r.pastas)), h('span', {}, tr('pastas'))), h('div', {}, h('b', {}, ramoTxt.textContent || '—'), h('span', {}, tr('ramo')))),
              r.arquivos ? barra : null, r.arquivos ? h('ul', { class: 'ds-wb-bv-legenda' }, ...r.tipos.map(([t, q], i) => h('li', {}, pintar(h('i'), 0, i), t === 'outros' ? tr('outros') : '.' + t, h('em', {}, String(q))))) : h('p', { class: 'ds-sub' }, tr('Carregando os arquivos…'))),
            secao('Recentes'), recentes.length ? h('div', { class: 'ds-wb-bv-lista' }, ...recentes.map((a) => h('button', { type: 'button', class: 'ds-wb-bv-linha', title: a, onclick: () => void abrir(a) }, DS.icone(tipoDoArquivo(a)[2]), h('span', {}, nomeDe(a)), h('small', {}, a.split('/').slice(0, -1).join('/'))))) : h('p', { class: 'ds-sub' }, tr('Os arquivos que você abrir aparecem aqui.')))));
    }
    const vazioDaIde = () => (o.vazio ? DS.estadoTela('vazio', o.vazio.titulo, o.vazio.descricao) : boasVindas());
    function mostrarVista(no) { editorDeCodigo.quadro.hidden = true; vistaEl.hidden = false; vistaEl.replaceChildren(no); }
    function mostrarAba(aba, linha) {
      if (aba.doc) { vistaEl.hidden = true; editorDeCodigo.quadro.hidden = false; editorDeCodigo.ativar(aba.chave, linha); return; }
      mostrarVista(aba.vista);
      if (linha) { const li = aba.vista.querySelector?.('li[data-linha="' + linha + '"]'); li?.setAttribute('aria-current', 'true'); li?.scrollIntoView({ block: 'center' }); }
    }
    function ativar(aba, linha) {
      ativa = aba; cursor = null; armado = false; descartarBtn.lastChild.textContent = tr('Descartar');
      if (aba.tipo !== 'diff') o.aoAtivar?.(aba.arquivo, linha);
      mostrarAba(aba, linha); desenharAbas(); desenharTrilha(); atualizarStatus(); atualizarLateral(); void margemDoGit(aba);
      if (painelAba === 'testes' || painelAba === 'problemas') { problemas = []; desenharPainel(); }
    }
    /** Abrir o mesmo arquivo duas vezes ao mesmo tempo (duplo clique) devolve a mesma aba: sem isso a segunda abertura apagava o modelo da primeira no editor. */
    const abrindo = new Map();
    async function abrir(arquivo, linha, previa = false) {
      const existente = abas.find((a) => a.chave === arquivo); if (existente) { if (!previa) existente.previa = false; ativar(existente, linha); return existente; }
      if (abrindo.has(arquivo)) { const aba = await abrindo.get(arquivo); if (aba) { if (!previa) aba.previa = false; ativar(aba, linha); } return aba; }
      const trabalho = abrirNovo(arquivo, linha, previa); abrindo.set(arquivo, trabalho);
      try { return await trabalho; } finally { abrindo.delete(arquivo); }
    }
    async function abrirNovo(arquivo, linha, previa) {
      estadoEl.textContent = tr('Abrindo arquivo…');
      const r = await o.lerArquivo(arquivo);
      if (!r.ok) { mostrarVista(DS.estadoTela('erro', 'Arquivo indisponível', r.erro)); estadoEl.textContent = ''; registrar(tr('Falha ao abrir {a}: {e}', { a: arquivo, e: r.erro })); return null; }
      const aba = { chave: arquivo, arquivo, titulo: nomeDe(arquivo), hash: r.hash, linhas: r.linhas, somenteLeitura: r.editavel !== true, marcadores: [] };
      if (r.vazio) { aba.vazio = true; aba.vista = DS.estadoTela('vazio', r.vazio); }
      else if (r.editavel || r.destacar) {
        const texto = String(r.conteudo).replace(/\r\n/g, '\n');
        // Espelho do que está no editor: a janela guarda o texto e se há alteração; o Monaco avisa a cada mudança.
        aba.doc = { texto, limpo: true, isClean() { return this.limpo; }, getValue() { return this.texto; }, lineCount() { return this.texto.split('\n').length; } };
        editorDeCodigo.abrir(arquivo, arquivo, texto, aba.somenteLeitura);
      } else aba.vista = h('ol', { class: 'ds-ide-linhas' }, String(r.conteudo).split(/\r?\n/).map((txt, i) => h('li', { 'data-linha': i + 1 }, h('code', {}, txt || ' '))));
      if (previa) { const anterior = abas.find((x) => x.previa && !(x.doc && !x.doc.isClean())); if (anterior) removerAba(anterior); aba.previa = true; }
      abas.push(aba); lembrar(arquivo); registrar(tr('Aberto {a}', { a: arquivo })); ativar(aba, linha); return aba;
    }
    async function fechar(aba) {
      if (aba.doc && !aba.doc.isClean() && !await confirmar(tr('Fechar sem salvar?'), tr('{a} tem alterações não salvas.', { a: aba.titulo }), tr('Fechar sem salvar'))) return;
      const i = abas.indexOf(aba); abas.splice(i, 1); if (aba.doc) editorDeCodigo.fechar(aba.chave);
      if (ativa === aba) { ativa = null; if (abas.length) ativar(abas[Math.min(i, abas.length - 1)]); }
      if (!ativa) { mostrarVista(vazioDaIde()); desenharTrilha(); atualizarStatus(); atualizarLateral(); }
      desenharAbas();
    }
    /** Aba em pré-visualização (itálico) é trocada pela próxima; fixar a mantém. Editar o arquivo também fixa. */
    /** Barrinhas na margem do editor: verde (novo), azul (alterado) e vermelho (removido), do diff contra o último commit. */
    async function margemDoGit(aba) {
      if (!recursos.git || !aba?.doc || typeof api.ideGitDiff !== 'function') return;
      const r = await api.ideGitDiff(e.id, aba.arquivo); if (!r?.ok) return;
      editorDeCodigo.decoracoes(aba.chave, trechosDoDiff(r.data.diff));
    }
    function fixar(arg) { const aba = typeof arg === 'string' ? abas.find((a) => a.chave === arg) : arg; if (aba?.previa) { aba.previa = false; desenharAbas(); } }
    function removerAba(aba) { const i = abas.indexOf(aba); if (i < 0) return; abas.splice(i, 1); if (aba.doc) editorDeCodigo.fechar(aba.chave); }
    function itensDaAba(aba) {
      return [[tr('Fechar'), () => void fechar(aba)], [tr('Fechar as outras'), async () => { for (const x of abas.filter((y) => y !== aba)) await fechar(x); }], [tr('Fechar todas'), async () => { for (const x of [...abas]) await fechar(x); }],
        aba.previa ? [tr('Fixar aba'), () => fixar(aba)] : null, [tr('Copiar caminho'), () => void copiar(aba.arquivo || aba.chave)]].filter(Boolean);
    }
    async function salvar(aba = ativa) {
      if (!aba?.doc || aba.somenteLeitura) return;
      if (aba.doc.isClean()) { estadoEl.textContent = tr('Nada a salvar'); return; }
      const texto = await editorDeCodigo.pedirTexto(aba.chave); if (texto === null) { avisar(tr('O editor não respondeu. Nada foi salvo.'), true); return; }
      const r = await chamar(() => o.gravar(aba.arquivo, texto, aba.hash)); if (!r || r.canceled) return;
      aba.hash = r.hash; aba.doc.texto = texto; aba.doc.limpo = true; editorDeCodigo.limpo(aba.chave);
      aba.msg = tr('Salvo · {n} linhas', { n: r.linhas }); avisar(tr('Arquivo salvo.')); registrar(tr('Salvo {a}', { a: aba.arquivo }));
      if (o.aoSalvar) await o.aoSalvar(r, aba.arquivo);
      desenharAbas(); atualizarStatus(); atualizarLateral(); void carregarRamo(); void margemDoGit(aba);
    }
    async function descartar() {
      if (!ativa?.doc) return; const aba = ativa;
      if (!aba.doc.isClean() && !armado) { armado = true; descartarBtn.lastChild.textContent = tr('Descartar alterações?'); return; }
      const r = await o.lerArquivo(aba.arquivo); if (!r.ok) { avisar(r.erro, true); return; }
      const texto = String(r.conteudo).replace(/\r\n/g, '\n'); editorDeCodigo.texto(aba.chave, texto);
      aba.doc.texto = texto; aba.doc.limpo = true; aba.hash = r.hash; aba.msg = null; armado = false;
      descartarBtn.lastChild.textContent = tr('Descartar'); desenharAbas(); atualizarStatus();
    }
    function atualizarLateral() { if (!o.lateral) return; detalhes = [].concat(o.lateral(ativa?.tipo === 'diff' ? null : ativa)).filter(Boolean); if (painelAba === 'detalhes') desenharPainel(); }
    const irParaLinha = (n) => { if (ativa?.doc) editorDeCodigo.comando('irParaLinha', { linha: n }); else if (ativa) mostrarAba(ativa, n); };

    // ---------- Painel inferior ----------
    const todosProblemas = () => [...(ativa?.marcadores || []), ...problemas];
    const PAINEIS = () => [['problemas', tr('Problemas') + (todosProblemas().length ? ' (' + todosProblemas().length + ')' : '')], ['saida', tr('Saída')], ['testes', tr('Testes')], ...(o.terminal ? [['terminal', tr('Terminal')]] : []), ...(o.lateral ? [['detalhes', tr('Detalhes')]] : [])];
    function alternarPainel(forcar) { const abrirPainel = typeof forcar === 'boolean' ? forcar : caixa.dataset.painel !== 'aberto'; caixa.dataset.painel = abrirPainel ? 'aberto' : 'fechado'; document.getElementById('ide-painel-alternar')?.setAttribute('aria-expanded', String(abrirPainel)); if (abrirPainel) desenharPainel(); }
    function escolherPainel(k) { painelAba = k; alternarPainel(true); desenharPainel(); }
    function desenharPainel() {
      caixa.dataset.painelAba = painelAba;
      abasPainel.replaceChildren(...PAINEIS().map(([k, t]) => h('button', { type: 'button', role: 'tab', class: 'ds-wb-painel-aba', id: id + '-painel-' + k, 'data-painel-aba': k, 'aria-selected': String(k === painelAba), onclick: () => escolherPainel(k) }, t)));
      if (caixa.dataset.painel !== 'aberto') return;
      conteudoPainel.setAttribute('aria-labelledby', id + '-painel-' + painelAba);
      if (painelAba === 'terminal') { terminalDaIde?.foco(); return; }
      if (painelAba === 'problemas') desenharProblemas(); else if (painelAba === 'saida') conteudoPainel.replaceChildren(saida.length ? h('ol', { class: 'ds-wb-saida' }, saida.map((l) => h('li', {}, l))) : h('p', { class: 'suave' }, tr('Sem registros nesta sessão.'))); else if (painelAba === 'detalhes') conteudoPainel.replaceChildren(...(detalhes.length ? detalhes : [h('p', { class: 'suave' }, tr('Abra um arquivo para ver os detalhes.'))])); else void desenharTestesDoArquivo();
    }
    function desenharProblemas() {
      const tipo = ativa?.doc ? (/\.ya?ml$/i.test(ativa.arquivo) ? 'YAML' : /\.json$/i.test(ativa.arquivo) ? 'JSON' : null) : null;
      conteudoPainel.replaceChildren(h('div', { class: 'ds-wb-painel-barra' }, tipo ? DS.acao(tipo === 'YAML' ? 'Validar YAML' : 'Validar JSON', validar, { id: 'ide-validar', compacto: true, icone: 'ok' }) : null,
        DS.info('Verificação simples feita aqui, para erros comuns de estrutura. Ela não substitui o validador do GitHub Actions nem os testes.')),
      todosProblemas().length ? h('ul', { class: 'ds-wb-problemas' }, todosProblemas().map((p) => h('li', {}, h('button', { type: 'button', onclick: () => irParaLinha(p.linha) }, h('span', { class: 'ds-chip', 'data-tom': p.nivel === 'erro' ? 'falha' : 'aviso' }, tr(p.nivel === 'erro' ? 'Erro' : p.nivel === 'info' ? 'Info' : 'Aviso')), h('span', { class: 'ds-sub' }, tr('Ln {n}', { n: p.linha })), h('span', {}, p.texto)))))
        : h('p', { class: 'suave', id: 'ide-sem-problemas' }, ativa?.doc ? tr('Nenhum problema encontrado pelo editor.') + (tipo ? ' ' + tr('Use Validar para uma verificação a mais.') : '') : tr('Abra um arquivo para ver os problemas dele.')));
    }
    function validar() {
      if (!ativa?.doc) return; problemas = problemasDe(ativa.arquivo, ativa.doc.getValue()); desenharPainel();
      registrar(problemas.length ? tr('{n} problema(s) em {a}', { n: problemas.length, a: ativa.arquivo }) : tr('Nenhum problema encontrado em {a}', { a: ativa.arquivo }));
      if (!problemas.length) conteudoPainel.append(h('p', { class: 'ds-sub', id: 'ide-validado' }, tr('Nenhum problema encontrado.')));
    }
    async function desenharTestesDoArquivo() {
      const arquivo = ativa?.arquivo; conteudoPainel.replaceChildren(h('p', { class: 'suave' }, tr('Consultando o catálogo de testes…')));
      if (!o.testesDoArquivo) { conteudoPainel.replaceChildren(h('p', { class: 'suave' }, tr('O catálogo de testes não está disponível aqui.'))); return; }
      if (!arquivo) { conteudoPainel.replaceChildren(h('p', { class: 'suave' }, tr('Abra um arquivo para ver os testes que o catálogo encontrou nele.'))); return; }
      const t = await o.testesDoArquivo(arquivo); if (ativa?.arquivo !== arquivo || painelAba !== 'testes') return;
      conteudoPainel.replaceChildren(!t ? h('p', { class: 'suave' }, tr('O catálogo de testes não está disponível.')) : !t.length ? h('p', { class: 'suave' }, tr('O catálogo não encontrou testes neste arquivo.'))
        : h('ul', { class: 'ds-wb-problemas' }, t.map((x) => h('li', {}, h('button', { type: 'button', onclick: () => irParaLinha(x.linha) }, h('span', { class: 'ds-sub' }, tr('Ln {n}', { n: x.linha })), h('span', {}, x.titulo), h('span', { class: 'ds-chips' }, x.chips))))));
    }

    // ---------- Barra lateral: Explorador, Buscar, Código-fonte, Executar ----------
    const VISOES = () => [['explorador', 'pasta', tr('Explorador')], ...(recursos.buscar ? [['buscar', 'busca', tr('Buscar')]] : []), ...(recursos.git ? [['git', 'ramo', tr('Controle de código-fonte')]] : []), ['executar', 'play', tr('Executar e testes')]];
    function trocarVisao(v) {
      visao = v; caixa.dataset.lateral = 'aberta';
      for (const [k, el] of Object.entries(visoes)) el.hidden = k !== v;
      for (const b of atividades.children) b.setAttribute('aria-pressed', String(b.dataset.visao === v));
      if (v === 'git') void desenharGit(); if (v === 'executar') void desenharExecutar(); if (v === 'buscar') visoes.buscar.querySelector('input')?.focus();
     
    }
    function alternarLateral() { caixa.dataset.lateral = caixa.dataset.lateral === 'aberta' ? 'fechada' : 'aberta'; }
    atividades.append(...VISOES().map(([k, ic, rotulo]) => h('button', { type: 'button', class: 'ds-wb-ativ', 'data-visao': k, 'aria-pressed': String(k === visao), title: rotulo, 'aria-label': rotulo, onclick: () => { if (visao === k && caixa.dataset.lateral === 'aberta') alternarLateral(); else trocarVisao(k); } }, DS.icone(ic))));
    if (window.PrumoOrquestrador) atividades.append(h('button', { type: 'button', class: 'ds-wb-ativ ds-wb-ativ-ia', id: 'ide-orquestrador', title: tr('Pedir ajuda ao Orquestrador'), 'aria-label': tr('Pedir ajuda ao Orquestrador'), onclick: () => window.PrumoOrquestrador.preparar(ativa ? tr('Sobre o arquivo {a}: ', { a: ativa.arquivo }) : '') }, DS.icone('mensagem')));
    const filtro = h('input', { type: 'search', class: 'ds-wb-filtro', placeholder: tr('Filtrar arquivos'), 'aria-label': tr('Filtrar arquivos'), id: 'ide-filtro' });
    function filtrar() {
      const q = filtro.value.trim().toLowerCase();
      for (const b of arvoreEl.querySelectorAll('[data-arquivo]')) b.hidden = !!q && !b.dataset.arquivo.toLowerCase().includes(q);
      for (const d of arvoreEl.querySelectorAll('details')) { const tem = !q || !!d.querySelector('[data-arquivo]:not([hidden])'); d.hidden = !tem; if (q && tem) d.open = true; }
    }
    filtro.addEventListener('input', filtrar);
    const abrirTodas = (v) => arvoreEl.querySelectorAll('details').forEach((d) => { d.open = v; });
    const recarregar = async () => { if (o.recarregarArvore) { await o.recarregarArvore(); filtrar(); registrar(tr('Árvore recarregada.')); } };
    const iconeBtn = (rotulo, fn, no, extra = {}) => h('button', { type: 'button', class: 'ds-wb-mini ds-wb-icone', 'aria-label': tr(rotulo), title: tr(rotulo), onclick: fn, ...extra }, no);
    const podeCriarAqui = typeof o.criarArquivo === 'function';
    const cabExplorador = h('div', { class: 'ds-wb-explorador-cab' }, h('strong', {}, tr('Explorador')),
      podeCriarAqui ? iconeBtn('Novo arquivo', () => void novoNo(false, ''), DS.icone('mais'), { id: 'ide-novo' }) : null, podeCriarAqui ? iconeBtn('Nova pasta', () => void novoNo(true, ''), DS.icone('pasta'), { id: 'ide-nova-pasta' }) : null,
      o.recarregarArvore ? iconeBtn('Atualizar', () => recarregar(), DS.icone('atualizar'), { id: 'ide-recarregar' }) : null,
      iconeBtn('Expandir todas as pastas', () => abrirTodas(true), '⊞', { id: 'ide-expandir' }), iconeBtn('Recolher todas as pastas', () => abrirTodas(false), '⊟', { id: 'ide-recolher' }),
      o.acoesDoProjeto?.length ? iconeBtn('Ações do projeto', (ev) => { const r = ev.currentTarget.getBoundingClientRect(); abrirMenuDeItens(tr('Projeto'), o.acoesDoProjeto, r.left, r.bottom + 4, ev.currentTarget); }, '⋯', { id: 'ide-acoes-projeto' }) : null);
    visoes.explorador.append(cabExplorador, ...(o.barra?.length ? [h('div', { class: 'ds-ide-barra ds-wb-barra' }, ...[].concat(o.barra))] : []), filtro, arvoreEl);

    // Pastas abertas sobrevivem a recarregar a árvore; na primeira vez, só o primeiro nível aparece aberto.
    const pastasAbertas = new Set(); let arvoreIniciada = false;
    function arvore(itens, prof = 0) {
      return itens.map((item) => {
        if (item.tipo !== 'pasta') return botaoDeArquivo(item.arquivo, item.nome, (a) => void abrir(a, undefined, true), undefined, (a) => void abrir(a));
        if (!arvoreIniciada && prof < 1) pastasAbertas.add(item.arquivo);
        const det = h('details', { class: 'ds-ide-pasta', 'data-pasta': item.arquivo, open: pastasAbertas.has(item.arquivo) }, h('summary', {}, DS.icone('pasta'), h('span', {}, item.nome)));
        det.addEventListener('toggle', () => { if (det.open) pastasAbertas.add(item.arquivo); else pastasAbertas.delete(item.arquivo); });
        det.append(...arvore(item.filhos || [], prof + 1)); return det;
      });
    }
    const definirArvore = (...nos) => { arvoreIniciada = true; arvoreEl.replaceChildren(...nos.flat().filter(Boolean)); marcarAtual(); if (!abas.length && !o.vazio) mostrarVista(boasVindas()); };

    // Buscar em arquivos (canal ide:buscar).
    function montarBusca() {
      const q = h('input', { type: 'search', id: 'ide-buscar-q', placeholder: tr('Buscar nos arquivos'), 'aria-label': tr('Buscar nos arquivos') });
      const opcoes = { diferenciarCaixa: false, regex: false }; const resultados = h('div', { class: 'ds-wb-resultados', 'aria-live': 'polite' });
      const alternar = (k, rotulo, texto) => { const b = btn(rotulo, () => { opcoes[k] = !opcoes[k]; b.setAttribute('aria-pressed', String(opcoes[k])); }, texto, { 'aria-pressed': 'false' }); return b; };
      async function buscar() {
        if (typeof api.ideBuscar !== 'function') { resultados.replaceChildren(h('p', { class: 'suave' }, tr('A busca em arquivos não está disponível nesta versão.'))); return; }
        if (!q.value.trim()) return; resultados.replaceChildren(DS.carregando('Buscando…'));
        const r = await api.ideBuscar(e.id, q.value, opcoes);
        if (!r.ok) { resultados.replaceChildren(DS.estadoTela('erro', 'A busca não foi concluída', r.error, [], { compacto: true })); return; }
        const grupos = new Map(); for (const x of r.data.resultados) { if (!grupos.has(x.arquivo)) grupos.set(x.arquivo, []); grupos.get(x.arquivo).push(x); }
        registrar(tr('Busca "{q}": {n} resultado(s) em {f} arquivo(s)', { q: q.value, n: r.data.resultados.length, f: grupos.size }));
        resultados.replaceChildren(!grupos.size ? h('p', { class: 'suave' }, tr('Nenhum resultado.')) : null, r.data.truncado ? h('p', { class: 'ds-sub' }, tr('Resultados limitados: refine a busca.')) : null,
          ...[...grupos].map(([arquivo, linhas]) => h('details', { class: 'ds-wb-grupo', open: true }, h('summary', {}, h('strong', {}, nomeDe(arquivo)), h('span', { class: 'ds-sub' }, arquivo), h('span', { class: 'ds-n' }, String(linhas.length))),
            ...linhas.map((x) => h('button', { type: 'button', class: 'ds-wb-resultado', onclick: () => void abrir(x.arquivo, x.linha) }, h('span', { class: 'ds-sub' }, String(x.linha)), h('span', {}, x.trecho))))));
      }
      q.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); void buscar(); } });
      buscarPorPedido = async (texto) => { trocarVisao('buscar'); q.value = texto; await buscar(); };
      visoes.buscar.append(h('p', { class: 'ds-doc-grupo' }, tr('Buscar')), h('div', { class: 'ds-wb-busca' }, q, alternar('diferenciarCaixa', 'Diferenciar maiúsculas', 'Aa'), alternar('regex', 'Expressão regular', '.*'), btn('Buscar', () => void buscar(), '↵')), resultados);
    }
    if (recursos.buscar) montarBusca();

    // Controle de código-fonte (somente leitura: lista e diff; commit e envio vão pelo fluxo Git ou por um agente).
    async function desenharGit() {
      const v = visoes.git; const topo = h('p', { class: 'ds-doc-grupo' }, tr('Controle de código-fonte'));
      const encaminhar = h('div', { class: 'ds-wb-botoes' }, DS.acao('Abrir em Agentes', () => sair(() => mostrar('agentes')), { compacto: true, id: 'ide-git-agentes' }), DS.acao('Abrir Projetos', () => sair(() => mostrar('projetos')), { compacto: true, id: 'ide-git-projetos' }),
        DS.acao('Enviar alterações ao GitHub', () => { if (temAlteracoes()) { avisar(tr('Salve os arquivos antes de enviar ao GitHub.'), true); return; } window.PrumoCodigo.publicar(e); }, { id: 'ide-git-publicar', compacto: true }), DS.info('Salvar mantém o código no computador. Enviar alterações publica os arquivos salvos no branch deste projeto, depois da sua confirmação.'));
      if (typeof api.ideGitEstado !== 'function' || typeof api.ideGitDiff !== 'function') { v.replaceChildren(topo, h('p', { class: 'suave' }, tr('O controle de código-fonte não está disponível nesta versão.')), encaminhar); return; }
      v.replaceChildren(topo, DS.carregando('Consultando o Git…'));
      const r = await api.ideGitEstado(e.id);
      if (!r.ok) { v.replaceChildren(topo, DS.estadoTela('erro', 'Não foi possível consultar o Git', r.error, [], { compacto: true }), encaminhar); return; }
      const d = r.data; ramoTxt.textContent = d.disponivel ? (d.branch || tr('(sem ramo)')) + (d.alteracoes.length ? ' · ' + d.alteracoes.length : '') : tr('Sem Git');
      if (!d.disponivel) { v.replaceChildren(topo, h('p', { class: 'suave' }, tr('Esta pasta não é um repositório Git (ou o Git não está instalado).')), encaminhar); return; }
      const letra = { modificado: 'M', novo: 'N', removido: 'D', renomeado: 'R', conflito: '!' };
      const grupo = (titulo, itens) => itens.length ? h('details', { class: 'ds-wb-grupo', open: true }, h('summary', {}, h('strong', {}, titulo), h('span', { class: 'ds-n' }, String(itens.length))),
        ...itens.map((x) => h('button', { type: 'button', class: 'ds-wb-resultado', 'data-git': x.estado, title: x.arquivo, onclick: () => void abrirDiff(x.arquivo) }, h('span', { class: 'ds-wb-git-letra', 'data-git': x.estado, title: tr(x.estado) }, letra[x.estado] || '?'), h('span', {}, x.arquivo)))) : null;
      v.replaceChildren(topo, h('div', { class: 'ds-wb-botoes' }, h('strong', {}, d.branch || tr('(sem ramo)')), DS.acao('Atualizar', () => desenharGit(), { compacto: true, icone: 'atualizar' })),
        d.alteracoes.length ? null : h('p', { class: 'suave' }, tr('Nenhuma alteração pendente.')), grupo(tr('Preparadas'), d.alteracoes.filter((x) => x.preparado)), grupo(tr('Alterações'), d.alteracoes.filter((x) => !x.preparado)), encaminhar);
    }
    async function abrirDiff(arquivo) {
      const chave = 'diff:' + arquivo; const existente = abas.find((a) => a.chave === chave); if (existente) { ativar(existente); return; }
      const r = await api.ideGitDiff(e.id, arquivo); if (!r.ok) { avisar(r.error, true); return; }
      const marca = (l) => (/^(diff |index |\+\+\+|---)/.test(l) ? 'meta' : l.startsWith('+') ? 'mais' : l.startsWith('-') ? 'menos' : l.startsWith('@@') ? 'bloco' : null);
      const texto = r.data.diff || ''; const vista = texto.trim() ? h('ol', { class: 'ds-ide-linhas ds-wb-diff', 'aria-label': tr('Diferenças de {a}', { a: arquivo }) }, texto.split('\n').map((l, i) => h('li', { 'data-linha': i + 1, 'data-diff': marca(l) }, h('code', {}, l || ' '))), r.data.truncado ? h('li', { 'data-diff': 'meta' }, h('code', {}, tr('… diff truncado pelo limite de tamanho'))) : null)
        : DS.estadoTela('vazio', 'Sem diferenças de texto para exibir', 'Arquivo novo sem conteúdo rastreado ou alteração apenas de modo.');
      const aba = { chave, arquivo, titulo: nomeDe(arquivo), tipo: 'diff', vista, somenteLeitura: true }; abas.push(aba); registrar(tr('Diferenças de {a}', { a: arquivo })); ativar(aba);
    }
    async function carregarRamo() {
      if (!recursos.git || typeof api.ideGitEstado !== 'function') { ramoBtn.hidden = true; return; }
      const r = await api.ideGitEstado(e.id); ramoBtn.hidden = false;
      ramoTxt.textContent = r.ok && r.data.disponivel ? (r.data.branch || tr('(sem ramo)')) + (r.data.alteracoes.length ? ' · ' + r.data.alteracoes.length : '') : tr('Sem Git');
      if (!abas.length && !o.vazio) mostrarVista(boasVindas());
    }

    // Executar e testes: leva para Runs/Planos e lista os arquivos de teste que o catálogo conhece.
    async function desenharExecutar() {
      const v = visoes.executar; const lista = h('div', { class: 'ds-wb-testes' });
      v.replaceChildren(h('p', { class: 'ds-doc-grupo' }, tr('Executar e testes')),
        h('div', { class: 'ds-wb-botoes' }, DS.acao('Abrir Runs', () => irParaTestes('runs'), { compacto: true, icone: 'play', id: 'ide-abrir-runs' }), DS.acao('Abrir Planos', () => irParaTestes('planos'), { compacto: true, id: 'ide-abrir-planos' }), ...[].concat(o.executarExtra || []),
          DS.info('Execuções, resultados e planos ficam em Runs e Planos. Abaixo estão os arquivos de teste que o catálogo do projeto encontrou.')), lista);
      if (!o.arquivosDeTeste) return; lista.append(DS.carregando('Consultando o catálogo…'));
      const itens = await o.arquivosDeTeste();
      lista.replaceChildren(!itens ? h('p', { class: 'suave' }, tr('O catálogo de testes não está disponível.')) : !itens.length ? h('p', { class: 'suave' }, tr('O catálogo não encontrou arquivos de teste.'))
        : itens.map((x) => h('button', { type: 'button', class: 'ds-wb-resultado', onclick: () => void abrir(x.arquivo) }, h('span', { class: 'ds-sub' }, String(x.total)), h('span', {}, x.arquivo))));
    }

    // ---------- Criar arquivo ou pasta, menu de contexto da árvore e pedidos pelo Orquestrador ----------
    const podeCriar = typeof o.criarArquivo === 'function';
    function pedirNome(titulo, padrao) {
      return new Promise((resolver) => {
        const campo = h('input', { type: 'text', class: 'ds-wb-nome', 'aria-label': titulo, value: padrao, maxlength: 400, spellcheck: 'false', autocomplete: 'off' });
        const fim = (v) => { dlg.remove(); resolver(v); };
        const ok = DS.acao('Criar', () => { const v = campo.value.trim().replaceAll('\\', '/').replace(/^\/+/, ''); if (v) fim(v); }, { primaria: true, compacto: true, id: 'ide-nome-criar' });
        const dlg = h('div', { class: 'ds-wb-dialogo', role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo, onkeydown: (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); fim(null); } else if (ev.key === 'Enter' && ev.target === campo) { ev.preventDefault(); ok.click(); } } },
          h('strong', {}, titulo), campo, h('div', { class: 'ds-wb-dialogo-acoes' }, DS.acao('Cancelar', () => fim(null), { compacto: true }), ok));
        caixa.append(dlg); campo.focus(); campo.setSelectionRange(campo.value.length, campo.value.length);
      });
    }
    async function criarNoRepositorio(rel, pasta = false) {
      const caminho = pasta ? rel.replace(/\/+$/, '') + '/.gitkeep' : rel;
      const r = await chamar(() => o.criarArquivo(caminho)); if (!r || r.canceled) return false;
      await o.recarregarArvore?.(); filtrar(); registrar(tr(pasta ? 'Pasta criada: {a}' : 'Arquivo criado: {a}', { a: rel }));
      if (!pasta) await abrir(rel); return true;
    }
    async function novoNo(pasta, base) { const rel = await pedirNome(tr(pasta ? 'Nova pasta' : 'Novo arquivo'), base ? base + '/' : ''); if (rel) await criarNoRepositorio(rel, pasta); }
    const alternarPasta = (arquivo, abrirPasta) => { const d = arvoreEl.querySelector('details[data-pasta="' + CSS.escape(arquivo) + '"]'); if (!d) return; d.open = abrirPasta; d.querySelectorAll('details').forEach((x) => { x.open = abrirPasta; }); };
    async function copiar(texto) {
      try { await navigator.clipboard.writeText(texto); avisar(tr('Caminho copiado.')); } catch { avisar(tr('Não foi possível copiar o caminho.'), true); }
    }
    function itensDoNo(no) {
      const dir = no.pasta ? no.arquivo : no.arquivo.split('/').slice(0, -1).join('/');
      return [
        no.pasta ? null : [tr('Abrir'), () => void abrir(no.arquivo)],
        no.pasta ? [tr('Expandir esta pasta'), () => alternarPasta(no.arquivo, true)] : null, no.pasta ? [tr('Recolher esta pasta'), () => alternarPasta(no.arquivo, false)] : null,
        podeCriar ? [tr('Novo arquivo aqui'), () => void novoNo(false, dir)] : null, podeCriar ? [tr('Nova pasta aqui'), () => void novoNo(true, dir)] : null,
        !no.pasta && o.testesDoArquivo ? [tr('Ver testes deste arquivo'), async () => { await abrir(no.arquivo); escolherPainel('testes'); }] : null,
        !no.pasta && recursos.git ? [tr('Ver alterações do Git'), () => void abrirDiff(no.arquivo)] : null,
        [tr('Copiar caminho'), () => void copiar(no.arquivo)],
        window.PrumoOrquestrador ? [tr('Pedir ao Orquestrador sobre isto…'), () => window.PrumoOrquestrador.preparar(tr(no.pasta ? 'Sobre a pasta {a}: ' : 'Sobre o arquivo {a}: ', { a: no.arquivo }))] : null
      ].filter(Boolean);
    }
    let focoDoMenu = null;
    const foraDoMenu = (ev) => { if (!contexto.contains(ev.target)) fecharContexto(); };
    function fecharContexto() { if (contexto.hidden) return; contexto.hidden = true; contexto.replaceChildren(); document.removeEventListener('pointerdown', foraDoMenu, true); }
    const abrirContexto = (no, x, y, origem) => abrirMenuDeItens(no.arquivo.split('/').pop(), itensDoNo(no), x, y, origem, no.arquivo);
    function abrirMenuDeItens(titulo, itens, x, y, origem, dica) {
      focoDoMenu = origem; fecharContexto();
      contexto.replaceChildren(h('p', { class: 'ds-wb-contexto-titulo', title: dica || titulo }, titulo), ...itens.map(([t, fn]) => h('button', { type: 'button', role: 'menuitem', onclick: () => { fecharContexto(); void fn(); } }, t)));
      contexto.hidden = false; const c = caixa.getBoundingClientRect(); const m = contexto.getBoundingClientRect();
      contexto.style.left = Math.max(4, Math.min(x - c.left, c.width - m.width - 4)) + 'px'; contexto.style.top = Math.max(4, Math.min(y - c.top, c.height - m.height - 4)) + 'px';
      document.addEventListener('pointerdown', foraDoMenu, true); contexto.querySelector('button')?.focus();
    }
    const noDoEvento = (alvo) => { const f = alvo.closest?.('[data-arquivo]'); if (f) return { arquivo: f.dataset.arquivo, pasta: false }; const p = alvo.closest?.('details.ds-ide-pasta > summary')?.parentElement; return p ? { arquivo: p.dataset.pasta, pasta: true } : null; };
    arvoreEl.addEventListener('contextmenu', (ev) => { const no = noDoEvento(ev.target); if (!no) return; ev.preventDefault(); abrirContexto(no, ev.clientX, ev.clientY, ev.target.closest('button, summary')); });
    arvoreEl.addEventListener('keydown', (ev) => {
      if (ev.key !== 'ContextMenu' && !(ev.shiftKey && ev.key === 'F10')) return; const no = noDoEvento(ev.target); if (!no) return;
      ev.preventDefault(); const alvo = ev.target.closest('button, summary'); const r = alvo.getBoundingClientRect(); abrirContexto(no, r.left + 24, r.bottom, alvo);
    });
    contexto.addEventListener('keydown', (ev) => {
      const itens = [...contexto.querySelectorAll('button')]; const i = itens.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); itens[(i + (ev.key === 'ArrowDown' ? 1 : -1) + itens.length) % itens.length]?.focus(); }
      else if (ev.key === 'Escape' || ev.key === 'Tab') { ev.preventDefault(); ev.stopPropagation(); fecharContexto(); focoDoMenu?.focus(); }
    });

    // ---------- Terminal: um comando por vez, na pasta do projeto, com confirmação nativa antes de rodar ----------
    let comandoAtual = null;
    function boasVindasDoTerminal() {
      terminalDaIde.prompt(nomeDe(String(o.terminal.pasta || '').replaceAll('\\', '/')) || 'projeto');
      terminalDaIde.boasVindas(tr('Terminal do projeto. Cada comando pede a sua confirmação e roda na pasta do projeto, sem entrada de teclado.') + '\n' + tr('Ctrl+C para o comando em andamento; clear limpa a tela.'));
    }
    async function rodarComando(texto) {
      if (comandoAtual) return;
      terminalDaIde.executando(true);
      const r = await chamar(() => o.terminal.executar(texto));
      if (!r || r.canceled) { terminalDaIde.escrever('\x1b[90m' + tr('Comando não executado.') + '\x1b[0m\r\n'); terminalDaIde.executando(false); return; }
      comandoAtual = r.id; registrar(tr('Terminal: {c}', { c: texto })); let desde = 0;
      try {
        while (comandoAtual === r.id) {
          const s = await o.terminal.saida(r.id, desde);
          if (!s.ok) { terminalDaIde.escrever('\x1b[31m' + s.error + '\x1b[0m\r\n'); break; }
          if (s.data.texto) terminalDaIde.escrever(s.data.texto); desde = s.data.proximo;
          if (s.data.fim) { terminalDaIde.escrever('\r\n' + (s.data.codigo === 0 ? '\x1b[32m' : '\x1b[31m') + tr('Terminou com código {c}.', { c: s.data.codigo }) + '\x1b[0m\r\n'); break; }
          await new Promise((resolver) => setTimeout(resolver, 200));
        }
      } finally { comandoAtual = null; terminalDaIde.executando(false); void o.recarregarArvore?.(); }
    }
    function aoEventoDoTerminal(m) {
      if (m.t === 'pronto') boasVindasDoTerminal();
      else if (m.t === 'comando') void rodarComando(m.texto);
      else if (m.t === 'parar' && comandoAtual) void o.terminal.parar(comandoAtual);
      else if (m.t === 'atalho') atalho(m.chave);
    }
    function alternarTerminal() {
      if (!o.terminal) { avisar(tr('Esta origem do código não tem terminal. Traga uma cópia para este computador.'), true); return; }
      if (painelAba === 'terminal' && caixa.dataset.painel === 'aberto') { alternarPainel(false); return; }
      escolherPainel('terminal');
    }

    /** O Orquestrador age na IDE por pedidos curtos ("abrir app.ts", "criar arquivo src/x.ts"). Devolve null quando o texto não é um comando daqui; escrita só depois da confirmação. */
    const arquivosDaArvore = () => [...new Set([...arvoreEl.querySelectorAll('[data-arquivo]')].map((b) => b.dataset.arquivo))];
    async function interpretarPedido(texto) {
      if (!caixa.isConnected) return null;
      const t = String(texto || '').trim().replace(/[.!?]+$/, ''); let m;
      if (/^(?:mostrar|mostre|ver|veja)\s+(?:os\s+)?testes(?:\s+d[oe]\s+arquivo)?$/i.test(t)) { if (!ativa?.doc) return { linhas: [tr('Abra um arquivo para ver os testes dele.')] }; escolherPainel('testes'); return { linhas: [tr('Mostrando no painel inferior os testes do arquivo {a}.', { a: ativa.arquivo })] }; }
      if ((m = /^(?:ir|v[aá])\s+para\s+(?:a\s+)?linha\s+(\d+)$/i.exec(t))) { if (!ativa?.doc) return { linhas: [tr('Abra um arquivo de texto primeiro.')] }; irParaLinha(Number(m[1])); return { linhas: [tr('Cursor na linha {n} de {a}.', { n: Number(m[1]), a: ativa.arquivo })] }; }
      if (/^(?:salvar|salve)(?:\s+(?:o\s+)?arquivo)?$/i.test(t)) { if (!ativa?.doc || ativa.somenteLeitura) return { linhas: [tr('Não há arquivo editável aberto para salvar.')] }; await salvar(); return { linhas: [tr('Pedido de salvar enviado para {a}.', { a: ativa.arquivo })] }; }
      if (/^(?:fechar|feche)\s+(?:a\s+)?(?:aba|arquivo)$/i.test(t)) { if (!ativa) return { linhas: [tr('Não há aba aberta.')] }; const nome = ativa.titulo; await fechar(ativa); return { linhas: [tr('Aba {a} fechada.', { a: nome })] }; }
      if ((m = /^(expandir|expanda|abrir|abra|recolher|recolha|fechar|feche)\s+(?:todas\s+)?(?:as\s+)?pastas$/i.exec(t))) { const abrirTudo = /^(?:expand|abr)/i.test(m[1]); abrirTodas(abrirTudo); return { linhas: [tr(abrirTudo ? 'Todas as pastas expandidas.' : 'Todas as pastas recolhidas.')] }; }
      if (recursos.buscar && (m = /^(?:buscar|busque|procure|procurar|pesquise|pesquisar)\s+(.+?)\s+n(?:o|os)\s+(?:reposit[óo]rio|c[óo]digo|arquivos)$/i.exec(t))) { await buscarPorPedido?.(m[1].replace(/^["'`]|["'`]$/g, '')); return { linhas: [tr('Busca por "{q}" feita na barra lateral.', { q: m[1] })] }; }
      if ((m = /^(?:executar|execute|rodar|rode)\s+(.+?)\s+no\s+terminal$/i.exec(t))) {
        if (!o.terminal) return { linhas: [tr('Esta origem do código não tem terminal. Traga uma cópia para este computador.')] };
        if (comandoAtual) return { linhas: [tr('Já há um comando rodando no terminal.')] };
        escolherPainel('terminal'); void rodarComando(m[1].replace(/^["'`]|["'`]$/g, ''));
        return { linhas: [tr('Abri o terminal. Confirme a execução na caixa do sistema; nada roda antes disso.')] };
      }
      if ((m = /^(?:criar|crie|novo|nova)\s+(?:(?:um|uma)\s+)?(?:(?:novo|nova)\s+)?(arquivo|pasta)\s+(?:(?:chamad[oa]|em)\s+)?(\S+)$/i.exec(t))) {
        const pasta = /^pasta$/i.test(m[1]); const rel = m[2].replaceAll('\\', '/').replace(/^["'`/]+|["'`]+$/g, '');
        if (!podeCriar) return { linhas: [tr('Esta origem do código é somente leitura. Traga uma cópia para este computador para criar arquivos.')] };
        if (!await confirmar(tr(pasta ? 'Criar pasta?' : 'Criar arquivo?'), tr('O Orquestrador quer criar {a} no repositório deste projeto. Nada é publicado no GitHub.', { a: rel }), tr('Criar'))) return { linhas: [tr('Certo, não criei nada.')] };
        return { linhas: [await criarNoRepositorio(rel, pasta) ? tr(pasta ? 'Pasta {a} criada.' : 'Arquivo {a} criado e aberto.', { a: rel }) : tr('Não consegui criar {a}. Veja o aviso na tela.', { a: rel })] };
      }
      if ((m = /^(?:abrir|abra|abre|mostrar|mostre)\s+(?:o\s+)?(?:arquivo\s+)?(.+)$/i.exec(t))) {
        const n = m[1].replace(/^["'`]|["'`]$/g, '').toLowerCase(); const todos = arquivosDaArvore();
        const exatos = todos.filter((a) => a.toLowerCase() === n || nomeDe(a).toLowerCase() === n); const achados = exatos.length ? exatos : todos.filter((a) => a.toLowerCase().includes(n));
        if (!achados.length) return null;
        if (achados.length > 1) return { linhas: [tr('Encontrei {n} arquivos com esse nome. Diga o caminho completo:', { n: achados.length }), ...achados.slice(0, 5)] };
        await abrir(achados[0]); return { linhas: [tr('Abri {a}.', { a: achados[0] })] };
      }
      return null;
    }
    window.PrumoAcoesDaTela = interpretarPedido;

    // ---------- Entrada rápida e comandos ----------
    const comandos = () => [
      [tr('Salvar arquivo'), 'Ctrl+S', () => salvar()], [tr('Fechar aba'), 'Ctrl+W', () => ativa && fechar(ativa)], [tr('Abrir arquivo…'), 'Ctrl+P', () => abrirRapida('arquivo')], [tr('Ir para linha…'), 'Ctrl+G', () => abrirRapida('linha')],
      [tr('Localizar no arquivo'), 'Ctrl+F', () => localizar(false)], [tr('Substituir no arquivo'), 'Ctrl+H', () => localizar(true)], ...(o.recarregarArvore ? [[tr('Recarregar árvore de arquivos'), '', recarregar]] : []),
      [tr('Comentar ou descomentar linha'), 'Ctrl+/', () => comandoDoEditor('comentar')], [tr('Sugestões de código'), 'Ctrl+Espaço', () => comandoDoEditor('sugestoes')],
      [tr('Formatar documento'), 'Shift+Alt+F', () => comandoDoEditor('formatar')], [tr('Renomear símbolo'), 'F2', () => comandoDoEditor('renomear')], [tr('Ir para a definição'), 'F12', () => comandoDoEditor('definicao')],
      [tr('Selecionar todas as ocorrências'), 'Ctrl+Shift+L', () => comandoDoEditor('selecionarOcorrencias')], [tr('Paleta de comandos do editor'), 'F1', () => comandoDoEditor('paleta')],
      [tr('Ir para símbolo do arquivo'), 'Ctrl+Shift+O', () => comandoDoEditor('simbolos')], [tr('Modo foco (Zen)'), 'Ctrl+K Z', () => alternarZen()], [tr('Mostrar atalhos do teclado'), '', mostrarAtalhos], [tr('Fixar aba'), '', () => ativa && fixar(ativa)],
      [tr('Dobrar tudo'), '', () => comandoDoEditor('dobrarTudo')], [tr('Desdobrar tudo'), '', () => comandoDoEditor('desdobrarTudo')], [tr('Alternar quebra de linha'), '', alternarQuebra],
      [tr('Alternar minimapa'), '', alternarMinimapa], [tr('Aumentar a fonte do editor'), '', () => mudarFonte(1)], [tr('Diminuir a fonte do editor'), '', () => mudarFonte(-1)],
      [tr('Alternar painel inferior'), 'Ctrl+J', () => alternarPainel()], ...(o.terminal ? [[tr('Alternar terminal'), 'Ctrl+`', alternarTerminal], [tr('Limpar terminal'), '', () => { terminalDaIde.limpar(); }]] : []), [tr('Alternar barra lateral'), 'Ctrl+B', alternarLateral], [tr('Mostrar Explorador'), '', () => trocarVisao('explorador')],
      ...(recursos.buscar ? [[tr('Buscar nos arquivos'), 'Ctrl+Shift+F', () => trocarVisao('buscar')]] : []), ...(recursos.git ? [[tr('Abrir controle de código-fonte'), 'Ctrl+Shift+G', () => trocarVisao('git')]] : []),
      [tr('Validar arquivo aberto'), '', () => { escolherPainel('problemas'); validar(); }], [tr('Mostrar testes do arquivo'), '', () => escolherPainel('testes')],
      [tr('Abrir Pipelines CI/CD'), '', () => irParaTestes('pipelines')], [tr('Abrir Código'), '', () => irParaTestes('ide')], [tr('Abrir Runs'), '', () => irParaTestes('runs')], [tr('Abrir Planos'), '', () => irParaTestes('planos')],
      [tr('Abrir Projetos'), '', () => sair(() => mostrar('projetos'))], [tr('Abrir Agentes'), '', () => sair(() => mostrar('agentes'))]].map(([rotulo, atalho, executar]) => ({ rotulo, detalhe: atalho, executar }));
    const subsequencia = (texto, q) => { let i = 0; for (const c of texto.toLowerCase()) if (c === q[i]) i++; return i >= q.length; };
    function itensRapida(q) {
      let modo = rModo; let texto = q;
      if (rModo === 'arquivo' && /^[>:@]/.test(q)) { modo = { '>': 'comando', ':': 'linha', '@': 'simbolo' }[q[0]]; texto = q.slice(1); }
      const n = texto.trim().toLowerCase();
      if (modo === 'simbolo') return [{ rotulo: tr('Abrir a lista de símbolos do arquivo'), executar: () => comandoDoEditor('simbolos') }];
      if (modo === 'arquivo') return [...new Set([...arvoreEl.querySelectorAll('[data-arquivo]')].map((b) => b.dataset.arquivo))].filter((a) => subsequencia(a, n)).sort((a, b) => Number(nomeDe(b).toLowerCase().includes(n)) - Number(nomeDe(a).toLowerCase().includes(n))).slice(0, 50).map((a) => ({ rotulo: nomeDe(a), detalhe: a, executar: () => void abrir(a) }));
      if (modo === 'comando') return comandos().filter((c) => c.rotulo.toLowerCase().includes(n));
      const max = ativa?.doc ? ativa.doc.lineCount() : 0; const l = Number.parseInt(n, 10);
      return Number.isInteger(l) && l >= 1 && l <= max ? [{ rotulo: tr('Ir para a linha {n}', { n: l }), executar: () => irParaLinha(l) }] : [{ rotulo: max ? tr('Informe uma linha de 1 a {n}', { n: max }) : tr('Abra um arquivo de texto primeiro'), desabilitado: true }];
    }
    function desenharRapida() {
      rItens = itensRapida(rIn.value); rSel = Math.min(rSel, Math.max(rItens.length - 1, 0));
      rLista.replaceChildren(...(rItens.length ? rItens.map((x, i) => h('li', { role: 'option', id: id + '-opcao-' + i, 'aria-selected': String(i === rSel), 'aria-disabled': x.desabilitado ? 'true' : null, onmousedown: (ev) => { ev.preventDefault(); executarRapida(i); } }, h('span', {}, x.rotulo), x.detalhe ? h('span', { class: 'ds-sub' }, x.detalhe) : null))
        : [h('li', { class: 'suave', role: 'presentation' }, tr('Nada encontrado'))]));
      rIn.setAttribute('aria-activedescendant', rItens.length ? id + '-opcao-' + rSel : '');
      rLista.children[rSel]?.scrollIntoView?.({ block: 'nearest' });
    }
    function abrirRapida(modo) {
      rModo = modo; rSel = 0; rIn.value = ''; rIn.placeholder = { arquivo: tr('Nome do arquivo (> comandos, : linha, @ símbolos)'), comando: tr('Digite um comando (Ctrl+Shift+P)'), linha: tr('Número da linha (Ctrl+G)') }[modo];
      rIn.setAttribute('aria-label', rIn.placeholder); rapida.hidden = false; desenharRapida(); rIn.focus();
    }
    function fecharRapida() { rapida.hidden = true; if (ativa?.doc) editorDeCodigo.comando('foco'); else caixa.focus?.(); }
    function executarRapida(i) { const x = rItens[i]; if (!x || x.desabilitado) return; fecharRapida(); x.executar(); }
    rIn.addEventListener('input', () => { rSel = 0; if (rModo === 'arquivo' && rIn.value === '@' && ativa?.doc) { fecharRapida(); comandoDoEditor('simbolos'); return; } desenharRapida(); });
    rIn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); fecharRapida(); }
      else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); rSel = Math.max(0, Math.min(rItens.length - 1, rSel + (ev.key === 'ArrowDown' ? 1 : -1))); desenharRapida(); }
      else if (ev.key === 'Enter') { ev.preventDefault(); executarRapida(rSel); }
    });
    rIn.addEventListener('blur', () => { setTimeout(() => { if (!rapida.hidden && !rapida.contains(document.activeElement)) rapida.hidden = true; }, 120); });

    // Os atalhos valem com o foco em qualquer lugar da IDE ou com nada focado (como no VS Code); campos de outras telas, como o chat, ficam de fora.
    function aoTeclarNaIde(ev) {
      if (!caixa.isConnected) { document.removeEventListener('keydown', aoTeclarNaIde); return; }
      const alvo = ev.target; if (!(alvo === document.body || alvo === document.documentElement || caixa.contains(alvo)) || document.querySelector('dialog[open]')) return;
      if (ev.key === 'Escape') { escDoZen(); }
      if (acordeK && !ev.ctrlKey && ev.key.toLowerCase() === 'z') { ev.preventDefault(); acordeK = false; alternarZen(); return; }
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); acordeK = true; setTimeout(() => { acordeK = false; }, 1500); return; }
      if (ev.defaultPrevented || !(ev.ctrlKey || ev.metaKey)) return;
      const acao = { s: () => salvar(), w: () => ativa && fechar(ativa), g: () => (ativa?.doc ? comandoDoEditor('linha') : abrirRapida('linha')), f: () => localizar(false), 'S+f': () => recursos.buscar && trocarVisao('buscar'), h: () => localizar(true), j: () => alternarPainel(), '`': alternarTerminal, b: alternarLateral,
        p: () => abrirRapida('arquivo'), 'S+p': () => abrirRapida('comando'), 'S+g': () => recursos.git && trocarVisao('git') }[(ev.shiftKey ? 'S+' : '') + ev.key.toLowerCase()];
      if (acao) { ev.preventDefault(); acao(); }
    }
    document.addEventListener('keydown', aoTeclarNaIde);

    mostrarVista(vazioDaIde());
    desenharAbas(); desenharTrilha(); atualizarStatus(); atualizarLateral(); desenharPainel(); void carregarRamo();
    return { arvoreEl, arvore, definirArvore, botaoArquivo: (arquivo, nome, detalhe) => botaoDeArquivo(arquivo, nome, (a) => void abrir(a, undefined, true), detalhe, (a) => void abrir(a)), abrir, temAlteracoes, atualizarLateral, registrar, filtrar };
  }

  window.PrumoIde = Object.freeze({ montar, resumoDoWorkflow, problemasDe, trechosDoDiff });
})();
