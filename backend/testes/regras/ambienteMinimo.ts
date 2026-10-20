/** Monta o ambiente mínimo do processo de teste: só variáveis permitidas, sem PATH herdado nem segredos. */
import path from 'node:path';
import { Comando, Projeto } from '../../compartilhado/projeto/contratos.js';

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
