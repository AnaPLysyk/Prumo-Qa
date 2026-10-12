/** Consulta os registros locais de log. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    async function carregar() {
      const r = await chamar(() => api.logs(root, { limit: 1000 })); if (!r || estado.root !== root || estado.aba !== 'logs' || !janela.isConnected && eventos.length) return;
      const novos = [...r.events].sort((a, b) => a.at.localeCompare(b.at) || (a.phase === 'start' ? -1 : 1));
      const ass = novos.length + '|' + (novos.at(-1) ? chave(novos.at(-1)) + novos.at(-1).at : '') + '|' + r.complete;
      if (ass === assinatura) return; assinatura = ass; eventos = novos; aviso.hidden = r.complete;
      preencher(fFerramenta, [...new Set(eventos.map((e) => e.tool))].sort()); preencher(fCliente, [...new Set(eventos.map((e) => e.client))].sort()); desenhar();
    }
