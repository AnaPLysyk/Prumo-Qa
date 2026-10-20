/** Marca um contexto como desatualizado (deixa de valer). */

import { abrirProjetoVinculado } from '../../projetos/regras/abrirProjetoVinculado.js';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { mudarContexto } from '../banco/mudarContexto.js';
import { novaVersaoDoContexto } from './novaVersaoDoContexto.js';
import { ultimaVersaoDoContexto } from './ultimaVersaoDoContexto.js';

const desatualizarContexto = (p: Projeto, id: string, por: string, base?: string) => mudarContexto(p, id, (a) => { const u = ultimaVersaoDoContexto(a); if (u.estado === 'DESATUALIZADO') throw new ErroQa('CONTEXT_NO_CHANGE', 'Já está desatualizado.'); return novaVersaoDoContexto('desatualizado', 'DESATUALIZADO', u.conteudo, por, u); }, base);


export const desatualizarContextoDaPasta = async (raiz: string, id: string, por: string) => desatualizarContexto(await abrirProjetoVinculado(raiz), id, por);
