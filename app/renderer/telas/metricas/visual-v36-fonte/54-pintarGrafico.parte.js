/** Apresenta os dados no tipo de grafico selecionado. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function pintar(area, v, lista) {
      const d = DEFS[v.id], x = dados(v.id, lista);
      if (v.id === 'trend') { if (v.tipo === 'bars' || v.tipo === 'area' || v.tipo === 'line') graficos.linhaTempo(area, x.cats, x.series, v.tipo); return; }
      if (v.tipo === 'donut') graficos.rosca(area, x); else if (v.tipo === 'strip') graficos.faixas(area, x); else graficos.barras(area, x, d.sufixo || '');
    }
    function mover(id, delta) { const i = vista.findIndex((v) => v.id === id); const ativos = vista.filter((v) => v.on); const pos = ativos.findIndex((v) => v.id === id); const alvo = ativos[pos + delta]; if (!alvo) return; const j = vista.indexOf(alvo); [vista[i], vista[j]] = [vista[j], vista[i]]; salvar(); desenhar(); }
    let arrastado = null;
