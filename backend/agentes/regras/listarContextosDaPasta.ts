/** Lista os contextos de uma pasta vinculada para a tela Contextos. */

import { Filtro } from '../tipos/contexto.js';
import { abrirProjetoVinculado } from '../../projetos/servicoProjetos.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { carregarTodosOsContextos } from '../banco/carregarTodosOsContextos.js';
import { lerPermissaoDeContextosNoMcp } from '../banco/permissoesDeContexto.js';
import { resumirContextos } from './resumirContextos.js';
import { ultimaVersaoDoContexto } from './versoesDoContexto.js';

function listarContextos(p: Projeto, filtro: Filtro = {}, base?: string) {
  const { itens, problemas } = carregarTodosOsContextos(p, base); const termo = filtro.busca?.trim().toLowerCase();
  const textos = new Map(itens.map(i => [i.arq.id, `${ultimaVersaoDoContexto(i.arq).conteudo.titulo}\n${ultimaVersaoDoContexto(i.arq).conteudo.texto}\n${ultimaVersaoDoContexto(i.arq).conteudo.chave ?? ''}`.toLowerCase()]));
  const todos = resumirContextos(itens).filter(r => (!filtro.tipo || r.tipo === filtro.tipo) && (!filtro.estado || r.estado === filtro.estado) && (!filtro.chave || r.chave === filtro.chave) && (!termo || textos.get(r.id)!.includes(termo)));
  return { contextos: todos.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm)), total: itens.length, problemas, disponibilizarAoMcp: lerPermissaoDeContextosNoMcp(p, base).disponibilizarAoMcp };
}


export const listarContextosDaPasta = async (raiz: string, filtro: Filtro = {}) => listarContextos(await abrirProjetoVinculado(raiz), filtro);
