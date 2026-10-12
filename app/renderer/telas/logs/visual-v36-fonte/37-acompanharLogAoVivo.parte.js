/** Atualiza o terminal de logs sem substituir edicoes. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function acompanhar() { clearInterval(estado.timer); status.classList.toggle('vivo', seguir.checked); status.lastChild.textContent = seguir.checked ? tr('AO VIVO · REGISTROS LOCAIS') : tr('REGISTROS LOCAIS'); if (seguir.checked) estado.timer = setInterval(carregar, 2000); }
    [busca].forEach((c) => c.addEventListener('input', desenhar)); [fFerramenta, fNivel, fCliente].forEach((c) => c.addEventListener('change', desenhar));
    limpar.addEventListener('click', () => { busca.value = ''; fFerramenta.value = ''; fNivel.value = ''; fCliente.value = ''; desenhar(); });
    seguir.addEventListener('change', () => { acompanhar(); if (seguir.checked) desenhar(); });
    await carregar(); if (!eventos.length) desenhar(); acompanhar();
  };

  // ---------------- Histórico: linha do tempo e tabela das atividades observadas ----------------
