'use strict';
/** Monta a tela Projetos com cadastro, seleção, edição e vínculos. */
const projetosLocais=abas.projetos;
abas.projetos=async el=>{
  el.append(h('h1',{},'Projetos'));
  // 2.10.2: projeto selecionado que é pasta com contrato local (ex.: demonstração) fica no fim da página; o topo aponta para ela.
  if(estado.projetoLegado&&estado.projetoNome)el.append(h('p',{class:'nota',id:'projeto-legado'},tr('Projeto selecionado: {n}. É uma pasta com contrato local, listada no fim desta página.',{n:estado.projetoNome}),' ',DS.link('Ver pasta',()=>document.getElementById('pastas-contrato-local')?.scrollIntoView({behavior:'smooth',block:'start'}),{seta:false})));
  const formulario=h('div',{id:'espaco-form'});
  const editar=e=>{
    const nome=campoPlataforma('Nome',{id:'espaco-nome',maxlength:200,value:e?.nome||''});
    const descricao=campoPlataforma('Descrição',{id:'espaco-descricao',maxlength:1000,value:e?.descricao||''});
    formulario.replaceChildren(h('h2',{},e?'Editar projeto':'Novo projeto Prumo'),nome.no,descricao.no,
      botao('Salvar projeto',async()=>{const dados={nome:nome.input.value,descricao:descricao.input.value};const r=await chamar(()=>e?api.espacoEditar(e.id,dados):api.espacoCriar(dados));if(r)escolherEspaco(r);},'espaco-salvar'),botao('Cancelar',()=>formulario.replaceChildren()));nome.input.focus();
  };
  el.append(botao('Novo projeto Prumo',()=>editar(), 'espaco-novo'),formulario);
  const lista=await chamar(api.espacos);if(!lista)return;
  for(const e of lista){
    const acoes=h('div',{class:'barra-acoes'},botao(estado.espaco?.id===e.id?'Projeto selecionado':'Selecionar projeto',()=>escolherEspaco(e)),botao('Editar projeto',()=>editar(e)),botao('Vincular pasta de automação…',async()=>{const r=await chamar(()=>api.espacoPasta(e.id));if(r&&!r.canceled)mostrar('projetos');}));
    // v40: cada vínculo mantém a identidade própria (serviço, chave, ID e instância) e as ações dele na mesma linha.
    const chips=h('ul',{class:'ds-lista proj-vinculos'},e.vinculos.map(v=>h('li',{class:'proj-vinculo','data-servico':v.servico},DS.origem(v.servico,DS.nomesServico[v.servico]+' · '+v.recurso.chave),h('span',{class:'ds-sub'},'ID '+v.recurso.id+' · '+v.recurso.instancia+' · '+tr('validado {q}',{q:hora(v.validadoEm)})),selo(v.estado),h('span',{class:'proj-vinculo-acoes'},DS.link('Validar',async()=>{if(await chamar(()=>api.servicoConferir(e.id,v.servico)))mostrar('projetos');},{rotulo:'Validar vínculo '+v.servico,seta:false}),DS.link('Remover',async()=>{const r=await chamar(()=>api.servicoDesvincular(e.id,v.servico));if(r&&!r.canceled)mostrar('projetos');},{rotulo:'Remover vínculo '+v.servico,seta:false})))),h('li',{class:'proj-vinculo','data-servico':'local'},DS.origem(e.pastaLocal?'local':'ausente',e.pastaLocal?tr('Pasta vinculada'):tr('Sem pasta local')),h('span',{class:'ds-sub'},e.pastaLocal||tr('Opcional: necessária para catálogo, automações e evidências locais.'))));
    el.append(h('section',{class:'nota','data-espaco':e.id},h('h2',{},e.nome),e.descricao?h('p',{class:'suave'},e.descricao):null,chips,acoes,h('p',{class:'suave'},'ID Prumo: '+e.id)));
  }
  await projetosLocais(el);
};
