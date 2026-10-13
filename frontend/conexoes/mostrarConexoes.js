'use strict';
/** Mostra conexões, protege o campo de token e vincula recursos ao projeto. */
abas.conexoes=async el=>{
  el.append(h('h1',{},'Conexões'));
  const form=h('div',{class:'formulario',id:'conexao-form'}),recursos=h('div',{id:'recursos-remotos'});
  el.append(botao('Configurar conexão',()=>{
    const tipo=h('select',{id:'conexao-servico'},['jira','qase','github'].map(s=>h('option',{value:s},s)));
    const nome=campoPlataforma('Nome da conexão',{id:'conexao-nome',maxlength:100});const instancia=campoPlataforma('Instância Jira (https://suaempresa.atlassian.net)',{id:'conexao-instancia'});
    const usuario=campoPlataforma('E-mail Jira',{id:'conexao-usuario',type:'email'});const token=campoPlataforma('Token',{id:'conexao-token',type:'password',autocomplete:'off',maxlength:6000});
    const atualizar=()=>{instancia.no.hidden=usuario.no.hidden=tipo.value!=='jira';};tipo.addEventListener('change',atualizar);atualizar();
    form.replaceChildren(h('label',{class:'campo'},'Serviço',tipo),nome.no,instancia.no,usuario.no,token.no,
      botao('Validar e guardar credencial',async()=>{const dados={servico:tipo.value,nome:nome.input.value,token:token.input.value};if(tipo.value==='jira'){dados.instancia=instancia.input.value;dados.usuario=usuario.input.value;}try{const r=await chamar(()=>api.servicoAdicionar(dados));if(r&&!r.canceled)mostrar('conexoes');}finally{token.input.value='';dados.token='';}},'conexao-salvar'),botao('Cancelar',()=>{token.input.value='';form.replaceChildren();}));
  },'conexao-nova'),form);
  const contas=await chamar(api.servicos);if(!contas)return;
  for(const c of contas.filter(c=>c.ativa))el.append(h('section',{class:'nota'},h('h2',{},c.nome.toLowerCase().includes(c.servico)?c.nome:c.nome+' · '+c.servico),h('p',{},c.identidade+' · '+c.instancia+' · validada: '+hora(c.validadaEm)),
    botao('Validar conexão',async()=>{const r=await chamar(()=>api.servicoValidar(c.id));if(r)avisar('Credencial validada por consulta de leitura.');}),
    botao('Listar recursos disponíveis',()=>listar(c,{offset:0,limite:50})),
    botao('Remover conexão',async()=>{const r=await chamar(()=>api.servicoRemover(c.id));if(r&&!r.canceled)mostrar('conexoes');})));
  el.append(recursos);
  async function listar(c,pagina){
    const espacoId=estado.espaco?.id;const r=await chamar(()=>api.servicoRecursos(c.id,pagina));if(!r)return;
    recursos.replaceChildren(h('h2',{},'Recursos de '+c.nome),h('p',{class:'suave'},'Consulta atual · '+r.origem+' · '+hora(r.consultadoEm)+' · sem cache persistido'),
      r.recursos.length?h('div',{},r.recursos.map(x=>h('div',{class:'nota'},h('strong',{},x.nome),h('p',{},'Chave '+x.chave+' · ID '+x.id+' ('+x.tipoId+') · conta '+x.contaId),
        espacoId?botao('Vincular '+x.chave,async()=>{const v=await chamar(()=>api.servicoVincular(espacoId,c.id,x));if(v&&!v.canceled)avisar('Vínculo confirmado para o projeto selecionado nesta consulta.');}):h('p',{},'Selecione primeiro um projeto Prumo.')))):h('p',{},'A API retornou uma lista vazia para esta credencial.'),
      r.proxima!==null?botao('Próxima página de recursos',()=>listar(c,{offset:r.proxima,limite:50})):null);
  }
};
