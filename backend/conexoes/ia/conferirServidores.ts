/** Conta quantos servidores MCP configurados no cliente apontam para este Prumo e este projeto. */

import { mesmoCaminho } from './mesmoCaminho.js';
import { Plano } from '../tipos/integracaoIa.js';
import fs from 'node:fs';
import path from 'node:path';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';

function comandoEhNodeDoPrumo(command:unknown) {
  if(typeof command!=='string')return false;
  const exe=process.platform==='win32'?'node.exe':'node';
  const candidatos=(process.env.PATH??'').split(path.delimiter).filter(d=>path.isAbsolute(d)).map(d=>path.join(d,exe));
  if(path.basename(process.execPath).toLowerCase()===exe)candidatos.unshift(process.execPath);
  return candidatos.some(alvo=>{
    if(command!==exe&&command!=='node'&&!mesmoCaminho(command,alvo))return false;
    try{semLinks(alvo);return fs.lstatSync(alvo).isFile();}catch{return false;}
  });
}


/** Projeta somente metadados conhecidos. Nunca devolve env, tokens ou conteúdo da configuração do cliente. */
export function conferirServidores(plano: Plano, servidores: unknown) {
  if (!Array.isArray(servidores) || servidores.length > 200) throw new Error('CONNECTION_INSPECTION_FAILED');
  const compatíveis = servidores.filter(s => {
    if (!s || typeof s !== 'object' || (s.enabled!==undefined&&s.enabled!==true)) return false;
    const c = s.transport ?? s;
    const env = c.env ?? s.env ?? {};
    const nativo=comandoEhNodeDoPrumo(c.command);
    return (c.type===undefined||c.type==='stdio')&&!c.url&&(mesmoCaminho(c.command, plano.configuration.command)||nativo) &&
      Array.isArray(c.args) && c.args.length === plano.configuration.args.length &&
      c.args.every((v: unknown, i: number) => mesmoCaminho(v, plano.configuration.args[i]!)) &&
      env && typeof env === 'object' && !Array.isArray(env) &&
      Object.keys(env).every(k => ['PRUMO_DATA_DIR', 'ELECTRON_RUN_AS_NODE'].includes(k)) &&
      env.PRUMO_DATA_DIR===plano.configuration.env.PRUMO_DATA_DIR &&
      (nativo ? env.ELECTRON_RUN_AS_NODE===undefined||env.ELECTRON_RUN_AS_NODE==='1' : env.ELECTRON_RUN_AS_NODE===plano.configuration.env.ELECTRON_RUN_AS_NODE);
  });
  return { found: compatíveis.length > 0, matches: compatíveis.length };
}
