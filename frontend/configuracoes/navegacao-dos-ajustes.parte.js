/** Configuracoes: monta as abas e recarrega os dados ao abrir. */

    // ---------------- Abas ----------------
    const paineis = { perfil: painelPerfil, aparencia: painelAparencia, assistente: painelAssistente };
    // Os três painéis ficam na página; só o da aba escolhida aparece (os campos continuam acessíveis por id e por leitores de tela quando abertos).
    const area = h('div', { class: 'ajustes-conteudo' }, painelPerfil, painelAparencia, painelAssistente);
    const mostrarPainel = (k) => { const alvo = paineis[k] ? k : 'perfil'; estado.ajustesAba = alvo; for (const [id, no] of Object.entries(paineis)) no.hidden = id !== alvo; };
    const abas = DS.abas([['perfil', 'Meu perfil'], ['aparencia', 'Aparência'], ['assistente', 'Assistente']], estado.ajustesAba || 'perfil', mostrarPainel, { id: 'ajustes-abas', rotulo: 'Seções das configurações', attr: 'data-ajustes-aba' });
    caixa.replaceChildren(h('div', { class: 'ajustes-raiz' }, h('div', { class: 'ajustes-cab' }, h('strong', {}, tr('Configurações')), h('span', { class: 'suave' }, tr('Ajustes deste computador'))), abas, area));
    mostrarPainel(estado.ajustesAba || 'perfil');
    void desenharExternos(); void carregarPerfil(); desenharConta();
    // Ao abrir o painel, os dados são lidos de novo (perfil, conta e IA externa).
    $('#ajustes')?.addEventListener('click', () => { nome.value = ia().nome; estilo.value = ia().estilo; ler.checked = !!ia().lerRespostas; vozes(); estadoPerfil.textContent = ''; void desenharExternos(); void carregarPerfil(); desenharConta(); });
  }
  if (typeof montarControles === 'function') { const base = montarControles; montarControles = function () { base(); ajustesAssistente(); }; }
