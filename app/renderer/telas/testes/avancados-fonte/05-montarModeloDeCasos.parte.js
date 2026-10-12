/** Combina dados do repositório e do Qase sem inventar vínculos. Parte de testes-v40.js; nao carregar isoladamente. */
  function modelo(e, { cat, casos, runs, vq }) {
    const codigo = []; for (const f of cat?.catalogo?.features || []) for (const t of f.testes) codigo.push({ ...t, arquivo: f.arquivo, feature: f.nome });
    const usados = new Set(); const linhas = [];
    for (const c of casos?.itens || []) {
      const declarados = relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)).filter((x) => x.tipo === 'automacao').map((x) => x.id);
      const impl = codigo.filter((t) => casaQase(vq, t.qase || [], c.id) || declarados.includes(t.arquivo + ':' + t.linha)); impl.forEach((t) => usados.add(t));
      const autos = relacoesDe(e, ['qase'], c.id).map((x) => outroLado(x, ['qase'], c.id)).filter((x) => x.tipo === 'automacao');
      const res = resultadosLocais(runs, c.id).sort((a, b) => Date.parse(b.em) - Date.parse(a.em))[0];
      const tags = [...new Set([...(c.tags || []).map((x) => String(x.title || x).toLowerCase()), ...impl.flatMap((t) => t.tags)])];
      linhas.push({ chave: 'qase:' + c.id, titulo: c.title || '—', caso: c, impl, autos, res, tags, niveis: [...new Set(impl.map((t) => t.tipo))], execucao: tipoCaso(c), feature: impl[0]?.feature || null });
    }
    for (const t of codigo) if (!usados.has(t)) linhas.push({ chave: 'codigo:' + t.arquivo + ':' + t.linha, titulo: t.titulo, caso: null, impl: [t], autos: [], res: null, tags: t.tags, niveis: [t.tipo], execucao: 'codigo', feature: t.feature, qaseSemCaso: (t.qase || []).length ? t.qase : null });
    return { linhas, codigo, ligados: linhas.filter((l) => l.caso && l.impl.length).length };
  }
