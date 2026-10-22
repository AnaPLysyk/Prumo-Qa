'use strict';
/**
 * Cliente do editor de código: mostra a página isolada do Monaco (editor.html, em um iframe) e conversa com ela só por mensagens.
 * O iframe não recebe a ponte do aplicativo (api): arquivos são lidos e gravados pela janela, nunca por ele.
 * criar(aoEvento) devolve { quadro, abrir, ativar, fechar, texto, limpo, pedirTexto, comando, opcoes }; aoEvento recebe pronto, alterou, cursor, problemas, atalho e erro.
 */
window.PrumoEditorDeCodigo = (() => {
  const temaAtual = () => { const t = document.documentElement.dataset.tema; return t === 'claro' || (t !== 'escuro' && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'claro' : 'escuro'; };

  function criar(aoEvento) {
    const quadro = h('iframe', { class: 'ds-wb-editor-quadro', title: tr('Editor de código'), src: 'telas/editor-de-codigo/editor.html' });
    const fila = []; const respostas = new Map(); let pronto = false, sequencia = 0, anexado = false;
    const enviar = (msg) => { const m = { prumoEditor: 1, ...msg }; if (pronto) quadro.contentWindow.postMessage(m, '*'); else fila.push(m); };
    const observador = new MutationObserver(() => enviar({ t: 'tema', valor: temaAtual() }));
    const encerrar = () => { window.removeEventListener('message', aoMensagem); observador.disconnect(); for (const r of respostas.values()) r(null); respostas.clear(); };
    function aoMensagem(ev) {
      if (quadro.isConnected) anexado = true; else if (anexado) { encerrar(); return; }
      if (ev.source !== quadro.contentWindow || ev.data?.prumoEditor !== 1) return;
      const m = ev.data;
      if (m.t === 'pronto') { pronto = true; enviar({ t: 'tema', valor: temaAtual() }); for (const x of fila.splice(0)) quadro.contentWindow.postMessage(x, '*'); }
      if (m.t === 'texto') { respostas.get(m.req)?.(m.texto); respostas.delete(m.req); return; }
      aoEvento(m);
    }
    window.addEventListener('message', aoMensagem);
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
    return {
      quadro,
      abrir: (id, caminho, texto, somenteLeitura) => enviar({ t: 'abrir', id, caminho, texto, somenteLeitura }),
      ativar: (id, linha) => enviar({ t: 'ativar', id, linha }), fechar: (id) => enviar({ t: 'fechar', id }),
      texto: (id, texto) => enviar({ t: 'texto', id, texto }), limpo: (id) => enviar({ t: 'limpo', id }),
      /** Texto exato do editor agora (o espelho da janela pode estar até 120 ms atrasado); null se o editor não responder. */
      pedirTexto: (id) => new Promise((resolver) => { const req = ++sequencia; respostas.set(req, resolver); enviar({ t: 'pedirTexto', id, req }); setTimeout(() => { if (respostas.delete(req)) resolver(null); }, 3000); }),
      decoracoes: (id, itens) => enviar({ t: 'decoracoes', id, itens }),
      comando: (nome, extra = {}) => enviar({ t: 'comando', nome, ...extra }), opcoes: (o) => enviar({ t: 'opcoes', ...o })
    };
  }

  return Object.freeze({ criar });
})();
