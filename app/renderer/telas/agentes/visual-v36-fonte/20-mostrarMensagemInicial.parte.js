/** Mostra a saudacao inicial do chat. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    async function saudar() {
      const v = versao; const abertura = await chamar(() => api.assistenteAbertura(idAtual())); if (v !== versao || !abertura) return;
      pendente = abertura.pendente; falar(abertura.linhas, null, abertura.proximos);
    }
