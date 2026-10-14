/** Marca um contexto como desatualizado (deixa de valer). */
import { desatualizarContexto } from './desatualizarContexto.js';
import { abrirProjetoVinculado } from '../../projetos/regras/abrirProjetoVinculado.js';

export const desatualizarContextoDaPasta = async (raiz: string, id: string, por: string) => desatualizarContexto(await abrirProjetoVinculado(raiz), id, por);
