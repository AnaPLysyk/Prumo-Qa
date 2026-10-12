/** Desvincula uma pasta de projeto (nada é apagado nela). */
import { pastaDeDadosEscolhida } from '../../compartilhado/banco/pastaDeDadosEscolhida.js';
import { removerVinculo } from './removerVinculo.js';

export const desvincularPasta = (raiz: string) => removerVinculo(raiz, pastaDeDadosEscolhida());
