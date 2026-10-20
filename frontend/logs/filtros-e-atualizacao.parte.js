/** Logs: aplica filtros, l? registros e controla o acompanhamento. */
    function desenhar() {
      const q = busca.value.trim().toLowerCase();
      const linhas = eventos.filter((e) => (!fFerramenta.value || e.tool === fFerramenta.value) && (!fNivel.value || nivelDe(e.state) === fNivel.value) && (!fCliente.value || e.client === fCliente.value)
        && (!q || [e.operationId, e.tool, e.state, e.origin, e.client, e.phase, e.summary?.code].join(' ').toLowerCase().includes(q)));
      const diag = corpo.querySelector('.v36l-diagnostico'); corpo.replaceChildren(boot(linhas.length > 0), aviso, ...linhas.map(linha));
      if (!linhas.length) corpo.append(h('div', { class: 'v36l-vazio' }, eventos.length ? tr('Nenhum registro para estes filtros.') : tr('Nenhum registro ainda. As chamadas MCP e CLI deste projeto aparecem aqui.')));
      if (diag) corpo.append(diag);
      const ops = new Set(linhas.map((e) => e.operationId)).size;
      contador.textContent = tr('{n} registros · {m} operações', { n: linhas.length, m: ops });
      if (seguir.checked && !aberto) corpo.scrollTop = corpo.scrollHeight;
    }
    function preencher(sel, valores) { const atual = sel.value; const primeiro = sel.options[0]; sel.replaceChildren(primeiro, ...valores.map((v) => h('option', { value: v }, v))); sel.value = valores.includes(atual) ? atual : ''; }
    async function carregar() {
      const r = await chamar(() => api.logs(root, { limit: 1000 })); if (!r || estado.root !== root || estado.aba !== 'logs' || !janela.isConnected && eventos.length) return;
      const novos = [...r.events].sort((a, b) => a.at.localeCompare(b.at) || (a.phase === 'start' ? -1 : 1));
      const ass = novos.length + '|' + (novos.at(-1) ? chave(novos.at(-1)) + novos.at(-1).at : '') + '|' + r.complete;
      if (ass === assinatura) return; assinatura = ass; eventos = novos; aviso.hidden = r.complete;
      preencher(fFerramenta, [...new Set(eventos.map((e) => e.tool))].sort((a, b) => String(a).localeCompare(String(b)))); preencher(fCliente, [...new Set(eventos.map((e) => e.client))].sort((a, b) => String(a).localeCompare(String(b)))); desenhar();
    }
    function acompanhar() { clearInterval(estado.timer); status.classList.toggle('vivo', seguir.checked); status.lastChild.textContent = seguir.checked ? tr('AO VIVO · REGISTROS LOCAIS') : tr('REGISTROS LOCAIS'); if (seguir.checked) estado.timer = setInterval(carregar, 2000); }
    [busca].forEach((c) => c.addEventListener('input', desenhar)); [fFerramenta, fNivel, fCliente].forEach((c) => c.addEventListener('change', desenhar));
    limpar.addEventListener('click', () => { busca.value = ''; fFerramenta.value = ''; fNivel.value = ''; fCliente.value = ''; desenhar(); });
    seguir.addEventListener('change', () => { acompanhar(); if (seguir.checked) desenhar(); });
    await carregar(); if (!eventos.length) desenhar(); acompanhar();
  };
