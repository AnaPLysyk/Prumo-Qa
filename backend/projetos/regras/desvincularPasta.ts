/** Desvincula uma pasta de projeto (nada é apagado nela). */
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { removerVinculo } from './removerVinculo.js';

export const desvincularPasta = (raiz: string) => removerVinculo(raiz, diretorioDados());
