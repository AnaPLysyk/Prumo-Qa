/** Abre um contexto com o histórico completo para a tela Contextos. */
import { obterContexto } from './obterContexto.js';
import { abrirProjetoVinculado } from '../../projetos/regras/abrirProjetoVinculado.js';

export const obterContextoDaPasta = async (raiz: string, id: string) => obterContexto(await abrirProjetoVinculado(raiz), id);
