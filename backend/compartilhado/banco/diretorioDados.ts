/** Pasta de dados do Prumo neste computador (LOCALAPPDATA\PrumoQA ou PRUMO_DATA_DIR), sempre absoluta e sem atalhos. */
import os from 'node:os';
import path from 'node:path';
import { falharCom } from '../erros.js';
import { usuarioDoEscopo } from './escopoDeUsuario.js';

/** Pasta padrão de cada sistema: LOCALAPPDATA no Windows, Application Support no macOS e XDG (~/.local/share) no Linux. */
function pastaPadrao():string {
  if(process.platform==='win32') return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(),'AppData','Local'),'PrumoQA');
  if(process.platform==='darwin') return path.join(os.homedir(),'Library','Application Support','PrumoQA');
  return path.join(process.env.XDG_DATA_HOME && path.isAbsolute(process.env.XDG_DATA_HOME) ? process.env.XDG_DATA_HOME : path.join(os.homedir(),'.local','share'),'prumo-qa');
}

/** Diretório de dados do usuário (histórico, vínculos). PRUMO_DATA_DIR sobrepõe o padrão. */
export function diretorioBase():string {
  const dados=process.env.PRUMO_DATA_DIR ?? pastaPadrao();
  if(!path.isAbsolute(dados))falharCom('HISTORY_ABSOLUTE_PATH_REQUIRED');
  return dados;
}
/** Dados de trabalho separados pelo ID autenticado. Sem sessão, apenas escopo público vazio. */
export function diretorioDados(base?:string):string {
  if(base!==undefined){if(!path.isAbsolute(base))falharCom('HISTORY_ABSOLUTE_PATH_REQUIRED');return base;}
  return path.join(diretorioBase(),'usuarios',usuarioDoEscopo() ?? 'sem-sessao');
}
