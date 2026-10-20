'use strict';
/** Mostra os Contextos como modal dos Agentes, sem criar tela separada no menu. */
// ======================= Contextos dentro de Agentes =======================
// Como Evidências: sem item próprio no menu. Os contextos são o que os agentes podem ler (Cérebro mostra os
// aprovados); a gestão completa (cadastro, aprovação, conflito, histórico) abre em modal a partir de Agentes.
(() => {
  async function montarContextos(el) {
    el.append(h('h1', {}, 'Contextos'));
    if (!estado.root) return el.append(semProjeto());
    const rotuloTipo = { requisito: 'Requisito', regra_negocio: 'Regra de negócio', criterio_aceite: 'Critério de aceite', restricao_tecnica: 'Restrição técnica', decisao: 'Decisão' };
    const f = estado.filtroCtx || (estado.filtroCtx = {});
    const lista = await chamar(() => api.contextosListar(estado.root, { tipo: f.tipo, estado: f.estado, busca: f.busca })); if (!lista) return;
    const painel = h('div', { id: 'painel-contexto' });
    const recarregar = () => mostrar('contextos');
    const opcoes = (obj, atual) => Object.entries(obj).map(([k, v]) => h('option', { value: k, selected: atual === k }, v));
    const marcaMcp = h('input', { type: 'checkbox', id: 'ctx-mcp', checked: lista.disponibilizarAoMcp, onchange: async (e) => {
      const r = await chamar(() => api.contextosMcp(estado.root, e.target.checked)); if (!r || r.canceled) { e.target.checked = !e.target.checked; return; } avisar(r.disponibilizarAoMcp ? 'Contextos disponibilizados ao agente de IA deste projeto.' : 'Contextos não serão mais enviados ao agente de IA.'); } });
    el.append(h('div', { class: 'ds-mcp-chave' }, h('label', { class: 'opcao', for: 'ctx-mcp' }, marcaMcp, tr('Disponibilizar os contextos deste projeto ao agente de IA conectado (MCP)')),
      DS.info(tr('Desabilitado por padrão. Habilitado, o texto dos contextos (com segredos mascarados) pode ser lido pelo agente conectado e processado pelo provedor da IA. Contextos de outros projetos nunca são enviados.'), { rotulo: 'Sobre o compartilhamento' })));
    const campoBusca = DS.busca({ id: 'ctx-f-busca', placeholder: 'Buscar contexto', valor: f.busca || '', aoEnter: () => { f.busca = campoBusca.input.value || undefined; recarregar(); } });
    campoBusca.input.addEventListener('change', () => { f.busca = campoBusca.input.value || undefined; recarregar(); });
    el.append(DS.barra(campoBusca.no,
      DS.selecao({ id: 'ctx-f-tipo', rotulo: 'Tipo', opcoes: [['', 'Todos os tipos'], ...Object.entries(rotuloTipo)], valor: f.tipo || '', aoMudar: (v) => { f.tipo = v || undefined; recarregar(); } }),
      DS.selecao({ id: 'ctx-f-estado', rotulo: 'Estado', opcoes: [['', 'Todos os estados'], ...['RASCUNHO', 'APROVADO', 'CONFLITANTE', 'DESATUALIZADO'].map((x) => [x, x])], valor: f.estado || '', aoMudar: (v) => { f.estado = v || undefined; recarregar(); } }),
      DS.acao('Novo contexto', () => formulario(), { id: 'ctx-novo', primaria: true, icone: 'mais' })), painel);
    el.append(lista.contextos.length ? h('table', { id: 'ctx-tabela' }, h('thead', {}, h('tr', {}, ['Contexto', 'Tipo', 'Estado', 'Versão', 'Origem', 'Atualizado'].map((t) => h('th', {}, t)))),
      h('tbody', {}, lista.contextos.map((c) => h('tr', {}, h('td', {}, h('button', { class: 'acao', 'data-id': c.id, onclick: () => detalhe(c.id) }, c.titulo), c.chave ? h('div', { class: 'suave' }, c.chave) : null, c.alertaDeInstrucao ? h('div', { class: 'suave' }, 'contém texto que parece instrução') : null),
        h('td', {}, rotuloTipo[c.tipo]), h('td', {}, selo(c.estado), c.integridade === 'ADULTERADO' ? h('div', { class: 'suave' }, 'ADULTERADO') : null), h('td', { class: 'num' }, 'v' + c.versao), h('td', {}, c.origem.referencia || '— sem origem —'), h('td', {}, hora(c.atualizadoEm))))))
      : h('div', { class: 'vazio' }, lista.total ? 'Nenhum contexto para estes filtros.' : 'Nenhum contexto cadastrado. Use "Novo contexto" para registrar o primeiro requisito.'));
    if (lista.problemas.length) el.append(h('div', { class: 'nota' }, lista.problemas.length + ' arquivo(s) de contexto inválidos foram ignorados.'));

    function formulario(atual, modo) { // modo: undefined (novo/editar) ou 'substituir'
      const v = atual || { tipo: 'requisito', titulo: '', texto: '', chave: '', origem: { tipo: 'documento', referencia: '' } };
      const campo = (id, rot, no) => h('label', {}, rot, no);
      const tipo = h('select', { id: 'ctx-tipo' }, opcoes(rotuloTipo, v.tipo));
      const titulo = h('input', { id: 'ctx-titulo', value: v.titulo, maxlength: 200 }); const chave = h('input', { id: 'ctx-chave', value: v.chave || '', maxlength: 60, placeholder: 'ex.: RQ-03 (opcional)' });
      const ot = h('select', { id: 'ctx-origem-tipo' }, opcoes({ documento: 'Documento', pessoa: 'Pessoa', ia_sugerido: 'Sugerido por IA', outro: 'Outro' }, v.origem.tipo));
      const orf = h('input', { id: 'ctx-origem-ref', value: v.origem.referencia, maxlength: 500, placeholder: 'ex.: requisitos/RQ-03.md ou nome do responsável' });
      const texto = h('textarea', { id: 'ctx-texto', rows: 7, maxlength: 20000 }); texto.value = v.texto;
      painel.replaceChildren(h('h2', {}, modo === 'substituir' ? 'Nova versão que substitui o contexto' : atual ? 'Editar contexto (nova versão em rascunho)' : 'Novo contexto'),
        h('p', { class: 'suave' }, 'Ideias sugeridas por IA são rascunho: só uma pessoa aprova. Não inclua senhas, tokens nem dados pessoais.'),
        h('div', { class: 'barra' }, campo('t', 'Tipo', tipo), campo('c', 'Chave', chave), campo('ot', 'Origem', ot)), campo('ti', 'Título', titulo), campo('or', 'Referência da origem', orf), campo('tx', 'Texto', texto),
        h('div', { class: 'barra' }, h('button', { class: 'acao primaria', id: 'ctx-salvar', onclick: async () => {
          const dados = { tipo: tipo.value, titulo: titulo.value, texto: texto.value, origem: { tipo: ot.value, referencia: orf.value } }; if (chave.value.trim()) dados.chave = chave.value.trim();
          const r = await chamar(() => api.contextosSalvar(estado.root, { id: atual && atual.id, substituir: modo === 'substituir', dados })); if (!r) return; avisar('Contexto salvo.'); await recarregar(); } }, 'Salvar'),
          h('button', { class: 'acao', onclick: () => painel.replaceChildren() }, 'Cancelar')));
      titulo.focus();
    }
    async function detalhe(id) {
      const c = await chamar(() => api.contextosObter(estado.root, id)); if (!c) return;
      const acao = (rot, fn, extra) => h('button', { class: 'acao ' + (extra || ''), onclick: fn }, rot);
      const outros = lista.contextos.filter((x) => x.id !== id && x.estado !== 'DESATUALIZADO');
      const sel = h('select', { id: 'ctx-outro' }, h('option', { value: '' }, 'Marcar conflito com…'), outros.map((x) => h('option', { value: x.id }, x.titulo + ' (v' + x.versao + ')')));
      painel.replaceChildren(h('h2', {}, c.titulo, ' ', selo(c.estado)), h('p', { class: 'suave' }, rotuloTipo[c.tipo] + (c.chave ? ' · chave ' + c.chave : '') + ' · versão ' + c.versao + ' · hash ' + c.hash.slice(0, 12) + ' · origem: ' + (c.origem.referencia || 'não informada') + ' (' + c.origem.tipo + ')'),
        c.estado === 'APROVADO' ? h('p', {}, 'Aprovado por ' + c.aprovadoPor + ' em ' + hora(c.aprovadoEm) + ' (vale só para este texto).') : null,
        c.estado === 'CONFLITANTE' ? h('div', { class: 'nota' }, 'Conflito com: ' + (c.conflitaCom.map((x) => (lista.contextos.find((y) => y.id === x) || { titulo: x }).titulo).join('; ') || 'outro contexto marcado') + '. Esclareça e marque o superado como desatualizado; o Prumo não escolhe um lado.') : null,
        c.integridade === 'ADULTERADO' ? h('div', { class: 'nota' }, 'O histórico deste contexto foi alterado fora do Prumo. Ele não é enviado ao agente nem pode ser aprovado.') : null,
        h('pre', {}, c.texto),
        h('div', { class: 'barra' }, c.estadoRegistrado !== 'DESATUALIZADO' ? [acao('Editar', () => formulario(c)), acao('Aprovar', async () => { const r = await chamar(() => api.contextosAprovar(estado.root, id)); if (r && !r.canceled) { avisar('Contexto aprovado.'); recarregar(); } }, 'primaria'),
          acao('Substituir por nova versão', () => formulario(c, 'substituir')), acao('Marcar desatualizado', async () => { const r = await chamar(() => api.contextosDesatualizar(estado.root, id)); if (r && !r.canceled) recarregar(); }),
          sel, acao('Registrar conflito', async () => { if (!sel.value) return avisar('Escolha o outro contexto.', true); const r = await chamar(() => api.contextosConflito(estado.root, id, sel.value)); if (r) recarregar(); }),
          c.estadoRegistrado === 'CONFLITANTE' ? acao('Resolver conflito marcado', async () => { const r = await chamar(() => api.contextosConflito(estado.root, id)); if (r) recarregar(); }) : null] : null,
          acao('Excluir', async () => { const r = await chamar(() => api.contextosExcluir(estado.root, id)); if (r && !r.canceled) recarregar(); }, 'perigo')),
        h('h2', {}, 'Histórico de alterações'), h('table', {}, h('thead', {}, h('tr', {}, ['Versão', 'Quando', 'Ação', 'Estado', 'Quem', 'Hash'].map((t) => h('th', {}, t)))),
          h('tbody', {}, c.historico.slice().reverse().map((e) => h('tr', {}, h('td', { class: 'num' }, 'v' + e.versao), h('td', {}, hora(e.em)), h('td', {}, e.acao), h('td', {}, selo(e.estado)), h('td', {}, e.por), h('td', {}, h('code', {}, e.conteudoHash.slice(0, 10))))))));
    }
  }

  let corpoCtx = null;
  async function abrirContextos() {
    const caixa = corpoCtx?.isConnected ? corpoCtx : null; const alvo = h('div', { class: 'ds-contextos' }, DS.carregando());
    if (caixa) caixa.replaceChildren(alvo); else { corpoCtx = DS.modal('Contextos do projeto', alvo, { tamanho: 'lg', subtitulo: [h('span', {}, tr('Requisitos, regras e decisões que os agentes podem ler quando aprovados e disponibilizados ao MCP.'))] }); }
    const el = h('div', {}); try { await montarContextos(el); } catch { el.replaceChildren(DS.estadoTela('erro', 'Não foi possível carregar esta seção.')); }
    el.querySelector('h1')?.remove(); alvo.replaceChildren(...el.childNodes);
  }
  const base = mostrar;
  mostrar = async function (aba) { if (aba === 'contextos') { if (estado.aba !== 'agentes') await base('agentes'); return abrirContextos(); } return base(aba); };
  const agentes = abas.agentes;
  abas.agentes = async (el) => {
    await agentes(el);
    const novo = el.querySelector('#v36-agent-new');
    const contagem = h('span', { class: 'ds-n' });
    const b = h('button', { type: 'button', class: 'acao', id: 'agentes-contextos', title: tr('Requisitos, regras e decisões do projeto que os agentes podem ler'), onclick: () => mostrar('contextos') }, DS.icone('livro'), tr('Contextos'), contagem);
    // Projeto Prumo: ao lado de "Nova prévia". Pasta vinculada (visão legada de clientes MCP): no topo da tela.
    if (novo) novo.before(b); else el.prepend(h('div', { class: 'ds-barra ds-barra-solta' }, b));
    // A contagem chega depois, sem atrasar a renderização da tela.
    if (estado.root) api.contextosListar(estado.root, {}).then((n) => { const l = n?.ok ? n.data.contextos : []; if (l.length) contagem.textContent = tr('{a} de {t} aprovados', { a: l.filter((c) => c.estado === 'APROVADO').length, t: l.length }); }).catch(() => {});
  };
})();
