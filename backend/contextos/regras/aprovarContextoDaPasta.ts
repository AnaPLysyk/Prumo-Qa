/** Aprova um contexto em nome da pessoa (depois da confirmação nativa). */
import { aprovarContexto } from './aprovarContexto.js';
import { abrirProjetoVinculado } from '../../projetos/regras/abrirProjetoVinculado.js';

export const aprovarContextoDaPasta = async (raiz: string, id: string, por: string) => aprovarContexto(await abrirProjetoVinculado(raiz), id, por);
