import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {diretorioDados,semLinks} from './atividades.js';
import {adicionarVinculo,situacaoProjeto} from './vinculos.js';
import {lerLocal,gravarLocal} from './armazenamentoLocal.js';

export const servicos=['jira','qase','github'] as const;
export const servicoSchema=z.enum(servicos);
export type Servico=z.infer<typeof servicoSchema>;
export const identidadeRecurso=z.object({id:z.string().min(1).max(100),chave:z.string().min(1).max(200),nome:z.string().min(1).max(200),instancia:z.string().url().max(300),contaId:z.string().min(1).max(200),tipoId:z.enum(['id_api','codigo_api'])}).strict();
export type Recurso=z.infer<typeof identidadeRecurso>;
const vinculoSchema=z.object({id:z.string().uuid(),servico:servicoSchema,conexaoId:z.string().uuid(),recurso:identidadeRecurso,validadoEm:z.string().datetime(),estado:z.enum(['VALIDO','INDISPONIVEL','SEM_PERMISSAO','DESATUALIZADO','SEM_CREDENCIAL']),campoAceite:z.string().regex(/^customfield_\d+$/).optional()}).strict();
export const dadosEspaco=z.object({nome:z.string().trim().min(1).max(200),descricao:z.string().max(1000).default('')}).strict();
const referencia=z.object({tipo:z.enum(['jira','qase','contexto','automacao','execucao','evidencia']),id:z.string().min(1).max(200),vinculoId:z.string().uuid().optional(),origem:z.string().min(1).max(500)}).strict();
export const associacaoSchema=z.object({de:referencia,para:referencia,justificativa:z.string().trim().min(1).max(1000)}).strict();
const evento=z.object({at:z.string().datetime(),acao:z.enum(['CRIADO','EDITADO','PASTA','VINCULADO','REMOVIDO','VALIDACAO','ASSOCIADO','CONSULTA']),servico:servicoSchema.optional(),vinculoId:z.string().uuid().optional(),codigo:z.string().regex(/^[A-Z_]+$/).optional()}).strict();
const espacoSchema=z.object({id:z.string().uuid(),nome:z.string().max(200),descricao:z.string().max(1000),criadoEm:z.string().datetime(),pastaLocal:z.string().max(1000).optional(),raizContextos:z.string().max(1000),vinculos:z.array(vinculoSchema).max(3),relacoes:z.array(associacaoSchema.extend({id:z.string().uuid(),at:z.string().datetime(),estado:z.literal('VINCULADO'),origemRegistro:z.literal('DECLARADO_PELO_USUARIO')})).max(500),historico:z.array(evento).max(1000)}).strict();
export type Espaco=z.infer<typeof espacoSchema>;
const registro=z.object({version:z.literal(1),espacos:z.array(espacoSchema).max(200)}).strict();
const ler=(base?:string)=>lerLocal('espacos.json',registro,{version:1,espacos:[]},base);
const gravar=(r:z.infer<typeof registro>,base?:string)=>gravarLocal('espacos.json',registro.parse(r),base);
export const listarEspacos=(base?:string)=>ler(base).espacos;
export function obterEspaco(id:string,base?:string){const e=listarEspacos(base).find(e=>e.id===id);if(!e)throw new Error('WORKSPACE_NOT_FOUND');return e;}
function atualizar(id:string,fn:(e:Espaco)=>void,base?:string){const r=ler(base);const e=r.espacos.find(e=>e.id===id);if(!e)throw new Error('WORKSPACE_NOT_FOUND');fn(e);gravar(r,base);return e;}
export function eventoEspaco(e:Espaco,acao:z.infer<typeof evento>['acao'],extra:Partial<z.infer<typeof evento>>={}){e.historico.push(evento.parse({at:new Date().toISOString(),acao,...extra}));e.historico=e.historico.slice(-1000);}
export async function criarEspaco(dados:z.input<typeof dadosEspaco>,base?:string){
  const d=dadosEspaco.parse(dados);const r=ler(base);if(r.espacos.length>=200)throw new Error('WORKSPACE_LIMIT');
  const id=randomUUID();let raiz=path.join(diretorioDados(base),'espacos',id);semLinks(raiz);
  fs.mkdirSync(raiz,{recursive:true,mode:0o700});raiz=fs.realpathSync(raiz);
  fs.writeFileSync(path.join(raiz,'qa.project.json'),JSON.stringify({schemaVersion:2,id:'prumo-'+id,name:d.nome,context:{documentation:[],tests:[],code:[]},commands:{},execution:{requireApproval:true,readOnly:true,blockedByDefault:[],environment:'host'}}),{flag:'wx',mode:0o600});
  await adicionarVinculo(raiz,base);
  const atual=ler(base);if(atual.espacos.length>=200)throw new Error('WORKSPACE_LIMIT');
  const e:Espaco={id,...d,criadoEm:new Date().toISOString(),raizContextos:raiz,vinculos:[],relacoes:[],historico:[]};eventoEspaco(e,'CRIADO');atual.espacos.push(e);gravar(atual,base);return e;
}
export function editarEspaco(id:string,dados:z.input<typeof dadosEspaco>,base?:string){const d=dadosEspaco.parse(dados);return atualizar(id,e=>{e.nome=d.nome;e.descricao=d.descricao;eventoEspaco(e,'EDITADO');},base);}
export async function pastaEspaco(id:string,raiz:string,base?:string){
  obterEspaco(id,base);const s=await situacaoProjeto(raiz);if(s.state!=='INTEGRADO')throw new Error('WORKSPACE_LOCAL_CONTRACT_INVALID');
  const outra=listarEspacos(base).find(e=>e.id!==id&&e.pastaLocal?.toLowerCase()===s.root.toLowerCase());if(outra)throw new Error('WORKSPACE_LOCAL_DUPLICATE');
  await adicionarVinculo(s.root,base);return atualizar(id,e=>{e.pastaLocal=s.root;eventoEspaco(e,'PASTA');},base);
}
/** Seleção da lista não é confiança: o adaptador revalida o recurso antes de chamar esta função. */
export function gravarVinculo(id:string,servico:Servico,conexaoId:string,recurso:Recurso,base?:string){
  return atualizar(id,e=>{const antigo=e.vinculos.find(v=>v.servico===servico);if(antigo)throw new Error('WORKSPACE_LINK_EXISTS');
    const v=vinculoSchema.parse({id:randomUUID(),servico,conexaoId,recurso,validadoEm:new Date().toISOString(),estado:'VALIDO'});e.vinculos.push(v);eventoEspaco(e,'VINCULADO',{servico,vinculoId:v.id});},base);
}
export function removerVinculoServico(id:string,servico:Servico,base?:string){return atualizar(id,e=>{const v=e.vinculos.find(v=>v.servico===servico);if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');e.vinculos=e.vinculos.filter(v=>v.servico!==servico);eventoEspaco(e,'REMOVIDO',{servico,vinculoId:v.id});},base);}
export function estadoVinculo(id:string,servico:Servico,estado:z.infer<typeof vinculoSchema>['estado'],codigo?:string,recurso?:Recurso,base?:string){return atualizar(id,e=>{const v=e.vinculos.find(v=>v.servico===servico);if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');v.estado=estado;if(estado==='VALIDO')v.validadoEm=new Date().toISOString();if(recurso)v.recurso=recurso;eventoEspaco(e,'VALIDACAO',{servico,vinculoId:v.id,...(codigo?{codigo}:{})});},base);}
export function configurarAceite(id:string,campo:string,base?:string){return atualizar(id,e=>{const v=e.vinculos.find(v=>v.servico==='jira');if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');v.campoAceite=z.string().regex(/^customfield_\d+$/).parse(campo);eventoEspaco(e,'EDITADO',{servico:'jira',vinculoId:v.id});},base);}
export function registrarConsulta(id:string,servico:Servico,codigo:string,base?:string){return atualizar(id,e=>eventoEspaco(e,'CONSULTA',{servico,codigo}),base);}
export function associarEspaco(id:string,dados:z.input<typeof associacaoSchema>,base?:string){const d=associacaoSchema.parse(dados);return atualizar(id,e=>{
  for(const ref of[d.de,d.para])if(ref.tipo==='jira'||ref.tipo==='qase'){if(!ref.vinculoId||!e.vinculos.some(v=>v.id===ref.vinculoId&&v.servico===ref.tipo))throw new Error('TRACE_LINK_SCOPE');}
  if(e.relacoes.some(r=>JSON.stringify(r.de)===JSON.stringify(d.de)&&JSON.stringify(r.para)===JSON.stringify(d.para)))throw new Error('TRACE_DUPLICATE');
  e.relacoes.push({...d,id:randomUUID(),at:new Date().toISOString(),estado:'VINCULADO',origemRegistro:'DECLARADO_PELO_USUARIO'});eventoEspaco(e,'ASSOCIADO');},base);}
