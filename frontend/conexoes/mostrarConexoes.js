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
const chipCx=(texto,tom)=>typeof DS!=='undefined'?DS.chip(texto,tom):h('span',{class:'ds-chip','data-tom':tom||null},texto);
const infoCx=texto=>typeof DS!=='undefined'?DS.info(texto):h('span',{class:'suave'},texto);
const primaria=b=>{b.classList?.add('primaria');return b;};
abas.conexoes=async el=>{
  const novo=botao('Nova conexão',()=>abrirPainel('qase',null),'conexao-nova');
  el.append(h('h1',{},'Conexões'));
  const form=h('div',{class:'cx-painel',id:'conexao-form'});
  const recursos=h('div',{id:'recursos-remotos',class:'cx-recursos'});
  const controleQase={previaId:null};
  const limparPrevia=async()=>{
    if(controleQase.previaId){const id=controleQase.previaId;controleQase.previaId=null;await api.qaseCancelar(id);}
  };
  const apresentarProjetos=criarApresentacaoProjetosQase(controleQase,limparPrevia);
  const fecharPainel=async()=>{await limparPrevia();form.replaceChildren();form.remove?.();};
  // Lista dos projetos do token: caixa à esquerda, nome, código e situação; busca e "selecionar todos" na mesma barra.
  // Formulário de conexão: abre sob a linha do serviço (ou no topo, por "Nova conexão"); o serviço continua trocável.
  const abrirPainel=criarAberturaFormularioConexao({el,novo,form,limparPrevia,fecharPainel,apresentarProjetos});
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
  await mostrarOperacoesExternas(el);
  await mostrarIntegracoesDosAgentes(el);
};
