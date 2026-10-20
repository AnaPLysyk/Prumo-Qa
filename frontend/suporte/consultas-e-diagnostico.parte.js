/** Monta consultas e diagnostico do Suporte. */
    // Lateral: acesso rápido, diagnóstico local, meus chamados e chamado público no GitHub.
    const numero = h('input', { type: 'number', min: '1', max: '999999999', id: 'sup-numero', 'aria-label': tr('Número do chamado'), placeholder: '123', class: 'ds-w-sm' }); const chamado = h('div', { 'aria-live': 'polite', id: 'sup-chamado' });
    const consultar = async () => {
      const r = await chamar(() => api.suporteConsultar(Number(numero.value))); if (!r) return;
      chamado.replaceChildren(r.ok ? h('div', { class: 'ds-bloco' }, h('p', {}, h('strong', {}, `#${r.numero} · ${r.title}`)), h('p', {}, tr('Status: '), r.status ? h('span', { class: `estado status-${r.status.id}` }, r.status.nome) : tr(r.ambiguous ? 'rótulos conflitantes' : 'sem status informado')), r.status?.explicacao ? h('p', { class: 'suave' }, r.status.explicacao) : null,
        DS.meta([['Status aplicado em', r.statusAt ? hora(r.statusAt) : tr('indisponível')], ['Atualização da issue', hora(r.updatedAt)], ['Responsáveis', r.responsible.join(', ') || tr('não informados')]]),
        r.history.length ? DS.tempo(r.history.map((e) => ({ titulo: `${e.event === 'labeled' ? tr('Aplicado') : tr('Removido')} ${e.status}`, sub: `${hora(e.at)} · ${e.actor || tr('responsável indisponível')}` }))) : null, !r.historyComplete ? h('p', { class: 'nota' }, tr('Histórico parcial ou indisponível.')) : null, h('p', { class: 'suave' }, r.notice), DS.acao('Abrir chamado no GitHub…', () => chamar(() => api.suporteChamado(r.numero)), { icone: 'externo', compacto: true }))
        : DS.alerta(r.code, 'falha'));
    };
    numero.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') consultar(); });
    const diag = h('div', { class: 'ds-diag', id: 'sup-diagnostico-local' }, h('div', {}, h('span', {}, tr('Consultando…'))));
    const aside = h('aside', {},
      h('div', {}, h('h2', {}, tr('Meus chamados'), DS.info('Os chamados que você abriu por aqui, com o estado e as respostas da equipe.')), meus),
      h('div', {}, h('h2', {}, tr('Antes de solicitar')), h('ul', { class: 'ds-links' }, [['Consultar documentação', () => mostrar('ajuda')], ['Verificar logs', () => mostrar('logs')], ['Conferir conexões', () => mostrar('conexoes')], ['Problemas comuns', () => { estado.ajudaAlvo = '09-problemas'; mostrar('ajuda'); }]].map(([t, fn]) => h('li', {}, h('button', { type: 'button', onclick: fn }, tr(t)))))),
      h('div', {}, h('h2', {}, tr('Diagnóstico local'), DS.info('Lido deste computador. Não é anexado ao relato sem a sua escolha.')), diag),
      h('div', {}, h('h2', {}, tr('Issue pública no GitHub')), h('div', { class: 'ds-cab-acoes' }, numero, DS.acao('Consultar chamado', consultar, { compacto: true })), chamado));
    el.append(h('div', { class: 'ds-atendimento' }, h('div', {}, etapas, form, saida), aside));
    gPassos.hidden = categoria.value !== 'bug';
    void desenharMeus(meus);
    const [info, servicos] = await Promise.all([api.info(), api.servicos()]); const w = estado.worker;
    const linha = (k, v) => h('div', {}, h('span', {}, tr(k)), h('span', {}, v));
    diag.replaceChildren(linha('Versão', info.ok ? 'v' + info.data.version : '—'), linha('Worker', w ? h('span', { class: 'chip', 'data-nivel': nivelWorker(w) }, h('i'), textoWorker(w)) : '—'), linha('Projeto', estado.espaco?.nome || estado.projetoNome || tr('nenhum selecionado')),
      linha('Conexões ativas', servicos.ok ? String(servicos.data.filter((c) => c.ativa).length) : '—'), linha('Idioma', PrumoI18n.idioma === 'en' ? 'English' : 'Português (Brasil)'));
  };
  // Os mesmos rótulos valem na Administração › Chamados.
  window.PrumoSuporte = { ESTADO, TOM, CATEGORIA, tamanho };
})();
