'use strict';
/** Cria botão que executa ação assíncrona com bloqueio temporário. */
const botao = (texto, fn, id) => h('button', {class:'acao', id, onclick:async e => { const b=e.currentTarget;b.disabled=true; try { await fn(); } catch { avisar('Falha ao concluir a ação.',true); } finally { b.disabled=false; } }}, texto);
