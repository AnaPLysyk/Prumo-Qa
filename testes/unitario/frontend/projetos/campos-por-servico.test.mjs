/** Conexões: componentes DOM simulados, sem Electron, rede ou banco de dados. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const raiz=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../../');
const fonte=readFileSync(path.join(raiz,'frontend/projetos/tela-projetos.js'),'utf8');
class Elemento {
  constructor(tag,attrs={},filhos=[]) {
    this.tag=tag;this.attrs=attrs;this.children=[];this.parent=null;this.listeners={};
    this.value=attrs.value??'';this.textContent='';this.checked=false;this.disabled=false;
    this.placeholder=attrs.placeholder??'';
    this.append(...filhos);
    if(tag==='select')this.value=this.children.find(x=>x instanceof Elemento&&x.tag==='option')?.value??'';
  }
  append(...itens) {for(const c of itens.flat(Infinity)){if(c==null)continue;if(c instanceof Elemento){if(c.parent)c.parent.children=c.parent.children.filter(x=>x!==c);c.parent=this;}this.children.push(c);}}
  replaceChildren(...items){for(const c of this.children)if(c instanceof Elemento)c.parent=null;this.children=[];this.append(...items);}
  prepend(...items){const anteriores=this.children.slice();this.children=[];this.append(...items,...anteriores);}
  replaceWith(novo){const pai=this.parent;if(!pai)return;const i=pai.children.indexOf(this);if(i<0)return;
    if(novo.parent)novo.parent.children=novo.parent.children.filter(c=>c!==novo);
    pai.children.splice(i,1,novo);novo.parent=pai;this.parent=null;}
  addEventListener(e,cb){this.listeners[e]=cb;}
  dispatchEvent(ev){return this.listeners[ev.type]?.(ev);}
  querySelectorAll(selector){const out=[];const matches=n=>selector.startsWith('#')?n.attrs.id===selector.slice(1):selector.startsWith('[data-codigo')?n.attrs['data-codigo']!==undefined:n.tag===selector;
    const scan=n=>{for(const c of n.children)if(c instanceof Elemento){if(matches(c))out.push(c);scan(c);}};scan(this);return out;}
  querySelector(s){return this.querySelectorAll(s)[0]??null;}
}
function montar(opcoes={}) {
  const chamadas=[],notificacoes=[],telas=[],pendentes=new Map();
  const h=(tag,attrs,...filhos)=>new Elemento(tag,attrs,filhos);
  const botao=(label,cb,id)=>h('button',{id,onclick:cb},label);
  const campoPlataforma=(titulo,attrs={})=>{const input=h('input',attrs);return{input,no:h('label',{class:'campo'},titulo,input)};};
  const api={
    servicos:async()=>({ok:true,data:opcoes.contas||[]}),
    jiraDescobrir:async(token,usuario)=>{chamadas.push(['descobrir',usuario]);if(opcoes.descobrirFalha)return{ok:false,error:'x'};return{ok:true,data:opcoes.descoberta?opcoes.descoberta(usuario):{achou:false,motivo:'NAO_ACHEI',site:null}};},
    qaseConectar:async id=>{chamadas.push(['qase-conectar',id]);return opcoes.qaseConectarErro?{ok:false,error:opcoes.qaseConectarErro}:{ok:true,data:{id:'conta-qase',nome:'Qase'}};},
    autorizacaoDisponivel:async()=>opcoes.disponivel?{ok:true,data:opcoes.disponivel}:{ok:false,error:'x'},
    qasePrever:async token=>{chamadas.push(['prever',token]);if(opcoes.qaseAtraso)await opcoes.qaseAtraso;if(opcoes.qaseErro)return{ok:false,error:opcoes.qaseErro};return{ok:true,data:{previaId:'preview',projetos:[
      {codigo:'PQ',nome:'Prumo QA',jaImportado:false},{codigo:'EX',nome:'Exemplo',jaImportado:true}]}};},
    qaseCancelar:async id=>{chamadas.push(['cancelar',id]);return{ok:true,data:{cancelada:true}};},
    qaseImportar:async(id,codigos)=>{chamadas.push(['importar',id,codigos]);return{ok:true,data:{adicionados:codigos,existentes:[],falhas:[]}};},
    servicoAdicionar:async dados=>{chamadas.push(['adicionar',{...dados}]);if(opcoes.adicionarFalha)return{ok:false,error:opcoes.adicionarFalha===true?'CREDENTIAL_INVALID_OR_EXPIRED':opcoes.adicionarFalha};return{ok:true,data:{id:'fake'}};},
    abrirCadastroExterno:async servico=>{chamadas.push(['abrir-navegador',servico]);return{ok:true,data:{aberto:true}};}, 
    autorizarServico:async servico=>{chamadas.push(['autorizar',servico]);
      if(opcoes.rejeita)throw new Error(opcoes.rejeita);
      if(opcoes.erroIpc)return{ok:false,error:opcoes.erroIpc};
      return opcoes.autorizacao?{ok:true,data:opcoes.autorizacao(servico)}:{ok:true,data:{estado:'ERRO',indisponivel:true,mensagem:'A autorização pelo navegador ainda não foi configurada.'}};},
    autorizacaoEstado:async cancelar=>{chamadas.push(['autorizacao-estado',!!cancelar]);return{ok:true,data:{estado:'CANCELADO'}};},
    autorizacaoEscolherSite:async id=>{chamadas.push(['escolher-site',id]);return{ok:true,data:{estado:'CONECTADO',conta:{id:'c1',nome:'Jira · Empresa',identidade:'Ana'}}};},
    githubConectar:async usuario=>{chamadas.push(['github-autorizacao',usuario]);return opcoes.githubContas
      ?{ok:true,data:usuario?{estado:'CONECTADO'}:{estado:'ESCOLHER_CONTA',contas:opcoes.githubContas}}
      :{ok:false,error:{message:'GITHUB_CONNECTION_NOT_CONFIGURED: configure o OAuth App'}};}
  };
  const DS={info:texto=>h('span',{},texto),chip:texto=>h('span',{},texto),carregando:texto=>h('span',{},texto),
    secao:(titulo,conteudo)=>h('section',{},titulo,conteudo)};
  const ctx={h,botao,campoPlataforma,DS,tr:texto=>texto,abas:{},api,estado:{espaco:null},avisar:(...xs)=>notificacoes.push(xs),
    chamar:async fn=>{const r=await fn();return r.ok?r.data:null;},mostrar:name=>telas.push(name),hora:String};
  vm.createContext(ctx);vm.runInContext(fonte,ctx);
  const tela=h('main',{});
  return ctx.mostrarConexoesDoProjeto(tela,opcoes.espaco||null,opcoes.soFormulario||null,opcoes.soFormulario?{soFormulario:true,aoConectar:()=>chamadas.push(['conectado'])}:{}).then(()=>{
    const abrir=()=>tela.querySelector('#conexao-nova').attrs.onclick();
    const alterar=async servico=>{const x=tela.querySelector('#conexao-servico');x.value=servico;await x.dispatchEvent({type:'change'});};
    const clicar=async id=>{const b=tela.querySelector('#'+id);assert.ok(b,'Botão ausente: '+id);return b.attrs.onclick();};
    return {tela,abrir,alterar,clicar,chamadas,notificacoes,telas};
  });
}
test('bolinhas de Jira e Qase abrem as páginas oficiais no navegador, sem fingir OAuth',async()=>{
  const v=await montar();v.abrir();
  await v.clicar('integracao-abrir-qase');
  assert.deepEqual(v.chamadas.pop(),['abrir-navegador','qase']);
  await v.alterar('jira');
  await v.clicar('integracao-abrir-jira');
  assert.deepEqual(v.chamadas.pop(),['abrir-navegador','jira']);
  await v.alterar('github');
  assert.equal(v.tela.querySelector('#integracao-abrir-jira'),null);
  assert.ok(v.tela.querySelector('#github-autorizar'));
});
test('Qase pede apenas token; nome da conexão e dados do Jira ficam ausentes',async()=>{
  const v=await montar();v.abrir();
  assert.equal(v.tela.querySelector('#conexao-nome'),null);
  assert.equal(v.tela.querySelector('#conexao-instancia'),null);
  assert.equal(v.tela.querySelector('#conexao-usuario'),null);
  assert.ok(v.tela.querySelector('#conexao-token'));
  assert.ok(v.tela.querySelector('#qase-conectar'));
});
test('Qase consulta projetos antes de salvar, permite selecionar múltiplos e importa somente os selecionados',async()=>{
  const v=await montar();v.abrir();v.tela.querySelector('#conexao-token').value='token-sintetico';
  await v.clicar('qase-conectar');
  assert.deepEqual(v.chamadas.map(x=>x[0]),['prever']);
  assert.equal(v.tela.querySelector('#conexao-token').value,'');
  const caixas=v.tela.querySelectorAll('[data-codigo]');
  assert.equal(caixas.length,2);
  caixas[0].checked=true;caixas[0].dispatchEvent({type:'change'});
  await v.clicar('qase-importar');
  assert.equal(v.chamadas[1][0],'importar');
  assert.deepEqual(Array.from(v.chamadas[1][2]),['PQ']);
  assert.deepEqual(v.telas,['projetos']);
});
test('Qase pode selecionar todos, buscar e desmarcar registros visíveis',async()=>{
  const v=await montar();v.abrir();v.tela.querySelector('#conexao-token').value='abc';
  await v.clicar('qase-conectar');
  const total=v.tela.querySelector('#qase-todos');
  total.checked=true;total.dispatchEvent({type:'change'});
  const b=v.tela.querySelector('#qase-busca');b.value='Prumo';b.dispatchEvent({type:'input'});
  const encontrados=v.tela.querySelectorAll('[data-codigo]');
  assert.equal(encontrados.length,1);
  assert.equal(encontrados[0].checked,true);
  await v.clicar('qase-importar');
  assert.deepEqual(new Set(v.chamadas[1][2]),new Set(['PQ','EX']));
});
test('Cancelar Qase descarta a prévia e não importa projetos',async()=>{
  const v=await montar();v.abrir();v.tela.querySelector('#conexao-token').value='fake';
  await v.clicar('qase-conectar');
  const botao=v.tela.querySelector('#conexao-qase-projetos').querySelectorAll('button').find(x=>x.children.includes('Voltar'));
  await botao.attrs.onclick();
  assert.deepEqual(v.chamadas.map(x=>x[0]),['prever','cancelar']);
});
test('Jira por token pede só site, e-mail e token (o nome da conexão é gerado); GitHub não herda campos Jira',async()=>{
  const v=await montar();v.abrir();await v.alterar('jira');
  assert.equal(v.tela.querySelector('#conexao-nome'),null,'sem campo de nome no Jira');
  assert.ok(v.tela.querySelector('#conexao-instancia'));
  assert.ok(v.tela.querySelector('#conexao-usuario'));
  v.tela.querySelector('#conexao-instancia').value='https://qa.atlassian.net';
  v.tela.querySelector('#conexao-usuario').value='qa@example.test';
  v.tela.querySelector('#conexao-token').value='fake';
  await v.clicar('conexao-salvar');
  assert.equal(v.chamadas[0][1].servico,'jira');
  assert.equal(v.chamadas[0][1].usuario,'qa@example.test');
  assert.equal(v.chamadas[0][1].nome,'Jira · qa','o nome vem do site');
  assert.equal(v.chamadas[0][1].instancia,'https://qa.atlassian.net');
  await v.alterar('github');
  assert.equal(v.tela.querySelector('#conexao-instancia'),null);
  assert.equal(v.tela.querySelector('#conexao-token').value,'');
  assert.ok(v.tela.querySelector('#conexao-nome'));
  assert.ok(v.tela.querySelector('#github-autorizar'));
  assert.equal(v.tela.querySelector('#github-token-avancado').open,false);
  assert.equal(v.tela.querySelector('#github-token-avancado').hidden,false);
});
test('GitHub sem o serviço do Prumo configurado cai na autenticação do Windows e informa falha sem solicitar PAT',async()=>{
  const v=await montar();v.abrir();await v.alterar('github');
  await v.clicar('github-autorizar');
  assert.ok(v.chamadas.some(x=>x[0]==='github-autorizacao'));
  assert.ok(v.tela.querySelector('#github-autorizacao').children.some(x=>x instanceof Elemento && x.children.join(' ').includes('GITHUB_CONNECTION_NOT_CONFIGURED')));
});
test('GitHub permite escolher uma conta existente do Windows sem criar OAuth App',async()=>{
  const v=await montar({githubContas:['ContaGitHub']});
  v.abrir();await v.alterar('github');
  await v.clicar('github-autorizar');
  const escolha=v.tela.querySelector('#github-autorizacao').querySelectorAll('button').find(x=>x.children.includes('Usar ContaGitHub'));
  assert.ok(escolha,'a pessoa deve confirmar qual conta local deseja vincular');
  assert.deepEqual(v.chamadas[0],['autorizar','github'],'tenta primeiro o serviço do Prumo');
  assert.deepEqual(v.chamadas[1],['github-autorizacao',undefined],'sem o serviço configurado, cai no Git Credential Manager');
  await escolha.attrs.onclick();
  assert.deepEqual(v.chamadas[2],['github-autorizacao','ContaGitHub']);
  assert.deepEqual(v.telas,['projetos']);
  assert.equal(v.chamadas.some(x=>x[0]==='adicionar'),false,'credenciais não são enviadas pelo formulário');
});
test('GitHub: Conectar abre a autorização pelo navegador e conclui sem pedir token',async()=>{
  const v=await montar({autorizacao:()=>({estado:'CONECTADO',conta:{id:'c1',nome:'GitHub · ana',identidade:'ana'}})});
  v.abrir();await v.alterar('github');
  await v.clicar('github-autorizar');
  assert.deepEqual(v.chamadas[0],['autorizar','github']);
  assert.equal(v.chamadas.some(x=>x[0]==='github-autorizacao'),false,'não usa o caminho do Windows quando o serviço responde');
  assert.deepEqual(v.telas,['projetos']);
});
test('GitHub sem repositório instalado: oferece escolher os repositórios no GitHub e só depois continua',async()=>{
  const v=await montar({autorizacao:()=>({estado:'CONECTADO',instalarAplicativo:true,conta:{id:'c1',nome:'GitHub · ana',identidade:'ana'}})});
  v.abrir();await v.alterar('github');
  await v.clicar('github-autorizar');
  assert.deepEqual(v.telas,[],'ainda não concluiu: falta instalar o aplicativo');
  await v.clicar('github-instalar');
  assert.deepEqual(v.chamadas.at(-1),['abrir-navegador','github']);
  await v.clicar('github-instalado');
  assert.deepEqual(v.telas,['projetos']);
});
test('Jira: Conectar com Jira usa o navegador e o token manual fica na configuração avançada',async()=>{
  const v=await montar({autorizacao:()=>({estado:'CONECTADO',conta:{id:'c1',nome:'Jira · Empresa',identidade:'Ana'}})});
  v.abrir();await v.alterar('jira');
  assert.ok(v.tela.querySelector('#jira-autorizar'));
  assert.equal(v.tela.querySelector('#github-token-avancado').open,false);
  assert.ok(v.tela.querySelector('#conexao-salvar'),'o caminho manual continua existindo');
  await v.clicar('jira-autorizar');
  assert.deepEqual(v.chamadas[0],['autorizar','jira']);
  assert.deepEqual(v.telas,['projetos']);
  assert.equal(v.chamadas.some(x=>x[0]==='adicionar'),false);
});
test('Jira com vários sites: a pessoa escolhe o site e nada é conectado antes disso',async()=>{
  const sites=[{id:'11111111-1111-4111-8111-111111111111',nome:'Empresa',url:'https://empresa.atlassian.net'},{id:'22222222-2222-4222-8222-222222222222',nome:'Filial',url:'https://filial.atlassian.net'}];
  const v=await montar({autorizacao:()=>({estado:'ESCOLHER_SITE',sites})});
  v.abrir();await v.alterar('jira');
  await v.clicar('jira-autorizar');
  assert.deepEqual(v.telas,[]);
  assert.ok(v.tela.querySelector('#jira-site-'+sites[1].id));
  await v.clicar('jira-site-'+sites[1].id);
  assert.deepEqual(v.chamadas.at(-1),['escolher-site',sites[1].id]);
  assert.deepEqual(v.telas,['projetos']);
});
test('Jira sem serviço central configurado: mostra o motivo e abre o token manual',async()=>{
  const v=await montar();
  v.abrir();await v.alterar('jira');
  await v.clicar('jira-autorizar');
  assert.equal(v.tela.querySelector('#github-token-avancado').open,true);
  assert.ok(v.tela.querySelector('#github-autorizacao').children.some(x=>x instanceof Elemento&&x.children.join(' ').includes('ainda não foi configurada')));
  assert.deepEqual(v.telas,[]);
});
test('Recusa ou cancelamento da autorização não conecta nada',async()=>{
  const v=await montar({autorizacao:()=>({estado:'NEGADO'})});
  v.abrir();await v.alterar('github');
  await v.clicar('github-autorizar');
  assert.deepEqual(v.telas,[]);
  assert.ok(v.tela.querySelector('#github-autorizacao').children.some(x=>x instanceof Elemento&&x.children.join(' ').includes('recusada')));
});
test('erro do núcleo aparece com a explicação e o código, nunca como mensagem genérica sem pista',async()=>{
  const v=await montar({erroIpc:'SESSION_EXPIRED: entre de novo no Prumo.'});
  v.abrir();await v.alterar('jira');await v.clicar('jira-autorizar');
  const texto=()=>v.tela.querySelector('#github-autorizacao').children.filter(x=>x instanceof Elemento).map(x=>x.children.join(' ')).join(' ');
  assert.match(texto(),/entre de novo no Prumo\. \(SESSION_EXPIRED\)/);
  const sem=await montar({erroIpc:'IPC_SENDER_REJECTED'});
  sem.abrir();await sem.alterar('jira');await sem.clicar('jira-autorizar');
  assert.match(sem.tela.querySelector('#github-autorizacao').children.filter(x=>x instanceof Elemento).map(x=>x.children.join(' ')).join(' '),/Não foi possível iniciar a conexão\. \(IPC_SENDER_REJECTED\)/);
});
test('falha da chamada no processo da janela mostra a causa em vez de esconder',async()=>{
  const v=await montar({rejeita:'No handler registered'});
  v.abrir();await v.alterar('jira');await v.clicar('jira-autorizar');
  assert.match(v.tela.querySelector('#github-autorizacao').children.filter(x=>x instanceof Elemento).map(x=>x.children.join(' ')).join(' '),/No handler registered [(]RENDERER[)]/);
});

const textoDe=(no)=>no instanceof Elemento?[...no.children].map(textoDe).join(' '):String(no);
test('Qase em três passos curtos: pegar o token, colar, escolher; sem blocos de permissão na frente',async()=>{
  const v=await montar();v.abrir();
  const passos=v.tela.querySelector('#qase-passos');
  assert.ok(passos,'passos do Qase');
  const todos=passos.querySelectorAll('div').filter(x=>x.attrs['data-passo']);
  assert.deepEqual(todos.map(x=>x.attrs['data-passo']),['1','2']);
  assert.match(textoDe(todos[0]),/Pegue seu token/);
  assert.match(textoDe(todos[1]),/Cole aqui/);
  assert.equal(v.tela.querySelector('#conexao-permissoes'),null,'permissões vão para o ⓘ, não para a frente da tela');
  assert.match(textoDe(v.tela),/Cole seu token e eu mostro seus projetos\./);
});
test('Qase aberto direto (importar): um título só, sem a frase repetida sobre contas',async()=>{
  const v=await montar({soFormulario:'qase'});
  assert.equal(v.tela.querySelectorAll('h2').length,0,'nenhum título solto: o painel tem o seu');
  assert.ok(v.tela.querySelectorAll('strong').some(x=>x.textContent==='Conectar o Qase'),'importar só conecta a conta: o destino é escolhido na tela seguinte');
  assert.match(textoDe(v.tela),/Cole seu token e eu conecto o Qase\./);
  assert.ok(v.tela.querySelector('#qase-passos'));
});
test('Qase: depois de verificar, o token some da tela e o passo 3 pergunta o que trazer; Voltar devolve os passos',async()=>{
  const v=await montar();v.abrir();
  v.tela.querySelector('#conexao-token').value='token-sintetico';
  await v.clicar('qase-conectar');
  assert.equal(v.tela.querySelector('#qase-passos').hidden,true);
  assert.equal(v.tela.querySelector('#qase-verificado').hidden,false);
  assert.match(textoDe(v.tela.querySelector('#qase-verificado')),/Token verificado e já apagado da tela/);
  assert.match(textoDe(v.tela.querySelector('#conexao-qase-projetos')),/Achei 2 projetos\. Quais vêm comigo\?/);
  const importar=v.tela.querySelector('#qase-importar');
  assert.equal(importar.disabled,true);
  const caixa=v.tela.querySelectorAll('[data-codigo]')[0];caixa.checked=true;caixa.dispatchEvent({type:'change'});
  assert.equal(importar.textContent,'Trazer 1 projeto');
  const voltar=v.tela.querySelector('#conexao-qase-projetos').querySelectorAll('button').find(x=>x.children.includes('Voltar'));
  await voltar.attrs.onclick();
  assert.equal(v.tela.querySelector('#qase-passos').hidden,false);
  assert.equal(v.tela.querySelector('#qase-verificado').hidden,true);
  assert.deepEqual(v.chamadas.map(x=>x[0]),['prever','cancelar']);
});
test('Qase: erro de token fala curto e sempre diz que nada foi salvo',async()=>{
  const v=await montar({qaseErro:'CREDENTIAL_INVALID_OR_EXPIRED'});v.abrir();
  v.tela.querySelector('#conexao-token').value='ruim';
  await v.clicar('qase-conectar');
  const saida=textoDe(v.tela.querySelector('#qase-conexao-resultado'));
  assert.match(saida,/Esse token não funcionou\. Crie outro no Qase e cole aqui\. Nada foi salvo\./);
  assert.equal(v.tela.querySelector('#conexao-token').value,'ruim','em erro o token fica no campo para corrigir um caractere, sem colar tudo de novo');
  assert.equal(v.tela.querySelector('#qase-passos').hidden??false,false,'os passos continuam à vista para tentar de novo');
  v.tela.querySelector('#conexao-token').value='';
  await v.clicar('qase-conectar');
  assert.match(textoDe(v.tela.querySelector('#qase-conexao-resultado')),/Cole o token do Qase primeiro/);
});
test('Jira: serviço do Prumo sem o aplicativo oficial mostra direto o token e esconde o botão que falharia',async()=>{
  const v=await montar({disponivel:{github:true,jira:false}});v.abrir();await v.alterar('jira');
  await new Promise(r=>setTimeout(r,5));
  assert.equal(v.tela.querySelector('#github-token-avancado').open,true);
  assert.equal(v.tela.querySelector('#jira-autorizar').hidden,true);
  assert.ok(v.tela.querySelector('#conexao-salvar'));
  const ok=await montar({disponivel:{github:true,jira:true}});ok.abrir();await ok.alterar('jira');
  await new Promise(r=>setTimeout(r,5));
  assert.equal(ok.tela.querySelector('#github-token-avancado').open,false);
  assert.notEqual(ok.tela.querySelector('#jira-autorizar').hidden,true);
});

test('Qase: trocar de serviço enquanto o Qase responde descarta a prévia e não mostra lista no formulário errado',async()=>{
  let liberar;const atraso=new Promise(r=>{liberar=r;});
  const v=await montar({qaseAtraso:atraso});v.abrir();
  v.tela.querySelector('#conexao-token').value='token-sintetico';
  const pendente=v.clicar('qase-conectar');
  await v.alterar('jira');
  liberar();await pendente;
  assert.equal(v.tela.querySelector('#qase-projetos-lista'),null,'nenhuma lista do Qase sob o formulário do Jira');
  assert.ok(v.chamadas.some(x=>x[0]==='cancelar'&&x[1]==='preview'),'a prévia criada no servidor é cancelada');
});
test('Jira: erros do núcleo viram frases claras',async()=>{
  const casos=[['SERVICE_DESTINATION_BLOCKED',/Não reconheci o site/],['CREDENTIAL_INVALID_OR_EXPIRED',/não aceitou o e-mail e o token/],['SERVICE_NOT_FOUND',/Não achei esse site/],['CONNECTION_DUPLICATE',/já está conectado/],['ALGO_INESPERADO',/Não consegui conectar o Jira/]];
  for(const [codigo,esperado] of casos){
    const v=await montar({adicionarFalha:codigo});v.abrir();await v.alterar('jira');
    v.tela.querySelector('#conexao-instancia').value='empresa';v.tela.querySelector('#conexao-usuario').value='a@b.co';v.tela.querySelector('#conexao-token').value='tk';
    await v.clicar('conexao-salvar');
    const texto=textoDe(v.tela.querySelector('#qase-conexao-resultado'));
    assert.match(texto,esperado,codigo);
    assert.ok(!texto.includes(codigo),'o código técnico não aparece para a pessoa: '+codigo);
    assert.equal(v.tela.querySelector('#conexao-token').value,'tk');
  }
});
test('Jira: sem conseguir perguntar se o navegador está disponível, o botão aparece (a tentativa explica o que houve)',async()=>{
  const v=await montar();v.abrir();await v.alterar('jira');
  await new Promise(r=>setTimeout(r,5));
  assert.notEqual(v.tela.querySelector('#jira-autorizar').hidden,true);
});

test('Qase dentro de um projeto: Conectar só liga a conta e abre a escolha de um projeto; nada é importado em lote',async()=>{
  const v=await montar({soFormulario:'qase',espaco:{id:'11111111-1111-4111-8111-111111111111',nome:'Meu projeto'}});
  assert.ok(v.tela.querySelectorAll('strong').some(x=>x.textContent==='Conectar o Qase'));
  assert.match(textoDe(v.tela),/Cole seu token e eu conecto o Qase a este projeto\./);
  v.tela.querySelector('#conexao-token').value='token-sintetico';
  await v.clicar('qase-conectar');
  assert.deepEqual(v.chamadas.map(x=>x[0]),['prever','qase-conectar','conectado']);
  assert.equal(v.chamadas[1][1],'preview');
  assert.equal(v.tela.querySelector('#qase-projetos-lista'),null,'sem lista de importação em lote dentro de um projeto');
  assert.equal(v.tela.querySelector('#conexao-token').value,'');
});
test('Qase dentro de um projeto: falha ao conectar a conta mostra o erro e mantém o token',async()=>{
  const v=await montar({soFormulario:'qase',espaco:{id:'11111111-1111-4111-8111-111111111111',nome:'P'},qaseConectarErro:'CREDENTIAL_PROTECTION_UNAVAILABLE'});
  v.tela.querySelector('#conexao-token').value='token-sintetico';
  await v.clicar('qase-conectar');
  assert.match(textoDe(v.tela.querySelector('#qase-conexao-resultado')),/cofre do sistema não está disponível/);
  assert.equal(v.chamadas.some(x=>x[0]==='conectado'),false);
  assert.equal(v.tela.querySelector('#conexao-token').value,'token-sintetico');
});
const CONTA_JIRA={id:'c1',servico:'jira',ativa:true,usuario:'ana@empresa.com',instancia:'https://empresa.atlassian.net'};
test('Jira com conexão anterior: site e e-mail já vêm preenchidos e só o token precisa ser colado',async()=>{
  const v=await montar({contas:[CONTA_JIRA],disponivel:{github:true,jira:false}});v.abrir();await v.alterar('jira');
  await new Promise(r=>setTimeout(r,5));
  assert.equal(v.tela.querySelector('#conexao-instancia').value,'empresa');
  assert.equal(v.tela.querySelector('#conexao-usuario').value,'ana@empresa.com');
  assert.equal(v.tela.querySelector('#jira-dados').open,false,'o que já é conhecido fica recolhido');
  v.tela.querySelector('#conexao-token').value='token-de-api';
  await v.clicar('conexao-salvar');
  const dados=v.chamadas.find(x=>x[0]==='adicionar')[1];
  assert.deepEqual({servico:dados.servico,instancia:dados.instancia,usuario:dados.usuario,nome:dados.nome},{servico:'jira',instancia:'empresa',usuario:'ana@empresa.com',nome:'Jira · empresa'});
  assert.deepEqual(v.telas,['projetos'],'conectou: segue direto para a escolha do projeto');
  assert.equal(v.tela.querySelector('#conexao-token').value,'');
});
test('Jira: token recusado fica no campo para corrigir',async()=>{
  const v=await montar({adicionarFalha:true});v.abrir();await v.alterar('jira');
  v.tela.querySelector('#conexao-instancia').value='empresa';v.tela.querySelector('#conexao-usuario').value='a@b.co';v.tela.querySelector('#conexao-token').value='token-com-erro';
  await v.clicar('conexao-salvar');
  assert.equal(v.tela.querySelector('#conexao-token').value,'token-com-erro');
  assert.deepEqual(v.telas,[]);
});

test('Jira só com o token: o Prumo descobre o site e o e-mail aceitos e conecta, sem pedir mais nada',async()=>{
  const v=await montar({descoberta:()=>({achou:true,site:'empresa',usuario:'ana@empresa.com'})});v.abrir();await v.alterar('jira');
  assert.equal(v.tela.querySelector('#jira-dados').open,false,'site e e-mail não aparecem de saída: só o token');
  v.tela.querySelector('#conexao-token').value='token-de-api';
  await v.clicar('conexao-salvar');
  assert.deepEqual(v.chamadas.map(x=>x[0]),['descobrir','adicionar']);
  const dados=v.chamadas[1][1];
  assert.deepEqual({instancia:dados.instancia,usuario:dados.usuario,nome:dados.nome},{instancia:'empresa',usuario:'ana@empresa.com',nome:'Jira · empresa'});
  assert.deepEqual(v.telas,['projetos'],'conectou: segue para a escolha do projeto');
  assert.equal(v.tela.querySelector('#conexao-token').value,'');
});
test('Jira: sem token não procura nada e explica',async()=>{
  const v=await montar();v.abrir();await v.alterar('jira');
  await v.clicar('conexao-salvar');
  assert.match(textoDe(v.tela.querySelector('#qase-conexao-resultado')),/Cole o token primeiro/);
  assert.equal(v.chamadas.length,0);
});
test('Jira: não achou só com o token, pede o e-mail da Atlassian (que pode ser diferente do e-mail do Prumo); com ele, acha o site sozinho',async()=>{
  const v=await montar({descoberta:(usuario)=>usuario==='ana@empresa.com'?{achou:true,site:'empresa',usuario}:{achou:false,motivo:'NAO_ACHEI',site:null}});
  v.abrir();await v.alterar('jira');
  v.tela.querySelector('#conexao-token').value='token-de-api';
  await v.clicar('conexao-salvar');
  assert.match(textoDe(v.tela.querySelector('#qase-conexao-resultado')),/A Atlassian não diz de quem é o token, então preciso do e-mail da conta onde você o criou \(pode ser diferente do e-mail do Prumo\)/);
  assert.equal(v.tela.querySelector('#jira-dados').open,false,'o e-mail já estava à vista; o nome do site continua recolhido');
  assert.equal(v.chamadas.some(x=>x[0]==='adicionar'),false);
  assert.equal(v.tela.querySelector('#conexao-token').value,'token-de-api','o token fica para a segunda tentativa');
  v.tela.querySelector('#conexao-usuario').value='ana@empresa.com';
  await v.clicar('conexao-salvar');
  assert.deepEqual(v.chamadas.map(x=>x[0]),['descobrir','descobrir','adicionar']);
  assert.equal(v.chamadas[1][1],'ana@empresa.com','o e-mail digitado vai como palpite');
  assert.equal(v.chamadas[2][1].instancia,'empresa');
  assert.deepEqual(v.telas,['projetos']);
});
test('Jira: com e-mail e sem site achável, pede só o nome do site',async()=>{
  const v=await montar();v.abrir();await v.alterar('jira');
  v.tela.querySelector('#conexao-usuario').value='ana@empresa.com';v.tela.querySelector('#conexao-token').value='tk';
  await v.clicar('conexao-salvar');
  assert.match(textoDe(v.tela.querySelector('#qase-conexao-resultado')),/Não achei o seu site Jira pelo e-mail\. Digite o nome dele \(o que vem antes de \.atlassian\.net\)/);
  assert.equal(v.chamadas.some(x=>x[0]==='adicionar'),false);
});
test('Jira: site existente mas e-mail recusado pede para conferir o e-mail e nunca preenche um site que pode ser de outra pessoa',async()=>{
  const v=await montar({descoberta:()=>({achou:false,motivo:'CREDENCIAL_RECUSADA',site:'paulalysyk1234'})});v.abrir();await v.alterar('jira');
  v.tela.querySelector('#conexao-token').value='tk';
  await v.clicar('conexao-salvar');
  assert.match(textoDe(v.tela.querySelector('#qase-conexao-resultado')),/O Jira não aceitou esse e-mail com o token\. Confira o e-mail da conta Atlassian em que você criou o token/);
  assert.equal(v.tela.querySelector('#conexao-instancia').value,'','o palpite de site não vira campo preenchido');
});
test('Jira: falha ao procurar não perde o token nem conecta nada',async()=>{
  const v=await montar({descobrirFalha:true});v.abrir();await v.alterar('jira');
  v.tela.querySelector('#conexao-token').value='tk';
  await v.clicar('conexao-salvar');
  assert.match(textoDe(v.tela.querySelector('#qase-conexao-resultado')),/Não consegui procurar o seu Jira agora/);
  assert.equal(v.tela.querySelector('#conexao-token').value,'tk');
  assert.equal(v.chamadas.some(x=>x[0]==='adicionar'),false);
});
test('Jira: com site e e-mail já informados (ou de uma conexão anterior) vai direto, sem procurar',async()=>{
  const v=await montar();v.abrir();await v.alterar('jira');
  v.tela.querySelector('#conexao-instancia').value='https://empresa.atlassian.net/jira/software/projects/KAN/boards/1';
  v.tela.querySelector('#conexao-usuario').value='ana@empresa.com';v.tela.querySelector('#conexao-token').value='x';
  await v.clicar('conexao-salvar');
  assert.deepEqual(v.chamadas.map(x=>x[0]),['adicionar']);
  const dados=v.chamadas[0][1];
  assert.equal(dados.nome,'Jira · empresa');
  assert.equal(dados.instancia,'https://empresa.atlassian.net/jira/software/projects/KAN/boards/1','o backend normaliza o link para o site');
});
