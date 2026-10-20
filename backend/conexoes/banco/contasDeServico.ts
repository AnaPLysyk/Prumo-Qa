/** Consulta contas de serviços vinculadas sem expor as credenciais armazenadas. */
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { registro } from '../tipos/contaDeServico.js';

export const lerContasDeServico = (base?: string) =>
  lerLocal('contas.json', registro, { version: 1, contas: [] }, base);

export const listarContas = (base?: string) =>
  lerContasDeServico(base).contas;
