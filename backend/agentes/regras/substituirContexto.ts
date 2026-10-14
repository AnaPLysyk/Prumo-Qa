/** Cria um contexto novo que substitui o antigo, e marca o antigo como desatualizado. */
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { mudarContexto } from '../banco/mudarContexto.js';
import { criarContexto } from './criarContexto.js';
import { novaVersaoDoContexto } from './novaVersaoDoContexto.js';
import { obterContexto } from './obterContexto.js';
import { ultimaVersaoDoContexto } from './ultimaVersaoDoContexto.js';

/** Nova versão que substitui outra: o antigo vira DESATUALIZADO; o novo começa RASCUNHO e precisa de nova aprovação. */
export function substituirContexto(p: Projeto, id: string, entrada: unknown, por: string, base?: string) {
  const antigo = obterContexto(p, id, base); if (antigo.estadoRegistrado === 'DESATUALIZADO') throw new ErroQa('CONTEXT_OUTDATED', 'Já está desatualizado.');
  const novoCtx = criarContexto(p, entrada, por, { substitui: id }, base);
  mudarContexto(p, id, (a) => { const u = ultimaVersaoDoContexto(a); return novaVersaoDoContexto('substituido', 'DESATUALIZADO', u.conteudo, por, u, { substituidoPor: novoCtx.id }); }, base);
  return { anterior: obterContexto(p, id, base), novo: obterContexto(p, novoCtx.id, base) }; // releitura: o estado efetivo muda quando o antigo vira DESATUALIZADO
}
