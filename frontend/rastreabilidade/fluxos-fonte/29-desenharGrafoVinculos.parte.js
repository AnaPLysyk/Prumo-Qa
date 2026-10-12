/** Desenha o grafo de referencias. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  function grafo(m) {
    const nos = new Map(m.nos.map((n) => [n.id, n])); const viz = new Map();
    for (const a of m.arestas) for (const [x, y] of [[a.de, a.para], [a.para, a.de]]) { if (!viz.has(x)) viz.set(x, []); viz.get(x).push({ id: y, aresta: a }); }
    const vizinhos = (id, tipos) => (viz.get(id) || []).filter((v) => tipos.includes(nos.get(v.id)?.tipo));
    return { nos, vizinhos };
  }
