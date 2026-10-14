'use strict';
/** Entrada do Prumo com o login ligado: entrar, criar conta, esqueci a senha, troca de senha temporária, menu da conta e telas por permissão. */
window.PrumoConta = (() => {
  let sessao = null; let dialogo = null; let vigia = null;
  const codigoDo = (erro) => /^([A-Z][A-Z0-9_]{2,63}):/.exec(String(erro || ''))?.[1] || null;
  const pode = (aba) => !sessao || !sessao.loginAtivo || (sessao.telas?.[aba] ?? 'NENHUM') !== 'NENHUM';
  const soVer = (aba) => !!sessao?.loginAtivo && sessao.telas?.[aba] === 'VER';

  /** Campo de formulário com rótulo visível; senha nunca é preenchida de volta. */
  function campo(id, rotulo, tipo, extra = {}) {
    const input = h('input', { id, type: tipo, required: true, spellcheck: 'false', ...extra });
    return { input, no: DS.campo(rotulo, input, { id }) };
  }
  function cartao(titulo, descricao, ...conteudo) {
    return [h('div', { class: 'entrada-marca' }, h('img', { src: '../../assets/prumo-icon.png', alt: '', width: 40, height: 40 }), h('strong', { 'data-i18n-ignore': '' }, 'Prumo QA')),
      h('h1', { id: 'entrada-titulo' }, tr(titulo)), descricao ? h('p', { class: 'entrada-desc' }, tr(descricao)) : null, ...conteudo];
  }
  const erroNo = () => h('p', { id: 'entrada-erro', class: 'entrada-erro', role: 'alert', hidden: true });
  function mostrarErro(form, erro) { const p = form.querySelector('#entrada-erro'); p.textContent = textoErro(erro); p.hidden = false; }
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
  const link = (texto, fn, id) => h('button', { type: 'button', class: 'ds-link', id, onclick: fn }, tr(texto));

  function abrirDialogo() {
    if (!dialogo) {
      dialogo = h('dialog', { id: 'entrada', class: 'entrada', 'aria-labelledby': 'entrada-titulo' });
      dialogo.addEventListener('cancel', (e) => e.preventDefault()); // Esc não fecha: sem entrar não há o que usar.
      document.body.append(dialogo);
    }
    document.body.classList.add('com-entrada');
    if (!dialogo.open) dialogo.showModal();
    return dialogo;
  }
  function trocarVista(...nos) { const d = abrirDialogo(); d.replaceChildren(h('div', { class: 'entrada-cartao' }, ...nos)); d.querySelector('input')?.focus(); }

  function vistaEntrar(aviso) {
    const login = campo('entrada-login', 'Login', 'text', { autocomplete: 'username', maxlength: 60, autocapitalize: 'off' });
    const senha = campo('entrada-senha', 'Senha', 'password', { autocomplete: 'current-password', maxlength: 200 });
    const rodape = [sessao?.cadastroAberto ? link('Criar conta', () => vistaCadastrar(), 'entrada-ir-cadastro') : null, link('Esqueci a senha', () => vistaRecuperar(), 'entrada-ir-recuperar')].filter(Boolean);
    trocarVista(...cartao('Entrar no Prumo QA', 'Use a conta que a Administração criou para você.'), aviso ? DS.alerta(aviso, 'aviso') : null,
      formulario([login, senha], 'Entrar', async (form) => {
        const r = await api.contaEntrar(login.input.value, senha.input.value);
        if (!r.ok) { senha.input.value = ''; mostrarErro(form, r.error); return; }
        sessao = r.data; if (sessao.usuario?.trocarSenha) vistaTrocar(); else location.reload();
      }, rodape));
  }
  function vistaCadastrar() {
    const nome = campo('cadastro-nome', 'Nome', 'text', { autocomplete: 'name', maxlength: 80 });
    const login = campo('cadastro-login', 'Login', 'text', { autocomplete: 'username', maxlength: 40, autocapitalize: 'off' });
    const senha = campo('cadastro-senha', 'Senha', 'password', { autocomplete: 'new-password', maxlength: 200 });
    const confirma = campo('cadastro-confirma', 'Confirmar senha', 'password', { autocomplete: 'new-password', maxlength: 200 });
    trocarVista(...cartao('Criar conta', sessao?.aprovarCadastros ? 'A conta só funciona depois que a Administração aprovar.' : 'A conta entra com o papel definido pela Administração.'),
      h('p', { class: 'entrada-regra' }, tr('Senha com pelo menos 10 caracteres, misturando letras e números.')),
      formulario([nome, login, senha, confirma], 'Criar conta', async (form) => {
        if (!iguais(form, senha, confirma)) return;
        const r = await api.contaCadastrar(login.input.value, nome.input.value, senha.input.value);
        if (!r.ok) { mostrarErro(form, r.error); return; }
        vistaCodigo(r.data.codigoRecuperacao, r.data.estado === 'PENDENTE' ? 'Cadastro enviado. A Administração precisa aprovar antes do primeiro acesso.' : 'Conta criada. Já pode entrar.', () => vistaEntrar());
      }, [link('Já tenho conta', () => vistaEntrar(), 'entrada-voltar')]));
  }
  function vistaRecuperar() {
    const login = campo('recuperar-login', 'Login', 'text', { autocomplete: 'username', maxlength: 60, autocapitalize: 'off' });
    const codigo = campo('recuperar-codigo', 'Código de recuperação', 'text', { autocomplete: 'off', maxlength: 40, placeholder: 'XXXXX-XXXXX-XXXXX-XXXXX' });
    const senha = campo('recuperar-senha', 'Senha nova', 'password', { autocomplete: 'new-password', maxlength: 200 });
    const confirma = campo('recuperar-confirma', 'Confirmar senha nova', 'password', { autocomplete: 'new-password', maxlength: 200 });
    trocarVista(...cartao('Esqueci a senha', 'Use o código de recuperação que apareceu quando a conta foi criada.'),
      DS.alerta('Sem o código, peça à Administração para redefinir sua senha: você recebe uma senha temporária e troca no primeiro acesso.', 'info'),
      formulario([login, codigo, senha, confirma], 'Definir senha nova', async (form) => {
        if (!iguais(form, senha, confirma)) return;
        const r = await api.contaRecuperar(login.input.value, codigo.input.value, senha.input.value);
        if (!r.ok) { mostrarErro(form, r.error); return; }
        vistaCodigo(r.data.codigoRecuperacao, 'Senha nova definida. O código antigo deixou de valer; guarde este.', () => vistaEntrar());
      }, [link('Voltar para entrar', () => vistaEntrar(), 'entrada-voltar')]));
  }
  /** Senha temporária (dada pela Administração) precisa ser trocada antes de usar qualquer tela. */
  function vistaTrocar() {
    const atual = campo('trocar-atual', 'Senha temporária', 'password', { autocomplete: 'current-password', maxlength: 200 });
    const nova = campo('trocar-nova', 'Senha nova', 'password', { autocomplete: 'new-password', maxlength: 200 });
    const confirma = campo('trocar-confirma', 'Confirmar senha nova', 'password', { autocomplete: 'new-password', maxlength: 200 });
    trocarVista(...cartao('Troque a senha temporária', 'Por segurança, escolha uma senha só sua antes de continuar.'),
      h('p', { class: 'entrada-regra' }, tr('Senha com pelo menos 10 caracteres, misturando letras e números.')),
      formulario([atual, nova, confirma], 'Trocar senha', async (form) => {
        if (!iguais(form, nova, confirma)) return;
        const r = await api.contaSenha(atual.input.value, nova.input.value);
        if (!r.ok) { mostrarErro(form, r.error); return; }
        if (r.data.codigoRecuperacao) vistaCodigo(r.data.codigoRecuperacao, 'Senha trocada.', () => location.reload()); else location.reload();
      }, [link('Sair', async () => { await api.contaSair(); location.reload(); }, 'entrada-sair')]));
  }
  /** O código de recuperação aparece uma única vez: o Prumo guarda só o resumo dele. */
  function vistaCodigo(codigo, mensagem, continuar) {
    const caixa = h('code', { id: 'entrada-codigo', class: 'entrada-codigo', 'data-i18n-ignore': '' }, codigo);
    trocarVista(...cartao('Guarde o código de recuperação', mensagem),
      caixa, h('p', { class: 'entrada-regra' }, tr('Ele aparece só agora. Com ele você define uma senha nova se esquecer a atual. Guarde fora deste computador.')),
      h('div', { class: 'entrada-links' }, DS.acao('Copiar código', async () => { try { await navigator.clipboard.writeText(codigo); avisar(tr('Código copiado.')); } catch { avisar(tr('Não foi possível copiar; anote o código.'), true); } }, { id: 'entrada-copiar' }),
        DS.acao('Guardei o código', () => continuar(), { primaria: true, id: 'entrada-continuar' })));
  }

  /** Esconde do menu o que o papel não permite (e o grupo que ficar vazio) e mostra quem está na sessão. */
  function aplicarMenu() {
    for (const b of document.querySelectorAll('#nav button[data-aba]')) b.hidden = !pode(b.dataset.aba);
    for (const g of document.querySelectorAll('#nav .grupo-nav')) g.hidden = ![...g.querySelectorAll('button[data-aba]')].some((b) => !b.hidden);
    document.querySelector('#conta-caixa')?.remove();
    if (!sessao?.usuario) return;
    const u = sessao.usuario; const menu = h('div', { id: 'conta-menu', class: 'controles popover conta-menu', hidden: true, role: 'menu' });
    const botao = h('button', { id: 'conta-botao', class: 'conta-botao', type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': 'conta-menu', title: tr('Minha conta') },
      h('span', { class: 'conta-iniciais', 'aria-hidden': 'true', 'data-i18n-ignore': '' }, DS.iniciais(u.nome)), h('span', { class: 'conta-nome', 'data-i18n-ignore': '' }, u.nome));
    const fechar = () => { menu.hidden = true; botao.setAttribute('aria-expanded', 'false'); };
    botao.addEventListener('click', (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; botao.setAttribute('aria-expanded', String(!menu.hidden)); });
    document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target)) fechar(); });
    menu.append(h('div', { class: 'conta-quem' }, h('strong', { 'data-i18n-ignore': '' }, u.nome), h('span', { class: 'suave', 'data-i18n-ignore': '' }, u.login + ' · ' + u.papelNome)),
      h('button', { type: 'button', class: 'acao', id: 'conta-minha', role: 'menuitem', onclick: () => { fechar(); minhaConta(); } }, tr('Minha conta')),
      h('button', { type: 'button', class: 'acao', id: 'conta-sair', role: 'menuitem', onclick: async () => { await api.contaSair(); location.reload(); } }, tr('Sair')));
    document.querySelector('.topo-direita').prepend(h('div', { id: 'conta-caixa', class: 'ajustes-caixa' }, botao, menu));
  }

  /** Minha conta: trocar o nome de exibição e a senha. A senha atual é sempre pedida. */
  function minhaConta() {
    const u = sessao.usuario;
    const nome = h('input', { id: 'minha-nome', type: 'text', value: u.nome, maxlength: 80, autocomplete: 'name' });
    const atual = h('input', { id: 'minha-atual', type: 'password', autocomplete: 'current-password', maxlength: 200 });
    const nova = h('input', { id: 'minha-nova', type: 'password', autocomplete: 'new-password', maxlength: 200 });
    const confirma = h('input', { id: 'minha-confirma', type: 'password', autocomplete: 'new-password', maxlength: 200 });
    DS.modal('Minha conta', [
      DS.meta([['Login', h('span', { 'data-i18n-ignore': '' }, u.login)], ['Papel', h('span', { 'data-i18n-ignore': '' }, u.papelNome)], ['Último acesso', u.ultimoAcesso ? new Date(u.ultimoAcesso).toLocaleString() : '—']]),
      DS.secao('Nome de exibição', [DS.campo('Nome', nome), DS.rodape(DS.acao('Salvar nome', async () => {
        const r = await chamar(() => api.contaPerfil(nome.value)); if (!r) return; sessao = r; aplicarMenu(); avisar(tr('Nome atualizado.'));
      }, { id: 'minha-salvar-nome' }))]),
      DS.secao('Trocar senha', [h('p', { class: 'suave' }, tr('Senha com pelo menos 10 caracteres, misturando letras e números.')), DS.campo('Senha atual', atual), DS.campo('Senha nova', nova), DS.campo('Confirmar senha nova', confirma),
        DS.rodape(DS.acao('Trocar senha', async () => {
          if (nova.value !== confirma.value) { avisar(tr('A confirmação não é igual à senha.'), true); return; }
          const r = await chamar(() => api.contaSenha(atual.value, nova.value)); atual.value = nova.value = confirma.value = ''; if (!r) return;
          avisar(tr('Senha trocada.'));
          if (r.codigoRecuperacao) { DS.fecharModal(); vistaCodigo(r.codigoRecuperacao, 'Senha trocada.', () => { dialogo.close(); document.body.classList.remove('com-entrada'); }); }
        }, { id: 'minha-trocar-senha', primaria: true }))])
    ], { tamanho: 'sm', subtitulo: u.nome });
  }

  /** Telas sem permissão ficam bloqueadas mesmo se alguém chamar mostrar() direto; telas só de consulta avisam no topo. */
  function protegerTelas() {
    const base = mostrar;
    mostrar = async function (aba) {
      const alvo = { runs: 'testes', automacoes: 'testes', vinculos: 'rastreabilidade' }[aba] || aba;
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
    const r = await api.contaSessao();
    if (!r.ok) { trocarVista(...cartao('Não foi possível ler as contas', null), DS.alerta(textoErro(r.error), 'falha'), h('p', { class: 'entrada-regra' }, tr('O arquivo de contas deste computador está ilegível. Quem administra o Windows pode restaurá-lo de um backup.'))); return false; }
    sessao = r.data;
    if (sessao.loginAtivo && !sessao.usuario) { vistaEntrar(sessao.expirou ? 'A sessão terminou por inatividade; entre de novo.' : null); return false; }
    if (sessao.usuario?.trocarSenha) { vistaTrocar(); return false; }
    aplicarMenu(); protegerTelas();
    if (sessao.loginAtivo && !pode('inicio')) { const p = primeiraTela(); setTimeout(() => mostrar(p), 0); }
    // A sessão vence por inatividade no processo principal; a janela confere a cada minuto (sem renovar) e volta para a entrada.
    clearInterval(vigia);
    if (sessao.loginAtivo) vigia = setInterval(async () => { const s = await api.contaSessao(); if (s.ok && s.data.loginAtivo && !s.data.usuario) { clearInterval(vigia); vistaEntrar(tr('A sessão terminou por inatividade; entre de novo.')); } }, 60_000);
    return true;
  }

  /** Erro de sessão vindo de qualquer tela: abre a entrada uma vez, em vez de repetir avisos. */
  function tratarErro(erro) {
    const c = codigoDo(erro);
    if (c === 'SESSION_REQUIRED' || c === 'SESSION_EXPIRED') { if (!dialogo?.open) { clearInterval(vigia); vistaEntrar(c === 'SESSION_EXPIRED' ? 'A sessão terminou por inatividade; entre de novo.' : null); } return true; }
    if (c === 'PASSWORD_CHANGE_REQUIRED') { if (!dialogo?.open) vistaTrocar(); return true; }
    return false;
  }

  return { iniciar, tratarErro, pode, soVer, sessao: () => sessao, recarregarSessao: async () => { const r = await api.contaSessao(); if (r.ok) { sessao = r.data; aplicarMenu(); } return sessao; } };
})();
