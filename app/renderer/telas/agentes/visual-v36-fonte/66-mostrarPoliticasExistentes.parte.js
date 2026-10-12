/** Exibe as politicas atuais de agentes. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function legacyPolicies() {
      const esp = new Set(s.configuracao.especializacoes), pol = { ...s.configuracao.politicas };
      const save = h('button', { type: 'button', class: 'v36a-primario', id: 'ag-salvar', disabled: true, onclick: async () => { save.disabled = true; const r = await chamar(() => api.agentesSalvar(e.id, [...esp], pol)); if (r && !r.canceled) { avisar('Permissões salvas.'); mostrar('agentes'); } else dirty(); } }, tr('Salvar permissões…'));
      function dirty() { save.disabled = JSON.stringify([...esp].sort()) === JSON.stringify([...s.configuracao.especializacoes].sort()) && JSON.stringify(pol) === JSON.stringify(s.configuracao.politicas); }
      return h('details', { class: 'v36a-secao-extra', open: true }, h('summary', {}, tr('Políticas do projeto · confirmação nativa para salvar')),
        h('div', { id: 'ag-especializacoes', class: 'v36a-esps' }, s.especializacoes.map(x => h('label', { class: 'v36a-check' }, h('input', { type: 'checkbox', 'data-esp': x.id, checked: esp.has(x.id), onchange: ev => { ev.target.checked ? esp.add(x.id) : esp.delete(x.id); dirty(); } }), h('span', {}, x.rotulo)))),
        policyTable(pol, dirty), h('div', { class: 'v36a-salvar' }, save));
    }
