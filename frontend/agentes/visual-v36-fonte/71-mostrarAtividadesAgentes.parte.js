/** Mostra as atividades e evidencias dos agentes. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    async function activity() {
      painelVivo?.parar();
      const quieto = async (fn) => { try { const r = await fn(); return r && r.ok ? r.data : null; } catch { return null; } };
      const host = h('div', { class: 'v36a-painel' });
      body.replaceChildren(h('div', { class: 'v36a-topo' }, h('div', {}, h('h2', { class: 'v36a-titulo' }, tr('Painel de atividades')), h('p', {}, tr('Clientes, agentes e o worker trabalhando, em tempo real. Só aparecem ligações que os registros deste computador comprovam.')))), host);
      painelVivo = PrumoPainelAtividades.montar(host, {
        reduzido, ativo: () => activeTab === 'activity' && estado.aba === 'agentes' && estado.espaco?.id === e.id,
        carregar: async () => {
          const root = estado.root;
          const [hist, roster, execs] = await Promise.all([root ? quieto(() => api.historico(root, { limit: 1000 })) : null, quieto(() => api.assistenteAgentes(e.id)), quieto(() => api.execucoes({ espacoId: e.id, limite: 200 }))]);
          const agentes = roster?.agentes || [];
          const conversas = (await Promise.all(agentes.map((a) => quieto(() => api.conversasListar(e.id, a.id)).then((l) => (l || []).map((c) => ({ ...c, fontes: c.fontes.map(f => typeof f === 'string' ? f : f.rotulo), agenteNome: a.nome })))))).flat();
          if (!hist && !execs && !conversas.length) return null;
          const avisos = [!hist ? tr('Histórico do núcleo indisponível.') : null, hist && !hist.complete ? tr('Histórico parcial: registros inválidos excluídos.') : null, !execs ? tr('Execuções indisponíveis.') : null].filter(Boolean);
          return { atividades: hist?.activities || [], conversas, agentes, execucoes: execs?.execucoes || [], totalExecucoes: execs?.total, avisos };
        },
        abrirAtividade: activityDetails,
        abrirConversa: (c) => caixa((c.semTexto ? 'Atendimento · ' : 'Conversa · ') + (c.agenteNome || c.agente), [note(c.semTexto ? 'Registro local de metadados. A pergunta e a resposta não foram gravadas.' : tr('Gravada somente neste computador. Resposta {m}.', { m: c.modo === 'LOCAL' ? tr('local, sem modelo de IA') : c.modo })), h('pre', {}, JSON.stringify({ em: c.em, agente: c.agente, ...(c.semTexto ? { avaliacao: c.avaliacao } : { pergunta: c.pergunta, resposta: c.linhas }), fontes: c.fontes, modo: c.modo }, null, 2))]),
        abrirExecucao: (x) => caixa(tr('Execução {r}', { r: x.rotina }), [note(tr('Registro da fila do worker. Evidência e logs completos ficam em Execuções.')), h('pre', {}, JSON.stringify(x, null, 2)), button(tr('Abrir Execuções'), () => { document.querySelector('.v36-dialog[open]')?.close(); mostrar('execucoes'); })]),
        abrirTela: (aba) => mostrar(aba)
      });
    }
    list();
  };

  // ---------------- Ajustes: Sistema (tema, idioma, cor) e Assistente (nome, estilo, voz, IA externa) ----------------
