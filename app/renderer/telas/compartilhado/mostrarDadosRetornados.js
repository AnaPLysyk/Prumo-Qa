'use strict';
/** Apresenta dados estruturados sem alterar a resposta recebida. */
const dadosVisiveis = v => h('pre', {}, JSON.stringify(v,null,2));
