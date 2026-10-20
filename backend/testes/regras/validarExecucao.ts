/** Confere ambiente, limites e escopo autorizado antes de executar uma validação. */
import { ErroQa } from "../../compartilhado/erros.js";
import { normalizarComando } from "../../compartilhado/projeto/normalizarComando.js";
import { caminhoSeguro } from "../../compartilhado/seguranca/caminhoSeguro.js";
import { Projeto, Comando } from "../../compartilhado/projeto/contratos.js";
import path from "node:path";
import { inventariar } from "../../compartilhado/projeto/inventariar.js";
import { hash } from "../../compartilhado/seguranca/hash.js";
import { lerSeguro } from "../../compartilhado/seguranca/lerSeguro.js";

/** Escopo atual de uma capability, sem executar nada: usado para pedir e reconhecer autorizações agendadas. */
export async function escopoDeCapability(p:Projeto,capability:string) {
  if(p.manifesto.execution.readOnly) throw new ErroQa('POLICY_BLOCKED','Projeto autorizado estritamente para leitura.');
  if(!Object.hasOwn(p.manifesto.commands,capability)) throw new ErroQa('CAPABILITY_NOT_ALLOWED','Capability inexistente.');
  if(p.manifesto.execution.blockedByDefault.includes(capability)) throw new ErroQa('POLICY_BLOCKED','Execução bloqueada pelo contrato.');
  const c=normalizarComando(p.manifesto.commands[capability]!); const command=JSON.stringify({...c,env:Object.fromEntries(Object.keys(c.env).map(n=>[n,'[DECLARED]']))});
  await caminhoSeguro(p.raiz,c.cwd); const env=ambienteMinimo(p,c,'escopo'); for(const f of c.requiredFiles) await caminhoSeguro(p.raiz,f);
  return { scopeHash:await escopoDaExecucao(p,c,env), command };
}

export async function escopoDaExecucao(p:Projeto,c:Comando,env:NodeJS.ProcessEnv) {
  const inv=await inventariar(p); const fontes=inv.fontes.map(({path,sha256})=>({path,sha256}));
  for(const arg of c.executable==='node' ? c.args.filter(v=>v!=='--test') : ['package.json']) {
    const rel=path.join(c.cwd,arg); fontes.push({path:rel,sha256:hash(await lerSeguro(p.raiz,rel))});
  }
  // O PRUMO_JOB_ID muda a cada execução; fora do hash o escopo fica estável e uma autorização prévia pode ser reconhecida.
  const { PRUMO_JOB_ID:_ignorado, ...envEstavel }=env;
  return hash(JSON.stringify({root:p.raiz,manifest:p.manifestoHash,command:c,env:envEstavel,fontes}));
}

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
