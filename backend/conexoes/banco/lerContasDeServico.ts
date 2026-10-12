/** Lê as contas de serviço configuradas (contas.json), sem as credenciais. */
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { registro } from '../tipos/contaDeServico.js';

export const lerContasDeServico=(base?:string)=>lerLocal('contas.json',registro,{version:1,contas:[]},base);
