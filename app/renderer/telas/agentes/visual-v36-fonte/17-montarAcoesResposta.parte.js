/** Monta os controles disponiveis para cada resposta. Parte visual de interfaces-v36.js; nao carregar separadamente. */
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
