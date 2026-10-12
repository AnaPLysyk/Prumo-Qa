/** Consulta os tipos de tickets Jira. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  async function tiposJira(e) {
    const m = memoria('jira-meta', e.id);
    if (!m.tipos) { const r = await api.servicoConsultar(e.id, 'jira', 'metadados'); m.tipos = r.ok ? (r.data.dados || []).filter((t) => !t.subtarefa) : []; m.erro = r.ok ? null : r.error; }
    return m;
  }
