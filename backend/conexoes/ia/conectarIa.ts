/** Configuração de Codex e Claude — arquivos relacionados agrupados para manutenção. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hash } from "../../compartilhado/seguranca/hash.js";
import { Projeto } from "../../compartilhado/projeto/contratos.js";
import { pastaAtividades } from "../../logs/banco/atividades.js";
import { spawnSync } from "node:child_process";

// ── localizarClienteDeIa ──
export function localizarClienteDeIa(cliente:'codex'|'claude') {
  const pastas=(process.env.PATH??'').split(path.delimiter).filter(d=>path.isAbsolute(d));
  // Instalação oficial do Codex Desktop também oferece CLI fora do PATH.
  if(cliente==='codex'&&process.platform==='win32'&&process.env.LOCALAPPDATA) {
    const pasta=path.join(process.env.LOCALAPPDATA,'OpenAI','Codex','bin');
    try { for(const d of fs.readdirSync(pasta).sort().reverse())pastas.push(path.join(pasta,d)); } catch { /* Não instalado aqui. */ }
  }
  // A extensão Claude Code do VS Code traz o claude.exe dentro da própria pasta, fora do PATH (usa a versão mais nova instalada).
  if(cliente==='claude'&&process.platform==='win32') {
    const extensoes=path.join(process.env.USERPROFILE??os.homedir(),'.vscode','extensions');
    try { for(const d of fs.readdirSync(extensoes).filter(n=>n.startsWith('anthropic.claude-code-')).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true})))pastas.push(path.join(extensoes,d,'resources','native-binary')); } catch { /* VS Code não instalado aqui. */ }
  }
  // macOS e Linux: aplicativos abertos pelo Dock ou pelo menu recebem um PATH mínimo; procura também onde os CLIs costumam ficar.
  if(process.platform!=='win32') for(const d of ['.local/bin','.claude/local','.npm-global/bin','.bun/bin','.volta/bin'])pastas.push(path.join(os.homedir(),d));
  if(process.platform!=='win32') pastas.push('/usr/local/bin','/opt/homebrew/bin','/usr/bin','/snap/bin');
  let shim:string|undefined;
  for(const d of pastas)for(const ext of process.platform==='win32'?['.exe','.cmd']:['']) {
    const exe=path.join(d,cliente+ext);
    try { if(fs.statSync(exe).isFile()) {if(ext==='.cmd')shim??=exe;else return {executable:exe,shim:false};} } catch { /* Próximo diretório explícito do PATH. */ }
  }
  return shim?{executable:shim,shim:true}:null;
}

// ── conectarIa ──
export function prepararConexao(p:Projeto,cliente:string,contrato?:string) {
  if(cliente!=='codex'&&cliente!=='claude')throw new Error('Use conectar codex ou conectar claude.');
  const nome=`prumo-${p.manifesto.id}-${hash(p.raiz).slice(0,8)}`;
  const server=fileURLToPath(new URL('../../mcp.js',import.meta.url));
  if(process.env.PRUMO_DATA_DIR)pastaAtividades(p); // valida destino externo, sem escrever
  const env:Record<string,string>={...(process.env.PRUMO_DATA_DIR?{PRUMO_DATA_DIR:process.env.PRUMO_DATA_DIR}:{})};
  // No aplicativo empacotado, process.execPath é o executável do Prumo (Electron), não um Node avulso:
  // este modo o faz comportar-se como Node puro para o servidor MCP, sem abrir janela.
  if(process.versions.electron)env.ELECTRON_RUN_AS_NODE='1';
  const configuracao={command:process.execPath,args:[server,p.raiz,...(contrato?[contrato]:[])],env};
  const ambiente=Object.entries(env).flatMap(([k,v])=>['--env',`${k}=${v}`]);
  const args=cliente==='codex'?['mcp','add',nome,...ambiente,'--',configuracao.command,...configuracao.args]:['mcp','add','--transport','stdio','--scope','user',nome,...ambiente,'--',configuracao.command,...configuracao.args];
  const instalado=localizarClienteDeIa(cliente);
  const destino=cliente==='codex'?path.join(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'),'config.toml'):path.join(os.homedir(),'.claude.json');
  return {client:cliente,name:nome,installed:!!instalado,executable:instalado?.executable??null,manualOnly:instalado?.shim??true,destination:destino,
    configuration:configuracao,args,command:comandoParaOTerminal(instalado?.executable??cliente,args),
    confirmation:`CONECTAR ${nome}`,connected:false,notice:'Configuração proposta; não comprova sessão ativa. Nenhum arquivo foi alterado.'};
}

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

/** Monta o comando de conexão para PowerShell (Windows) ou shell POSIX (macOS/Linux). */

/** As aspas escapam apóstrofos sem interpretar argumentos como comandos. */
const aspasDoPowershell = (texto: string) => "'" + texto.replaceAll("'", "''") + "'";

const aspasDoShell = (texto: string) => "'" + texto.replaceAll("'", "'\\''") + "'";

export function comandoParaOTerminal(executavel: string, args: string[], sistema: string = process.platform): string {
  if (sistema === 'win32') {
    return `& ${aspasDoPowershell(executavel)} ${args.map(aspasDoPowershell).join(' ')}`;
  }
  return [executavel, ...args].map(aspasDoShell).join(' ');
}
