/** Tickets: rascunhos locais, classificação, vinculação e publicação controlada. */

  // ======================= Tickets locais (Prumo) =======================
  // Rascunho de bug/melhoria guardado só neste computador: nasce de uma falha de run ou é criado à mão, sem Jira. Pode ser vinculado a um ticket
  // existente (o Prumo só guarda a chave) ou publicado no Jira com confirmação. Nada vai ao Jira sem a pessoa decidir.
  const classificacoesFalha = [['PRODUTO', 'Bug de produto'], ['OUTRO_BUG', 'Outro bug'], ['MELHORIA', 'Melhoria']];
  const rotuloClassificacao = (c) => tr((classificacoesFalha.find((x) => x[0] === c) || [0, 'Sem classificação'])[1]);
  async function carregarLocais(e) {
    const r = await api.propostas(e.id); if (!r.ok) return { erro: r.error, itens: [] };
    return { itens: (r.data || []).filter((p) => p.tipo === 'bug' && p.estado !== 'DESCARTADA') };
  }
  // Como o ticket local nasceu: de uma falha de run, sugerido por IA ou criado à mão.
  const origemDoLocal = (p) => (p.falhaDeOrigem ? tr('Falha de run') : p.origem === 'IA' ? tr('Sugerido por IA') : tr('Manual'));
  function selecaoClassificacao(id, valor) { return h('select', { id }, classificacoesFalha.map(([v, t]) => h('option', { value: v, selected: v === valor }, tr(t)))); }
  async function abrirLocalNovo(e, aoCriar) {
    const rs = await api.runs(e.id); const falhas = [];
    for (const r of rs.ok ? rs.data : []) for (const c of r.casos.filter((x) => x.resultado?.status === 'FAIL')) falhas.push({ runLocalId: r.id, casoId: c.casoId, rotulo: `${r.titulo} · ${c.casoId} · ${c.titulo}` });
    const cls = selecaoClassificacao('tkl-classificacao', 'PRODUTO'); const res = h('input', { id: 'tkl-resumo', maxlength: 255 }); const desc = h('textarea', { id: 'tkl-descricao', rows: 7, maxlength: 8000 });
    const falha = h('select', { id: 'tkl-falha' }, h('option', { value: '' }, tr('Sem falha de origem')), falhas.map((x, i) => h('option', { value: String(i) }, x.rotulo)));
    const saida = h('div', { id: 'tkl-saida', 'aria-live': 'polite' });
    DS.modal('Novo ticket local', [DS.info('Fica somente neste computador até você escolher publicar. Depois é possível enviar ao Jira, a Defeitos Qase ou a GitHub Issues, conforme os vínculos e permissões do projeto.'),
      h('form', { class: 'ds-form', onsubmit: (ev) => ev.preventDefault() }, DS.campo('Classificação', cls), DS.campo('Resumo', res, { inteiro: true }), DS.campo('Descrição', desc, { inteiro: true }), DS.campo('Falha de origem (opcional)', falha, { inteiro: true })), saida,
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Salvar ticket local', async () => {
        const o = falha.value === '' ? undefined : falhas[Number(falha.value)]; const dados = { classificacao: cls.value, resumo: res.value, descricao: desc.value, rotulos: ['prumo-qa'] };
        const r = await api.propostaCriar(e.id, 'bug', dados, '', '', o ? { runLocalId: o.runLocalId, casoId: o.casoId } : undefined);
        if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } avisar('Rascunho salvo localmente. Nada foi enviado ao Jira, Qase ou GitHub.'); DS.fecharModal(); aoCriar();
      }, { id: 'tkl-salvar', primaria: true }))], { tamanho: 'md' });
    res.focus();
  }
  async function abrirLocal(e, p, aoMudar) {
    const vj = vinc(e, 'jira'), vq = vinc(e, 'qase'), vg = vinc(e, 'github'); const perm = await escritaDoProjeto(e); const aberta = p.estado === 'RASCUNHO' || p.estado === 'REVISADA';
    const chave = h('input', { id: 'tkl-chave', maxlength: 40, placeholder: 'SMART-123', 'aria-label': tr('Ticket existente') }); const cls = selecaoClassificacao('tkl-nova-classificacao', p.dados.classificacao); const saida = h('div', { id: 'tkl-detalhe-saida', 'aria-live': 'polite' });
    const fecharEMudar = () => { DS.fecharModal(); aoMudar(); };
    const opcoesDestino = [['local', 'Manter rascunho local']];
    if (vj) opcoesDestino.push(['jira', 'Publicar ticket no Jira · '+vj.recurso.chave]);
    if (vq && p.dados.classificacao !== 'MELHORIA') opcoesDestino.push(['qase', 'Publicar em Defeitos Qase · '+vq.recurso.chave]);
    if (vg) opcoesDestino.push(['github', 'Publicar em GitHub Issues · '+vg.recurso.chave]);
    const destino = h('select', { id: 'tkl-destino' }, opcoesDestino.map(([valor, rotulo]) => h('option', { value: valor }, rotulo)));
    const severidade = h('select', { id: 'tkl-severidade-qase' }, [1,2,3,4,5].map(n=>h('option',{value:String(n),selected:n===3},String(n))));
    // Opções reais do campo de sistema "severity" do Qase (ID enviado no POST, nome mostrado); sem leitura, ficam os números.
    if (vq) void api.servicoConsultar(e.id, 'qase', 'campos-sistema').then((r) => {
      const campo = r.ok ? (r.data.dados || []).find((c) => String(c.slug).toLowerCase() === 'severity') : null;
      const opcoes = (campo?.options || []).filter((o) => Number(o.id) >= 1);
      if (!opcoes.length) return;
      const padrao = opcoes.find((o) => o.is_default) || opcoes.find((o) => String(o.slug).toLowerCase() === 'normal') || opcoes[0];
      severidade.replaceChildren(...opcoes.map((o) => h('option', { value: String(o.id), selected: o === padrao }, o.title || o.slug || String(o.id))));
    });
    const campoSeveridade = h('div', { id: 'tkl-campo-severidade' });
    // Milestone (só os ativos) e campos personalizados obrigatórios do Qase para defeitos; a lista vem do próprio Qase.
    const marco = h('select', { id: 'tkl-marco-qase' }, h('option', { value: '' }, tr('Sem milestone')));
    const camposObrigatorios = []; const caixaCampos = h('div', { id: 'tkl-campos-qase' });
    if (vq) {
      void api.servicoConsultar(e.id, 'qase', 'marcos', { offset: 0, limite: 100 }).then((r) => { if (r.ok) for (const m of (r.data.dados || []).filter((m) => m.estado !== 'completed')) marco.append(h('option', { value: String(m.id) }, m.titulo)); });
      void api.servicoConsultar(e.id, 'qase', 'campos-personalizados', { offset: 0, limite: 100 }, undefined, { tipo: 'defect' }).then((r) => {
        if (!r.ok) { caixaCampos.replaceChildren(DS.alerta(tr('Não foi possível ler os campos personalizados do Qase: {e}', { e: r.error }), 'aviso')); return; }
        for (const c of (r.data.dados || []).filter((c) => c.obrigatorio)) {
          const entrada = Array.isArray(c.opcoes) && c.opcoes.length ? h('select', { 'data-campo-qase': String(c.id) }, h('option', { value: '' }, tr('Escolha…')), c.opcoes.map((o) => h('option', { value: o.id, selected: c.padrao != null && String(c.padrao) === o.id }, o.titulo)))
            : h('input', { 'data-campo-qase': String(c.id), maxlength: 2000, placeholder: c.dica || '', value: c.padrao || '' });
          camposObrigatorios.push({ id: String(c.id), titulo: c.titulo, entrada });
          caixaCampos.append(DS.campo(c.titulo + ' *', entrada));
        }
      });
    }
    const avisoDestino = h('p', { class:'suave', id:'tkl-ajuda-destino' });
    const atualizarDestino = () => {
      campoSeveridade.replaceChildren(...(destino.value === 'qase' ? [DS.campo('Severidade no Qase', severidade), DS.campo('Milestone no Qase', marco), caixaCampos] : []));
      avisoDestino.textContent = destino.value === 'local' ? 'Permanece somente neste computador; nenhuma API externa será chamada.'
        : destino.value === 'jira' ? (!perm.jira ? 'Escrita Jira desligada neste projeto.' : 'O Jira receberá um ticket após prévia e confirmação nativa.')
        : destino.value === 'qase' ? (!perm.qase ? 'Escrita Qase desligada neste projeto.' : 'O Qase receberá um defeito após prévia e confirmação nativa.')
        : !perm.github ? 'Escrita GitHub desligada neste projeto.' : 'O repositório receberá uma issue após prévia e confirmação nativa. Isso não dispara GitHub Actions.';
    };
    destino.addEventListener('change',atualizarDestino);
    atualizarDestino();
    const publicar = async () => {
      if (destino.value === 'local') { avisar('Rascunho mantido localmente. Nenhuma publicação externa foi feita.'); fecharEMudar(); return; }
      if (!['jira', 'qase', 'github'].includes(destino.value)) { saida.replaceChildren(DS.alerta('Destino não disponível para publicação.', 'aviso')); return; }
      if (!(destino.value === 'jira' ? vj && perm.jira : destino.value === 'qase' ? vq && perm.qase : vg && perm.github)) { saida.replaceChildren(DS.alerta('A conexão precisa estar vinculada e com escrita autorizada neste projeto.', 'aviso')); return; }
      let tipoId;
      if (destino.value === 'jira' && !p.dados.tipoId) {
        const m = await tiposJira(e); const preferido = p.dados.classificacao === 'MELHORIA' ? m.tipos.find((t) => /melhoria|improvement|story|hist/i.test(t.nome)) : m.tipos.find((t) => /bug|defeito/i.test(t.nome));
        tipoId = (preferido || m.tipos[0])?.id;
      }
      let camposQase;
      if (destino.value === 'qase' && camposObrigatorios.length) {
        const vazio = camposObrigatorios.find((c) => !c.entrada.value.trim());
        if (vazio) { saida.replaceChildren(DS.alerta(tr('Preencha o campo obrigatório do Qase: {c}', { c: vazio.titulo }), 'aviso')); vazio.entrada.focus(); return; }
        camposQase = Object.fromEntries(camposObrigatorios.map((c) => [c.id, c.entrada.value.trim()]));
      }
      const r = await api.propostaPublicar(p.id, tipoId, destino.value, destino.value === 'qase' ? Number(severidade.value) : undefined, destino.value === 'qase' && marco.value ? Number(marco.value) : undefined, camposQase);
      if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } if (r.data.canceled) return;
      // GitHub descarta rótulos em silêncio sem a permissão Issues: Read and write; o Prumo avisa em vez de esconder.
      const d = r.data.remoto?.detalhes || {}; const rotulosDescartados = destino.value === 'github' && Number(d.rotulosPedidos) > Number(d.rotulosAplicados ?? 0);
      if (r.data.estado === 'CONFIRMADA') { avisar(rotulosDescartados ? 'Issue publicada, mas o GitHub descartou os rótulos: dê ao token a permissão Issues: Read and write.' : 'Publicado em ' + ({ qase: 'Defeitos Qase.', github: 'GitHub Issues.', jira: 'Jira.' }[destino.value]), rotulosDescartados); fecharEMudar(); }
      else saida.replaceChildren(DS.alerta(tr('Publicação não confirmada: {e}', { e: r.data.erro || r.data.estado }), 'falha'));
    };
    DS.modal(p.titulo, h('div', { class: 'ds-detalhe' }, h('section', { class: 'ds-detalhe-main', id: 'tkl-painel', 'data-local': p.id },
      DS.bloco('Descrição', DS.texto(p.dados.descricao, 'Sem descrição.')),
      p.falhaDeOrigem ? DS.bloco('Falha de origem', h('p', {}, tr('Caso {c} da run local {r}.', { c: p.falhaDeOrigem.casoId, r: p.falhaDeOrigem.runLocalId.slice(0, 8) }))) : null,
      p.remoto?.chave ? DS.bloco(p.estado === 'VINCULADA' ? 'Ticket vinculado' : 'Ticket publicado', h('p', {}, p.remoto.chave, p.remoto.url ? ' · ' + p.remoto.url : '')) : null,
      aberta ? DS.bloco('Vincular a um ticket que já existe', [h('p', { class: 'suave' }, tr('Informe a chave do ticket. O Prumo guarda o vínculo, sem consultar nem alterar o Jira.')), h('div', { class: 'ds-cab-acoes' }, chave, DS.acao('Vincular', async () => { const r = await api.propostaVincular(p.id, chave.value); if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } avisar(tr('Ticket local vinculado a {k}.', { k: r.data.remoto.chave })); await atualizarEspaco(e); fecharEMudar(); }, { id: 'tkl-vincular', primaria: true }))]) : null, saida),
      h('aside', {}, DS.meta([['Origem', DS.origem('prumo', 'Prumo · neste computador')], ['Como nasceu', origemDoLocal(p)], ['Classificação', rotuloClassificacao(p.dados.classificacao)], ['Estado', p.estado === 'VINCULADA' ? tr('Vinculada') : p.estado === 'PUBLICADA' ? tr('Publicada') : tr('Local, sem integração')], ['Criado', hora(p.criadaEm)]]),
        aberta ? h('div', { class: 'ds-acoes-col' }, h('h3', { class: 'ds-h' }, tr('Ações')), DS.campo('Classificação', cls),
          DS.acao('Salvar classificação', async () => { const r = await api.propostaEditar(p.id, { ...p.dados, classificacao: cls.value }); if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } avisar(tr('Classificação atualizada.')); fecharEMudar(); }, { id: 'tkl-classificar' }),
          DS.campo('Destino da publicação', destino), campoSeveridade, avisoDestino,
          DS.acao('Confirmar destino…', publicar, { id: 'tkl-publicar', primaria: true }),
          DS.acao('Descartar', async () => { const r = await api.propostaDescartar(p.id); if (!r.ok) { saida.replaceChildren(DS.alerta(r.error, 'falha')); return; } fecharEMudar(); }, { id: 'tkl-descartar' })) : null)),
    { tamanho: 'lg', subtitulo: [DS.origem('prumo'), DS.chip(origemDoLocal(p)), DS.chip(rotuloClassificacao(p.dados.classificacao))] });
  }

  async function abrirTicketLocalPorId(e, id) {
    const r = await api.propostas(e.id); if (!r.ok) { avisar(r.error, true); return; }
    const p = r.data.find(x => x.id === id && x.tipo === 'bug' && x.estado !== 'DESCARTADA');
    if (!p) { avisar(tr('Ticket local não encontrado neste projeto.'), true); return; }
    abrirLocal(e, p, () => void mostrar('tickets'));
  }
