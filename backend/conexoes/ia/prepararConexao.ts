/** Monta a proposta de configuração do servidor MCP do Prumo para o Codex ou o Claude (nome, destino e comando), sem alterar nada. */
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { aspasDoPowershell } from './aspasDoPowershell.js';
import { localizarClienteDeIa } from './localizarClienteDeIa.js';
import { pastaAtividades } from '../../logs/banco/pastaAtividades.js';

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
    configuration:configuracao,args,command:`& ${aspasDoPowershell(instalado?.executable??cliente)} ${args.map(aspasDoPowershell).join(' ')}`,
    confirmation:`CONECTAR ${nome}`,connected:false,notice:'Configuração proposta; não comprova sessão ativa. Nenhum arquivo foi alterado.'};
}
