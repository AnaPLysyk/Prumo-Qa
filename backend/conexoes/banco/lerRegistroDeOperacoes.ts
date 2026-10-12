/** Lê o registro de todas as operações externas (operacoes-externas.json). */
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { Razao, razaoSchema } from '../tipos/operacoesExternas.js';

export const lerRegistroDeOperacoes = (b?: string) => lerLocal<Razao>('operacoes-externas.json', razaoSchema, { version: 1, itens: [] }, b);
