/** Consulta contas de serviços vinculadas sem expor as credenciais armazenadas. */
import { lerLocal, gravarLocal } from '../../compartilhado/banco/persistenciaLocal.js';
import { registro } from '../tipos/contaDeServico.js';

export const lerContasDeServico = (base?: string) =>
  lerLocal('contas.json', registro, { version: 1, contas: [] }, base);

export const listarContas = (base?: string) =>
  lerContasDeServico(base).contas;

/** Grava o cadastro das contas vinculadas, nunca os tokens do cofre. */
export const gravarContasDeServico = (dados: ReturnType<typeof lerContasDeServico>, base?: string) =>
  gravarLocal("contas.json", dados, base);
