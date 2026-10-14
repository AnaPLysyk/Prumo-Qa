/** Reúne trecho visual da função rastreabilidade para o bundle fluxos-v40. */
  // 2.13: sem tela própria. Os vínculos declarados ficam em Testes › Vínculos; a trilha por tickets e execuções sai (Logs e Runs já mostram o que rodou).
  async function telaVinculos(e, mem, corpo) {
    const m = await chamar(() => api.vinculosMapa(e.id)); if (!m) { corpo.append(DS.falhaConsulta('vínculos')); return; }
    for (const aviso of m.avisos || []) corpo.append(DS.alerta(aviso, 'aviso'));
    relacoes(e, m, corpo, null);
  }
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
  function relacoes(e, m, corpo, projSel) {
    const origemTxt = { DECLARADO_PELO_USUARIO: 'Declarado por você', REGISTRADO_PELO_PRUMO: 'Registrado pelo Prumo', OBSERVADO: 'Observado em execução', OBSERVADO_NO_CODIGO: 'Lido no código · sem execução' };
    const { nos } = grafo(m); const nome = (id) => nos.get(id);
    corpo.append(projSel ? DS.barra(projSel) : null, h('p', { class: 'adm-origem' }, DS.info(m.aviso, { id: 'vinc-aviso', rotulo: 'O que estas relações provam' })));
    corpo.append(DS.secao(tr('Relações ({n})', { n: m.arestas.length }), m.arestas.length ? DS.tabela({ id: 'vinc-tabela', colunas: ['De', 'Relação', 'Para', 'Origem'], linhas: m.arestas.map((a) => ({ celulas: [botaoNo(e, nome(a.de) || { id: a.de, tipo: 'prumo', rotulo: a.de }), a.tipo + (a.nota ? ' · ' + a.nota : ''), botaoNo(e, nome(a.para) || { id: a.para, tipo: 'prumo', rotulo: a.para }), DS.chip(origemTxt[a.origem], a.origem === 'OBSERVADO' ? 'ok' : null)] })) }) : DS.estadoTela('vazio', 'Nenhuma relação ainda.', null, [], { compacto: true })));
    corpo.append(DS.secao('Lacunas de cadastro', m.lacunas.length ? h('ul', { id: 'vinc-lacunas', class: 'ds-lista' }, m.lacunas.map((l) => h('li', {}, l.mensagem))) : h('p', { class: 'suave' }, tr('Nenhuma lacuna de cadastro encontrada.'))));
    corpo.append(DS.secao('Operações externas recentes', m.operacoesRecentes.length ? h('ul', { id: 'vinc-operacoes', class: 'ds-lista' }, m.operacoesRecentes.map((o) => h('li', {}, seloOp(o.estado), ' ', o.resumo, h('span', { class: 'ds-sub' }, hora(o.em) + (o.remoto?.chave ? ' · ' + o.remoto.chave : ''))))) : h('p', { class: 'suave' }, tr('Nenhuma operação externa registrada.'))));
  }
  function declarar(e) {
    const vj = vinc(e, 'jira'), vq = vinc(e, 'qase'); const recarregar = () => { DS.fecharModal(); (estado.sub ||= {}).testes = 'repositorio'; void mostrar('testes'); };
    const ticket = h('input', { id: 'rastro-ticket', placeholder: 'SMART-1', maxlength: 40 }), caso = h('input', { id: 'rastro-caso', placeholder: '31', maxlength: 20 }), porque = h('input', { id: 'rastro-justificativa', maxlength: 1000 });
    const vcaso = h('input', { id: 'vinc-caso', type: 'number', min: 1 }), vcap = h('input', { id: 'vinc-cap', maxlength: 100, placeholder: 'unit ou unit#C1' }), vjust = h('input', { id: 'vinc-just', maxlength: 500, value: tr('Declarado pela pessoa') });
    const [nav, painel] = DS.abasModal([
      ['tc', tr('Ticket ↔ caso'), null, () => (vj && vq ? [h('p', { class: 'suave' }, tr('O Prumo confere o ticket e o caso nos projetos vinculados antes de registrar.')), h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Chave do ticket', ticket), DS.campo('ID do caso no Qase', caso), DS.campo('Justificativa', porque, { inteiro: true }), h('div', { class: 'ds-form-acoes' }, DS.acao('Conferir origens e declarar vínculo', async () => {
        const t = await chamar(() => api.servicoConsultar(e.id, 'jira', 'ticket', {}, ticket.value.trim().toUpperCase())); if (!t) return; const c = await chamar(() => api.servicoConsultar(e.id, 'qase', 'caso', {}, caso.value.trim())); if (!c) return;
        const r = await chamar(() => api.espacoAssociar(e.id, { de: { tipo: 'jira', id: ticket.value.trim().toUpperCase(), vinculoId: vj.id, origem: t.origem }, para: { tipo: 'qase', id: String(c.dados.id), vinculoId: vq.id, origem: c.origem }, justificativa: porque.value })); if (r) { avisar(tr('Vínculo declarado.')); void recarregar(); } }, { id: 'rastro-salvar', primaria: true })))] : [DS.estadoTela('vazio', 'Vincule Jira e Qase deste projeto para declarar uma associação ticket–caso.', null, [DS.acao('Abrir Conexões', () => { DS.fecharModal(); void mostrar('conexoes'); })], { compacto: true })])],
      ['ca', tr('Caso → automação'), null, () => (vq ? [h('p', { class: 'suave' }, tr('Cenário do Qase → automação declarada no qa.project.json (capability ou capability#cenário).')), h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('ID do caso no Qase', vcaso), DS.campo('Capability ou capability#cenário', vcap), DS.campo('Justificativa', vjust, { inteiro: true }), h('div', { class: 'ds-form-acoes' }, DS.acao('Declarar vínculo', async () => {
        const r = await chamar(() => api.espacoAssociar(e.id, { de: { tipo: 'qase', id: String(vcaso.value), vinculoId: vq.id, origem: vq.recurso.chave }, para: { tipo: 'automacao', id: vcap.value.trim(), origem: 'qa.project.json' }, justificativa: vjust.value })); if (r) { avisar(tr('Vínculo declarado.')); recarregar(); } }, { id: 'vinc-salvar', primaria: true })))] : [DS.estadoTela('vazio', 'Vincule o Qase primeiro.', null, [], { compacto: true })])]
    ]);
    DS.modal('Declarar vínculo', [nav, painel, DS.info('Um vínculo declarado registra a sua decisão. Não comprova cobertura nem execução.')], { tamanho: 'md' });
  }
