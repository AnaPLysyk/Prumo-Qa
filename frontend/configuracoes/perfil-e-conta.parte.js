/** Configuracoes: campos do perfil, conta e compartilhamento com IA. */

    // ---------------- Meu perfil ----------------
    const pessoa = h('input', { id: 'ia-pessoa', maxlength: 30, autocomplete: 'off', placeholder: tr('Como você quer ser chamada(o)') });
    const papel = h('select', { id: 'ia-papel' }, PAPEIS_PERFIL.map(([value, rotulo]) => h('option', { value }, tr(rotulo))));
    const experiencia = h('select', { id: 'ia-experiencia' }, EXPERIENCIAS_PERFIL.map(([value, rotulo]) => h('option', { value }, tr(rotulo))));
    const foco = h('input', { id: 'ia-foco', maxlength: LIMITE_FOCO_TELA, autocomplete: 'off', placeholder: tr('Ex.: automação de API e regressão') });
    const contador = h('span', { class: 'ajuste-contador', 'aria-hidden': 'true' }, '0/' + LIMITE_FOCO_TELA);
    const compartilhar = h('input', { type: 'checkbox', id: 'ia-compartilhar' });
    const estadoPerfil = h('p', { class: 'ajuste-estado', id: 'ia-perfil-estado', role: 'status', 'aria-live': 'polite' });
    const contaResumo = h('div', { class: 'ajuste-conta', id: 'ia-conta' });
    const atualizarContador = () => { contador.textContent = foco.value.length + '/' + LIMITE_FOCO_TELA; };
    async function carregarPerfil() {
      const r = await chamar(() => api.perfilObter()); if (!r) return;
      pessoa.value = r.comoChamar || ''; papel.value = r.papel || ''; experiencia.value = r.experiencia || ''; foco.value = r.foco || ''; compartilhar.checked = !!r.compartilharComIa; atualizarContador();
    }
    async function salvarPerfil(parcial) {
      const r = await chamar(() => api.perfilSalvar(parcial)); if (!r) { void carregarPerfil(); return; }
      estadoPerfil.textContent = tr('Perfil salvo. Os agentes já usam estes dados.'); conversa.recarregar();
    }
    pessoa.addEventListener('change', () => salvarPerfil({ comoChamar: pessoa.value.trim() || null }));
    papel.addEventListener('change', () => salvarPerfil({ papel: papel.value || null }));
    experiencia.addEventListener('change', () => salvarPerfil({ experiencia: experiencia.value || null }));
    foco.addEventListener('input', atualizarContador);
    foco.addEventListener('change', () => salvarPerfil({ foco: foco.value.trim() || null }));
    compartilhar.addEventListener('change', () => salvarPerfil({ compartilharComIa: compartilhar.checked }));
    function desenharConta() {
      const u = window.PrumoConta?.sessao?.()?.usuario;
      contaResumo.replaceChildren(u
        ? h('div', { class: 'ajuste-conta-linha' }, h('span', { class: 'conta-iniciais', 'aria-hidden': 'true', 'data-i18n-ignore': '' }, DS.iniciais(u.nome)), h('div', { class: 'ajuste-conta-nome' }, h('strong', { 'data-i18n-ignore': '' }, u.nome), h('span', { class: 'suave', 'data-i18n-ignore': '' }, u.login + ' · ' + u.papelNome)),
          h('div', { class: 'ajuste-conta-acoes' }, DS.acao('Minha conta', () => window.PrumoConta.abrirMinhaConta(), { id: 'ia-abrir-conta', compacto: true }),
            u.email ? DS.acao(window.PrumoConta.sessao()?.identidadeRemota ? 'Recuperar acesso' : 'Redefinir senha', () => window.PrumoConta.redefinirSenha(), { id: 'ia-redefinir-senha', compacto: true }) : null,
            DS.acao('Sair e trocar usuário', () => window.PrumoConta.sair(), { id: 'ia-sair', compacto: true })))
        : h('span'));
    }
    const painelPerfil = h('div', { class: 'ajuste-painel', 'data-painel': 'perfil' },
      secao('Conta', contaResumo),
      secao('Como o Prumo conhece você',
        campo('Como chamar você', pessoa), campo('Seu papel no time', papel), campo('Experiência', experiencia),
        campo('Foco de trabalho', h('span', { class: 'ajuste-com-contador' }, foco, contador)),
        h('label', { class: 'ajuste-chave' }, compartilhar, h('span', {}, tr('Compartilhar experiência, foco e conta com a IA externa')),
          DS.info('O assistente do Prumo usa estes dados neste computador. Só se você marcar isto, Claude Code e Codex também recebem experiência, foco e o papel da sua conta, como dados e não como instrução. O nome e o papel no time já iam para a IA externa autorizada.', { rotulo: 'Sobre o compartilhamento' })),
        estadoPerfil));
