/** Resolve o conflito marcado, voltando o contexto para rascunho. */
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { mudarContexto } from '../banco/mudarContexto.js';
import { novaVersaoDoContexto } from './novaVersaoDoContexto.js';
import { ultimaVersaoDoContexto } from './ultimaVersaoDoContexto.js';

export const resolverConflito = (p: Projeto, id: string, por: string, base?: string) => mudarContexto(p, id, (a) => { const u = ultimaVersaoDoContexto(a); return novaVersaoDoContexto('conflito_resolvido', 'RASCUNHO', u.conteudo, por, u); }, base);
