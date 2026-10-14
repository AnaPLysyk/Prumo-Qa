/** Cria um contexto novo em rascunho. */
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { carregarTodosOsContextos } from '../banco/carregarTodosOsContextos.js';
import { gravarArquivoDeContexto } from '../banco/gravarArquivoDeContexto.js';
import { pastaContextos } from '../banco/pastaContextos.js';
import { novaVersaoDoContexto } from './novaVersaoDoContexto.js';
import { obterContexto } from './obterContexto.js';
import { Arquivo, conteudoSchema, limites } from '../tipos/contexto.js';

export function criarContexto(p: Projeto, entrada: unknown, por: string, opcoes: { substitui?: string } = {}, base?: string) {
  const c = conteudoSchema.parse(entrada); const dir = pastaContextos(p, base);
  if (carregarTodosOsContextos(p, base).itens.length >= limites.contextos) throw new ErroQa('CONTEXT_LIMIT', `Limite de ${limites.contextos} contextos por projeto.`);
  const id = randomUUID(); const arq: Arquivo = { schema: 1, id, projectId: hash(p.manifesto.id), ...(opcoes.substitui ? { substitui: opcoes.substitui } : {}), historico: [novaVersaoDoContexto('criado', 'RASCUNHO', c, por, null)] };
  gravarArquivoDeContexto(path.join(dir, id + '.json'), arq); return obterContexto(p, id, base);
}
