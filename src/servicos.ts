import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {lerLocal,gravarLocal} from './armazenamentoLocal.js';
import {servicoSchema,obterEspaco,listarEspacos,gravarVinculo,estadoVinculo,registrarConsulta,configurarAceite,type Servico,type Recurso} from './espacos.js';
import {cofreCredenciais,type Protetor} from './credenciais.js';
import {AdaptadorServico,type OperacaoServico} from './adaptadoresServicos.js';
import {ErroServico,instanciaServico,paginaSchema,transporteHttps,transporteEscritaJira,type TransporteServico,type TransporteEscrita} from './httpServicos.js';
import {mascarar} from './projeto.js';

export const conexaoEntrada=z.object({servico:servicoSchema,nome:z.string().trim().min(1).max(100),instancia:z.string().max(300).optional(),usuario:z.string().email().max(200).optional(),token:z.string().min(1).max(6000).regex(/^[^\x00-\x1f]+$/)}).strict();
const contaSchema=z.object({id:z.string().uuid(),servico:servicoSchema,nome:z.string().max(100),instancia:z.string().url(),usuario:z.string().max(200).optional(),contaId:z.string().min(1).max(200),identidade:z.string().max(200),criadaEm:z.string().datetime(),validadaEm:z.string().datetime(),ativa:z.boolean()}).strict();
type Conta=z.infer<typeof contaSchema>;
const registro=z.object({version:z.literal(1),contas:z.array(contaSchema).max(100)}).strict();
const ler=(base?:string)=>lerLocal('contas.json',registro,{version:1,contas:[]},base);
export const listarContas=(base?:string)=>ler(base).contas;
/** Dependências só do processo principal. Testes fornecem doubles; nenhum toggle em produção. */
export function nucleoServicos(protetor:Protetor,transporte:TransporteServico=transporteHttps,base?:string,escrita:TransporteEscrita=transporteEscritaJira){
  const cofre=cofreCredenciais(protetor,base);
  const conta=(id:string)=>{const c=ler(base).contas.find(c=>c.id===id&&c.ativa);if(!c)throw new ErroServico('CREDENTIAL_UNAVAILABLE');return c;};
  const adaptador=(c:Conta)=>new AdaptadorServico({...c,token:cofre.ler(c.id)},transporte,escrita);
  const estadoErro=(e:unknown)=>e instanceof ErroServico?(e.codigo==='SERVICE_PERMISSION'?'SEM_PERMISSAO':e.codigo==='CREDENTIAL_INVALID_OR_EXPIRED'||e.codigo==='CREDENTIAL_UNAVAILABLE'?'SEM_CREDENCIAL':e.codigo==='SERVICE_NOT_FOUND'||e.codigo==='SERVICE_SCOPE_CHANGED'?'DESATUALIZADO':'INDISPONIVEL'):'INDISPONIVEL';
  const codigoErro=(e:unknown)=>e instanceof ErroServico?e.codigo:'CREDENTIAL_UNAVAILABLE';
  const vinculo=(espacoId:string,servico:Servico)=>{const v=obterEspaco(espacoId,base).vinculos.find(v=>v.servico===servico);if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');return v;};
  const verificar=async(espacoId:string,servico:Servico,aceitarAlteracao=false)=>{
    const v=vinculo(espacoId,servico);
    try{const c=conta(v.conexaoId);const a=adaptador(c);const principal=await a.autenticar();if(principal.contaId!==c.contaId)throw new ErroServico('SERVICE_SCOPE_CHANGED');
      const atual=await a.obterRecurso(v.recurso.id);if(atual.id!==v.recurso.id||atual.contaId!==v.recurso.contaId||(!aceitarAlteracao&&atual.chave!==v.recurso.chave))throw new ErroServico('SERVICE_SCOPE_CHANGED');
      estadoVinculo(espacoId,servico,'VALIDO',undefined,atual,base);return {adaptador:a,recurso:atual,campoAceite:v.campoAceite};
    }catch(e){estadoVinculo(espacoId,servico,estadoErro(e),codigoErro(e),undefined,base);throw e;}
  };
  return {
    contas:()=>listarContas(base),
    async adicionar(entrada:z.input<typeof conexaoEntrada>){
      const d=conexaoEntrada.parse(entrada);if(!protetor.disponivel())throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE');if(d.servico==='jira'&&!d.usuario)throw new Error('JIRA_EMAIL_REQUIRED');
      const id=randomUUID();const instancia=instanciaServico(d.servico,d.instancia);const a=new AdaptadorServico({id,servico:d.servico,instancia,usuario:d.usuario,contaId:'pendente',token:d.token},transporte);const identidade=await a.autenticar();
      const r=ler(base);if(r.contas.length>=100)throw new Error('CONNECTION_LIMIT');
      if(d.servico!=='qase'&&r.contas.some(c=>c.ativa&&c.servico===d.servico&&c.instancia===instancia&&c.contaId===identidade.contaId))throw new Error('CONNECTION_DUPLICATE');
      if(d.servico==='qase'&&r.contas.some(c=>{if(!c.ativa||c.servico!=='qase')return false;try{return cofre.ler(c.id)===d.token;}catch{return false;}}))throw new Error('CONNECTION_DUPLICATE');
      const c=contaSchema.parse({id,servico:d.servico,nome:mascarar(d.nome,[d.token]),instancia,usuario:d.usuario,contaId:identidade.contaId,identidade:identidade.nome,criadaEm:new Date().toISOString(),validadaEm:new Date().toISOString(),ativa:true});
      cofre.salvar(id,d.token);try{r.contas.push(c);gravarLocal('contas.json',r,base);}catch(e){cofre.remover(id);throw e;}return c;
    },
    async validarConta(id:string){const c=conta(id);const atual=await adaptador(c).autenticar();if(atual.contaId!==c.contaId)throw new ErroServico('SERVICE_SCOPE_CHANGED');const r=ler(base);r.contas.find(x=>x.id===id)!.validadaEm=new Date().toISOString();gravarLocal('contas.json',r,base);return conta(id);},
    removerConta(id:string){const r=ler(base);const c=r.contas.find(c=>c.id===id);if(!c)throw new Error('CONNECTION_NOT_FOUND');c.ativa=false;gravarLocal('contas.json',r,base);cofre.remover(id);
      for(const e of listarEspacos(base))for(const v of e.vinculos)if(v.conexaoId===id)estadoVinculo(e.id,v.servico,'SEM_CREDENCIAL','CREDENTIAL_UNAVAILABLE',undefined,base);return {removida:true};},
    async listar(id:string,pagina:z.input<typeof paginaSchema>={}){const c=conta(id);return adaptador(c).listar(pagina);},
    async vincular(espacoId:string,conexaoId:string,recurso:Recurso){obterEspaco(espacoId,base);const c=conta(conexaoId);const a=adaptador(c);const atual=await a.obterRecurso(recurso.id);
      if(JSON.stringify(atual)!==JSON.stringify(recurso))throw new ErroServico('SERVICE_SCOPE_CHANGED');return gravarVinculo(espacoId,c.servico,c.id,atual,base);},
    async validarVinculo(espacoId:string,servico:Servico){await verificar(espacoId,servico,true);return obterEspaco(espacoId,base);},
    async consultar(espacoId:string,servico:Servico,operacao:OperacaoServico,pagina:z.input<typeof paginaSchema>={},id?:string){
      try{const v=await verificar(espacoId,servico);const r=await v.adaptador.consultar(v.recurso,operacao,pagina,id,v.campoAceite);registrarConsulta(espacoId,servico,'OK',base);return r;}
      catch(e){registrarConsulta(espacoId,servico,codigoErro(e),base);throw e;}
    },
    /** Escrita controlada (2.8): só comentário Jira, depois de revalidar conta, vínculo e projeto. */
    async comentarJira(espacoId:string,ticket:string,adf:unknown){try{const v=await verificar(espacoId,'jira');const r=await v.adaptador.publicarComentario(v.recurso,ticket,adf);registrarConsulta(espacoId,'jira','COMMENT_OK',base);return {...r,vinculoId:vinculo(espacoId,'jira').id,conexaoId:vinculo(espacoId,'jira').conexaoId};}catch(e){registrarConsulta(espacoId,'jira',codigoErro(e),base);throw e;}},
    async procurarComentarioJira(espacoId:string,ticket:string,marcador:string){const v=await verificar(espacoId,'jira');return v.adaptador.procurarComentario(v.recurso,ticket,marcador);},
    async campoAceite(espacoId:string,campo:string){const v=await verificar(espacoId,'jira');const r=await v.adaptador.consultar(v.recurso,'campos');if(!Array.isArray(r.dados)||!r.dados.some(x=>x.id===campo&&x.custom===true))throw new Error('JIRA_FIELD_NOT_AVAILABLE');return configurarAceite(espacoId,campo,base);}
  };
}
