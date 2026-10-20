'use strict';
/** Conexões: apresenta permissões mínimas e instruções oficiais de configuração de cada serviço. */
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
