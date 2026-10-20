/** Lista as operações externas de um projeto, da mais nova para a mais antiga. */
import { lerRegistroDeOperacoes } from './armazenamentoDeOperacoes.js';

export const listarOperacoes = (espacoId?: string, limite = 100, b?: string) => lerRegistroDeOperacoes(b).itens.filter(i => !espacoId || i.espacoId === espacoId).slice(-limite).reverse();
