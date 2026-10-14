/** Marca um contexto como desatualizado. */
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { mudarContexto } from '../banco/mudarContexto.js';
import { novaVersaoDoContexto } from './novaVersaoDoContexto.js';
import { ultimaVersaoDoContexto } from './ultimaVersaoDoContexto.js';

export const desatualizarContexto = (p: Projeto, id: string, por: string, base?: string) => mudarContexto(p, id, (a) => { const u = ultimaVersaoDoContexto(a); if (u.estado === 'DESATUALIZADO') throw new ErroQa('CONTEXT_NO_CHANGE', 'Já está desatualizado.'); return novaVersaoDoContexto('desatualizado', 'DESATUALIZADO', u.conteudo, por, u); }, base);
