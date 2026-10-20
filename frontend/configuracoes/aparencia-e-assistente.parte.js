/** Configuracoes: aparencia, voz e autorizacao de IA externa. */

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
        const nomeP = p.id === 'claude' ? 'Claude Code' : 'Codex';
        const chave = h('input', { type: 'checkbox', 'data-provedor': p.id, checked: p.autorizado, disabled: !p.disponivel && !p.autorizado });
        chave.addEventListener('change', async () => { const x = await chamar(() => api.iaDelegacao(p.id, chave.checked)); if (!x || x.canceled) chave.checked = !chave.checked; else { estado.prefs = { ...(estado.prefs || {}), ia: x.ia }; conversa.recarregar(); } });
        const situacao = p.disponivel ? (p.autorizado ? tr('autorizado no chat') : tr('instalado, não autorizado')) : p.atalho ? tr('só atalho .cmd; indisponível') : tr('não encontrado');
        return h('label', { class: 'ajuste-chave' }, chave, h('span', {}, nomeP), h('small', {}, situacao));
      }));
    }
    const painelAssistente = h('div', { class: 'ajuste-painel', 'data-painel': 'assistente' },
      secao('Assistente', campo('Nome do assistente', nome), campo('Estilo das respostas', estilo), campo('Voz do assistente', voz), h('label', { class: 'ajuste-chave' }, ler, h('span', {}, tr('Ler respostas em voz alta')))),
      secao('IA externa no chat (opcional)', externos, DS.info('Sem IA externa, os agentes respondem com os dados deste computador. Autorizar pede confirmação.', { rotulo: 'Sobre a IA externa' })));
