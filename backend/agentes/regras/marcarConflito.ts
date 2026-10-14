/** Marca que um contexto conflita com outro. */
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { mudarContexto } from '../banco/mudarContexto.js';
import { novaVersaoDoContexto } from './novaVersaoDoContexto.js';
import { obterContexto } from './obterContexto.js';
import { ultimaVersaoDoContexto } from './ultimaVersaoDoContexto.js';

export function marcarConflito(p: Projeto, id: string, outroId: string, por: string, base?: string) {
  if (id === outroId) throw new ErroQa('CONTEXT_CONFLICT', 'Um contexto não conflita consigo mesmo.'); obterContexto(p, outroId, base);
  return mudarContexto(p, id, (a) => { const u = ultimaVersaoDoContexto(a); if (u.estado === 'DESATUALIZADO') throw new ErroQa('CONTEXT_OUTDATED', 'Contexto desatualizado não entra em conflito.'); return novaVersaoDoContexto('conflito', 'CONFLITANTE', u.conteudo, por, u, { outroId }); }, base);
}
