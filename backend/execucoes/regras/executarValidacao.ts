/** Executa uma capacidade do projeto depois da aprovação humana, com tempo e saída limitados, e grava a evidência (PASS, FAIL, BLOCKED ou NOT_RUN). */
import { spawn } from 'node:child_process';
import { mascararLogsDaExecucao } from './mascararLogsDaExecucao.js';
import { gravarRelatorioRedigido } from './gravarRelatorioRedigido.js';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { normalizarComando } from '../../compartilhado/projeto/normalizarComando.js';
import { caminhoSeguro } from '../../compartilhado/seguranca/caminhoSeguro.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { lerSeguro } from '../../compartilhado/seguranca/lerSeguro.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { Comando, Projeto } from '../../compartilhado/tipos/projeto.js';
import { salvarEvidencia } from '../../evidencias/banco/salvarEvidencia.js';
import { classificarResultado } from '../../evidencias/regras/classificarResultado.js';
import { criarEvidenciaInicial } from './criarEvidenciaInicial.js';
import { Evidencia, resultadoRunnerSchema } from '../../evidencias/tipos/evidencia.js';
import { solicitarAprovacao } from '../aprovacao/solicitarAprovacao.js';
import { ambienteMinimo } from './ambienteMinimo.js';
import { encerrarArvoreDeProcessos } from './encerrarArvoreDeProcessos.js';
import { escopoDaExecucao } from './escopoDaExecucao.js';
import { resolverExecutavel } from './resolverExecutavel.js';
import { Delegada } from '../tipos/execucao.js';

export async function executarValidacao(p:Projeto,capability:string,solicitar=false,delegada?:Delegada,signal?:AbortSignal) {
  const jobId=randomUUID(); const inicio=new Date().toISOString();
  const e:Evidencia=criarEvidenciaInicial(p,capability,jobId,inicio);
  let c:Comando;
  let work:string;
  let env:NodeJS.ProcessEnv;
  let runtime:{executable:string;args:string[]};
  try {
    if(p.manifesto.execution.readOnly) throw new ErroQa('POLICY_BLOCKED','Projeto autorizado estritamente para leitura.');
    // Revalidar contrato em cada chamada, nunca confiar em snapshot do adaptador.
    const atual=await carregarProjeto(p.raiz);
    if(atual.manifestoHash!==p.manifestoHash) throw new ErroQa('SCOPE_CHANGED','Manifesto mudou; recarregue contexto.');
    if(!Object.hasOwn(p.manifesto.commands,capability)) throw new ErroQa('CAPABILITY_NOT_ALLOWED','Capability inexistente.');
    c=normalizarComando(p.manifesto.commands[capability]!); e.command={...c,env:Object.fromEntries(Object.keys(c.env).map(n=>[n,'[DECLARED]']))};
    if(p.manifesto.execution.readOnly || p.manifesto.execution.blockedByDefault.includes(capability)) throw new ErroQa('POLICY_BLOCKED','Execução bloqueada pelo contrato.');
    work=await caminhoSeguro(p.raiz,c.cwd); env=ambienteMinimo(p,c,jobId);
    for(const f of c.requiredFiles) await caminhoSeguro(p.raiz,f);
    if(c.requiredEnv.some(n=>!env[n]?.trim())) throw new ErroQa('PRECONDITION_MISSING','Variável obrigatória ausente.');
    runtime=await resolverExecutavel(c);
    e.scopeHash=await escopoDaExecucao(p,c,env);
    if(!solicitar && !delegada) throw new ErroQa('HUMAN_APPROVAL_REQUIRED','Use qa approve <capability> para autenticação humana nativa, ou solicitarAprovacao na tool.');
    const expiresAt=new Date(Date.now()+120000).toISOString();
    let aprovado;
    if(!solicitar && delegada) { aprovado=await delegada({scopeHash:e.scopeHash,capability,command:JSON.stringify(e.command)}); if(!aprovado) throw new ErroQa('HUMAN_APPROVAL_REQUIRED','Nenhuma autorização agendada válida cobre este escopo (ausente, expirada, revogada, esgotada ou o projeto/comando mudou).'); }
    else try { aprovado=await solicitarAprovacao({projectId:p.manifesto.id,root:p.raiz,capability,scopeHash:e.scopeHash,command:JSON.stringify(e.command),expiresAt}); }
    catch(err) { throw new ErroQa('HUMAN_APPROVAL_REQUIRED', (err as Error).message); }
    if(!aprovado || aprovado.scopeHash!==e.scopeHash || Date.now()>Date.parse(expiresAt)) throw new ErroQa('HUMAN_APPROVAL_REQUIRED','Consentimento cancelado, indisponível, inválido ou expirado.');
    e.approval=aprovado;
    const depois=await carregarProjeto(p.raiz);
    if(depois.manifestoHash!==p.manifestoHash || await escopoDaExecucao(depois,c,env)!==e.scopeHash) throw new ErroQa('SCOPE_CHANGED','Projeto/comando mudou após aprovação.');
  } catch(err) {
    e.reason=(err instanceof ErroQa ? err.codigo : 'PRECONDITION_MISSING')+': '+mascarar((err as Error).message);
    e.endedAt=new Date().toISOString(); return await salvarEvidencia(p,e);
  }
  const timeout=c.timeoutMs ?? p.manifesto.execution.timeoutMs; const max=c.maxOutputBytes ?? p.manifesto.execution.maxOutputBytes;
  const resultadoRel=`.prumo/resultados/${jobId}.json`;
  await fs.mkdir(await caminhoSeguro(p.raiz,'.prumo/resultados',true,true),{recursive:true});
  const resultadoPath=await caminhoSeguro(p.raiz,resultadoRel,true,true);
  env.PRUMO_RESULT_FILE=resultadoPath;
  let bloqueio:string|undefined; let stdout:Buffer[]=[]; let stderr:Buffer[]=[]; let tamanho=0;
  const processo=await new Promise<{exitCode:number|null;error?:string}>(resolve=>{
    const filho=spawn(runtime.executable,runtime.args,{cwd:work,shell:false,env,windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});
    const terminar=(motivo:string)=>{ if(!bloqueio){bloqueio=motivo; void encerrarArvoreDeProcessos(filho.pid).then(()=>filho.kill());} };
    const timer=setTimeout(()=>terminar('TIMEOUT'),timeout);
    if(signal){ if(signal.aborted) terminar('CANCELLED'); else signal.addEventListener('abort',()=>terminar('CANCELLED'),{once:true}); }
    const captar=(partes:Buffer[],b:Buffer)=>{ const sobra=max-tamanho; if(sobra>0) partes.push(b.subarray(0,sobra)); tamanho+=b.length; if(tamanho>max) terminar('OUTPUT_LIMIT'); };
    filho.stdout.on('data',b=>captar(stdout,b)); filho.stderr.on('data',b=>captar(stderr,b));
    filho.on('spawn',()=>{e.executed=true;});
    filho.on('error',err=>{clearTimeout(timer);resolve({exitCode:null,error:err.message});});
    filho.on('close',(exitCode,signal)=>{clearTimeout(timer);if(signal && !bloqueio) bloqueio='PROCESS_SIGNAL';resolve({exitCode});});
  });
  const logsRedigidos=mascararLogsDaExecucao(p,env,stdout,stderr);
  const segredos=logsRedigidos.segredos;
  e.stdout=logsRedigidos.stdout;e.stderr=logsRedigidos.stderr;
  e.exitCode=processo.exitCode; if(processo.error) bloqueio='SUBPROCESS_ERROR';
  try {
    const raw=await lerSeguro(p.raiz,resultadoRel,true,262144);
    const r=resultadoRunnerSchema.parse(JSON.parse(raw));
    if(r.jobId!==jobId || new Set(r.cases.map(c=>c.id)).size!==r.cases.length) throw new Error('IDs inválidos');
    e.cases=r.cases.map(c=>({...c,evidence:mascarar(c.evidence,segredos)}));e.evidenceScope=e.cases.length?'individual':'round';
    e.resultArtifact={path:resultadoRel,sha256:hash(raw),trust:'Relatório do runner autorizado; conteúdo não é julgamento independente.'};
  } catch(err) { if((err as NodeJS.ErrnoException).code!=='ENOENT') bloqueio ??= 'INVALID_RESULT'; }
  e.status=classificarResultado(e.exitCode,bloqueio,e.cases);
  e.reason=bloqueio ?? (e.exitCode===0?'Rodada terminou com exit code 0; casos só conforme relatório individual.':'Falha do processo; causa de produto/automação requer diagnóstico.');
  e.logSha256=hash(e.stdout+'\n'+e.stderr);e.endedAt=new Date().toISOString();
  await gravarRelatorioRedigido(p,e,jobId,resultadoRel,resultadoPath);
  return await salvarEvidencia(p,e);
}
