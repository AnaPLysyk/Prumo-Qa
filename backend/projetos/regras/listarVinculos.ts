/** Lista as pastas vinculadas com a situação atual de cada uma. */
import { lerPastasVinculadas } from '../banco/pastasVinculadas.js';
import { situacaoProjeto } from './situacaoProjeto.js';

export async function listarVinculos(base?: string) {
  return Promise.all(lerPastasVinculadas(base).map(async v => ({ ...(await situacaoProjeto(v.root)), addedAt: v.addedAt })));
}
