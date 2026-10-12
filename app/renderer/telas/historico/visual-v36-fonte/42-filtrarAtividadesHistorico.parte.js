/** Seleciona atividades pelos filtros informados. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function filtradas() {
      const q = busca.value.trim().toLowerCase(); const limite = dias ? Date.now() - dias * 86400000 : 0;
      const ativos = [busca.value, de.value, ate.value, fFerr.value, fEst.value, fOri.value, fCli.value].filter(Boolean).length;
      contagemFiltros.textContent = ativos ? String(ativos) : ''; resumoFiltros.textContent = tr('Os filtros se combinam e afetam a linha do tempo e a tabela.');
      return r.activities.filter((a) => { const t = Date.parse(a.at); return t >= limite && (!de.value || t >= Date.parse(de.value + 'T00:00:00')) && (!ate.value || t <= Date.parse(ate.value + 'T23:59:59.999'))
        && (!fFerr.value || a.tool === fFerr.value) && (!fEst.value || a.state === fEst.value) && (!fOri.value || a.origin === fOri.value) && (!fCli.value || a.client === fCli.value)
        && (!q || [a.operationId, a.tool, a.state, a.client, a.origin, a.summary?.code, tituloDe(a)].join(' ').toLowerCase().includes(q)); });
    }
