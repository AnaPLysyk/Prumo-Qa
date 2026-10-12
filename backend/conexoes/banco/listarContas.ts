/** Lista as contas de serviço configuradas. */
import { lerContasDeServico } from './lerContasDeServico.js';

export const listarContas=(base?:string)=>lerContasDeServico(base).contas;
