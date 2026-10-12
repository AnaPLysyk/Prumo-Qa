/** Carrega catálogo local, Qase e runs do projeto. Parte de testes-v40.js; nao carregar isoladamente. */
  async function fontes(e, { forcar = false } = {}) {
    const mem = memoria('testes', e.id); if (forcar) { delete mem.catalogo; delete mem.casos; delete mem.runsLocais; }
    const vq = vinc(e, 'qase');
    const [cat, casos, runs] = await Promise.all([
      mem.catalogo || api.testesCatalogo(e.id).then((r) => (r.ok ? r.data : { erro: r.error })),
      vq ? (mem.casos || F.carregarQase(e, mem, 'casos')) : null,
      mem.runsLocais || api.runs(e.id).then((r) => (r.ok ? r.data : []))
    ]);
    mem.catalogo = cat; if (vq) mem.casos = casos; mem.runsLocais = runs;
    return { cat, casos, runs, vq };
  }
