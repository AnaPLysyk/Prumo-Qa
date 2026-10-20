/** Marca um conflito entre dois contextos ou resolve o conflito marcado. */


import { abrirProjetoVinculado } from '../../projetos/servicoProjetos.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { mudarContexto } from '../banco/mudarContexto.js';
import { novaVersaoDoContexto } from './versoesDoContexto.js';
import { ultimaVersaoDoContexto } from './versoesDoContexto.js';
import { ErroQa } from '../../compartilhado/erros.js';
import { obterContexto } from './obterContexto.js';

function marcarConflito(p: Projeto, id: string, outroId: string, por: string, base?: string) {
  if (id === outroId) throw new ErroQa('CONTEXT_CONFLICT', 'Um contexto não conflita consigo mesmo.'); obterContexto(p, outroId, base);
  return mudarContexto(p, id, (a) => { const u = ultimaVersaoDoContexto(a); if (u.estado === 'DESATUALIZADO') throw new ErroQa('CONTEXT_OUTDATED', 'Contexto desatualizado não entra em conflito.'); return novaVersaoDoContexto('conflito', 'CONFLITANTE', u.conteudo, por, u, { outroId }); }, base);
}


const resolverConflito = (p: Projeto, id: string, por: string, base?: string) => mudarContexto(p, id, (a) => { const u = ultimaVersaoDoContexto(a); return novaVersaoDoContexto('conflito_resolvido', 'RASCUNHO', u.conteudo, por, u); }, base);


export const conflitoDeContextoDaPasta = async (raiz: string, id: string, por: string, outroId?: string) => (outroId ? marcarConflito(await abrirProjetoVinculado(raiz), id, outroId, por) : resolverConflito(await abrirProjetoVinculado(raiz), id, por));
