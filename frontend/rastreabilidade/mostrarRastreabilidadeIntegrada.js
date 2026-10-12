'use strict';
/** Reúne os vínculos e a rastreabilidade do projeto em uma tela. */
abas.rastreabilidade = async (el) => {
  el.append(h('h1', {}, 'Rastreabilidade')); const sub = estado.sub?.rastreabilidade || 'mapa';
  const corpo = h('div', { id: 'sub-conteudo' }); el.append(barraSub('rastreabilidade', [['mapa', 'Mapa'], ['vinculos', 'Vínculos']], sub), corpo);
  if (sub === 'vinculos') await abaVinculos(corpo); else await abaRastreio(corpo);
  semTitulo(corpo);
};
