/** Agrega os dados reais para um grafico. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function dados(id, lista) {
      if (id === 'trend') {
        const diasLista = []; if (intervalo) { for (let d = new Date(intervalo[0] + 'T12:00:00'); diaIso(d) <= intervalo[1] && diasLista.length < 366; d.setDate(d.getDate() + 1)) diasLista.push(diaIso(d)); }
        else for (let i = dias - 1; i >= 0; i--) diasLista.push(diaIso(Date.now() - i * 86400000));
        const cats = diasLista.map((d) => new Date(d + 'T12:00:00').toLocaleDateString(local(), { day: '2-digit', month: '2-digit' }));
        const porDia = (f) => diasLista.map((d) => lista.filter((r) => diaIso(r.at) === d && f(r)).length);
        return { cats, series: [{ nome: tr('Execuções'), valores: porDia((r) => r.status !== 'INFO') }, { nome: tr('Consultas'), valores: porDia((r) => r.status === 'INFO'), tracejado: true, cor: '#a78bfa' }] };
      }
      if (id === 'result') return RESULTADOS.map((s) => ({ rot: s, n: lista.filter((r) => r.status === s).length, cor: COR_RESULTADO[s] })).filter((i) => i.n);
      if (id === 'routines') return contar(lista, (r) => r.tipo).sort((a, b) => b.n - a.n);
      if (id === 'reviews') return [['Achados', m.findings], ['Lacunas', m.gaps], ['Recomendações', m.recommendations], ['Redundâncias', m.candidateRedundancies]].map(([t, n], i) => ({ rot: tr(t), n: n || 0, cor: PALETA[i] })).filter((i) => i.n);
      if (id === 'sources') return contar(lista, (r) => tr(FONTES[r.fonte]));
      if (id === 'environment') return contar(lista.filter((r) => r.ambiente && r.status !== 'INFO'), (r) => tr(AMBIENTES[r.ambiente] || r.ambiente));
      if (id === 'time') { const mp = new Map(); for (const r of lista) if (r.status !== 'INFO' && typeof r.duracao === 'number') { const o = mp.get(r.tipo) || { s: 0, n: 0 }; o.s += r.duracao; o.n++; mp.set(r.tipo, o); } return [...mp].map(([rot, o], i) => ({ rot, n: Math.round(o.s / o.n), cor: PALETA[i % PALETA.length] })).sort((a, b) => b.n - a.n); }
      if (id === 'jira') return [['Consultas', lista.filter((r) => r.fonte === 'jira').length], ['Comentários publicados', lista.filter((r) => r.jira === 'PUBLICADO').length], ['Comentários pendentes', lista.filter((r) => ['PENDENTE', 'FALHA', 'PREPARADO'].includes(r.jira)).length]].map(([t, n], i) => ({ rot: tr(t), n, cor: PALETA[i] })).filter((i) => i.n);
      return [];
    }
    const observadores = [];
