'use strict';
/** Administração › Chamados: todos os chamados de suporte numa tela só, com o texto, quem abriu, imagens e vídeo, resposta e estado. */
window.PrumoAdministracaoChamados = (() => {
  const rotulos = () => window.PrumoSuporte || { ESTADO: { NOVO: 'Novo', EM_ANALISE: 'Em análise', RESOLVIDO: 'Resolvido', FECHADO: 'Fechado' }, TOM: {}, CATEGORIA: { bug: 'Bug', melhoria: 'Melhoria', sugestao: 'Sugestão' }, tamanho: (b) => b + ' B' };
  const blocoDeTexto = (t) => h('pre', { class: 'ds-codigo chamado-texto', 'data-i18n-ignore': '' }, t);

  /** Chave de administração: a mesma de PRUMO_SUPORTE_CHAVE_ADMIN no serviço. Fica só no cofre do sistema e nunca volta para a tela. */
  function formularioDaChave(area, configurada) {
    const chave = h('input', { id: 'chamados-chave', type: 'password', maxlength: 200, autocomplete: 'off', spellcheck: 'false', placeholder: configurada ? tr('(já guardada; informe outra para trocar)') : '' });
    return DS.secao('Chave de administração do suporte', [DS.info('A mesma chave configurada no serviço do Prumo (PRUMO_SUPORTE_CHAVE_ADMIN, no Render), com 32 caracteres ou mais. Ela fica só no cofre do sistema deste computador.', { rotulo: 'Sobre a chave' }),
      h('div', { class: 'adm-form' }, DS.campo('Chave', chave)),
      podeAlterarAdministracao() ? h('div', { class: 'ds-cab-acoes ds-mt' }, DS.acao('Salvar chave', async () => { const r = await chamar(() => api.chamadosChave(chave.value)); chave.value = ''; if (r) { avisar(r.configurada ? tr('Chave guardada.') : tr('Chave apagada.')); void mostrar(area); } }, { id: 'chamados-salvar-chave', primaria: !configurada, compacto: true })) : null], { id: 'chamados-config' });
  }

  async function verAnexo(numero, a, lugar) {
    lugar.replaceChildren(DS.carregando());
    const r = await chamar(() => api.chamadosAnexo(numero, a.indice)); if (!r) { lugar.replaceChildren(); return; }
    const bytes = Uint8Array.from(atob(r.base64), (c) => c.charCodeAt(0)); const url = URL.createObjectURL(new Blob([bytes], { type: r.tipo }));
    const midia = r.tipo.startsWith('video/') ? h('video', { src: url, controls: true, class: 'chamado-midia', 'aria-label': a.nome }) : h('img', { src: url, alt: a.nome, class: 'chamado-midia' });
    lugar.replaceChildren(midia);
  }

  /** Um chamado por inteiro, com resposta e mudança de estado para quem pode alterar. */
  async function abrirChamado(numero, area) {
    const c = await chamar(() => api.chamadosDetalhe(numero)); if (!c) return;
    const { ESTADO, TOM, CATEGORIA, tamanho } = rotulos(); const d = c.dados;
    const anexos = c.anexos.map((a) => { const lugar = h('div', { class: 'chamado-anexo-ver' });
      return h('div', { class: 'chamado-anexo', 'data-anexo': a.indice }, h('p', {}, DS.icone(a.tipo.startsWith('video') ? 'video' : 'imagem'), ' ', semTraducao(a.nome), h('span', { class: 'suave' }, ' · ' + tamanho(a.tamanho))),
        a.recebido ? DS.acao(a.tipo.startsWith('video') ? 'Ver vídeo' : 'Ver imagem', () => verAnexo(numero, a, lugar), { id: 'chamado-ver-' + a.indice, compacto: true }) : h('p', { class: 'suave' }, tr('Ainda não recebido.')), lugar); });
    const resposta = h('textarea', { id: 'chamado-resposta', rows: 4, maxlength: 4000, placeholder: tr('Escreva a resposta que a pessoa vai ver em Meus chamados') });
    const estado = DS.selecao({ id: 'chamado-estado', rotulo: 'Estado', opcoes: Object.entries(ESTADO), valor: c.estado });
    DS.modal(tr('Chamado #{n}', { n: c.numero }), [
      h('p', { class: 'chamado-titulo' }, semTraducao(d.titulo)),
      DS.meta([['Tipo', tr(CATEGORIA[d.categoria] || d.categoria)], ['Estado', DS.chip(ESTADO[c.estado] || c.estado, TOM[c.estado])], ['Quem abriu', d.contato ? h('span', {}, semTraducao(d.contato.nome + (d.contato.email ? ' · ' + d.contato.email : '')), ' ', DS.info('Nome e e-mail informados no chamado pelo aplicativo de quem abriu; o serviço não os confirma. A resposta chega só a quem tem a chave do chamado.')) : tr('não informado')], ['Versão', d.versao ? semTraducao(d.versao) : null], ['Sistema', d.sistema ? semTraducao(d.sistema) : null], ['Aberto em', hora(c.criadoEm)], ['Atualizado em', hora(c.atualizadoEm)]]),
      DS.secao('Descrição', [blocoDeTexto(d.descricao)]), d.passos ? DS.secao('Passos para reproduzir', [blocoDeTexto(d.passos)]) : null, d.esperado ? DS.secao('Resultado ou benefício esperado', [blocoDeTexto(d.esperado)]) : null,
      d.diagnostico ? DS.secao('Diagnóstico da interface', [blocoDeTexto(d.diagnostico)]) : null,
      anexos.length ? DS.secao('Imagens e vídeo', anexos, { id: 'chamado-anexos' }) : null,
      DS.secao('Respostas', c.respostas.length ? c.respostas.map((x) => h('div', { class: 'ds-bloco' }, h('p', { class: 'suave' }, hora(x.em)), h('p', { 'data-i18n-ignore': '' }, x.texto))) : [h('p', { class: 'suave' }, tr('Nenhuma resposta ainda.'))], { id: 'chamado-respostas' }),
      podeAlterarAdministracao() ? DS.secao('Responder e mudar o estado', [DS.campo('Resposta', resposta, { inteiro: true }), h('div', { class: 'ds-cab-acoes ds-mt' },
        DS.acao('Responder', async () => { const r = await chamar(() => api.chamadosResponder(c.numero, resposta.value)); if (r) { avisar(tr('Resposta enviada.')); DS.fecharModal(); void abrirChamado(numero, area); } }, { id: 'chamado-responder', primaria: true }),
        DS.campo('Estado', estado), DS.acao('Mudar estado', async () => { const r = await chamar(() => api.chamadosEstado(c.numero, estado.value)); if (r) { avisar(tr('Estado atualizado.')); DS.fecharModal(); void mostrar(area); } }, { id: 'chamado-estado-salvar' }))]) : DS.notaPermissao('Seu papel só permite consultar os chamados.')
    ], { tamanho: 'lg', subtitulo: d.contato?.nome });
  }

  async function mostrar(area) {
    area.replaceChildren(DS.carregando());
    const cfg = await chamar(() => api.chamadosConfiguracao()); if (!cfg) return;
    if (!cfg.configurada) { area.replaceChildren(DS.alerta('Para ver os chamados, informe a chave de administração do suporte.', 'info'), formularioDaChave(area, false)); return; }
    const { ESTADO, TOM, CATEGORIA } = rotulos();
    let filtro = (estado.sub?.chamadosFiltro) || '';
    const lista = h('div', { id: 'chamados-lista' }, DS.carregando());
    const carregar = async () => {
      lista.replaceChildren(DS.carregando());
      const r = await chamar(() => api.chamadosListar(filtro || undefined)); if (!r) { lista.replaceChildren(DS.estadoTela('erro', 'Não foi possível ler os chamados', 'Confira a chave de administração e se o serviço do Prumo está no ar.', [], { id: 'chamados-erro' })); return; }
      if (!r.chamados.length) { lista.replaceChildren(DS.estadoTela('vazio', filtro ? 'Nenhum chamado neste estado' : 'Nenhum chamado recebido', 'Os chamados abertos pela tela de Suporte aparecem aqui.', [], { id: 'chamados-vazio' })); return; }
      lista.replaceChildren(DS.tabela({ id: 'chamados-tabela', colunas: ['Nº', 'Título', 'Tipo', 'Quem abriu', 'Estado', 'Atualizado', 'Anexos'], linhas: r.chamados.map((c) => ({
        attrs: { 'data-chamado': c.numero }, abrir: () => abrirChamado(c.numero, area), rotuloAcessivel: tr('Abrir chamado {n}', { n: c.numero }),
        celulas: ['#' + c.numero, semTraducao(c.titulo), tr(CATEGORIA[c.categoria] || c.categoria), c.contato ? semTraducao(c.contato) : '—', DS.chip(ESTADO[c.estado] || c.estado, TOM[c.estado]), hora(c.atualizadoEm), String(c.anexos)] })) }));
    };
    const seletor = DS.selecao({ id: 'chamados-filtro', rotulo: 'Estado', opcoes: [['', 'Todos'], ...Object.entries(ESTADO)], valor: filtro, aoMudar: (v) => { filtro = v; (estado.sub ||= {}).chamadosFiltro = v; void carregar(); } });
    area.replaceChildren(DS.secao('Chamados de suporte', [h('p', { class: 'suave' }, tr('Os chamados que as pessoas abrem pela tela de Suporte, sem precisar de conta no GitHub. Ficam guardados no repositório privado da equipe.')), lista],
      { acoes: [seletor, DS.acao('Atualizar', () => carregar(), { id: 'chamados-atualizar', icone: 'atualizar', compacto: true })], id: 'chamados' }), formularioDaChave(area, true));
    await carregar();
  }

  return { mostrar };
})();
