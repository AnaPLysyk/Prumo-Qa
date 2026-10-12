/** Lista as relacoes declaradas. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  function relacoes(e, m, corpo, projSel) {
    const origemTxt = { DECLARADO_PELO_USUARIO: 'Declarado por você', REGISTRADO_PELO_PRUMO: 'Registrado pelo Prumo', OBSERVADO: 'Observado em execução', OBSERVADO_NO_CODIGO: 'Lido no código · sem execução' };
    const { nos } = grafo(m); const nome = (id) => nos.get(id);
    corpo.append(projSel ? DS.barra(projSel) : null, h('div', { id: 'vinc-aviso', class: 'ds-alerta' }, DS.icone('escudo'), h('div', {}, m.aviso)));
    corpo.append(DS.secao(tr('Relações ({n})', { n: m.arestas.length }), m.arestas.length ? DS.tabela({ id: 'vinc-tabela', colunas: ['De', 'Relação', 'Para', 'Origem'], linhas: m.arestas.map((a) => ({ celulas: [botaoNo(e, nome(a.de) || { id: a.de, tipo: 'prumo', rotulo: a.de }), a.tipo + (a.nota ? ' · ' + a.nota : ''), botaoNo(e, nome(a.para) || { id: a.para, tipo: 'prumo', rotulo: a.para }), DS.chip(origemTxt[a.origem], a.origem === 'OBSERVADO' ? 'ok' : null)] })) }) : DS.estadoTela('vazio', 'Nenhuma relação ainda.', null, [], { compacto: true })));
    corpo.append(DS.secao('Lacunas de cadastro', m.lacunas.length ? h('ul', { id: 'vinc-lacunas', class: 'ds-lista' }, m.lacunas.map((l) => h('li', {}, l.mensagem))) : h('p', { class: 'suave' }, tr('Nenhuma lacuna de cadastro encontrada.'))));
    corpo.append(DS.secao('Operações externas recentes', m.operacoesRecentes.length ? h('ul', { id: 'vinc-operacoes', class: 'ds-lista' }, m.operacoesRecentes.map((o) => h('li', {}, seloOp(o.estado), ' ', o.resumo, h('span', { class: 'ds-sub' }, hora(o.em) + (o.remoto?.chave ? ' · ' + o.remoto.chave : ''))))) : h('p', { class: 'suave' }, tr('Nenhuma operação externa registrada.'))));
  }
