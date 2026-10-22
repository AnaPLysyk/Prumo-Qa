'use strict';
/** Caixa de confirmação que o processo principal desenha sobre a janela. A página do app não alcança este documento:
 *  o pedido chega pela URL e a resposta volta pelo fragmento (#resposta=…), lido só pelo processo principal. */
(() => {
  const pedido = (() => { try { return JSON.parse(new URLSearchParams(location.search).get('pedido') || '{}'); } catch { return {}; } })();
  const raiz = document.documentElement;
  raiz.dataset.tema = ['claro', 'escuro'].includes(pedido.tema) ? pedido.tema : 'sistema';
  raiz.lang = pedido.idioma === 'en' ? 'en' : 'pt-BR';
  try { const acento = localStorage.getItem('acento'); if (acento) raiz.dataset.acento = acento; } catch { /* sem armazenamento */ }
  if (pedido.solta) document.body.classList.add('cc-solta');

  const svg = (...formas) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('viewBox', '0 0 24 24');
    for (const d of formas) { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); el.append(p); }
    return el;
  };
  const icones = {
    info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 11v5', 'M12 7.6v.1'],
    question: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6', 'M12 17v.1'],
    warning: ['M10.3 4.3 2.6 17.6A2 2 0 0 0 4.3 20.6h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z', 'M12 9.5v4', 'M12 17v.1'],
    error: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'm9 9 6 6', 'm15 9-6 6'],
    perigo: ['M4 7h16', 'M9.5 7V4.8h5V7', 'M6.5 7l.8 12.2a1.6 1.6 0 0 0 1.6 1.5h6.2a1.6 1.6 0 0 0 1.6-1.5L17.5 7', 'M10 11v5.5', 'M14 11v5.5'],
    navegador: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3.5 9h17', 'M3.5 15h17', 'M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3z']
  };
  const elemento = (tag, classe, texto) => { const el = document.createElement(tag); if (classe) el.className = classe; if (texto !== undefined) el.textContent = texto; return el; };

  const botoes = Array.isArray(pedido.botoes) && pedido.botoes.length ? pedido.botoes.map(String) : ['OK'];
  const cancelar = Number.isInteger(pedido.cancelar) && botoes[pedido.cancelar] !== undefined ? pedido.cancelar : 0;
  const padrao = Number.isInteger(pedido.padrao) && botoes[pedido.padrao] !== undefined ? pedido.padrao : cancelar;
  const acoes = botoes.map((_, i) => i).filter(i => i !== cancelar || botoes.length === 1);
  const principal = acoes.includes(padrao) ? padrao : acoes[acoes.length - 1];
  const destrutiva = /^(excluir|apagar|remover|descartar|substituir|sobrescrever|delete|remove|discard|replace|overwrite)/i.test(botoes[principal] || '');
  const linhas = String(pedido.detalhe || '').split(/\r?\n/);
  const endereco = /^https?:\/\/\S+$/;
  const tipo = destrutiva ? 'perigo' : linhas.some(l => endereco.test(l.trim())) && pedido.tipo !== 'warning' ? 'navegador' : Object.hasOwn(icones, pedido.tipo) ? pedido.tipo : 'info';

  const cartao = document.querySelector('.cc-cartao');
  cartao.dataset.tipo = tipo;
  document.querySelector('.cc-icone').append(svg(...icones[tipo]));
  const titulo = String(pedido.titulo || '').trim();
  const tituloEl = document.querySelector('#cc-titulo');
  if (titulo && titulo !== 'Prumo QA') tituloEl.textContent = titulo; else tituloEl.remove();
  document.querySelector('#cc-mensagem').textContent = String(pedido.mensagem || '');

  // Detalhe: parágrafos; "Rótulo: valor" (rótulo de até 3 palavras, valor na mesma linha ou na seguinte) vira uma tabela curta
  // e endereços ganham destaque próprio.
  const detalhe = document.querySelector('#cc-detalhe');
  const rotulo = (texto) => texto.length >= 2 && texto.length <= 28 && texto.split(/\s+/).length <= 3;
  let dados = null;
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    let par = !endereco.test(linha) && /^([^:]+):\s+(\S.*)$/.exec(linha);
    if (par && !rotulo(par[1])) par = null;
    const sozinho = /^([^:]+):$/.exec(linha);
    if (!par && sozinho && rotulo(sozinho[1]) && linhas[i + 1]?.trim()) par = [linha, sozinho[1], linhas[++i].trim()];
    if (par) {
      if (!dados) { dados = elemento('dl', 'cc-dados'); detalhe.append(dados); }
      const valor = elemento('dd', /[\\/]|https?:|\s-{1,2}\w/.test(par[2]) ? 'cc-codigo' : '', par[2]);
      dados.append(elemento('dt', '', par[1]), valor);
      continue;
    }
    dados = null;
    if (!linha) continue;
    if (endereco.test(linha)) {
      const chip = elemento('div', 'cc-endereco');
      chip.append(svg(...icones.navegador));
      let host = linha, resto = '';
      try { const u = new URL(linha); host = u.host; resto = (u.pathname === '/' ? '' : u.pathname) + u.search + u.hash; } catch { /* mostra como veio */ }
      const texto = elemento('span', 'cc-endereco-texto');
      texto.append(elemento('strong', '', host), resto);
      texto.title = linha;
      chip.append(texto);
      detalhe.append(chip);
    } else detalhe.append(elemento('p', '', linha));
  }
  if (!detalhe.childElementCount) detalhe.remove();

  const marcar = document.querySelector('.cc-marcar');
  const caixa = marcar.querySelector('input');
  if (pedido.caixa) { marcar.hidden = false; marcar.querySelector('span').textContent = String(pedido.caixa); caixa.checked = !!pedido.marcado; }

  // Uma resposta só. A página do app pode imitar este visual para induzir um clique: por isso a caixa só aceita resposta
  // depois de estar na tela por um instante (mais longo se a ação apaga algo) e, com mouse, depois de ele se mexer sobre ela.
  let liberadaEm = Infinity, mouseMexeu = false, respondida = false;
  requestAnimationFrame(() => requestAnimationFrame(() => { liberadaEm = performance.now() + (destrutiva ? 700 : 400); }));
  cartao.addEventListener('pointermove', e => { if (e.movementX || e.movementY) mouseMexeu = true; });
  const responder = (i) => {
    if (respondida || performance.now() < liberadaEm) return;
    respondida = true;
    cartao.classList.add('cc-saindo');
    location.hash = 'resposta=' + i + '&marcado=' + (caixa.checked ? 1 : 0);
  };
  const area = document.querySelector('.cc-botoes');
  botoes.forEach((rotulo, i) => {
    const classe = i === principal ? (destrutiva ? 'acao perigo-cheio' : 'acao primaria') : 'acao secundaria';
    const b = elemento('button', classe, rotulo);
    b.type = 'button';
    // Teclado (detail 0), toque e caneta respondem direto; o clique de mouse parado é ignorado.
    b.addEventListener('click', e => { if (e.detail && e.pointerType === 'mouse' && !mouseMexeu) return; responder(i); });
    area.append(b);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); responder(cancelar); } });
  cartao.hidden = false;
  area.children[padrao]?.focus();
})();
