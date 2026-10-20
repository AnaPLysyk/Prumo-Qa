/** Configuracoes: inicia o painel e prepara o estado compartilhado. */
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
