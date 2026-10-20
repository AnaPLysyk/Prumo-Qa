'use strict';
/** Conexões: apresenta o formulário Qase, Jira ou GitHub e solicita validação ao backend. */
function criarAberturaFormularioConexao({el,novo,form,limparPrevia,fecharPainel,apresentarProjetos}){
  function abrirPainel(servico,ancora){
    const tipo=h('select',{id:'conexao-servico','aria-label':'Serviço'},servicosConexao.map(([v,n])=>h('option',{value:v},n)));
    tipo.value=servico;
    const nome=campoPlataforma('Nome da conexão',{id:'conexao-nome',maxlength:100});
    const instancia=campoPlataforma('Endereço do Jira Cloud',{id:'conexao-instancia',placeholder:'https://suaempresa.atlassian.net',maxlength:300});
    const usuario=campoPlataforma('E-mail da conta Atlassian',{id:'conexao-usuario',type:'email',placeholder:'seuemail@empresa.com'});
    const token=campoPlataforma('Token de acesso',{id:'conexao-token',type:'password',autocomplete:'off',maxlength:6000});
    const tituloToken=h('span',{id:'conexao-token-titulo'});
    token.no.replaceChildren(tituloToken,token.input);
    const titulo=h('strong',{class:'cx-painel-titulo'});const ajuda=h('span',{id:'conexao-descricao'});
    const especificos=h('div',{id:'conexao-campos-especificos',class:'cx-campos'});
    const acoes=h('div',{id:'conexao-acoes',class:'cx-acoes'});
    const permissoes=h('div',{});
    const listaQase=h('div',{id:'conexao-qase-projetos'});
    const saidaQase=h('div',{id:'qase-conexao-resultado',role:'status','aria-live':'polite'});
    function trocar(){
      void limparPrevia();listaQase.replaceChildren();saidaQase.replaceChildren();token.input.value='';
      instancia.input.value='';usuario.input.value='';
      const qase=tipo.value==='qase';
      titulo.textContent='Conectar '+(servicosConexao.find(x=>x[0]===tipo.value)?.[1]||tipo.value);
      especificos.replaceChildren(...(qase?[]:[nome.no]),...(tipo.value==='jira'?[instancia.no,usuario.no]:[]));
      ajuda.replaceChildren(infoCx(qase?'Cole o token de API do Qase para ver os projetos da conta e escolher quais adicionar ao Prumo. O token só é guardado depois da sua confirmação.'
        :tipo.value==='jira'?'Use o e-mail da conta Atlassian e um token de API. Conectar dá acesso de leitura; a escrita é habilitada por projeto.':'Use um token pessoal (PAT) com acesso ao repositório. Conectar dá acesso de leitura; a escrita é habilitada por projeto.'));
      permissoes.replaceChildren(...[blocoPermissoes(tipo.value)].filter(Boolean));
      tituloToken.textContent=qase?'Token de API do Qase':tipo.value==='jira'?'Token de API do Jira':'Token pessoal do GitHub (PAT)';
      token.input.placeholder=qase?'Cole o token do Qase':'Cole o token de acesso';
      acoes.replaceChildren(qase
        ?primaria(botao('Conectar ao Qase',async()=>{
          saidaQase.replaceChildren();
          const valor=token.input.value.trim();
          if(!valor){saidaQase.replaceChildren(h('p',{class:'cx-erro'},'Informe o token de API do Qase.'));token.input.focus?.();return;}
          // O próprio botao() já desliga o botão durante a ação (evita clique duplo); conferir disabled aqui bloqueava toda consulta.
          try{
            const resposta=await api.qasePrever(valor);
            if(!resposta?.ok){saidaQase.replaceChildren(h('p',{class:'cx-erro'},mensagemFalhaQase(resposta?.error)));return;}
            apresentarProjetos(resposta.data,listaQase);
          }catch{
            saidaQase.replaceChildren(h('p',{class:'cx-erro'},'Não foi possível concluir a consulta. Tente novamente; nenhuma credencial foi salva.'));
          }finally{token.input.value='';}
        },'qase-conectar'))
        :primaria(botao('Validar e guardar',async()=>{
          const dados={servico:tipo.value,nome:nome.input.value.trim(),token:token.input.value};
          if(tipo.value==='jira'){dados.instancia=instancia.input.value.trim();dados.usuario=usuario.input.value.trim();}
          try{const resultado=await chamar(()=>api.servicoAdicionar(dados));if(resultado&&!resultado.canceled)mostrar('conexoes');}
          finally{token.input.value='';dados.token='';}
        },'conexao-salvar')),
        botao('Cancelar',fecharPainel));
    }
    tipo.addEventListener('change',trocar);
    form.replaceChildren(h('div',{class:'cx-painel-cab'},titulo,ajuda,h('label',{class:'cx-servico-sel'},'Serviço ',tipo)),
      h('div',{class:'cx-form'},especificos,permissoes,token.no,acoes),saidaQase,listaQase);
    trocar();
    if(ancora)ancora.after?.(form);else novo.parentNode?.after?.(form);
    if(!form.parentNode&&el.append)el.append(form);
    form.scrollIntoView?.({behavior:'smooth',block:'nearest'});token.input.focus?.();
  }
  return abrirPainel;
}
