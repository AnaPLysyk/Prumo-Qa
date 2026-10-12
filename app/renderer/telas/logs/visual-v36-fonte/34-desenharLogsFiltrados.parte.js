/** Desenha os logs conforme os filtros atuais. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function desenhar() {
      const q = busca.value.trim().toLowerCase();
      const linhas = eventos.filter((e) => (!fFerramenta.value || e.tool === fFerramenta.value) && (!fNivel.value || nivelDe(e.state) === fNivel.value) && (!fCliente.value || e.client === fCliente.value)
        && (!q || [e.operationId, e.tool, e.state, e.origin, e.client, e.phase, e.summary?.code].join(' ').toLowerCase().includes(q)));
      const diag = corpo.querySelector('.v36l-diagnostico'); corpo.replaceChildren(boot(), aviso, ...linhas.map(linha));
      if (!linhas.length) corpo.append(h('div', { class: 'v36l-vazio' }, eventos.length ? tr('Nenhum registro para estes filtros.') : tr('Nenhum registro ainda. As chamadas MCP e CLI deste projeto aparecem aqui.')));
      if (diag) corpo.append(diag);
      const ops = new Set(linhas.map((e) => e.operationId)).size;
      contador.textContent = tr('{n} registros · {m} operações', { n: linhas.length, m: ops });
      if (seguir.checked && !aberto) corpo.scrollTop = corpo.scrollHeight;
    }
