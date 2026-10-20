/** Lógica e contratos de suporte: operações relacionadas no mesmo módulo. */
import { repositorio } from "../ajuda/contratos.js";
import { z } from "zod";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { eventoSchema, issueSchema, numeroChamado, statusChamados } from "./contratos.js";
import { chamarServico } from "../compartilhado/integracoes/servicoDoPrumo.js";

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

const FALHA = 'SUPPORT_SERVICE_UNAVAILABLE';

/** Traduz a resposta do serviço em erro com código próprio; o corpo do serviço nunca vai para a janela. */
async function conferir<T>(r: Response, esperados: number[]): Promise<T> {
  if (esperados.includes(r.status)) return (r.headers.get('content-type') || '').startsWith('application/json') ? await r.json() as T : (Buffer.from(await r.arrayBuffer()) as unknown as T);
  const erro = await r.json().then((j: { erro?: string }) => j.erro ?? '').catch(() => '');
  if (r.status === 429) throw new Error('SUPPORT_RATE_LIMIT: muitos pedidos ao suporte agora; espere e tente de novo.');
  if (r.status === 401) throw new Error('SUPPORT_ADMIN_DENIED: a chave de administração do suporte não confere.');
  if (r.status === 404) throw new Error('TICKET_NOT_FOUND: chamado não encontrado.');
  if (r.status === 410) throw new Error('ATTACHMENT_WINDOW_CLOSED: o prazo para mandar anexos deste chamado acabou.');
  if (r.status === 503) throw new Error(erro === 'SUPPORT_ADMIN_NOT_CONFIGURED' ? 'SUPPORT_ADMIN_NOT_CONFIGURED: o serviço ainda não tem a chave de administração configurada.' : 'SUPPORT_NOT_CONFIGURED: o serviço de suporte ainda não está configurado.');
  if (r.status === 400 || r.status === 413 || r.status === 415) throw new Error('SUPPORT_TICKET_INVALID: o serviço recusou o chamado ou o anexo (' + (erro || r.status) + ').');
  if (r.status === 409) throw new Error('ATTACHMENT_EXISTS: esse anexo já foi recebido.');
  throw new Error('SUPPORT_SEND_FAILED: o serviço de suporte não conseguiu concluir agora; tente de novo em instantes.');
}

type ChamadoParaServico = { categoria: string; titulo: string; descricao: string; passos?: string; esperado?: string; versao?: string; sistema?: string; diagnostico?: string; contato?: { nome: string; email?: string }; anexos: { nome: string; tipo: string; tamanho: number }[] };

type RespostaDoChamado = { em: string; texto: string };

type ResumoDoChamado = { numero: number; titulo: string; categoria: string; estado: string; contato: string | null; criadoEm: string; atualizadoEm: string; anexos: number };

const json = (corpo: unknown) => ({ cabecalhos: { 'Content-Type': 'application/json' }, corpo: JSON.stringify(corpo) });

export const servicoDeChamados = {
  abrir: async (c: ChamadoParaServico) => conferir<{ numero: number; chave: string }>(await chamarServico('/v1/chamados', { metodo: 'POST', ...json(c) }, FALHA), [201]),
  anexar: async (numero: number, indice: number, chave: string, tipo: string, bytes: Uint8Array) => conferir<{ recebido: boolean }>(await chamarServico(`/v1/chamados/${numero}/anexos/${indice}`, { metodo: 'PUT', cabecalhos: { 'Content-Type': tipo, 'X-Prumo-Chamado': chave }, corpo: bytes, segundos: 180 }, FALHA), [201]),
  acompanhar: async (numero: number, chave: string) => conferir<{ numero: number; titulo: string; categoria: string; estado: string; criadoEm: string; atualizadoEm: string; respostas: RespostaDoChamado[] }>(await chamarServico(`/v1/chamados/${numero}`, { metodo: 'GET', cabecalhos: { 'X-Prumo-Chamado': chave } }, FALHA), [200]),
  admin: (chaveAdmin: string) => {
    const autorizacao = { Authorization: 'Bearer ' + chaveAdmin };
    return {
      listar: async (estado?: string) => conferir<{ chamados: ResumoDoChamado[] }>(await chamarServico('/v1/admin/chamados' + (estado ? '?estado=' + encodeURIComponent(estado) : ''), { metodo: 'GET', cabecalhos: autorizacao }, FALHA), [200]),
      detalhe: async (numero: number) => conferir<Record<string, unknown>>(await chamarServico(`/v1/admin/chamados/${numero}`, { metodo: 'GET', cabecalhos: autorizacao }, FALHA), [200]),
      anexo: async (numero: number, indice: number) => { const r = await chamarServico(`/v1/admin/chamados/${numero}/anexos/${indice}`, { metodo: 'GET', cabecalhos: autorizacao, segundos: 180 }, FALHA); const bytes = await conferir<Buffer>(r, [200]); return { tipo: (r.headers.get('content-type') || '').split(';')[0]!, bytes }; },
      responder: async (numero: number, texto: string) => conferir<{ respondido: boolean }>(await chamarServico(`/v1/admin/chamados/${numero}/respostas`, { metodo: 'POST', cabecalhos: { ...autorizacao, 'Content-Type': 'application/json' }, corpo: JSON.stringify({ texto }) }, FALHA), [201]),
      mudarEstado: async (numero: number, estado: string) => conferir<{ estado: string }>(await chamarServico(`/v1/admin/chamados/${numero}`, { metodo: 'PATCH', cabecalhos: { ...autorizacao, 'Content-Type': 'application/json' }, corpo: JSON.stringify({ estado }) }, FALHA), [200])
    };
  }
};
