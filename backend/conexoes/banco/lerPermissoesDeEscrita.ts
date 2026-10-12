/** Lê em quais serviços a escrita foi habilitada por projeto (permissoes-servicos.json). */
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { Perm, permSchema } from '../tipos/operacoesExternas.js';

export const lerPermissoesDeEscrita = (b?: string) => lerLocal<Perm>('permissoes-servicos.json', permSchema, { version: 1, itens: [] }, b);
