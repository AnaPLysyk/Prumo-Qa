/** Reúne trecho visual da função rastreabilidade para o bundle fluxos-v40. */
  abas.rastreabilidade = async (el) => {
    const e = estado.espaco; const sub = estado.sub?.rastreabilidade === 'vinculos' ? 'vinculos' : 'mapa';
    if (!e) { el.append(DS.cabecalho({ titulo: 'Rastreabilidade' }), barraSub('rastreabilidade', [['mapa', 'Trilha'], ['vinculos', 'Relações']], sub), h('div', { id: 'sub-conteudo' }, DS.estadoTela('vazio', 'Nenhum projeto selecionado', 'Selecione ou crie um projeto para continuar.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))]))); return; }
    const espacos = (await chamar(api.espacos)) || [];
    el.append(DS.cabecalho({ titulo: 'Rastreabilidade', descricao: 'Ticket → caso → automação → execução → evidência → defeito.',
      acoes: [DS.acao('Declarar vínculo', () => declarar(e), { id: 'rastro-declarar', primaria: true, icone: 'vinculo' })] }), barraSub('rastreabilidade', [['mapa', 'Trilha'], ['vinculos', 'Relações']], sub));
    const m = await chamar(() => api.vinculosMapa(e.id)); if (!m) return el.append(DS.falhaConsulta('rastreabilidade'));
    const corpo = h('div', { id: 'sub-conteudo' }); el.append(corpo);
    for (const aviso of m.avisos || []) corpo.append(DS.alerta(aviso, 'aviso'));
    const projSel = espacos.length > 1 ? DS.selecao({ id: 'rastro-projeto', rotulo: 'Projeto', opcoes: espacos.map((x) => [x.id, x.nome]), valor: e.id, aoMudar: (v) => { const x = espacos.find((y) => y.id === v); if (x) { estado.espaco = x; estado.root = x.raizContextos; salvarRaiz(); mostrar('rastreabilidade'); } } }) : null;
    if (sub === 'vinculos') return relacoes(e, m, corpo, projSel);
    trilha(e, m, corpo, projSel);
  };
  function grafo(m) {
    const nos = new Map(m.nos.map((n) => [n.id, n])); const viz = new Map();
    for (const a of m.arestas) for (const [x, y] of [[a.de, a.para], [a.para, a.de]]) { if (!viz.has(x)) viz.set(x, []); viz.get(x).push({ id: y, aresta: a }); }
    const vizinhos = (id, tipos) => (viz.get(id) || []).filter((v) => tipos.includes(nos.get(v.id)?.tipo));
    return { nos, vizinhos };
  }
  const refDoNo = (n) => { const [tipo, ...resto] = n.id.split(':'); const id = resto[0] ?? n.id; return { tipo: n.tipo === 'run' ? 'run' : tipo, id }; };
  function botaoNo(e, n, origem) {
    const ref = refDoNo(n); const servico = servicoDoTipo[n.tipo] || 'prumo'; const desat = n.estado === 'DESATUALIZADO';
    const abrir = { jira: () => abrirTicket(e, ref.id), 'jira-bug': () => abrirTicket(e, ref.id), qase: () => abrirCaso(e, ref.id), 'qase-defeito': () => abrirDefeito(e, ref.id), evidencia: () => window.PrumoOperacao?.abrirEvidencia(e, ref.id), run: () => abrirRunLocal(e, ref.id, false) }[n.tipo];
    const texto = n.tipo === 'jira' ? ref.id : n.rotulo;
    if (!abrir) return h('span', { class: 'ds-no', 'data-servico': servico, 'data-origem': origem || null, title: n.detalhe || null }, h('i'), texto);
    const b = h('button', { type: 'button', class: 'ds-no', 'data-servico': servico, 'data-origem': origem || null, 'aria-label': tr('Abrir {t} {id}', { t: n.tipo, id: ref.id }), title: desat ? tr('Vínculo original removido; consulta não autorizada ao vínculo atual.') : (n.detalhe || null), disabled: desat }, h('i'), texto);
    if (!desat) b.addEventListener('click', abrir);
    return b;
  }
  function trilha(e, m, corpo, projSel) {
    const { nos, vizinhos } = grafo(m); const linhas = []; const usados = new Set();
    const colher = (ids, tipos) => { const out = new Map(); for (const id of ids) for (const v of vizinhos(id, tipos)) if (!out.has(v.id)) out.set(v.id, v); return [...out.values()]; };
    const montar = (ticket, casos) => {
      const base = [ticket?.id, ...casos.map((c) => c.id)].filter(Boolean);
      const autos = colher(casos.map((c) => c.id), ['automacao']); const evid = colher(base, ['evidencia']); const runs = colher(casos.map((c) => c.id), ['run']);
      const bugs = colher(base, ['jira-bug']); const defs = colher([...base, ...bugs.map((b) => b.id)], ['qase-defeito']);
      const origens = new Set([...casos, ...autos, ...evid, ...runs, ...bugs, ...defs].map((v) => v.aresta?.origem).filter(Boolean));
      for (const x of [ticket, ...casos, ...autos, ...bugs, ...defs].filter(Boolean)) usados.add(x.id);
      linhas.push({ ticket: ticket ? nos.get(ticket.id) : null, features: colher(autos.map((a) => a.id), ['feature']), casos, autos, execs: [...runs, ...evid], defs: [...bugs, ...defs], origens });
    };
    for (const t of m.nos.filter((n) => n.tipo === 'jira')) montar({ id: t.id }, vizinhos(t.id, ['qase']));
    for (const c of m.nos.filter((n) => n.tipo === 'qase' && !usados.has(n.id))) montar(null, [{ id: c.id, aresta: null }]);
    // Cenários sem Qase continuam visíveis na trilha estática da feature.
    for (const f of m.nos.filter((n) => n.tipo === 'feature')) {
      const autos = vizinhos(f.id, ['automacao']).filter((a) => !usados.has(a.id));
      if (!autos.length) continue;
      autos.forEach((a) => usados.add(a.id));
      linhas.push({ ticket: null, features: [{ id: f.id, aresta: null }], casos: [], autos, execs: [], defs: [], origens: new Set(autos.map((a) => a.aresta.origem)) });
    }
    // Defeito do Qase e bug do Jira relacionados ficam na mesma trilha; o que sobrar vira uma linha própria.
    for (const d of m.nos.filter((n) => (n.tipo === 'qase-defeito' || n.tipo === 'jira-bug') && !usados.has(n.id))) {
      if (usados.has(d.id)) continue; const juntos = [{ id: d.id, aresta: null }, ...vizinhos(d.id, ['qase-defeito', 'jira-bug']).filter((v) => !usados.has(v.id))];
      for (const x of juntos) usados.add(x.id); linhas.push({ ticket: null, casos: [], autos: [], execs: [], defs: juntos, origens: new Set(juntos.map((v) => v.aresta?.origem).filter(Boolean)) });
    }
    const mem = memoria('rastro', e.id); const busca = DS.busca({ id: 'rastro-busca', placeholder: 'Buscar ticket, caso, automação ou evidência', valor: estado.ds?.rastroBusca ?? mem.q ?? '', rotulo: 'Buscar relações' }); if (estado.ds) delete estado.ds.rastroBusca;
    const mostrarSel = DS.selecao({ id: 'rastro-filtro', rotulo: 'Mostrar', opcoes: [['', 'Todas as trilhas'], ['lacunas', 'Com vínculos ausentes'], ['observado', 'Com resultado observado']], valor: mem.filtro || '' });
    const area = h('div', { id: 'rastro-area' });
    const celula = (lista, origemPadrao) => (lista.length ? h('div', { class: 'ds-celula-nos' }, lista.map((v) => botaoNo(e, nos.get(v.id) || { id: v.id, tipo: 'prumo', rotulo: v.id }, v.aresta?.origem || origemPadrao))) : h('span', { class: 'ds-falta' }, tr('ausente')));
    const textoLinha = (l) => [l.ticket, ...[...(l.features || []), ...l.casos, ...l.autos, ...l.execs, ...l.defs].map((v) => nos.get(v.id))].filter(Boolean).map((n) => n.rotulo + ' ' + n.id + ' ' + (n.detalhe || '')).join(' ').toLowerCase();
    const desenhar = () => {
      const q = busca.input.value.trim().toLowerCase(); mem.q = busca.input.value; mem.filtro = mostrarSel.value;
      const vis = linhas.filter((l) => (!q || textoLinha(l).includes(q)) && (mostrarSel.value !== 'lacunas' || !l.ticket || !l.casos.length || !l.autos.length || !l.execs.length) && (mostrarSel.value !== 'observado' || l.origens.has('OBSERVADO')));
      if (!linhas.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhuma relação registrada', 'Declare vínculos entre tickets e casos, ou execute fluxos do Prumo para registrar resultados.', [DS.acao('Declarar vínculo', () => declarar(e))])); return; }
      if (!vis.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhuma trilha para estes filtros')); return; }
      area.replaceChildren(DS.tabela({ id: 'rastro-tabela', colunas: ['Ticket', 'Feature', 'Caso', 'Automação', 'Execução · evidência', 'Defeito', 'Comprovação'], linhas: vis.map((l) => ({ attrs: { 'data-relacao-navegavel': '' }, celulas: [l.ticket ? botaoNo(e, l.ticket) : h('span', { class: 'ds-falta' }, tr('sem ticket')), celula(l.features || [], 'OBSERVADO_NO_CODIGO'), celula(l.casos, 'DECLARADO_PELO_USUARIO'), celula(l.autos), celula(l.execs), l.defs.length ? celula(l.defs) : '—',
        l.origens.has('OBSERVADO') ? DS.chip('Resultado observado', 'ok') : l.origens.has('OBSERVADO_NO_CODIGO') ? DS.chip('Lido no código · sem execução', 'info') : l.origens.size ? DS.chip(l.origens.has('REGISTRADO_PELO_PRUMO') ? 'Registrado pelo Prumo' : 'Declarado', 'info') : DS.chip('Sem comprovação')] })) }),
        h('div', { class: 'ds-legenda' }, h('span', { class: 'ds-no', 'data-origem': 'DECLARADO_PELO_USUARIO' }, tr('declarado pela pessoa')), h('span', { class: 'ds-no', 'data-origem': 'REGISTRADO_PELO_PRUMO' }, tr('registrado pelo Prumo')), h('span', { class: 'ds-no', 'data-origem': 'OBSERVADO' }, tr('observado em execução')), h('span', { class: 'ds-no', 'data-origem': 'OBSERVADO_NO_CODIGO' }, tr('lido no código · sem execução')), h('span', {}, tr('Vínculo declarado não comprova cobertura nem aprovação.'))));
    };
    busca.input.addEventListener('input', desenhar); mostrarSel.addEventListener('change', desenhar);
    corpo.append(DS.barra(busca.no, mostrarSel, projSel, h('span', { class: 'ds-meta-barra' }, tr('{n} trilha(s) · {l} lacuna(s)', { n: linhas.length, l: m.lacunas.length }))), area);
    if (m.lacunas.length) corpo.append(DS.secao(tr('Vínculos ausentes ({n})', { n: m.lacunas.length }), h('ul', { class: 'ds-lista', id: 'rastro-lacunas' }, m.lacunas.map((l) => h('li', {}, l.mensagem)))));
    desenhar();
  }
  function relacoes(e, m, corpo, projSel) {
    const origemTxt = { DECLARADO_PELO_USUARIO: 'Declarado por você', REGISTRADO_PELO_PRUMO: 'Registrado pelo Prumo', OBSERVADO: 'Observado em execução', OBSERVADO_NO_CODIGO: 'Lido no código · sem execução' };
    const { nos } = grafo(m); const nome = (id) => nos.get(id);
    corpo.append(projSel ? DS.barra(projSel) : null, h('div', { id: 'vinc-aviso', class: 'ds-alerta' }, DS.icone('escudo'), h('div', {}, m.aviso)));
    corpo.append(DS.secao(tr('Relações ({n})', { n: m.arestas.length }), m.arestas.length ? DS.tabela({ id: 'vinc-tabela', colunas: ['De', 'Relação', 'Para', 'Origem'], linhas: m.arestas.map((a) => ({ celulas: [botaoNo(e, nome(a.de) || { id: a.de, tipo: 'prumo', rotulo: a.de }), a.tipo + (a.nota ? ' · ' + a.nota : ''), botaoNo(e, nome(a.para) || { id: a.para, tipo: 'prumo', rotulo: a.para }), DS.chip(origemTxt[a.origem], a.origem === 'OBSERVADO' ? 'ok' : null)] })) }) : DS.estadoTela('vazio', 'Nenhuma relação ainda.', null, [], { compacto: true })));
    corpo.append(DS.secao('Lacunas de cadastro', m.lacunas.length ? h('ul', { id: 'vinc-lacunas', class: 'ds-lista' }, m.lacunas.map((l) => h('li', {}, l.mensagem))) : h('p', { class: 'suave' }, tr('Nenhuma lacuna de cadastro encontrada.'))));
    corpo.append(DS.secao('Operações externas recentes', m.operacoesRecentes.length ? h('ul', { id: 'vinc-operacoes', class: 'ds-lista' }, m.operacoesRecentes.map((o) => h('li', {}, seloOp(o.estado), ' ', o.resumo, h('span', { class: 'ds-sub' }, hora(o.em) + (o.remoto?.chave ? ' · ' + o.remoto.chave : ''))))) : h('p', { class: 'suave' }, tr('Nenhuma operação externa registrada.'))));
  }
  function declarar(e) {
    const vj = vinc(e, 'jira'), vq = vinc(e, 'qase'); const recarregar = () => { DS.fecharModal(); mostrar('rastreabilidade'); };
    const ticket = h('input', { id: 'rastro-ticket', placeholder: 'SMART-1', maxlength: 40 }), caso = h('input', { id: 'rastro-caso', placeholder: '31', maxlength: 20 }), porque = h('input', { id: 'rastro-justificativa', maxlength: 1000 });
    const vcaso = h('input', { id: 'vinc-caso', type: 'number', min: 1 }), vcap = h('input', { id: 'vinc-cap', maxlength: 100, placeholder: 'unit ou unit#C1' }), vjust = h('input', { id: 'vinc-just', maxlength: 500, value: tr('Declarado pela pessoa') });
    const [nav, painel] = DS.abasModal([
      ['tc', tr('Ticket ↔ caso'), null, () => (vj && vq ? [h('p', { class: 'suave' }, tr('O Prumo confere o ticket e o caso nos projetos vinculados antes de registrar.')), h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Chave do ticket', ticket), DS.campo('ID do caso no Qase', caso), DS.campo('Justificativa', porque, { inteiro: true }), h('div', { class: 'ds-form-acoes' }, DS.acao('Conferir origens e declarar vínculo', async () => {
        const t = await chamar(() => api.servicoConsultar(e.id, 'jira', 'ticket', {}, ticket.value.trim().toUpperCase())); if (!t) return; const c = await chamar(() => api.servicoConsultar(e.id, 'qase', 'caso', {}, caso.value.trim())); if (!c) return;
        const r = await chamar(() => api.espacoAssociar(e.id, { de: { tipo: 'jira', id: ticket.value.trim().toUpperCase(), vinculoId: vj.id, origem: t.origem }, para: { tipo: 'qase', id: String(c.dados.id), vinculoId: vq.id, origem: c.origem }, justificativa: porque.value })); if (r) { avisar(tr('Vínculo declarado.')); recarregar(); } }, { id: 'rastro-salvar', primaria: true })))] : [DS.estadoTela('vazio', 'Vincule Jira e Qase deste projeto para declarar uma associação ticket–caso.', null, [DS.acao('Abrir Conexões', () => { DS.fecharModal(); mostrar('conexoes'); })], { compacto: true })])],
      ['ca', tr('Caso → automação'), null, () => (vq ? [h('p', { class: 'suave' }, tr('Cenário do Qase → automação declarada no qa.project.json (capability ou capability#cenário).')), h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('ID do caso no Qase', vcaso), DS.campo('Capability ou capability#cenário', vcap), DS.campo('Justificativa', vjust, { inteiro: true }), h('div', { class: 'ds-form-acoes' }, DS.acao('Declarar vínculo', async () => {
        const r = await chamar(() => api.espacoAssociar(e.id, { de: { tipo: 'qase', id: String(vcaso.value), vinculoId: vq.id, origem: vq.recurso.chave }, para: { tipo: 'automacao', id: vcap.value.trim(), origem: 'qa.project.json' }, justificativa: vjust.value })); if (r) { avisar(tr('Vínculo declarado.')); recarregar(); } }, { id: 'vinc-salvar', primaria: true })))] : [DS.estadoTela('vazio', 'Vincule o Qase primeiro.', null, [], { compacto: true })])]
    ]);
    DS.modal('Declarar vínculo', [nav, painel, DS.alerta('Um vínculo declarado registra a sua decisão. Não comprova cobertura nem execução.', null, 'escudo')], { tamanho: 'md' });
  }
