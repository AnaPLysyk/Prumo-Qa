/** Devolve a versão mais recente de um contexto. */
import { Arquivo } from '../tipos/contexto.js';

export const ultimaVersaoDoContexto = (a: Arquivo) => a.historico.at(-1)!;
