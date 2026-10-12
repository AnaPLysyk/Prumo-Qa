/** Monta a visualizacao em tabela do historico. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function tabela(itens) {
      const val = COLUNAS.find((c) => c[0] === coluna)[2]; const ord = [...itens].sort((x, y) => { const p = val(x), q = val(y); const c = typeof p === 'number' ? p - q : String(p).localeCompare(String(q)); return ordem === 'desc' ? -c : c; });
      return h('div', { class: 'v36h-tabela-caixa' }, h('table', { class: 'v36h-tabela', id: 'v36-history-table' },
        h('thead', {}, h('tr', {}, COLUNAS.map(([id, t]) => h('th', { 'aria-sort': coluna === id ? (ordem === 'desc' ? 'descending' : 'ascending') : 'none' }, h('button', { type: 'button', class: 'v36h-ord' + (coluna === id ? ' ativo' : ''), onclick: () => { if (coluna === id) ordem = ordem === 'desc' ? 'asc' : 'desc'; else { coluna = id; ordem = 'desc'; } ordemSel.value = ordem; desenhar(); } }, h('span', {}, tr(t)), h('span', { class: 'v36h-seta-ord', 'aria-hidden': 'true' }, coluna === id ? (ordem === 'desc' ? '↓' : '↑') : '↕')))))),
        h('tbody', {}, ord.map((a) => h('tr', { 'data-operation': a.operationId, tabindex: '0', onclick: () => detalhesAtividade(a), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); detalhesAtividade(a); } } },
          h('td', {}, new Date(a.at).toLocaleDateString(local(), { day: '2-digit', month: '2-digit' }), h('small', {}, hm(a.at))), h('td', { class: 'v36h-ttitulo' }, tituloDe(a), h('small', {}, a.tool)), h('td', {}, a.tool),
          h('td', {}, h('span', { class: 'v36-pilula ' + classeEstado(a.state) }, a.state)), h('td', {}, a.origin), h('td', {}, a.client), h('td', { 'data-i18n-ignore': '' }, ms(a.durationMs)), h('td', {}, h('code', {}, a.operationId.slice(0, 8))))))));
    }
