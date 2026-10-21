'use strict';
/** Login desktop: e-mail e senha remotos (Better Auth), conta local legada, recuperação, idioma e permissões. */
window.PrumoConta = (() => {
  let sessao = null; let dialogo = null; let lugar = null; let vigia = null;
  let versaoAplicativo = null;
  const { codigoDo, mensagemDaEntrada } = window.PrumoMensagensEntrada;
  const pode = (aba) => !sessao || (sessao.telas?.[aba] ?? 'NENHUM') !== 'NENHUM';
  const soVer = (aba) => !!sessao?.loginAtivo && sessao.telas?.[aba] === 'VER';

  /** Campo de formulário com rótulo visível; senha nunca é preenchida de volta. */
  function campo(id, rotulo, tipo, extra = {}, ajuda = null) {
    const input = h('input', { id, type: tipo, required: true, spellcheck: 'false', ...extra });
    return { input, no: DS.campo(rotulo, input, { id, ...(ajuda ? { ajuda } : {}) }) };
  }
  function cartao(titulo, descricao, ...conteudo) {
    return [h('div', { class: 'entrada-marca' }, h('img', { src: '../../assets/prumo-icon.png', alt: '', width: 40, height: 40 }), h('strong', { 'data-i18n-ignore': '' }, 'Prumo QA'), h('span', { class: 'entrada-versao', 'data-i18n-ignore': '', 'aria-label': 'Versão instalada do Prumo QA' }, versaoAplicativo ? 'v' + versaoAplicativo : 'Versão…')),
      h('h1', { id: 'entrada-titulo' }, tr(titulo)), descricao ? h('p', { class: 'entrada-desc' }, tr(descricao)) : null, ...conteudo];
  }
  const erroNo = () => h('div', { id: 'entrada-erro', class: 'ds-alerta entrada-erro', 'data-tom': 'falha', role: 'alert', hidden: true },
    DS.icone('alerta'), h('span', { class: 'entrada-erro-mensagem' }));
  // Na tela de entrada, nunca exibir stack, exceção, texto livre nem código bruto do backend.
  // Os códigos conhecidos viram mensagens objetivas; os desconhecidos mantêm orientação segura.
  function mostrarErro(form, erro) {
    const p = form.querySelector('#entrada-erro');
    p.querySelector('.entrada-erro-mensagem').textContent = mensagemDaEntrada(erro);
    p.hidden = false;
  }
  /** Envia o formulário uma vez (botão desligado enquanto o núcleo responde) e mostra o erro dentro do cartão, não num aviso solto. */
  function formulario(campos, rotuloBotao, enviar, rodape = []) {
    const botao = h('button', { type: 'submit', class: 'acao primaria entrada-enviar', id: 'entrada-enviar' }, tr(rotuloBotao));
    const form = h('form', { class: 'entrada-form', novalidate: true }, ...campos.map((c) => c.no), erroNo(), botao, rodape.length ? h('div', { class: 'entrada-links' }, ...rodape) : null);
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); const p = form.querySelector('#entrada-erro'); p.hidden = true;
      const vazio = campos.find((c) => !c.input.value); if (vazio) { mostrarErro(form, tr('Preencha todos os campos.')); vazio.input.focus(); return; }
      botao.disabled = true; try { await enviar(form); } finally { if (botao.isConnected) botao.disabled = false; }
    });
    return form;
  }
  const iguais = (form, a, b) => { if (a.input.value === b.input.value) return true; mostrarErro(form, tr('A confirmação não é igual à senha.')); b.input.focus(); return false; };
  const link = (texto, fn, id) => h('button', { type: 'button', class: 'ds-link', id, ...(fn ? { onclick: fn } : {}) }, tr(texto));

  function abrirDialogo() {
    if (!dialogo) {
      dialogo = h('dialog', { id: 'entrada', class: 'entrada', 'aria-labelledby': 'entrada-titulo' });
      dialogo.addEventListener('cancel', (e) => e.preventDefault()); // Esc não fecha: sem entrar não há o que usar.
      lugar = h('div', { class: 'entrada-lugar' });
      dialogo.append(PrumoVitrine.ceu(), h('div', { class: 'entrada-palco' }, PrumoVitrine.lema(), lugar));
      document.body.append(dialogo);
      // Versão real do aplicativo instalado, obtida do processo principal.
      void api.info().then((r) => {
        if (r.ok && /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(String(r.data?.version || ''))) versaoAplicativo = r.data.version;
        for (const no of document.querySelectorAll('.entrada-versao')) no.textContent = versaoAplicativo ? 'v' + versaoAplicativo : 'Versão indisponível';
      }).catch(() => { for (const no of document.querySelectorAll('.entrada-versao')) no.textContent = 'Versão indisponível'; });
    }
    document.body.classList.add('com-entrada');
    if (!dialogo.open) dialogo.showModal();
    return dialogo;
  }
  function trocarVista(...nos) { const d = abrirDialogo(); lugar.replaceChildren(h('div', { class: 'entrada-cartao' }, ...nos), rodapeDaEntrada()); d.querySelector('.entrada-cartao input')?.focus(); }

  /** Idioma escolhido antes de entrar: vale na hora para a janela e é salvo nas preferências assim que houver sessão. */
  const IDIOMA_PENDENTE = 'idioma-da-entrada';
  function aplicarIdioma(i) { PrumoI18n.definir(i); document.documentElement.lang = PrumoI18n.idioma; if (PrumoI18n.idioma === 'en') PrumoI18n.traduzirDocumento(); }
  async function salvarIdiomaPendente() {
    let pendente = null; try { pendente = localStorage.getItem(IDIOMA_PENDENTE); } catch { /* sem armazenamento */ }
    if (!pendente) return;
    const r = await api.salvarPreferencias({ idioma: pendente }); if (r.ok) try { localStorage.removeItem(IDIOMA_PENDENTE); } catch { /* sem armazenamento */ }
  }
  /** Abaixo do cartão, em todas as vistas da entrada: idioma e o site oficial (documentação), que não dependem de conta. */
  function rodapeDaEntrada() {
    const idioma = h('select', { id: 'entrada-idioma', 'aria-label': tr('Idioma') }, [['pt-BR', 'Português (Brasil)'], ['en', 'English']].map(([v, t]) => h('option', { value: v, selected: v === PrumoI18n.idioma, 'data-i18n-ignore': '' }, t)));
    idioma.addEventListener('change', () => { aplicarIdioma(idioma.value); try { localStorage.setItem(IDIOMA_PENDENTE, idioma.value); } catch { /* vale só nesta janela */ } });
    const site = h('button', { type: 'button', class: 'ds-link', id: 'entrada-site' }, DS.icone('livro'), h('span', {}, tr('Site e documentação')));
    site.addEventListener('click', () => { void api.abrirSite(); });
    return h('div', { class: 'entrada-rodape' }, h('label', { class: 'entrada-idioma' }, DS.icone('globo'), idioma), site);
  }

  /** Sem nenhuma conta neste computador: a entrada continua sendo a primeira tela, e Criar conta leva à conta de Administrador. */
  const semContas = () => !!sessao && !sessao.loginAtivo;
  const idiomaDoEmail = () => (PrumoI18n.idioma === 'en' ? 'en' : 'pt-BR');
  // As vistas remotas usam o mesmo formulário e Design System, mas vivem no módulo próprio da tela.
  const { vistaServicoIndisponivel, vistaEntrarRemota, vistaCadastrarRemoto, vistaRecuperarRemoto } = window.PrumoLoginRemoto({
    api, DS, campo, cartao, formulario, trocarVista, mostrarErro, iguais, link,
    aoEntrar: (novaSessao) => { sessao = novaSessao; location.reload(); }
  });
  const { botoes: botoesDeLogin } = window.PrumoEntradaProvedores({
    api, h, tr, cartao, trocarVista, link, mensagemDaEntrada,
    voltarEntrar: aviso => vistaEntrar(aviso), voltarCadastro: primeira => vistaCriarConta(primeira)
  });
  function vistaEntrar(aviso) {
    if (sessao?.identidadeRemota) return vistaEntrarRemota(aviso);
    if (sessao?.loginMvpSemServico) return vistaServicoIndisponivel();
    const login = campo('entrada-login', 'E-mail ou login', 'text', { autocomplete: 'username', maxlength: 254, autocapitalize: 'off' });
    const senha = campo('entrada-senha', 'Senha', 'password', { autocomplete: 'current-password', maxlength: 200 });
    const rodape = [semContas() || sessao?.cadastroAberto ? link('Criar conta', () => vistaCriarConta(semContas()), 'entrada-ir-cadastro') : null, link('Esqueci a senha', () => vistaRecuperar(), 'entrada-ir-recuperar')].filter(Boolean);
    // Compatibilidade: somente cadastro local legado; a autenticação remota usa vistaEntrarRemota.
    trocarVista(...cartao('Entrar', semContas() ? 'Este computador ainda não tem contas. Crie a primeira com seu e-mail.' : 'Entre com o e-mail e a senha da sua conta local.'), aviso ? DS.alerta(aviso, 'aviso') : null,
      formulario([login, senha], 'Entrar', async (form) => {
        const r = await api.contaEntrar(login.input.value, senha.input.value, idiomaDoEmail());
        if (!r.ok) { senha.input.value = ''; mostrarErro(form, r.error); return; }
        if (r.data.duasEtapas) { vistaConfirmarEntrada(r.data); return; }
        sessao = r.data; if (sessao.usuario?.trocarSenha) vistaTrocar(); else location.reload();
      }, rodape), ...botoesDeLogin(sessao, semContas() ? 'primeira' : 'entrar'));
  }

  /** Criar conta por e-mail: nome, e-mail e senha; o Prumo manda um código ao e-mail e a conta só nasce com ele. Sem contas, é a de Administrador. */
  function vistaCriarConta(primeira, aviso, antes = {}) {
    const px = primeira ? 'primeiro' : 'cadastro';
    const nome = campo(px + '-nome', 'Nome', 'text', { autocomplete: 'name', maxlength: 80, value: antes.nome || '' });
    const email = campo(px + '-email', 'E-mail', 'email', { autocomplete: 'email', maxlength: 254, autocapitalize: 'off', value: antes.email || '' });
    const senha = campo(px + '-senha', 'Senha', 'password', { autocomplete: 'new-password', maxlength: 200 }, 'Mínimo de 10 caracteres, com letras e números.');
    const confirma = campo(px + '-confirma', 'Confirmar senha', 'password', { autocomplete: 'new-password', maxlength: 200 });
    const descricao = primeira ? 'Primeiro acesso neste computador. Vamos mandar um código para confirmar o seu e-mail.'
      : sessao?.aprovarCadastros ? 'Vamos mandar um código para confirmar o seu e-mail. A conta só funciona depois que a Administração aprovar.' : 'Vamos mandar um código para confirmar o seu e-mail.';
    trocarVista(...cartao(primeira ? 'Criar conta de Administrador' : 'Criar conta', descricao), aviso ? DS.alerta(aviso, 'aviso') : null,
      formulario([nome, email, senha, confirma], 'Enviar código', async (form) => {
        if (!iguais(form, senha, confirma)) return;
        const dados = { primeira, nome: nome.input.value, email: email.input.value, senha: senha.input.value };
        // Voltou de Corrigir dados com o mesmo e-mail: o código já mandado ainda vale (10 minutos), então não pede outro.
        if (antes.enviadoEm && dados.email.trim().toLowerCase() === antes.email && Date.now() - antes.enviadoEm < 9 * 60_000) { vistaConfirmarEmail({ ...dados, email: antes.email, enviadoEm: antes.enviadoEm }); return; }
        const r = await api.contaCodigo(dados.email, 'CADASTRO', idiomaDoEmail());
        if (!r.ok) { mostrarErro(form, r.error); return; }
        vistaConfirmarEmail({ ...dados, email: r.data.email, enviadoEm: Date.now() });
      }, [link(primeira ? 'Voltar para entrar' : 'Já tenho conta', () => vistaEntrar(), 'entrada-voltar')]), ...botoesDeLogin(sessao, primeira ? 'primeira' : 'cadastro'));
  }

  /** Botão de pedir outro código: fica desligado durante a espera que o Prumo exige entre um envio e outro. */
  function reenviar(enviar, id, enviadoEm = Date.now()) {
    const botao = link('Reenviar código', null, id); let fim = enviadoEm + 60_000;
    const rotulo = () => { const s = Math.ceil((fim - Date.now()) / 1000); botao.disabled = s > 0; botao.textContent = s > 0 ? tr('Reenviar código ({s} s)', { s }) : tr('Reenviar código'); return s > 0; };
    const relogio = setInterval(() => { if (!botao.isConnected || !rotulo()) clearInterval(relogio); }, 1000); rotulo();
    botao.addEventListener('click', async () => {
      botao.disabled = true; const r = await enviar();
      if (!r.ok) { avisar(mensagemDaEntrada(r.error), true); botao.disabled = false; return; }
      avisar(tr('Código reenviado.')); fim = Date.now() + 60_000; rotulo();
      const relogio2 = setInterval(() => { if (!botao.isConnected || !rotulo()) clearInterval(relogio2); }, 1000);
    });
    return botao;
  }
  const campoDoCodigo = (id) => campo(id, 'Código de 6 dígitos', 'text', { autocomplete: 'one-time-code', inputmode: 'numeric', maxlength: 6, pattern: '[0-9]{6}', placeholder: '000000' });

  /** Segunda etapa do cadastro: a pessoa digita o código que chegou no e-mail e a conta está criada. */
  function vistaConfirmarEmail(d) {
    const codigo = campoDoCodigo('confirmar-codigo');
    trocarVista(...cartao('Confirme seu e-mail', null), h('p', { class: 'entrada-desc' }, tr('Mandamos um código de 6 dígitos para'), ' ', h('strong', { 'data-i18n-ignore': '' }, d.email), tr('. Ele vale por 10 minutos. Confira também a caixa de spam.')),
      formulario([codigo], 'Concluir cadastro', async (form) => {
        if (d.primeira) {
          const r = await api.usuariosAtivar(d.email, d.nome, d.senha, codigo.input.value);
          if (!r.ok) { mostrarErro(form, r.error); return; }
          location.reload(); return;
        }
        const r = await api.contaCadastrar(d.email, d.nome, d.senha, codigo.input.value);
        if (!r.ok) { mostrarErro(form, r.error); return; }
        if (r.data.estado === 'PENDENTE') { vistaAviso('Cadastro enviado', 'E-mail confirmado. A Administração precisa aprovar a conta antes do primeiro acesso.'); return; }
        const e = await api.contaEntrar(d.email, d.senha); if (e.ok) { location.reload(); return; }
        vistaEntrar(mensagemDaEntrada(e.error));
      }, [reenviar(async () => { const r = await api.contaCodigo(d.email, 'CADASTRO', idiomaDoEmail()); if (r.ok) d.enviadoEm = Date.now(); return r; }, 'confirmar-reenviar', d.enviadoEm), link('Corrigir dados', () => vistaCriarConta(d.primeira, null, d), 'entrada-voltar')]));
  }
  /** Verificação em duas etapas: a senha conferiu; o código que chegou no e-mail termina a entrada. */
  function vistaConfirmarEntrada(d) {
    const codigo = campoDoCodigo('entrada-codigo-email');
    trocarVista(...cartao('Confirme que é você', null), h('p', { class: 'entrada-desc' }, tr('Mandamos um código de 6 dígitos para'), ' ', h('strong', { 'data-i18n-ignore': '' }, d.email), tr('. Digite o código para entrar.')),
      formulario([codigo], 'Entrar', async (form) => {
        const r = await api.contaConfirmarEntrada(d.desafio, codigo.input.value);
        if (!r.ok) { codigo.input.value = ''; mostrarErro(form, r.error); if (/^(CODE_EXPIRED|ACCOUNT_LOCKED)/.test(String(r.error))) setTimeout(() => vistaEntrar(mensagemDaEntrada(r.error)), 1500); return; }
        sessao = r.data; if (sessao.usuario?.trocarSenha) vistaTrocar(); else location.reload();
      }, [reenviar(() => api.contaReenviarEntrada(d.desafio, idiomaDoEmail()), 'entrada-reenviar-codigo'), link('Voltar para entrar', () => vistaEntrar(), 'entrada-voltar')]));
  }
  function vistaAviso(titulo, texto) {
    trocarVista(...cartao(titulo, texto), h('div', { class: 'entrada-links' }, DS.acao('Voltar para entrar', () => vistaEntrar(), { id: 'entrada-continuar', primaria: true })));
  }

  /** Esqueci a senha: um código vai para o e-mail da conta; com ele a pessoa define a senha nova. Começando em Minha conta, o e-mail já vem preenchido. */
  function vistaRecuperar() {
    if (sessao?.identidadeRemota) return vistaRecuperarRemoto();
    if (sessao?.loginMvpSemServico) return vistaServicoIndisponivel();
    const email = campo('recuperar-email', 'E-mail', 'email', { autocomplete: 'email', maxlength: 254, autocapitalize: 'off', value: sessao?.usuario?.email || '' });
    trocarVista(...cartao('Esqueci a senha', 'Vamos mandar um código ao e-mail da sua conta.'),
      DS.alerta('Conta sem e-mail (criada pela Administração ou pelo GitHub/Google): peça à Administração para redefinir sua senha.', 'info'),
      formulario([email], 'Enviar código', async (form) => {
        const r = await api.contaCodigo(email.input.value, 'SENHA', idiomaDoEmail());
        if (!r.ok) { mostrarErro(form, r.error); return; }
        vistaSenhaNova(r.data.email);
      }, [voltarDaRecuperacao()]));
  }
  const voltarDaRecuperacao = () => link(sessao?.usuario ? 'Voltar para Minha conta' : 'Voltar para entrar', () => {
    if (sessao?.usuario) { dialogo.close(); document.body.classList.remove('com-entrada'); minhaConta(); }
    else vistaEntrar();
  }, 'entrada-voltar');
  function vistaSenhaNova(email) {
    const codigo = campoDoCodigo('recuperar-codigo');
    const senha = campo('recuperar-senha', 'Senha nova', 'password', { autocomplete: 'new-password', maxlength: 200 }, 'Mínimo de 10 caracteres, com letras e números.');
    const confirma = campo('recuperar-confirma', 'Confirmar senha nova', 'password', { autocomplete: 'new-password', maxlength: 200 });
    // A tela não diz se o e-mail tem conta: a resposta é a mesma nos dois casos.
    trocarVista(...cartao('Defina a senha nova', null), h('p', { class: 'entrada-desc' }, tr('Se houver conta com'), ' ', h('strong', { 'data-i18n-ignore': '' }, email), tr(', mandamos um código de 6 dígitos. Ele vale por 10 minutos.')),
      formulario([codigo, senha, confirma], 'Definir senha nova', async (form) => {
        if (!iguais(form, senha, confirma)) return;
        const r = await api.contaRecuperar(email, codigo.input.value, senha.input.value);
        if (!r.ok) { mostrarErro(form, r.error); return; }
        // Se a recuperação começou em Minha conta, encerra a sessão antes do próximo login.
        if (sessao?.usuario) { await api.contaSair(); sessao = null; }
        trocarVista(...cartao('Senha nova definida', 'Entre com o seu e-mail e a senha nova.'), h('div', { class: 'entrada-links' }, DS.acao('Entrar', () => location.reload(), { primaria: true, id: 'entrada-continuar' })));
      }, [reenviar(() => api.contaCodigo(email, 'SENHA', idiomaDoEmail()), 'recuperar-reenviar'), voltarDaRecuperacao()]));
  }
  /** Senha temporária (dada pela Administração) precisa ser trocada antes de usar qualquer tela. */
  function vistaTrocar() {
    const atual = campo('trocar-atual', 'Senha temporária', 'password', { autocomplete: 'current-password', maxlength: 200 });
    const nova = campo('trocar-nova', 'Senha nova', 'password', { autocomplete: 'new-password', maxlength: 200 }, 'Mínimo de 10 caracteres, com letras e números.');
    const confirma = campo('trocar-confirma', 'Confirmar senha nova', 'password', { autocomplete: 'new-password', maxlength: 200 });
    trocarVista(...cartao('Troque a senha temporária', 'Por segurança, escolha uma senha só sua antes de continuar.'),
      formulario([atual, nova, confirma], 'Trocar senha', async (form) => {
        if (!iguais(form, nova, confirma)) return;
        const r = await api.contaSenha(atual.input.value, nova.input.value);
        if (!r.ok) { mostrarErro(form, r.error); return; }
        location.reload();
      }, [link('Sair', async () => { await api.contaSair(); location.reload(); }, 'entrada-sair')]));
  }

  // MVP: acesso por e-mail. Autorizações de repositórios ficam exclusivamente em Projetos.

  /** Esconde do menu o que o papel não permite (e o grupo que ficar vazio) e mostra quem está na sessão. */
  function aplicarMenu() {
    // Contextos (dentro de Agentes) e Evidências (dentro de Execuções) não têm item próprio no menu: o papel nunca os mostra.
    const SEM_ITEM_NO_MENU = ['contextos', 'evidencias'];
    for (const b of document.querySelectorAll('#nav button[data-aba]')) b.hidden = SEM_ITEM_NO_MENU.includes(b.dataset.aba) || !pode(b.dataset.aba);
    for (const g of document.querySelectorAll('#nav .grupo-nav')) g.hidden = ![...g.querySelectorAll('button[data-aba]')].some((b) => !b.hidden);
    document.querySelector('#conta-caixa')?.remove();
    if (!sessao?.usuario) return;
    const u = sessao.usuario; const menu = h('div', { id: 'conta-menu', class: 'controles popover conta-menu', hidden: true, role: 'menu' });
    const botao = h('button', { id: 'conta-botao', class: 'conta-botao', type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': 'conta-menu', 'aria-label': tr('Minha conta') + ': ' + u.nome },
      DS.avatar(u));
    const fechar = () => { menu.hidden = true; botao.setAttribute('aria-expanded', 'false'); };
    botao.addEventListener('click', (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; botao.setAttribute('aria-expanded', String(!menu.hidden)); });
    document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target)) fechar(); });
    menu.append(h('div', { class: 'conta-quem' }, h('button', { type: 'button', class: 'conta-foto-botao', id: 'conta-foto', 'aria-label': tr('Trocar foto'), title: tr('Trocar foto'), onclick: () => { fechar(); DS.trocarFoto(u); } }, DS.avatar(u, { classe: 'ds-avatar-grande' }), h('span', { class: 'conta-foto-lapis', 'aria-hidden': 'true' }, '✎')), h('strong', { 'data-i18n-ignore': '' }, u.nome), h('span', { class: 'suave', 'data-i18n-ignore': '' }, sessao.identidadeRemota ? u.papelNome : u.login + ' · ' + u.papelNome)),
      h('button', { type: 'button', class: 'acao', id: 'conta-minha', role: 'menuitem', onclick: () => { fechar(); minhaConta(); } }, tr('Minha conta')),
      h('button', { type: 'button', class: 'acao', id: 'conta-sair', role: 'menuitem', onclick: sair }, tr('Sair e trocar usuário')));
    document.querySelector('.topo-direita').prepend(h('div', { id: 'conta-caixa', class: 'ajustes-caixa', 'data-dica': u.nome + '\n' + tr('Menu da conta e trocar foto') }, botao, menu));
  }

  /** Minha conta: perfil e segurança em abas, com a mesma identidade visual das outras telas. */
  function minhaConta() {
    const u = sessao.usuario;
    const remota = !!sessao.identidadeRemota;
    const nomeVisivel = h('strong', { class: 'ds-conta-nome', 'data-i18n-ignore': '' }, u.nome);
    const foto = h('button', {
      type: 'button', class: 'conta-foto-botao ds-conta-foto', id: 'minha-trocar-foto',
      'aria-label': tr('Trocar foto'), title: tr('Trocar foto'), onclick: () => DS.trocarFoto(sessao.usuario)
    }, DS.avatar(u, { classe: 'ds-avatar-grande' }),
    h('span', { class: 'conta-foto-lapis', 'aria-hidden': 'true' }, '✎'));
    const cabecalho = h('div', { class: 'ds-conta-cabecalho' }, foto,
      h('div', { class: 'ds-conta-identidade' }, nomeVisivel,
        h('span', { class: 'ds-conta-email', 'data-i18n-ignore': '' }, u.email || u.login),
        h('span', { class: 'ds-conta-papel', 'data-i18n-ignore': '' }, u.papelNome)));

    const perfil = () => {
      const nome = h('input', { id: 'minha-nome', type: 'text', value: u.nome, maxlength: 80, autocomplete: 'name', required: true });
      const salvar = DS.acao('Salvar nome', async () => {
        if (!nome.value.trim()) { avisar(tr('Informe o nome.'), true); nome.focus(); return; }
        const r = await chamar(() => api.contaPerfil(nome.value.trim()));
        if (!r) return;
        sessao = r;
        nome.value = r.usuario.nome;
        nomeVisivel.textContent = r.usuario.nome;
        aplicarMenu();
        avisar(tr('Nome atualizado.'));
      }, { id: 'minha-salvar-nome', primaria: true });
      return [
        DS.secao('Dados da conta', [DS.meta([
          ['E-mail', h('span', { 'data-i18n-ignore': '' }, u.email || '—')],
          ...(!remota ? [['Login', h('span', { 'data-i18n-ignore': '' }, u.login)]] : []),
          ['Papel', h('span', { 'data-i18n-ignore': '' }, u.papelNome)],
          ['Último acesso', u.ultimoAcesso ? new Date(u.ultimoAcesso).toLocaleString() : '—']
        ], { linha: true })]),
        DS.secao('Nome de exibição', [
          h('div', { class: 'ds-conta-edicao' }, DS.campo('Nome', nome), salvar)
        ])
      ];
    };
    const seguranca = () => {
      const atual = h('input', { id: 'minha-atual', type: 'password', autocomplete: 'current-password', maxlength: 200 });
      const nova = h('input', { id: 'minha-nova', type: 'password', autocomplete: 'new-password', maxlength: 200 });
      const confirma = h('input', { id: 'minha-confirma', type: 'password', autocomplete: 'new-password', maxlength: 200 });
      const trocar = DS.acao('Trocar senha', async () => {
        if (!atual.value || !nova.value || !confirma.value) {
          avisar(tr('Preencha todos os campos.'), true); (atual.value ? (nova.value ? confirma : nova) : atual).focus(); return;
        }
        if (nova.value !== confirma.value) { avisar(tr('A confirmação não é igual à senha.'), true); confirma.focus(); return; }
        const r = await chamar(() => api.contaSenha(atual.value, nova.value));
        atual.value = nova.value = confirma.value = '';
        if (r) avisar(tr('Senha trocada.'));
      }, { id: 'minha-trocar-senha', primaria: true });
      const secoes = [
        DS.secao('Trocar senha', [
          h('div', { class: 'ds-conta-senhas' },
            DS.campo('Senha atual', atual), DS.campo('Senha nova', nova),
            DS.campo('Confirmar senha nova', confirma)),
          h('div', { class: 'ds-conta-rodape' }, trocar)
        ], { acoes: [DS.info(
          remota ? 'Senha com pelo menos 10 caracteres. Os outros computadores saem da conta.'
            : 'Senha com pelo menos 10 caracteres, misturando letras e números.',
          { rotulo: 'Regras da senha' })] })
      ];
      if (!remota) {
        const obrigatoria = !!sessao.exigirDuasEtapas && !!u.email;
        const senhaDuas = h('input', { id: 'minha-duas-senha', type: 'password', autocomplete: 'current-password', maxlength: 200 });
        let conteudo;
        if (!u.email) conteudo = [h('p', { class: 'suave' }, tr('Precisa de um e-mail na conta. Contas criadas por e-mail já têm.'))];
        else if (obrigatoria) conteudo = [h('p', { class: 'suave', id: 'minha-duas-obrigatoria' }, tr('Ligada pela Administração para todas as contas com e-mail: ao entrar, um código vai para o seu e-mail.'))];
        else conteudo = [
          h('p', { class: 'ds-conta-ajuda' }, tr(u.duasEtapas ? 'Ligada: ao entrar, depois da senha, um código vai para o seu e-mail.' : 'Desligada. Ligue para pedir também um código mandado ao seu e-mail sempre que entrar.')),
          h('div', { class: 'ds-conta-edicao' }, DS.campo('Senha atual', senhaDuas),
            DS.acao(u.duasEtapas ? 'Desligar' : 'Ligar', async () => {
              const r = await chamar(() => api.contaDuasEtapas(!u.duasEtapas, senhaDuas.value));
              senhaDuas.value = '';
              if (!r) return;
              sessao = r;
              avisar(tr(sessao.usuario.duasEtapas ? 'Verificação em duas etapas ligada.' : 'Verificação em duas etapas desligada.'));
              DS.fecharModal();
              minhaConta();
            }, { id: 'minha-duas-etapas', primaria: !u.duasEtapas }))
        ];
        secoes.push(DS.secao('Verificação em duas etapas', conteudo));
      }
      secoes.push(DS.secao('Recuperação de acesso', [
        h('div', { class: 'ds-conta-recuperacao' },
          h('span', { class: 'ds-conta-ajuda' }, tr(remota
            ? 'Esqueceu a senha atual? Mandamos um link para o seu e-mail e você define uma nova.'
            : (u.email ? 'Esqueceu a senha atual? Receba um código no seu e-mail e defina uma nova.'
              : 'Esta conta não tem e-mail. Esqueceu a senha atual? Solicite uma senha temporária à Administração.'))),
          u.email ? DS.acao(remota ? 'Enviar link para meu e-mail' : 'Redefinir senha pelo e-mail',
            remota ? async () => {
              const r = await chamar(() => api.contaCodigo(u.email, 'SENHA', idiomaDoEmail()));
              if (r) avisar(tr('Link enviado para {email}.', { email: u.email }));
            } : () => { DS.fecharModal(); vistaRecuperar(); },
            { id: 'minha-recuperar-senha' }) : null)
      ]));
      return secoes;
    };
    DS.modal('Minha conta', [cabecalho,
      ...DS.abasModal([
        ['perfil', 'Perfil', null, perfil],
        ['seguranca', 'Segurança', null, seguranca]
      ], 'perfil')
    ], { tamanho: 'md' });
  }

  /** Telas sem permissão ficam bloqueadas mesmo se alguém chamar mostrar() direto; telas só de consulta avisam no topo. */
  function protegerTelas() {
    const base = mostrar;
    mostrar = async function (aba) {
      // Nomes que não são módulos do menu valem pela tela onde moram: as rotas virtuais de app.js (Runs, Vínculos e afins) e Evidências ficam em Testes; Contextos, em Agentes.
      const alvo = rotasVirtuais[aba]?.[0] || { evidencias: 'testes', contextos: 'agentes' }[aba] || aba;
      if (!pode(alvo)) {
        estado.aba = alvo; for (const b of document.querySelectorAll('#nav button')) b.toggleAttribute('aria-current', false);
        $('#conteudo').replaceChildren(DS.estadoTela('bloqueado', 'Sem acesso a esta tela', 'O seu papel não inclui esta tela. Peça acesso à Administração.', [], { id: 'tela-sem-acesso' }));
        return;
      }
      const r = await base(aba);
      if (soVer(alvo) && estado.aba === alvo && !document.querySelector('#nota-so-ver')) $('#conteudo').prepend(h('div', { id: 'nota-so-ver' }, DS.notaPermissao('Seu papel permite só consultar esta tela; ações que alteram dados são recusadas.')));
      return r;
    };
  }

  /** Primeira tela permitida, quando Início não faz parte do papel. */
  const primeiraTela = () => [...document.querySelectorAll('#nav button[data-aba]')].find((b) => !b.hidden)?.dataset.aba || 'ajuda';

  /** Chamado pela inicialização da janela: true quando pode seguir (sem login ou com sessão válida). */
  async function iniciar() {
    // A entrada já fala o idioma salvo (ou o escolhido nela antes de entrar); as preferências são públicas.
    const pref = await api.preferencias(); let escolhido = null; try { escolhido = localStorage.getItem(IDIOMA_PENDENTE); } catch { /* sem armazenamento */ }
    const idioma = escolhido || (pref.ok ? pref.data.preferencias?.idioma : null); if (idioma) aplicarIdioma(idioma);
    const r = await api.contaSessao();
    if (!r.ok) { trocarVista(...cartao('Não foi possível ler as contas', null), DS.alerta('As informações das contas não puderam ser carregadas. Nenhum acesso foi liberado.', 'falha'), h('p', { class: 'entrada-regra' }, tr('O arquivo de contas deste computador está ilegível. Quem administra este computador pode restaurá-lo de um backup.'))); return false; }
    sessao = r.data;
    if (!sessao.loginAtivo) { vistaEntrar(); return false; }
    if (sessao.loginAtivo && !sessao.usuario) { vistaEntrar(sessao.expirou ? 'A sessão terminou por inatividade; entre de novo.' : null); return false; }
    if (sessao.usuario?.trocarSenha) { vistaTrocar(); return false; }
    await salvarIdiomaPendente();
    // O aplicativo escolhe a primeira tela autorizada após esta inicialização; não dispara duas navegações.
    aplicarMenu(); protegerTelas();
    // A sessão vence por inatividade no processo principal; a janela confere a cada minuto (sem renovar) e volta para a entrada.
    clearInterval(vigia);
    if (sessao.loginAtivo) vigia = setInterval(async () => { const s = await api.contaSessao(); if (s.ok && s.data.loginAtivo && !s.data.usuario) { clearInterval(vigia); vistaEntrar(tr('A sessão terminou por inatividade; entre de novo.')); } }, 60_000);
    return true;
  }

  /** Erro de sessão vindo de qualquer tela: abre a entrada uma vez, em vez de repetir avisos. */
  function tratarErro(erro) {
    const c = codigoDo(erro);
    if (c === 'SESSION_REQUIRED' || c === 'SESSION_EXPIRED') { if (!dialogo?.open) { clearInterval(vigia); vistaEntrar(c === 'SESSION_EXPIRED' ? 'A sessão terminou por inatividade; entre de novo.' : null); } return true; }
    if (c === 'LOGIN_SETUP_REQUIRED') { if (!dialogo?.open) vistaEntrar(); return true; }
    if (c === 'PASSWORD_CHANGE_REQUIRED') { if (!dialogo?.open) vistaTrocar(); return true; }
    return false;
  }

  const sair = async () => {
    const r = await api.contaSair();
    if (!r.ok) { avisar('Não foi possível encerrar a sessão. Tente novamente.', true); return; }
    // Descarta estado de tela, filtros e dados guardados pelo renderer anterior.
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* sessão IPC encerrada */ }
    sessao = null;
    location.reload();
  };
  /** Redefinir a senha pelo e-mail, a partir do Meu perfil: a mesma tela do Esqueci a senha, com o e-mail da conta. */
  const redefinirSenha = () => { if (!sessao?.usuario) return; DS.fecharModal?.(); vistaRecuperar(); };
  return { iniciar, tratarErro, pode, soVer, telaInicial: () => pode('inicio') ? 'inicio' : primeiraTela(), sessao: () => sessao, sair, redefinirSenha, abrirMinhaConta: () => { if (sessao?.usuario) minhaConta(); } };
})();
