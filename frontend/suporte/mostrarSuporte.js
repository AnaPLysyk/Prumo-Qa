'use strict';
/** Mostra a tela de Suporte e controla o relato antes do envio. */
(() => {
  // ======================= Suporte =======================
  abas.suporte = async (el) => {
    el.append(DS.cabecalho({ titulo: 'Suporte', info: 'Relate um bug, peça uma melhoria ou envie uma sugestão pelo GitHub Issues. O texto é revisado aqui antes de qualquer envio.' }));
    const categoria = h('select', { id: 'sup-categoria' }, [['bug', 'Bug'], ['melhoria', 'Melhoria'], ['sugestao', 'Sugestão']].map(([v, t]) => h('option', { value: v }, tr(t))));
    const titulo = h('input', { id: 'sup-titulo', type: 'text', maxlength: '120', placeholder: tr('Resumo do problema ou da ideia') });
    const descricao = h('textarea', { id: 'sup-descricao', rows: '5', maxlength: '4000', placeholder: tr('O que aconteceu? Em qual tela?') });
    const passos = h('textarea', { id: 'sup-passos', rows: '4', maxlength: '2000', placeholder: tr('1. Abrir… 2. Clicar em…') }); const esperado = h('textarea', { id: 'sup-esperado', rows: '3', maxlength: '2000' });
    const marca = (id, rotulo, ligado) => h('label', { for: id }, h('input', { type: 'checkbox', id, checked: ligado }), tr(rotulo));
    const incVersao = marca('sup-versao', 'Incluir a versão do Prumo QA', true), incSistema = marca('sup-sistema', 'Incluir o sistema operacional (somente se você autorizar)', false), incDiag = marca('sup-diagnostico', 'Incluir os últimos eventos do diagnóstico da interface (somente metadados)', false), consente = marca('sup-consentimento', 'Entendo que o texto abaixo será exibido a qualquer pessoa se eu enviar a issue', false);
    const ck = (l) => l.querySelector('input');
    const gPassos = DS.campo('Passos para reproduzir (obrigatório em bug)', passos, { inteiro: true }); const gEsperado = DS.campo('Resultado ou benefício esperado', esperado, { inteiro: true });
    categoria.addEventListener('change', () => { gPassos.hidden = categoria.value !== 'bug'; });
    const etapas = h('div', { class: 'ds-passos-form', 'aria-label': tr('Etapas do relato') }, h('span', { 'aria-current': 'step' }, tr('Descrever')), h('span', {}, tr('Revisar')), h('span', {}, tr('Enviar pelo GitHub')));
    const marcarEtapa = (i) => [...etapas.children].forEach((s, k) => (k === i ? s.setAttribute('aria-current', 'step') : s.removeAttribute('aria-current')));
    const saida = h('div', { id: 'sup-saida', 'aria-live': 'polite' });
    const relato = () => ({ categoria: categoria.value, titulo: titulo.value, descricao: descricao.value, passos: passos.value || undefined, esperado: esperado.value || undefined, incluirVersao: ck(incVersao).checked, incluirSistema: ck(incSistema).checked, incluirDiagnostico: ck(incDiag).checked, consentimento: ck(consente).checked });
    const revisar = async () => {
      if (!ck(consente).checked) { avisar(tr('Marque o entendimento sobre issues públicas para revisar.'), true); return; }
      const p = await chamar(() => api.suportePreparar(relato())); if (!p) return; marcarEtapa(1);
      const nos = [h('h2', {}, tr('Revisão antes de enviar')), h('p', { class: 'suave' }, p.aviso)];
      if (p.bloqueios.length) nos.push(h('div', { class: 'ds-alerta', 'data-tom': 'falha', id: 'sup-bloqueios', role: 'alert' }, DS.icone('alerta'), h('div', {}, h('strong', {}, tr('Envio bloqueado: ')), p.bloqueios.map((b) => b.tipo + (b.trecho ? ' (' + b.trecho + ')' : '')).join('; '), tr('. Remova ou substitua antes de continuar.'))));
      if (p.avisos.length) nos.push(h('div', { class: 'ds-alerta', 'data-tom': 'aviso', id: 'sup-avisos' }, DS.icone('alerta'), h('div', {}, h('strong', {}, tr('Revise: ')), p.avisos.map((b) => b.tipo + ' (' + b.trecho + ')').join('; '), tr('. Você decide se mantém.'))));
      const abrirBtn = h('button', { class: 'acao primaria', id: 'sup-abrir', disabled: !p.ok, onclick: async () => { const x = await chamar(() => api.suporteAbrir(relato())); if (x && x.opened) { marcarEtapa(2); avisar(tr('Formulário aberto no navegador. Revise e envie por lá.')); } } }, DS.icone('externo'), tr('Abrir formulário no GitHub…'));
      const expBtn = h('button', { class: 'acao', id: 'sup-exportar', disabled: !p.ok, onclick: async () => { const x = await chamar(() => api.suporteExportar(relato())); if (x && x.exported) avisar(tr('Relato exportado.')); } }, DS.icone('baixar'), tr('Exportar para arquivo…'));
      if (p.markdown) nos.push(h('p', { class: 'suave' }, tr('Este é exatamente o texto que será usado:')), h('pre', { id: 'sup-previa', class: 'ds-codigo' }, p.markdown), p.truncado ? h('p', { class: 'suave' }, tr('O texto é longo e será encurtado no formulário; use Exportar para guardar a versão completa.')) : null);
      nos.push(h('div', { class: 'ds-form-acoes' }, expBtn, abrirBtn));
      saida.replaceChildren(...nos.filter(Boolean)); saida.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    const form = h('form', { class: 'ds-form', onsubmit: (ev) => { ev.preventDefault(); revisar(); } }, DS.campo('Tipo', categoria), h('span'), DS.campo('Título', titulo, { inteiro: true }), DS.campo('Descrição', descricao, { inteiro: true }), gPassos, gEsperado,
      DS.grupo('O que incluir', h('div', { class: 'ds-opcoes inteiro coluna' }, incVersao, incSistema, incDiag), DS.info('Logs, evidências, caminhos, contextos e código do seu projeto nunca são anexados.')),
      h('div', { class: 'ds-alerta inteiro', 'data-tom': 'aviso', id: 'aviso-publico' }, DS.icone('alerta'), h('div', {}, h('strong', {}, tr('Atenção: ')), tr('issues do repositório oficial são públicas. Não inclua senhas, tokens, documentos privados, código confidencial ou dados pessoais. Nenhum e-mail de suporte é oferecido; o canal oficial é o GitHub Issues.'))),
      h('div', { class: 'ds-opcoes inteiro' }, consente), h('div', { class: 'ds-form-acoes' }, h('button', { class: 'acao primaria', id: 'sup-revisar', type: 'submit' }, tr('Revisar'))));
    // Lateral: acesso rápido, diagnóstico local e acompanhamento de chamado.
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
      h('div', {}, h('h2', {}, tr('Antes de solicitar')), h('ul', { class: 'ds-links' }, [['Consultar documentação', () => mostrar('ajuda')], ['Verificar logs', () => mostrar('logs')], ['Conferir conexões', () => mostrar('conexoes')], ['Problemas comuns', () => { estado.ajudaAlvo = '09-problemas'; mostrar('ajuda'); }]].map(([t, fn]) => h('li', {}, h('button', { type: 'button', onclick: fn }, tr(t)))))),
      h('div', {}, h('h2', {}, tr('Diagnóstico local'), DS.info('Lido deste computador. Não é anexado ao relato sem a sua escolha.')), diag),
      h('div', {}, h('h2', {}, tr('Acompanhar chamado')), h('div', { class: 'ds-cab-acoes' }, numero, DS.acao('Consultar chamado', consultar, { compacto: true })), chamado));
    el.append(h('div', { class: 'ds-atendimento' }, h('div', {}, etapas, form, saida), aside));
    gPassos.hidden = categoria.value !== 'bug';
    const [info, servicos] = await Promise.all([api.info(), api.servicos()]); const w = estado.worker;
    const linha = (k, v) => h('div', {}, h('span', {}, tr(k)), h('span', {}, v));
    diag.replaceChildren(linha('Versão', info.ok ? 'v' + info.data.version : '—'), linha('Worker', w ? h('span', { class: 'chip', 'data-nivel': nivelWorker(w) }, h('i'), textoWorker(w)) : '—'), linha('Projeto', estado.espaco?.nome || estado.projetoNome || tr('nenhum selecionado')),
      linha('Conexões ativas', servicos.ok ? String(servicos.data.filter((c) => c.ativa).length) : '—'), linha('Idioma', PrumoI18n.idioma === 'en' ? 'English' : 'Português (Brasil)'));
  };

})();
