/** Reúne trecho visual da função testes para o bundle fluxos-v40. */
  const tipoCaso = (c) => { if (typeof c.isManual === 'boolean') return c.isManual ? (c.isToBeAutomated ? 'planejado' : 'manual') : 'automatizado'; return ({ 0: 'manual', 1: 'planejado', 2: 'automatizado' })[c.automation] || 'indefinido'; };
  const rotuloTipoCaso = { manual: 'Manual', planejado: 'Automação planejada', automatizado: 'Automatizado', indefinido: 'Não informado' };
  const chipTipoCaso = (c) => { const t = tipoCaso(c); return DS.chip(rotuloTipoCaso[t], t === 'automatizado' ? 'info' : t === 'planejado' ? 'aviso' : null); };
  const resultadosLocais = (runs, casoId) => runs.flatMap((r) => r.casos.filter((c) => c.casoId === Number(casoId) && c.resultado).map((c) => ({ run: r, ...c.resultado })));
  const ticketsExternos = (c) => (Array.isArray(c.external_issues) ? c.external_issues.flatMap((x) => (x.issues || []).map((i) => i.id)) : []);
  async function abrirCaso(e, id) {
    if (id >= 1e9) { avisar(tr('Caso local: existe só neste computador, não no Qase.')); return; }
    const vq = vinc(e, 'qase'); if (!vq) { avisar(tr('Qase não vinculado a este projeto.'), true); return; }
    const carregando = DS.modal(tr('Caso {id}', { id }), DS.carregando('Consultando o Qase…'), { tamanho: 'lg' });
    const [r, runs, perm, aut] = await Promise.all([api.servicoConsultar(e.id, 'qase', 'caso', {}, String(id)), api.runs(e.id), escritaDoProjeto(e), api.espacoAutomacoes(e.id)]);
    if (carregando && !carregando.isConnected) return;
    if (!r.ok) { avisar(r.error, true); DS.modal(tr('Caso {id}', { id }), DS.estadoTela('erro', 'Não foi possível abrir o caso', r.error), { tamanho: 'md' }); return; }
    const c = r.data.dados; const esc = !!perm.qase; e = estado.espaco?.id === e.id ? estado.espaco : e;
    const locais = resultadosLocais(runs.ok ? runs.data : [], id).sort((a, b) => Date.parse(b.em) - Date.parse(a.em));
    const autos = relacoesDe(e, ['qase'], id).map((x) => outroLado(x, ['qase'], id)).filter((x) => x.tipo === 'automacao');
    const tks = [...new Set([...ticketsExternos(c), ...relacoesDe(e, ['qase'], id).map((x) => outroLado(x, ['qase'], id)).filter((x) => x.tipo === 'jira').map((x) => x.id)])];
    const passos = Array.isArray(c.steps) ? c.steps : []; const saida = h('div', { id: 'caso-saida' });
    const main = h('section', { class: 'ds-detalhe-main', id: 'caso-detalhe', 'data-caso': String(id) }, saida,
      DS.bloco('Descrição', DS.texto(c.description, 'Sem descrição.')),
      DS.bloco('Pré-condições', DS.texto(c.preconditions, 'Sem pré-condições.')),
      DS.bloco(tr('Passos ({n})', { n: passos.length }), passos.length ? DS.tabela({ colunas: ['#', 'Ação', 'Dados', 'Resultado esperado'], linhas: passos.map((p, i) => ({ celulas: [String(p.position ?? i + 1), DS.texto(p.action), p.data ? DS.texto(p.data) : '—', DS.texto(p.expected_result, '—')] })) }) : h('p', { class: 'suave' }, tr('Nenhum passo cadastrado.'))),
      c.postconditions ? DS.bloco('Pós-condições', DS.texto(c.postconditions)) : null,
      window.PrumoTestes ? window.PrumoTestes.blocoCodigoDoCaso(e, id) : null,
      DS.bloco('Resultados no Prumo', locais.length ? DS.tempo(locais.map((x) => ({ tom: DS.tom(x.status), titulo: h('span', {}, selo(x.status), ' ', x.run.titulo), sub: hora(x.em) + ' · ' + (x.origem === 'MANUAL' ? tr('declarado manualmente') : tr('execução de automação')) + (x.granularidade === 'RODADA' ? ' · ' + tr('escopo da rodada') : '') + (x.comentario ? ' · ' + x.comentario.slice(0, 160) : '') }))) : h('p', { class: 'suave' }, tr('Nenhum resultado registrado no Prumo para este caso.'))),
      DS.recolher('Dados retornados pelo Qase', h('pre', { class: 'ds-codigo' }, JSON.stringify(c, null, 2))));
    const capSel = h('select', { id: 'caso-cap', 'aria-label': tr('Automação') }, ((aut.ok && aut.data.capacidades) || []).map((x) => h('option', { value: x }, x)));
    const tkIn = h('input', { id: 'caso-ticket', class: 'ds-w-sm', placeholder: 'SMART-123', maxlength: 40, 'aria-label': tr('Ticket Jira') });
    const aside = h('aside', {}, DS.meta([['Origem', DS.origem('qase', 'Qase · ' + vq.recurso.chave)], ['Tipo de execução', chipTipoCaso(c)], ['Situação no Prumo', locais[0] ? h('span', {}, selo(locais[0].status), ' ', h('span', { class: 'suave' }, hora(locais[0].em))) : DS.chip('Sem resultado')], ['Suite', c.suite_id != null ? String(c.suite_id) : null], ['Prioridade', c.priority != null ? String(c.priority) : null], ['Severidade', c.severity != null ? String(c.severity) : null], ['Tags', (c.tags || []).map((x) => x.title || x).join(', ') || null], ['Atualizado', c.updated_at || c.updated ? hora(c.updated_at || c.updated) : null]]),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Automação relacionada')), e.pastaLocal ? DS.acao('Criar automação na IDE', () => { DS.fecharModal(); (memoriaDaTela('testes', e.id).ide = { novo: { casoId: id, titulo: c.title || '' } }); (estado.sub ||= {}).testes = 'ide'; void mostrar('testes'); }, { id: 'caso-criar-automacao', compacto: true }) : null, autos.length ? h('div', { class: 'ds-celula-nos' }, autos.map((a) => noRef(e, a, a.id))) : h('p', { class: 'suave' }, tr('Nenhuma automação declarada no Prumo.')),
        DS.info('Automação vinculada não aprova o caso: só um resultado registrado comprova a execução.'),
        capSel.options.length ? h('div', { class: 'ds-cab-acoes' }, capSel, DS.acao('Declarar', async () => { const x = await chamar(() => api.espacoAssociar(e.id, { de: { tipo: 'qase', id: String(id), vinculoId: vq.id, origem: vq.recurso.chave }, para: { tipo: 'automacao', id: capSel.value, origem: 'qa.project.json' }, justificativa: tr('Declarado pela pessoa') })); if (x) { await atualizarEspaco(e); avisar(tr('Vínculo declarado.')); void abrirCaso(estado.espaco, id); } }, { id: 'caso-declarar', compacto: true })) : null),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Tickets')), tks.length ? h('div', { class: 'ds-celula-nos' }, tks.map((k) => noRef(e, { tipo: 'jira', id: k, vinculoId: vinc(e, 'jira')?.id }, k))) : h('p', { class: 'suave' }, tr('Nenhum ticket associado.')),
        h('div', { class: 'ds-cab-acoes' }, tkIn, DS.acao('Associar…', async () => { resultadoOp(saida, await executarOperacao(e, 'qase.associar_ticket', { casoId: Number(id), ticket: tkIn.value.trim().toUpperCase() })); }, { id: 'caso-associar', compacto: true, desabilitado: !esc }))),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Ações')), DS.acao('Editar caso…', () => editarCaso(e, id, c), { id: 'caso-editar', icone: 'editar', desabilitado: !esc }), !esc ? escritaDesligada('qase') : null));
    DS.modal(tr('Caso {id}', { id }) + ' · ' + (c.title || ''), h('div', { class: 'ds-detalhe' }, main, aside), { tamanho: 'lg', subtitulo: [DS.origem('qase'), chipTipoCaso(c), locais[0] ? selo(locais[0].status) : DS.chip('Não executado no Prumo')] });
  }
  function editarCaso(e, id, c) {
    const tipo0 = tipoCaso(c) === 'planejado' ? 'a-automatizar' : tipoCaso(c) === 'automatizado' ? 'automatizado' : 'manual';
    const titulo = h('input', { id: 'caso-ed-titulo', maxlength: 255, value: c.title || '' }); const desc = h('textarea', { id: 'caso-ed-descricao', rows: 4, maxlength: 8000 }); desc.value = c.description || '';
    const pre = h('textarea', { id: 'caso-ed-pre', rows: 3, maxlength: 4000 }); pre.value = c.preconditions || '';
    const auto = h('select', { id: 'caso-ed-automacao' }, [['manual', 'Manual'], ['a-automatizar', 'Manual, a automatizar'], ['automatizado', 'Automatizado']].map(([v, txt]) => h('option', { value: v, selected: v === tipo0 }, tr(txt))));
    const passos = h('div', { id: 'caso-ed-passos', class: 'ds-lista' }); const linha = (p = {}) => { const a = h('input', { class: 'passo-acao', placeholder: tr('Ação'), maxlength: 2000, value: p.action || '', 'aria-label': tr('Ação') }); const d = h('input', { class: 'passo-dados', placeholder: tr('Dados'), maxlength: 2000, value: p.data || '', 'aria-label': tr('Dados') }); const x = h('input', { class: 'passo-esperado', placeholder: tr('Resultado esperado'), maxlength: 2000, value: p.expected_result || '', 'aria-label': tr('Resultado esperado') });
      const l = h('div', { class: 'ds-cab-acoes ds-passo-linha' }, a, d, x, h('button', { type: 'button', class: 'ds-icone-btn', 'aria-label': tr('Remover passo'), onclick: () => l.remove() }, DS.icone('fechar'))); for (const i of [a, d, x]) i.style.flex = '1'; passos.append(l); };
    for (const p of (c.steps?.length ? c.steps : [{}])) linha(p);
    const saida = h('div', { id: 'caso-ed-saida' });
    DS.modal(tr('Editar caso {id}', { id }), [DS.trilha([['Casos', () => DS.fecharModal()], [tr('Caso {id}', { id }), () => abrirCaso(e, id)], ['Editar']], { semAtual: false }), h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título', titulo, { inteiro: true }), DS.campo('Tipo de execução', auto), h('span'), DS.campo('Descrição', desc, { inteiro: true }), DS.campo('Pré-condições', pre, { inteiro: true }),
      h('div', { class: 'ds-campo inteiro' }, h('span', {}, tr('Passos')), passos, h('div', {}, DS.link('Adicionar passo', () => linha({}), { seta: false })))), saida,
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('Qase {p} · confirmação nativa antes de enviar', { p: vinc(e, 'qase')?.recurso.chave })), DS.acao('Salvar no Qase…', async () => {
        const p = { casoId: Number(id) }; if (titulo.value !== (c.title || '')) p.titulo = titulo.value; if (desc.value !== (c.description || '')) p.descricao = desc.value; if (pre.value !== (c.preconditions || '')) p.preCondicoes = pre.value; if (auto.value !== tipo0) p.automacao = auto.value;
        const novos = [...passos.children].map((l) => ({ acao: l.querySelector('.passo-acao').value, dados: l.querySelector('.passo-dados').value, esperado: l.querySelector('.passo-esperado').value })).filter((s) => s.acao.trim());
        const antigos = (c.steps || []).map((s) => ({ acao: s.action || '', dados: s.data || '', esperado: s.expected_result || '' })); if (JSON.stringify(novos) !== JSON.stringify(antigos)) p.passos = novos;
        if (Object.keys(p).length === 1) { saida.replaceChildren(DS.alerta('Nenhuma alteração para salvar.', 'aviso')); return; }
        const r = await executarOperacao(e, 'qase.editar_caso', p); if (r?.estado === 'CONFIRMADA') { delete memoriaDaTela('testes', e.id).casos; void abrirCaso(e, id); } else if (r) saida.replaceChildren(painelResultado(r));
      }, { id: 'caso-ed-salvar', primaria: true }))], { tamanho: 'md' });
  }

  // ======================= Testes =======================
  async function carregarQase(e, mem, op, pagina = { limite: 100 }) {
    const r = await api.servicoConsultar(e.id, 'qase', op, pagina);
    if (!r.ok) { avisar(r.error, true); return { erro: r.error, itens: [] }; }
    return { itens: Array.isArray(r.data.dados) ? r.data.dados : [], proxima: r.data.proxima, em: r.data.consultadoEm, limitacao: r.data.limitacao || null };
  }
  const fonteQase = (r, rotulo, mais) => h('div', { class: 'ds-fontes', 'aria-live': 'polite' }, r.erro ? h('span', { role: 'status' }, DS.origem('qase', 'Qase'), ' ', DS.chip(r.erro, 'falha')) : h('span', { role: 'status' }, DS.origem('qase', 'Qase'), tr('{n} {r} · consultado {q}', { n: r.itens.length, r: tr(rotulo), q: hora(r.em) }), r.proxima != null && mais ? DS.link('Carregar mais', mais, { seta: false }) : null));
  async function avancadaQase(e) {
    const caixa = h('div', { class: 'ds-avancada' }, DS.info('Consulta direta ao Qase vinculado: suites, casos, detalhe com passos e planos, com os dados retornados.'));
    DS.modal('Consulta avançada · Qase', caixa, { tamanho: 'lg' }); await consultaManual(caixa, 'qase', { suites: 'Suites', casos: 'Casos manuais e automatizados', caso: 'Detalhe e passos do caso', planos: 'Planos' });
  }
  // Com Qase vinculado a API remota é a fonte oficial; não criar cadastro concorrente de casos na máquina.
  // As propostas continuam disponíveis no modo local e para revisão de sugestões dos agentes.
  async function novoCasoQase(e) {
    const vq = vinc(e, 'qase'); if (!vq) { avisar(tr('Qase não vinculado a este projeto.'), true); return; }
    const leitura = await api.servicoConsultar(e.id, 'qase', 'suites', { limite: 100 });
    if (!leitura.ok) { avisar(tr('Não foi possível consultar as suites do Qase: ') + leitura.error, true); return; }
    const suites = Array.isArray(leitura.data.dados) ? leitura.data.dados : [];
    const vj = vinc(e, 'jira'); const titulo = h('input', { id: 'qase-novo-titulo', maxlength: 255, required: true });
    const desc = h('textarea', { id: 'qase-novo-descricao', rows: 3, maxlength: 8000 });
    const pre = h('textarea', { id: 'qase-novo-pre', rows: 2, maxlength: 4000 });
    const suite = h('select', { id: 'qase-novo-suite' }, h('option', { value: '' }, tr('Sem suite (raiz do projeto)')), suites.map(s => h('option', { value: String(s.id) }, (s.title || tr('Suite')) + ' · #' + s.id)));
    const auto = h('select', { id: 'qase-novo-automacao' }, [['manual', 'Manual'], ['a-automatizar', 'Manual, a automatizar'], ['automatizado', 'Automatizado']].map(([k, v]) => h('option', { value: k }, tr(v))));
    const ticket = vj ? h('input', { id: 'qase-novo-ticket', maxlength: 40, placeholder: vj.recurso.chave + '-123', 'aria-label': tr('Ticket Jira de origem') }) : null;
    const passos = h('div', { id: 'qase-novo-passos', class: 'ds-lista' });
    const linha = () => {
      const acao = h('input', { class: 'passo-acao', maxlength: 2000, placeholder: tr('Ação'), 'aria-label': tr('Ação') });
      const dados = h('input', { class: 'passo-dados', maxlength: 2000, placeholder: tr('Dados'), 'aria-label': tr('Dados') });
      const esperado = h('input', { class: 'passo-esperado', maxlength: 2000, placeholder: tr('Resultado esperado'), 'aria-label': tr('Resultado esperado') });
      const no = h('div', { class: 'ds-cab-acoes ds-passo-linha' }, acao, dados, esperado, DS.acao('Remover', () => no.remove(), { compacto: true }));
      passos.append(no);
    };
    linha();
    const saida = h('div', { id: 'qase-novo-saida', role: 'status', 'aria-live': 'polite' });
    const salvar = DS.acao('Criar caso no Qase…', async () => {
      const chave = ticket?.value.trim().toUpperCase();
      if (titulo.value.trim().length < 3) { saida.replaceChildren(DS.alerta(tr('Informe um título com pelo menos 3 caracteres.'), 'aviso')); return; }
      if (chave && !(chave.startsWith(vj.recurso.chave + '-') && /^[0-9]+$/.test(chave.slice(vj.recurso.chave.length + 1)))) {
        saida.replaceChildren(DS.alerta(tr('O ticket deve pertencer ao projeto Jira vinculado.'), 'aviso')); return;
      }
      const p = { titulo: titulo.value.trim(), descricao: desc.value, preCondicoes: pre.value, automacao: auto.value,
        passos: [...passos.children].map(l => ({ acao: l.querySelector('.passo-acao').value, dados: l.querySelector('.passo-dados').value, esperado: l.querySelector('.passo-esperado').value })).filter(s => s.acao.trim()) };
      if (suite.value) p.suiteId = Number(suite.value);
      if (chave) p.ticket = chave;
      salvar.disabled = true;
      try {
        if (chave) {
          const ticketConfirmado = await api.servicoConsultar(e.id, 'jira', 'ticket', {}, chave);
          if (!ticketConfirmado.ok) {
            saida.replaceChildren(DS.alerta(tr('O ticket Jira não pôde ser confirmado no projeto vinculado: ') + ticketConfirmado.error, 'falha'));
            return;
          }
        }
        const r = await executarOperacao(e, 'qase.criar_caso', p);
        if (!r) return;
        if (r.estado !== 'CONFIRMADA') { saida.replaceChildren(painelResultado(r)); return; }
        const mem = memoriaDaTela('testes', e.id); delete mem.casos; delete mem.suites;
        if (chave && r.remoto?.detalhes?.ticket !== chave) {
          saida.replaceChildren(DS.alerta(tr('Caso criado no Qase, mas a associação ao Jira não foi confirmada. Abra o caso e tente associar o ticket novamente.'), 'aviso'));
          return;
        }
        if (chave && r.remoto?.id && vj) {
          const associado = await api.espacoAssociar(e.id, { de: { tipo: 'jira', id: chave, vinculoId: vj.id, origem: vj.recurso.instancia },
            para: { tipo: 'qase', id: String(r.remoto.id), vinculoId: vq.id, origem: vq.recurso.chave }, justificativa: 'Caso registrado no Qase a partir do ticket informado no Prumo' });
          if (!associado.ok && !String(associado.error || '').includes('TRACE_DUPLICATE')) {
            saida.replaceChildren(DS.alerta(tr('Caso criado no Qase e associado ao Jira, mas o mapa local de rastreabilidade não foi atualizado: ') + associado.error, 'aviso')); return;
          }
          await atualizarEspaco(e);
        }
        avisar(tr('Caso criado e confirmado no Qase.'));
        DS.fecharModal(); void mostrar('testes');
      } finally { salvar.disabled = false; }
    }, { id: 'qase-novo-salvar', primaria: true });
    DS.modal('Novo caso no Qase · ' + vq.recurso.chave, [
      DS.info('O caso será gravado no Qase vinculado, após confirmação nativa. O Prumo não mantém outra cópia do cadastro.'),
      leitura.data.proxima != null ? DS.alerta('Exibindo até 100 suites. Use a consulta avançada se a sua suite não aparecer.', 'aviso') : null,
      h('form', { class: 'ds-form', onsubmit: ev => ev.preventDefault() }, DS.campo('Título', titulo, { inteiro: true }), DS.campo('Suite', suite), DS.campo('Automação', auto),
        DS.campo('Descrição', desc, { inteiro: true }), DS.campo('Pré-condições', pre, { inteiro: true }),
        h('div', { class: 'ds-campo inteiro' }, h('span', {}, tr('Passos')), passos, DS.acao('Adicionar passo', linha, { compacto: true })),
        ticket ? DS.campo('Ticket Jira (opcional)', ticket, { inteiro: true }) : null),
      saida, DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), salvar)
    ], { tamanho: 'lg' });
    titulo.focus();
  }
  async function abrirCasoLocal(e, caso) {
    const repositorio = await api.repositorioLocal(e.id);
    if (!repositorio.ok) { avisar(repositorio.error, true); return; }
    const vj = vinc(e, 'jira');
    const vinculados = relacoesDe(e, ['caso-local'], caso.id).map(rel => outroLado(rel, ['caso-local'], caso.id));
    const locais = (await chamar(() => api.propostas(e.id)) || []).filter(p => p.tipo === 'bug' && p.origem === 'PESSOA' && p.estado !== 'DESCARTADA' && !p.remoto);
    const disponiveis = locais.filter(t => !vinculados.some(ref => ref.tipo === 'ticket-local' && ref.id === t.id));
    const lista = h('div', { id: 'caso-local-vinculos', class: 'ds-celula-nos' },
      vinculados.length ? vinculados.map(ref => ref.tipo === 'jira' ? noRef(e, ref, ref.id) : h('span', { class: 'ds-chip' }, 'Ticket local · ' + (locais.find(t => t.id === ref.id)?.titulo || ref.id.slice(0, 8)))) : h('span', { class: 'suave' }, tr('Nenhum ticket associado.')));
    const seletor = h('select', { id: 'caso-local-ticket' }, h('option', { value: '' }, tr('Selecionar ticket local')), disponiveis.map(t => h('option', { value: t.id }, t.titulo)));
    const entradaJira = vj ? h('input', { id: 'caso-local-jira', placeholder: vj.recurso.chave + '-123', maxlength: 40, 'aria-label': tr('Chave Jira') }) : null;
    const saida = h('div', { id: 'caso-local-saida', role: 'status', 'aria-live': 'polite' });
    const associar = async (ref) => {
      const d = { de: { tipo: 'caso-local', id: caso.id, origem: 'prumo' }, para: ref, justificativa: 'Associação declarada pela pessoa no repositório local' };
      const res = await api.espacoAssociar(e.id, d);
      if (!res.ok) { saida.replaceChildren(DS.alerta(res.error, 'falha')); return; }
      const atualizado = await atualizarEspaco(e); void abrirCasoLocal(atualizado, caso);
    };
    const passos = Array.isArray(caso.dados.passos) ? caso.dados.passos : [];
    const [cat, aut] = await Promise.all([api.testesCatalogo(e.id), api.espacoAutomacoes(e.id)]);
    const autoLista = vinculados.filter(ref => ref.tipo === 'automacao');
    const autoOpcoes = [...((aut.ok && aut.data.capacidades) || []).map(x => [x, tr('Automação') + ' · ' + x]),
      ...((cat.ok && cat.data?.catalogo?.features) || []).flatMap(f => f.testes.map(t => [f.arquivo + ':' + t.linha, f.nome + ' · ' + t.titulo]))];
    DS.modal('Caso local · ' + caso.titulo, h('div', { class: 'ds-detalhe' },
      h('section', { class: 'ds-detalhe-main' },
        DS.bloco('Descrição', DS.texto(caso.dados.descricao, 'Sem descrição.')),
        DS.bloco('Pré-condições', DS.texto(caso.dados.preCondicoes, 'Sem pré-condições.')),
        DS.bloco(tr('Passos ({n})', { n: passos.length }), passos.length ? DS.tabela({ colunas: ['#', 'Passo', 'Dados de teste', 'Resultado esperado'], linhas: passos.map((s, i) => ({ celulas: [String(i + 1), s.formato === 'bdd' ? h('span', {}, h('span', { class: 'rep-passo-bdd' }, s.palavra || ''), s.acao) : s.acao, s.dados || '—', s.formato === 'bdd' ? '—' : (s.esperado || '—')] })) }) : h('p', { class: 'suave' }, tr('Nenhum passo cadastrado.'))),
        caso.dados.posCondicoes ? DS.bloco('Pós-condições', DS.texto(caso.dados.posCondicoes)) : null,
        DS.bloco('Automação e features', blocoAutomacaoLocal(e, caso, autoLista, autoOpcoes, associar, saida)),
        DS.bloco('Tickets relacionados', lista), saida),
      h('aside', {},
        DS.meta([['Origem', DS.origem('prumo', 'Prumo · local')], ['Estado', 'Caso local'], ['Tags', (caso.dados.tags || []).map(t => '@' + t).join(', ') || null], ['Suíte', repositorio.data.suites.find(s => s.id === caso.suiteLocalId)?.titulo || 'Sem suíte'], ['Automação', caso.dados.automacao || 'manual'], ['Criado', hora(caso.criadaEm)]]),
        DS.acao('Editar caso', () => DS.modal('Editar caso local', formularioProposta(e, caso, () => { DS.fecharModal(); void mostrar('testes'); }, repositorio.data.suites), { tamanho: 'md' }), { id: 'caso-local-editar' }),
        disponiveis.length ? DS.bloco('Vincular ticket local', h('div', { class: 'ds-cab-acoes' }, seletor, DS.acao('Associar', () => {
          if (seletor.value) void associar({ tipo: 'ticket-local', id: seletor.value, origem: 'prumo' });
        }, { id: 'caso-local-associar' }))) : null,
        entradaJira ? DS.bloco('Vincular ticket do Jira', h('div', { class: 'ds-cab-acoes' }, entradaJira, DS.acao('Associar Jira', () => {
          const chave = entradaJira.value.trim().toUpperCase();
          if (!chave.startsWith(vj.recurso.chave + '-') || !/^[0-9]+$/.test(chave.slice(vj.recurso.chave.length + 1))) {
            saida.replaceChildren(DS.alerta('Informe uma chave do projeto Jira vinculado.', 'aviso')); return;
          }
          void (async () => {
            const verificado = await api.servicoConsultar(e.id, 'jira', 'ticket', {}, chave);
            if (!verificado.ok) {
              saida.replaceChildren(DS.alerta('Não foi possível confirmar o ticket no Jira: ' + verificado.error, 'falha'));
              return;
            }
            await associar({ tipo: 'jira', id: chave, vinculoId: vj.id, origem: vj.recurso.instancia });
          })();
        }, { id: 'caso-local-associar-jira' }))) : null)),
    { tamanho: 'lg', subtitulo: [DS.origem('prumo', 'Repositório local')] });
  }
  /** Liga o cenário local a uma automação (capability) ou a um teste/feature lido do código; não comprova execução. */
  function blocoAutomacaoLocal(e, caso, ligadas, opcoes, associar, saida) {
    const seletor = h('select', { id: 'caso-local-automacao', 'aria-label': tr('Automação ou feature') }, h('option', { value: '' }, tr('Selecionar automação ou feature')), opcoes.filter(([v]) => !ligadas.some(a => a.id === v)).map(([v, t]) => h('option', { value: v }, t)));
    return h('div', { class: 'ds-acoes-col' },
      ligadas.length ? h('div', { class: 'ds-celula-nos' }, ligadas.map(a => h('span', { class: 'ds-chip', 'data-tom': 'info' }, a.id))) : h('p', { class: 'suave' }, tr('Nenhuma automação ou feature vinculada.')),
      opcoes.length ? h('div', { class: 'ds-cab-acoes' }, seletor, DS.acao('Vincular', () => { if (seletor.value) void associar({ tipo: 'automacao', id: seletor.value, origem: 'qa.project.json' }); }, { id: 'caso-local-vincular-automacao', compacto: true }))
        : DS.info('Vincule uma pasta de código em Projetos para ligar este cenário a automações e features.'),
      DS.info('O vínculo registra a sua decisão. Só um resultado registrado comprova a execução.'));
  }
  async function novaProposta(e) {
    const local = !vinc(e, 'qase');
    const r = local ? await api.repositorioLocal(e.id) : null;
    if (r && !r.ok) { avisar(r.error, true); return; }
    DS.modal(local ? 'Novo caso local' : 'Nova proposta de caso', formularioProposta(e, null, () => { DS.fecharModal(); void mostrar('testes'); }, r?.data?.suites || []), { tamanho: 'md' });
  }
  // Propostas em revisão: rascunhos locais de casos e bugs. Com o Qase vinculado e a escrita habilitada, depois de revisadas podem ser enviadas para lá;
  // sem o Qase, continuam como casos manuais deste computador.
  async function telaPropostas(e, mem, corpo) {
    const slot = h('div', { id: 'pr-slot' }); const propostas = h('div', { id: 'pr-lista' });
    corpo.append(DS.secao('Propostas em revisão', [DS.info(vinc(e, 'qase') ? 'Rascunhos anteriores ou sugeridos por agentes. Para criar um caso novo, use Novo caso no Qase; nenhuma proposta é enviada sem revisão.' : 'Casos locais em rascunho e sugestões para revisão. Nada é enviado a um serviço externo.'), slot, propostas]));
    const perm = await escritaDoProjeto(e); const ps = await chamar(() => api.propostas(e.id)); const vivas = (ps || []).filter(p => p.estado !== 'DESCARTADA' && (vinc(e, 'qase') || p.tipo === 'bug' || p.origem !== 'PESSOA'));
    if (!vivas.length) propostas.append(DS.estadoTela('vazio', 'Nenhuma proposta em revisão', null, [], { id: 'pr-vazia', compacto: true })); for (const p of vivas) propostas.append(cartaoProposta(e, p, perm, () => mostrar('testes')));
  }
  function novaSuite(e, esc) {
    const titulo = h('input', { id: 'su-titulo', maxlength: 255 }); const saida = h('div', { id: 'ts-saida' });
    DS.modal('Nova suite no Qase', [!esc ? DS.alerta('Escrita no Qase desligada. Habilite em Projetos para criar suites.', 'aviso', 'cadeado') : null, h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título da suite', titulo, { inteiro: true })), saida,
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Criar suite…', async () => { const r = await executarOperacao(e, 'qase.criar_suite', { titulo: titulo.value }); if (r) { saida.replaceChildren(painelResultado(r)); if (r.estado === 'CONFIRMADA') delete memoriaDaTela('testes', e.id).suites; } }, { id: 'su-criar', primaria: true, desabilitado: !esc }))], { tamanho: 'sm' });
    titulo.focus();
  }
  /** Edita título e descrição de uma suíte do Qase (operação com confirmação nativa); só muda o que foi alterado. */
  function editarSuiteQase(e, suite) {
    const titulo = h('input', { id: 'su-ed-titulo', maxlength: 255, value: suite.titulo }); const descricao = h('textarea', { id: 'su-ed-descricao', rows: 4, maxlength: 4000 }); descricao.value = suite.descricao || ''; const saida = h('div', { id: 'su-ed-saida', 'aria-live': 'polite' });
    DS.modal('Editar suíte no Qase', [h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Título da suíte', titulo, { inteiro: true }), DS.campo('Descrição', descricao, { inteiro: true })), saida,
      DS.rodape(h('span', { class: 'ds-form-msg' }, tr('A alteração vai ao Qase após a confirmação nativa.')), DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Salvar no Qase…', async () => {
        const p = { suiteId: Number(suite.id) }; if (titulo.value.trim() !== suite.titulo) p.titulo = titulo.value.trim(); if (descricao.value !== (suite.descricao || '')) p.descricao = descricao.value;
        if (Object.keys(p).length === 1) { saida.replaceChildren(DS.alerta(tr('Nenhuma alteração para salvar.'), 'aviso')); return; }
        if (p.titulo !== undefined && p.titulo.length < 2) { saida.replaceChildren(DS.alerta(tr('O título precisa de pelo menos 2 caracteres.'), 'aviso')); titulo.focus(); return; }
        const r = await executarOperacao(e, 'qase.editar_suite', p); if (!r) return; if (r.estado === 'CONFIRMADA') { delete memoriaDaTela('testes', e.id).suites; DS.fecharModal(); void mostrar('testes'); } else saida.replaceChildren(painelResultado(r));
      }, { id: 'su-ed-salvar', primaria: true }))], { tamanho: 'md' });
    titulo.focus();
  }
  /** Apaga do Qase uma suíte vazia (a operação confere de novo no Qase e pede a confirmação nativa). */
  async function apagarSuiteQase(e, suite) {
    const r = await executarOperacao(e, 'qase.apagar_suite', { suiteId: Number(suite.id) }); if (!r) return;
    if (r.estado === 'CONFIRMADA') { delete memoriaDaTela('testes', e.id).suites; avisar(tr('Suíte apagada do Qase.')); void mostrar('testes'); } else DS.modal('Apagar suíte no Qase', [painelResultado(r), DS.rodape(DS.acao('Fechar', () => DS.fecharModal()))], { tamanho: 'sm' });
  }
  async function telaSuites(e, mem, corpo) {
    const area = h('div', { id: 'suites-area' }, DS.esqueleto(5)); const fonte = h('div'); corpo.append(DS.barra(DS.acao('Atualizar', async () => { delete mem.suites; await carregar(); }, { id: 'suites-atualizar', icone: 'atualizar' })), fonte, area);
    async function carregar() {
      area.replaceChildren(DS.esqueleto(5)); const s = (mem.suites = mem.suites || await carregarQase(e, mem, 'suites')); fonte.replaceChildren(fonteQase(s, 'suite(s)'));
      if (s.erro && !s.itens.length) { area.replaceChildren(DS.estadoTela('erro', 'Não foi possível consultar as suites', s.erro)); return; }
      if (!s.itens.length) { area.replaceChildren(DS.estadoTela('vazio', 'Nenhuma suite retornada pelo Qase')); return; }
      area.replaceChildren(DS.tabela({ id: 'suites-tabela', colunas: ['ID', 'Suite', 'Casos', 'Suite pai'], rotuloAbrir: 'Ver casos', linhas: s.itens.map((x) => ({ attrs: { 'data-suite': String(x.id) }, abrir: () => { (mem.fCasos ||= {}).suite = String(x.id); (estado.sub ||= {}).testes = 'casos'; void mostrar('testes'); }, celulas: [{ no: String(x.id), classe: 'ds-id' }, h('div', {}, x.title || '—', x.description ? h('span', { class: 'ds-sub' }, String(x.description).slice(0, 160)) : null), x.cases_count != null ? String(x.cases_count) : '—', x.parent_id != null ? String(x.parent_id) : '—'] })) }));
    }
    await carregar();
  }
