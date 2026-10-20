/** Devolve o endereço oficial do serviço (Qase e GitHub fixos; Jira só *.atlassian.net). */
import { ErroServico } from './ErroServico.js';
import { Servico } from '../../projetos/contratos.js';

export function instanciaServico(servico:Servico,valor?:string){
  if(servico==='github')return 'https://api.github.com';if(servico==='qase')return 'https://api.qase.io';
  let u:URL;try{u=new URL(valor??'');}catch{throw new ErroServico('SERVICE_DESTINATION_BLOCKED');}
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.pathname!=='/'||u.search||u.hash||!/^([a-z0-9][a-z0-9-]{0,62})\.atlassian\.net$/.test(u.hostname))throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  return u.origin;
}
