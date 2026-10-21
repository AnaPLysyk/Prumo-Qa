/** Agentes: conversa do Orchestrator e sua janela flutuante. */
  const TOPICOS = {
    tests: { rot: 'Meus testes', icone: 'testes', pergunta: 'execuções e falhas recentes', aba: 'execucoes', rota: 'Execuções' },
    agents: { rot: 'Agentes', icone: 'agentes', texto: 'Os agentes são as especializações do núcleo. Em Agentes você consulta cada uma e ajusta as permissões do projeto.', aba: 'agentes', rota: 'Agentes' },
    logs: { rot: 'Investigar logs', icone: 'logs', pergunta: 'erros e falhas', aba: 'logs', rota: 'Logs' },
    metrics: { rot: 'Métricas', icone: 'metricas', situacao: true, aba: 'metricas', rota: 'Métricas' },
    history: { rot: 'Logs', icone: 'historico', texto: 'Os Logs reúnem as atividades observadas pelo núcleo, ao vivo e com filtros.', aba: 'logs', rota: 'Logs' }
  };
  const INICIAIS = ['tests', 'agents', 'logs', 'metrics'];
  const PROXIMOS = { tests: ['metrics', 'logs', 'agents'], agents: ['tests', 'logs', 'metrics'], logs: ['history', 'tests', 'metrics'], history: ['logs', 'metrics', 'tests'], metrics: ['tests', 'history', 'logs'] };
  const TOPICO_DA_TELA = { logs: 'logs', metricas: 'metrics', agentes: 'agents', testes: 'tests' };
  function topicoDe(q) {
    const x = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/log|erro|falh|failure|trace/.test(x)) return 'logs'; if (/hist|aconteceu|atividade|timeline/.test(x)) return 'history';
    if (/metric|graf|chart|dashboard/.test(x)) return 'metrics'; if (/agente|agent|orquest|mcp/.test(x)) return 'agents';
    if (/teste|test|execu|run|pass|fail|block/.test(x)) return 'tests'; return null;
  }
  // Com quem a pessoa fala: o Orchestrator local (direto), uma IA externa autorizada (consulta o Prumo pelo MCP) ou a Mesa (2 ou mais dessas IAs conversando entre si, com o Orquestrador mediando).
  const INTERLOCUTORES = { local: { nome: 'Prumo Orchestrator', marca: 'P' }, claude: { nome: 'Claude Code', marca: 'C' }, codex: { nome: 'Codex', marca: 'X' }, copilot: { nome: 'GitHub Copilot', marca: 'G' }, gemini: { nome: 'Gemini CLI', marca: '✦' }, mesa: { nome: 'Mesa de IAs', marca: '⇄' } };
  const MODO_DO_INTERLOCUTOR = { LOCAL: 'local', CLAUDE: 'claude', CODEX: 'codex', COPILOT: 'copilot', GEMINI: 'gemini', MESA: 'mesa' };
  const conversa = (() => {
    let el = null, msgs, entrada, enviar, chips, seletorAgente, interlocutores, linhaConexao, interlocutor = 'local', rodapeTexto, fila = Promise.resolve(), primeira = true, projeto, versao = 0, roster = null, historico = [], pendente = null;
    const nomeIa = () => estado.prefs?.ia?.nome || 'Prumo';
    const rolar = () => { msgs.scrollTop = msgs.scrollHeight; };
    function bolha(quem, rotulo, ia = 'local') {
      const texto = h('div', { class: 'v36c-texto' }); const meta = quem === 'prumo' && (primeira || rotulo);
      const m = h('article', { class: 'msg ' + quem + (meta ? ' primeira' : ''), 'data-ia': ia }, meta ? h('div', { class: 'v36c-meta' }, ia !== 'local' ? h('span', { class: 'v36c-marca', 'data-ia': ia, 'aria-hidden': 'true' }, INTERLOCUTORES[ia].marca) : null, rotulo || nomeIa()) : null, texto);
      if (quem === 'prumo') primeira = false; msgs.append(m); return { m, texto };
    }
    function digitar(t, v, rotulo, ia) {
      if (v !== versao) return Promise.resolve();
      const { m, texto } = bolha('prumo', rotulo, ia); if (reduzido()) { texto.textContent = t; rolar(); return Promise.resolve(); }
      return new Promise((ok) => { m.classList.add('digitando'); let n = 0; const id = setInterval(() => { if (m.parentNode !== msgs) { clearInterval(id); ok(); return; } n += 2; texto.textContent = t.slice(0, n); rolar(); if (n >= t.length) { clearInterval(id); m.classList.remove('digitando'); ok(); } }, 18); });
    }
    function falar(linhas, fontes, proximos, rotulo, ia = 'local') {
      const v = versao;
      fila = fila.then(async () => {
        for (const [i, l] of linhas.entries()) { await digitar(l, v, i === 0 ? rotulo : null, ia); falarVoz(l); }
        if (v !== versao) return;
        if (fontes?.length) { msgs.append(h('div', { class: 'v36c-fontes' }, fontes.map((f) => h('button', { type: 'button', class: 'v36c-fonte', onclick: () => abrirTela(f.aba) }, f.rotulo, h('span', { 'aria-hidden': 'true' }, '↗'))))); rolar(); }
        if (proximos) sugerir(proximos);
      }).catch(() => {});
      return fila;
    }
    function ocupado() { const nomeOcupado = interlocutor === 'local' ? nomeIa() : INTERLOCUTORES[interlocutor].nome; const m = h('div', { class: 'v36c-ocupado', role: 'status', 'data-ia': interlocutor, 'aria-label': tr('{nome} está escrevendo', { nome: nomeOcupado }) }, interlocutor === 'local' ? null : h('small', {}, interlocutor === 'mesa' ? tr('As IAs estão conversando entre si; isso leva alguns minutos…') : tr('{nome} está consultando o Prumo…', { nome: nomeOcupado })), h('span'), h('span'), h('span')); msgs.append(m); rolar(); return () => m.remove(); }
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
      const externos = r.provedores.filter((p) => p.disponivel && p.autorizado);
      if (interlocutor === 'mesa' ? externos.length < 2 : interlocutor !== 'local' && !externos.some((p) => p.id === interlocutor)) interlocutor = 'local';
      interlocutores.replaceChildren(...[{ id: 'local' }, ...externos, ...(externos.length >= 2 ? [{ id: 'mesa' }] : [])].map((p) => h('button', { type: 'button', class: 'v36c-interlocutor', role: 'radio', 'data-ia': p.id, 'aria-checked': String(p.id === interlocutor), title: INTERLOCUTORES[p.id].nome, onclick: () => escolherInterlocutor(p.id) }, h('span', { class: 'v36c-marca', 'data-ia': p.id, 'aria-hidden': 'true' }, INTERLOCUTORES[p.id].marca), h('span', {}, p.id === 'local' ? tr('Orchestrator') : p.id === 'mesa' ? tr('Mesa') : INTERLOCUTORES[p.id].nome))));
      interlocutores.hidden = !externos.length; mostrarConexao();
    }
    function mostrarConexao() {
      const p = roster?.provedores.find((x) => x.id === interlocutor); const ia = INTERLOCUTORES[interlocutor]; const temExterna = !!roster?.provedores.some((x) => x.disponivel && x.autorizado);
      linhaConexao.dataset.ia = interlocutor; linhaConexao.hidden = !temExterna;
      const n = (roster?.provedores || []).filter((x) => x.disponivel && x.autorizado).length;
      const mcpEstado = p?.mcpEstado || roster?.provedores[0]?.mcpEstado || 'SEM_PROJETO';
      const statusMcp = mcpEstado === 'SESSAO_AUTORIZADA' ? tr('sessão MCP autorizada · consultas disponíveis') : mcpEstado === 'SEM_SESSAO' ? tr('MCP pendente · entre no Prumo para autorizar a sessão') : tr('sem pasta de projeto vinculada · chat sem MCP');
      if (interlocutor === 'mesa') linhaConexao.replaceChildren(h('i', { 'aria-hidden': 'true' }), h('span', {}, tr('Mesa · {n} IAs · {status}', { n, status: statusMcp })));
      else linhaConexao.replaceChildren(h('i', { 'aria-hidden': 'true' }), h('span', {}, interlocutor === 'local' ? tr('{nome} · direto, com os dados deste computador', { nome: ia.nome }) : ia.nome + ' · ' + statusMcp));
      entrada.placeholder = interlocutor === 'local' ? tr('Pergunte alguma coisa ao Prumo…') : interlocutor === 'mesa' ? tr('Pergunte à Mesa de IAs…') : tr('Falar com {nome}…', { nome: ia.nome });
      rodapeTexto.textContent = interlocutor === 'mesa' ? tr('Cada IA da mesa responde pela própria conta e comenta as respostas das outras; o Orquestrador só resume e o Prumo só libera consultas.') : interlocutor !== 'local' ? tr('{nome} responde pela conta e pelas regras dele; o Prumo só libera consultas.', { nome: ia.nome }) : temExterna ? tr('Orchestrator direto; IA externa só quando você escolher.') : tr('Respostas com os dados deste computador, sem modelo de IA.');
    }
    function escolherInterlocutor(id) {
      if (id === interlocutor) return; interlocutor = id;
      interlocutores.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.ia === id)));
      mostrarConexao(); const nome = INTERLOCUTORES[id].nome;
      msgs.append(h('div', { class: 'v36c-troca', 'data-ia': id, role: 'status' }, h('span', { class: 'v36c-marca', 'data-ia': id, 'aria-hidden': 'true' }, INTERLOCUTORES[id].marca), id === 'local' ? tr('Você voltou a falar com o {nome}.', { nome }) : id === 'mesa' ? tr('Agora você está na Mesa: {n} IAs respondem, comentam as respostas umas das outras e o Orquestrador resume.', { n: roster.provedores.filter((x) => x.disponivel && x.autorizado).length }) : tr('Agora você está falando com {nome}.', { nome }))); rolar(); entrada.focus({ preventScroll: true });
    }
    const idAtual = () => estado.espaco?.id ?? null;
    async function saudar() {
      const v = versao; const abertura = await chamar(() => api.assistenteAbertura(idAtual())); if (v !== versao || !abertura) return;
      pendente = abertura.pendente; void falar(abertura.linhas, null, abertura.proximos);
    }
    function reiniciar() { versao++; primeira = true; fila = Promise.resolve(); historico = []; pendente = null; delete el.dataset.conversou; msgs.replaceChildren(); projeto = idAtual(); void sugerir(INICIAIS); void saudar(); }
    function sincronizar() { if (!el) return; void carregarRoster(); entrada.setAttribute('aria-label', tr('Mensagem para o Prumo')); mostrarConexao(); if (projeto !== idAtual()) void reiniciar(); }
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
        const r = await chamar(() => api.assistenteConversar(id, pergunta, { agente: agenteFixo, provedor: interlocutor, primeira: !el.dataset.conversou, historico: memoria }));
        fim(); if (v !== versao) return;
        if (idAtual() !== id) { reiniciar(); return; }
        if (!r) return; el.dataset.conversou = '1'; pendente = r.pendente;
        historico.push({ pergunta, agente: r.agente.id, pendente: r.pendente }); historico = historico.slice(-6);
        let fontes = r.fontes || []; if (T && !fontes.some((f) => f.aba === T.aba)) fontes = [...fontes, { rotulo: tr(T.rota), aba: T.aba }];
        const ia = MODO_DO_INTERLOCUTOR[r.modo] || 'local';
        if (r.aviso) avisar(r.aviso);
        // IA externa assina a resposta e o agente do Prumo vira contexto; local: o Orchestrator responde direto.
        const origem = roster?.provedores.some((x) => x.projetoComMcp) ? tr('MCP do Prumo disponível') : tr('via CLI, sem MCP');
        const rotulo = ia === 'local' ? r.agente.nome + ' · ' + tr('local') : INTERLOCUTORES[ia].nome + ' · ' + origem + ' · ' + r.agente.nome;
        if (r.mesa) {
          // Mesa: cada IA aparece com a própria marca e cor; o resumo do Orquestrador vem depois, com a marca da mesa.
          for (const x of r.mesa.ias) await falar(x.linhas, null, null, x.nome + ' · ' + origem, x.provedor);
          await falar(r.mesa.resumo, fontes, r.proximos || [], tr('Orquestrador') + ' · ' + tr('resumo da mesa'), 'mesa');
        } else await falar(r.linhas.length ? r.linhas : [tr('Não encontrei nada sobre isso nos dados locais deste projeto.')], fontes, r.proximos || [], rotulo + (r.orquestracao ? ' · ' + tr('orquestrou {n} especialistas', { n: r.orquestracao.agentes.length }) : ''), ia);
        if (v === versao) controlesResposta(r, pergunta);
      } catch { fim(); avisar(tr('Falha ao consultar o assistente local.'), true); } finally { enviar.disabled = false; }
    }
    function montar() {
      if (el) return el;
      msgs = h('div', { class: 'v36c-msgs', id: 'chat-msgs', 'aria-live': 'polite', 'data-i18n-ignore': '' });
      entrada = h('textarea', { id: 'chat-input', rows: 1, maxlength: 300, placeholder: tr('Pergunte alguma coisa ao Prumo…'), 'aria-label': tr('Mensagem para o Prumo'), autocomplete: 'off' });
      enviar = h('button', { type: 'submit', class: 'v36c-enviar', 'aria-label': tr('Enviar mensagem'), title: tr('Enviar mensagem') }, icone('enviar', 18));
      seletorAgente = h('select', { id: 'chat-agente', class: 'v36c-seletor', 'aria-label': tr('Agente que vai responder') }, h('option', { value: '' }, tr('Agente automático')));
      interlocutores = h('div', { id: 'chat-interlocutor', class: 'v36c-interlocutores', role: 'radiogroup', 'aria-label': tr('Com quem você quer falar'), hidden: true });
      linhaConexao = h('div', { class: 'v36c-conexao', role: 'status', hidden: true });
      const form = h('form', { id: 'chat-form', class: 'v36c-compor' }, h('span', { class: 'v36c-faisca', 'aria-hidden': 'true' }, icone('faisca', 16)), entrada, enviar);
      chips = h('div', { class: 'v36c-chips', role: 'group', 'aria-label': tr('Sugestões de mensagens') });
      const orbita = h('div', { class: 'v36c-orbita', role: 'img', 'aria-label': tr('Prumo Orchestrator, esfera original com três órbitas') }, qc.campo(212, estadoOrb(estado.worker), ''));
      PrumoOrbitas.anexar(orbita);
      el = h('section', { class: 'v36c', id: 'v36-conversa', 'aria-label': tr('Conversa com o Prumo Orchestrator') },
        h('h1', { class: 'v36-sr' }, 'Prumo QA'),
        h('div', { class: 'v36c-topo' }, orbita), msgs,
        h('div', { class: 'v36c-interacao' }, h('div', { class: 'v36c-sugestoes' }, h('span', { class: 'v36c-faisca', 'aria-hidden': 'true' }, icone('faisca', 15)), h('span', {}, tr('O que vamos explorar?'))), chips),
        h('div', { class: 'v36c-compor-caixa' }, interlocutores, linhaConexao, h('div', { class: 'v36c-opcoes' }, seletorAgente), form, h('div', { class: 'v36c-rodape' }, rodapeTexto = h('span', {}, tr('Respostas com os dados deste computador, sem modelo de IA.')), h('span', {}, 'Enter envia · Shift+Enter quebra linha'))));
      form.addEventListener('submit', (e) => { e.preventDefault(); void perguntar(entrada.value); });
      entrada.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
      entrada.addEventListener('input', ajustarAltura);
      void reiniciar(); void carregarRoster(); return el;
    }
    function contexto(aba, texto) { void montar(); void sincronizar(); void falar([texto], null, PROXIMOS[TOPICO_DA_TELA[aba]] || INICIAIS); }
    function focar() { setTimeout(() => entrada?.focus({ preventScroll: true }), 220); }
    function estadoOrbita() { el?.querySelectorAll('.qc-orb, .qc-campo').forEach((e) => { e.dataset.estado = estadoOrb(estado.worker); }); }
    return { montar, sincronizar, contexto, focar, estadoOrbita, recarregar: () => { if (el) { void carregarRoster(); } } };
  })();
  function abrirTela(aba) { if (!document.body.classList.contains('v36-encaixado')) flutuante?.fechar(true); void mostrar(aba); }

  // ---------------- Orchestrator flutuante (robô original, balão contextual, painel e lateral) ----------------
  const DICAS = {
    metricas: ['Quer explorar um gráfico ou comparar períodos?', 'Posso te ajudar a interpretar estas métricas.'],
    logs: ['Precisa investigar uma falha nos logs?', 'Posso te ajudar a localizar a etapa com problema.'],
    testes: ['Quer entender os testes deste projeto?', 'Posso te orientar pelos cenários.'],
    agentes: ['Quer conhecer os agentes disponíveis?', 'Posso te explicar como configurá-los.'],
    conexoes: ['Quer revisar suas integrações?', 'Posso te orientar nas configurações de conexão.'],
    projetos: ['Quer explorar um projeto?', 'Posso te ajudar a navegar pelos projetos.'],
    tickets: ['Quer procurar um ticket?', 'Posso te mostrar por onde começar.']
  };
  let flutuante = null;
  function montarFlutuante() {
    const raiz = h('aside', { class: 'v36f', id: 'v36-float', 'aria-label': tr('Atalho do Prumo Orchestrator') });
    const dock = h('div', { class: 'v36f-dock', id: 'v36-float-dock' });
    const encaixe = h('button', { type: 'button', id: 'v36-chat-dock', class: 'v36f-ctl' });
    const fecharBtn = h('button', { type: 'button', id: 'v36-chat-close', class: 'v36f-ctl v36f-fechar', 'aria-label': tr('Fechar chat'), title: tr('Fechar chat') }, icone('fechar', 18));
    const alcaLateral = h('div', { class: 'v36f-grip', id: 'v36-side-grip', role: 'separator', tabindex: '0', 'aria-orientation': 'vertical', 'aria-label': tr('Ajustar largura do chat lateral'), title: tr('Arraste para ajustar a largura; use as setas do teclado') }, alca());
    const painel = h('section', { id: 'v36-float-panel', class: 'v36f-painel', hidden: true, role: 'dialog', 'aria-label': tr('Prumo Orchestrator, conversa compacta') }, h('div', { class: 'v36f-barra' }, encaixe, fecharBtn), dock, alcaLateral);
    const orbita = h('span', { class: 'v36f-orbita' }, h('span', { class: 'v36f-robo' }, h('img', { src: asset('robo-original.png'), alt: '', draggable: 'false' })), h('span', { class: 'v36f-alvo', 'aria-hidden': 'true' }));
    const botao = h('button', { type: 'button', id: 'v36-chat-open', class: 'v36f-botao', 'aria-label': tr('Abrir Prumo Orchestrator'), title: 'Prumo Orchestrator', 'aria-expanded': 'false', 'aria-controls': 'v36-float-panel' }, orbita);
    const dica = h('button', { type: 'button', class: 'v36f-dica', 'data-visible': 'false', 'aria-label': tr('Abrir sugestão do Prumo Orchestrator') });
    raiz.append(painel, botao, dica); document.body.append(raiz); PrumoOrbitas.anexar(orbita);
    const encaixado = () => document.body.classList.contains('v36-encaixado');
    function rotularEncaixe() {
      const lado = encaixado(); encaixe.replaceChildren(icone(lado ? 'soltar' : 'encaixar', 18));
      const dicaTxt = lado ? tr('Voltar para chat flutuante') : tr('Encaixar chat na lateral');
      encaixe.setAttribute('aria-label', dicaTxt); encaixe.title = dicaTxt; encaixe.setAttribute('aria-pressed', String(lado)); raiz.classList.toggle('lateral', lado);
    }
    function soltar() { document.body.classList.remove('v36-encaixado'); rotularEncaixe(); }
    let fechando = 0;
    function abrir() {
      if (estado.aba === 'inicio') return; clearTimeout(fechando); esconderDica();
      dock.append(conversa.montar()); conversa.sincronizar(); conversa.estadoOrbita();
      painel.classList.remove('fechando'); painel.hidden = false; raiz.classList.add('aberto'); document.body.classList.add('v36-painel-aberto'); botao.setAttribute('aria-expanded', 'true'); conversa.focar();
    }
    function fechar(imediato = false) {
      if (painel.hidden) { soltar(); return; }
      const devolverFoco = painel.contains(document.activeElement);
      const concluir = () => { painel.hidden = true; painel.classList.remove('fechando'); raiz.classList.remove('aberto'); document.body.classList.remove('v36-painel-aberto'); botao.setAttribute('aria-expanded', 'false'); soltar(); if (devolverFoco && estado.aba !== 'inicio') botao.focus(); };
      clearTimeout(fechando); if (imediato || reduzido()) concluir(); else { painel.classList.add('fechando'); fechando = setTimeout(concluir, 180); }
    }
    botao.addEventListener('click', () => (painel.hidden ? abrir() : fechar()));
    fecharBtn.addEventListener('click', () => fechar());
    encaixe.addEventListener('click', () => { if (painel.hidden) return; document.body.classList.toggle('v36-encaixado'); rotularEncaixe(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !painel.hidden && !document.querySelector('dialog[open]')) { e.preventDefault(); fechar(); } });
    // Largura da lateral: arrastar ou setas do teclado; limites relativos à janela.
    const limites = () => ({ min: Math.min(300, Math.round(innerWidth * .4)), max: Math.min(600, Math.round(innerWidth * .62)) });
    const larguraAtual = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--v36-lateral')) || 440;
    function ajustar(px) { const { min, max } = limites(); const w = Math.max(min, Math.min(max, Math.round(px))); document.documentElement.style.setProperty('--v36-lateral', w + 'px'); alcaLateral.setAttribute('aria-valuemin', min); alcaLateral.setAttribute('aria-valuemax', max); alcaLateral.setAttribute('aria-valuenow', w); }
    let arrastando = false;
    alcaLateral.addEventListener('pointerdown', (e) => { if (!encaixado() || innerWidth <= 840) return; arrastando = true; alcaLateral.classList.add('arrastando'); alcaLateral.setPointerCapture(e.pointerId); e.preventDefault(); });
    alcaLateral.addEventListener('pointermove', (e) => { if (arrastando) ajustar(innerWidth - e.clientX); });
    const fimArraste = () => { arrastando = false; alcaLateral.classList.remove('arrastando'); };
    alcaLateral.addEventListener('pointerup', fimArraste); alcaLateral.addEventListener('pointercancel', fimArraste); alcaLateral.addEventListener('lostpointercapture', fimArraste);
    alcaLateral.addEventListener('keydown', (e) => { if (encaixado() && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); ajustar(larguraAtual() + (e.key === 'ArrowLeft' ? 20 : -20)); } });
    // Balão contextual: convida a conversar, sem afirmar leitura de dados.
    let n = 0, tMostrar = 0, tEsconder = 0;
    function esconderDica() { dica.dataset.visible = 'false'; clearTimeout(tEsconder); }
    function mostrarDica() {
      const aba = estado.aba; if (aba === 'inicio' || !painel.hidden || document.hidden) return;
      const op = DICAS[aba] || ['Quer ajuda para explorar esta tela?', 'Posso te orientar nesta tela.'];
      dica.textContent = tr(op[n++ % op.length]);
      // 2.10.2: o balão só aparece onde não cobre nenhum controle da tela (ele já ocupa o lugar mesmo invisível).
      if (cobreControle()) return;
      dica.dataset.visible = 'true'; clearTimeout(tEsconder); tEsconder = setTimeout(esconderDica, 6400);
    }
    function cobreControle() {
      const d = dica.getBoundingClientRect(), m = 8;
      return [...document.querySelectorAll('#conteudo button, #conteudo a, #conteudo input, #conteudo select, #conteudo textarea, #conteudo summary, #conteudo [role=tab]')].some((el) => {
        const q = el.getBoundingClientRect(); if (!q.width || !q.height) return false;
        return q.left < d.right + m && q.right > d.left - m && q.top < d.bottom + m && q.bottom > d.top - m - 7;
      });
    }
    // Se a tela rolar com o balão aberto, um controle pode passar por baixo dele: esconde.
    document.addEventListener('scroll', () => { if (dica.dataset.visible === 'true') esconderDica(); }, { capture: true, passive: true });
    dica.addEventListener('click', () => { const texto = dica.textContent; esconderDica(); abrir(); conversa.contexto(estado.aba, texto); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) esconderDica(); });
    setInterval(() => { if (dica.dataset.visible !== 'true') mostrarDica(); }, 15500);
    function trocouTela(aba) {
      esconderDica(); clearTimeout(tMostrar);
      if (aba === 'inicio') { fechar(true); return; }
      if (!painel.hidden && !encaixado()) fechar(true);
      tMostrar = setTimeout(mostrarDica, 1050);
    }
    rotularEncaixe();
    return { abrir, fechar, trocouTela };
  }

  // ---------------- Início ----------------
