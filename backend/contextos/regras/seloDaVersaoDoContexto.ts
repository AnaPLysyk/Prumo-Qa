/** Calcula o selo de uma versão do contexto, encadeado com a versão anterior, para detectar edições fora do Prumo. */
import { hash } from '../../compartilhado/seguranca/hash.js';
import { Entrada } from '../tipos/contexto.js';

export const seloDaVersaoDoContexto = (e: Omit<Entrada, 'selo'>) => hash(JSON.stringify([e.anterior, e.conteudoHash, e.acao, e.estado, e.em, e.por, e.versao, e.detalhe ?? null]));
