'use strict';
/** Botões de login social local: só autoriza pelo navegador, sem pedir chaves à pessoa. */
window.PrumoEntradaProvedores = ({ api, h, tr, cartao, trocarVista, link, mensagemDaEntrada, voltarEntrar, voltarCadastro }) => {
  const providers = [
    { id: 'github', nome: 'GitHub', iniciar: 'contaGithubIniciar', estado: 'contaGithubEstado' },
    { id: 'google', nome: 'Google', iniciar: 'contaGoogleIniciar', estado: 'contaGoogleEstado' }
  ];

  /** Só exibe provedores configurados pela Administração ou pelo ambiente da instalação. */
  function botoes(sessao, modo = 'entrar') {
    const configurados = providers.filter(p => sessao?.[p.id === 'github' ? 'entradaGithub' : 'entradaGoogle']);
    return configurados.map(p => h('button', {
      type: 'button', class: 'acao entrada-provedor', id: 'entrada-' + p.id,
      onclick: () => iniciar(p, modo)
    }, tr(modo === 'entrar' ? 'Entrar com o {nome}' : modo === 'primeira' ? 'Criar conta com o {nome}' : 'Cadastrar com o {nome}', { nome: p.nome })));
  }

  /** A pessoa conclui a autorização no provedor; a janela apenas acompanha ou cancela. */
  async function iniciar(provedor, modo) {
    const primeira = modo === 'primeira';
    const voltar = () => primeira ? voltarCadastro(true) : modo === 'cadastro' ? voltarCadastro(false) : voltarEntrar();
    const iniciado = await api[provedor.iniciar](primeira);
    if (!iniciado.ok) { voltarEntrar(mensagemDaEntrada(iniciado.error)); return; }

    let ativo = true;
    let relogio = null;
    const estado = (cancelar = false) => api[provedor.estado](cancelar);
    const cancelar = async () => {
      if (!ativo) return;
      ativo = false; clearTimeout(relogio);
      try { await estado(true); } finally { voltar(); }
    };
    trocarVista(
      ...cartao('Autorize no ' + provedor.nome, 'Conclua a autorização no navegador. Nenhuma senha ou chave é pedida pelo Prumo.'),
      h('p', { id: 'entrada-' + provedor.id + '-espera', role: 'status' }, tr('Aguardando autorização…')),
      link('Cancelar', () => { void cancelar(); }, 'entrada-' + provedor.id + '-cancelar')
    );

    const acompanhar = async () => {
      if (!ativo) return;
      try {
        const r = await estado();
        if (!ativo) return;
        if (!r.ok) { ativo = false; voltarEntrar(mensagemDaEntrada(r.error)); return; }
        if (r.data?.estado === 'CONCLUIDO') { ativo = false; location.reload(); return; }
        if (r.data?.estado === 'PENDENTE') { ativo = false; voltarEntrar(r.data.mensagem); return; }
        if (r.data?.estado === 'ERRO') { ativo = false; voltarEntrar(mensagemDaEntrada(r.data.mensagem)); return; }
        if (r.data?.estado === 'NENHUMA') { ativo = false; voltar(); return; }
      } catch { if (ativo) { ativo = false; voltarEntrar('Não foi possível concluir a autorização.'); } return; }
      relogio = setTimeout(acompanhar, 1000);
    };
    relogio = setTimeout(acompanhar, 1000);
  }
  return { botoes };
};
