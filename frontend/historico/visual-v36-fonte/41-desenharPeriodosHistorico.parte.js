/** Mostra os periodos disponiveis para filtragem. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function desenharPeriodo() { periodo.replaceChildren(...opcoesPeriodo.map(([d, t]) => h('button', { type: 'button', 'aria-pressed': String(dias === d), onclick: () => { dias = d; desenhar(); } }, tr(t)))); }
    function desenharAbas() { abas2.replaceChildren(...[['linha', 'Linha do tempo'], ['tabela', 'Tabela']].map(([v, t]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(vista === v), onclick: () => { vista = v; desenhar(); } }, tr(t)))); }
    const tituloDe = (a) => tr(ROTULO_FERRAMENTA[a.tool] || a.tool);
