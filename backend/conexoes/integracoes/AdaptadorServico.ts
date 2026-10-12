/** Conversa com um serviço (Jira, Qase ou GitHub): valida a conta, lista recursos e faz cada consulta da tela com o endereço certo. */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { parametrosDaUrl } from '../../compartilhado/texto/parametrosDaUrl.js';
import { enviarAoServico } from './enviarAoServico.js';
import { ErroServico } from './ErroServico.js';
import { instanciaServico } from './instanciaServico.js';
import { lerDetalheDoServico } from './lerDetalheDoServico.js';
import { lerDoServico } from './lerDoServico.js';
import { textoRemoto } from './textoRemoto.js';
import { ConfigServico, ContextoServico, OperacaoServico, itemQase, nome, obj, objetos, paginaQase, sid } from '../tipos/adaptador.js';
import { Filtros, OperacaoExtra, operacoesExtras } from '../tipos/leituras.js';
import { TransporteEscrita, TransporteServico, paginaSchema } from '../tipos/transporte.js';
import { Recurso, identidadeRecurso } from '../../projetos/tipos/espacos.js';
import { jqlDeTickets } from '../../tickets/integracoes/jqlDeTickets.js';

export class AdaptadorServico {
  constructor(readonly c:ConfigServico,readonly transporte:TransporteServico=lerDoServico,readonly escrita:TransporteEscrita=enviarAoServico){if(instanciaServico(c.servico,c.instancia)!==c.instancia)throw new ErroServico('SERVICE_DESTINATION_BLOCKED');}
  private async get(caminho:string):Promise<unknown>{
    if(!this.c.token)throw new ErroServico('CREDENTIAL_UNAVAILABLE');
    const headers=this.cabecalhos();
    try{return await this.transporte({servico:this.c.servico,instancia:this.c.instancia,caminho,headers});}catch(e){if(e instanceof ErroServico)throw e;throw new ErroServico('SERVICE_UNAVAILABLE');}
  }
  private cabecalhos():Record<string,string>{
    return this.c.servico==='jira'?{Authorization:'Basic '+Buffer.from(this.c.usuario+':'+this.c.token).toString('base64')}:this.c.servico==='github'?{Authorization:'Bearer '+this.c.token,'X-GitHub-Api-Version':'2022-11-28'}:{Token:this.c.token};
  }
  /** Contexto mínimo dos módulos de escrita (escritaJira/Qase/Github): a credencial nunca sai desta classe. Erros viram ErroServico. */
  contexto():ContextoServico{
    const c=this.c;
    return {
      servico:c.servico,instancia:c.instancia,
      ler:p=>this.get(p),
      enviar:async(metodo,caminho,corpo,tipoConteudo,extraHeaders)=>{
        if(!c.token)throw new ErroServico('CREDENTIAL_UNAVAILABLE');
        try{return await this.escrita({servico:c.servico,instancia:c.instancia,caminho,headers:{...this.cabecalhos(),...(extraHeaders??{})},corpo,metodo,tipoConteudo});}
        catch(e){if(e instanceof ErroServico)throw e;throw new ErroServico('SERVICE_UNAVAILABLE');}
      },
      limpar:v=>this.limpar(v)
    };
  }
  /** Única escrita do produto: um comentário em ticket do projeto vinculado. Confirma o projeto antes de enviar. */
  async publicarComentario(r:Recurso,ticket:string,adf:unknown):Promise<{id:string}>{
    if(this.c.servico!=='jira'||!this.c.token)throw new ErroServico('SERVICE_WRITE_BLOCKED');
    if(!/^[A-Z][A-Z0-9_]*-\d+$/.test(ticket))throw new ErroServico('SERVICE_RESPONSE_INVALID');
    await this.consultar(r,'ticket',{},ticket);
    let resposta:unknown;
    try{resposta=await this.escrita({servico:'jira',instancia:this.c.instancia,caminho:'/rest/api/3/issue/'+codificarParaUrl(ticket)+'/comment',headers:this.cabecalhos(),corpo:JSON.stringify({body:adf})});}
    catch(e){if(e instanceof ErroServico)throw e;throw new ErroServico('SERVICE_UNAVAILABLE');}
    try{return {id:z.string().regex(/^\d{1,20}$/).parse(obj.parse(resposta).id)};}catch{throw new ErroServico('SERVICE_RESPONSE_INVALID');}
  }
  /** Procura um marcador nos comentários do ticket (até 500), para não duplicar após falha de rede ambígua. */
  async procurarComentario(r:Recurso,ticket:string,marcador:string):Promise<string|null>{
    let offset=0;
    for(let i=0;i<5;i++){
      const pag=await this.consultar(r,'comentarios',{offset,limite:100},ticket);
      for(const c of pag.dados as Record<string,unknown>[]){if(textoRemoto(c.body).includes(marcador))return String(c.id);}
      if(typeof pag.proxima!=='number')return null;offset=pag.proxima;
    }
    return null;
  }
  private limpar(v:unknown):unknown {
    if(typeof v==='string')return mascarar(v.slice(0,20000),[this.c.token,Buffer.from((this.c.usuario??'')+':'+this.c.token).toString('base64')]);
    if(Array.isArray(v))return v.slice(0,100).map(x=>this.limpar(x));
    if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([k])=>!/(token|password|secret|authorization)/i.test(k)).slice(0,80).map(([k,x])=>[k,this.limpar(x)]));return v;
  }
  private recurso(v:unknown):Recurso{
    const o=obj.parse(v);const s=this.c.servico;
    const id=sid.parse(s==='qase'?o.code:o.id);const chave=nome.parse(s==='github'?o.full_name:s==='jira'?o.key:o.code);
    if(id===this.c.token||chave.includes(this.c.token)||!(s==='qase'?/^[A-Z][A-Z0-9]{1,9}$/.test(id):/^\d{1,20}$/.test(id))||!(s==='github'?/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(chave):/^[A-Z][A-Z0-9_]*$/.test(chave)))throw new ErroServico('SERVICE_RESPONSE_INVALID');
    return identidadeRecurso.parse({id,chave,nome:this.limpar(nome.parse(s==='github'?o.name:s==='jira'?o.name:o.title)),instancia:this.c.instancia,contaId:this.c.contaId,tipoId:s==='qase'?'codigo_api':'id_api'});
  }
  async autenticar(){
    try{
      if(this.c.servico==='jira'){const r=obj.parse(await this.get('/rest/api/3/myself'));const contaId=z.string().regex(/^[A-Za-z0-9:-]{1,128}$/).parse(r.accountId);if(contaId===this.c.token)throw new Error();return {contaId,nome:this.limpar(nome.parse(r.displayName)) as string};}
      if(this.c.servico==='github'){const r=obj.parse(await this.get('/user'));const contaId=sid.parse(r.id);if(!/^\d{1,20}$/.test(contaId)||contaId===this.c.token)throw new Error();return {contaId,nome:this.limpar(nome.parse(r.login)) as string};}
      // API v1 Qase não fornece /me nem ID de conta em Project. Não inventar principal remoto.
      paginaQase.parse(await this.get('/v1/project?limit=1&offset=0'));return {contaId:'conexao-local:'+this.c.id,nome:'Qase (escopo desta conexão; identidade da conta não retornada pela API v1)'};
    }catch(e){if(e instanceof ErroServico)throw e;throw new ErroServico('SERVICE_RESPONSE_INVALID');}
  }
  async listar(pagina:z.input<typeof paginaSchema>={}){
    const p=paginaSchema.parse(pagina);try{
      let entries:Record<string,unknown>[],total:number|undefined,next:string|number|null;
      if(this.c.servico==='jira'){const r=z.object({values:objetos,total:z.number().int().nonnegative(),isLast:z.boolean().optional()}).parse(await this.get('/rest/api/3/project/search?'+parametrosDaUrl({startAt:p.offset,maxResults:p.limite})));entries=r.values;total=r.total;next=p.offset+entries.length<total?p.offset+entries.length:null;}
      else if(this.c.servico==='qase'){const r=paginaQase.parse(await this.get('/v1/project?'+parametrosDaUrl({offset:p.offset,limit:p.limite})));entries=r.result.entities;total=r.result.filtered??r.result.total;next=p.offset+entries.length<total?p.offset+entries.length:null;}
      else {const r=objetos.parse(await this.get('/user/repos?'+parametrosDaUrl({per_page:p.limite,page:Math.floor(p.offset/p.limite)+1,sort:'full_name'})));entries=r;next=r.length===p.limite?p.offset+r.length:null;}
      return {recursos:entries.map(e=>this.recurso(e)),total,proxima:next,consultadoEm:new Date().toISOString(),cache:false,origem:this.c.instancia};
    }catch(e){if(e instanceof ErroServico)throw e;throw new ErroServico('SERVICE_RESPONSE_INVALID');}
  }
  async obterRecurso(id:string){
    try{const caminho=this.c.servico==='jira'?'/rest/api/3/project/'+codificarParaUrl(id):this.c.servico==='qase'?'/v1/project/'+codificarParaUrl(id):'/repositories/'+codificarParaUrl(id);
      const r=await this.get(caminho);return this.recurso(this.c.servico==='qase'?itemQase.parse(r).result:r);
    }catch(e){if(e instanceof ErroServico)throw e;throw new ErroServico('SERVICE_RESPONSE_INVALID');}
  }
  async consultar(r:Recurso,operacao:OperacaoServico,pagina:z.input<typeof paginaSchema>={},id?:string,campoAceite?:string,filtros?:Filtros){
    if(r.instancia!==this.c.instancia||r.contaId!==this.c.contaId)throw new ErroServico('SERVICE_SCOPE_CHANGED');const p=paginaSchema.parse(pagina);
    if((operacoesExtras as readonly string[]).includes(operacao)){try{const x=await lerDetalheDoServico(this.contexto(),r,operacao as OperacaoExtra,{offset:p.offset,limite:p.limite},id,filtros);return this.saida(x.dados,x.proxima,r,x.endpoint);}catch(e){if(e instanceof ErroServico)throw e;throw new ErroServico('SERVICE_RESPONSE_INVALID');}}
    if(this.c.servico!=='qase'&&!/^\d{1,20}$/.test(r.id))throw new ErroServico('SERVICE_RESPONSE_INVALID');
    if(campoAceite&&!/^customfield_\d+$/.test(campoAceite))throw new ErroServico('SERVICE_RESPONSE_INVALID');
    let endpoint:string;let colecao:string|undefined;let envelope='';
    const numerico=()=>{if(!id||!/^\d{1,15}$/.test(id))throw new ErroServico('SERVICE_RESPONSE_INVALID');return codificarParaUrl(id);};
    if(this.c.servico==='jira'){
      const fields='id,key,summary,description,issuetype,status,priority,assignee,reporter,labels,created,parent,subtasks,updated,issuelinks,project'+(campoAceite?','+campoAceite:'');
      if(operacao==='tickets'){endpoint='/rest/api/3/search/jql?'+parametrosDaUrl({jql:jqlDeTickets(r.id,filtros),fields,maxResults:p.limite,nextPageToken:p.cursor});colecao='issues';envelope='jira-cursor';}
      else if(operacao==='campos'){endpoint='/rest/api/3/field';envelope='array';}
      else if(operacao==='ticket'||operacao==='comentarios'){
        if(!id||!/^[A-Z][A-Z0-9_]*-\d+$/.test(id))throw new ErroServico('SERVICE_RESPONSE_INVALID');
        const detalhe=obj.parse(await this.get('/rest/api/3/issue/'+codificarParaUrl(id)+'?'+parametrosDaUrl({fields})));
        if(String((obj.parse(detalhe.fields).project as {id?:unknown})?.id)!==r.id)throw new ErroServico('SERVICE_SCOPE_CHANGED');
        if(operacao==='ticket')return this.saida(detalhe,undefined,r,'/rest/api/3/issue/'+codificarParaUrl(id));
        endpoint='/rest/api/3/issue/'+codificarParaUrl(id)+'/comment?'+parametrosDaUrl({startAt:p.offset,maxResults:p.limite});colecao='comments';envelope='jira-offset';
      }else throw new ErroServico('SERVICE_WRITE_BLOCKED');
    }else if(this.c.servico==='qase'){
      if(!/^[A-Z][A-Z0-9]{1,9}$/.test(r.chave)||r.id!==r.chave)throw new ErroServico('SERVICE_SCOPE_CHANGED');
      const mapa:Partial<Record<OperacaoServico,string>>={defeitos:'defect',defeito:'defect',suites:'suite',casos:'case',caso:'case',planos:'plan',runs:'run',run:'run',resultados:'result'};
      const tipo=mapa[operacao];if(!tipo)throw new ErroServico('SERVICE_WRITE_BLOCKED');
      const detalhe=operacao==='caso'||operacao==='run'||operacao==='defeito';
      const statusDefeito=operacao==='defeitos'&&filtros?.status?z.enum(['open','resolved','in_progress','invalid']).safeParse(filtros.status):null;
      if(statusDefeito&&!statusDefeito.success)throw new ErroServico('SERVICE_RESPONSE_INVALID');
      endpoint='/v1/'+tipo+'/'+codificarParaUrl(r.chave)+(detalhe?'/'+numerico():'')+'?'+parametrosDaUrl({offset:detalhe?undefined:p.offset,limit:detalhe?undefined:p.limite,status:statusDefeito?.success?statusDefeito.data:undefined,include:operacao==='casos'||operacao==='caso'?'external_issues':undefined,run:operacao==='resultados'&&id?numerico():undefined});envelope=detalhe?'qase-item':'qase-page';
    }else{
      const repo='/repos/'+r.chave.split('/').map(codificarParaUrl).join('/');const mapa:Partial<Record<OperacaoServico,string>>={repositorio:'',branches:'/branches',commits:'/commits',prs:'/pulls',pr:'/pulls/'+(id??'')};
      if(operacao==='verificacoes'){if(!id||!/^[a-f0-9]{40}$/.test(id))throw new ErroServico('SERVICE_RESPONSE_INVALID');endpoint=repo+'/commits/'+id+'/check-runs?'+parametrosDaUrl({per_page:p.limite,page:Math.floor(p.offset/p.limite)+1});colecao='check_runs';envelope='github-checks';}
      else {if(!(operacao in mapa))throw new ErroServico('SERVICE_WRITE_BLOCKED');if(operacao==='pr')numerico();endpoint=repo+mapa[operacao]+'?'+parametrosDaUrl({per_page:p.limite,page:Math.floor(p.offset/p.limite)+1,state:operacao==='prs'?'all':undefined});envelope=operacao==='repositorio'||operacao==='pr'?'object':'array';}
    }
    try{
      const bruto=await this.get(endpoint);let dados:unknown;let proxima:string|number|null=null;
      if(envelope==='qase-page'){const b=paginaQase.parse(bruto);dados=b.result.entities;proxima=p.offset+b.result.entities.length<(b.result.filtered??b.result.total)?p.offset+b.result.entities.length:null;}
      else if(envelope==='qase-item')dados=itemQase.parse(bruto).result;
      else if(envelope==='array'){dados=(operacao==='campos'?z.array(obj).max(1000):objetos).parse(bruto);if(this.c.servico==='github'&&(dados as unknown[]).length===p.limite)proxima=p.offset+p.limite;}
      else if(envelope==='object')dados=obj.parse(bruto);
      else {const b=obj.parse(bruto);dados=objetos.parse(b[colecao!]);if(envelope==='jira-cursor'){if(b.isLast!==true){if(typeof b.nextPageToken!=='string')throw new Error();proxima=b.nextPageToken;}}else {const total=z.number().int().nonnegative().parse(b.total??b.total_count);proxima=p.offset+(dados as unknown[]).length<total?p.offset+(dados as unknown[]).length:null;}}
      if(operacao==='tickets')for(const issue of dados as Record<string,unknown>[]){const f=obj.parse(issue.fields);if(String(obj.parse(f.project).id)!==r.id)throw new ErroServico('SERVICE_SCOPE_CHANGED');}
      if((operacao==='caso'||operacao==='defeito')&&String(obj.parse(dados).id)!==id)throw new ErroServico('SERVICE_SCOPE_CHANGED');
      if(operacao==='defeitos'||operacao==='defeito'){
        const defect=z.object({id:z.number().int().positive().safe(),title:nome,actual_result:z.string().optional(),severity:z.string().optional(),status:z.string().optional(),milestone_id:z.number().int().nullable().optional(),author_id:z.number().int().optional(),created_at:z.string().optional(),updated_at:z.string().optional(),created:z.string().optional(),updated:z.string().optional(),resolved_at:z.string().nullable().optional(),runs:z.array(z.number().int().positive()).max(100).optional(),results:z.array(z.string()).max(100).optional(),attachments:z.array(obj).max(100).optional(),tags:z.array(obj).max(100).optional(),external_data:z.string().optional()});
        dados=Array.isArray(dados)?dados.map(d=>defect.parse(d)):defect.parse(dados);
      }
      if(operacao==='repositorio'&&String(obj.parse(dados).id)!==r.id)throw new ErroServico('SERVICE_SCOPE_CHANGED');
      return this.saida(dados,proxima,r,endpoint);
    }catch(e){if(e instanceof ErroServico)throw e;throw new ErroServico('SERVICE_RESPONSE_INVALID');}
  }
  private saida(dados:unknown,proxima:string|number|null|undefined,r:Recurso,endpoint:string){return {dados:Array.isArray(dados)&&endpoint==='/rest/api/3/field'?dados.map(x=>this.limpar(x)):this.limpar(dados),proxima:proxima??null,servico:this.c.servico,origem:this.c.instancia,recursoId:r.id,consultadoEm:new Date().toISOString(),cache:false,endpoint:endpoint.split('?')[0],metodo:'GET',limitesExibicao:'Detalhes: textos até 20000 caracteres, listas internas até 100 itens e objetos até 80 campos; chaves sensíveis removidas. A resposta integral não é armazenada.',interpretacao:'Informação externa consultada; não é requisito aprovado nem cobertura verificada.'};}
}
