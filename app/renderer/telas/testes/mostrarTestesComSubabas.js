'use strict';
/** Reúne catálogo, propostas e runs nas subabas da tela Testes. */
abas.testes = async (el) => {
  el.append(h('h1', {}, 'Testes'));
  const e = estado.espaco; const temQase = !!e?.vinculos.some(v => v.servico === 'qase');
  const itens = [['catalogo', 'Catálogo'], ...(temQase ? [['casos', 'Casos e propostas']] : []), ['runs', 'Planos e execuções'], ['automacao', 'Automação']];
  let sub = estado.sub?.testes || 'catalogo'; if (!itens.some(([k]) => k === sub)) sub = 'catalogo';
  const corpo = h('div', { id: 'sub-conteudo' }); el.append(barraSub('testes', itens, sub), corpo);
  if (sub === 'catalogo') await catalogoRepo(corpo); else if (sub === 'casos') semTitulo(await (async () => { await abaCasosQase(corpo); return corpo; })()); else if (sub === 'runs') await abaRuns(corpo); else await abaAutomacao(corpo);
  semTitulo(corpo);
};
