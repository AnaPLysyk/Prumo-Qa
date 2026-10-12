/** Edita um contexto criando uma nova versão em rascunho (a aprovação anterior deixa de valer). */
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { mudarContexto } from '../banco/mudarContexto.js';
import { hashDoConteudoDoContexto } from './hashDoConteudoDoContexto.js';
import { novaVersaoDoContexto } from './novaVersaoDoContexto.js';
import { ultimaVersaoDoContexto } from './ultimaVersaoDoContexto.js';
import { conteudoSchema } from '../tipos/contexto.js';

export function editarContexto(p: Projeto, id: string, parcial: unknown, por: string, base?: string) {
  return mudarContexto(p, id, (a) => {
    const u = ultimaVersaoDoContexto(a); if (u.estado === 'DESATUALIZADO') throw new ErroQa('CONTEXT_OUTDATED', 'Contexto desatualizado não é editado: crie uma versão substituta.');
    const c = conteudoSchema.parse({ ...u.conteudo, ...(parcial as object) });
    if (hashDoConteudoDoContexto(c) === u.conteudoHash) throw new ErroQa('CONTEXT_NO_CHANGE', 'Nenhuma alteração de conteúdo.');
    return novaVersaoDoContexto('editado', 'RASCUNHO', c, por, u); // editar sempre invalida a aprovação anterior
  }, base);
}
