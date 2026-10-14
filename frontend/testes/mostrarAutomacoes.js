'use strict';
/** Exibe automações locais e consultas de repositório GitHub. */
abas.automacoes=async el=>{
  el.append(h('h1',{},'Automações'));const e=estado.espaco;if(!e)return el.append(faltaEspaco());
  const a=await chamar(()=>api.espacoAutomacoes(e.id));if(a)el.append(h('h2',{},'Contrato local'),h('div',{class:'proj-chips'},h('span',{class:'chip-servico'},a.pastaLocal?'Pasta vinculada':'Sem pasta local'),h('span',{class:'chip-servico'},'k6 '+(a.k6Disponivel?'disponível':'não encontrado')),(a.frameworks||[]).map(f=>h('span',{class:'chip-servico'},f))),a.pastaLocal?h('p',{class:'suave'},a.pastaLocal):null,(a.capacidades||[]).length?h('ul',{},a.capacidades.map(c=>h('li',{},h('code',{},c)))):h('p',{class:'suave'},'Nenhuma automação declarada.'));
  await consultaManual(el,'github',{repositorio:'Repositório',branches:'Branches',commits:'Commits',prs:'Pull requests',pr:'Detalhe do PR',verificacoes:'Check runs de um commit (SHA completo)'});
};
