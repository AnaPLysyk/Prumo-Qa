/** Mostra os chamados da pessoa e as respostas da equipe. */
'use strict';
/** Mostra a tela de Suporte: descrever, revisar e enviar o chamado direto para a equipe (sem GitHub), com imagens e vídeo, e acompanhar os próprios chamados. */
(() => {
  const ESTADO = { NOVO: 'Novo', EM_ANALISE: 'Em análise', RESOLVIDO: 'Resolvido', FECHADO: 'Fechado' };
  const TOM = { NOVO: 'info', EM_ANALISE: 'aviso', RESOLVIDO: 'ok', FECHADO: 'neutro' };
  const CATEGORIA = { bug: 'Bug', melhoria: 'Melhoria', sugestao: 'Sugestão' };
  const tamanho = (b) => (b >= 1024 * 1024 ? (b / (1024 * 1024)).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

  /** Um chamado da pessoa com as respostas da equipe, num modal. */
  async function abrirMeuChamado(numero) {
    const r = await chamar(() => api.suporteMeu(numero)); if (!r) return;
    DS.modal(tr('Chamado #{n}', { n: numero }), [
      DS.meta([['Título', semTraducao(r.titulo)], ['Estado', DS.chip(ESTADO[r.estado] || r.estado, TOM[r.estado])], ['Aberto em', hora(r.criadoEm)], ['Atualizado em', hora(r.atualizadoEm)]]),
      DS.secao('Respostas da equipe', r.respostas.length ? r.respostas.map((x) => h('div', { class: 'ds-bloco sup-resposta' }, h('p', { class: 'suave' }, hora(x.em)), h('p', { class: 'sup-texto', 'data-i18n-ignore': '' }, x.texto)))
        : [h('p', { class: 'suave', id: 'sup-sem-resposta' }, tr('Ainda sem resposta. Você vê aqui quando a equipe responder.'))])
    ], { tamanho: 'md' });
  }

  /** Meus chamados: os chamados abertos por esta conta, com o estado atual. */
  async function desenharMeus(caixa) {
    caixa.replaceChildren(h('p', { class: 'suave' }, tr('Consultando…')));
    const r = await api.suporteMeus();
    if (!r.ok) { caixa.replaceChildren(h('p', { class: 'suave' }, tr('Não foi possível consultar agora.'))); return; }
    if (!r.data.length) { caixa.replaceChildren(h('p', { class: 'suave', id: 'sup-meus-vazio' }, tr('Você ainda não abriu chamados.'))); return; }
    caixa.replaceChildren(h('ul', { class: 'ds-links', id: 'sup-meus-lista' }, r.data.map((c) => h('li', {}, h('button', { type: 'button', 'data-chamado': c.numero, onclick: () => abrirMeuChamado(c.numero) },
      h('strong', {}, '#' + c.numero), ' ', semTraducao(c.titulo), ' · ', c.estado ? tr(ESTADO[c.estado] || c.estado) : tr('estado indisponível'), c.respostas ? ' · ' + tr('{n} resposta(s)', { n: c.respostas }) : '')))));
  }

