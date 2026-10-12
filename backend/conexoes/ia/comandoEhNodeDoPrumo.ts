/** Diz se o comando configurado no cliente de IA é o node deste computador ou o próprio Prumo. */
import fs from 'node:fs';
import path from 'node:path';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { mesmoCaminho } from './mesmoCaminho.js';

export function comandoEhNodeDoPrumo(command:unknown) {
  if(typeof command!=='string')return false;
  const exe=process.platform==='win32'?'node.exe':'node';
  const candidatos=(process.env.PATH??'').split(path.delimiter).filter(d=>path.isAbsolute(d)).map(d=>path.join(d,exe));
  if(path.basename(process.execPath).toLowerCase()===exe)candidatos.unshift(process.execPath);
  return candidatos.some(alvo=>{
    if(command!==exe&&command!=='node'&&!mesmoCaminho(command,alvo))return false;
    try{semLinks(alvo);return fs.lstatSync(alvo).isFile();}catch{return false;}
  });
}
