/** Atualiza as opcoes dos filtros de log. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function preencher(sel, valores) { const atual = sel.value; const primeiro = sel.options[0]; sel.replaceChildren(primeiro, ...valores.map((v) => h('option', { value: v }, v))); sel.value = valores.includes(atual) ? atual : ''; }
