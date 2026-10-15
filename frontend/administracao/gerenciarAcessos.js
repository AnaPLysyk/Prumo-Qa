'use strict';
/** Administração › Usuários, Permissões, Agentes e Configurações gerais: contas, papéis por tela e regras gerais dos agentes da plataforma. */
window.PrumoAdministracaoAcessos = (() => {
  const ROTULO_NIVEL = { NENHUM: 'Sem acesso', VER: 'Ver', USAR: 'Usar' };
  const ROTULO_ESTADO = { ATIVO: 'Ativa', PENDENTE: 'Aguarda aprovação', DESATIVADO: 'Desativada' };
  const TOM_ESTADO = { ATIVO: 'ok', PENDENTE: 'info', DESATIVADO: 'aviso' };
  const dado = (texto) => h('span', { 'data-i18n-ignore': '' }, texto);
  const quando = (iso) => (iso ? new Date(iso).toLocaleString() : tr('nunca'));
  const podeAlterar = () => !window.PrumoConta || window.PrumoConta.pode('administracao') && !window.PrumoConta.soVer('administracao');

  /** Segredo mostrado uma única vez (senha temporária ou código de recuperação), com botão de copiar. */
  function segredoUmaVez(titulo, explicacao, valor, depois) {
    DS.modal(titulo, [DS.alerta(explicacao, 'aviso'), h('code', { id: 'adm-segredo', class: 'entrada-codigo', 'data-i18n-ignore': '' }, valor),
      DS.rodape(DS.acao('Copiar', async () => { try { await navigator.clipboard.writeText(valor); avisar(tr('Copiado.')); } catch { avisar(tr('Não foi possível copiar; anote o valor.'), true); } }, { id: 'adm-segredo-copiar' }),
        DS.acao('Fechar', () => { DS.fecharModal(); depois?.(); }, { primaria: true, id: 'adm-segredo-fechar' }))], { tamanho: 'sm' });
  }

  /* ---------- Usuários ---------- */
  function novaConta(papeis, recarregar) {
    const nome = h('input', { id: 'nova-nome', type: 'text', maxlength: 80 });
    const login = h('input', { id: 'nova-login', type: 'text', maxlength: 40, autocapitalize: 'off', spellcheck: 'false' });
    const papel = DS.selecao({ id: 'nova-papel', rotulo: 'Papel', opcoes: papeis.map((p) => [p.id, p.nome]), valor: 'qa' });
    DS.modal('Nova conta', [h('p', { class: 'suave' }, tr('O Prumo gera uma senha temporária. Entregue-a à pessoa: ela troca a senha no primeiro acesso.')),
      DS.campo('Nome', nome), DS.campo('Login', login), DS.campo('Papel', papel),
      DS.rodape(DS.acao('Criar conta', async () => {
        const r = await chamar(() => api.usuariosCriar(login.value, nome.value, papel.value)); if (!r) return;
        DS.fecharModal(); segredoUmaVez('Senha temporária de ' + r.conta.nome, 'Entregue esta senha à pessoa por um canal seguro. Ela aparece só agora; no primeiro acesso a pessoa define a própria senha.', r.senhaTemporaria, recarregar);
      }, { primaria: true, id: 'nova-criar' }))], { tamanho: 'sm' });
  }

  async function usuarios(area) {
    area.replaceChildren(DS.carregando());
    const [lista, papeis] = await Promise.all([chamar(() => api.usuariosListar()), chamar(() => api.papeisListar())]);
    if (!lista || !papeis) return area.replaceChildren(DS.falhaConsulta('administracao'));
    const recarregar = () => usuarios(area); const alterar = podeAlterar();
    const agir = (fn, ok) => async () => { const r = await chamar(fn); if (r) { if (ok) avisar(tr(ok)); void recarregar(); } };
    const linhas = lista.contas.map((c) => {
      const eu = c.id === lista.voce;
      const papel = DS.selecao({ id: 'papel-' + c.login, rotulo: 'Papel de ' + c.login, opcoes: papeis.papeis.map((p) => [p.id, p.nome]), valor: c.papel, aoMudar: async (v) => { const r = await chamar(() => api.usuariosAlterar(c.id, { papel: v })); if (r) avisar(tr('Papel alterado.')); void recarregar(); } });
      papel.disabled = !alterar || eu;
      const acoes = alterar ? [
        c.estado === 'PENDENTE' ? DS.acao('Aprovar', agir(() => api.usuariosAlterar(c.id, { estado: 'ATIVO' }), 'Cadastro aprovado.'), { compacto: true, primaria: true, id: 'aprovar-' + c.login }) : null,
        !eu ? DS.acao('Redefinir senha', async () => { const r = await chamar(() => api.usuariosSenha(c.id)); if (r) segredoUmaVez('Senha temporária de ' + c.nome, 'Entregue esta senha à pessoa por um canal seguro. Ela aparece só agora; no próximo acesso a pessoa define a própria senha.', r.senhaTemporaria, recarregar); }, { compacto: true, id: 'redefinir-' + c.login }) : null,
        c.bloqueada ? DS.acao('Desbloquear', agir(() => api.usuariosDesbloquear(c.id), 'Conta desbloqueada.'), { compacto: true, id: 'desbloquear-' + c.login }) : null,
        !eu && c.estado === 'ATIVO' ? DS.acao('Desativar', agir(() => api.usuariosAlterar(c.id, { estado: 'DESATIVADO' }), 'Conta desativada.'), { compacto: true, classe: 'perigo', id: 'desativar-' + c.login }) : null,
        !eu && c.estado === 'DESATIVADO' ? DS.acao('Reativar', agir(() => api.usuariosAlterar(c.id, { estado: 'ATIVO' }), 'Conta reativada.'), { compacto: true, id: 'reativar-' + c.login }) : null,
        !eu && c.estado !== 'ATIVO' ? DS.acao('Excluir', agir(() => api.usuariosExcluir(c.id), 'Conta excluída.'), { compacto: true, classe: 'perigo', id: 'excluir-' + c.login }) : null
      ].filter(Boolean) : [];
      return { attrs: { 'data-conta': c.login }, celulas: [
        h('div', {}, h('strong', { 'data-i18n-ignore': '' }, c.nome), eu ? [' ', DS.chip('você', 'info')] : null, h('div', { class: 'suave' }, dado(c.login))),
        { no: papel }, { no: h('div', { class: 'adm-estado' }, DS.chip(ROTULO_ESTADO[c.estado], TOM_ESTADO[c.estado]), c.bloqueada ? DS.chip('Bloqueada', 'falha') : null, c.trocarSenha ? DS.chip('Senha temporária', 'aviso') : null) },
        quando(c.ultimoAcesso), { no: h('div', { class: 'adm-acoes' }, ...acoes), classe: 'ds-acao' }] };
    });
    const conta = (e) => lista.contas.filter((c) => c.estado === e).length;
    area.replaceChildren(
      DS.resumo([[conta('ATIVO'), 'ativas', 'ok'], [conta('PENDENTE'), 'aguardam aprovação', 'info'], [conta('DESATIVADO'), 'desativadas'], [lista.contas.filter((c) => c.bloqueada).length, 'bloqueadas', 'falha']], { id: 'adm-usuarios-resumo' }),
      h('div', { class: 'adm-barra' }, h('p', { class: 'suave' }, tr('Cada conta tem um papel; o papel define o que a pessoa vê e altera em cada tela (aba Permissões).')),
        alterar ? DS.acao('Nova conta', () => novaConta(papeis.papeis, recarregar), { primaria: true, icone: 'mais', id: 'adm-nova-conta' }) : null),
      DS.tabela({ id: 'adm-usuarios', colunas: ['Pessoa', 'Papel', 'Situação', 'Último acesso', 'Ações'], linhas }));
  }

  /* ---------- Permissões ---------- */
  async function permissoes(area) {
    area.replaceChildren(DS.carregando());
    const d = await chamar(() => api.papeisListar()); if (!d) return area.replaceChildren(DS.falhaConsulta('administracao'));
    const alterar = podeAlterar(); const editados = new Map(d.papeis.map((p) => [p.id, { ...p.telas }]));
    const sujos = new Set(); const salvar = DS.acao('Salvar permissões', async () => {
      for (const id of sujos) { const p = d.papeis.find((x) => x.id === id); const r = await chamar(() => api.papeisSalvar({ id, nome: p.nome, descricao: p.descricao, telas: editados.get(id) })); if (!r) return; }
      avisar(tr('Permissões salvas. Valem no próximo pedido de cada pessoa.')); void permissoes(area);
    }, { primaria: true, id: 'perm-salvar', desabilitado: true });
    const celula = (p, m) => {
      if (p.fixo) return { no: DS.chip(ROTULO_NIVEL.USAR, 'ok') };
      const s = DS.selecao({ id: 'perm-' + p.id + '-' + m.id, rotulo: p.nome + ' em ' + m.rotulo, opcoes: d.niveis.map((n) => [n, ROTULO_NIVEL[n]]), valor: editados.get(p.id)[m.id] || 'NENHUM',
        aoMudar: (v) => { editados.get(p.id)[m.id] = v; sujos.add(p.id); salvar.disabled = false; s.dataset.nivel = v; } });
      s.dataset.nivel = s.value; s.disabled = !alterar; return { no: s };
    };
    const cabecalho = d.papeis.map((p) => ({ t: h('span', { class: 'perm-papel' }, h('span', { 'data-i18n-ignore': '' }, p.nome), h('span', { class: 'suave' }, tr('{n} conta(s)', { n: p.contas }))) }));
    const tabela = DS.tabela({ id: 'perm-matriz', colunas: ['Tela', ...cabecalho], linhas: d.modulos.map((m) => ({ attrs: { 'data-tela': m.id }, celulas: [h('strong', {}, tr(m.rotulo)), ...d.papeis.map((p) => celula(p, m))] })) });
    const papeisEditaveis = d.papeis.filter((p) => !p.fixo);
    area.replaceChildren(
      DS.alerta('Sem acesso: a tela some do menu. Ver: só consulta. Usar: consulta e altera. A regra vale no servidor, não só na tela.', 'info'),
      h('div', { class: 'adm-barra' }, alterar ? [DS.acao('Novo papel', () => novoPapel(d, () => permissoes(area)), { icone: 'mais', id: 'perm-novo' }), salvar] : DS.notaPermissao('Seu papel só permite consultar as permissões.')),
      h('div', { class: 'perm-caixa' }, tabela),
      DS.secao('Papéis', h('ul', { class: 'adm-lista perm-lista' }, d.papeis.map((p) => h('li', { class: 'adm-arquivo', 'data-papel': p.id }, h('strong', { 'data-i18n-ignore': '' }, p.nome), h('span', { class: 'adm-desc', 'data-i18n-ignore': '' }, p.descricao || '—'),
        h('span', { class: 'suave' }, p.fixo ? tr('Fixo: sempre pode tudo.') : tr('{n} conta(s)', { n: p.contas }) + (p.id === d.papelDoCadastro ? ' · ' + tr('papel de novos cadastros') : '')),
        alterar && !p.fixo ? h('div', {}, DS.acao('Excluir papel', async () => { const r = await chamar(() => api.papeisExcluir(p.id)); if (r) { avisar(tr('Papel excluído.')); void permissoes(area); } }, { compacto: true, classe: 'perigo', id: 'perm-excluir-' + p.id, desabilitado: p.contas > 0 || p.id === d.papelDoCadastro, titulo: p.contas > 0 ? 'Troque o papel das contas antes de excluir.' : null })) : null)))),
      papeisEditaveis.length ? null : DS.texto(null, 'Nenhum papel editável.'));
  }

  function novoPapel(d, depois) {
    const nome = h('input', { id: 'papel-nome', type: 'text', maxlength: 40 });
    const descricao = h('input', { id: 'papel-descricao', type: 'text', maxlength: 200 });
    const copiar = DS.selecao({ id: 'papel-base', rotulo: 'Começar igual a', opcoes: d.papeis.map((p) => [p.id, p.nome]), valor: 'leitor' });
    DS.modal('Novo papel', [DS.campo('Nome', nome), DS.campo('Descrição', descricao), DS.campo('Começar com as permissões de', copiar, { ajuda: 'Depois ajuste cada tela na matriz.' }),
      DS.rodape(DS.acao('Criar papel', async () => {
        const base = d.papeis.find((p) => p.id === copiar.value); const telas = { ...base.telas }; if (base.fixo) telas.administracao = 'NENHUM';
        const r = await chamar(() => api.papeisSalvar({ nome: nome.value, descricao: descricao.value, telas })); if (!r) return;
        DS.fecharModal(); avisar(tr('Papel criado.')); depois();
      }, { primaria: true, id: 'papel-criar' }))], { tamanho: 'sm' });
  }

  /* ---------- Agentes da plataforma ---------- */
  async function agentes(area) {
    area.replaceChildren(DS.carregando());
    const d = await chamar(() => api.plataformaAgentes()); if (!d) return area.replaceChildren(DS.falhaConsulta('administracao'));
    const alterar = podeAlterar();
    const caixa = (id, marcado, desabilitado) => h('input', { type: 'checkbox', id, checked: marcado, disabled: desabilitado || !alterar });
    const ligados = new Map(d.agentes.map((a) => [a.id, caixa('agente-' + a.id, a.ligado, a.fixo)]));
    const externa = caixa('plataforma-ia-externa', d.iaExterna); const orquestracao = caixa('plataforma-orquestracao', d.orquestracao);
    const linhas = d.agentes.map((a) => ({ attrs: { 'data-agente': a.id }, celulas: [
      { no: h('label', { class: 'opcao', for: 'agente-' + a.id }, ligados.get(a.id), h('strong', { 'data-i18n-ignore': '' }, a.nome)) },
      h('div', {}, h('span', {}, tr(a.profissao)), h('div', { class: 'suave' }, tr(a.dominio))),
      a.fixo ? DS.chip('Sempre ligado', 'info') : a.capacidades.length ? h('span', { class: 'suave', 'data-i18n-ignore': '' }, a.capacidades.join(' · ')) : '—'] }));
    area.replaceChildren(
      DS.alerta('Estas regras valem para todos os projetos deste computador, no chat e no servidor MCP. Um projeto pode restringir mais, mas não liberar o que está desligado aqui.', 'info'),
      DS.secao('Agentes', [DS.tabela({ id: 'plataforma-agentes', colunas: ['Agente', 'Papel e área', 'Capacidades'], linhas }),
        h('p', { class: 'suave' }, tr('Agente desligado não responde no chat, sai da escolha de agentes e das políticas do MCP. O Prumo Orchestrator conduz a conversa e fica sempre ligado.'))]),
      DS.secao('Regras gerais', [
        h('label', { class: 'opcao', for: 'plataforma-orquestracao' }, orquestracao, tr('O Orchestrator pode combinar vários agentes numa mesma resposta')),
        h('label', { class: 'opcao', for: 'plataforma-ia-externa' }, externa, tr('Permitir Claude Code e Codex no chat (cada pessoa ainda autoriza o próprio cliente)')),
        h('p', { class: 'suave' }, tr('Desligar a IA externa não afeta o resto do Prumo: as respostas usam só os dados deste computador.')),
        d.alteradoEm ? h('p', { class: 'suave', id: 'plataforma-alterado' }, tr('Última alteração: '), dado(quando(d.alteradoEm) + (d.por ? ' · ' + d.por : ''))) : null,
        alterar ? DS.rodape(DS.acao('Salvar regras dos agentes', async () => {
          const desligados = d.agentes.filter((a) => !a.fixo && !ligados.get(a.id).checked).map((a) => a.id);
          const r = await chamar(() => api.plataformaSalvar({ desligados, iaExterna: externa.checked, orquestracao: orquestracao.checked })); if (!r) return;
          avisar(tr('Regras dos agentes salvas.')); void agentes(area);
        }, { primaria: true, id: 'plataforma-salvar' })) : DS.notaPermissao('Seu papel só permite consultar estas regras.')
      ], { id: 'plataforma-regras' }));
  }

  /* ---------- Configurações gerais ---------- */
  async function geral(area) {
    area.replaceChildren(DS.carregando());
    const [c, d] = await Promise.all([chamar(() => api.acessoConfiguracao()), chamar(() => api.papeisListar())]);
    if (!c || !d) return area.replaceChildren(DS.falhaConsulta('administracao'));
    const alterar = podeAlterar();
    const caixa = (id, v) => h('input', { type: 'checkbox', id, checked: v, disabled: !alterar });
    const numero = (id, v, min, max) => h('input', { type: 'number', id, value: v, min, max, step: 1, disabled: !alterar });
    const aberto = caixa('geral-cadastro', c.cadastroAberto); const aprovar = caixa('geral-aprovar', c.aprovarCadastros);
    const papel = DS.selecao({ id: 'geral-papel', rotulo: 'Papel de novos cadastros', opcoes: d.papeis.filter((p) => p.id !== 'administrador').map((p) => [p.id, p.nome]), valor: c.papelDoCadastro }); papel.disabled = !alterar;
    const inatividade = numero('geral-inatividade', c.minutosDeInatividade, 5, 720); const tentativas = numero('geral-tentativas', c.tentativasAntesDoBloqueio, 3, 20); const bloqueio = numero('geral-bloqueio', c.minutosDeBloqueio, 1, 240);
    const ghId = h('input', { id: 'geral-github-id', type: 'text', value: c.githubClientId || '', maxlength: 60, autocomplete: 'off', spellcheck: 'false', disabled: !alterar });
    const ghSegredo = h('input', { id: 'geral-github-segredo', type: 'password', maxlength: 200, autocomplete: 'off', placeholder: c.githubClientId ? tr('(já guardado; deixe vazio para manter)') : '', disabled: !alterar });
    const ghSalvar = DS.acao('Salvar', async () => { const r = await chamar(() => api.acessoGithub(ghId.value, ghSegredo.value)); ghSegredo.value = ''; if (r) { avisar(r.configurado ? tr('GitHub configurado.') : tr('GitHub desligado.')); void geral(area); } }, { id: 'geral-github-salvar', compacto: true });
    const goId = h('input', { id: 'geral-google-id', type: 'text', value: c.googleClientId || '', maxlength: 120, autocomplete: 'off', spellcheck: 'false', disabled: !alterar });
    const goSegredo = h('input', { id: 'geral-google-segredo', type: 'password', maxlength: 200, autocomplete: 'off', placeholder: c.googleClientId ? tr('(já guardado; deixe vazio para manter)') : '', disabled: !alterar });
    const goSalvar = DS.acao('Salvar', async () => { const r = await chamar(() => api.acessoGoogle(goId.value, goSegredo.value)); goSegredo.value = ''; if (r) { avisar(r.configurado ? tr('Google configurado.') : tr('Google desligado.')); void geral(area); } }, { id: 'geral-google-salvar', compacto: true });
    area.replaceChildren(
      DS.secao('Cadastro pela tela de entrada', [h('label', { class: 'opcao', for: 'geral-cadastro' }, aberto, tr('Permitir que a pessoa crie a própria conta')), h('label', { class: 'opcao', for: 'geral-aprovar' }, aprovar, tr('Novos cadastros precisam de aprovação da Administração')), DS.campo('Papel de novos cadastros', papel, { ajuda: 'Nunca administrador: esse papel só a Administração dá.' })]),
      DS.secao('Sessão e bloqueio', [h('div', { class: 'adm-form' }, DS.campo('Minutos sem uso até pedir login de novo', inatividade), DS.campo('Tentativas erradas antes de bloquear a conta', tentativas), DS.campo('Minutos de bloqueio', bloqueio))]),
      DS.secao('Entrar com o GitHub', [DS.info('OAuth App em github.com/settings/developers, com a callback http://127.0.0.1/callback. O segredo fica no cofre do sistema.', { rotulo: 'Como configurar' }), h('div', { class: 'adm-form' }, DS.campo('Client ID', ghId), DS.campo('Client Secret', ghSegredo)), alterar ? ghSalvar : null]),
      DS.secao('Entrar com o Google', [DS.info('Credencial OAuth do tipo "Aplicativo para computador", no Google Cloud Console. O segredo fica no cofre do sistema.', { rotulo: 'Como configurar' }), h('div', { class: 'adm-form' }, DS.campo('Client ID', goId), DS.campo('Client Secret', goSegredo)), alterar ? goSalvar : null]),
      alterar ? DS.rodape(DS.acao('Salvar configurações', async () => {
        const r = await chamar(() => api.acessoSalvar({ cadastroAberto: aberto.checked, aprovarCadastros: aprovar.checked, papelDoCadastro: papel.value, minutosDeInatividade: Number(inatividade.value), tentativasAntesDoBloqueio: Number(tentativas.value), minutosDeBloqueio: Number(bloqueio.value) }));
        if (r) avisar(tr('Configurações salvas.'));
      }, { primaria: true, id: 'geral-salvar' })) : DS.notaPermissao('Seu papel só permite consultar estas configurações.'));
  }

  return { usuarios, permissoes, agentes, geral };
})();
