/** Busca no GitHub os dados públicos de uma issue, com limite de resposta, sem credencial nem redirecionamento. */
import { repositorio } from '../../ajuda/contratos.js';

export async function buscarDadosDoChamado(numero:number,sufixo:string,buscar:typeof fetch=fetch){
    const r=await buscar(`https://api.github.com/repos/${repositorio}/issues/${numero}${sufixo}`,{method:'GET',redirect:'error',credentials:'omit',cache:'no-store',headers:{Accept:'application/vnd.github+json','User-Agent':'PrumoQA-suporte'},signal:AbortSignal.timeout(8000)});
    if(!r.ok)throw new Error(r.status===404?'CHAMADO_NAO_ENCONTRADO':'SUPPORT_UNAVAILABLE');
    // Limite aplicado durante a leitura, antes de acumular toda a resposta.
    const leitor=r.body?.getReader(); if(!leitor)throw new Error('SUPPORT_INVALID');
    const chunks:Uint8Array[]=[];let total=0;
    try { for(;;){const {done,value}=await leitor.read();if(done)break;total+=value.length;if(total>1_000_000)throw new Error('SUPPORT_INVALID');chunks.push(value);} }
    finally {await leitor.cancel().catch(()=>{});}
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
