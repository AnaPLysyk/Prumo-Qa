/** Tickets: detalhe de defeitos, vínculos e alteração controlada de status no Qase. */
  async function abrirDefeito(e, id) {
    const vq = vinc(e, 'qase'), vj = vinc(e, 'jira'); if (!vq) { avisar(tr('Qase não vinculado a este projeto.'), true); return; }
    const carregando = DS.modal(tr('Defeito {id}', { id }), DS.carregando('Consultando o Qase…'), { tamanho: 'lg' });
    const r = await api.servicoConsultar(e.id, 'qase', 'defeito', {}, String(id)); if (carregando && !carregando.isConnected) return;
    if (!r.ok) { avisar(r.error, true); DS.modal(tr('Defeito {id}', { id }), DS.estadoTela('erro', 'Não foi possível abrir o defeito', r.error), { tamanho: 'md' }); return; }
    const d = r.data.dados; e = estado.espaco?.id === e.id ? estado.espaco : e; const permQase = !!(await escritaDoProjeto(e)).qase;
    const tickets = e.relacoes.filter((x) => x.de.tipo === 'qase-defeito' && x.de.id === String(id) && x.para.tipo === 'jira-bug');
    const lista = (v) => (Array.isArray(v) ? v : []);
    const main = h('section', { class: 'ds-detalhe-main', id: 'def-detalhe' },
      DS.bloco('Resultado observado', DS.texto(d.actual_result || d.description, 'Sem descrição retornada.')),
      lista(d.runs).length ? DS.bloco('Runs relacionadas', h('div', { class: 'ds-celula-nos' }, lista(d.runs).map((x) => h('span', { class: 'ds-no', 'data-servico': 'qase' }, h('i'), tr('Run {id}', { id: x }))))) : null,
      lista(d.results).length ? DS.bloco('Resultados relacionados', h('div', { class: 'ds-celula-nos' }, lista(d.results).map((x) => h('span', { class: 'ds-no', 'data-servico': 'qase' }, h('i'), String(x))))) : null,
      DS.bloco(tr('Anexos ({n})', { n: lista(d.attachments).length }), lista(d.attachments).length ? h('ul', { class: 'ds-lista' }, lista(d.attachments).map((a) => h('li', {}, a.filename || a.name || a.hash || tr('Anexo'), h('span', { class: 'ds-sub' }, a.size ? bytes(a.size) : '')))) : h('p', { class: 'suave' }, tr('Nenhum anexo.'))),
      blocoRelacoes(e, ['qase-defeito'], id),
      DS.recolher('Dados retornados pelo Qase', h('pre', { class: 'ds-codigo' }, JSON.stringify(d, null, 2))));
    const aside = h('aside', {}, DS.meta([['Origem', DS.origem('qase', 'Qase · ' + vq.recurso.chave)], ['Status', d.status != null ? String(d.status) : null], ['Severidade', d.severity != null ? String(d.severity) : null], ['Tags', lista(d.tags).map((x) => x.title || x).join(', ') || null], ['Atualizado', d.updated_at ? hora(d.updated_at) : null], ['Consultado', hora(r.data.consultadoEm)]]),
      h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Jira')),
        tickets.length ? h('div', { class: 'ds-celula-nos' }, tickets.map((x) => noRef(e, x.para, x.para.id))) : null,
        vj ? (tickets.length ? h('p', { class: 'suave' }, tr('Já existe ticket relacionado a este defeito.')) : DS.acao('Abrir ticket no Jira…', () => abrirCriar(e, { resumo: `[Qase ${vq.recurso.chave}-${id}] ${d.title || ''}`.slice(0, 255), descricao: [tr('Defeito Qase: {k}-{id}', { k: vq.recurso.chave, id }), d.severity != null ? tr('Severidade: {s}', { s: d.severity }) : '', '', d.actual_result || ''].filter((z) => z !== null).join('\n').slice(0, 8000), defeito: { id } }), { id: 'def-jira', icone: 'mais' })) : h('p', { class: 'suave' }, tr('Vincule o Jira para abrir um ticket a partir deste defeito.')),
        DS.notaPermissao('Título, resultado, comentários e anexos são somente leitura no Prumo; só o status muda, com confirmação. Novo defeito nasce de um rascunho local com destino Defeitos Qase.')),
      blocoStatusDefeito(e, d, id, permQase));
    DS.modal(tr('Defeito {id}', { id: vq.recurso.chave + '-' + id }) + ' · ' + (d.title || ''), h('div', { class: 'ds-detalhe' }, main, aside), { tamanho: 'lg', subtitulo: [DS.origem('qase'), DS.chip('Defeito'), d.status != null ? DS.chip(String(d.status)) : null, d.severity != null ? DS.chip(tr('Severidade {s}', { s: d.severity })) : null] });
  }

  // Status do defeito no Qase (PATCH /v1/defect/{code}/status/{id}): em andamento, resolvido ou inválido. A versão lida (updated_at)
  // vai junto para recusar a mudança se alguém alterou o defeito no Qase depois que esta tela o leu.
  function blocoStatusDefeito(e, d, id, permitido) {
    const opcoes = [['in_progress', 'Em andamento'], ['resolved', 'Resolvido'], ['invalid', 'Inválido']].filter(([v]) => v !== d.status);
    const sel = h('select', { id: 'def-status-novo', 'aria-label': tr('Novo status') }, opcoes.map(([v, t]) => h('option', { value: v }, tr(t))));
    const motivo = !permitido ? tr('Escrita no Qase desligada. Habilite em Conexões.') : !d.updated_at ? tr('O Qase não informou a data de atualização; sem ela o Prumo não muda o status com segurança.') : null;
    return h('div', { class: 'ds-acoes-col', id: 'def-status' }, h('h3', { class: 'ds-h' }, tr('Status no Qase')), DS.campo('Novo status', sel),
      DS.acao('Mudar status…', async () => { const x = await executarOperacao(e, 'qase.status_defeito', { defeitoId: Number(id), status: sel.value, versao: d.updated_at }); if (x?.estado === 'CONFIRMADA') { DS.fecharModal(); await abrirDefeito(e, id); } }, { id: 'def-status-mudar', desabilitado: !!motivo, titulo: motivo }),
      motivo ? h('p', { class: 'suave' }, motivo) : null);
  }

