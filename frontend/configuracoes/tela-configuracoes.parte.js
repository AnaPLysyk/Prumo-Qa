/** Configurações: perfil, assistente, aparência e navegação de ajustes. */
  // Meu perfil: o que o Prumo sabe da pessoa. O assistente local usa tudo; a IA externa (Claude Code/Codex) só recebe
  // experiência, foco e conta se a pessoa marcar "Compartilhar com a IA externa". Cada mudança é salva ao sair do campo.
  const PAPEIS_PERFIL = [['', 'Não informado'], ['qa', 'QA'], ['dev', 'Desenvolvimento'], ['po', 'Produto (PO)'], ['analista', 'Análise'], ['outro', 'Outro']];
  const EXPERIENCIAS_PERFIL = [['', 'Não informada'], ['iniciante', 'Iniciante: explique os passos'], ['intermediario', 'Intermediária'], ['avancado', 'Avançada: direto ao ponto']];
  const LIMITE_FOCO_TELA = 160;

  function ajustesAssistente() {
    const caixa = $('#controles'); if (!caixa || caixa.querySelector('.ajustes-raiz')) return;
    const ia = () => estado.prefs?.ia || { nome: 'Prumo', estilo: 'amigavel', voz: null, lerRespostas: false, delegacao: { claude: false, codex: false } };
    async function salvarIa(parcial) { const r = await chamar(() => api.salvarPreferencias({ ia: parcial })); if (r) { estado.prefs = { ...(estado.prefs || {}), ...(r.preferencias || {}) }; conversa.recarregar(); } return r; }
    const campo = (rotulo, no) => h('div', { class: 'ajuste-campo' }, h('label', { class: 'ajuste-rotulo' }, tr(rotulo), no));
    const secao = (titulo, ...filhos) => h('section', { class: 'ajuste-secao' }, h('h3', { class: 'ajuste-titulo' }, tr(titulo)), ...filhos);

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
        ? h('div', { class: 'ajuste-conta-linha' }, h('button', { type: 'button', class: 'conta-foto-botao', id: 'ia-trocar-foto', 'aria-label': tr('Trocar foto'), title: tr('Trocar foto'), onclick: () => DS.trocarFoto(u) }, DS.avatar(u), h('span', { class: 'conta-foto-lapis', 'aria-hidden': 'true' }, '✎')), h('div', { class: 'ajuste-conta-nome' }, h('strong', { 'data-i18n-ignore': '' }, u.nome), h('span', { class: 'suave', 'data-i18n-ignore': '' }, window.PrumoConta.sessao()?.identidadeRemota ? u.papelNome : u.login + ' · ' + u.papelNome)),
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

    // ---------------- Aparência (tema, idioma e cor vêm de montarControles) ----------------
    const painelAparencia = h('div', { class: 'ajuste-painel', 'data-painel': 'aparencia' }, secao('Aparência', ...caixa.children));

    // ---------------- Assistente ----------------
    const nome = h('input', { id: 'ia-nome', maxlength: 40, value: ia().nome, autocomplete: 'off' });
    nome.addEventListener('change', async () => { const v = nome.value.trim(); if (!v || !/^[\p{L}\p{N} ._-]+$/u.test(v)) { nome.value = ia().nome; avisar(tr('Use letras, números, espaço, ponto, hífen ou sublinhado.'), true); return; } await salvarIa({ nome: v }); });
    const estilo = h('select', { id: 'ia-estilo' }, [['amigavel', 'Amigável e educado'], ['direto', 'Direto ao ponto'], ['tecnico', 'Técnico, com detalhes']].map(([v, t]) => h('option', { value: v, selected: v === ia().estilo }, tr(t))));
    estilo.addEventListener('change', () => salvarIa({ estilo: estilo.value }));
    const voz = h('select', { id: 'ia-voz' });
    const ler = h('input', { type: 'checkbox', id: 'ia-ler', checked: !!ia().lerRespostas });
    ler.addEventListener('change', () => salvarIa({ lerRespostas: ler.checked }));
    function vozes() { const lista = 'speechSynthesis' in window ? speechSynthesis.getVoices() : []; voz.replaceChildren(h('option', { value: '' }, tr('Voz padrão do sistema')), ...lista.map((v) => h('option', { value: v.name, selected: v.name === ia().voz }, v.name + ' (' + v.lang + ')'))); voz.disabled = !lista.length; }
    vozes(); if ('speechSynthesis' in window) speechSynthesis.addEventListener?.('voiceschanged', vozes);
    voz.addEventListener('change', () => salvarIa({ voz: voz.value || null }));
    const externos = h('div', { class: 'ajuste-externos' });
    async function desenharExternos() {
      const r = await chamar(() => api.assistenteAgentes(estado.espaco?.id ?? null)); if (!r) return;
      externos.replaceChildren(...r.provedores.map((p) => {
        const nomeP = p.nome;
        const chave = h('input', { type: 'checkbox', 'data-provedor': p.id, checked: p.autorizado, disabled: !p.disponivel && !p.autorizado });
        chave.addEventListener('change', async () => { const x = await chamar(() => api.iaDelegacao(p.id, chave.checked)); if (!x || x.canceled) chave.checked = !chave.checked; else { estado.prefs = { ...(estado.prefs || {}), ia: x.ia }; conversa.recarregar(); } });
        const situacao = p.disponivel ? (p.autorizado ? tr('autorizado no chat') : tr('instalado, não autorizado')) : p.atalho ? tr('só atalho .cmd; indisponível') : tr('não encontrado');
        const mcp = p.projetoComMcp ? tr('MCP do Prumo disponível para consulta no chat') : tr('Sem pasta local vinculada: chat sem MCP');
        return h('label', { class: 'ajuste-chave ajuste-ia', 'data-ia': p.id }, chave, h('span', { class: 'v36c-marca', 'data-ia': p.id, 'aria-hidden': 'true' }, { claude: 'C', codex: 'X', copilot: 'G', gemini: '✦' }[p.id]), h('span', { class: 'ajuste-ia-nome' }, nomeP, h('small', {}, p.autorizado && p.disponivel ? mcp : situacao)), h('small', {}, p.autorizado && p.disponivel ? tr('autorizado no chat') : situacao));
      }));
    }
    const painelAssistente = h('div', { class: 'ajuste-painel', 'data-painel': 'assistente' },
      secao('Assistente', campo('Nome do assistente', nome), campo('Estilo das respostas', estilo), campo('Voz do assistente', voz), h('label', { class: 'ajuste-chave' }, ler, h('span', {}, tr('Ler respostas em voz alta')))),
      secao('IA externa no chat (opcional)', externos, DS.info('Sem IA externa, os agentes respondem com os dados deste computador. Autorizar pede confirmação.', { rotulo: 'Sobre a IA externa' })),
      secao('Duas formas de usar', h('div', { class: 'ajuste-formas' },
        h('div', { class: 'ajuste-forma' }, h('strong', {}, tr('Pelo Prumo')), h('p', {}, tr('Na tela Início, escolha com quem falar: o Orchestrator direto ou a IA autorizada acima. Ela responde no chat e consulta o Prumo pelo MCP, só para leitura.'))),
        h('div', { class: 'ajuste-forma' }, h('strong', {}, tr('Pelo cliente da IA')), h('p', {}, tr('Converse no Claude Code, Codex, Copilot ou Gemini e conecte o MCP do Prumo a ele em Conexões; a IA passa a consultar o projeto a partir do próprio chat.')), h('button', { type: 'button', class: 'v36c-fonte', onclick: () => { document.querySelector('#ajustes')?.click(); void mostrar('conexoes'); } }, tr('Abrir Conexões'), h('span', { 'aria-hidden': 'true' }, '↗'))))));

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
