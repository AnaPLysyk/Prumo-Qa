'use strict';
/** Lista os repositórios da conta GitHub conectada, vincula o escolhido ao projeto e, se a pessoa quiser, traz uma cópia para este computador. */
function abrirRepositoriosGithub(painel,e) {
    const fechar=()=>painel.replaceChildren();
    async function mostrarPagina(conta,pagina) {
      const r=await chamar(()=>api.servicoRecursos(conta.id,pagina));if(!r)return;
      painel.replaceChildren(h('h2',{},tr('Repositórios de {n}',{n:conta.nome})),
        r.recursos.length?h('ul',{class:'ds-lista'},r.recursos.map(x=>h('li',{class:'proj-vinculo'},h('strong',{},x.chave),
          botao('Vincular',async()=>{const v=await chamar(()=>api.servicoVincular(e.id,conta.id,x));if(v&&!v.canceled)mostrar('projetos');},'repo-vincular-'+x.chave),
          botao('Vincular e trazer para este computador',async()=>{const v=await chamar(()=>api.servicoVincular(e.id,conta.id,x));if(!v||v.canceled)return;await chamar(()=>api.espacoTrazer(e.id));mostrar('projetos');},'repo-trazer-'+x.chave)))):h('p',{class:'suave'},'A API retornou uma lista vazia para esta credencial.'),
        h('div',{class:'barra-acoes'},r.proxima!==null?botao('Próxima página de recursos',()=>mostrarPagina(conta,{offset:r.proxima,limite:50})):null,botao('Cancelar',fechar)));
    }
    return (async()=>{
      const contas=await chamar(api.servicos);if(!contas)return;
      const github=contas.filter(c=>c.ativa&&c.servico==='github');
      if(!github.length){painel.replaceChildren(h('p',{class:'nota'},'Nenhuma conexão GitHub ativa. Configure uma em Conexões para listar os seus repositórios.'),botao('Abrir Conexões',()=>mostrar('conexoes')),botao('Cancelar',fechar));return;}
      if(github.length===1){await mostrarPagina(github[0],{offset:0,limite:50});return;}
      painel.replaceChildren(h('h2',{},'Escolha a conexão GitHub'),...github.map(c=>botao(c.nome,()=>mostrarPagina(c,{offset:0,limite:50}))),botao('Cancelar',fechar));
    })();
  }
