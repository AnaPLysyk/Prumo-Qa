/** Mostra referencias e vinculos. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  abas.rastreabilidade = async (el) => {
    const e = estado.espaco; const sub = estado.sub?.rastreabilidade === 'vinculos' ? 'vinculos' : 'mapa';
    if (!e) { el.append(DS.cabecalho({ titulo: 'Rastreabilidade' }), barraSub('rastreabilidade', [['mapa', 'Trilha'], ['vinculos', 'Relações']], sub), h('div', { id: 'sub-conteudo' }, DS.estadoTela('vazio', 'Nenhum projeto selecionado', 'Selecione ou crie um projeto para continuar.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))]))); return; }
    const espacos = (await chamar(api.espacos)) || [];
    el.append(DS.cabecalho({ titulo: 'Rastreabilidade', descricao: 'Ticket → caso → automação → execução → evidência → defeito. Somente vínculos declarados, registrados por fluxos do Prumo, observados em execuções ou lidos estaticamente no código.',
      acoes: [DS.acao('Declarar vínculo', () => declarar(e), { id: 'rastro-declarar', primaria: true, icone: 'vinculo' })] }), barraSub('rastreabilidade', [['mapa', 'Trilha'], ['vinculos', 'Relações']], sub));
    const m = await chamar(() => api.vinculosMapa(e.id)); if (!m) return el.append(DS.falhaConsulta('rastreabilidade'));
    const corpo = h('div', { id: 'sub-conteudo' }); el.append(corpo);
    for (const aviso of m.avisos || []) corpo.append(DS.alerta(aviso, 'aviso'));
    const projSel = espacos.length > 1 ? DS.selecao({ id: 'rastro-projeto', rotulo: 'Projeto', opcoes: espacos.map((x) => [x.id, x.nome]), valor: e.id, aoMudar: (v) => { const x = espacos.find((y) => y.id === v); if (x) { estado.espaco = x; estado.root = x.raizContextos; salvarRaiz(); mostrar('rastreabilidade'); } } }) : null;
    if (sub === 'vinculos') return relacoes(e, m, corpo, projSel);
    trilha(e, m, corpo, projSel);
  };
