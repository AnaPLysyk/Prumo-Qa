'use strict';
/**
 * Cliente do terminal da IDE: mostra a página isolada do xterm.js (terminal.html, em um iframe) e conversa com ela só por mensagens.
 * O iframe só desenha a saída e devolve o que foi digitado; executar, confirmar e ler a saída é da janela e do aplicativo.
 * criar(aoEvento) devolve { quadro, escrever, prompt, executando, limpar, boasVindas, foco }; aoEvento recebe pronto, comando, parar e atalho.
 */
window.PrumoTerminalDaIde = (() => {
  const temaAtual = () => { const t = document.documentElement.dataset.tema; return t === 'claro' || (t !== 'escuro' && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'claro' : 'escuro'; };

  function criar(aoEvento) {
    const quadro = h('iframe', { class: 'ds-wb-terminal-quadro', title: tr('Terminal'), src: 'telas/editor-de-codigo/terminal.html' });
    const fila = []; let pronto = false, anexado = false;
    const enviar = (msg) => { const m = { prumoTerminal: 1, ...msg }; if (pronto) quadro.contentWindow.postMessage(m, '*'); else fila.push(m); };
    const observador = new MutationObserver(() => enviar({ t: 'tema', valor: temaAtual() }));
    const encerrar = () => { window.removeEventListener('message', aoMensagem); observador.disconnect(); };
    function aoMensagem(ev) {
      if (quadro.isConnected) anexado = true; else if (anexado) { encerrar(); return; }
      if (ev.source !== quadro.contentWindow || ev.data?.prumoTerminal !== 1) return;
      if (ev.data.t === 'pronto') { pronto = true; enviar({ t: 'tema', valor: temaAtual() }); for (const x of fila.splice(0)) quadro.contentWindow.postMessage(x, '*'); }
      aoEvento(ev.data);
    }
    window.addEventListener('message', aoMensagem);
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
    return {
      quadro, escrever: (texto) => enviar({ t: 'escrever', texto }), prompt: (pasta) => enviar({ t: 'prompt', pasta }), executando: (valor) => enviar({ t: 'executando', valor }),
      limpar: () => enviar({ t: 'limpar' }), boasVindas: (texto) => enviar({ t: 'boasVindas', texto }), foco: () => enviar({ t: 'foco' })
    };
  }

  return Object.freeze({ criar });
})();
