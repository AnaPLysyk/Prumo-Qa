/** Abre o contrato de uma pasta vinculada usando a pasta de dados escolhida. */
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { projetoVinculado } from './projetoVinculado.js';

export const abrirProjetoVinculado = (raiz: string) => projetoVinculado(raiz, diretorioDados());
