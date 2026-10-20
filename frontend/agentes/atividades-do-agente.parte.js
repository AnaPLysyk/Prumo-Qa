/** Agentes: mostra as orquestrações e atualiza as atividades do projeto. */
    async function mostrarOrquestracoes(alvo) {
      const nomeDe = (id) => s.especializacoes?.find?.((x) => x.id === id)?.rotulo || id;
      const ROTULO = { CONCLUIDA: 'Concluída', PARCIAL: 'Parcial', FALHOU: 'Falhou', SEM_DADOS: 'Sem dados' }; const rotulo = (x) => tr(ROTULO[x] || x);
      const r = await chamarSemAviso(() => api.agentesOrquestracoes(e.id)); if (estado.aba !== 'agentes') return;
      if (!r) { alvo.replaceChildren(note(tr('Orquestrações indisponíveis.'))); return 0; }
      const itens = r.orquestracoes.slice(0, 8);
      const titulo = h('h3', { class: 'v36a-orq-titulo' }, tr('Orquestrações recentes'), h('small', {}, tr('{n} registradas', { n: r.orquestracoes.length })));
      if (!itens.length) { alvo.replaceChildren(titulo, note(tr('Nenhuma ainda. Quando uma pergunta envolve duas ou mais especialidades, o orquestrador consulta cada uma e registra as etapas aqui.'))); return 0; }
      alvo.replaceChildren(titulo, h('ol', { class: 'v36a-orq-lista' }, itens.map((o) => h('li', { class: 'v36a-orq-item', 'data-estado': o.estado, 'data-orquestracao': o.id },
        h('button', { type: 'button', class: 'v36a-orq-abrir', onclick: () => caixa(tr('Orquestração · {quando}', { quando: hora(o.em) }), [note(tr('Registro local de metadados: agentes, ordem, tempos, fontes e falhas. A pergunta e as respostas não foram gravadas. As etapas são independentes.')), h('pre', {}, JSON.stringify(o, null, 2))]) },
          h('span', { class: 'v36a-orq-quando' }, hora(o.em)), h('strong', {}, rotulo(o.estado)), h('span', { class: 'v36a-orq-tempo' }, o.duracaoMs + ' ms')),
        h('ol', { class: 'v36a-orq-etapas' }, o.etapas.map((et) => h('li', { 'data-estado': et.estado }, h('span', { 'data-i18n-ignore': '' }, et.ordem + '. ' + nomeDe(et.agente)), ' · ', rotulo(et.estado), ' · ' + et.duracaoMs + ' ms', et.fontes.length ? h('small', {}, ' · ' + et.fontes.join(', ')) : null)))))));
      return itens.length;
    }
    async function activity() {
      painelVivo?.parar();
      const host = h('div', { class: 'v36a-painel' });
      const orq = h('section', { class: 'v36a-orq', id: 'v36-orquestracoes', 'aria-label': tr('Orquestrações recentes') }, note(tr('Carregando orquestrações…')));
      body.replaceChildren(h('div', { class: 'v36a-topo v36a-topo-painel' }, h('div', {}, h('h2', { class: 'v36a-titulo', title: tr('Clientes, agentes e o worker trabalhando, em tempo real. Só aparecem ligações que os registros deste computador comprovam.') }, tr('Painel de atividades')), h('p', { class: 'v36-sr' }, tr('Clientes, agentes e o worker trabalhando, em tempo real. Só aparecem ligações que os registros deste computador comprovam.')))), host);
      painelVivo = PrumoPainelAtividades.montar(host, {
        lateral: { rotulo: tr('Orquestrações'), conteudo: orq },
        reduzido, ativo: () => activeTab === 'activity' && estado.aba === 'agentes' && estado.espaco?.id === e.id,
        carregar: async () => {
          const root = estado.root;
          const [hist, roster, execs] = await Promise.all([root ? chamarSemAviso(() => api.historico(root, { limit: 1000 })) : null, chamarSemAviso(() => api.assistenteAgentes(e.id)), chamarSemAviso(() => api.execucoes({ espacoId: e.id, limite: 200 }))]);
          const agentes = roster?.agentes || [];
          const conversas = (await Promise.all(agentes.map((a) => chamarSemAviso(() => api.conversasListar(e.id, a.id)).then((l) => (l || []).map((c) => ({ ...c, fontes: c.fontes.map(f => typeof f === 'string' ? f : f.rotulo), agenteNome: a.nome })))))).flat();
          if (!hist && !execs && !conversas.length) return null;
          const avisos = [!hist ? tr('Histórico do núcleo indisponível.') : null, hist && !hist.complete ? tr('Histórico parcial: registros inválidos excluídos.') : null, !execs ? tr('Execuções indisponíveis.') : null].filter(Boolean);
          return { atividades: hist?.activities || [], conversas, agentes, execucoes: execs?.execucoes || [], totalExecucoes: execs?.total, avisos };
        },
        abrirAtividade: activityDetails,
        abrirConversa: (c) => caixa((c.semTexto ? 'Atendimento · ' : 'Conversa · ') + (c.agenteNome || c.agente), [note(c.semTexto ? 'Registro local de metadados. A pergunta e a resposta não foram gravadas.' : tr('Gravada somente neste computador. Resposta {m}.', { m: c.modo === 'LOCAL' ? tr('local, sem modelo de IA') : c.modo })), h('pre', {}, JSON.stringify({ em: c.em, agente: c.agente, ...(c.semTexto ? { avaliacao: c.avaliacao } : { pergunta: c.pergunta, resposta: c.linhas }), fontes: c.fontes, modo: c.modo }, null, 2))]),
        abrirExecucao: (x) => caixa(tr('Execução {r}', { r: x.rotina }), [note(tr('Registro da fila do worker. Evidência e logs completos ficam em Testes › Runs.')), h('pre', {}, JSON.stringify(x, null, 2)), button(tr('Abrir Runs'), () => { document.querySelector('.v36-dialog[open]')?.close(); void mostrar('runs'); })]),
        abrirTela: (aba) => mostrar(aba)
      });
      const vivo = painelVivo; mostrarOrquestracoes(orq).then((n) => { if (n && painelVivo === vivo) vivo.abrirLateral(true); }).catch(() => avisar(tr('Não foi possível mostrar as orquestrações.')));
    }
    void list();
  };

  // ---------------- Ajustes: Sistema (tema, idioma, cor) e Assistente (nome, estilo, voz, IA externa) ----------------
