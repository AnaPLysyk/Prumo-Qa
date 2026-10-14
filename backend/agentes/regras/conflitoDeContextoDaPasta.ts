/** Marca um conflito entre dois contextos ou resolve o conflito marcado. */
import { marcarConflito } from './marcarConflito.js';
import { resolverConflito } from './resolverConflito.js';
import { abrirProjetoVinculado } from '../../projetos/regras/abrirProjetoVinculado.js';

export const conflitoDeContextoDaPasta = async (raiz: string, id: string, por: string, outroId?: string) => (outroId ? marcarConflito(await abrirProjetoVinculado(raiz), id, outroId, por) : resolverConflito(await abrirProjetoVinculado(raiz), id, por));
