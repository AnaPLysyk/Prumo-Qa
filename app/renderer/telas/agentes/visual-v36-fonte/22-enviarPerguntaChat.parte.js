/** Envia uma pergunta pelo fluxo permitido do assistente. Parte visual de interfaces-v36.js; nao carregar separadamente. */
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
        await falar(r.linhas.length ? r.linhas : [tr('Não encontrei nada sobre isso nos dados locais deste projeto.')], fontes, r.proximos || [], r.agente.nome + ' · ' + meio);
        if (v === versao) controlesResposta(r, pergunta);
      } catch { fim(); avisar(tr('Falha ao consultar o assistente local.'), true); } finally { enviar.disabled = false; }
    }
