'use strict';
/** Cria componentes simples e guarda seleção de projeto para as telas. */
// Apresentação apenas. Credenciais e chamadas HTTP ficam no processo principal.
const botao = (texto, fn, id) => h('button', {class:'acao', id, onclick:async e => { const b=e.currentTarget;b.disabled=true; try { await fn(); } catch { avisar('Falha ao concluir a ação.',true); } finally { b.disabled=false; } }}, texto);
const campoPlataforma = (texto, attrs={}) => { const input=h('input', attrs); return {input, no:h('label', {class:'campo'}, texto, input)}; };
const dadosVisiveis = v => h('pre', {}, JSON.stringify(v,null,2));
const faltaEspaco = () => h('div',{class:'vazio'},'Selecione um projeto Prumo em Projetos. Uma pasta local é opcional.');
function escolherEspaco(e){estado.espaco=e;estado.root=e.raizContextos;salvarRaiz();mostrar('projetos');}
