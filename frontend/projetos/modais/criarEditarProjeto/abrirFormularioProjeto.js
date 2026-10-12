'use strict';
/** Abre o formulário de criar ou editar projeto e salva após confirmação da pessoa. */
function abrirFormularioProjeto(formulario,e) {
    const nome=campoPlataforma('Nome',{id:'espaco-nome',maxlength:200,value:e?.nome||''});
    const descricao=campoPlataforma('Descrição',{id:'espaco-descricao',maxlength:1000,value:e?.descricao||''});
    formulario.replaceChildren(h('h2',{},e?'Editar projeto':'Novo projeto Prumo'),nome.no,descricao.no,
      botao('Salvar projeto',async()=>{const dados={nome:nome.input.value,descricao:descricao.input.value};const r=await chamar(()=>e?api.espacoEditar(e.id,dados):api.espacoCriar(dados));if(r)escolherEspaco(r);},'espaco-salvar'),botao('Cancelar',()=>formulario.replaceChildren()));nome.input.focus();
  }
