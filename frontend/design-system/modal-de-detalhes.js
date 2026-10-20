'use strict';
// Refinamento visual v39: conserva os nós, listeners e canais IPC existentes.
(() => {
  const dialog = h('dialog', { id: 'qualidade-dialog', class: 'qualidade-dialog', 'aria-labelledby': 'qualidade-dialog-titulo' });
  const titulo = h('h2', { id: 'qualidade-dialog-titulo' });
  const subtitulo = h('div', { class: 'qualidade-dialog-sub', id: 'qualidade-dialog-sub' });
  const corpo = h('div', { class: 'qualidade-dialog-corpo' });
  const fechar = h('button', { type: 'button', class: 'qualidade-dialog-fechar', 'aria-label': 'Fechar detalhes' }, '×');
  dialog.append(h('div', { class: 'qualidade-dialog-cabecalho' }, h('div', {}, titulo, subtitulo), fechar), corpo);
  document.body.append(dialog);
  let devolver = null;
  let origem = null;
  let ultimoAcionador = null;
  document.addEventListener('click', (e) => {
    const botao = e.target.closest('#conteudo button, #conteudo summary');
    if (botao) ultimoAcionador = botao;
  }, true);
  let evidenciaAtual = 0;
  const apresentados = new WeakSet();
  function limpar() {
    evidenciaAtual++;
    if (devolver) { const fn = devolver; devolver = null; fn(); }
    corpo.replaceChildren(); subtitulo.replaceChildren(); delete dialog.dataset.tamanho;
  }
  function encerrar() { if (dialog.open) { limpar(); dialog.close(); } }
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    limpar();
    // close chega numa tarefa posterior: a pessoa pode já ter escolhido outro controle.
    const foco = document.activeElement;
    if (origem?.isConnected && (!foco || foco === document.body || dialog.contains(foco))) origem.focus();
    origem = null;
  });
  fechar.addEventListener('click', encerrar);
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) encerrar();
  });
  // opcoes (v40): { tamanho: 'sm' | 'md' | 'lg', subtitulo: nós exibidos sob o título }.
  function abrir(nome, no, restaurar, opcoes = {}) {
    const foco = document.activeElement;
    limpar();
    origem = ultimoAcionador?.isConnected && !dialog.contains(ultimoAcionador) ? ultimoAcionador : foco !== document.body && foco?.isConnected ? foco : origem;
    titulo.textContent = tr(nome);
    if (opcoes.tamanho) dialog.dataset.tamanho = opcoes.tamanho;
    if (opcoes.subtitulo) subtitulo.append(...[].concat(opcoes.subtitulo).filter(Boolean));
    corpo.append(no); corpo.scrollTop = 0;
    devolver = restaurar || null;
    if (!dialog.open) dialog.showModal();
    fechar.focus();
  }
  function mover(slot, nome) {
    if (!slot?.isConnected || dialog.contains(slot) || !slot.childNodes.length) return;
    const conteudo = slot.firstElementChild;
    if (!conteudo || apresentados.has(conteudo)) return;
    apresentados.add(conteudo);
    const marcador = document.createComment('posição original do painel');
    slot.before(marcador);
    abrir(nome, slot, () => { if (marcador.isConnected) marcador.replaceWith(slot); });
  }
  // Formulários assíncronos permanecem com seus seletores e callbacks originais.
  const observar = new MutationObserver(() => {
    document.querySelector('#conteudo').dataset.qualidadeTela = estado.aba;
    const ticket = document.querySelector('#conteudo #tk-detalhe');
    if (ticket?.querySelector('#tk-painel')) mover(ticket, 'Detalhes do ticket');
    for (const [id, nome] of [['rotina-slot', 'Configurar rotina'], ['pr-slot', 'Proposta de caso']]) {
      const slot = document.querySelector('#conteudo #' + id);
      if (slot?.children.length) mover(slot, nome);
    }
    // Cancelar/salvar esvazia o slot pelo callback do formulário.
    if (dialog.open && !corpo.textContent.trim() && !corpo.querySelector('input, select, textarea')) encerrar();
  });
  observar.observe(document.querySelector('#conteudo'), { childList: true, subtree: true });
  observar.observe(corpo, { childList: true, subtree: true });
  // Detalhes das rotinas mantêm as ações originais.
  document.addEventListener('click', (e) => {
    const summary = e.target.closest('summary');
    const details = summary?.parentElement;
    if (!details || dialog.contains(details)) return;
    const rotina = details.closest('[data-rotina]');
    if (!rotina) return;
    e.preventDefault();
    const nodes = [...details.childNodes].filter(n => n !== summary);
    const container = h('div', { class: 'qualidade-detalhe' }, nodes);
    abrir(summary.textContent, container, () => details.append(...nodes));
  });
  // Evidência contextual: o listener existente define raiz/job antes de chamar mostrar.
  const mostrarBase = mostrar;
  mostrar = async function (aba) {
    if (aba === 'evidencias') {
      const painel = h('div', { class: 'qualidade-evidencia' }, h('p', { role: 'status' }, tr('Consultando evidência…')));
      abrir('Evidências da execução', painel);
      const turno = ++evidenciaAtual;
      try { const resultado = h('div', {}); await abas.evidencias(resultado); if (turno === evidenciaAtual) painel.replaceChildren(resultado); }
      catch { if (turno === evidenciaAtual) painel.append(h('p', { role: 'alert' }, tr('Não foi possível consultar a evidência.'))); }
      return;
    }
    encerrar();
    return mostrarBase(aba);
  };
  const menuEvidencia = document.querySelector('#nav [data-aba="evidencias"]');
  if (menuEvidencia) menuEvidencia.hidden = true;
  window.PrumoQualidadeV39 = Object.freeze({ abrirModal: abrir, fecharModal: encerrar });
})();
