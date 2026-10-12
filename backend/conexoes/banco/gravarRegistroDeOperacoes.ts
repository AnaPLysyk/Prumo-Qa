/** Grava o registro das operações externas, guardando as 1.500 últimas. */
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { Razao, razaoSchema } from '../tipos/operacoesExternas.js';

export const gravarRegistroDeOperacoes = (r: Razao, b?: string) => { if (r.itens.length > 1500) r.itens = r.itens.slice(-1500); gravarLocal('operacoes-externas.json', razaoSchema.parse(r), b); };
