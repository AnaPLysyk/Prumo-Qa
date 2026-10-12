/** Consulta no GitHub, a pedido, o estado de uma issue oficial do Prumo (rótulos e eventos), sem credencial. */
import { z } from 'zod';
import { repositorio } from '../../ajuda/tipos/versoes.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { buscarDadosDoChamado } from './buscarDadosDoChamado.js';
import { eventoSchema, issueSchema, numeroChamado, statusChamados } from '../tipos/suporte.js';

/** Consulta pública explícita. Nada do projeto é enviado; URLs são reconstruídas e não há credencial nem redirecionamento. */
export async function consultarChamado(numero: number, buscar:typeof fetch=fetch) {
  numeroChamado.parse(numero);
  const url=`https://github.com/${repositorio}/issues/${numero}`;
  try {
    const issue=issueSchema.parse(await buscarDadosDoChamado(numero,'',buscar));
    if(issue.number!==numero||issue.pull_request)throw new Error('SUPPORT_INVALID');
    const estados=statusChamados.filter(s=>issue.labels.some(l=>l.name===s.rotulo));
    let history:{event:string;at:string;actor:string|null;status:string}[]=[];let historyComplete=false;
    try {
      const eventos=z.array(eventoSchema).max(100).parse(await buscarDadosDoChamado(numero,'/events?per_page=100',buscar));
      history=eventos.filter(e=>['labeled','unlabeled'].includes(e.event)&&statusChamados.some(s=>s.rotulo===e.label?.name)).map(e=>({event:e.event,at:e.created_at,actor:e.actor?.login??null,status:statusChamados.find(s=>s.rotulo===e.label?.name)!.nome}));
      historyComplete=eventos.length<100;
    } catch { /* A issue continua consultável; histórico parcial é declarado. */ }
    return {ok:true as const,numero,url,title:mascarar(issue.title),githubState:issue.state,author:issue.user?.login??null,responsible:issue.assignees.map(a=>a.login),updatedAt:issue.updated_at,
      status:estados.length===1?estados[0]:null,statusAt:estados.length===1?history.filter(e=>e.event==='labeled'&&e.status===estados[0]!.nome).at(-1)?.at??null:null,ambiguous:estados.length>1,history,historyComplete,
      notice:'Status vem dos rótulos reais do GitHub. Fechar uma issue não comprova correção publicada; consulte os comentários e a release indicada. Histórico limitado a 100 eventos.'};
  } catch(e) {return {ok:false as const,numero,url,code:(e as Error).message==='CHAMADO_NAO_ENCONTRADO'?'CHAMADO_NAO_ENCONTRADO':'SUPPORT_UNAVAILABLE'};}
}
