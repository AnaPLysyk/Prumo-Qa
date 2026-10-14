/** Aplica a configuração no Codex com o configurador oficial, só depois da confirmação, sem sobrescrever nome existente. */
import { spawnSync } from 'node:child_process';
import { prepararConexao } from './prepararConexao.js';

export function aplicarConexao(plano:ReturnType<typeof prepararConexao>,confirmacao:string) {
  if(confirmacao!==plano.confirmation)return {configured:false,reason:'Confirmação não recebida; nenhuma alteração.'};
  if(!plano.executable||plano.manualOnly)return {configured:false,reason:'Use o comando exibido no terminal; cliente nativo não disponível.'};
  if(plano.client!=='codex')return {configured:false,reason:'Configuração automática disponível para Codex. Execute o comando Claude exibido após revisar o destino.'};
  const options={encoding:'utf8' as const,windowsHide:true,shell:false,timeout:15000,maxBuffer:1024*1024};
  // list falhando nunca equivale a configuração ausente. Não mostramos seu conteúdo (pode conter env).
  const lista=spawnSync(plano.executable,['mcp','list','--json'],options);
  if(lista.error||lista.status!==0)throw new Error('CONNECTION_INSPECTION_FAILED: não foi possível conferir configurações existentes.');
  let servidores:unknown;try{servidores=JSON.parse(lista.stdout);}catch{throw new Error('CONNECTION_INSPECTION_FAILED: resposta inválida do cliente.');}
  if(!Array.isArray(servidores))throw new Error('CONNECTION_INSPECTION_FAILED: lista inválida.');
  if(servidores.some(s=>s?.name===plano.name))return {configured:false,reason:'Configuração com esse nome já existe; preservada sem sobrescrita.',name:plano.name};
  const r=spawnSync(plano.executable,plano.args,options);
  if(r.error||r.status!==0)throw new Error('CONNECTION_WRITE_FAILED: cliente recusou a configuração; confira o destino exibido.');
  return {configured:true,name:plano.name,destination:plano.destination,notice:'Reabra o cliente. Configuração não comprova sessão ativa nem autenticação.'};
}
