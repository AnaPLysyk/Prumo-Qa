/** Lista as pastas de projeto vinculadas para a tela Projetos. */
import { pastaDeDadosEscolhida } from '../../compartilhado/banco/pastaDeDadosEscolhida.js';
import { listarVinculos } from './listarVinculos.js';

export const listarPastasVinculadas = () => listarVinculos(pastaDeDadosEscolhida());
