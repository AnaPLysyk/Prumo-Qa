/** Lista as pastas de projeto vinculadas para a tela Projetos. */
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { listarVinculos } from './listarVinculos.js';

export const listarPastasVinculadas = () => listarVinculos(diretorioDados());
