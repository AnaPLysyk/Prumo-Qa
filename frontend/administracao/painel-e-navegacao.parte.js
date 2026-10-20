/** Administracao: mostra o resumo do sistema e monta a navegacao. */
  function sistema(area, mapa) {
    const tot = mapa.totais;
    area.replaceChildren(
      DS.resumo([[tot.telas, 'telas'], [tot.arquivosFrontend, 'arquivos de interface'], [tot.canais, 'canais da janela'], [tot.arquivosBackend, 'arquivos do backend'], [tot.testes, 'testes']], { id: 'adm-resumo' }),
      DS.secao('Versão', DS.meta([['Versão', mapa.versao], ['Commit do build', mapa.commit || tr('não registrado')], ['Mapa gerado em', new Date(mapa.geradoEm).toLocaleString()]])),
      DS.secao('Usuários e permissões', DS.alerta('Cada pessoa entra com a própria conta e cada tela respeita o papel dela (abas Usuários e Permissões). O worker de agendamentos, a bandeja e o servidor MCP continuam rodando com a conta deste computador.', 'info')));
  }

  // 2.11: Usuários, Permissões, Agentes e Configurações gerais ficam em gerenciarAcessos.js.
  const ACESSOS = ['usuarios', 'permissoes', 'agentes', 'geral'];
  abas.administracao = async (el) => {
    el.append(DS.cabecalho({ titulo: 'Administração', info: 'Usuários, permissões por tela, agentes da plataforma, chamados de suporte, configurações gerais e documentação viva desta versão.' }));
    const area = h('div', { id: 'adm-area' }, DS.carregando());
    const sub = estado.sub?.administracao || 'usuarios'; let mapa = null;
    const trocar = async (k) => {
      (estado.sub ||= {}).administracao = k;
      if (ACESSOS.includes(k)) return window.PrumoAdministracaoAcessos[k](area);
      if (k === 'chamados') return window.PrumoAdministracaoChamados.mostrar(area);
      mapa ||= await chamar(() => api.administracaoMapa());
      if (!mapa) { area.replaceChildren(DS.estadoTela('erro', 'Documentação indisponível', 'O mapa é gerado no build do aplicativo. Gere de novo com npm run build.', [], { id: 'adm-erro' })); return; }
      if (k === 'sistema') sistema(area, mapa); else documentacao(area, mapa);
    };
    el.append(DS.abas([['usuarios', 'Usuários'], ['permissoes', 'Permissões'], ['agentes', 'Agentes'], ['chamados', 'Chamados'], ['geral', 'Configurações gerais'], ['documentacao', 'Documentação viva'], ['sistema', 'Sistema']], sub, trocar, { id: 'adm-abas', rotulo: 'Seções da administração' }), area);
    await trocar(sub);
  };
})();
