import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { carregarProjeto, caminhoSeguro, normalizarComando, lerSeguro, hash, mascarar, inventariar, ErroQa, type Projeto, type Comando } from './projeto.js';
import { solicitarAprovacao } from './aprovacao.js';
import { classificar, resultadoRunnerSchema, salvarEvidencia, type Evidencia } from './evidencias.js';

export function ambienteMinimo(p:Projeto,c:Comando,jobId:string) {
  const env:NodeJS.ProcessEnv={};
  // Não repassa PATH, HOME, NODE_OPTIONS, NODE_TEST_CONTEXT nem configurações npm.
  if (process.platform==='win32' && process.env.SystemRoot) { env.SystemRoot=process.env.SystemRoot; env.WINDIR=process.env.SystemRoot; }
  for (const n of p.manifesto.execution.envAllowlist) {
    const valor=c.env[n] ?? process.env[n]; if (valor!==undefined) env[n]=valor;
  }
  if(c.executable==='npm') env.PATH=[path.dirname(process.execPath),...(process.platform==='win32'&&process.env.SystemRoot?[path.join(process.env.SystemRoot,'System32')]:[])].join(path.delimiter);
  // Aplicativo empacotado: process.execPath é o Electron; sem isto o filho abriria a janela do Prumo.
  if(c.executable==='node' && process.versions.electron) env.ELECTRON_RUN_AS_NODE='1';
  env.PRUMO_JOB_ID=jobId;
  return env;
}
async function resolverRuntime(c:Comando) {
  if(c.executable==='node') return { executable:process.execPath,args:c.args };
  const candidatos=[path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),path.join(path.dirname(process.execPath),'../lib/node_modules/npm/bin/npm-cli.js')];
  for(const f of candidatos) { try { await fs.access(f); return { executable:process.execPath,args:[await fs.realpath(f),...c.args] }; } catch {} }
  throw new ErroQa('RUNTIME_MISSING','npm-cli.js não encontrado junto ao Node. Use comando node ou instale Node com npm.');
}
async function escopo(p:Projeto,c:Comando,env:NodeJS.ProcessEnv) {
  const inv=await inventariar(p); const fontes=inv.fontes.map(({path,sha256})=>({path,sha256}));
  for(const arg of c.executable==='node' ? c.args.filter(v=>v!=='--test') : ['package.json']) {
    const rel=path.join(c.cwd,arg); fontes.push({path:rel,sha256:hash(await lerSeguro(p.raiz,rel))});
  }
  return hash(JSON.stringify({root:p.raiz,manifest:p.manifestoHash,command:c,env,fontes}));
}
async function matarArvore(pid:number|undefined) {
  if (!pid) return;
  if (process.platform==='win32' && process.env.SystemRoot) {
    await new Promise<void>(resolve=>{
      const k=spawn(path.join(process.env.SystemRoot!,'System32','taskkill.exe'),['/PID',String(pid),'/T','/F'],{windowsHide:true,shell:false,stdio:'ignore'});
      const t=setTimeout(()=>{ k.kill();resolve(); },3000); k.on('error',()=>{clearTimeout(t);resolve();});k.on('close',()=>{clearTimeout(t);resolve();});
    });
  } else { try { process.kill(-pid,'SIGKILL'); } catch { try { process.kill(pid,'SIGKILL'); } catch {} } }
}
export async function executarValidacao(p:Projeto,capability:string,solicitar=false) {
  const jobId=randomUUID(); const inicio=new Date().toISOString();
  const e:Evidencia={kind:'execution_evidence',jobId,projectId:p.manifesto.id,rootHash:hash(p.raiz),manifestHash:p.manifestoHash,scopeHash:null,capability,status:'BLOCKED',reason:'',startedAt:inicio,endedAt:inicio,executed:false,exitCode:null,command:null,approval:null,cases:[],stdout:'',stderr:'',logSha256:hash('\n'),resultArtifact:null,evidenceScope:'round',provenance:'local-process'};
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
    runtime=await resolverRuntime(c);
    e.scopeHash=await escopo(p,c,env);
    if(!solicitar) throw new ErroQa('HUMAN_APPROVAL_REQUIRED','Use qa approve <capability> para autenticação humana nativa, ou solicitarAprovacao na tool.');
    const expiresAt=new Date(Date.now()+120000).toISOString();
    let aprovado;
    try { aprovado=await solicitarAprovacao({projectId:p.manifesto.id,root:p.raiz,capability,scopeHash:e.scopeHash,command:JSON.stringify(e.command),expiresAt}); }
    catch(err) { throw new ErroQa('HUMAN_APPROVAL_REQUIRED', (err as Error).message); }
    if(!aprovado || aprovado.scopeHash!==e.scopeHash || Date.now()>Date.parse(expiresAt)) throw new ErroQa('HUMAN_APPROVAL_REQUIRED','Consentimento cancelado, indisponível, inválido ou expirado.');
    e.approval=aprovado;
    const depois=await carregarProjeto(p.raiz);
    if(depois.manifestoHash!==p.manifestoHash || await escopo(depois,c,env)!==e.scopeHash) throw new ErroQa('SCOPE_CHANGED','Projeto/comando mudou após aprovação.');
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
    const terminar=(motivo:string)=>{ if(!bloqueio){bloqueio=motivo; void matarArvore(filho.pid).then(()=>filho.kill());} };
    const timer=setTimeout(()=>terminar('TIMEOUT'),timeout);
    const captar=(partes:Buffer[],b:Buffer)=>{ const sobra=max-tamanho; if(sobra>0) partes.push(b.subarray(0,sobra)); tamanho+=b.length; if(tamanho>max) terminar('OUTPUT_LIMIT'); };
    filho.stdout.on('data',b=>captar(stdout,b)); filho.stderr.on('data',b=>captar(stderr,b));
    filho.on('spawn',()=>{e.executed=true;});
    filho.on('error',err=>{clearTimeout(timer);resolve({exitCode:null,error:err.message});});
    filho.on('close',(exitCode,signal)=>{clearTimeout(timer);if(signal && !bloqueio) bloqueio='PROCESS_SIGNAL';resolve({exitCode});});
  });
  const segredos=[...Object.entries(process.env).filter(([n])=>/token|secret|password|api.?key/i.test(n)).map(([,v])=>v!),...p.manifesto.execution.envAllowlist.map(n=>env[n]!)].filter(Boolean);
  e.stdout=mascarar(Buffer.concat(stdout).toString(),segredos);e.stderr=mascarar(Buffer.concat(stderr).toString(),segredos);
  e.exitCode=processo.exitCode; if(processo.error) bloqueio='SUBPROCESS_ERROR';
  try {
    const raw=await lerSeguro(p.raiz,resultadoRel,true,262144);
    const r=resultadoRunnerSchema.parse(JSON.parse(raw));
    if(r.jobId!==jobId || new Set(r.cases.map(c=>c.id)).size!==r.cases.length) throw new Error('IDs inválidos');
    e.cases=r.cases.map(c=>({...c,evidence:mascarar(c.evidence,segredos)}));e.evidenceScope=e.cases.length?'individual':'round';
    e.resultArtifact={path:resultadoRel,sha256:hash(raw),trust:'Relatório do runner autorizado; conteúdo não é julgamento independente.'};
  } catch(err) { if((err as NodeJS.ErrnoException).code!=='ENOENT') bloqueio ??= 'INVALID_RESULT'; }
  e.status=classificar(e.exitCode,bloqueio,e.cases);
  e.reason=bloqueio ?? (e.exitCode===0?'Rodada terminou com exit code 0; casos só conforme relatório individual.':'Falha do processo; causa de produto/automação requer diagnóstico.');
  e.logSha256=hash(e.stdout+'\n'+e.stderr);e.endedAt=new Date().toISOString();
  // Artefato bruto pode conter segredos: só persistir versão redigida.
  if(e.resultArtifact) {
    const sanitized=JSON.stringify({jobId,cases:e.cases},null,2);
    await caminhoSeguro(p.raiz,resultadoRel,true);
    await fs.writeFile(resultadoPath,sanitized,{mode:0o600});
    e.resultArtifact={path:resultadoRel,sha256:hash(sanitized),trust:'Relatório do runner autorizado, redigido; sem julgamento independente.'};
  }
  else { try { await caminhoSeguro(p.raiz,resultadoRel,true);await fs.unlink(resultadoPath); } catch {} }
  return await salvarEvidencia(p,e);
}
