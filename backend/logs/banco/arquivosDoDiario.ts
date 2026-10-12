/** Lista os arquivos do diário de uma pasta, com limite de 10.000. */
import fs from 'node:fs';
import { falharCom } from '../../compartilhado/erros/falharCom.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { limitesHistorico } from '../tipos/atividade.js';

export function arquivosDoDiario(pasta:string):string[] {
  semLinks(pasta);
  try {
    const arquivos=fs.readdirSync(pasta).filter(n=>/^[a-f0-9-]{36}\.jsonl$/.test(n));
    if(arquivos.length>limitesHistorico.arquivos)falharCom('HISTORY_FILE_LIMIT');
    return arquivos;
  } catch(e) { if((e as NodeJS.ErrnoException).code==='ENOENT')return [];throw e; }
}
