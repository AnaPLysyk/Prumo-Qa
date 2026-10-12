/** Monta as secoes da tela de Agentes. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  abas.agentes = async el => {
    el.classList.add('v36a'); espaco(el); el.append(h('h1', { class: 'v36-sr' }, 'Agentes'));
    const e = estado.espaco; if (!e) { el.append(h('div', { class: 'v36a-sem' }, note(tr('Selecione um projeto para consultar as especializações e configurar permissões.')))); const legacy = h('div'); await agentesLegado(legacy); legacy.querySelector('h1')?.remove(); el.append(legacy); return; }
    const s = await chamar(() => api.agentesEstado(e.id)); if (!s) return;
    let drafts = readDrafts(e.id); let activeTab = 'agents', painelVivo = null;
    const body = h('div', { id: 'v36-agents-body', class: 'v36a-corpo' });
    const tabs = h('div', { class: 'v36a-abas', role: 'group', 'aria-label': tr('Áreas de agentes') },
      h('button', { type: 'button', class: 'v36a-aba', 'data-agent-tab': 'agents', 'aria-pressed': 'true', onclick: () => showTab('agents') }, tr('Agentes')),
      h('button', { type: 'button', class: 'v36a-aba', 'data-agent-tab': 'activity', 'aria-pressed': 'false', onclick: () => showTab('activity') }, tr('Painel de atividades')));
    el.append(tabs, body);
    const habilitada = (id) => s.configuracao.especializacoes.includes(id);
    const capsDe = (x) => s.matriz.filter(c => x.capacidades?.includes(c.id));
