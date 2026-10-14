/** Exclui um contexto de vez (fica só o registro de que existiu). */
import { excluirContexto } from '../banco/excluirContexto.js';
import { abrirProjetoVinculado } from '../../projetos/regras/abrirProjetoVinculado.js';

export const excluirContextoDaPasta = async (raiz: string, id: string) => excluirContexto(await abrirProjetoVinculado(raiz), id);
