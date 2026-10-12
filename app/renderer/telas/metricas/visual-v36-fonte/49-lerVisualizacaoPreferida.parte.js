/** Consulta as preferencias locais de visualizacao. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  function lerVista() {
    try { const p = JSON.parse(localStorage.getItem('prumo-v36-metricas') || 'null'); if (p && Array.isArray(p.vista)) { const ok = p.vista.filter((v) => DEFS[v.id] && DEFS[v.id].tipos.includes(v.tipo)); const faltam = Object.keys(DEFS).filter((id) => !ok.some((v) => v.id === id)).map((id) => ({ id, tipo: DEFS[id].tipo, on: false })); return { vista: [...ok, ...faltam], dias: [7, 30, 90].includes(p.dias) ? p.dias : 7 }; } } catch { /* sem preferência salva */ }
    return { vista: Object.keys(DEFS).map((id) => ({ id, tipo: DEFS[id].tipo, on: ['trend', 'result', 'routines'].includes(id) })), dias: 7 };
  }
  const gravarVista = (p) => { try { localStorage.setItem('prumo-v36-metricas', JSON.stringify(p)); } catch { /* armazenamento indisponível */ } };
