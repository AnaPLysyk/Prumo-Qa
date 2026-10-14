/** Reúne trecho visual da função agentes para o bundle interfaces-v36. */
  const DICAS = {
    metricas: ['Quer explorar um gráfico ou comparar períodos?', 'Posso te ajudar a interpretar estas métricas.'],
    logs: ['Precisa investigar uma falha nos logs?', 'Posso te ajudar a localizar a etapa com problema.'],
    testes: ['Quer entender os testes deste projeto?', 'Posso te orientar pelos cenários.'],
    agentes: ['Quer conhecer os agentes disponíveis?', 'Posso te explicar como configurá-los.'],
    conexoes: ['Quer revisar suas integrações?', 'Posso te orientar nas configurações de conexão.'],
    projetos: ['Quer explorar um projeto?', 'Posso te ajudar a navegar pelos projetos.'],
    tickets: ['Quer procurar um ticket?', 'Posso te mostrar por onde começar.']
  };
  let flutuante = null;
  function montarFlutuante() {
    const raiz = h('aside', { class: 'v36f', id: 'v36-float', 'aria-label': tr('Atalho do Prumo Orchestrator') });
    const dock = h('div', { class: 'v36f-dock', id: 'v36-float-dock' });
    const encaixe = h('button', { type: 'button', id: 'v36-chat-dock', class: 'v36f-ctl' });
    const fecharBtn = h('button', { type: 'button', id: 'v36-chat-close', class: 'v36f-ctl v36f-fechar', 'aria-label': tr('Fechar chat'), title: tr('Fechar chat') }, icone('fechar', 18));
    const alcaLateral = h('div', { class: 'v36f-grip', id: 'v36-side-grip', role: 'separator', tabindex: '0', 'aria-orientation': 'vertical', 'aria-label': tr('Ajustar largura do chat lateral'), title: tr('Arraste para ajustar a largura; use as setas do teclado') }, alca());
    const painel = h('section', { id: 'v36-float-panel', class: 'v36f-painel', hidden: true, role: 'dialog', 'aria-label': tr('Prumo Orchestrator, conversa compacta') }, h('div', { class: 'v36f-barra' }, encaixe, fecharBtn), dock, alcaLateral);
    const orbita = h('span', { class: 'v36f-orbita' }, h('span', { class: 'v36f-robo' }, h('img', { src: asset('robo-original.png'), alt: '', draggable: 'false' })), h('span', { class: 'v36f-alvo', 'aria-hidden': 'true' }));
    const botao = h('button', { type: 'button', id: 'v36-chat-open', class: 'v36f-botao', 'aria-label': tr('Abrir Prumo Orchestrator'), title: 'Prumo Orchestrator', 'aria-expanded': 'false', 'aria-controls': 'v36-float-panel' }, orbita);
    const dica = h('button', { type: 'button', class: 'v36f-dica', 'data-visible': 'false', 'aria-label': tr('Abrir sugestão do Prumo Orchestrator') });
    raiz.append(painel, botao, dica); document.body.append(raiz); PrumoOrbitas.anexar(orbita);
    const encaixado = () => document.body.classList.contains('v36-encaixado');
    function rotularEncaixe() {
      const lado = encaixado(); encaixe.replaceChildren(icone(lado ? 'soltar' : 'encaixar', 18));
      const dicaTxt = lado ? tr('Voltar para chat flutuante') : tr('Encaixar chat na lateral');
      encaixe.setAttribute('aria-label', dicaTxt); encaixe.title = dicaTxt; encaixe.setAttribute('aria-pressed', String(lado)); raiz.classList.toggle('lateral', lado);
    }
    function soltar() { document.body.classList.remove('v36-encaixado'); rotularEncaixe(); }
    let fechando = 0;
    function abrir() {
      if (estado.aba === 'inicio') return; clearTimeout(fechando); esconderDica();
      dock.append(conversa.montar()); conversa.sincronizar(); conversa.estadoOrbita();
      painel.classList.remove('fechando'); painel.hidden = false; raiz.classList.add('aberto'); document.body.classList.add('v36-painel-aberto'); botao.setAttribute('aria-expanded', 'true'); conversa.focar();
    }
    function fechar(imediato = false) {
      if (painel.hidden) { soltar(); return; }
      const devolverFoco = painel.contains(document.activeElement);
      const concluir = () => { painel.hidden = true; painel.classList.remove('fechando'); raiz.classList.remove('aberto'); document.body.classList.remove('v36-painel-aberto'); botao.setAttribute('aria-expanded', 'false'); soltar(); if (devolverFoco && estado.aba !== 'inicio') botao.focus(); };
      clearTimeout(fechando); if (imediato || reduzido()) concluir(); else { painel.classList.add('fechando'); fechando = setTimeout(concluir, 180); }
    }
    botao.addEventListener('click', () => (painel.hidden ? abrir() : fechar()));
    fecharBtn.addEventListener('click', () => fechar());
    encaixe.addEventListener('click', () => { if (painel.hidden) return; document.body.classList.toggle('v36-encaixado'); rotularEncaixe(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !painel.hidden && !document.querySelector('dialog[open]')) { e.preventDefault(); fechar(); } });
    // Largura da lateral: arrastar ou setas do teclado; limites relativos à janela.
    const limites = () => ({ min: Math.min(300, Math.round(innerWidth * .4)), max: Math.min(600, Math.round(innerWidth * .62)) });
    const larguraAtual = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--v36-lateral')) || 440;
    function ajustar(px) { const { min, max } = limites(); const w = Math.max(min, Math.min(max, Math.round(px))); document.documentElement.style.setProperty('--v36-lateral', w + 'px'); alcaLateral.setAttribute('aria-valuemin', min); alcaLateral.setAttribute('aria-valuemax', max); alcaLateral.setAttribute('aria-valuenow', w); }
    let arrastando = false;
    alcaLateral.addEventListener('pointerdown', (e) => { if (!encaixado() || innerWidth <= 840) return; arrastando = true; alcaLateral.classList.add('arrastando'); alcaLateral.setPointerCapture(e.pointerId); e.preventDefault(); });
    alcaLateral.addEventListener('pointermove', (e) => { if (arrastando) ajustar(innerWidth - e.clientX); });
    const fimArraste = () => { arrastando = false; alcaLateral.classList.remove('arrastando'); };
    alcaLateral.addEventListener('pointerup', fimArraste); alcaLateral.addEventListener('pointercancel', fimArraste); alcaLateral.addEventListener('lostpointercapture', fimArraste);
    alcaLateral.addEventListener('keydown', (e) => { if (encaixado() && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); ajustar(larguraAtual() + (e.key === 'ArrowLeft' ? 20 : -20)); } });
    // Balão contextual: convida a conversar, sem afirmar leitura de dados.
    let n = 0, tMostrar = 0, tEsconder = 0;
    function esconderDica() { dica.dataset.visible = 'false'; clearTimeout(tEsconder); }
    function mostrarDica() {
      const aba = estado.aba; if (aba === 'inicio' || !painel.hidden || document.hidden) return;
      const op = DICAS[aba] || ['Quer ajuda para explorar esta tela?', 'Posso te orientar nesta tela.'];
      dica.textContent = tr(op[n++ % op.length]);
      // 2.10.2: o balão só aparece onde não cobre nenhum controle da tela (ele já ocupa o lugar mesmo invisível).
      if (cobreControle()) return;
      dica.dataset.visible = 'true'; clearTimeout(tEsconder); tEsconder = setTimeout(esconderDica, 6400);
    }
    function cobreControle() {
      const d = dica.getBoundingClientRect(), m = 8;
      return [...document.querySelectorAll('#conteudo button, #conteudo a, #conteudo input, #conteudo select, #conteudo textarea, #conteudo summary, #conteudo [role=tab]')].some((el) => {
        const q = el.getBoundingClientRect(); if (!q.width || !q.height) return false;
        return q.left < d.right + m && q.right > d.left - m && q.top < d.bottom + m && q.bottom > d.top - m - 7;
      });
    }
    // Se a tela rolar com o balão aberto, um controle pode passar por baixo dele: esconde.
    document.addEventListener('scroll', () => { if (dica.dataset.visible === 'true') esconderDica(); }, { capture: true, passive: true });
    dica.addEventListener('click', () => { const texto = dica.textContent; esconderDica(); abrir(); conversa.contexto(estado.aba, texto); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) esconderDica(); });
    setInterval(() => { if (dica.dataset.visible !== 'true') mostrarDica(); }, 15500);
    function trocouTela(aba) {
      esconderDica(); clearTimeout(tMostrar);
      if (aba === 'inicio') { fechar(true); return; }
      if (!painel.hidden && !encaixado()) fechar(true);
      tMostrar = setTimeout(mostrarDica, 1050);
    }
    rotularEncaixe();
    return { abrir, fechar, trocouTela };
  }

  // ---------------- Início ----------------
