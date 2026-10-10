import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { setTimeout as esperar } from 'node:timers/promises';
import { pino } from 'pino';
import { z } from 'zod';
import { hash, type Projeto } from './projeto.js';

export const ferramentas = ['contexto_projeto','revisar_cobertura','executar_validacao','consultar_evidencias','desconhecida'] as const;
const estados = ['STARTED','OK','NOT_VERIFIED','PASS','FAIL','BLOCKED','NOT_RUN','ERROR'] as const;
// Textos públicos do produto. Nunca persistimos texto livre vindo do requisito/resultado.
const orientacoes: Record<string,string> = {
  MISSING_REQUIREMENT:'Esclarecer requisito e origem antes de concluir.',
  UNVERIFIED_SOURCE:'Confirmar a fonte documental autorizada.',
  CONTRADICTORY_REQUIREMENT:'Resolver o conflito entre requisitos informado à revisão.',
  WEAK_TEST:'Revisar teste pendente/ignorado; sua presença não comprova cobertura.',
  UNVERIFIED_TEST:'Disponibilizar o teste existente para leitura autorizada.',
  DUPLICATE_ID:'Usar identidades únicas para os cenários.',
  MISSING_ORACLE:'Declarar resultado esperado e oráculo verificáveis.',
  TRACEABILITY_GAP:'Declarar risco e origem verificáveis.',
  MISSING_BEHAVIOR:'Definir o comportamento esperado.',
  MISSING_TECHNIQUE:'Justificar a técnica de teste aplicável.',
  MISSING_BOUNDARY:'Confirmar limite e lado na fonte do requisito.',
  MISSING_CONDITIONS:'Declarar condições ou transições de estado.',
  BLOCKING_CONDITION:'Resolver a condição bloqueante informada.',
  POTENTIAL_REDUNDANCY:'Comparar cenários equivalentes; redundância ainda é candidata.',
  COVERAGE_GAP:'Identificar cenário ou teste verificável.',
  CONTEXT_UNAVAILABLE:'Contexto referenciado indisponível ao agente; a pessoa precisa habilitá-lo ou corrigir a referência.',
  CONTEXT_NOT_APPROVED:'Contexto em rascunho: não é regra confirmada; solicitar aprovação humana.',
  CONTEXT_OUTDATED:'Contexto desatualizado: usar a versão substituta aprovada.',
  CONTEXT_CONFLICT:'Contextos conflitantes: esclarecer com a pessoa responsável antes de testar.',
  CONTEXT_SOURCE_MISSING:'Contexto sem origem verificável: informar a fonte.',
  CONTEXT_MISMATCH:'O requisito informado não consta no contexto referenciado.',
  CONTEXT_TAMPERED:'Histórico do contexto alterado fora do Prumo; não usar.',
  CONTEXT_SUSPICIOUS_INSTRUCTION:'Contexto com trecho que parece instrução ao agente; tratar apenas como dado.',
  PW_ESPERA_FIXA:'Trocar espera fixa por assertion que repete ou evento observável.',
  PW_SELETOR_FRAGIL:'Usar locators por papel, rótulo, texto ou data-testid.',
  PW_SEM_ASSERTION:'Teste sem verificação: declarar assertion do resultado esperado.',
  PW_ASSERTION_FRACA:'Assertion fraca: comparar com o resultado esperado.',
  PW_ASSERTION_SEM_AWAIT:'Assertion que repete sem await: adicionar await.',
  PW_ASSERTION_NAO_REPETE:'Usar assertion que repete em vez de leitura única do valor.',
  PW_TESTE_IGNORADO:'Teste ignorado não é cobertura: corrigir ou justificar.',
  PW_TEST_ONLY:'Remover test.only antes de integrar.',
  PW_FORCE:'Investigar o motivo em vez de forçar a ação.',
  PW_API_LEGADA:'Preferir page.locator()/getBy* a ElementHandle.',
  PW_DEPENDENCIA_ENTRE_TESTES:'Preferir testes isolados ao modo serial.',
  PW_RETRY_ESCONDE_FALHA:'Monitorar testes instáveis; retentativa não corrige a causa.',
  PW_TESTE_DUPLICADO:'Consolidar ou diferenciar testes de corpo idêntico.',
  PW_API_SO_STATUS:'Validar também o corpo e o estado no servidor.',
  OTHER_FINDING:'Consultar a resposta original; texto privado omitido do histórico.'
};
const contagem = z.number().int().nonnegative().max(1000000);
const resumoSchema = z.object({
  findings:contagem, recommendations:contagem, gaps:contagem, candidateRedundancies:contagem,
  types:z.array(z.object({type:z.enum(Object.keys(orientacoes) as [string,...string[]]),count:contagem}).strict()).max(30),
  evidenceJobId:z.string().uuid().optional(), evidencePersisted:z.boolean().optional(), executed:z.boolean().optional(),
  code:z.string().regex(/^[A-Z_]{1,64}$/).optional()
}).strict();
const entradaSchema = z.object({candidates:contagem.optional(),existingTests:contagem.optional(),hasRequirement:z.boolean().optional(),hasSource:z.boolean().optional()}).strict();
export const eventoSchema = z.object({
  version:z.literal(1), operationId:z.string().uuid(), projectId:z.string().max(100), rootHash:z.string().regex(/^[a-f0-9]{64}$/),
  manifestHash:z.string().regex(/^[a-f0-9]{64}$/), tool:z.enum(ferramentas), origin:z.enum(['CLI','MCP']),
  client:z.enum(['codex','claude','sdk','outro','terminal']), clientIdentity:z.literal('declarada'),
  phase:z.enum(['start','end']), at:z.string().datetime(), durationMs:z.number().finite().nonnegative(),
  state:z.enum(estados), input:entradaSchema, summary:resumoSchema,
  digest:z.string().regex(/^[a-f0-9]{64}$/),
  level:z.union([z.literal(30),z.literal(40),z.literal(50)])
}).strict();
export type Evento = z.infer<typeof eventoSchema>;
export type Origem = { origin:'CLI'|'MCP'; client?:string };
const vazio = ():z.infer<typeof resumoSchema> => ({findings:0,recommendations:0,gaps:0,candidateRedundancies:0,types:[]});
const ehLacuna=(tipo:string)=>/^(MISSING_|UNVERIFIED_|TRACEABILITY_GAP|COVERAGE_GAP|CONTRADICTORY_REQUIREMENT|CONTEXT_(UNAVAILABLE|NOT_APPROVED|OUTDATED|CONFLICT|SOURCE_MISSING|MISMATCH))/.test(tipo);
const codigos = new Set(['POLICY_BLOCKED','CAPABILITY_NOT_ALLOWED','SCOPE_CHANGED','PRECONDITION_MISSING','HUMAN_APPROVAL_REQUIRED','RUNTIME_MISSING','TIMEOUT','OUTPUT_LIMIT','SUBPROCESS_ERROR','PROCESS_SIGNAL','INVALID_RESULT','INVALID_MANIFEST','PATH_FORBIDDEN','SECRET_FORBIDDEN','SYMLINK_FORBIDDEN','CONTEXT_LIMIT','EVIDENCE_TAMPERED','PROJECT_MISMATCH','INVALID_JOB','INVALID_ARGUMENTS','TOOL_ERROR']);
const objeto = (v:unknown):Record<string,unknown> => v!==null && typeof v==='object' && !Array.isArray(v) ? v as Record<string,unknown> : {};
const lista = (v:unknown):unknown[] => Array.isArray(v)?v:[];
export const limitesHistorico = { arquivos:10000, arquivoBytes:32768, leituraBytes:32*1024*1024 } as const;

function falha(codigo:string):never { throw new Error(codigo); }
function dentro(raiz:string,alvo:string) { const r=path.relative(raiz,alvo);return !r || (r!=='..'&&!r.startsWith('..'+path.sep)&&!path.isAbsolute(r)); }
/** Recusa links em TODOS os componentes, inclusive ancestrais do diretório de dados. */
export function semLinks(alvo:string) {
  const absoluto=path.resolve(alvo); let atual=path.parse(absoluto).root;
  for(const parte of absoluto.slice(atual.length).split(path.sep).filter(Boolean)) {
    atual=path.join(atual,parte);
    try { if(fs.lstatSync(atual).isSymbolicLink())falha('HISTORY_SYMLINK'); }
    catch(e) { if((e as NodeJS.ErrnoException).code==='ENOENT')return;throw e; }
  }
}
/** Diretório de dados do usuário (histórico, vínculos). PRUMO_DATA_DIR sobrepõe o padrão. */
export function diretorioDados(base=process.env.PRUMO_DATA_DIR):string {
  const padrao=process.platform==='win32' ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(),'AppData','Local'),'PrumoQA') : path.join(os.homedir(),'.local','share','prumo-qa');
  const dados=base ?? padrao;
  if(!path.isAbsolute(dados))falha('HISTORY_ABSOLUTE_PATH_REQUIRED');
  return dados;
}
export function pastaAtividades(p:Projeto, base=process.env.PRUMO_DATA_DIR):string {
  const dados=diretorioDados(base);
  const alvo=path.resolve(dados,'projects',hash(p.raiz+'\0'+p.manifesto.id));
  if(dentro(p.raiz,path.resolve(dados)) || dentro(p.raiz,alvo))falha('HISTORY_INSIDE_PROJECT');
  semLinks(alvo);return alvo;
}
function nomes(pasta:string):string[] {
  semLinks(pasta);
  try {
    const arquivos=fs.readdirSync(pasta).filter(n=>/^[a-f0-9-]{36}\.jsonl$/.test(n));
    if(arquivos.length>limitesHistorico.arquivos)falha('HISTORY_FILE_LIMIT');
    return arquivos;
  } catch(e) { if((e as NodeJS.ErrnoException).code==='ENOENT')return [];throw e; }
}
function gravar(alvo:string,evento:Omit<Evento,'level'|'digest'>,inicio:boolean) {
  semLinks(alvo);
  const nivel=evento.state==='ERROR'||evento.state==='FAIL'?'error':evento.state==='BLOCKED'?'warn':'info';
  // Uma operação tem seu próprio arquivo: nenhuma disputa de append entre processos.
  const fd=fs.openSync(alvo,inicio?'wx':'a',0o600);
  try {
    const st=fs.fstatSync(fd);
    if(!st.isFile() || st.nlink!==1 || st.size>limitesHistorico.arquivoBytes)falha('HISTORY_FILE_INVALID');
    const logger=pino({base:null,timestamp:false,redact:{paths:['password','token','secret','authorization','input.password','input.token'],censor:'[REDACTED]'}},{write(line:string){
      if(st.size+Buffer.byteLength(line)>limitesHistorico.arquivoBytes)falha('HISTORY_SIZE_LIMIT');
      const bytes=Buffer.from(line);let offset=0;
      while(offset<bytes.length)offset+=fs.writeSync(fd,bytes,offset,bytes.length-offset);
    }});
    logger[nivel]({...evento,digest:hash(JSON.stringify(evento))});fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
}
const diagnosticoPadrao = (fase:string,id:string) => { process.stderr.write(`PRUMO_OBSERVABILITY_ERROR phase=${fase} operationId=${id}; resultado do núcleo preservado; verifique PRUMO_DATA_DIR/permissões/limites.\n`); };
export function iniciarAtividade(p:Projeto,tool:string,origem:Origem,entrada:unknown={},opcoes:{base?:string;diagnostico?:(fase:string,id:string)=>void}={}) {
  const id=randomUUID();const inicio=performance.now();const r=objeto(entrada);
  const cliente=origem.origin==='CLI'?'terminal':/codex/i.test(origem.client??'')?'codex':/claude/i.test(origem.client??'')?'claude':/sdk|test|acceptance/i.test(origem.client??'')?'sdk':'outro';
  const e:Omit<Evento,'level'|'digest'>={version:1,operationId:id,projectId:hash(p.manifesto.id),rootHash:hash(p.raiz),manifestHash:p.manifestoHash,
    tool:ferramentas.includes(tool as typeof ferramentas[number])?tool as typeof ferramentas[number]:'desconhecida',origin:origem.origin,client:cliente,clientIdentity:'declarada',
    phase:'start',at:new Date().toISOString(),durationMs:0,state:'STARTED',input:tool==='revisar_cobertura'?{candidates:Math.min(lista(r.candidates).length,1000000),existingTests:Math.min(lista(r.existingTests).length,1000000),hasRequirement:typeof r.requirement==='string'&&!!r.requirement.trim(),hasSource:typeof r.source==='string'&&!!r.source.trim()}:{},summary:vazio()};
  const avisar=opcoes.diagnostico??diagnosticoPadrao;let alvo:string|undefined;let encerrado=false;
  try {
    const pasta=pastaAtividades(p,opcoes.base);
    if(nomes(pasta).length>=limitesHistorico.arquivos)falha('HISTORY_FILE_LIMIT');
    fs.mkdirSync(pasta,{recursive:true,mode:0o700});semLinks(pasta);
    alvo=path.join(pasta,id+'.jsonl');gravar(alvo,e,true);
  } catch { alvo=undefined;avisar('start',id); }
  return {id, finalizar(resultado:unknown,erro=false) {
    if(encerrado)return;encerrado=true;
    const saida=objeto(resultado);const summary=vazio();const encontrados=lista(saida.findings);
    summary.findings=encontrados.length;
    summary.recommendations=encontrados.filter(f=>typeof objeto(f).recommendation==='string'&&!!(objeto(f).recommendation as string).trim()).length;
    const tipos=new Map<string,number>();
    for(const f of encontrados) { const t=objeto(f).type;const tipo=typeof t==='string'&&Object.hasOwn(orientacoes,t)?t:'OTHER_FINDING';tipos.set(tipo,(tipos.get(tipo)??0)+1); }
    summary.types=[...tipos].map(([type,count])=>({type,count}));
    summary.candidateRedundancies=tipos.get('POTENTIAL_REDUNDANCY')??0;
    summary.gaps=summary.types.filter(t=>ehLacuna(t.type)).reduce((n,t)=>n+t.count,0);
    if(z.string().uuid().safeParse(saida.jobId).success)summary.evidenceJobId=saida.jobId as string;
    if(typeof saida.persisted==='boolean')summary.evidencePersisted=saida.persisted;
    if(typeof saida.executed==='boolean')summary.executed=saida.executed;
    const codigo=typeof saida.reason==='string'?saida.reason.split(':')[0]!:typeof saida.codigo==='string'?saida.codigo:'';
    if(codigos.has(codigo))summary.code=codigo;
    if(erro)summary.code=summary.code??'TOOL_ERROR';
    const estado=saida.status??saida.state;
    const state=erro?'ERROR':typeof estado==='string'&&estados.includes(estado as typeof estados[number])&&estado!=='STARTED'?estado as Evento['state']:'OK';
    try { if(alvo)gravar(alvo,{...e,phase:'end',at:new Date().toISOString(),durationMs:Math.round((performance.now()-inicio)*1000)/1000,state,summary},false); }
    catch { avisar('end',id); }
  }};
}
export async function observar<T>(p:Projeto,tool:string,origem:Origem,entrada:unknown,fn:()=>Promise<T>,opcoes:Parameters<typeof iniciarAtividade>[4]={}) {
  const atividade=iniciarAtividade(p,tool,origem,entrada,opcoes);
  try { const r=await fn();atividade.finalizar(r);return r; }
  catch(e) { atividade.finalizar(e,true);throw e; }
}

export function consultarAtividades(p:Projeto,base?:string) {
  const pasta=pastaAtividades(p,base);const eventos:Evento[]=[];const problemas:{file:string;code:string}[]=[];let bytes=0;
  for(const nome of nomes(pasta)) {
    const alvo=path.join(pasta,nome);
    try {
      semLinks(alvo);const st=fs.lstatSync(alvo);
      if(!st.isFile()||st.nlink!==1||st.size>limitesHistorico.arquivoBytes)falha('HISTORY_FILE_INVALID');
      bytes+=st.size;if(bytes>limitesHistorico.leituraBytes)falha('HISTORY_READ_LIMIT');
      const raw=fs.readFileSync(alvo,'utf8');
      if(Buffer.byteLength(raw)>limitesHistorico.arquivoBytes)falha('HISTORY_FILE_INVALID');
      const linhas=raw.split('\n');const incompleta=linhas.pop();
      if(incompleta)problemas.push({file:nome,code:'TRUNCATED_LINE'});
      if(!linhas.length || linhas.length>2)falha('HISTORY_CORRUPT');
      const lidos=linhas.map(l=>eventoSchema.parse(JSON.parse(l)));
      for(const e of lidos)if(e.operationId+'.jsonl'!==nome||e.rootHash!==hash(p.raiz)||e.projectId!==hash(p.manifesto.id))falha('HISTORY_PROJECT_MISMATCH');
      for(const e of lidos) {
        const {level,digest,...conteudo}=e;
        if(hash(JSON.stringify(conteudo))!==digest)falha('HISTORY_DIGEST_MISMATCH');
        if(level!==(e.state==='ERROR'||e.state==='FAIL'?50:e.state==='BLOCKED'?40:30))falha('HISTORY_LEVEL_MISMATCH');
        const s=e.summary;
        if(new Set(s.types.map(t=>t.type)).size!==s.types.length || s.findings!==s.types.reduce((n,t)=>n+t.count,0) || s.recommendations>s.findings || s.gaps!==s.types.filter(t=>ehLacuna(t.type)).reduce((n,t)=>n+t.count,0) || s.candidateRedundancies!==(s.types.find(t=>t.type==='POTENTIAL_REDUNDANCY')?.count??0))falha('HISTORY_COUNTER_MISMATCH');
      }
      if(lidos[0]!.phase!=='start'||lidos[0]!.state!=='STARTED'||lidos[0]!.durationMs!==0)falha('HISTORY_CORRUPT');
      if(lidos[1] && (lidos[1].phase!=='end'||lidos[1].state==='STARTED'||lidos[1].tool!==lidos[0]!.tool||lidos[1].origin!==lidos[0]!.origin||lidos[1].client!==lidos[0]!.client||lidos[1].manifestHash!==lidos[0]!.manifestHash||lidos[1].at<lidos[0]!.at))falha('HISTORY_CORRUPT');
      eventos.push(...lidos);
    } catch(e) {
      if((e as Error).message==='HISTORY_READ_LIMIT')throw e;
      problemas.push({file:nome,code:'HISTORY_INVALID_RECORD'});
    }
  }
  eventos.sort((a,b)=>a.at.localeCompare(b.at)||a.operationId.localeCompare(b.operationId)||(a.phase==='start'?-1:1));
  const operacoes=new Map<string,Evento>();for(const e of eventos)operacoes.set(e.operationId,e);
  return {projectId:hash(p.manifesto.id),rootHash:hash(p.raiz),directory:pasta,events:eventos,activities:[...operacoes.values()].sort((a,b)=>a.at.localeCompare(b.at)),problems:problemas,complete:!problemas.length};
}
export function calcularMetricas(h:ReturnType<typeof consultarAtividades>) {
  const a=h.activities;const finais=a.filter(e=>e.phase==='end');const soma=(campo:'findings'|'recommendations'|'gaps'|'candidateRedundancies')=>finais.reduce((n,e)=>n+e.summary[campo],0);
  const execucoes=a.filter(e=>e.tool==='executar_validacao');
  return {projectId:h.projectId,rootHash:h.rootHash,complete:h.complete,problems:h.problems,totalOperations:a.length,
    mcpCalls:a.filter(e=>e.origin==='MCP').length,contextAnalyses:finais.filter(e=>e.tool==='contexto_projeto'&&e.state==='NOT_VERIFIED').length,
    coverageReviews:finais.filter(e=>e.tool==='revisar_cobertura'&&e.state==='NOT_VERIFIED').length,findings:soma('findings'),recommendations:soma('recommendations'),gaps:soma('gaps'),candidateRedundancies:soma('candidateRedundancies'),
    executionsRequested:execucoes.length,executions:Object.fromEntries(['PASS','FAIL','BLOCKED','NOT_RUN'].map(s=>[s,execucoes.filter(e=>e.state===s).length])),
    errors:a.filter(e=>e.state==='ERROR').length,unfinished:a.filter(e=>e.phase==='start').length,
    averageDurationMs:finais.length?Math.round(finais.reduce((n,e)=>n+e.durationMs,0)/finais.length*1000)/1000:null,
    lastActivity:a.length?[...a].sort((x,y)=>x.at.localeCompare(y.at)).at(-1)!.at:null,
    tokens:null,cost:null,providerMetrics:'indisponíveis: cliente/provedor não forneceu dados verificáveis',appliedChanges:null};
}
export function descreverAchados(e:Evento) {return e.summary.types.map(t=>`${t.count} × ${orientacoes[t.type]}`).join(' ');}

export async function acompanharLogs(p:Projeto,emitir:(e:Evento)=>void,opcoes:{signal:AbortSignal;base?:string;intervalMs?:number;problemas?:(p:ReturnType<typeof consultarAtividades>['problems'])=>void}) {
  const vistos=new Set<string>();let ultimosProblemas='';
  while(!opcoes.signal.aborted) {
    const h=consultarAtividades(p,opcoes.base);
    for(const e of h.events) {const chave=e.operationId+e.phase;if(!vistos.has(chave)){vistos.add(chave);emitir(e);}}
    const problemas=JSON.stringify(h.problems);if(problemas!==ultimosProblemas&&h.problems.length)opcoes.problemas?.(h.problems);ultimosProblemas=problemas;
    try{await esperar(opcoes.intervalMs??1000,undefined,{signal:opcoes.signal});}catch(e){if(!opcoes.signal.aborted)throw e;}
  }
}

/**
 * Exclusão controlada do histórico OPERACIONAL de um projeto (nunca código nem evidências).
 * Só apaga arquivos <uuid>.jsonl regulares, um a um, sem links; falhas parciais (arquivo em uso, permissão) são devolvidas.
 */
export function excluirAtividades(p:Projeto,base?:string) {
  const pasta=pastaAtividades(p,base);const falhas:{file:string;code:string}[]=[];let apagados=0;
  for(const nome of nomes(pasta)) {
    const alvo=path.join(pasta,nome);
    try { semLinks(alvo);const st=fs.lstatSync(alvo);if(!st.isFile()||st.nlink!==1)falha('HISTORY_FILE_INVALID');fs.unlinkSync(alvo);apagados++; }
    catch(e) { falhas.push({file:nome,code:(e as NodeJS.ErrnoException).code??(e as Error).message.slice(0,40)}); }
  }
  try { fs.rmdirSync(pasta); } catch { /* restam arquivos ou a pasta não existe */ }
  return {deleted:apagados,failed:falhas};
}
