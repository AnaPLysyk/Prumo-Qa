/** Pasta de dados do Prumo neste computador (LOCALAPPDATA\PrumoQA ou PRUMO_DATA_DIR), sempre absoluta e sem atalhos. */
import os from 'node:os';
import path from 'node:path';
import { falharCom } from '../erros/falharCom.js';

/** Diretório de dados do usuário (histórico, vínculos). PRUMO_DATA_DIR sobrepõe o padrão. */
export function diretorioDados(base=process.env.PRUMO_DATA_DIR):string {
  const padrao=process.platform==='win32' ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(),'AppData','Local'),'PrumoQA') : path.join(os.homedir(),'.local','share','prumo-qa');
  const dados=base ?? padrao;
  if(!path.isAbsolute(dados))falharCom('HISTORY_ABSOLUTE_PATH_REQUIRED');
  return dados;
}
