'use strict';
/** Componentes reutilizáveis: botão de ação e campo de formulário. */
const botao = (texto, fn, id) => h('button', {class:'acao', id, onclick:async e => { const b=e.currentTarget;b.disabled=true; try { await fn(); } catch { avisar('Falha ao concluir a ação.',true); } finally { b.disabled=false; } }}, texto);

const campoPlataforma = (texto, attrs={}) => { const input=h('input', attrs); return {input, no:h('label', {class:'campo'}, texto, input)}; };
