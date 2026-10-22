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
  /** Desenha o texto da resposta com markdown simples (negrito, código, listas, títulos, blocos e tabelas), sem HTML: tudo vira nós de texto. */
  function desenharTexto(el, texto) {
    const inline = (alvo, t) => { for (const parte of String(t).split(/(\*\*[^*]+\*\*|`[^`]+`)/)) { if (!parte) continue; if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) alvo.append(h('strong', {}, parte.slice(2, -2))); else if (parte.startsWith('`') && parte.endsWith('`') && parte.length > 2) alvo.append(h('code', {}, parte.slice(1, -1))); else alvo.append(parte); } };
    const linhas = String(texto).replace(/\r/g, '').split('\n'); const saida = []; let lista = null, bloco = null, paragrafo = null;
    const fecharLista = () => { lista = null; }; const fecharParagrafo = () => { paragrafo = null; };
    for (const linha of linhas) {
      if (/^\s*```/.test(linha)) { if (bloco) { bloco = null; } else { fecharLista(); fecharParagrafo(); bloco = h('pre', { class: 'v36c-codigo' }, h('code', {})); saida.push(bloco); } continue; }
      if (bloco) { bloco.firstChild.append(linha + '\n'); continue; }
      const item = /^\s*(?:[-*•]|(\d+)[.)])\s+(.*)$/.exec(linha);
      if (item) { fecharParagrafo(); const ordenada = !!item[1]; if (!lista || lista.tagName !== (ordenada ? 'OL' : 'UL')) { lista = h(ordenada ? 'ol' : 'ul', {}); saida.push(lista); } const li = h('li', {}); inline(li, item[2]); lista.append(li); continue; }
      if (/^\s*\|.*\|\s*$/.test(linha)) { fecharLista(); fecharParagrafo(); if (!/^[\s|:-]+$/.test(linha)) { const anterior = saida.at(-1); const tabela = anterior?.classList?.contains('v36c-tabela') ? anterior : h('div', { class: 'v36c-tabela' }); if (tabela !== anterior) saida.push(tabela); tabela.append(h('div', {}, ...linha.trim().replace(/^\||\|$/g, '').split('|').map((c) => { const celula = h('span', {}); inline(celula, c.trim()); return celula; }))); } continue; }
      const titulo = /^\s*#{1,4}\s+(.*)$/.exec(linha);
      if (titulo) { fecharLista(); fecharParagrafo(); const t = h('p', { class: 'v36c-subtitulo' }); inline(t, titulo[1]); saida.push(t); continue; }
      if (!linha.trim()) { fecharLista(); fecharParagrafo(); continue; }
      fecharLista(); if (!paragrafo) { paragrafo = h('p', {}); saida.push(paragrafo); } else paragrafo.append(h('br')); inline(paragrafo, linha.trim());
    }
    el.classList.add('md'); el.replaceChildren(...saida);
  }
  const conversa = (() => {
    let el = null, msgs, entrada, enviar, chips, emUso, seletorAgente, interlocutores, linhaConexao, interlocutor = 'local', rodapeTexto, fila = Promise.resolve(), primeira = true, projeto, versao = 0, roster = null, historico = [], pendente = null;
    const nomeIa = () => estado.prefs?.ia?.nome || 'Prumo';
    // Acompanha o fim da conversa, mas deixa em paz quem subiu para reler (só desce se já estava perto do fim ou se a pessoa acabou de enviar).
    const rolar = (forcar = false) => { if (forcar || msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 140) msgs.scrollTop = msgs.scrollHeight; };
    function bolha(quem, rotulo, ia = 'local') {
      const texto = h('div', { class: 'v36c-texto' }); const meta = quem === 'prumo' && (primeira || rotulo);
      const m = h('article', { class: 'msg ' + quem + (meta ? ' primeira' : ''), 'data-ia': ia }, meta ? h('div', { class: 'v36c-meta' }, ia !== 'local' ? h('span', { class: 'v36c-marca', 'data-ia': ia, 'aria-hidden': 'true' }, INTERLOCUTORES[ia].marca) : null, rotulo || nomeIa()) : null, texto);
      m.append(h('div', { class: 'v36c-acoes' }, botaoOuvir(texto, quem === 'prumo' ? ia : 'voce'), botaoCopiar(texto))); if (quem === 'prumo') primeira = false; msgs.append(m); return { m, texto };
    }
    function digitar(t, v, rotulo, ia) {
      if (v !== versao) return Promise.resolve();
      const { m, texto } = bolha('prumo', rotulo, ia); texto.dataset.bruto = t; if (reduzido() || ia !== 'local' || t.length > 400) { desenharTexto(texto, t); if (t.length > 500) m.scrollIntoView({ block: 'start', behavior: reduzido() ? 'auto' : 'smooth' }); else rolar(); return Promise.resolve(); }
      return new Promise((ok) => { m.classList.add('digitando'); let n = 0; const id = setInterval(() => { if (m.parentNode !== msgs) { clearInterval(id); ok(); return; } n += 2; texto.textContent = t.slice(0, n); rolar(); if (n >= t.length) { clearInterval(id); m.classList.remove('digitando'); desenharTexto(texto, t); ok(); } }, 18); });
    }
    function falar(linhas, fontes, proximos, rotulo, ia = 'local') {
      const v = versao;
      fila = fila.then(async () => {
        for (const [i, l] of linhas.entries()) { await digitar(l, v, i === 0 ? rotulo : null, ia); if (v === versao) await falarSeLigado(l, ia); }
        if (v !== versao) return;
        const seguimentos = (proximos || []).filter((p) => p.pergunta).slice(0, 3);
        if (seguimentos.length) { const caixa = h('div', { class: 'v36c-fontes v36c-seguimentos', role: 'group', 'aria-label': tr('Sugestões para continuar') }, seguimentos.map((p) => h('button', { type: 'button', class: 'v36c-fonte', onclick: () => { caixa.remove(); void perguntar(p.pergunta); } }, p.rotulo))); msgs.append(caixa); rolar(); }
        if (fontes?.length) { msgs.append(h('div', { class: 'v36c-fontes' }, fontes.map((f) => h('button', { type: 'button', class: 'v36c-fonte', onclick: () => abrirTela(f.aba) }, f.rotulo, h('span', { 'aria-hidden': 'true' }, '↗'))))); rolar(); }
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
    // ---------------- Voz: ouvir cada mensagem, ditar pelo microfone e conversar só por áudio ----------------
    let botaoVoz, botaoMic, botaoFone, painelVozes, linhaVoz, gravando = null, chamada = false;
    const lendo = () => chamada || vozDoChat.lerRespostas();
    /** Fala uma linha do chat quando a leitura automática ou a conversa por voz estão ligadas. */
    const falarSeLigado = (texto, quem) => (lendo() ? vozDoChat.falar(texto, quem) : Promise.resolve());
    function estadoVoz(fase) {
      if (!linhaVoz) return;
      const TEXTOS = { ouvindo: 'Ouvindo… fale agora.', baixando: 'Baixando o modelo de voz (só desta vez)…', carregando: 'Preparando o reconhecimento de voz…', transcrevendo: 'Transcrevendo o que você falou…', pensando: 'Pensando…', falando: 'Falando…' };
      linhaVoz.hidden = !fase; linhaVoz.dataset.fase = fase || ''; linhaVoz.querySelector('span').textContent = fase ? tr(TEXTOS[fase]) : '';
      linhaVoz.querySelector('button').hidden = !chamada;
      botaoMic?.setAttribute('aria-pressed', String(!chamada && fase === 'ouvindo')); botaoFone?.setAttribute('aria-pressed', String(chamada));
    }
    async function abrirMicrofone(opcoes) {
      if (!vozDoChat.microfone) { avisar(tr('Este computador não oferece microfone para o Prumo.'), true); return null; }
      try { return await vozDoChat.gravar(opcoes); } catch { avisar(tr('Não consegui usar o microfone. Confira se o Windows permite o microfone para o Prumo.'), true); return null; }
    }
    /** Microfone do campo: grava até você clicar de novo, transcreve no computador e deixa o texto no campo para você revisar e enviar. */
    async function ditar() {
      if (chamada) return;
      if (gravando) { gravando.parar(); return; }
      gravando = await abrirMicrofone(); if (!gravando) return; vozDoChat.parar(); estadoVoz('ouvindo');
      const audio = await gravando.pronto; gravando = null;
      if (!audio) { estadoVoz(null); avisar(tr('Não ouvi nenhuma fala.')); return; }
      const texto = await vozDoChat.transcrever(audio, estadoVoz); estadoVoz(null);
      if (!texto) { if (texto === '') avisar(tr('Não entendi o que foi dito.')); return; }
      entrada.value = ((entrada.value ? entrada.value.trim() + ' ' : '') + texto).slice(0, 300); ajustarAltura(); entrada.focus({ preventScroll: true });
    }
    /** Só conversar: você fala, o Prumo transcreve no chat, responde por texto e voz, e volta a ouvir até você encerrar. */
    async function conversarPorVoz() {
      if (chamada) { chamada = false; gravando?.parar(); vozDoChat.parar(); estadoVoz(null); return; }
      if (gravando) return;
      chamada = true; estadoVoz('ouvindo');
      while (chamada) {
        gravando = await abrirMicrofone({ silencioMs: 1400 }); if (!gravando) break; estadoVoz('ouvindo');
        const audio = await gravando.pronto; gravando = null; if (!chamada) break; if (!audio) continue;
        const texto = await vozDoChat.transcrever(audio, estadoVoz); if (texto === null) break; if (!chamada) break;
        if (texto.length < 2) continue;
        estadoVoz('pensando'); await perguntar(texto); if (chamada) estadoVoz('ouvindo');
      }
      chamada = false; estadoVoz(null);
    }
    /** Botão de cada mensagem: ouve só aquela fala, com a voz e o personagem de quem a disse; clicar de novo para. */
    function botaoOuvir(texto, quem) {
      const b = h('button', { type: 'button', class: 'v36c-ouvir', 'aria-label': tr('Ouvir esta mensagem'), title: tr('Ouvir esta mensagem') }, icone('voz', 14));
      b.addEventListener('click', () => { if (b.getAttribute('aria-pressed') === 'true') { vozDoChat.parar(); return; } vozDoChat.parar(); b.setAttribute('aria-pressed', 'true'); void vozDoChat.falar(texto.classList.contains('md') ? texto.innerText : texto.textContent, quem).finally(() => b.setAttribute('aria-pressed', 'false')); });
      return b;
    }
    /** Copia a mensagem como texto simples (sem marcadores), como nos assistentes de hoje. */
    function botaoCopiar(texto) {
      const b = h('button', { type: 'button', class: 'v36c-ouvir v36c-copiar', 'aria-label': tr('Copiar mensagem'), title: tr('Copiar mensagem') }, icone('copiar', 14));
      b.addEventListener('click', async () => {
        const t = texto.classList.contains('md') ? texto.innerText : texto.textContent;
        try { await navigator.clipboard.writeText(t); } catch { const a = h('textarea', { 'aria-hidden': 'true' }); a.value = t; document.body.append(a); a.select(); try { document.execCommand('copy'); } catch { /* sem área de transferência */ } a.remove(); }
        avisar(tr('Mensagem copiada.'));
      });
      return b;
    }
    function montarPainelDeVozes() {
      const quem = h('select', { id: 'voz-quem', 'aria-label': tr('Quem fala') }, Object.entries(QUEM_FALA).map(([id, nome]) => h('option', { value: id }, tr(nome))));
      const voz = h('select', { id: 'voz-voz', 'aria-label': tr('Voz') });
      const personagem = h('select', { id: 'voz-personagem', 'aria-label': tr('Personagem') }, Object.entries(PERSONAGENS).map(([id, p]) => h('option', { value: id }, tr(p.nome))));
      const ler = h('input', { type: 'checkbox', id: 'voz-ler', checked: vozDoChat.lerRespostas() });
      const preencherVozes = () => {
        const lista = vozDoChat.vozesDoSistema(); const atual = vozDoChat.prefs().vozes[quem.value]?.voz || '';
        voz.replaceChildren(h('option', { value: '' }, tr('Padrão do idioma')), ...lista.map((v) => h('option', { value: v.name }, v.name + ' · ' + v.lang))); voz.value = lista.some((v) => v.name === atual) ? atual : '';
        personagem.value = vozDoChat.prefs().vozes[quem.value]?.personagem || 'padrao';
      };
      quem.addEventListener('change', preencherVozes); preencherVozes(); if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', preencherVozes);
      voz.addEventListener('change', () => vozDoChat.definir(quem.value, 'voz', voz.value));
      personagem.addEventListener('change', () => vozDoChat.definir(quem.value, 'personagem', personagem.value));
      ler.addEventListener('change', () => { vozDoChat.lerRespostas(ler.checked); botaoVoz.setAttribute('aria-pressed', String(ler.checked)); });
      const testar = h('button', { type: 'button', class: 'v36c-fonte' }, tr('Testar esta voz'));
      testar.addEventListener('click', () => { vozDoChat.parar(); void vozDoChat.falar(tr('Olá! Esta é a minha voz no Prumo.'), quem.value); });
      painelVozes = h('section', { class: 'v36c-vozes', id: 'v36-vozes', role: 'dialog', 'aria-label': tr('Vozes e personagens'), hidden: true },
        h('label', { class: 'v36c-vozes-linha' }, ler, h('span', {}, tr('Ler as mensagens em voz alta'))),
        h('label', {}, h('span', {}, tr('Quem fala')), quem), h('label', {}, h('span', {}, tr('Voz')), voz), h('label', {}, h('span', {}, tr('Personagem')), personagem), testar,
        h('small', {}, tr('As vozes são as instaladas no Windows (Configurações › Hora e idioma › Fala). Os personagens mudam tom e ritmo da voz.')));
      painelVozes.addEventListener('keydown', (e) => { if (e.key === 'Escape') { painelVozes.hidden = true; botaoVoz.setAttribute('aria-expanded', 'false'); botaoVoz.focus(); } });
      return painelVozes;
    }
    function alternarPainelDeVozes() { painelVozes.hidden = !painelVozes.hidden; botaoVoz.setAttribute('aria-expanded', String(!painelVozes.hidden)); if (!painelVozes.hidden) painelVozes.querySelector('select')?.focus(); }
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
      rodapeTexto.textContent = interlocutor === 'mesa' ? tr('Cada IA da mesa responde pela própria conta e comenta as respostas das outras; o Orquestrador só resume e o Prumo só libera consultas.') : interlocutor !== 'local' ? tr('{nome} responde pela conta e pelas regras dele; o Prumo só libera consultas.', { nome: ia.nome }) : temExterna ? tr('QA e TI: pela IA conectada. Dados do projeto: só neste computador.') : tr('Sem IA conectada: respondo com a base offline de QA e os dados deste computador.');
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
      pendente = abertura.pendente; void falar(abertura.linhas, null, null);
    }
    function reiniciar() { el.classList.remove('conversando'); versao++; primeira = true; fila = Promise.resolve(); historico = []; pendente = null; delete el.dataset.conversou; msgs.replaceChildren(); projeto = idAtual(); emUso.hidden = true; emUso.replaceChildren(); void saudar(); }
    function sincronizar() { if (!el) return; void carregarRoster(); entrada.setAttribute('aria-label', tr('Mensagem para o Prumo')); mostrarConexao(); if (projeto !== idAtual()) void reiniciar(); }
    function ajustarAltura() { entrada.style.height = 'auto'; entrada.style.height = Math.min(125, entrada.scrollHeight) + 'px'; }
    /** "@qa-geral ...", "@claude ...", "@mesa ..." escolhem quem responde, sem botão fixo; vale até outra menção ("@orquestrador" volta ao automático). */
    function aplicarMencao(q) {
      const m = /^@([\w-]+)\s*/.exec(q); if (!m) return q;
      const chave = m[1].toLowerCase(); const semAcento = (x) => String(x).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
      const externo = (roster?.provedores || []).find((p) => p.id === chave && p.disponivel && p.autorizado);
      const agente = (roster?.agentes || []).find((a) => a.id === chave || semAcento(a.nome) === chave);
      if (externo || (chave === 'mesa' && interlocutor !== 'mesa' && (roster?.provedores || []).filter((p) => p.disponivel && p.autorizado).length >= 2)) { if (interlocutor !== chave) escolherInterlocutor(chave); }
      else if (chave === 'orquestrador' || chave === 'prumo' || chave === 'auto') { if (interlocutor !== 'local') escolherInterlocutor('local'); seletorAgente.value = ''; }
      else if (agente) seletorAgente.value = agente.id;
      else return q;
      return q.slice(m[0].length);
    }
    /** Chip do agente que acabou de responder (e da IA externa, se foi ela): aparece com o uso e troca quando o agente muda. */
    function mostrarEmUso(r, ia) {
      const nomes = [r.agente?.nome, ia !== 'local' ? INTERLOCUTORES[ia]?.nome : null].filter(Boolean);
      emUso.replaceChildren(...nomes.map((n) => h('span', { class: 'v36c-uso', 'data-ia': ia }, h('i', { 'aria-hidden': 'true' }), n)));
      emUso.hidden = !nomes.length;
    }
    /** Conversa de agora para o Painel de atividades: fica só na memória desta janela (nada é gravado), por 2 minutos. */
    function publicarAoVivo(r, pergunta, ia) {
      const lista = (window.PrumoConversasAoVivo ||= []);
      lista.push({ id: 'vivo-' + Date.now() + '-' + lista.length, em: new Date().toISOString(), agente: r.agente?.id || 'orquestrador', agenteNome: r.agente?.nome || 'Prumo Orchestrator', pergunta,
        linhas: (r.mesa ? [...r.mesa.ias.flatMap((x) => x.linhas), ...r.mesa.resumo] : r.linhas || []).slice(0, 12), modo: String(r.modo || 'LOCAL'), fontes: (r.fontes || []).map((x) => x.rotulo), orquestrou: r.orquestracao?.agentes?.length || 0 });
      while (lista.length > 30 || (lista[0] && Date.now() - Date.parse(lista[0].em) > 600000)) lista.shift();
    }
    async function perguntar(q, topico) {
      q = String(q || '').trim(); q = aplicarMencao(q); if (q.length < 2 || enviar.disabled) return;
      sincronizar(); const v = versao; const { texto } = bolha('voce'); texto.textContent = q; el.classList.add('conversando'); rolar(true); vozDoChat.parar(); msgs.querySelectorAll('.v36c-seguimentos').forEach((e) => e.remove()); if (!chamada) void falarSeLigado(q, 'voce'); entrada.value = ''; ajustarAltura();
      enviar.disabled = true; const id = idAtual(); const fim = ocupado();
      try {
        // Pedidos que a tela aberta sabe cumprir (ex.: IDE: "abrir app.ts", "criar arquivo src/x.ts") são feitos ali, sem passar pelo assistente.
        const naTela = await window.PrumoAcoesDaTela?.(q);
        if (naTela) { fim(); await falar(naTela.linhas, null, null, tr('Orquestrador') + ' · ' + tr('na tela'), 'local'); return; }
        const t = topico || topicoDe(q); const T = TOPICOS[t];
        // A memória fica apenas nesta janela e é isolada ao trocar de projeto.
        const agenteFixo = seletorAgente.value || (topico ? TOPICO_AGENTE[topico] : null) || null;
        const pergunta = topico && T?.pergunta ? T.pergunta : q;
        const memoria = historico.length ? historico : pendente ? [{ pergunta: '', agente: 'orquestrador', pendente }] : [];
        const r = await chamar(() => api.assistenteConversar(id, pergunta, { agente: agenteFixo, provedor: interlocutor, primeira: !el.dataset.conversou, historico: memoria }));
        fim(); if (v !== versao) return;
        if (idAtual() !== id) { reiniciar(); return; }
        if (!r) return; el.dataset.conversou = '1'; pendente = r.pendente;
        historico.push({ pergunta, agente: r.agente.id, pendente: r.pendente, resposta: (r.mesa ? r.mesa.resumo : r.linhas || []).join(' ').replace(/\s+/g, ' ').slice(0, 500) }); historico = historico.slice(-6);
        let fontes = r.fontes || []; if (T && !fontes.some((f) => f.aba === T.aba)) fontes = [...fontes, { rotulo: tr(T.rota), aba: T.aba }];
        const ia = MODO_DO_INTERLOCUTOR[r.modo] || 'local';
        if (r.aviso) avisar(r.aviso);
        // IA externa assina a resposta e o agente do Prumo vira contexto; local: o Orchestrator responde direto.
        const origem = r.mcp?.estado === 'CONFIRMADO'
          ? tr('MCP confirmado · {ferramentas}', { ferramentas: r.mcp.ferramentas.join(', ') })
          : r.mcp?.estado === 'NAO_NECESSARIO' ? tr('pergunta geral · MCP não necessário')
            : r.mcp?.estado === 'SEM_PROJETO' ? tr('MCP sem projeto vinculado')
              : r.mcp?.estado === 'NAO_CONFIRMADO' ? tr('MCP não confirmado') : tr('MCP disponível');
        const rotulo = ia === 'local' ? r.agente.nome + ' · ' + tr('local') : INTERLOCUTORES[ia].nome + ' · ' + origem + ' · ' + r.agente.nome;
        if (r.mesa) {
          // Mesa: cada IA aparece com a própria marca e cor; o resumo do Orquestrador vem depois, com a marca da mesa.
          for (const x of r.mesa.ias) await falar(x.linhas, null, null, x.nome + ' · ' + origem, x.provedor);
          await falar(r.mesa.resumo, fontes, r.proximos || [], tr('Orquestrador') + ' · ' + tr('resumo da mesa'), 'mesa');
        } else {
          await falar(r.linhas.length ? r.linhas : [tr('Não encontrei nada sobre isso nos dados locais deste projeto.')], fontes, r.proximos || [], rotulo + (r.orquestracao ? ' · ' + tr('orquestrou {n} especialistas', { n: r.orquestracao.agentes.length }) : ''), ia);
        }
        if (v === versao) { controlesResposta(r, pergunta); mostrarEmUso(r, ia); }
        publicarAoVivo(r, pergunta, ia);
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
      botaoMic = h('button', { type: 'button', class: 'v36c-voz v36c-mic', 'aria-pressed': 'false', 'aria-label': tr('Falar para escrever a mensagem'), title: tr('Falar para escrever a mensagem'), onclick: () => void ditar() }, icone('microfone', 18));
      botaoFone = h('button', { type: 'button', class: 'v36c-voz v36c-fone', 'aria-pressed': 'false', 'aria-label': tr('Conversar só por voz'), title: tr('Conversar só por voz'), onclick: () => void conversarPorVoz() }, icone('fone', 18));
      botaoVoz = h('button', { type: 'button', class: 'v36c-voz', 'aria-pressed': String(vozDoChat.lerRespostas()), 'aria-expanded': 'false', 'aria-controls': 'v36-vozes', 'aria-label': tr('Vozes e leitura em voz alta'), title: tr('Vozes e leitura em voz alta'), onclick: alternarPainelDeVozes }, icone('voz', 18));
      const sairDaChamada = h('button', { type: 'button', class: 'v36c-fonte', hidden: true, onclick: () => void conversarPorVoz() }, tr('Encerrar conversa por voz'));
      linhaVoz = h('div', { class: 'v36c-voz-estado', role: 'status', 'aria-live': 'polite', hidden: true }, h('span', {}), sairDaChamada);
      const form = h('form', { id: 'chat-form', class: 'v36c-compor' }, h('span', { class: 'v36c-faisca', 'aria-hidden': 'true' }, icone('faisca', 16)), entrada, botaoMic, botaoFone, botaoVoz, enviar);
      chips = h('div', { class: 'v36c-chips', role: 'group', 'aria-label': tr('Sugestões de mensagens') });
      // Agente em uso: aparece quando alguém responde e muda conforme o agente muda; nada fixo na tela.
      emUso = h('div', { class: 'v36c-em-uso', role: 'status', 'aria-live': 'polite', hidden: true });
      const orbita = h('div', { class: 'v36c-orbita', role: 'img', 'aria-label': tr('Prumo Orchestrator, esfera original com três órbitas') }, qc.campo(212, estadoOrb(estado.worker), ''));
      PrumoOrbitas.anexar(orbita);
      el = h('section', { class: 'v36c', id: 'v36-conversa', 'aria-label': tr('Conversa com o Prumo Orchestrator') },
        h('h1', { class: 'v36-sr' }, 'Prumo QA'),
        h('div', { class: 'v36c-topo' }, orbita), msgs,
        h('div', { class: 'v36c-interacao' }, emUso, chips),
        h('div', { class: 'v36c-compor-caixa' }, h('div', { class: 'v36-sr' }, interlocutores, linhaConexao, seletorAgente), linhaVoz, montarPainelDeVozes(), form, h('div', { class: 'v36c-rodape' }, rodapeTexto = h('span', {}, tr('Sem IA conectada: respondo com a base offline de QA e os dados deste computador.')), h('span', {}, 'Enter envia · Shift+Enter quebra linha'))));
      form.addEventListener('submit', (e) => { e.preventDefault(); void perguntar(entrada.value); });
      entrada.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
      entrada.addEventListener('input', ajustarAltura);
      void reiniciar(); void carregarRoster(); return el;
    }
    function contexto(aba, texto) { void montar(); void sincronizar(); void falar([texto], null, null); }
    function focar() { setTimeout(() => entrada?.focus({ preventScroll: true }), 220); }
    function estadoOrbita() { el?.querySelectorAll('.qc-orb, .qc-campo').forEach((e) => { e.dataset.estado = estadoOrb(estado.worker); }); }
    /** Deixa um começo de pergunta no campo, sem enviar, para a pessoa completar (usado pelos menus das telas). */
    function preparar(texto) { void montar(); sincronizar(); entrada.value = String(texto || ''); ajustarAltura(); entrada.focus({ preventScroll: true }); entrada.setSelectionRange(entrada.value.length, entrada.value.length); }
    return { montar, sincronizar, contexto, focar, estadoOrbita, perguntar, preparar, recarregar: () => { if (el) { void carregarRoster(); } } };
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
