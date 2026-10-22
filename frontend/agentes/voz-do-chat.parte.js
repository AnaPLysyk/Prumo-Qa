/** Agentes: voz do chat. Ouvir mensagens com vozes e personagens, ditar pelo microfone e transcrever no próprio computador. */
  const PERSONAGENS = {
    padrao: { nome: 'Voz normal', tom: 1, ritmo: 1 },
    narradora: { nome: 'Narradora', tom: 1.08, ritmo: 0.93 },
    robo: { nome: 'Robô', tom: 0.5, ritmo: 0.9 },
    crianca: { nome: 'Criança', tom: 1.75, ritmo: 1.1 },
    grave: { nome: 'Grave', tom: 0.6, ritmo: 0.92 },
    ligeira: { nome: 'Ligeira', tom: 1.1, ritmo: 1.35 }
  };
  const QUEM_FALA = { voce: 'Você', local: 'Prumo Orchestrator', claude: 'Claude Code', codex: 'Codex', copilot: 'GitHub Copilot', gemini: 'Gemini CLI', mesa: 'Mesa de IAs' };
  const vozDoChat = (() => {
    const CHAVE = 'prumo.voz';
    const ler = () => { try { return JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch { return {}; } };
    let prefs = { lerRespostas: false, vozes: {}, ...ler() }; prefs.vozes ||= {};
    const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(prefs)); } catch { /* preferência só desta sessão */ } };
    const temVoz = 'speechSynthesis' in window;
    const idioma = () => (PrumoI18n.idioma === 'en' ? 'en' : 'pt');
    const vozesDoSistema = () => (temVoz ? speechSynthesis.getVoices() : []);
    /** Voz escolhida para quem fala; sem escolha, a primeira do idioma da interface. */
    function vozDe(quem) { const nome = prefs.vozes[quem]?.voz; return vozesDoSistema().find((v) => v.name === nome) || vozesDoSistema().find((v) => v.lang.toLowerCase().startsWith(idioma())) || null; }
    const ajusteDe = (quem) => PERSONAGENS[prefs.vozes[quem]?.personagem] || PERSONAGENS.padrao;
    let atual = null;
    /** Fala o texto com a voz e o personagem de quem fala; a promessa termina quando a fala acaba, é interrompida ou falha. */
    function falar(texto, quem = 'local') {
      if (!temVoz || !String(texto || '').trim()) return Promise.resolve();
      return new Promise((ok) => {
        try {
          const u = new SpeechSynthesisUtterance(String(texto)); const v = vozDe(quem); const p = ajusteDe(quem);
          if (v) u.voice = v; u.lang = v?.lang || (idioma() === 'en' ? 'en-US' : 'pt-BR'); u.pitch = p.tom; u.rate = p.ritmo;
          const fim = () => { clearTimeout(limite); if (atual === u) atual = null; ok(); };
          const limite = setTimeout(fim, 30000 + texto.length * 90);
          u.onend = fim; u.onerror = fim; atual = u; speechSynthesis.speak(u);
        } catch { ok(); }
      });
    }
    const parar = () => { if (temVoz) speechSynthesis.cancel(); atual = null; };
    function definir(quem, campo, valor) { prefs.vozes[quem] = { ...prefs.vozes[quem], [campo]: valor || undefined }; salvar(); }
    function lerRespostas(ligado) { if (ligado === undefined) return !!prefs.lerRespostas; prefs.lerRespostas = !!ligado; salvar(); if (!ligado) parar(); return prefs.lerRespostas; }

    // ---------------- Microfone: grava, corta no silêncio e entrega fala mono de 16 kHz ----------------
    /** Grava uma fala. `silencioMs` > 0 encerra sozinho depois da pausa; `parar()` encerra na hora. Devolve { parar, pronto } e `pronto` resolve com o áudio (ou null se não houve fala). */
    async function gravar({ silencioMs = 0, maximoMs = 55000, aoNivel } = {}) {
      const fluxo = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      const contexto = new AudioContext({ sampleRate: 16000 }); const analisador = contexto.createAnalyser(); analisador.fftSize = 1024;
      contexto.createMediaStreamSource(fluxo).connect(analisador);
      const gravador = new MediaRecorder(fluxo); const pedacos = []; gravador.ondataavailable = (e) => { if (e.data.size) pedacos.push(e.data); };
      const amostra = new Float32Array(analisador.fftSize); let falou = false, ultimaFala = Date.now(); const inicio = Date.now();
      let encerrar; const pronto = new Promise((ok) => { encerrar = ok; });
      const medidor = setInterval(() => {
        analisador.getFloatTimeDomainData(amostra); const nivel = Math.sqrt(amostra.reduce((s, x) => s + x * x, 0) / amostra.length); aoNivel?.(nivel);
        if (nivel > 0.02) { falou = true; ultimaFala = Date.now(); }
        if (Date.now() - inicio > maximoMs || (silencioMs && falou && Date.now() - ultimaFala > silencioMs) || (silencioMs && !falou && Date.now() - inicio > 12000)) parar();
      }, 100);
      function parar() { if (gravador.state !== 'inactive') gravador.stop(); }
      gravador.onstop = async () => {
        clearInterval(medidor); fluxo.getTracks().forEach((t) => t.stop());
        try { encerrar(falou ? Float32Array.from((await contexto.decodeAudioData(await new Blob(pedacos).arrayBuffer())).getChannelData(0)) : null); } catch { encerrar(null); } finally { void contexto.close(); }
      };
      gravador.start(); return { parar, pronto };
    }

    /** Transcrição local. Na primeira vez pede autorização para baixar o modelo; devolve null se a pessoa recusar. */
    async function transcrever(audio, aoEstado) {
      const e = await chamar(api.vozEstado); if (!e) return null;
      if (!e.pronto || !transcrever.quente) { aoEstado?.(e.pronto ? 'carregando' : 'baixando'); const p = await chamar(api.vozPreparar); if (!p || p.cancelado) return null; transcrever.quente = true; }
      aoEstado?.('transcrevendo');
      const r = await chamar(() => api.vozTranscrever(audio, idioma())); return r ? r.texto : null;
    }
    return { PERSONAGENS, temVoz, vozesDoSistema, vozDe, definir, prefs: () => prefs, falar, parar, lerRespostas, gravar, transcrever, microfone: !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined' };
  })();
