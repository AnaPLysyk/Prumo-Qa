/** Mostra como agentes aparecem no painel de código. Parte de testes-v40.js; nao carregar isoladamente. */
  function agentesNoCodigo(e) {
    const linha = h('div', { class: 'ds-fontes', id: 'ide-agentes', 'aria-live': 'polite' }, h('span', {}, DS.carregando('Consultando permissões dos agentes…')));
    api.agentesEstado(e.id).then((r) => {
      if (!r.ok) { linha.replaceChildren(h('span', { class: 'suave' }, tr('Permissões dos agentes indisponíveis.'))); return; }
      const m = new Map(r.data.matriz.map((c) => [c.id, c])); const rot = { PERMITIDO: 'permitido', EXIGE_AUTORIZACAO: 'exige autorização', BLOQUEADO: 'bloqueado', SOMENTE_PESSOA: 'somente pessoa' };
      const item = (id, texto) => { const c = m.get(id); if (!c) return null; return h('span', { title: c.motivo || '' }, DS.icone(c.estado === 'BLOQUEADO' ? 'cadeado' : 'escudo'), tr(texto), ': ', h('strong', {}, tr(rot[c.estado] || c.estado))); };
      linha.replaceChildren(h('span', {}, h('strong', {}, tr('Agentes neste código'))), item('consultar_contexto', 'ler contexto'), item('propor_casos', 'propor casos'), item('executar_testes', 'executar testes'), item('github_escrita', 'branch, commit e PR'), DS.link('Ajustar em Agentes', () => mostrar('agentes'), { seta: true }));
    });
    return linha;
  }
  /** Bloco "Código que implementa" no modal do caso (usa o catálogo já carregado ou carrega). */
