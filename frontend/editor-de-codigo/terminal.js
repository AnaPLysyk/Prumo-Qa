'use strict';
// Terminal do Prumo: xterm.js numa página isolada. Faz só a linha de comando (editar, histórico) e desenhar a saída; quem executa é o aplicativo, depois da confirmação.
// Mensagens da janela: escrever, prompt, executando, limpar, tema, foco, boasVindas. Mensagens daqui: pronto, comando, parar, atalho.
(() => {
  const pai = window.parent;
  const enviar = (msg) => pai.postMessage({ prumoTerminal: 1, ...msg }, '*');
  const CORES = {
    escuro: { background: 'rgba(0,0,0,0)', foreground: '#e6ecfa', cursor: '#6ea8ff', cursorAccent: '#070d1d', selectionBackground: '#2a508f80', black: '#1c2742', red: '#ff7b8c', green: '#7fd8a8', yellow: '#f2c46d', blue: '#7eb3ff', magenta: '#c3a6ff', cyan: '#6fd3e8', white: '#e6ecfa', brightBlack: '#6b7da3', brightRed: '#ff9aa8', brightGreen: '#9be8bf', brightYellow: '#f7d58f', brightBlue: '#a3c9ff', brightMagenta: '#d6c2ff', brightCyan: '#94e2f2', brightWhite: '#ffffff' },
    claro: { background: 'rgba(0,0,0,0)', foreground: '#14233d', cursor: '#1f56b8', cursorAccent: '#f7f9fd', selectionBackground: '#b5cdf577', black: '#14233d', red: '#b3243b', green: '#0f6b4a', yellow: '#8a5a00', blue: '#1f56b8', magenta: '#6d3fd8', cyan: '#0b7a8a', white: '#465875', brightBlack: '#6a7a99', brightRed: '#d23b55', brightGreen: '#188a60', brightYellow: '#a87000', brightBlue: '#3a74d8', brightMagenta: '#8a5ff0', brightCyan: '#1597a8', brightWhite: '#14233d' }
  };
  const term = new Terminal({ fontFamily: "'JetBrains Mono Variable', 'Cascadia Mono', Consolas, monospace", fontSize: 13, lineHeight: 1.25, cursorBlink: true, cursorStyle: 'bar', scrollback: 5000, convertEol: true, allowProposedApi: true, allowTransparency: true, theme: CORES.escuro, ariaLabel: 'Terminal' });
  const ajuste = new FitAddon.FitAddon(); term.loadAddon(ajuste); term.open(document.getElementById('terminal'));
  const encaixar = () => { try { ajuste.fit(); } catch { /* ainda sem tamanho */ } };
  new ResizeObserver(encaixar).observe(document.getElementById('terminal')); encaixar();

  const AZUL = '\x1b[38;5;75m', CINZA = '\x1b[90m', ZERO = '\x1b[0m';
  let rotuloPasta = '', linha = '', posicao = 0, executando = false, historico = [], indice = 0;
  const prompt = () => AZUL + (rotuloPasta || 'projeto') + ZERO + ' ❯ ';
  const desenharLinha = () => { term.write('\r\x1b[2K' + prompt() + linha + (linha.length > posicao ? '\x1b[' + (linha.length - posicao) + 'D' : '')); };
  const novaLinha = () => { linha = ''; posicao = 0; indice = historico.length; term.write('\r\n' + prompt()); };
  function confirmarLinha() {
    const comando = linha.trim(); term.write('\r\n');
    if (!comando) { linha = ''; posicao = 0; term.write(prompt()); return; }
    if (historico[historico.length - 1] !== comando) historico.push(comando); historico = historico.slice(-100); indice = historico.length;
    if (/^(?:clear|cls)$/i.test(comando)) { term.clear(); term.write('\x1b[2J\x1b[H'); linha = ''; posicao = 0; term.write(prompt()); return; }
    linha = ''; posicao = 0; enviar({ t: 'comando', texto: comando });
  }

  term.onData((d) => {
    if (executando) { if (d === '\x03') enviar({ t: 'parar' }); return; }
    if (d === '\r') return confirmarLinha();
    if (d === '\x7f') { if (posicao > 0) { linha = linha.slice(0, posicao - 1) + linha.slice(posicao); posicao--; desenharLinha(); } return; }
    if (d === '\x03') { term.write('^C'); novaLinha(); return; }
    if (d === '\x1b[3~') { if (posicao < linha.length) { linha = linha.slice(0, posicao) + linha.slice(posicao + 1); desenharLinha(); } return; }
    if (d === '\x1b[D') { if (posicao > 0) { posicao--; term.write('\x1b[D'); } return; }
    if (d === '\x1b[C') { if (posicao < linha.length) { posicao++; term.write('\x1b[C'); } return; }
    if (d === '\x1b[H' || d === '\x01') { posicao = 0; desenharLinha(); return; }
    if (d === '\x1b[F' || d === '\x05') { posicao = linha.length; desenharLinha(); return; }
    if (d === '\x1b[A' || d === '\x1b[B') {
      if (!historico.length) return;
      indice = Math.max(0, Math.min(historico.length, indice + (d === '\x1b[A' ? -1 : 1))); linha = historico[indice] || ''; posicao = linha.length; desenharLinha(); return;
    }
    if (d === '\x15') { linha = ''; posicao = 0; desenharLinha(); return; }
    if (d.startsWith('\x1b')) return;
    // Texto colado (várias linhas): só o texto entra; quebra de linha nunca executa nada sozinha.
    const texto = d.replace(/[\u0000-\u001f\u007f]+/g, ' '); if (!texto) return;
    linha = linha.slice(0, posicao) + texto + linha.slice(posicao); posicao += texto.length; desenharLinha();
  });
  term.attachCustomKeyEventHandler((ev) => {
    if (ev.type === 'keydown' && ev.ctrlKey && ev.key === '`') { enviar({ t: 'atalho', chave: '`' }); return false; }
    if (ev.type === 'keydown' && ev.ctrlKey && ev.key.toLowerCase() === 'c' && term.hasSelection()) return false;
    return true;
  });

  window.addEventListener('message', (ev) => {
    if (ev.source !== pai) return; const m = ev.data; if (!m || m.prumoTerminal !== 1) return;
    if (m.t === 'escrever') term.write(String(m.texto));
    else if (m.t === 'executando') { executando = !!m.valor; if (!executando) novaLinha(); }
    else if (m.t === 'prompt') { rotuloPasta = String(m.pasta || ''); }
    else if (m.t === 'limpar') { term.clear(); }
    else if (m.t === 'boasVindas') { term.write(CINZA + String(m.texto).replace(/\n/g, '\r\n') + ZERO + '\r\n' + prompt()); }
    else if (m.t === 'tema') { const nome = m.valor === 'claro' ? 'claro' : 'escuro'; document.body.dataset.tema = nome; term.options.theme = CORES[nome]; }
    else if (m.t === 'foco') term.focus();
  });
  enviar({ t: 'pronto' });
})();
