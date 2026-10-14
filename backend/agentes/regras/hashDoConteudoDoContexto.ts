/** Calcula a impressão digital do conteúdo de um contexto (tipo, título, texto, chave e origem). */
import { hash } from '../../compartilhado/seguranca/hash.js';
import { Conteudo } from '../tipos/contexto.js';

export const hashDoConteudoDoContexto = (c: Conteudo) => hash(JSON.stringify([c.tipo, c.titulo, c.texto, c.chave ?? null, c.origem.tipo, c.origem.referencia]));
