/** Consulta os agentes e suas especializacoes. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    async function carregarRoster() {
      const r = await chamar(() => api.assistenteAgentes(idAtual())); if (!r || !seletorAgente) return; roster = r;
      const atual = seletorAgente.value; seletorAgente.replaceChildren(h('option', { value: '' }, tr('Agente automático')), ...r.agentes.map((a) => h('option', { value: a.id }, a.nome))); seletorAgente.value = r.agentes.some((a) => a.id === atual) ? atual : '';
      const opcoes = [['local', tr('Local')], ...r.provedores.filter((p) => p.disponivel && p.autorizado).map((p) => [p.id, p.id === 'claude' ? 'Claude Code' : 'Codex'])];
      const atualP = seletorProvedor.value; seletorProvedor.replaceChildren(...opcoes.map(([v, t]) => h('option', { value: v }, t))); seletorProvedor.value = opcoes.some(([v]) => v === atualP) ? atualP : 'local'; seletorProvedor.hidden = opcoes.length < 2;
      rodapeTexto.textContent = opcoes.length > 1 ? tr('Agentes locais; Claude/Codex só quando você escolher.') : tr('Respostas com os dados deste computador, sem modelo de IA.');
    }
    const idAtual = () => estado.espaco?.id ?? null;
