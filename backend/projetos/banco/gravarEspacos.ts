/** Grava os projetos do Prumo em espacos.json depois de conferir o formato. */
import { z } from 'zod';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { registro } from '../tipos/espacos.js';

export const gravarEspacos=(r:z.infer<typeof registro>,base?:string)=>gravarLocal('espacos.json',registro.parse(r),base);
