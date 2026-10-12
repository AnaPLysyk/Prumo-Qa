/** Abre os detalhes de um plano. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  async function abrirPlano(e, x) {
    const vivo = DS.modal(tr('Plano {id}', { id: x.id }), DS.carregando('Consultando o Qase…'), { tamanho: 'md' });
    const r = await api.servicoConsultar(e.id, 'qase', 'plano', {}, String(x.id)); if (vivo && !vivo.isConnected) return;
    if (!r.ok) { DS.modal(tr('Plano {id}', { id: x.id }), DS.estadoTela('erro', 'Não foi possível abrir o plano', r.error), { tamanho: 'md' }); return; }
    const d = r.data.dados || {}; const casos = Array.isArray(d.cases) ? d.cases : [];
    DS.modal(tr('Plano {id}', { id: x.id }) + ' · ' + (d.title || x.title || ''), h('div', { class: 'ds-detalhe-main' }, DS.meta([['Origem', DS.origem('qase', 'Qase · ' + vinc(e, 'qase').recurso.chave)], ['Casos', String(casos.length || d.cases_count || 0)], ['Atualizado', quando(d.updated_at || x.updated_at)], ['Consultado', quando(r.data.consultadoEm)]], { linha: true }),
      d.description ? DS.bloco('Descrição', DS.texto(d.description)) : null,
      DS.bloco('Casos do plano', casos.length ? h('div', { class: 'ds-celula-nos' }, casos.map((c) => noRef(e, { tipo: 'qase', id: String(c.case_id ?? c.id), vinculoId: vinc(e, 'qase').id }, tr('Caso {id}', { id: c.case_id ?? c.id })))) : h('p', { class: 'suave' }, tr('O Qase não retornou casos para este plano.')))), { tamanho: 'md', subtitulo: [DS.origem('qase'), DS.chip('Plano')] });
  }
  // ---- Runs: locais (preparadas no Prumo) e do Qase ----
  // Códigos de estado de run documentados pela API do Qase; código desconhecido aparece como está.
