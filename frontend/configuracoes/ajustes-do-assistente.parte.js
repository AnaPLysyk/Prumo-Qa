/** Reúne trecho visual da função configuracoes para o bundle interfaces-v36. */
  function ajustesAssistente() {
    const caixa = $('#controles'); if (!caixa || caixa.querySelector('.v36-ajustes-ia')) return;
    caixa.prepend(h('div', { class: 'v36-ajustes-titulo' }, tr('Sistema')));
    const ia = () => estado.prefs?.ia || { nome: 'Prumo', estilo: 'amigavel', voz: null, lerRespostas: false, delegacao: { claude: false, codex: false } };
    async function salvar(parcial) { const r = await chamar(() => api.salvarPreferencias({ ia: parcial })); if (r) { estado.prefs = { ...(estado.prefs || {}), ...(r.preferencias || {}) }; conversa.recarregar(); } return r; }
    const nome = h('input', { id: 'ia-nome', maxlength: 40, value: ia().nome, 'aria-label': tr('Nome do assistente'), autocomplete: 'off' });
    const pessoa = h('input', { id: 'ia-pessoa', maxlength: 30, 'aria-label': 'Como chamar você', autocomplete: 'off' });
    const papel = h('select', { id: 'ia-papel', 'aria-label': 'Seu papel no time' }, [['', 'Não informado'], ['qa', 'QA'], ['dev', 'Desenvolvimento'], ['po', 'Produto (PO)'], ['analista', 'Análise'], ['outro', 'Outro']].map(([value, rotulo]) => h('option', { value }, rotulo)));
    async function carregarPerfil() { const r = await chamar(() => api.perfilObter()); if (r) { pessoa.value = r.comoChamar || ''; papel.value = r.papel || ''; } }
    pessoa.addEventListener('change', () => chamar(() => api.perfilSalvar({ comoChamar: pessoa.value.trim() || null })));
    papel.addEventListener('change', () => chamar(() => api.perfilSalvar({ papel: papel.value || null })));
    nome.addEventListener('change', async () => { const v = nome.value.trim(); if (!v || !/^[\p{L}\p{N} ._-]+$/u.test(v)) { nome.value = ia().nome; avisar(tr('Use letras, números, espaço, ponto, hífen ou sublinhado.'), true); return; } await salvar({ nome: v }); });
    const estilo = h('select', { id: 'ia-estilo', 'aria-label': tr('Estilo das respostas') }, [['amigavel', 'Amigável e educado'], ['direto', 'Direto ao ponto'], ['tecnico', 'Técnico, com detalhes']].map(([v, t]) => h('option', { value: v, selected: v === ia().estilo }, tr(t))));
    estilo.addEventListener('change', () => salvar({ estilo: estilo.value }));
    const voz = h('select', { id: 'ia-voz', 'aria-label': tr('Voz do assistente') });
    const ler = h('input', { type: 'checkbox', id: 'ia-ler', checked: !!ia().lerRespostas });
    ler.addEventListener('change', () => salvar({ lerRespostas: ler.checked }));
    function vozes() { const lista = 'speechSynthesis' in window ? speechSynthesis.getVoices() : []; voz.replaceChildren(h('option', { value: '' }, tr('Voz padrão do sistema')), ...lista.map((v) => h('option', { value: v.name, selected: v.name === ia().voz }, v.name + ' (' + v.lang + ')'))); voz.disabled = !lista.length; }
    vozes(); if ('speechSynthesis' in window) speechSynthesis.addEventListener?.('voiceschanged', vozes);
    voz.addEventListener('change', () => salvar({ voz: voz.value || null }));
    const externos = h('div', { class: 'v36-ajustes-externos' });
    async function desenharExternos() {
      const r = await chamar(() => api.assistenteAgentes(estado.espaco?.id ?? null)); if (!r) return;
      externos.replaceChildren(...r.provedores.map((p) => {
        const nomeP = p.id === 'claude' ? 'Claude Code' : 'Codex';
        const chave = h('input', { type: 'checkbox', 'data-provedor': p.id, checked: p.autorizado, disabled: !p.disponivel && !p.autorizado });
        chave.addEventListener('change', async () => { const x = await chamar(() => api.iaDelegacao(p.id, chave.checked)); if (!x || x.canceled) chave.checked = !chave.checked; else { estado.prefs = { ...(estado.prefs || {}), ia: x.ia }; conversa.recarregar(); } });
        const situacao = p.disponivel ? (p.autorizado ? tr('autorizado no chat') : tr('instalado, não autorizado')) : p.atalho ? tr('só atalho .cmd; indisponível') : tr('não encontrado');
        return h('label', { class: 'v36-ajustes-linha' }, chave, h('span', {}, nomeP), h('small', {}, situacao));
      }));
    }
    const linha = (rotulo, no) => h('label', { class: 'ajuste' }, h('span', {}, tr(rotulo)), no);
    caixa.append(h('div', { class: 'v36-ajustes-ia' }, h('div', { class: 'v36-ajustes-titulo' }, tr('Assistente')),
      linha('Nome do assistente', nome), linha('Como chamar você', pessoa), linha('Seu papel no time', papel), linha('Estilo das respostas', estilo), linha('Voz do assistente', voz),
      h('label', { class: 'v36-ajustes-linha' }, ler, h('span', {}, tr('Ler respostas em voz alta'))),
      h('div', { class: 'v36-ajustes-sub' }, tr('IA externa no chat (opcional)')), externos,
      h('p', { class: 'v36-ajustes-nota' }, tr('Sem IA externa, os agentes respondem com os dados deste computador. Autorizar pede confirmação.'))));
    desenharExternos(); carregarPerfil();
    $('#ajustes')?.addEventListener('click', () => { nome.value = ia().nome; estilo.value = ia().estilo; ler.checked = !!ia().lerRespostas; vozes(); desenharExternos(); });
  }
  if (typeof montarControles === 'function') { const base = montarControles; montarControles = function () { base(); ajustesAssistente(); }; }
  // mostrar() transfere os filhos do recipiente temporário para o main; a classe
  // precisa acompanhar os filhos para manter estilos restritos ao módulo.
