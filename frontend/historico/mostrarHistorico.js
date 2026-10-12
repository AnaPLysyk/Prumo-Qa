'use strict';
/** Exibe histórico de vínculos e consultas antes do histórico principal. */
const historicoNucleo=abas.historico;
abas.historico=async el=>{const e=estado.espaco;if(e)el.append(h('details',{},h('summary',{},'Histórico dos vínculos e consultas deste projeto'),dadosVisiveis(e.historico)));await historicoNucleo(el);};
