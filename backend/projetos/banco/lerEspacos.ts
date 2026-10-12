/** Lê os projetos do Prumo gravados em espacos.json. */
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { registro } from '../tipos/espacos.js';

export const lerEspacos=(base?:string)=>lerLocal('espacos.json',registro,{version:1,espacos:[]},base);
