/** Abre o contrato de uma pasta vinculada usando a pasta de dados escolhida. */
import { pastaDeDadosEscolhida } from '../../compartilhado/banco/pastaDeDadosEscolhida.js';
import { projetoVinculado } from './projetoVinculado.js';

export const abrirProjetoVinculado = (raiz: string) => projetoVinculado(raiz, pastaDeDadosEscolhida());
