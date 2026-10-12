/** Mostra a lista de agentes disponiveis. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function list() {
      const search = h('input', { type: 'search', 'aria-label': tr('Buscar agente'), placeholder: tr('Localizar agente'), oninput: render, autocomplete: 'off' });
      const lista = h('div', { class: 'v36a-constelacao', id: 'v36-agent-list', role: 'list' }); const conta = h('span', { class: 'v36a-conta' });
      const novo = h('button', { type: 'button', class: 'v36a-primario', id: 'v36-agent-new', onclick: () => detail({ version: 1, id: 'previa-' + crypto.randomUUID(), nome: '', descricao: '', objetivo: '', instrucoes: '', preview: true, index: drafts.length + 8 }, true) }, '+ ', tr('Nova prévia'));
      const orbe = h('span', { class: 'v36a-orbe' }, h('img', { src: asset('robo-original.png'), alt: '' })); PrumoOrbitas.anexar(orbe);
      const orq = h('button', { type: 'button', class: 'v36a-astro v36a-astro-orq', role: 'listitem', 'aria-label': tr('Conversar com o Prumo Orchestrator'), onclick: () => flutuante?.abrir() },
        h('span', { class: 'v36a-astro-figura' }, orbe),
        h('span', { class: 'v36a-astro-nome' }, 'Prumo Orchestrator'), h('span', { class: 'v36a-astro-sub' }, tr('Assistente local no Prumo')),
        h('span', { class: 'v36a-astro-estado' }, h('i', { class: 'ok' }), h('span', {}, tr('Sem modelo de IA'))));
      const clientesEl = []; let clientes = [];
      if (estado.root) chamar(() => api.conexoes(estado.root)).then((r) => { if (!r || !lista.isConnected) return; clientes = r; render(); });
      function astroCliente(c) {
        const nome = c.client === 'claude' ? 'Claude Code' : c.client === 'codex' ? 'Codex' : c.client;
        const usado = c.lastObserved ? tr('Última chamada: {quando}', { quando: hora(c.lastObserved.at) }) : tr('Nenhuma chamada observada');
        return h('button', { type: 'button', class: 'v36a-astro v36a-astro-cliente', role: 'listitem', 'data-cliente': c.client, 'aria-label': tr('Cliente MCP {nome}', { nome }), onclick: () => { const d = document.getElementById('v36-clients'); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } },
          h('span', { class: 'v36a-astro-figura' }, iconeCliente(c.client)), h('span', { class: 'v36a-astro-nome' }, nome), h('span', { class: 'v36a-astro-sub' }, tr('Cliente conectado por MCP')),
          h('span', { class: 'v36a-astro-estado' }, h('i', { class: c.state === 'UTILIZADO' || c.state === 'VALIDADO' ? 'ok' : c.state === 'ERRO' ? 'erro' : 'off' }), h('span', {}, selo(c.state))), h('span', { class: 'v36a-astro-sub' }, usado));
      }
      function render() {
        const q = search.value.trim().toLowerCase();
        const items = [...s.especializacoes.map((x, i) => ({ ...x, nome: x.rotulo, index: i })), ...drafts.map((x, i) => ({ ...x, index: i + 8, preview: true }))].filter(x => (x.nome + ' ' + (x.skill || '')).toLowerCase().includes(q));
        conta.textContent = String(items.length);
        lista.replaceChildren(...(!q || 'prumo orchestrator'.includes(q) ? [orq] : []), ...clientes.filter(c => !q || c.client.includes(q)).map(astroCliente), ...items.map((x, k) => {
          const ligado = x.preview ? null : habilitada(x.id); const caps = x.preview ? [] : capsDe(x);
          const astro = h('button', { type: 'button', class: 'v36a-astro', role: 'listitem', 'data-agent': x.id, title: tr('Configurar agente'), onclick: () => detail(x) });
          astro.style.setProperty('--face-color', palette[x.index % 8]); astro.style.setProperty('--atraso', (-k * 1.3) + 's');
          astro.append(figuraRobo(h('span', { class: 'v36a-astro-figura' }), x, 'lista', astro),
            h('span', { class: 'v36a-astro-nome', 'data-i18n-ignore': '' }, x.nome), h('span', { class: 'v36a-astro-sub' }, x.preview ? tr('Prévia local · sem execução') : x.skill),
            h('span', { class: 'v36a-astro-estado' }, h('i', { class: x.preview ? '' : ligado ? 'ok' : 'off' }), h('span', {}, x.preview ? tr('Somente neste computador') : ligado ? tr('Habilitada no projeto') : tr('Desabilitada no projeto')),
              x.preview ? null : h('span', { class: 'v36a-astro-caps' }, ' · ', tr('{n} capacidades', { n: caps.length }))));
          return astro; }));
        if (!lista.children.length) lista.append(h('div', { class: 'v36a-vazio' }, tr('Nenhum agente para esta busca.')));
      }
      const clientContent = h('div', { id: 'v36-client-panel' }); let loaded = false;
      const clients = h('details', { class: 'v36a-secao-extra', id: 'v36-clients', ontoggle: async ev => { if (!ev.currentTarget.open || loaded) return; loaded = true; await agentesLegado(clientContent); clientContent.querySelector('h1')?.remove(); } }, h('summary', {}, tr('Clientes MCP · diagnóstico e configuração')), clientContent);
      body.replaceChildren(
        h('div', { class: 'v36a-topo' }, h('div', {}, h('h2', { class: 'v36a-titulo' }, tr('Agentes'), ' ', conta), h('p', {}, tr('Especializações do núcleo e prévias locais deste projeto.'))),
          h('div', { class: 'v36a-acoes' }, h('label', { class: 'v36a-busca' }, iconeBusca(), search), novo)),
        lista, h('p', { class: 'v36a-nota' }, tr('Especializações reais do núcleo. Habilitação não comprova sessão nem execução ativa. Retratos com movimento visual, sem articulação facial 3D.')),
        legacyPolicies(), clients);
      render();
    }
    // Matriz completa do projeto (mesmos seletores da tela 2.9), com confirmação nativa para salvar.
