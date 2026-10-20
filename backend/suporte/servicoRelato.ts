/** servicoRelato: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { repositorio } from "../ajuda/contratos.js";
import { lerDiagnostico } from "../logs/banco/diagnostico.js";
import os from "node:os";
import { hash } from "../compartilhado/seguranca/hash.js";
import { Contexto, Solicitacao, rotulo, AVISO_PUBLICO, limiteUrl, modelo, solicitacaoSchema, urlBase, Achado, eventoSchema, issueSchema, numeroChamado, statusChamados } from "./contratos.js";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { z } from "zod";
import { chamarServico } from "../compartilhado/servicoRemoto.js";

// --- servicoRelato ---
/** Validação do endereço antes de abrir: só o formulário oficial do repositório, em https. */
export function enderecoOficialDoRelato(url: string) {
  try { const u = new URL(url); return u.protocol === 'https:' && u.hostname === 'github.com' && u.pathname === `/${repositorio}/issues/new` && !u.username && !u.port && u.hash === ''; } catch { return false; }
}

/** Texto do relatório (Markdown), incluindo só o que a pessoa autorizou. */
export function montarTextoDoRelato(s: Solicitacao, c: Contexto) {
  const idLocal = 'LOCAL-' + hash(JSON.stringify({ categoria:s.categoria,titulo:s.titulo,descricao:s.descricao,esperado:s.esperado,passos:s.passos })).slice(0,16);
  const ambiente: string[] = [];
  if (s.incluirVersao) ambiente.push(`Prumo QA ${c.versao}`);
  if (s.incluirSistema) ambiente.push(`Sistema: ${os.platform()} ${os.release()} (${os.arch()})`);
  if (s.incluirDiagnostico) ambiente.push('Diagnóstico da interface (somente metadados):\n' + (c.diagnostico || '(nenhum evento registrado)'));
  return {
    descricao: s.descricao, esperado: s.esperado ?? '', passos: s.passos ?? '', ambiente: ambiente.join('\n'),
    idLocal,
    markdown: ['---', `id: ${idLocal}`, `tipo: ${s.categoria}`, 'status: rascunho_local', 'origem: aplicativo', ...(s.incluirVersao ? [`versao: ${JSON.stringify(c.versao)}`] : []), '---', '', `# [${rotulo[s.categoria]}] ${s.titulo}`, '', 'Identificador local do relato; não é número de chamado GitHub.', '', '## Descrição', s.descricao,
      ...(s.esperado ? ['', s.categoria === 'bug' ? '## Comportamento esperado' : '## Benefício esperado', s.esperado] : []),
      ...(s.passos ? ['', '## Passos para reproduzir', s.passos] : []), ...(ambiente.length ? ['', '## Ambiente', ambiente.join('\n')] : [])].join('\n')
  };
}

/** Endereço oficial do formulário do GitHub com os campos do template preenchidos (ids: descricao, esperado, passos, ambiente). */
function montarEnderecoDoRelato(s: Solicitacao, corpo: ReturnType<typeof montarTextoDoRelato>) {
  const q = new URLSearchParams({ template: modelo[s.categoria], title: `[${rotulo[s.categoria]}] ${s.titulo}` });
  let truncado = false;
  for (const [id, valor] of [['descricao', corpo.descricao], ['esperado', corpo.esperado], ['passos', corpo.passos], ['ambiente', corpo.ambiente]] as const) {
    if (!valor) continue; let v: string = valor;
    q.set(id, v);
    while (`${urlBase}?${q}`.length > limiteUrl && v.length > 200) { v = v.slice(0, Math.floor(v.length * 0.8)); q.set(id, v + '…'); truncado = true; }
  }
  return { url: `${urlBase}?${q}`, truncado };
}

export function prepararRelato(entrada: unknown, c: Contexto) {
  const s = solicitacaoSchema.parse(entrada);
  if (s.categoria === 'bug' && !s.passos) return { ok: false as const, bloqueios: [{ tipo: 'passos para reproduzir são obrigatórios em bug', trecho: '' }], avisos: [], aviso: AVISO_PUBLICO };
  const corpo = montarTextoDoRelato(s, c);
  const { bloqueios, avisos } = revisarPrivacidadeDoRelato({ titulo: s.titulo, descricao: s.descricao, esperado: s.esperado, passos: s.passos, diagnostico: s.incluirDiagnostico ? c.diagnostico : undefined });
  if(bloqueios.length)return {ok:false as const,bloqueios,avisos:[],aviso:AVISO_PUBLICO};
  const { url, truncado } = montarEnderecoDoRelato(s, corpo);
  return { ok:true as const, bloqueios, avisos, aviso: AVISO_PUBLICO, idLocal:corpo.idLocal, titulo: `[${rotulo[s.categoria]}] ${s.titulo}`, markdown: corpo.markdown, url, truncado, publico: true, campos: { descricao: corpo.descricao, esperado: corpo.esperado, passos: corpo.passos, ambiente: corpo.ambiente } };
}

/** Revisão de privacidade: bloqueia segredos; apenas avisa dados pessoais e caminhos locais (a pessoa decide). Trechos já mascarados. */
export function revisarPrivacidadeDoRelato(textos: Record<string, string | undefined>) {
  const bloqueios: Achado[] = []; const avisos: Achado[] = [];
  const regras: { tipo: string; re: RegExp; grave: boolean }[] = [
    { tipo: 'chave privada', re: /-----BEGIN [^-]*PRIVATE KEY-----/, grave: true },
    { tipo: 'token de acesso', re: /\b(?:gh[pousr]_[\w]{10,}|sk-[\w-]{15,}|eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}|xox[abp]-[\w-]{10,}|AKIA[0-9A-Z]{12,})\b/, grave: true },
    { tipo: 'credencial em endereço', re: /https?:\/\/[^/\s:@]+:[^/\s@]+@/, grave: true },
    { tipo: 'segredo atribuído (senha, token, chave)', re: /\b(?:password|passwd|senha|token|secret|segredo|api[_-]?key|authorization)\s*["']?\s*[:=]\s*["']?(?!\[REDACTED\])[^\s,"'}]{4,}/i, grave: true },
    { tipo: 'cabeçalho Authorization', re: /\bBearer\s+[\w.+/=-]{8,}/i, grave: true },
    { tipo: 'arquivo de segredos (.env)', re: /(^|[\s"'\\/])\.env(\.[\w.-]+)?\b/, grave: true },
    { tipo: 'e-mail', re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/, grave: false },
    { tipo: 'CPF', re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, grave: false },
    { tipo: 'telefone', re: /(?:\+?55\s*)?\(?\b\d{2}\)?\s*9?\d{4}[-\s]?\d{4}\b/, grave: false },
    { tipo: 'caminho local do computador', re: /\b[A-Za-z]:\\(?:Users|Usuários)\\[^\s"']+|\\\\[\w.-]+\\[\w$.-]+|\/home\/[\w.-]+\/|\/Users\/[\w.-]+\//, grave: false }
  ];
  for (const [campo, texto] of Object.entries(textos)) {
    if (!texto) continue;
    for (const r of regras) { const m = r.re.exec(texto); if (m) (r.grave ? bloqueios : avisos).push({ tipo: `${r.tipo} (${campo})`, trecho: r.grave?'[REDACTED]':mascarar(m[0]).slice(0, 60) }); }
  }
  return { bloqueios, avisos };
}

/** Resume somente os metadados recentes do diagnóstico para anexar ao relato autorizado. */
export function resumoDoDiagnosticoParaRelato() {
  return lerDiagnostico(undefined, 20).events
    .map(e => [e.at, e.channel, e.state, e.code ?? '', e.durationMs + 'ms'].filter(Boolean).join(' '))
    .join('\n');
}

// --- integracoes ---
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
