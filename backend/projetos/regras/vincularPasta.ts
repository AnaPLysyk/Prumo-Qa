/** Vincula uma pasta de projeto usando a pasta de dados escolhida. */
import { pastaDeDadosEscolhida } from '../../compartilhado/banco/pastaDeDadosEscolhida.js';
import { adicionarVinculo } from './adicionarVinculo.js';

export const vincularPasta = (raiz: string) => adicionarVinculo(raiz, pastaDeDadosEscolhida());
