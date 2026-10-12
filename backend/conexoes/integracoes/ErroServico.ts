/** Erro de serviço externo com código fixo (sem permissão, limite de consultas, tempo esgotado...). */
import { codigosServico } from '../tipos/transporte.js';

export class ErroServico extends Error{constructor(public codigo:typeof codigosServico[number],public retryAfter?:string){super(codigo);}}
