/** Monta o formulario de suporte, revisao, consentimento e envio. */
  abas.suporte = async (el) => {
    el.append(DS.cabecalho({ titulo: 'Suporte', info: 'Relate um bug, peça uma melhoria ou envie uma sugestão. O chamado vai direto para a equipe do Prumo QA, sem precisar de conta no GitHub. O texto é revisado aqui antes do envio.' }));
    const categoria = h('select', { id: 'sup-categoria' }, [['bug', 'Bug'], ['melhoria', 'Melhoria'], ['sugestao', 'Sugestão']].map(([v, t]) => h('option', { value: v }, tr(t))));
    const titulo = h('input', { id: 'sup-titulo', type: 'text', maxlength: '120', placeholder: tr('Resumo do problema ou da ideia') });
    const descricao = h('textarea', { id: 'sup-descricao', rows: '5', maxlength: '4000', placeholder: tr('O que aconteceu? Em qual tela?') });
    const passos = h('textarea', { id: 'sup-passos', rows: '4', maxlength: '2000', placeholder: tr('1. Abrir… 2. Clicar em…') }); const esperado = h('textarea', { id: 'sup-esperado', rows: '3', maxlength: '2000' });
    const marca = (id, rotulo, ligado) => h('label', { for: id }, h('input', { type: 'checkbox', id, checked: ligado }), tr(rotulo));
    const incVersao = marca('sup-versao', 'Incluir a versão do Prumo QA', true), incSistema = marca('sup-sistema', 'Incluir o sistema operacional (somente se você autorizar)', false), incDiag = marca('sup-diagnostico', 'Incluir os últimos eventos do diagnóstico da interface (somente metadados)', false), consente = marca('sup-consentimento', 'Entendo que o relato, os anexos, meu nome e meu e-mail vão para a equipe do Prumo QA', false);
    const ck = (l) => l.querySelector('input');
    const gPassos = DS.campo('Passos para reproduzir (obrigatório em bug)', passos, { inteiro: true }); const gEsperado = DS.campo('Resultado ou benefício esperado', esperado, { inteiro: true });
    categoria.addEventListener('change', () => { gPassos.hidden = categoria.value !== 'bug'; });

    // Anexos: escolhidos no diálogo do sistema; a tela guarda só id, nome, tipo e tamanho.
    let anexos = [];
    const listaAnexos = h('ul', { class: 'sup-anexos', id: 'sup-anexos' });
    const desenharAnexos = () => listaAnexos.replaceChildren(...anexos.map((a) => h('li', { 'data-anexo': a.nome }, DS.icone(a.tipo.startsWith('video') ? 'video' : 'imagem'), semTraducao(a.nome), h('span', { class: 'suave' }, ' · ' + tamanho(a.tamanho)),
      h('button', { type: 'button', class: 'ds-link', 'aria-label': tr('Remover {nome}', { nome: a.nome }), onclick: () => { anexos = anexos.filter((x) => x.id !== a.id); desenharAnexos(); } }, tr('Remover')))));
    const anexar = DS.acao('Anexar imagem ou vídeo…', async () => {
      const r = await chamar(() => api.suporteAnexar()); if (!r) return;
      for (const a of r.aceitos) { if (anexos.length < 4) anexos.push(a); }
      desenharAnexos(); if (r.recusados.length) avisar(r.recusados.map((x) => x.nome + ': ' + x.motivo).join(' · '), true);
    }, { id: 'sup-anexar', icone: 'clipe', compacto: true });

    const etapas = h('div', { class: 'ds-passos-form', 'aria-label': tr('Etapas do relato') }, h('span', { 'aria-current': 'step' }, tr('Descrever')), h('span', {}, tr('Revisar')), h('span', {}, tr('Enviar')));
    const marcarEtapa = (i) => [...etapas.children].forEach((s, k) => (k === i ? s.setAttribute('aria-current', 'step') : s.removeAttribute('aria-current')));
    const saida = h('div', { id: 'sup-saida', 'aria-live': 'polite' });
    const meus = h('div', { id: 'sup-meus', 'aria-live': 'polite' });
    const relato = () => ({ categoria: categoria.value, titulo: titulo.value, descricao: descricao.value, passos: passos.value || undefined, esperado: esperado.value || undefined, incluirVersao: ck(incVersao).checked, incluirSistema: ck(incSistema).checked, incluirDiagnostico: ck(incDiag).checked, consentimento: ck(consente).checked });
    const revisar = async () => {
      if (!ck(consente).checked) { avisar(tr('Marque que você entende para onde o relato vai, para revisar.'), true); return; }
      const p = await chamar(() => api.suportePreparar(relato())); if (!p) return; marcarEtapa(1);
      const nos = [h('h2', {}, tr('Revisão antes de enviar'))];
      if (p.bloqueios.length) nos.push(h('div', { class: 'ds-alerta', 'data-tom': 'falha', id: 'sup-bloqueios', role: 'alert' }, DS.icone('alerta'), h('div', {}, h('strong', {}, tr('Envio bloqueado: ')), p.bloqueios.map((b) => b.tipo + (b.trecho ? ' (' + b.trecho + ')' : '')).join('; '), tr('. Remova ou substitua antes de continuar.'))));
      if (p.avisos.length) nos.push(h('div', { class: 'ds-alerta', 'data-tom': 'aviso', id: 'sup-avisos' }, DS.icone('alerta'), h('div', {}, h('strong', {}, tr('Revise: ')), p.avisos.map((b) => b.tipo + ' (' + b.trecho + ')').join('; '), tr('. Você decide se mantém.'))));
      const enviarBtn = h('button', { class: 'acao primaria', id: 'sup-enviar', disabled: !p.ok, onclick: async () => {
        enviarBtn.disabled = true; enviarBtn.textContent = tr('Enviando…');
        const x = await chamar(() => api.suporteEnviar(relato(), anexos.map((a) => a.id)));
        enviarBtn.textContent = tr('Enviar chamado'); if (!x) { enviarBtn.disabled = false; return; }
        marcarEtapa(2); anexos = []; desenharAnexos();
        saida.replaceChildren(h('div', { class: 'ds-alerta', 'data-tom': 'ok', id: 'sup-enviado', role: 'status' }, DS.icone('ok'), h('div', {},
          h('strong', {}, tr('Chamado #{n} enviado.', { n: x.numero })), ' ', tr('A equipe responde por aqui, em Meus chamados.'),
          x.anexosComFalha.length ? h('p', {}, tr('Estes anexos não foram enviados: '), semTraducao(x.anexosComFalha.join(', '))) : null,
          x.acompanhamento ? null : h('p', {}, tr('O cofre de senhas do sistema não está disponível: o acompanhamento por aqui não foi guardado.')))));
        void desenharMeus(meus);
      } }, DS.icone('seta'), tr('Enviar chamado'));
      const abrirBtn = h('button', { class: 'acao', id: 'sup-abrir', disabled: !p.ok, onclick: async () => { const x = await chamar(() => api.suporteAbrir(relato())); if (x && x.opened) avisar(tr('Formulário aberto no navegador. Revise e envie por lá.')); } }, DS.icone('externo'), tr('Abrir no GitHub (público)…'));
      const expBtn = h('button', { class: 'acao', id: 'sup-exportar', disabled: !p.ok, onclick: async () => { const x = await chamar(() => api.suporteExportar(relato())); if (x && x.exported) avisar(tr('Relato exportado.')); } }, DS.icone('baixar'), tr('Exportar para arquivo…'));
      if (p.markdown) nos.push(h('p', { class: 'suave' }, tr('Este é o texto do chamado:')), h('pre', { id: 'sup-previa', class: 'ds-codigo' }, p.markdown));
      if (anexos.length) nos.push(h('p', { class: 'suave', id: 'sup-previa-anexos' }, tr('Anexos: '), semTraducao(anexos.map((a) => a.nome).join(', '))));
      nos.push(h('p', { class: 'suave' }, tr('Junto vão seu nome e seu e-mail, para a equipe responder.')));
      nos.push(h('div', { class: 'ds-form-acoes' }, expBtn, abrirBtn, enviarBtn));
      saida.replaceChildren(...nos.filter(Boolean)); saida.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    const form = h('form', { class: 'ds-form', onsubmit: (ev) => { ev.preventDefault(); revisar(); } }, DS.campo('Tipo', categoria), h('span'), DS.campo('Título', titulo, { inteiro: true }), DS.campo('Descrição', descricao, { inteiro: true }), gPassos, gEsperado,
      DS.grupo('Imagens e vídeo', h('div', { class: 'inteiro coluna' }, anexar, listaAnexos), DS.info('Até 3 imagens (PNG, JPEG ou WebP, 5 MB cada) e 1 vídeo (MP4 ou WebM, até 25 MB). O arquivo é conferido pelo conteúdo, não só pela extensão.')),
      DS.grupo('O que incluir', h('div', { class: 'ds-opcoes inteiro coluna' }, incVersao, incSistema, incDiag), DS.info('Logs, evidências, caminhos, contextos e código do seu projeto nunca são anexados sozinhos.')),
      h('div', { class: 'ds-alerta inteiro', 'data-tom': 'info', id: 'aviso-publico' }, DS.icone('escudo'), h('div', {}, h('strong', {}, tr('Para onde vai: ')), tr('o chamado vai só para a equipe do Prumo QA, com seu nome e e-mail para a resposta. Não inclua senhas, tokens, documentos privados ou dados de clientes. Se preferir, a revisão também oferece abrir uma issue pública no GitHub.'))),
      h('div', { class: 'ds-opcoes inteiro' }, consente), h('div', { class: 'ds-form-acoes' }, h('button', { class: 'acao primaria', id: 'sup-revisar', type: 'submit' }, tr('Revisar'))));
