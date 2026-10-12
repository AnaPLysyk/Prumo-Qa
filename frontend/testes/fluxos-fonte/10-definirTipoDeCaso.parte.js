/** Classifica visualmente o tipo de caso Qase. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  const tipoCaso = (c) => { if (typeof c.isManual === 'boolean') return c.isManual ? (c.isToBeAutomated ? 'planejado' : 'manual') : 'automatizado'; return ({ 0: 'manual', 1: 'planejado', 2: 'automatizado' })[c.automation] || 'indefinido'; };
  const rotuloTipoCaso = { manual: 'Manual', planejado: 'Automação planejada', automatizado: 'Automatizado', indefinido: 'Não informado' };
  const chipTipoCaso = (c) => { const t = tipoCaso(c); return DS.chip(rotuloTipoCaso[t], t === 'automatizado' ? 'info' : t === 'planejado' ? 'aviso' : null); };
  const resultadosLocais = (runs, casoId) => runs.flatMap((r) => r.casos.filter((c) => c.casoId === Number(casoId) && c.resultado).map((c) => ({ run: r, ...c.resultado })));
  const ticketsExternos = (c) => (Array.isArray(c.external_issues) ? c.external_issues.flatMap((x) => (x.issues || []).map((i) => i.id)) : []);
