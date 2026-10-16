'use strict';
/** Conexões: uma linha por serviço (contas, escrita no projeto e ações), formulário sob a linha e importação dos projetos Qase pelo token. */
function mensagemFalhaQase(erro) {
  const codigo=/^[A-Z][A-Z0-9_]{2,70}/.exec(String(erro||''))?.[0]||'';
  const mensagens={
    SERVICE_UNAVAILABLE:'Não foi possível comunicar com o Qase. A causa pode ser rede, DNS, proxy ou indisponibilidade do serviço. Tente novamente.',
    SERVICE_TIMEOUT:'O Qase demorou para responder. Verifique a conexão e tente novamente.',
    SERVICE_RATE_LIMIT:'O Qase limitou temporariamente as consultas. Aguarde alguns minutos antes de tentar novamente.',
    SERVICE_RESPONSE_INVALID:'O Qase retornou uma resposta inesperada. Nenhum projeto foi importado.',
    SERVICE_RESPONSE_LIMIT:'A resposta do Qase ultrapassou o limite de segurança. Nenhum projeto foi importado.',
    SERVICE_NOT_FOUND:'O recurso de projetos não foi encontrado na API do Qase. Confira se a integração está atualizada.',
    SERVICE_DESTINATION_BLOCKED:'O endereço de conexão com o Qase foi bloqueado pela validação de segurança.',
    SERVICE_REDIRECT_BLOCKED:'O Qase tentou redirecionar a consulta. A conexão foi bloqueada por segurança.',
    CREDENTIAL_INVALID_OR_EXPIRED:'Token Qase inválido ou expirado. Gere um token novo nas configurações do Qase.',
    SERVICE_PERMISSION:'O token informado não tem permissão para listar os projetos Qase.',
    CREDENTIAL_PROTECTION_UNAVAILABLE:'O cofre de credenciais do sistema não está disponível. Não foi possível prosseguir.',
    QASE_PROJECT_LIMIT:'Esta conta possui projetos demais para uma importação segura de uma vez.',
    INVALID_ARGUMENTS:'Confira o token informado e tente novamente.'
  };
  return (mensagens[codigo]||'Não foi possível validar a conexão com o Qase. Confira a configuração e tente novamente.')+
    ' Nenhum token foi salvo nesta tentativa.';
}
// Tela única por serviço: cada linha reúne o que o serviço serve, as contas conectadas, a escrita no projeto e as ações.
// O formulário de conexão abre logo abaixo da linha clicada (sem cartão separado no fim da página).
const servicosConexao=[['qase','Qase','Casos, suites, runs e defeitos'],['jira','Jira','Tickets, bugs e critérios de aceite'],['github','GitHub','Repositório, Pull Requests, Issues e pipelines']];
// Permissões que o token precisa ter, com os nomes exatos das telas de cada serviço, para a pessoa não gerar um token incompleto.
const permissoesDoToken={
  github:{onde:'GitHub › Settings › Developer settings › Personal access tokens › Fine-grained tokens › Generate new token. Em Repository access, escolha só os repositórios que o Prumo vai usar.',
    itens:[['Issues','Read and write','listar issues e publicar bug ou melhoria (sem escrita, o GitHub descarta os rótulos)'],['Contents','Read-only','branches, commits e arquivos de teste; Read and write só para criar branch e gravar teste'],['Pull requests','Read-only','ver Pull Requests; Read and write só para abrir PR'],['Actions','Read-only','ver pipelines e execuções'],['Metadata','Read-only','obrigatória; o GitHub marca sozinho']]},
  jira:{onde:'id.atlassian.com › Segurança › Criar e gerenciar tokens de API. O token herda as permissões da sua conta no Jira.',
    itens:[['Navegar no projeto','—','ver o projeto e os tickets'],['Criar itens','—','publicar bug, melhoria ou tarefa'],['Adicionar comentários','—','comentar resultados'],['Transicionar itens','—','mudar status (opcional)']]},
  qase:{onde:'app.qase.io › seu perfil › API tokens. O token herda o seu papel no Qase.',
    itens:[['Leitura dos projetos','—','listar projetos, casos, suites, runs e defeitos'],['Escrita nos projetos','—','criar casos, defeitos e runs e publicar resultados']]}
};
function blocoPermissoes(servico){
  const p=permissoesDoToken[servico];if(!p)return null;
  return h('div',{class:'cx-permissoes',id:'conexao-permissoes'},
    h('strong',{},servico==='github'?'Permissões do token':'O que a sua conta precisa poder fazer'),
    h('p',{class:'suave'},p.onde),
    h('ul',{},p.itens.map(([nome,nivel,para])=>h('li',{},h('span',{class:'cx-perm-nome'},nome),nivel!=='—'?chipCx(nivel,nivel.includes('write')?'aviso':null):null,h('span',{class:'suave'},para)))));
}
const chipCx=(texto,tom)=>typeof DS!=='undefined'?DS.chip(texto,tom):h('span',{class:'ds-chip','data-tom':tom||null},texto);
const infoCx=texto=>typeof DS!=='undefined'?DS.info(texto):h('span',{class:'suave'},texto);
const primaria=b=>{b.classList?.add('primaria');return b;};
abas.conexoes=async el=>{
  const novo=botao('Nova conexão',()=>abrirPainel('qase',null),'conexao-nova');
  el.append(h('h1',{},'Conexões'));
  const form=h('div',{class:'cx-painel',id:'conexao-form'});
  const recursos=h('div',{id:'recursos-remotos',class:'cx-recursos'});
  let previaId=null;
  const limparPrevia=async()=>{
    if(previaId){const id=previaId;previaId=null;await api.qaseCancelar(id);}
  };
  const fecharPainel=async()=>{await limparPrevia();form.replaceChildren();form.remove?.();};
  // Lista dos projetos do token: caixa à esquerda, nome, código e situação; busca e "selecionar todos" na mesma barra.
  function apresentarProjetos(pre,container){
    previaId=pre.previaId;
    const projetos=pre.projetos||[];
    const filtro=h('input',{id:'qase-busca',type:'search',placeholder:'Buscar por nome ou código','aria-label':'Buscar projetos Qase',autocomplete:'off'});
    const todos=h('input',{type:'checkbox',id:'qase-todos'});
    const lista=h('div',{id:'qase-projetos-lista',class:'cx-lista',role:'group','aria-label':'Projetos do Qase'});
    const status=h('span',{id:'qase-status',class:'suave'});
    const selecao=new Set();
    const visiveis=()=>projetos.filter(p=>(p.nome+' '+p.codigo).toLocaleLowerCase().includes(filtro.value.toLocaleLowerCase()));
    function render(){
      const encontrados=visiveis();
      lista.replaceChildren(...encontrados.map(p=>{
        const ck=h('input',{type:'checkbox','data-codigo':p.codigo,'aria-label':p.nome+' · '+p.codigo});
        ck.checked=selecao.has(p.codigo);
        ck.addEventListener('change',()=>{if(ck.checked)selecao.add(p.codigo);else selecao.delete(p.codigo);contar();});
        return h('label',{class:'cx-item'},ck,h('span',{class:'cx-item-nome'},p.nome),chipCx(p.codigo),
          p.jaImportado?chipCx('já no Prumo','ok'):p.conflitoOutraConta?chipCx('mesmo código em outra conexão','aviso'):null);
      }));
      if(!encontrados.length)lista.append(h('p',{class:'suave cx-vazio'},'Nenhum projeto corresponde à busca.'));
      todos.checked=encontrados.length>0&&encontrados.every(p=>selecao.has(p.codigo));
      contar();
    }
    function contar(){status.textContent=selecao.size+' de '+projetos.length+' selecionado(s)';importar.disabled=!selecao.size;}
    todos.addEventListener('change',()=>{for(const p of visiveis()){if(todos.checked)selecao.add(p.codigo);else selecao.delete(p.codigo);}render();});
    filtro.addEventListener('input',render);
    const importar=primaria(botao('Adicionar ao Prumo',async()=>{
      if(!selecao.size){avisar('Selecione pelo menos um projeto Qase.',true);return;}
      status.textContent='Adicionando projetos…';
      const resultado=await chamar(()=>api.qaseImportar(previaId,[...selecao]));
      if(!resultado){status.textContent='Não foi possível concluir a importação.';return;}
      if(resultado.canceled){status.textContent='Importação cancelada. Nenhum projeto foi adicionado.';return;}
      previaId=null;
      status.textContent=resultado.adicionados.length+' adicionados · '+resultado.existentes.length+' já existentes · '+resultado.falhas.length+' com falha';
      if(resultado.falhas.length)status.textContent+=' ('+resultado.falhas.map(f=>f.codigo+': '+f.erro).join(', ')+')';
      else{avisar('Projetos Qase vinculados ao Prumo. Você pode selecioná-los em Projetos.');mostrar('projetos');}
    },'qase-importar'));
    container.replaceChildren(
      h('div',{class:'cx-lista-cab'},h('strong',{},'Projetos do token'),infoCx('Escolha quais projetos usar no Prumo. Nada é enviado ao Qase nesta etapa.')),
      h('div',{class:'cx-barra'},filtro,h('label',{class:'cx-todos'},todos,' Selecionar todos')),
      lista,
      h('div',{class:'cx-rodape'},status,h('span',{class:'cx-acoes'},botao('Cancelar importação',async()=>{await limparPrevia();container.replaceChildren();}),importar)));
    render();
  }
  // Formulário de conexão: abre sob a linha do serviço (ou no topo, por "Nova conexão"); o serviço continua trocável.
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
  // Recursos da conta (projetos ou repositórios) para vincular ao projeto selecionado; aparecem sob a conta.
  async function listar(c,pagina,ancora){
    const id=estado.espaco?.id;
    const resultado=await chamar(()=>api.servicoRecursos(c.id,pagina));if(!resultado)return;
    recursos.replaceChildren(h('div',{class:'cx-lista-cab'},h('strong',{},'Recursos de '+c.nome),id?null:chipCx('Selecione primeiro um projeto Prumo.','aviso')),
      resultado.recursos.length?h('div',{class:'cx-lista'},resultado.recursos.map(x=>h('div',{class:'cx-item cx-recurso'},
        h('span',{class:'cx-item-nome'},x.nome),chipCx(x.chave),h('span',{class:'suave'},'ID '+x.id),
        id?botao('Vincular '+x.chave,async()=>{
          const v=await chamar(()=>api.servicoVincular(id,c.id,x));
          if(v&&!v.canceled)avisar('Vínculo confirmado para o projeto selecionado.');
        }):null)))
      :h('p',{class:'suave'},'A API retornou uma lista vazia para esta credencial.'),
      resultado.proxima!==null?botao('Próxima página',()=>listar(c,{offset:resultado.proxima,limite:50},ancora)):null);
    ancora.after?.(recursos);
  }
  const contas=(await chamar(api.servicos))||[];
  const e=estado.espaco;
  const perm=e&&typeof escritaDoProjeto==='function'?await escritaDoProjeto(e).catch(()=>null):null;
  const linhas=servicosConexao.map(([sv,nomeSv,serve])=>{
    const ativas=contas.filter(c=>c.ativa&&c.servico===sv);
    const linha=h('div',{class:'cx-linha'},
      h('span',{class:'cx-nome','data-servico':sv},h('i',{'aria-hidden':'true'}),nomeSv),
      h('span',{class:'cx-serve suave'},serve),
      h('span',{class:'cx-estado'},ativas.length?chipCx(ativas.length===1?'conectado':ativas.length+' contas','ok'):h('span',{class:'suave'},'Sem conta conectada')),
      // Escrita no projeto selecionado: desligada por padrão; cada operação ainda pede confirmação.
      e?h('span',{class:'cx-escrita','data-escrita':sv},chipCx(perm?.[sv]?'escrita habilitada':'somente leitura',perm?.[sv]?'aviso':null),
        botao(perm?.[sv]?'Desabilitar escrita':'Habilitar escrita…',async()=>{const r=await chamar(()=>api.escritaHabilitar(e.id,sv,!perm?.[sv]));if(r&&!r.canceled)mostrar('conexoes');},'escrita-'+sv)):h('span',{class:'cx-escrita'}),
      h('span',{class:'cx-acoes'},botao(ativas.length?'Adicionar conta':'Conectar '+nomeSv,()=>abrirPainel(sv,bloco),'integracao-conectar-'+sv)));
    const contasNo=ativas.map(c=>{
      const conta=h('div',{class:'cx-conta','data-conta':c.id},
        h('span',{class:'cx-conta-nome'},c.nome),
        h('span',{class:'suave cx-conta-detalhe'},c.identidade+' · '+c.instancia+' · validada '+hora(c.validadaEm)),
        h('span',{class:'cx-acoes'},
          botao('Validar conexão',async()=>{const resultado=await chamar(()=>api.servicoValidar(c.id));if(resultado)avisar('Credencial validada por consulta de leitura.');}),
          // Qase: importar cria projetos Prumo novos; listar recursos vincula o projeto selecionado (ex.: criado à mão) a um projeto Qase existente.
          c.servico==='qase'?botao('Importar projetos Qase',async()=>{const resultado=await chamar(()=>api.qasePreverConta(c.id));if(!resultado)return;await limparPrevia();form.replaceChildren();
            const caixa=h('div',{class:'cx-painel',id:'conexao-qase-projetos'});form.replaceChildren(caixa);conta.after?.(form);apresentarProjetos(resultado,caixa);}):null,
          botao('Listar recursos disponíveis',()=>listar(c,{offset:0,limite:50},conta)),
          botao('Remover conexão',async()=>{const resultado=await chamar(()=>api.servicoRemover(c.id));if(resultado&&!resultado.canceled)mostrar('conexoes');})));
      return conta;
    });
    const bloco=h('div',{class:'cx-servico','data-integracao':sv},linha,...contasNo);
    return bloco;
  });
  el.append(h('section',{class:'cx-servicos',id:'cx-servicos'},
    h('div',{class:'cx-secao-cab'},h('h2',{},'Serviços de teste e tickets'),infoCx('Conectar dá acesso de leitura. A escrita é habilitada por projeto e cada envio ainda pede confirmação.'),novo),
    ...linhas));
};
