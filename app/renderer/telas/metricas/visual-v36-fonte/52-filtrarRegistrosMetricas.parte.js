/** Seleciona registros conforme os filtros combinados. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function filtrados() {
      const q = busca.value.trim().toLowerCase(), tk = fTicket.value.trim().toLowerCase();
      const ativos = [busca.value, fFonte.value, fRes.value, fTipo.value, fAmb.value, fOri.value, fTicket.value].filter(Boolean).length; contagemFiltros.textContent = ativos ? String(ativos) : '';
      const lista = registros.filter((r) => noPeriodo(r.at) && (!fFonte.value || r.fonte === fFonte.value) && (!fRes.value || r.status === fRes.value) && (!fTipo.value || r.tipo === fTipo.value) && (!fAmb.value || r.ambiente === fAmb.value) && (!fOri.value || r.origem === fOri.value)
        && (!tk || (r.ticket || '').toLowerCase().includes(tk)) && (!q || [r.id, r.tipo, r.status, r.ticket, r.fonte].join(' ').toLowerCase().includes(q)));
      resumo.textContent = tr('{n} registros nos filtros atuais', { n: lista.length }); return lista;
    }
    const contar = (lista, f) => { const mp = new Map(); for (const r of lista) { const k = f(r); if (k != null) mp.set(k, (mp.get(k) || 0) + 1); } return [...mp].map(([rot, n], i) => ({ rot: String(rot), n, cor: corDe(String(rot), i) })); };
