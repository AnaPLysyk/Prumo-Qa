/** Limpa o estado da conversa visual. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function reiniciar() { versao++; primeira = true; fila = Promise.resolve(); historico = []; pendente = null; delete el.dataset.conversou; msgs.replaceChildren(); projeto = idAtual(); sugerir(INICIAIS); saudar(); }
    function sincronizar() { if (!el) return; carregarRoster(); entrada.setAttribute('aria-label', tr('Mensagem para o Prumo')); entrada.placeholder = tr('Pergunte alguma coisa ao Prumo…'); if (projeto !== idAtual()) reiniciar(); }
    function ajustarAltura() { entrada.style.height = 'auto'; entrada.style.height = Math.min(125, entrada.scrollHeight) + 'px'; }
