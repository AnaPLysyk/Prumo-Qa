'use strict';
/** Exibe e registra vínculos explícitos entre ticket Jira e caso Qase. */
abas.rastreabilidade=async el=>{
  el.append(h('h1',{},'Rastreabilidade'));const e=estado.espaco;if(!e)return el.append(faltaEspaco());
  el.append(h('p',{},'Uma associação declarada registra sua decisão. Não comprova cobertura, requisito aprovado ou execução. Nenhuma relação entre serviços é deduzida por nome.'),
    e.relacoes.length?h('div',{},e.relacoes.map(r=>h('div',{class:'nota'},h('strong',{},r.de.tipo+' '+r.de.id+' → '+r.para.tipo+' '+r.para.id),h('p',{},r.justificativa+' · DECLARADO PELO USUÁRIO · '+hora(r.at)),h('p',{},'Origem: '+r.de.origem+' → '+r.para.origem),e.vinculos.some(v=>v.id===r.de.vinculoId)&&e.vinculos.some(v=>v.id===r.para.vinculoId)?selo('VINCULADO'):selo('DESATUALIZADO')))):h('p',{},'Vínculo ainda não definido.'));
  const jira=e.vinculos.find(v=>v.servico==='jira'),qase=e.vinculos.find(v=>v.servico==='qase');if(!jira||!qase)return el.append(h('p',{},'Vincule Jira e Qase deste projeto para declarar uma associação ticket–caso.'));
  const ticket=campoPlataforma('Chave do ticket consultado',{id:'rastro-ticket'}),caso=campoPlataforma('ID do caso consultado',{id:'rastro-caso'}),porque=campoPlataforma('Justificativa da associação',{id:'rastro-justificativa',maxlength:1000});
  el.append(ticket.no,caso.no,porque.no,botao('Conferir origens e declarar vínculo',async()=>{
    const t=await chamar(()=>api.servicoConsultar(e.id,'jira','ticket',{},ticket.input.value));if(!t)return;const c=await chamar(()=>api.servicoConsultar(e.id,'qase','caso',{},caso.input.value));if(!c)return;
    const r=await chamar(()=>api.espacoAssociar(e.id,{de:{tipo:'jira',id:ticket.input.value,vinculoId:jira.id,origem:t.origem},para:{tipo:'qase',id:String(c.dados.id),vinculoId:qase.id,origem:c.origem},justificativa:porque.input.value}));if(r)mostrar('rastreabilidade');
  },'rastro-salvar'));
};
