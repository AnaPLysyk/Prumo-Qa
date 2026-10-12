/** Monta a visualizacao do cerebro e conhecimento. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    async function brain(x) {
      const caps = capsDe(x); const mudou = lerMudancas()[x.id];
      const GRUPOS = { base: ['Identidade', '#7cb6ff'], cap: ['Capacidade', '#52e0c4'], ctx: ['Contexto do projeto', '#b38cff'], inst: ['Instrução', '#7ad7ff'], conv: ['Atendimento', '#ff9f6b'], saber: ['Conhecimento', '#52e0c4'] };
      const neuronios = x.preview
        ? [{ t: 'Identidade', r: x.nome, v: { nome: x.nome, descricao: x.descricao }, g: 'base' }, { t: 'Objetivo', r: x.objetivo, v: x.objetivo, g: 'base' }, ...linhasInstrucao(x.instrucoes).map((l, i) => ({ t: tr('Instrução {n}', { n: i + 1 }), r: l, v: l, g: 'inst' })), { t: 'Estado', r: tr('Prévia local · sem execução'), v: previewNotice, g: 'base' }]
        : [{ t: 'Identidade', r: x.rotulo, v: { id: x.id, rotulo: x.rotulo }, g: 'base' }, { t: 'Skill', r: x.skill, v: x.skill, g: 'base' }, { t: 'Disponibilidade', r: habilitada(x.id) ? tr('Habilitada no projeto') : tr('Desabilitada no projeto'), v: { habilitada: habilitada(x.id) }, g: 'base' }, ...caps.map(c => ({ t: c.rotulo, r: c.estado, v: c, g: 'cap' }))];
      // Contextos aprovados que a especialização pode ler (capacidade de contexto permitida no projeto).
      const ctxCap = caps.find(c => c.id === 'consultar_contexto');
      if (!x.preview && ctxCap && ctxCap.estado === 'PERMITIDO' && estado.root) {
        const r = await chamar(() => api.contextosListar(estado.root, {})); if (estado.aba !== 'agentes') return;
        for (const c of (r?.contextos || []).filter(c => c.estado === 'APROVADO').slice(0, 40)) neuronios.push({ t: c.titulo, r: c.tipo, v: { id: c.id, titulo: c.titulo, tipo: c.tipo, estado: c.estado }, g: 'ctx' });
      }
      if (!x.preview) {
        const conhecimentos = await chamar(() => api.conhecimentoListar(e.id, { agente: x.id })); if (estado.aba !== 'agentes') return;
        for (const c of conhecimentos || []) neuronios.push({ t: c.titulo, r: c.estado + ' · ' + c.origem, v: c, g: 'saber' });
      }
      // Atendimentos recentes têm metadados; conversas antigas podem conter texto.
      if (!x.preview) { const conv = await chamar(() => api.conversasListar(e.id, x.id)); if (estado.aba !== 'agentes') return;
        for (const c of (conv || []).slice(0, 18)) neuronios.push({ t: c.semTexto ? 'Atendimento · ' + (c.avaliacao || 'Sem avaliação') : '“' + c.pergunta.slice(0, 38) + (c.pergunta.length > 38 ? '…”' : '”'), r: (c.modo === 'LOCAL' ? tr('local') : c.modo) + ' · ' + hora(c.em), v: { pergunta: c.pergunta, resposta: c.linhas, fontes: c.fontes.map((f) => f.rotulo), modo: c.modo, estilo: c.estilo, em: c.em }, g: 'conv' }); }
      const inspect = h('section', { class: 'v36-brain-inspect', 'aria-live': 'polite' }, note(tr('Cada ponto é um conhecimento configurado deste agente. Selecione um para consultar. Isso não representa memória aprendida automaticamente.')));
      const campo = h('div', { class: 'v36a-campo-neural' });
      const face = h('div', { class: 'v36-brain-face' }); const stage = h('div', { class: 'v36-stage v36-brain v36a-cerebro' });
      const n = neuronios.length, anel2 = n > 16;
      neuronios.forEach((nr, i) => {
        const externo = !anel2 || i % 2 === 0, k = anel2 ? Math.floor(i / 2) : i, total = anel2 ? Math.ceil(n / (externo ? 2 : 2)) : n;
        const a = -Math.PI / 2 + (k + (externo ? 0 : .5)) / Math.max(1, total) * Math.PI * 2, rx = externo ? 40 : 29, ry = externo ? 41 : 30;
        const lado = Math.cos(a) < 0 ? 'esq' : 'dir', cor = GRUPOS[nr.g][1], alterado = mudou?.chaves?.includes(nr.t);
        const b = h('button', { type: 'button', class: 'v36-neuron ' + lado + (alterado ? ' mudou' : ''), 'data-neuron': nr.t, 'data-cor': alterado ? '#ffc65a' : cor, 'aria-pressed': 'false', 'aria-label': nr.t + ': ' + String(nr.r || '') },
          h('span', { class: 'v36-neuron-ponto', 'aria-hidden': 'true' }), h('span', { class: 'v36-neuron-rotulo' }, h('strong', {}, nr.t), h('small', { 'data-i18n-ignore': '' }, String(nr.r || '—'))));
        b.style.left = (50 + Math.cos(a) * rx) + '%'; b.style.top = (50 + Math.sin(a) * ry) + '%'; b.style.setProperty('--cor', alterado ? '#ffc65a' : cor); b.style.setProperty('--atraso', (-i * .37) + 's');
        b.addEventListener('click', () => { campo.querySelectorAll('.v36-neuron').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
          inspect.replaceChildren(h('div', { class: 'v36a-insp-grupo' }, bolinha(cor), tr(GRUPOS[nr.g][0]), alterado ? h('span', { class: 'v36a-insp-mudou' }, tr('Alterado em {quando}', { quando: hora(mudou.em) })) : null), h('h3', {}, nr.t), h('pre', {}, typeof nr.v === 'string' ? nr.v : JSON.stringify(nr.v, null, 2)));
          if (nr.g === 'saber') for (const [estado, rotulo] of [['APROVADO', 'Aprovar'], ['DESCARTADO', 'Descartar']]) if (nr.v.estado !== estado) inspect.append(h('button', { type: 'button', class: 'v36c-fonte', onclick: async () => { const resultado = await chamar(() => api.conhecimentoDecidir(nr.v.id, estado)); if (resultado) brain(x); } }, rotulo));
        });
        campo.append(b);
      });
      campo.prepend(face);
      const legenda = h('div', { class: 'v36a-legenda-neural' }, ...Object.entries(GRUPOS).filter(([g]) => neuronios.some(nr => nr.g === g)).map(([, [t, cor]]) => h('span', {}, bolinha(cor), tr(t))), mudou ? h('span', {}, bolinha('#ffc65a'), tr('Alterado no último salvamento')) : null);
      stage.append(h('div', { class: 'v36a-cerebro-topo' }, h('button', { type: 'button', class: 'v36a-voltar', onclick: () => detail(x) }, '← ', tr('Configuração')), h('strong', { 'data-i18n-ignore': '' }, x.nome), h('span', {}, tr('{n} conhecimentos', { n: neuronios.length }))), campo, h('div', { class: 'v36a-cerebro-rodape' }, inspect, legenda));
      stage.style.setProperty('--face-color', palette[x.index % 8]); neural(stage, { pontos: 110, escuro: true });
      body.replaceChildren(stage); figuraRobo(face, x, 'cerebro', campo);
    }
    // Painel de atividades (v41): canvas com janelas de terminal ligadas pelos registros locais, atualizado ao vivo.
