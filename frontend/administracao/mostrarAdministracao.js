'use strict';
/** Mostra a tela Administração: a documentação viva desta versão (tela → interface → canais → backend → testes) e o estado do sistema. */
(() => {
  const PAPEIS = [['api', 'Canais (api)'], ['regras', 'Regras'], ['banco', 'Dados deste computador (banco)'], ['integracoes', 'Integrações'], ['tipos', 'Tipos'], ['outros', 'Outros arquivos']];
  const normal = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /** Um arquivo: caminho, o que faz (primeira linha do arquivo) e as funções declaradas. */
  function arquivo(a) {
    const funcoes = a.funcoes.slice(0, 10);
    return h('li', { class: 'adm-arquivo' }, h('code', { 'data-i18n-ignore': '' }, a.caminho),
      a.descricao ? h('span', { class: 'adm-desc', 'data-i18n-ignore': '' }, a.descricao) : h('span', { class: 'adm-desc vazio-txt' }, tr('Sem descrição na primeira linha.')),
      funcoes.length ? h('span', { class: 'adm-funcoes', 'data-i18n-ignore': '' }, funcoes.join(' · ') + (a.funcoes.length > funcoes.length ? ' …' : '')) : null);
  }
  const lista = (itens) => h('ul', { class: 'adm-lista' }, itens.map(arquivo));

  /** Uma tela inteira, na ordem em que um pedido percorre o sistema. */
  function tela(t, papeis, aberta) {
    const backend = PAPEIS.filter(([p]) => t.backend[p]?.length).map(([p, rotulo]) => DS.bloco(rotulo, papeis[p] ? h('p', { class: 'adm-papel', 'data-i18n-ignore': '' }, papeis[p]) : null, lista(t.backend[p])));
    const canais = t.canais.length ? DS.tabela({ colunas: ['Canal', 'Ponte (window.prumo)', 'Arquivo do backend'], linhas: t.canais.map((c) => ({ celulas: [h('code', { 'data-i18n-ignore': '' }, c.canal), c.ponte ? h('code', { 'data-i18n-ignore': '' }, c.ponte) : '—', h('code', { 'data-i18n-ignore': '' }, c.api)] })) }) : null;
    const total = t.frontend.length + Object.values(t.backend).flat().length;
    return h('details', { class: 'ds-recolher adm-tela', open: aberta, id: 'adm-tela-' + t.id }, h('summary', {}, h('code', { 'data-i18n-ignore': '' }, t.id), ' · ', tr('{n} arquivos', { n: total })),
      t.descricao ? h('p', { class: 'adm-tela-desc', 'data-i18n-ignore': '' }, t.descricao) : null,
      t.frontend.length ? DS.bloco('1. Interface', h('code', { class: 'adm-pasta', 'data-i18n-ignore': '' }, 'frontend/' + t.id + '/'), lista(t.frontend)) : null,
      canais ? DS.bloco('2. Canais da janela (IPC)', canais) : null,
      backend.length ? DS.bloco('3. Backend', h('code', { class: 'adm-pasta', 'data-i18n-ignore': '' }, 'backend/' + t.id + '/'), ...backend) : null,
      DS.bloco('4. Testes', t.testes.length ? h('ul', { class: 'adm-lista' }, t.testes.map((x) => h('li', { class: 'adm-arquivo' }, h('code', { 'data-i18n-ignore': '' }, x.caminho), x.descricao ? h('span', { class: 'adm-desc', 'data-i18n-ignore': '' }, x.descricao) : null))) : DS.texto(null, 'Nenhum teste importa arquivos desta tela diretamente.'))
    );
  }

  function documentacao(area, mapa) {
    const filtro = DS.busca({ id: 'adm-busca', placeholder: 'Procurar tela, arquivo, função ou canal', rotulo: 'Procurar na documentação' });
    const telas = h('div', { id: 'adm-telas', class: 'adm-telas' });
    const casa = (t, q) => !q || normal(JSON.stringify([t.id, t.descricao, t.canais.map((c) => c.canal + ' ' + c.ponte), [...t.frontend, ...Object.values(t.backend).flat()].map((a) => a.caminho + ' ' + (a.descricao || '') + ' ' + a.funcoes.join(' '))])).includes(q);
    const desenhar = () => {
      const q = normal(filtro.input.value.trim()); const achadas = mapa.telas.filter((t) => casa(t, q));
      telas.replaceChildren(...(achadas.length ? achadas.map((t) => tela(t, mapa.papeis, !!q)) : [DS.estadoTela('vazio', 'Nada encontrado', 'Tente o nome de uma tela, de um arquivo ou de um canal (por exemplo skills:criar).', [], { compacto: true })]));
    };
    filtro.input.addEventListener('input', desenhar);
    const tot = mapa.totais;
    area.replaceChildren(
      DS.resumo([[tot.telas, 'telas'], [tot.arquivosFrontend, 'arquivos de interface'], [tot.canais, 'canais da janela'], [tot.arquivosBackend, 'arquivos do backend'], [tot.testes, 'testes']], { id: 'adm-resumo' }),
      h('p', { class: 'adm-origem' }, tr('Gerado do código da versão {v} no build ({quando}). Procure pelo nome da tela do menu: a mesma pasta existe em frontend/ e backend/.', { v: mapa.versao + (mapa.commit ? ' · ' + mapa.commit : ''), quando: new Date(mapa.geradoEm).toLocaleString() })),
      DS.barra(filtro.no), telas);
    desenhar();
  }

  function sistema(area, mapa) {
    area.replaceChildren(
      DS.secao('Versão', DS.meta([['Versão', mapa.versao], ['Commit do build', mapa.commit || tr('não registrado')], ['Mapa gerado em', new Date(mapa.geradoEm).toLocaleString()]])),
      DS.secao('Usuários e permissões', DS.alerta(window.PrumoConta?.sessao()?.loginAtivo
        ? 'Login ligado: cada pessoa entra com a própria conta e cada tela respeita o papel dela (abas Usuários e Permissões). O worker de agendamentos, a bandeja e o servidor MCP continuam rodando com a conta do Windows deste computador.'
        : 'Login desligado: o Prumo usa a conta do Windows deste computador e todas as telas ficam liberadas. Ative o login na aba Usuários. As políticas de cada projeto (Agentes) e a confirmação nativa do Windows para executar e publicar continuam valendo.', 'info')));
  }

  // 2.11: Usuários, Permissões, Agentes e Configurações gerais ficam em gerenciarAcessos.js.
  const ACESSOS = ['usuarios', 'permissoes', 'agentes', 'geral'];
  abas.administracao = async (el) => {
    el.append(DS.cabecalho({ titulo: 'Administração', descricao: 'Usuários, permissões por tela, agentes da plataforma, configurações gerais e documentação viva desta versão.' }));
    const area = h('div', { id: 'adm-area' }, DS.carregando());
    const sub = estado.sub?.administracao || 'usuarios'; let mapa = null;
    const trocar = async (k) => {
      (estado.sub ||= {}).administracao = k;
      if (ACESSOS.includes(k)) return window.PrumoAdministracaoAcessos[k](area);
      mapa ||= await chamar(() => api.administracaoMapa());
      if (!mapa) { area.replaceChildren(DS.estadoTela('erro', 'Documentação indisponível', 'O mapa é gerado no build do aplicativo. Gere de novo com npm run build.', [], { id: 'adm-erro' })); return; }
      if (k === 'sistema') sistema(area, mapa); else documentacao(area, mapa);
    };
    el.append(DS.abas([['usuarios', 'Usuários'], ['permissoes', 'Permissões'], ['agentes', 'Agentes'], ['geral', 'Configurações gerais'], ['documentacao', 'Documentação viva'], ['sistema', 'Sistema']], sub, trocar, { id: 'adm-abas', rotulo: 'Seções da administração' }), area);
    await trocar(sub);
  };
})();
