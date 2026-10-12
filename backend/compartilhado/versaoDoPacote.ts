/** Versão instalada do Prumo, lida do package.json. */
import { readFileSync } from 'node:fs';

export const versaoDoPacote:string=JSON.parse(readFileSync(new URL('../../package.json',import.meta.url),'utf8')).version;
