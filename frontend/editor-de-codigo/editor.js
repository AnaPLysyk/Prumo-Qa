'use strict';
// Editor do Prumo: Monaco (o editor do VS Code) numa página isolada. Não conhece o aplicativo: recebe comandos da janela e devolve o que mudou.
// Mensagens da janela: abrir, ativar, fechar, texto, limpo, pedirTexto, comando, opcoes, tema. Mensagens daqui: pronto, erro, alterou, cursor, problemas, atalho, texto.
(() => {
  const pai = window.parent;
  const enviar = (msg) => pai.postMessage({ prumoEditor: 1, ...msg }, '*');
  const TRABALHADORES = {
    json: 'json.worker-Csf_TLih.js', css: 'css.worker-BpD9FCKP.js', scss: 'css.worker-BpD9FCKP.js', less: 'css.worker-BpD9FCKP.js',
    html: 'html.worker-CLuInTTy.js', handlebars: 'html.worker-CLuInTTy.js', razor: 'html.worker-CLuInTTy.js', typescript: 'ts.worker-g3pjEjl4.js', javascript: 'ts.worker-g3pjEjl4.js'
  };
  const FONTE = "'JetBrains Mono Variable', 'Cascadia Mono', Consolas, monospace";
  const SEVERIDADE = { 8: 'erro', 4: 'aviso', 2: 'info', 1: 'info' };

  self.MonacoEnvironment = { getWorkerUrl: (_id, rotulo) => 'vendor/vs/assets/' + (TRABALHADORES[rotulo] || 'editor.worker-_vAIFJDs.js') };
  require.config({ paths: { vs: 'vendor/vs' } });

  const temas = {
    escuro: { base: 'vs-dark', inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7da3', fontStyle: 'italic' }, { token: 'keyword', foreground: '7eb3ff' }, { token: 'keyword.control', foreground: 'a99bff' },
        { token: 'string', foreground: '7fd8a8' }, { token: 'number', foreground: 'f2c46d' }, { token: 'type', foreground: 'c3a6ff' }, { token: 'type.identifier', foreground: 'c3a6ff' },
        { token: 'tag', foreground: '7eb3ff' }, { token: 'attribute.name', foreground: 'f2c46d' }, { token: 'attribute.value', foreground: '7fd8a8' }, { token: 'variable', foreground: 'e6ecfa' },
        { token: 'delimiter', foreground: '9aa8c2' }, { token: 'operator', foreground: '9aa8c2' }, { token: 'regexp', foreground: 'ff9f7a' }
      ],
      colors: {
        'editor.background': '#070d1d00', 'editor.foreground': '#e6ecfa', 'editorLineNumber.foreground': '#4a5878', 'editorLineNumber.activeForeground': '#a9b8d6',
        'editor.lineHighlightBackground': '#0d1730', 'editor.lineHighlightBorder': '#0d1730', 'editorCursor.foreground': '#6ea8ff', 'editor.selectionBackground': '#2a508f80',
        'editor.inactiveSelectionBackground': '#2a508f40', 'editor.findMatchBackground': '#e8b84a66', 'editor.findMatchHighlightBackground': '#e8b84a33', 'editor.wordHighlightBackground': '#6ea8ff22',
        'editorIndentGuide.background1': '#15203c', 'editorIndentGuide.activeBackground1': '#2c3f6b', 'editorBracketMatch.background': '#6ea8ff22', 'editorBracketMatch.border': '#6ea8ff88',
        'editorGutter.background': '#070d1d00', 'editorOverviewRuler.border': '#070d1d00', 'minimap.background': '#070d1d00', 'minimapSlider.background': '#2a3a6233', 'minimapSlider.hoverBackground': '#2a3a6266',
        'scrollbarSlider.background': '#2a3a6240', 'scrollbarSlider.hoverBackground': '#3a4f84aa', 'scrollbarSlider.activeBackground': '#4a64a8cc',
        'editorWidget.background': '#0a1122', 'editorWidget.border': '#1c2742', 'editorSuggestWidget.background': '#0a1122', 'editorSuggestWidget.border': '#1c2742', 'editorSuggestWidget.selectedBackground': '#16264a',
        'editorHoverWidget.background': '#0a1122', 'editorHoverWidget.border': '#1c2742', 'input.background': '#070d1d', 'input.border': '#1c2742', 'focusBorder': '#6ea8ff',
        'list.hoverBackground': '#101b36', 'list.activeSelectionBackground': '#16264a', 'editorStickyScroll.background': '#0a1122', 'editorStickyScrollHover.background': '#101b36'
      } },
    claro: { base: 'vs', inherit: true,
      rules: [
        { token: 'comment', foreground: '6a7a99', fontStyle: 'italic' }, { token: 'keyword', foreground: '1f56b8' }, { token: 'string', foreground: '0f6b4a' }, { token: 'number', foreground: '8a5a00' },
        { token: 'type', foreground: '6d3fd8' }, { token: 'tag', foreground: '1f56b8' }, { token: 'attribute.name', foreground: '8a5a00' }, { token: 'attribute.value', foreground: '0f6b4a' }
      ],
      colors: {
        'editor.background': '#f7f9fd00', 'editor.foreground': '#14233d', 'editorLineNumber.foreground': '#9aa8c2', 'editorLineNumber.activeForeground': '#465875', 'editor.lineHighlightBackground': '#edf2fb',
        'editor.lineHighlightBorder': '#edf2fb', 'editorCursor.foreground': '#1f56b8', 'editor.selectionBackground': '#b5cdf577', 'editorGutter.background': '#f7f9fd00', 'minimap.background': '#f7f9fd00',
        'editorWidget.background': '#ffffff', 'editorWidget.border': '#cfd9ea', 'editorSuggestWidget.background': '#ffffff', 'editorSuggestWidget.border': '#cfd9ea', 'focusBorder': '#1f56b8'
      } }
  };

  require(['vs/editor/editor.main'], () => {
    const ts = monaco.languages.typescript || monaco.typescript;
    if (ts) {
      const opcoes = { target: ts.ScriptTarget.ESNext, allowNonTsExtensions: true, allowJs: true, checkJs: false, noEmit: true, jsx: ts.JsxEmit.Preserve, moduleResolution: ts.ModuleResolutionKind.NodeJs };
      ts.typescriptDefaults.setCompilerOptions(opcoes); ts.javascriptDefaults.setCompilerOptions(opcoes);
      // Sem os pacotes do projeto carregados, a análise de tipos só inventaria erro ("Cannot find module"): fica a sintaxe e as sugestões.
      for (const d of [ts.typescriptDefaults, ts.javascriptDefaults]) d.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
    }
    monaco.languages.register({ id: 'gherkin', extensions: ['.feature'], aliases: ['Gherkin'] });
    monaco.languages.setLanguageConfiguration('gherkin', { comments: { lineComment: '#' } });
    monaco.languages.setMonarchTokensProvider('gherkin', { tokenizer: { root: [
      [/^\s*#.*$/, 'comment'], [/^\s*@[\w-]+.*$/, 'tag'],
      [/^\s*(Funcionalidade|Feature|Contexto|Background|Esquema do Cen[aá]rio|Scenario Outline|Cen[aá]rio|Scenario|Exemplos|Examples)\s*:/, 'keyword'],
      [/^\s*(Dado|Quando|Ent[aã]o|Mas|E|Given|When|Then|And|But)\b/, 'keyword.control'], [/"[^"]*"/, 'string'], [/<[^>]+>/, 'variable'], [/\|/, 'delimiter'], [/\b\d+\b/, 'number']
    ] } });
    for (const [nome, definicao] of Object.entries(temas)) monaco.editor.defineTheme('prumo-' + nome, definicao);

    const entradas = new Map(); let ativa = null; let nomeTema = 'escuro';
    const el = document.getElementById('editor');
    const editor = monaco.editor.create(el, {
      theme: 'prumo-' + nomeTema, automaticLayout: true, fontFamily: FONTE, fontSize: 14, lineHeight: 22, fontLigatures: true, tabSize: 2, insertSpaces: true, detectIndentation: true,
      minimap: { enabled: true, renderCharacters: false, maxColumn: 100, scale: 1 }, bracketPairColorization: { enabled: true }, guides: { bracketPairs: true, indentation: true, highlightActiveIndentation: true },
      smoothScrolling: true, cursorBlinking: 'smooth', cursorSmoothCaretAnimation: 'on', renderLineHighlight: 'all', scrollBeyondLastLine: false, padding: { top: 12, bottom: 12 }, stickyScroll: { enabled: true },
      renderWhitespace: 'selection', folding: true, showFoldingControls: 'mouseover', formatOnPaste: true, linkedEditing: true, mouseWheelZoom: true, wordWrap: 'off', 'semanticHighlighting.enabled': true,
      quickSuggestions: { other: true, comments: false, strings: true }, suggestOnTriggerCharacters: true, tabCompletion: 'on', wordBasedSuggestions: 'allDocuments', parameterHints: { enabled: true },
      scrollbar: { verticalScrollbarSize: 12, horizontalScrollbarSize: 12, useShadows: false }, overviewRulerBorder: false, roundedSelection: true, ariaLabel: 'Editor de código', accessibilitySupport: 'auto'
    });

    // Atalhos do aplicativo que o Monaco não pode engolir: voltam para a janela.
    const K = monaco.KeyCode, M = monaco.KeyMod;
    for (const [combo, chave] of [[M.CtrlCmd | K.KeyS, 's'], [M.CtrlCmd | K.KeyP, 'p'], [M.CtrlCmd | M.Shift | K.KeyP, 'S+p'], [M.CtrlCmd | K.KeyW, 'w'], [M.CtrlCmd | K.KeyB, 'b'], [M.CtrlCmd | K.KeyJ, 'j'],
      [M.CtrlCmd | K.Backquote, '`'], [M.chord(M.CtrlCmd | K.KeyK, K.KeyZ), 'zen'], [M.CtrlCmd | M.Shift | K.KeyF, 'S+f'], [M.CtrlCmd | M.Shift | K.KeyG, 'S+g']]) editor.addCommand(combo, () => enviar({ t: 'atalho', chave }));

    // Esc volta para a janela (sai do modo foco com dois toques); "Pedir ao Orquestrador" entra no menu de contexto do editor.
    editor.onKeyDown((ev) => { if (ev.keyCode === K.Escape) enviar({ t: 'atalho', chave: 'Esc' }); });
    editor.addAction({ id: 'prumo.orquestrador', label: 'Pedir ao Orquestrador sobre a seleção', contextMenuGroupId: 'navigation', contextMenuOrder: 0, run: (ed) => {
      const sel = ed.getSelection(); enviar({ t: 'orquestrador', linha: sel.startLineNumber, fim: sel.endLineNumber, texto: ed.getModel().getValueInRange(sel).slice(0, 240) });
    } });
    const lista = (id) => monaco.editor.getModelMarkers({ resource: entradas.get(id)?.model.uri }).filter((m) => m.severity >= 2).map((m) => ({ linha: m.startLineNumber, coluna: m.startColumn, nivel: SEVERIDADE[m.severity] || 'info', texto: m.message, origem: m.source || '' }));
    let agendado = 0;
    const informarCursor = () => {
      if (!ativa) return; const p = editor.getPosition(); const m = ativa.model; const s = editor.getSelection();
      enviar({ t: 'cursor', id: ativa.id, linha: p.lineNumber, coluna: p.column, selecionados: s.isEmpty() ? 0 : m.getValueInRange(s).length, eol: m.getEOL() === '\r\n' ? 'CRLF' : 'LF', tab: m.getOptions().tabSize, espacos: m.getOptions().insertSpaces,
        linguagem: m.getLanguageId(), rotulo: monaco.languages.getLanguages().find((l) => l.id === m.getLanguageId())?.aliases?.[0] || m.getLanguageId() });
    };
    editor.onDidChangeCursorPosition(() => { cancelAnimationFrame(agendado); agendado = requestAnimationFrame(informarCursor); });
    editor.onDidChangeCursorSelection(() => { cancelAnimationFrame(agendado); agendado = requestAnimationFrame(informarCursor); });
    let marcadores = 0;
    monaco.editor.onDidChangeMarkers(() => { clearTimeout(marcadores); marcadores = setTimeout(() => { if (ativa) enviar({ t: 'problemas', id: ativa.id, lista: lista(ativa.id) }); }, 250); });

    const sujo = (e) => e.model.getAlternativeVersionId() !== e.limpa;
    function criar({ id, caminho, texto, somenteLeitura }) {
      let e = entradas.get(id);
      if (e) { e.model.dispose(); }
      const model = monaco.editor.createModel(texto, undefined, monaco.Uri.file('/' + caminho));
      model.setEOL(monaco.editor.EndOfLineSequence.LF);
      e = { id, model, limpa: model.getAlternativeVersionId(), estado: null, somenteLeitura: !!somenteLeitura, ultimoSujo: false, temporizador: 0 };
      model.onDidChangeContent(() => {
        const agora = sujo(e);
        if (agora !== e.ultimoSujo) { e.ultimoSujo = agora; enviar({ t: 'alterou', id, sujo: agora }); }
        clearTimeout(e.temporizador); e.temporizador = setTimeout(() => enviar({ t: 'alterou', id, sujo: sujo(e), texto: model.getValue() }), 120);
      });
      entradas.set(id, e); return e;
    }
    function ativar(id, linha) {
      const e = entradas.get(id); if (!e) return;
      if (ativa) ativa.estado = editor.saveViewState();
      ativa = e; editor.setModel(e.model); editor.updateOptions({ readOnly: e.somenteLeitura, domReadOnly: e.somenteLeitura });
      if (e.estado) editor.restoreViewState(e.estado);
      if (linha) { editor.setPosition({ lineNumber: linha, column: 1 }); editor.revealLineInCenter(linha); }
      editor.focus(); informarCursor(); enviar({ t: 'problemas', id, lista: lista(id) });
    }
    const ACOES = { localizar: 'actions.find', substituir: 'editor.action.startFindReplace', linha: 'editor.action.gotoLine', paleta: 'editor.action.quickCommand', comentar: 'editor.action.commentLine', dobrarTudo: 'editor.foldAll',
      desdobrarTudo: 'editor.unfoldAll', formatar: 'editor.action.formatDocument', sugestoes: 'editor.action.triggerSuggest', renomear: 'editor.action.rename', simbolos: 'editor.action.quickOutline', definicao: 'editor.action.revealDefinition', selecionarOcorrencias: 'editor.action.selectHighlights' };

    window.addEventListener('message', (ev) => {
      if (ev.source !== pai) return; const m = ev.data; if (!m || m.prumoEditor !== 1) return;
      if (m.t === 'abrir') { criar(m); }
      else if (m.t === 'ativar') ativar(m.id, m.linha);
      else if (m.t === 'fechar') { const e = entradas.get(m.id); if (e) { if (ativa === e) ativa = null; e.model.dispose(); entradas.delete(m.id); } }
      else if (m.t === 'texto') { const e = entradas.get(m.id); if (e) { e.model.setValue(m.texto); e.limpa = e.model.getAlternativeVersionId(); e.ultimoSujo = false; enviar({ t: 'alterou', id: m.id, sujo: false, texto: m.texto }); } }
      else if (m.t === 'decoracoes') { const e = entradas.get(m.id); if (e) e.ids = e.model.deltaDecorations(e.ids || [], (m.itens || []).map((x) => ({ range: new monaco.Range(x.de, 1, x.ate, 1), options: { isWholeLine: true, linesDecorationsClassName: 'git-' + x.tipo } }))); }
      else if (m.t === 'limpo') { const e = entradas.get(m.id); if (e) { e.limpa = e.model.getAlternativeVersionId(); e.ultimoSujo = false; enviar({ t: 'alterou', id: m.id, sujo: false }); } }
      else if (m.t === 'pedirTexto') enviar({ t: 'texto', req: m.req, id: m.id, texto: entradas.get(m.id)?.model.getValue() ?? null });
      else if (m.t === 'comando') {
        if (m.nome === 'irParaLinha') { editor.setPosition({ lineNumber: Math.max(1, Number(m.linha) || 1), column: 1 }); editor.revealLineInCenter(Math.max(1, Number(m.linha) || 1)); editor.focus(); }
        else if (m.nome === 'foco') editor.focus();
        else if (ACOES[m.nome]) { editor.focus(); editor.getAction(ACOES[m.nome])?.run(); }
      } else if (m.t === 'opcoes') {
        const o = {}; if (typeof m.quebra === 'boolean') o.wordWrap = m.quebra ? 'on' : 'off'; if (typeof m.minimapa === 'boolean') o.minimap = { enabled: m.minimapa, renderCharacters: false, maxColumn: 100 };
        if (Number.isFinite(m.fonte)) { o.fontSize = Math.max(10, Math.min(28, m.fonte)); o.lineHeight = Math.round(o.fontSize * 1.57); } editor.updateOptions(o);
      } else if (m.t === 'tema') { nomeTema = m.valor === 'claro' ? 'claro' : 'escuro'; document.body.dataset.tema = nomeTema; monaco.editor.setTheme('prumo-' + nomeTema); }
    });
    enviar({ t: 'pronto' });
  }, (erro) => enviar({ t: 'erro', texto: String(erro && erro.message || erro) }));
})();
