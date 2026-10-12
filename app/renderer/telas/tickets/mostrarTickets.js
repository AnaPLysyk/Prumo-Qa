'use strict';
/** Monta a consulta de tickets Jira na tela Tickets. */
abas.tickets=async el=>{el.append(h('h1',{},'Tickets'));await consultaManual(el,'jira',{tickets:'Tickets do projeto',ticket:'Detalhe de ticket',campos:'Descobrir campos de critérios de aceite',comentarios:'Comentários de ticket'});};
