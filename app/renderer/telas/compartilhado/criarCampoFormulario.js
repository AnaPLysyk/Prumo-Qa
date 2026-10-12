'use strict';
/** Cria rótulo e campo de entrada para os formulários. */
const campoPlataforma = (texto, attrs={}) => { const input=h('input', attrs); return {input, no:h('label', {class:'campo'}, texto, input)}; };
