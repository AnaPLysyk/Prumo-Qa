/** Erro de serviço externo com código fixo (sem permissão, limite de consultas, tempo esgotado...). */
import { codigosServico } from '../tipos/transporte.js';

/** `detalhe`: motivo curto e mascarado que o próprio serviço deu ao recusar (400/422), para a pessoa saber o que corrigir. */
export class ErroServico extends Error{constructor(public codigo:typeof codigosServico[number],public retryAfter?:string,public detalhe?:string){super(codigo);}}
