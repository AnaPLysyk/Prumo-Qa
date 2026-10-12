/** Monta a tabela de capacidades e permissoes. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function policyTable(pol, change, caps) {
      return h('div', { class: 'v36a-matriz', id: 'ag-matriz', role: 'table', 'aria-label': tr('Permissões') },
        s.matriz.filter(c => !caps || caps.includes(c.id)).map(c => h('div', { class: 'v36a-cap', role: 'row', 'data-cap': c.id },
          h('div', { class: 'v36a-cap-info', role: 'cell' }, h('strong', {}, c.rotulo), h('small', {}, c.motivo)),
          h('div', { role: 'cell' }, selo(c.estado)),
          h('div', { role: 'cell' }, c.editavel.length ? h('select', { 'data-pol': c.id, 'aria-label': c.rotulo, onchange: ev => { pol[c.id] = ev.target.value; change(); } }, c.editavel.map(v => h('option', { value: v, selected: (pol[c.id] ?? c.editavel[0]) === v }, v))) : h('span', { class: 'v36a-pessoa' }, tr('Somente pessoa'))))));
    }
    const secao = (titulo, texto, ...campos) => h('section', { class: 'v36a-form-secao' }, h('div', { class: 'v36a-form-rotulo' }, h('h3', {}, tr(titulo)), h('p', {}, tr(texto))), h('div', { class: 'v36a-campos' }, ...campos));
