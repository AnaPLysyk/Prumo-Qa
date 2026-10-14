/** Lista os contextos de uma pasta vinculada para a tela Contextos. */
import { listarContextos } from './listarContextos.js';
import { Filtro } from '../tipos/contexto.js';
import { abrirProjetoVinculado } from '../../projetos/regras/abrirProjetoVinculado.js';

export const listarContextosDaPasta = async (raiz: string, filtro: Filtro = {}) => listarContextos(await abrirProjetoVinculado(raiz), filtro);
