/** Exibe o efeito visual de digitacao. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function digitar(t, v, rotulo) {
      if (v !== versao) return Promise.resolve();
      const { m, texto } = bolha('prumo', rotulo); if (reduzido()) { texto.textContent = t; rolar(); return Promise.resolve(); }
      return new Promise((ok) => { m.classList.add('digitando'); let n = 0; const id = setInterval(() => { if (m.parentNode !== msgs) { clearInterval(id); ok(); return; } n += 2; texto.textContent = t.slice(0, n); rolar(); if (n >= t.length) { clearInterval(id); m.classList.remove('digitando'); ok(); } }, 18); });
    }
