/** Reúne trecho visual da função agentes para o bundle interfaces-v36. */
  const TOPICOS = {
    tests: { rot: 'Meus testes', icone: 'testes', pergunta: 'execuções e falhas recentes', aba: 'execucoes', rota: 'Execuções' },
    agents: { rot: 'Agentes', icone: 'agentes', texto: 'Os agentes são as especializações do núcleo. Em Agentes você consulta cada uma e ajusta as permissões do projeto.', aba: 'agentes', rota: 'Agentes' },
    logs: { rot: 'Investigar logs', icone: 'logs', pergunta: 'erros e falhas', aba: 'logs', rota: 'Logs' },
    metrics: { rot: 'Métricas', icone: 'metricas', situacao: true, aba: 'metricas', rota: 'Métricas' },
    history: { rot: 'Histórico', icone: 'historico', texto: 'O histórico reúne as atividades observadas pelo núcleo, em linha do tempo ou em tabela.', aba: 'historico', rota: 'Histórico' }
  };
  const INICIAIS = ['tests', 'agents', 'logs', 'metrics'];
  const PROXIMOS = { tests: ['metrics', 'logs', 'agents'], agents: ['tests', 'logs', 'metrics'], logs: ['history', 'tests', 'metrics'], history: ['logs', 'metrics', 'tests'], metrics: ['tests', 'history', 'logs'] };
  const TOPICO_DA_TELA = { logs: 'logs', historico: 'history', metricas: 'metrics', agentes: 'agents', execucoes: 'tests', testes: 'tests' };
  function topicoDe(q) {
    const x = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/log|erro|falh|failure|trace/.test(x)) return 'logs'; if (/hist|aconteceu|atividade|timeline/.test(x)) return 'history';
    if (/metric|graf|chart|dashboard/.test(x)) return 'metrics'; if (/agente|agent|orquest|mcp/.test(x)) return 'agents';
    if (/teste|test|execu|run|pass|fail|block/.test(x)) return 'tests'; return null;
  }
  const conversa = (() => {
    let el = null, msgs, entrada, enviar, chips, seletorAgente, seletorProvedor, rodapeTexto, fila = Promise.resolve(), primeira = true, projeto, versao = 0, roster = null, historico = [], pendente = null;
    const nomeIa = () => estado.prefs?.ia?.nome || 'Prumo';
    const rolar = () => { msgs.scrollTop = msgs.scrollHeight; };
    function bolha(quem, rotulo) {
      const texto = h('div', { class: 'v36c-texto' }); const meta = quem === 'prumo' && (primeira || rotulo);
      const m = h('article', { class: 'msg ' + quem + (meta ? ' primeira' : '') }, meta ? h('div', { class: 'v36c-meta' }, rotulo || nomeIa()) : null, texto);
      if (quem === 'prumo') primeira = false; msgs.append(m); return { m, texto };
    }
    function digitar(t, v, rotulo) {
      if (v !== versao) return Promise.resolve();
      const { m, texto } = bolha('prumo', rotulo); if (reduzido()) { texto.textContent = t; rolar(); return Promise.resolve(); }
      return new Promise((ok) => { m.classList.add('digitando'); let n = 0; const id = setInterval(() => { if (m.parentNode !== msgs) { clearInterval(id); ok(); return; } n += 2; texto.textContent = t.slice(0, n); rolar(); if (n >= t.length) { clearInterval(id); m.classList.remove('digitando'); ok(); } }, 18); });
    }
    function falar(linhas, fontes, proximos, rotulo) {
      const v = versao;
      fila = fila.then(async () => {
        for (const [i, l] of linhas.entries()) { await digitar(l, v, i === 0 ? rotulo : null); falarVoz(l); }
        if (v !== versao) return;
        if (fontes?.length) { msgs.append(h('div', { class: 'v36c-fontes' }, fontes.map((f) => h('button', { type: 'button', class: 'v36c-fonte', onclick: () => abrirTela(f.aba) }, f.rotulo, h('span', { 'aria-hidden': 'true' }, '↗'))))); rolar(); }
        if (proximos) sugerir(proximos);
      }).catch(() => {});
      return fila;
    }
    function ocupado() { const m = h('div', { class: 'v36c-ocupado', role: 'status', 'aria-label': tr('Prumo está escrevendo') }, h('span'), h('span'), h('span')); msgs.append(m); rolar(); return () => m.remove(); }
    function chip(id) { const T = TOPICOS[id]; return h('button', { type: 'button', class: 'v36c-chip', 'data-topico': id, onclick: () => perguntar(tr(T.rot), id) }, icone(T.icone, 16), h('span', {}, tr(T.rot)), h('span', { class: 'v36c-seta', 'aria-hidden': 'true' }, '↗')); }
    function sugerir(ids) { chips.replaceChildren(...ids.map((p) => typeof p === 'string' ? chip(p) : h('button', { type: 'button', class: 'v36c-chip', onclick: () => p.pergunta ? perguntar(p.pergunta) : p.aba && abrirTela(p.aba) }, p.rotulo))); }
    function controlesResposta(r, pergunta) {
      const caixa = h('div', { class: 'v36c-fontes' }); const v = versao;
      for (const acao of r.acoes || []) caixa.append(h('button', { type: 'button', class: 'v36c-fonte', onclick: async (ev) => {
        const botao = ev.currentTarget; botao.disabled = true;
        const resultado = await chamar(() => api.conhecimentoDecidir(acao.id, acao.tipo === 'aprovar_conhecimento' ? 'APROVADO' : 'DESCARTADO'));
        if (resultado && v === versao) { caixa.querySelectorAll('[data-conhecimento="' + acao.id + '"]').forEach(b => b.remove()); avisar(acao.tipo === 'aprovar_conhecimento' ? 'Aprendizado aprovado.' : 'Aprendizado descartado.'); }
        else botao.disabled = false;
      }, 'data-conhecimento': acao.id }, acao.rotulo));
      if (r.atendimentoId) {
        const avaliar = async (valor) => {
          const resultado = await chamar(() => api.assistenteAvaliar(r.atendimentoId, valor)); if (!resultado || v !== versao) return;
          feedback.replaceChildren(h('span', {}, 'Avaliação registrada.'));
          if (valor === 'NAO_UTIL') {
            const correto = h('select', { 'aria-label': 'Agente mais adequado' }, h('option', { value: '' }, 'Corrigir roteamento…'), ...(roster?.agentes || []).map(a => h('option', { value: a.id }, a.nome)));
            correto.addEventListener('change', async () => { if (!correto.value) return; const corrigido = await chamar(() => api.assistenteAvaliar(r.atendimentoId, 'NAO_UTIL', { agenteCorreto: correto.value, pergunta })); if (corrigido && v === versao) feedback.replaceChildren(h('span', {}, 'Agente corrigido; os termos foram aprendidos.')); });
            feedback.append(correto);
          }
        };
        const feedback = h('span', {}, h('button', { type: 'button', class: 'v36c-fonte', onclick: () => avaliar('UTIL') }, 'Útil'), h('button', { type: 'button', class: 'v36c-fonte', onclick: () => avaliar('NAO_UTIL') }, 'Não ajudou'));
        caixa.append(feedback);
      }
      if (caixa.childNodes.length) { msgs.append(caixa); rolar(); }
    }
    // Leitura em voz alta (voz do sistema, sem rede), quando a pessoa ligou em Ajustes > Assistente.
    function falarVoz(texto) { const ia = estado.prefs?.ia; if (!ia?.lerRespostas || !('speechSynthesis' in window) || reduzido()) return; try { const u = new SpeechSynthesisUtterance(texto); const v = speechSynthesis.getVoices().find((x) => x.name === ia.voz); if (v) u.voice = v; u.lang = v?.lang || (PrumoI18n.idioma === 'en' ? 'en-US' : 'pt-BR'); speechSynthesis.speak(u); } catch { /* sem voz disponível */ } }
    const TOPICO_AGENTE = { tests: 'qa-geral', agents: 'orquestrador', logs: 'investigacao-bugs', metrics: 'monitoramento', history: 'monitoramento' };
    async function carregarRoster() {
      const r = await chamar(() => api.assistenteAgentes(idAtual())); if (!r || !seletorAgente) return; roster = r;
      const atual = seletorAgente.value; seletorAgente.replaceChildren(h('option', { value: '' }, tr('Agente automático')), ...r.agentes.map((a) => h('option', { value: a.id }, a.nome))); seletorAgente.value = r.agentes.some((a) => a.id === atual) ? atual : '';
      const opcoes = [['local', tr('Local')], ...r.provedores.filter((p) => p.disponivel && p.autorizado).map((p) => [p.id, p.id === 'claude' ? 'Claude Code' : 'Codex'])];
      const atualP = seletorProvedor.value; seletorProvedor.replaceChildren(...opcoes.map(([v, t]) => h('option', { value: v }, t))); seletorProvedor.value = opcoes.some(([v]) => v === atualP) ? atualP : 'local'; seletorProvedor.hidden = opcoes.length < 2;
      rodapeTexto.textContent = opcoes.length > 1 ? tr('Agentes locais; Claude/Codex só quando você escolher.') : tr('Respostas com os dados deste computador, sem modelo de IA.');
    }
    const idAtual = () => estado.espaco?.id ?? null;
    async function saudar() {
      const v = versao; const abertura = await chamar(() => api.assistenteAbertura(idAtual())); if (v !== versao || !abertura) return;
      pendente = abertura.pendente; falar(abertura.linhas, null, abertura.proximos);
    }
    function reiniciar() { versao++; primeira = true; fila = Promise.resolve(); historico = []; pendente = null; delete el.dataset.conversou; msgs.replaceChildren(); projeto = idAtual(); sugerir(INICIAIS); saudar(); }
    function sincronizar() { if (!el) return; carregarRoster(); entrada.setAttribute('aria-label', tr('Mensagem para o Prumo')); entrada.placeholder = tr('Pergunte alguma coisa ao Prumo…'); if (projeto !== idAtual()) reiniciar(); }
    function ajustarAltura() { entrada.style.height = 'auto'; entrada.style.height = Math.min(125, entrada.scrollHeight) + 'px'; }
    async function perguntar(q, topico) {
      q = String(q || '').trim(); if (q.length < 2 || enviar.disabled) return;
      sincronizar(); const v = versao; const { texto } = bolha('voce'); texto.textContent = q; rolar(); entrada.value = ''; ajustarAltura();
      enviar.disabled = true; const id = idAtual(); const fim = ocupado();
      try {
        const t = topico || topicoDe(q); const T = TOPICOS[t];
        // A memória fica apenas nesta janela e é isolada ao trocar de projeto.
        const agenteFixo = seletorAgente.value || (topico ? TOPICO_AGENTE[topico] : null) || null;
        const pergunta = topico && T?.pergunta ? T.pergunta : q;
        const memoria = historico.length ? historico : pendente ? [{ pergunta: '', agente: 'orquestrador', pendente }] : [];
        const r = await chamar(() => api.assistenteConversar(id, pergunta, { agente: agenteFixo, provedor: seletorProvedor.value || 'local', primeira: !el.dataset.conversou, historico: memoria }));
        fim(); if (v !== versao) return;
        if (idAtual() !== id) { reiniciar(); return; }
        if (!r) return; el.dataset.conversou = '1'; pendente = r.pendente;
        historico.push({ pergunta, agente: r.agente.id, pendente: r.pendente }); historico = historico.slice(-6);
        let fontes = r.fontes || []; if (T && !fontes.some((f) => f.aba === T.aba)) fontes = [...fontes, { rotulo: tr(T.rota), aba: T.aba }];
        const meio = r.modo === 'CLAUDE' ? 'Claude Code' : r.modo === 'CODEX' ? 'Codex' : tr('local');
        if (r.aviso) avisar(r.aviso);
        await falar(r.linhas.length ? r.linhas : [tr('Não encontrei nada sobre isso nos dados locais deste projeto.')], fontes, r.proximos || [], r.agente.nome + ' · ' + meio + (r.orquestracao ? ' · ' + tr('orquestrou {n} especialistas', { n: r.orquestracao.agentes.length }) : ''));
        if (v === versao) controlesResposta(r, pergunta);
      } catch { fim(); avisar(tr('Falha ao consultar o assistente local.'), true); } finally { enviar.disabled = false; }
    }
    function montar() {
      if (el) return el;
      msgs = h('div', { class: 'v36c-msgs', id: 'chat-msgs', 'aria-live': 'polite', 'data-i18n-ignore': '' });
      entrada = h('textarea', { id: 'chat-input', rows: 1, maxlength: 300, placeholder: tr('Pergunte alguma coisa ao Prumo…'), 'aria-label': tr('Mensagem para o Prumo'), autocomplete: 'off' });
      enviar = h('button', { type: 'submit', class: 'v36c-enviar', 'aria-label': tr('Enviar mensagem'), title: tr('Enviar mensagem') }, icone('enviar', 18));
      seletorAgente = h('select', { id: 'chat-agente', class: 'v36c-seletor', 'aria-label': tr('Agente que vai responder') }, h('option', { value: '' }, tr('Agente automático')));
      seletorProvedor = h('select', { id: 'chat-provedor', class: 'v36c-seletor', 'aria-label': tr('Quem processa a resposta'), hidden: true }, h('option', { value: 'local' }, tr('Local')));
      const form = h('form', { id: 'chat-form', class: 'v36c-compor' }, h('span', { class: 'v36c-faisca', 'aria-hidden': 'true' }, icone('faisca', 16)), entrada, enviar);
      chips = h('div', { class: 'v36c-chips', role: 'group', 'aria-label': tr('Sugestões de mensagens') });
      const orbita = h('div', { class: 'v36c-orbita', role: 'img', 'aria-label': tr('Prumo Orchestrator, esfera original com três órbitas') }, qc.campo(212, estadoOrb(estado.worker), ''));
      PrumoOrbitas.anexar(orbita);
      el = h('section', { class: 'v36c', id: 'v36-conversa', 'aria-label': tr('Conversa com o Prumo Orchestrator') },
        h('h1', { class: 'v36-sr' }, 'Prumo QA'),
        h('div', { class: 'v36c-topo' }, orbita), msgs,
        h('div', { class: 'v36c-interacao' }, h('div', { class: 'v36c-sugestoes' }, h('span', { class: 'v36c-faisca', 'aria-hidden': 'true' }, icone('faisca', 15)), h('span', {}, tr('O que vamos explorar?'))), chips),
        h('div', { class: 'v36c-compor-caixa' }, h('div', { class: 'v36c-opcoes' }, seletorAgente, seletorProvedor), form, h('div', { class: 'v36c-rodape' }, rodapeTexto = h('span', {}, tr('Respostas com os dados deste computador, sem modelo de IA.')), h('span', {}, 'Enter ↵ · Shift+Enter'))));
      form.addEventListener('submit', (e) => { e.preventDefault(); perguntar(entrada.value); });
      entrada.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
      entrada.addEventListener('input', ajustarAltura);
      reiniciar(); carregarRoster(); return el;
    }
    function contexto(aba, texto) { montar(); sincronizar(); falar([texto], null, PROXIMOS[TOPICO_DA_TELA[aba]] || INICIAIS); }
    function focar() { setTimeout(() => entrada?.focus({ preventScroll: true }), 220); }
    function estadoOrbita() { el?.querySelectorAll('.qc-orb, .qc-campo').forEach((e) => { e.dataset.estado = estadoOrb(estado.worker); }); }
    return { montar, sincronizar, contexto, focar, estadoOrbita, recarregar: () => { if (el) { carregarRoster(); } } };
  })();
