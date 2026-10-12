/** Abre os detalhes de uma run do Qase. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  async function abrirRunQase(e, x) {
    const vivo = DS.modal(tr('Run {id}', { id: x.id }), DS.carregando('Consultando o Qase…'), { tamanho: 'lg' });
    const r = await api.servicoConsultar(e.id, 'qase', 'resultados', { limite: 100 }, String(x.id)); if (vivo && !vivo.isConnected) return;
    const res = r.ok ? r.data.dados : [];
    DS.modal((x.title || tr('Run {id}', { id: x.id })), [DS.meta([['Origem', DS.origem('qase', 'Qase · ' + vinc(e, 'qase').recurso.chave)], ['ID', '#' + x.id], ['Estado', x.status != null ? estadoRunQase(x) : '—'], ['Casos', x.cases_count != null ? String(x.cases_count) : '—'], ['Consultado', r.ok ? quando(r.data.consultadoEm) : '—']], { linha: true }),
      DS.alerta('Run consultada no Qase. Resultados externos não são evidência de execução local.', null, 'escudo'),
      DS.bloco(tr('Resultados ({n})', { n: res.length }), !r.ok ? DS.estadoTela('erro', 'Resultados indisponíveis', r.error) : res.length ? DS.tabela({ colunas: ['Caso', 'Status', 'Tipo', 'Duração', 'Término'], linhas: res.map((z) => ({ abrir: () => abrirCaso(e, z.case_id), rotuloAcessivel: tr('Abrir caso {id}', { id: z.case_id }), celulas: [String(z.case_id), DS.chip(String(z.status), z.status === 'passed' ? 'ok' : z.status === 'failed' ? 'falha' : z.status === 'blocked' ? 'aviso' : null), z.is_api_result ? tr('automação (API)') : tr('manual'), z.time_spent_ms != null ? duracao(z.time_spent_ms) : '—', quando(z.end_time)] })) }) : h('p', { class: 'suave' }, tr('Nenhum resultado registrado nesta run.')))], { tamanho: 'lg', subtitulo: [DS.origem('qase'), DS.chip('Run do Qase')] });
  }

  // ======================= Rastreabilidade =======================
