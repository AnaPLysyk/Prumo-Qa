/** Permite exportar dados gerados pela interface. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  async function download(name, value, type = 'application/json') {
    const kind = type.startsWith('text/csv') ? 'metricas-csv' : name.includes('metricas') ? 'metricas-json' : 'agente';
    const r = await chamar(() => api.exportarTela(kind, value));
    if (r?.exported) avisar('Arquivo exportado.');
  }

  // ---------------- Ícones do protótipo aprovado ----------------
