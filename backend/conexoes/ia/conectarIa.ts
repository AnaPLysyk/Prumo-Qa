/** conectarIa: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hash } from "../../compartilhado/seguranca/hash.js";
import { semLinks } from "../../compartilhado/seguranca/semLinks.js";
import { Projeto } from "../../compartilhado/projeto/contratos.js";
import { pastaAtividades } from "../../logs/regras/iniciarAtividade.js";
import { spawnSync } from "node:child_process";
import { z } from "zod";

// --- conectarIa ---
// ── localizarClienteDeIa ──
export type ClienteDeChat='codex'|'claude'|'copilot'|'gemini';
export function localizarClienteDeIa(cliente:ClienteDeChat) {
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
  // CLIs instalados pelo npm (Copilot, Gemini) são um atalho .cmd que só chama um script Node ao lado: usa o script direto, sem shell.
  const scriptsDoNpm:Partial<Record<ClienteDeChat,string>>={copilot:path.join('node_modules','@github','copilot','npm-loader.js'),gemini:path.join('node_modules','@google','gemini-cli','bundle','gemini.js')};
  if(shim&&scriptsDoNpm[cliente]) {
    const script=path.join(path.dirname(shim),scriptsDoNpm[cliente]!);
    try { if(fs.statSync(script).isFile())return {executable:script,shim:false}; } catch { /* Instalação fora do padrão: continua só como atalho. */ }
  }
  return shim?{executable:shim,shim:true}:null;
}

/** No aplicativo empacotado process.execPath é o Electron; procura o node.exe real no PATH. */
export function nodeDoComputador() {
  if (!process.versions.electron) return process.execPath;
  const nome = process.platform === 'win32' ? 'node.exe' : 'node';
  return (process.env.PATH ?? '').split(path.delimiter).filter(d => path.isAbsolute(d)).map(d => path.join(d, nome)).find(c => { try { return fs.statSync(c).isFile(); } catch { return false; } }) ?? nome;
}

/** Como o cliente de IA inicia o servidor MCP do Prumo para uma pasta de projeto. */
export function configuracaoDoServidorMcp(raiz:string,contrato?:string) {
  const server=fileURLToPath(new URL('../../mcp.js',import.meta.url));
  const env:Record<string,string>={...(process.env.PRUMO_DATA_DIR?{PRUMO_DATA_DIR:process.env.PRUMO_DATA_DIR}:{})};
  // No aplicativo empacotado, process.execPath é o executável do Prumo (Electron), não um Node avulso:
  // este modo o faz comportar-se como Node puro para o servidor MCP, sem abrir janela.
  if(process.versions.electron)env.ELECTRON_RUN_AS_NODE='1';
  return {command:process.execPath,args:[server,raiz,...(contrato?[contrato]:[])],env};
}

// ── conectarIa ──
/** Arquivo em que cada cliente guarda os servidores MCP da pessoa (escopo de usuário, nunca o do projeto). */
function destinoDaConfiguracao(cliente:Cliente) {
  if(cliente==='codex')return path.join(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'),'config.toml');
  if(cliente==='claude')return path.join(os.homedir(),'.claude.json');
  if(cliente==='copilot')return path.join(os.homedir(),'.copilot','mcp-config.json');
  return path.join(os.homedir(),'.gemini','settings.json');
}

/** O "mcp add" de cada CLI: Codex e Claude pedem as opções antes do "--"; o Gemini recebe comando e argumentos soltos. */
function argumentosDeConexao(cliente:Cliente,nome:string,configuracao:ReturnType<typeof configuracaoDoServidorMcp>) {
  const ambiente=(opcao:string)=>Object.entries(configuracao.env).flatMap(([k,v])=>[opcao,`${k}=${v}`]);
  const servidor=[configuracao.command,...configuracao.args];
  if(cliente==='codex')return ['mcp','add',nome,...ambiente('--env'),'--',...servidor];
  if(cliente==='claude')return ['mcp','add','--transport','stdio','--scope','user',nome,...ambiente('--env'),'--',...servidor];
  if(cliente==='copilot')return ['mcp','add',...ambiente('--env'),nome,'--',...servidor];
  return ['mcp','add','--scope','user',...ambiente('-e'),nome,...servidor];
}

export function prepararConexao(p:Projeto,cliente:string,contrato?:string) {
  if(!clientes.includes(cliente as Cliente))throw new Error('Use conectar codex, claude, copilot ou gemini.');
  const c=cliente as Cliente;
  const nome=`prumo-${p.manifesto.id}-${hash(p.raiz).slice(0,8)}`;
  if(process.env.PRUMO_DATA_DIR)pastaAtividades(p); // valida destino externo, sem escrever
  const configuracao=configuracaoDoServidorMcp(p.raiz,contrato);
  const args=argumentosDeConexao(c,nome,configuracao);
  const instalado=localizarClienteDeIa(c);
  // CLI do npm (script .js): no terminal a pessoa usa o atalho .cmd; o PowerShell costuma bloquear o .ps1.
  const exibido=instalado?.executable.endsWith('.js')?(process.platform==='win32'?c+'.cmd':c):instalado?.executable??c;
  return {client:c,name:nome,installed:!!instalado,executable:instalado?.executable??null,manualOnly:instalado?.shim??true,destination:destinoDaConfiguracao(c),
    configuration:configuracao,args,command:comandoParaOTerminal(exibido,args),
    confirmation:`CONECTAR ${nome}`,connected:false,notice:'Configuração proposta; não comprova sessão ativa. Nenhum arquivo foi alterado.'};
}

/** Lê o JSON de configuração de um cliente sem seguir atalhos; arquivo ausente vale como vazio. */
export function lerConfiguracaoDoCliente(destino:string,limite=1024*1024):Record<string,unknown> {
  semLinks(destino);
  if(!fs.existsSync(destino))return {};
  const st=fs.lstatSync(destino);
  if(!st.isFile()||st.nlink!==1||st.size>limite)throw new Error('CONNECTION_INSPECTION_FAILED: configuração do cliente fora do formato esperado.');
  const dados=JSON.parse(fs.readFileSync(destino,'utf8'));
  if(!dados||typeof dados!=='object'||Array.isArray(dados))throw new Error('CONNECTION_INSPECTION_FAILED: configuração do cliente inválida.');
  return dados;
}

const opcoesDoCli={encoding:'utf8' as const,windowsHide:true,shell:false,timeout:15000,maxBuffer:1024*1024};

/** Scripts .js (CLIs do npm) rodam pelo Node do computador, sem shell. */
function executarCli(executavel:string,args:string[]) {
  return executavel.endsWith('.js')?spawnSync(nodeDoComputador(),[executavel,...args],opcoesDoCli):spawnSync(executavel,args,opcoesDoCli);
}

/** Nomes de servidores MCP que a pessoa já tem no cliente. Falha de leitura nunca equivale a "não existe". Não devolve conteúdo (pode conter env). */
function servidoresJaConfigurados(plano:Plano):string[] {
  if(plano.client==='codex') {
    const lista=executarCli(plano.executable!,['mcp','list','--json']);
    if(lista.error||lista.status!==0)throw new Error('CONNECTION_INSPECTION_FAILED: não foi possível conferir configurações existentes.');
    let servidores:unknown;try{servidores=JSON.parse(lista.stdout);}catch{throw new Error('CONNECTION_INSPECTION_FAILED: resposta inválida do cliente.');}
    if(!Array.isArray(servidores))throw new Error('CONNECTION_INSPECTION_FAILED: lista inválida.');
    return servidores.map(s=>String(s?.name));
  }
  let config:Record<string,unknown>;
  // O ~/.claude.json guarda também o histórico dos projetos e cresce com o uso.
  try{config=lerConfiguracaoDoCliente(plano.destination,plano.client==='claude'?16*1024*1024:1024*1024);}catch{throw new Error('CONNECTION_INSPECTION_FAILED: não foi possível conferir configurações existentes.');}
  const servidores=config.mcpServers;
  return servidores&&typeof servidores==='object'&&!Array.isArray(servidores)?Object.keys(servidores):[];
}

export function aplicarConexao(plano:Plano,confirmacao:string) {
  if(confirmacao!==plano.confirmation)return {configured:false,reason:'Confirmação não recebida; nenhuma alteração.'};
  if(!plano.executable||plano.manualOnly)return {configured:false,reason:'Use o comando exibido no terminal; cliente nativo não disponível.'};
  if(servidoresJaConfigurados(plano).includes(plano.name))return {configured:false,reason:'Configuração com esse nome já existe; preservada sem sobrescrita.',name:plano.name};
  const r=executarCli(plano.executable,plano.args);
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

// --- integracaoIa ---
export const clientes = ['codex', 'claude', 'copilot', 'gemini'] as const;

export type Cliente = typeof clientes[number];

export type Plano = ReturnType<typeof prepararConexao>;

export const tools = ['contexto_projeto', 'consultar_repositorio', 'revisar_cobertura', 'executar_validacao', 'consultar_evidencias', 'perguntar_ao_orquestrador', 'listar_politicas', 'propor_caso', 'propor_bug', 'propor_aprendizado'];

const digest = z.string().regex(/^[a-f0-9]{64}$/);

export const registroSchema = z.object({
  id: z.string().uuid(), client: z.enum(clientes), rootHash: digest, projectHash: digest, manifestHash: digest,
  configurationHash: digest, at: z.string().datetime(), durationMs: z.number().finite().nonnegative(),
  state: z.enum(['VALIDADO', 'ERRO']), code: z.enum(['PROTOCOL_OK', 'PROTOCOL_FAILED']),
  handshake: z.boolean(), tools: z.array(z.enum(tools as [string, ...string[]])).max(tools.length), read: z.boolean(),
  origin: z.literal('sdk-protocolo')
}).strict();

export type Registro = z.infer<typeof registroSchema>;

export const claudeConfigSchema=z.object({mcpServers:z.record(z.unknown()).default({}),projects:z.record(z.object({mcpServers:z.record(z.unknown()).default({}),disabledMcpjsonServers:z.array(z.string()).max(200).default([])}).passthrough()).default({})}).passthrough();
