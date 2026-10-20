/** Aprova um contexto em nome da pessoa (depois da confirmação nativa). */

import { abrirProjetoVinculado } from '../../projetos/servicoProjetos.js';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { mudarContexto } from '../banco/mudarContexto.js';
import { novaVersaoDoContexto } from './versoesDoContexto.js';
import { obterContexto } from './obterContexto.js';
import { ultimaVersaoDoContexto } from './versoesDoContexto.js';

/** Aprovação: ação humana, só vale para o conteúdo exato aprovado. Exige origem e ausência de conflito. */
function aprovarContexto(p: Projeto, id: string, por: string, base?: string) {
  const antes = obterContexto(p, id, base);
  if (antes.estadoRegistrado === 'DESATUALIZADO') throw new ErroQa('CONTEXT_OUTDATED', 'Contexto desatualizado não pode ser aprovado.');
  if (!antes.origem.referencia.trim()) throw new ErroQa('CONTEXT_SOURCE_REQUIRED', 'Informe a origem (documento, pessoa ou decisão) antes de aprovar.');
  if (antes.estado === 'CONFLITANTE') throw new ErroQa('CONTEXT_CONFLICT', 'Há conflito com outro contexto: esclareça e marque o conteúdo superado como desatualizado antes de aprovar.');
  if (antes.estadoRegistrado === 'APROVADO') throw new ErroQa('CONTEXT_NO_CHANGE', 'Este conteúdo já está aprovado.');
  return mudarContexto(p, id, (a) => novaVersaoDoContexto('aprovado', 'APROVADO', ultimaVersaoDoContexto(a).conteudo, por, ultimaVersaoDoContexto(a)), base);
}


export const aprovarContextoDaPasta = async (raiz: string, id: string, por: string) => aprovarContexto(await abrirProjetoVinculado(raiz), id, por);
