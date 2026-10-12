/** Monta os elementos do painel de conversa. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function montar() {
      if (el) return el;
      msgs = h('div', { class: 'v36c-msgs', id: 'chat-msgs', 'aria-live': 'polite', 'data-i18n-ignore': '' });
      entrada = h('textarea', { id: 'chat-input', rows: 1, maxlength: 300, placeholder: tr('Pergunte alguma coisa ao Prumo…'), 'aria-label': tr('Mensagem para o Prumo'), autocomplete: 'off' });
      enviar = h('button', { type: 'submit', class: 'v36c-enviar', 'aria-label': tr('Enviar mensagem'), title: tr('Enviar mensagem') }, icone('enviar', 18));
      seletorAgente = h('select', { id: 'chat-agente', class: 'v36c-seletor', 'aria-label': tr('Agente que vai responder') }, h('option', { value: '' }, tr('Agente automático')));
      seletorProvedor = h('select', { id: 'chat-provedor', class: 'v36c-seletor', 'aria-label': tr('Quem processa a resposta'), hidden: true }, h('option', { value: 'local' }, tr('Local')));
      const form = h('form', { id: 'chat-form', class: 'v36c-compor' }, h('span', { class: 'v36c-faisca', 'aria-hidden': 'true' }, icone('faisca', 16)), entrada, enviar);
      chips = h('div', { class: 'v36c-chips', role: 'group', 'aria-label': tr('Sugestões de mensagens') });
      const orbita = h('div', { class: 'v36c-orbita', role: 'img', 'aria-label': tr('Prumo Orchestrator, esfera original com três órbitas') }, qc.campo(212, estadoOrb(estado.worker), ''));
      PrumoOrbitas.anexar(orbita);
      el = h('section', { class: 'v36c', id: 'v36-conversa', 'aria-label': tr('Conversa com o Prumo Orchestrator') },
        h('h1', { class: 'v36-sr' }, 'Prumo QA'),
        h('div', { class: 'v36c-topo' }, orbita), msgs,
        h('div', { class: 'v36c-interacao' }, h('div', { class: 'v36c-sugestoes' }, h('span', { class: 'v36c-faisca', 'aria-hidden': 'true' }, icone('faisca', 15)), h('span', {}, tr('O que vamos explorar?'))), chips),
        h('div', { class: 'v36c-compor-caixa' }, h('div', { class: 'v36c-opcoes' }, seletorAgente, seletorProvedor), form, h('div', { class: 'v36c-rodape' }, rodapeTexto = h('span', {}, tr('Respostas com os dados deste computador, sem modelo de IA.')), h('span', {}, 'Enter ↵ · Shift+Enter'))));
      form.addEventListener('submit', (e) => { e.preventDefault(); perguntar(entrada.value); });
      entrada.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
      entrada.addEventListener('input', ajustarAltura);
      reiniciar(); carregarRoster(); return el;
    }
