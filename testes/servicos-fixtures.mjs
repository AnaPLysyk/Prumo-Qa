import http from 'node:http';
// Dados fictícios, sem credenciais de serviço. Servidor existe somente nos testes.
export const jiraProjetos=[{id:'11',key:'SMART',name:'JiraSMART'},{id:'22',key:'CID',name:'CID'}];
export const qaseProjetos=[{code:'SFQ',title:'QaseSFQ'},{code:'CQA',title:'CID-QA'}];
export const githubRepos=[{id:111,full_name:'empresa/automacao-smart',name:'automacao-smart'},{id:222,full_name:'empresa/automacao-cid',name:'automacao-cid'}];
export function respostaFixture(host,caminho){
  const u=new URL(caminho,'http://fixture.test');const p=u.pathname,q=u.searchParams;
  const pagina=entities=>({status:true,result:{total:entities.length,filtered:entities.length,entities:entities.slice(Number(q.get('offset')||0),Number(q.get('offset')||0)+Number(q.get('limit')||50))}});
  if(host.endsWith('.atlassian.net')){
    if(p==='/rest/api/3/myself')return {accountId:'jira-conta-lab',displayName:'Conta Jira simulada'};
    if(p==='/rest/api/3/project/search')return {values:jiraProjetos.slice(Number(q.get('startAt')||0),Number(q.get('startAt')||0)+Number(q.get('maxResults')||50)),total:2};
    if(p.startsWith('/rest/api/3/project/'))return jiraProjetos.find(x=>x.id===p.split('/').at(-1));
    if(p==='/rest/api/3/field')return [{id:'customfield_10020',name:'Aceite de laboratório',custom:true},{id:'summary',name:'Resumo',custom:false}];
    const ticket=key=>{const projeto=key.startsWith('CID-')?jiraProjetos[1]:jiraProjetos[0];return {id:projeto.id+'01',key,fields:{project:{id:projeto.id},summary:'Requisito fictício '+key,description:'Apenas Editor grava. Documento de laboratório; não é requisito de cliente.',issuetype:{name:'Story'},status:{name:'Aberto'},priority:{name:'Média'},assignee:{displayName:'Pessoa fictícia'},updated:'2026-10-10T12:00:00.000Z',customfield_10020:'Editor persiste; Leitor é recusado.',issuelinks:[]}};};
    if(p==='/rest/api/3/search/jql'){const key=q.get('jql')?.includes('project = 22')?'CID-1':'SMART-1';return {issues:[ticket(key)],isLast:true};}
    if(p.startsWith('/rest/api/3/issue/')){const key=p.split('/')[5];if(p.endsWith('/comment'))return {comments:[{id:'501',body:'Comentário fictício',updated:'2026-10-10T12:00:00Z'}],total:1};return ticket(key);}
  }
  if(host==='api.qase.io'){
    if(p==='/v1/project')return pagina(qaseProjetos);
    const [,v,tipo,code,id]=p.split('/');if(v!=='v1')return undefined;
    const projeto=qaseProjetos.find(x=>x.code===code);if(!projeto)return undefined;
    if(tipo==='project')return {status:true,result:projeto};
    const caso={id:code==='SFQ'?31:41,title:'Caso fictício '+code,automation:0,isManual:true,isToBeAutomated:false,steps:[{position:1,action:'Entrar como Editor fictício',expected_result:'Gravação persistida no ambiente isolado',data:'Fixture'}],external_issues:code==='SFQ'?[{type:'jira',issues:[{id:'SMART-1',link:'https://lab.atlassian.net/browse/SMART-1'}]}]:[]};
    const run={id:71,title:'Run fictício '+code,status:2};
    const entidades={suite:[{id:1,title:'Suite '+code}],case:[caso],plan:[{id:61,title:'Plano '+code}],run:[run],result:[{hash:'resultado-lab-'+code,run_id:71,case_id:caso.id,status:'passed',is_api_result:false,time_spent_ms:100,end_time:'2026-10-10T12:00:00Z',attachments:[]}]};
    const itens=entidades[tipo];if(!itens)return undefined;if(id){const item=itens.find(x=>String(x.id)===id);return item?{status:true,result:item}:undefined;}return pagina(itens);
  }
  if(host==='api.github.com'){
    if(p==='/user')return {id:900,login:'conta-lab'};
    if(p==='/user/repos'){const page=Number(q.get('page')||1),n=Number(q.get('per_page')||50);return githubRepos.slice((page-1)*n,page*n);}
    if(p.startsWith('/repositories/'))return githubRepos.find(x=>String(x.id)===p.split('/').at(-1));
    const repo=githubRepos.find(x=>p.startsWith('/repos/'+x.full_name));if(!repo)return undefined;const sufixo=p.slice(('/repos/'+repo.full_name).length);
    if(!sufixo)return {...repo,private:true,default_branch:'main'};
    if(sufixo==='/branches')return [{name:'main',commit:{sha:'a'.repeat(40)},protected:true}];
    if(sufixo==='/commits')return [{sha:'a'.repeat(40),commit:{message:'Commit fictício'}}];
    if(sufixo==='/pulls')return [{number:1,title:'PR fictício '+repo.name,state:'open',base:{repo:{id:repo.id}}}];
    if(sufixo==='/pulls/1')return {number:1,title:'PR fictício '+repo.name,state:'open'};
    if(sufixo.endsWith('/check-runs'))return {total_count:1,check_runs:[{id:81,name:'unit-fixture',status:'completed',conclusion:'success',head_sha:'a'.repeat(40)}]};
  }
}
export async function servidorFixture(t){
  const pedidos=[];const comentarios=[];const controle={status:200,corpo:null,espera:0,contentType:'application/json',postStatus:201,perderResposta:false};
  const server=http.createServer((req,res)=>{
    // 2.8: único POST aceito é o comentário de resultado em um ticket (fixture do Jira); o resto segue somente leitura.
    if(req.method==='POST'){let corpo='';req.on('data',b=>{corpo+=b;});req.on('end',()=>{
      const ok=/^\/rest\/api\/3\/issue\/[A-Z][A-Z0-9_]*-\d+\/comment$/.test(req.url??'');pedidos.push({metodo:'POST',caminho:req.url,host:req.headers['x-fixture-host'],corpo});
      if(!ok){res.writeHead(405,{'content-type':'application/json'});res.end('{}');return;}
      if(controle.postStatus!==201){res.writeHead(controle.postStatus,{'content-type':'application/json'});res.end('{}');return;}
      const id=String(700+comentarios.length);comentarios.push({id,body:JSON.parse(corpo).body,ticket:req.url.split('/')[5]});
      if(controle.perderResposta){controle.perderResposta=false;req.socket.destroy();return;}
      res.writeHead(201,{'content-type':'application/json'});res.end(JSON.stringify({id}));});return;}
    pedidos.push({metodo:req.method,caminho:req.url,host:req.headers['x-fixture-host']});
    if(req.method==='GET'&&/^\/rest\/api\/3\/issue\/[A-Z][A-Z0-9_]*-\d+\/comment$/.test(String(req.url).split('?')[0])&&!controle.corpo){
      const t=String(req.url).split('/')[5];const todos=[{id:'501',body:'Comentário fictício'},...comentarios.filter(c=>c.ticket===t)];res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({comments:todos,total:todos.length}));return;}
    const enviar=()=>{res.writeHead(controle.status,{'content-type':controle.contentType,...(controle.status===302?{location:'http://127.0.0.1/nao-seguir'}:{})});
      const r=controle.corpo??respostaFixture(String(req.headers['x-fixture-host']),req.url);res.end(typeof r==='string'?r:JSON.stringify(r??{fixture:'não encontrado'}));};
    if(controle.espera)setTimeout(enviar,controle.espera);else enviar();
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const fechar=()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});if(t)t.after(fechar);
  return {port:server.address().port,pedidos,comentarios,controle,fechar};
}
/** Instrumentação do runner; nunca importada pelo app ou distribuída. */
export async function instalarTransporteControlado(port){
  const https=(await import('node:https')).default;const http=(await import('node:http')).default;
  const dns=(await import('node:dns')).default;const {syncBuiltinESMExports}=await import('node:module');
  const anteriorHttps=https.request,anteriorDns=dns.promises.lookup;
  dns.promises.lookup=async()=>({address:'93.184.216.34',family:4});
  https.request=(url,opcoes,callback)=>http.request({hostname:'127.0.0.1',port,path:url.pathname+url.search,method:opcoes.method,headers:{...opcoes.headers,'x-fixture-host':url.hostname}},callback);
  syncBuiltinESMExports();
  return ()=>{https.request=anteriorHttps;dns.promises.lookup=anteriorDns;syncBuiltinESMExports();};
}
