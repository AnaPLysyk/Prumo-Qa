/** Evidências de um cenário da run: resumo da rodada de automação, log e arquivos, com anexo manual. */
  const tamanhoDoArquivo = (n) => (n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB');
  /** A tela só aceita imagens `self`, `file:` e `blob:`; a prévia que vem como data URL vira blob. */
  function previaComoBlob(dataUrl) {
    const [cabeca, base64] = dataUrl.split(','); const tipo = /^data:([^;]+)/.exec(cabeca)?.[1] || 'application/octet-stream';
    return URL.createObjectURL(new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: tipo }));
  }
  const miniaturaDaEvidencia = (a) => { const url = previaComoBlob(a.previa); return h('img', { class: 'ds-evid-previa', src: url, alt: tr('Prévia de {n}', { n: a.nome }), onload: () => URL.revokeObjectURL(url) }); };
  function arquivoDeEvidencia(a) {
    return h('li', { class: 'ds-evid-arquivo', 'data-origem': a.origem, 'data-arquivo': a.nome },
      h('div', { class: 'ds-evid-cab' }, DS.icone(a.tipo.startsWith('image/') ? 'imagem' : 'arquivo'), h('strong', {}, a.nome), DS.chip(a.origem === 'manual' ? 'Manual' : 'Rodada'), h('span', { class: 'ds-sub' }, tamanhoDoArquivo(a.tamanho))),
      a.previa ? miniaturaDaEvidencia(a) : null, a.texto ? DS.recolher('Conteúdo', h('pre', { class: 'ds-codigo' }, a.texto)) : null);
  }
  /** Painel do cenário numa run local. `caso` é o item da run (com `resultado` e `publicado`). */
  function painelDeEvidencias(run, caso) {
    const caixa = h('section', { class: 'ds-evid', id: 'run-evidencias', 'data-caso': String(caso.casoId), 'aria-label': tr('Evidências do cenário') });
    async function desenhar() {
      caixa.replaceChildren(DS.carregando('Consultando evidências…'));
      const d = await chamar(() => api.runEvidencias(run.id, caso.casoId));
      if (!d) { caixa.replaceChildren(DS.estadoTela('erro', 'Evidências indisponíveis', 'Não foi possível ler as evidências deste cenário.', [], { compacto: true })); return; }
      const podeAnexar = d.pastaVinculada && !!caso.resultado && caso.resultado.status !== 'NOT_RUN';
      const anexar = DS.acao('Anexar evidência…', async () => {
        const r = await chamar(() => api.runEvidenciar(run.id, caso.casoId)); if (!r || r.canceled) return;
        if (r.adicionados.length) avisar(tr('{n} arquivo(s) adicionado(s).', { n: r.adicionados.length }));
        if (r.recusados.length) avisar(tr('{n} arquivo(s) recusado(s): tipo ou tamanho não aceito, ou limite de 10 por cenário.', { n: r.recusados.length }), true);
        await desenhar();
      }, { id: 'evid-anexar', compacto: true, icone: 'mais', desabilitado: !podeAnexar, titulo: podeAnexar ? null : (d.pastaVinculada ? 'Registre o resultado do cenário antes de anexar.' : 'Vincule a pasta do projeto para guardar evidências.') });
      const r = d.rodada;
      caixa.replaceChildren(
        h('div', { class: 'ds-evid-topo' }, h('h3', { class: 'ds-h' }, tr('Evidências · caso {id}', { id: caso.casoId }) + ' · ' + caso.titulo), anexar),
        caso.publicado ? DS.alerta('Este resultado já foi publicado no Qase; arquivos adicionados agora não são reenviados.', 'aviso') : null,
        r ? DS.meta([['Automação', r.automacao], ['Resultado da rodada', selo(r.status)], ['Início', hora(r.inicio)], ['Fim', hora(r.fim)], ['Escopo', tr(r.escopo === 'round' ? 'Rodada inteira' : 'Cenário')]], { linha: true }) : null,
        r?.cenario ? DS.bloco('Cenário no runner', h('p', { class: 'ds-texto' }, h('strong', {}, r.cenario.id + ' · '), r.cenario.evidencia)) : null,
        r?.motivo ? h('p', { class: 'ds-sub' }, r.motivo) : null,
        d.arquivos.length ? h('ul', { class: 'ds-evid-lista' }, d.arquivos.map(arquivoDeEvidencia)) : h('p', { class: 'suave', id: 'evid-vazio' }, tr('Este cenário ainda não tem evidências. Execute a automação ou anexe arquivos.')),
        DS.info('Ao publicar a run, estes arquivos seguem com o resultado deste cenário para o Qase (até 10 arquivos de 10 MB; texto sai com segredos mascarados).'));
    }
    void desenhar(); return caixa;
  }
