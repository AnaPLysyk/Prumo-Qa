/** Agentes: explora o cérebro visual e os relacionamentos do agente selecionado. */
    async function brain(x) {
      const caps = capsDe(x); const mudou = lerMudancas()[x.id];
      const tema = document.documentElement.dataset.tema, claroTema = tema === 'claro' || (tema !== 'escuro' && matchMedia('(prefers-color-scheme: light)').matches);
      // Tons claros no escuro e tons fortes no claro, para ponto, linha e legenda terem contraste nos dois temas.
      const C = claroTema ? { base: '#2f6fd6', cap: '#0f8a72', ctx: '#7a4fd6', inst: '#1d86b8', conv: '#c25a17', saber: '#0f8a72', skill: '#9a6a00', voc: '#b8336f' }
        : { base: '#7cb6ff', cap: '#52e0c4', ctx: '#b38cff', inst: '#7ad7ff', conv: '#ff9f6b', saber: '#52e0c4', skill: '#f2c977', voc: '#ff9fc8' };
      const corMudou = claroTema ? '#b07800' : '#ffc65a';
      const GRUPOS = { base: ['Identidade', C.base], voc: ['Vocabulário', C.voc], cap: ['Capacidade', C.cap], ctx: ['Contexto do projeto', C.ctx], inst: ['Instrução', C.inst], saber: ['Conhecimento', C.saber], skill: ['Trecho de Skill', C.skill], conv: ['Atendimento', C.conv] };
      const neuronios = x.preview
        ? [{ id: 'identidade', t: 'Identidade', r: x.nome, v: { nome: x.nome, descricao: x.descricao }, g: 'base' }, { id: 'objetivo', t: 'Objetivo', r: x.objetivo, v: x.objetivo, g: 'base' }, ...linhasInstrucao(x.instrucoes).map((l, i) => ({ id: 'inst:' + i, t: tr('Instrução {n}', { n: i + 1 }), r: l, v: l, g: 'inst' })), { id: 'estado', t: 'Estado', r: tr('Prévia local · sem execução'), v: previewNotice, g: 'base' }]
        : [{ id: 'identidade', t: 'Identidade', r: x.rotulo, v: { id: x.id, rotulo: x.rotulo }, g: 'base' }, { id: 'skill', t: 'Skill', r: x.skill, v: x.skill, g: 'base' }, { id: 'disponibilidade', t: 'Disponibilidade', r: habilitada(x.id) ? tr('Habilitada no projeto') : tr('Desabilitada no projeto'), v: { habilitada: habilitada(x.id) }, g: 'base' }, ...caps.map(c => ({ id: 'cap:' + c.id, t: c.rotulo, r: c.estado, v: c, g: 'cap' }))];
      // Contextos aprovados que a especialização pode ler (capacidade de contexto permitida no projeto).
      const ctxCap = caps.find(c => c.id === 'consultar_contexto');
      if (!x.preview && ctxCap && ctxCap.estado === 'PERMITIDO' && estado.root) {
        const r = await chamar(() => api.contextosListar(estado.root, {})); if (estado.aba !== 'agentes') return;
        for (const c of (r?.contextos || []).filter(c => c.estado === 'APROVADO').slice(0, 40)) neuronios.push({ id: 'ctx:' + c.id, t: c.titulo, r: c.tipo, v: { id: c.id, titulo: c.titulo, tipo: c.tipo, estado: c.estado }, g: 'ctx' });
      }
      if (!x.preview) {
        // Tudo o que o agente sabe: vocabulário de roteamento, termos aprendidos, conhecimentos, todos os trechos de Skill e atendimentos.
        const [roster, vocab, conhecimentos, trechos, conv] = await Promise.all([chamar(() => api.assistenteAgentes(e.id)), chamar(() => api.conhecimentoVocabulario(x.id)), chamar(() => api.conhecimentoListar(e.id, { agente: x.id })), chamar(() => api.skillsListar({ especializacao: x.id, estados: ['RASCUNHO', 'APROVADO'] })), chamar(() => api.conversasListar(e.id, x.id))]);
        if (estado.aba !== 'agentes') return;
        const palavras = roster?.agentes?.find((a) => a.id === x.id)?.palavras || [];
        if (palavras.length) neuronios.push({ id: 'palavras', t: tr('Palavras de roteamento'), r: tr('{n} palavras', { n: palavras.length }), v: palavras.join(', '), g: 'voc' });
        if (vocab?.length) neuronios.push({ id: 'aprendidos', t: tr('Termos aprendidos'), r: tr('{n} termos', { n: vocab.length }), v: vocab, g: 'voc' });
        for (const c of conhecimentos || []) neuronios.push({ id: c.id, t: c.titulo, r: c.estado + ' · ' + c.origem, v: c, g: 'saber' });
        for (const t of (trechos || []).slice(0, 40)) neuronios.push({ id: t.id, t: t.titulo, r: (t.origem === 'PRUMO' ? 'Prumo' : t.origem) + ' · ' + t.estado, v: t, g: 'skill' });
        // Atendimentos recentes têm metadados; conversas antigas podem conter texto.
        for (const c of (conv || []).slice(0, 12)) neuronios.push({ id: 'conv:' + c.id, t: c.semTexto ? 'Atendimento · ' + (c.avaliacao || 'Sem avaliação') : '“' + c.pergunta.slice(0, 38) + (c.pergunta.length > 38 ? '…”' : '”'), r: (c.modo === 'LOCAL' ? tr('local') : c.modo) + ' · ' + hora(c.em), v: { pergunta: c.pergunta, resposta: c.linhas, fontes: c.fontes.map((f) => f.rotulo), modo: c.modo, estilo: c.estilo, em: c.em }, g: 'conv' });
      }
      const inspect = h('section', { class: 'v36-brain-inspect', 'aria-live': 'polite' });
      const campo = h('div', { class: 'v36a-campo-neural' }); const anel = h('div', { class: 'v36a-anel' });
      const face = h('div', { class: 'v36-brain-face' }); const stage = h('div', { class: 'v36-stage v36-brain v36a-cerebro' });
      // Os grupos ficam juntos no anel (setores), na ordem da legenda, para a ramificação ser legível.
      const ordem = Object.keys(GRUPOS); neuronios.sort((a, b) => ordem.indexOf(a.g) - ordem.indexOf(b.g));
      const n = neuronios.length, anel2 = n > 16;
      neuronios.forEach((nr, i) => {
        const externo = !anel2 || i % 2 === 0, k = anel2 ? Math.floor(i / 2) : i, total = anel2 ? Math.ceil(n / 2) : n;
        const a = -Math.PI / 2 + (k + (externo ? 0 : .5)) / Math.max(1, total) * Math.PI * 2, rx = externo ? 48 : 36, ry = externo ? 47 : 36;
        const lado = Math.cos(a) < 0 ? 'esq' : 'dir', cor = GRUPOS[nr.g][1], alterado = mudou?.chaves?.includes(nr.t);
        const b = h('button', { type: 'button', class: 'v36-neuron ' + lado + (alterado ? ' mudou' : ''), 'data-neuron': nr.t, 'data-id': nr.id, 'data-cor': alterado ? corMudou : cor, 'aria-pressed': 'false', 'aria-label': nr.t + ': ' + String(nr.r || '') },
          h('span', { class: 'v36-neuron-ponto', 'aria-hidden': 'true' }), h('span', { class: 'v36-neuron-rotulo' }, h('strong', {}, nr.t), h('small', { 'data-i18n-ignore': '' }, String(nr.r || '—'))));
        b.style.left = (50 + Math.cos(a) * rx) + '%'; b.style.top = (50 + Math.sin(a) * ry) + '%'; b.style.setProperty('--cor', alterado ? corMudou : cor); b.style.setProperty('--atraso', (-i * .37) + 's');
        b.addEventListener('click', () => { anel.querySelectorAll('.v36-neuron').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
          inspect.replaceChildren(h('div', { class: 'v36a-insp-grupo' }, bolinha(cor), tr(GRUPOS[nr.g][0]), alterado ? h('span', { class: 'v36a-insp-mudou' }, tr('Alterado em {quando}', { quando: hora(mudou.em) })) : null), h('h3', {}, nr.t), h('pre', {}, typeof nr.v === 'string' ? nr.v : JSON.stringify(nr.v, null, 2)));
          if (nr.g === 'saber') for (const [estado, rotulo] of [['APROVADO', 'Aprovar'], ['DESCARTADO', 'Descartar']]) if (nr.v.estado !== estado) inspect.append(h('button', { type: 'button', class: 'v36c-fonte', onclick: async () => { const resultado = await chamar(() => api.conhecimentoDecidir(nr.v.id, estado)); if (resultado) void brain(x); } }, rotulo));
          if (nr.g === 'skill') for (const [estado, rotulo] of [['APROVADO', 'Aprovar'], ['DESCARTADO', 'Descartar']]) if (nr.v.estado !== estado) inspect.append(h('button', { type: 'button', class: 'v36c-fonte', onclick: async () => { const resultado = await chamar(() => api.skillsDecidir(nr.v.id, estado)); if (resultado) void brain(x); } }, rotulo));
        });
        anel.append(b);
      });
      campo.append(face, anel);
      const legenda = h('div', { class: 'v36a-legenda-neural' }, ...Object.entries(GRUPOS).filter(([g]) => neuronios.some(nr => nr.g === g)).map(([, [t, cor]]) => h('span', {}, bolinha(cor), tr(t))), mudou ? h('span', {}, bolinha(corMudou), tr('Alterado no último salvamento')) : null);
      // Simulador: mostra o caminho que o chat faria com a pergunta e acende os neurônios que ela usaria. Só leitura.
      const pergunta = h('input', { id: 'v36-brain-pergunta', type: 'text', maxlength: 500, autocomplete: 'off', placeholder: tr('Ex.: oi, quais testes de API falharam?') });
      const rastro = h('div', { class: 'v36a-sim-resultado', id: 'v36-brain-rastro', 'aria-live': 'polite' });
      function limpar() { campo.classList.remove('v36a-simulando'); anel.querySelectorAll('.v36-neuron').forEach((o) => o.classList.remove('aceso')); rastro.replaceChildren(); }
      async function simular(ev) {
        ev.preventDefault(); const q = pergunta.value.trim(); if (!q) { limpar(); return; }
        const r = await chamar(() => api.agentesRastrear(e.id, q, x.preview ? null : x.id)); if (!r || !stage.isConnected) return;
        const minha = r.rota.find((z) => z.agente === x.id), participa = !!r.foco && (r.foco.responderia || !!r.orquestracao?.includes(x.id));
        const acesos = new Set([...(r.foco?.skill.usados || []), ...(r.foco?.conhecimentos || []).map((c) => c.id), ...(participa ? ['identidade'] : []), ...(minha?.casou.length ? ['palavras'] : []), ...(minha?.aprendidos ? ['aprendidos'] : [])]);
        campo.classList.add('v36a-simulando'); anel.querySelectorAll('.v36-neuron').forEach((o) => o.classList.toggle('aceso', acesos.has(o.dataset.id)));
        const nomeAg = (id) => r.rota.find((z) => z.agente === id)?.nome || id;
        rastro.replaceChildren(
          h('p', { class: 'v36a-sim-quem' }, r.orquestracao ? tr('Orquestraria: ') : tr('Responderia: '), h('strong', { 'data-i18n-ignore': '' }, r.orquestracao ? r.orquestracao.map(nomeAg).join(' → ') : r.escolhido.nome),
            r.foco ? h('span', { class: participa ? 'ok' : '' }, participa ? tr(' · este agente participa') : tr(' · outro agente atende')) : null),
          r.rota.length ? h('ol', { class: 'v36a-sim-rota' }, r.rota.slice(0, 5).map((z) => h('li', { 'data-agente': z.agente, class: z.agente === x.id ? 'este' : '' }, h('span', { 'data-i18n-ignore': '' }, z.nome), h('b', {}, tr('{n} pts', { n: z.pontos })),
            h('small', { 'data-i18n-ignore': '' }, [...z.casou.map((c) => c.termo), ...(z.mencao ? [tr('menção')] : []), ...(z.aprendidos ? [tr('aprendido +{n}', { n: z.aprendidos })] : [])].join(', ')))))
            : note(tr('Nenhuma palavra conhecida: o Prumo Orchestrator atende por padrão.')),
          r.foco ? h('p', { class: 'v36a-sim-uso' }, tr('Se este agente responder: {s} trechos de Skill ({o} ficam de fora) e {c} conhecimentos aprovados. Os usados acendem no anel.', { s: r.foco.skill.usados.length, o: r.foco.skill.omitidos, c: r.foco.conhecimentos.length })) : null,
          acesos.size ? h('ul', { class: 'v36a-sim-acesos', 'aria-label': tr('Neurônios acesos') }, [...anel.querySelectorAll('.v36-neuron.aceso')].map((o) => h('li', {}, h('button', { type: 'button', onclick: () => o.click() }, bolinha(o.dataset.cor), h('span', { 'data-i18n-ignore': '' }, o.dataset.neuron))))) : null,
          h('p', { class: 'v36a-sim-termos' }, tr('Termos considerados: {t}', { t: r.termos.join(', ') || '—' })));
      }
      const simulador = h('form', { class: 'v36a-simulador', id: 'v36-brain-simulador', onsubmit: simular },
        h('label', { for: 'v36-brain-pergunta' }, tr('Testar uma pergunta'), DS.info('Mostra o caminho que o chat faria agora com esta pergunta. Não chama IA e não grava nada.')),
        h('div', { class: 'v36a-sim-linha' }, pergunta, h('button', { type: 'submit', class: 'v36a-primario' }, tr('Simular')), h('button', { type: 'button', class: 'v36a-quieto', onclick: () => { pergunta.value = ''; limpar(); pergunta.focus(); } }, tr('Limpar'))),
        rastro);
      stage.append(h('div', { class: 'v36a-cerebro-topo' }, h('button', { type: 'button', class: 'v36a-voltar', onclick: () => detail(x) }, '← ', tr('Configuração')), h('strong', { 'data-i18n-ignore': '' }, x.nome), DS.info('Cada ponto é um conhecimento configurado deste agente. Selecione um para consultar. Isso não representa memória aprendida automaticamente.'), h('span', {}, tr('{n} conhecimentos', { n: neuronios.length }))),
        h('div', { class: 'v36a-cerebro-corpo' }, campo, h('aside', { class: 'v36a-cerebro-lado', 'aria-label': tr('Testar e consultar o cérebro') }, simulador, inspect, legenda)));
      stage.style.setProperty('--face-color', palette[x.index % 8]); neural(stage, { pontos: 110 });
      body.replaceChildren(stage); figuraRobo(face, x, 'cerebro', campo);
    }
    // Painel de atividades (v41): canvas com janelas de terminal ligadas pelos registros locais, atualizado ao vivo.
    // Orquestrações do chat: quem participou, em que ordem, quanto cada etapa levou, o que consultou e o que falhou (registro local, sem pergunta nem resposta).
