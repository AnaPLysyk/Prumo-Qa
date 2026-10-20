/** Salva um contexto: cria, edita (nova versão em rascunho) ou substitui por outro. */

import { abrirProjetoVinculado } from '../../projetos/regras/abrirProjetoVinculado.js';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { mudarContexto } from '../banco/mudarContexto.js';
import { novaVersaoDoContexto } from './novaVersaoDoContexto.js';
import { obterContexto } from './obterContexto.js';
import { ultimaVersaoDoContexto } from './ultimaVersaoDoContexto.js';
import { hashDoConteudoDoContexto } from './hashDoConteudoDoContexto.js';
import { Arquivo, conteudoSchema, limites } from '../tipos/contexto.js';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { carregarTodosOsContextos } from '../banco/carregarTodosOsContextos.js';
import { gravarArquivoDeContexto } from '../banco/gravarArquivoDeContexto.js';
import { pastaContextos } from '../banco/pastaContextos.js';

function criarContexto(p: Projeto, entrada: unknown, por: string, opcoes: { substitui?: string } = {}, base?: string) {
  const c = conteudoSchema.parse(entrada); const dir = pastaContextos(p, base);
  if (carregarTodosOsContextos(p, base).itens.length >= limites.contextos) throw new ErroQa('CONTEXT_LIMIT', `Limite de ${limites.contextos} contextos por projeto.`);
  const id = randomUUID(); const arq: Arquivo = { schema: 1, id, projectId: hash(p.manifesto.id), ...(opcoes.substitui ? { substitui: opcoes.substitui } : {}), historico: [novaVersaoDoContexto('criado', 'RASCUNHO', c, por, null)] };
  gravarArquivoDeContexto(path.join(dir, id + '.json'), arq); return obterContexto(p, id, base);
}

function editarContexto(p: Projeto, id: string, parcial: unknown, por: string, base?: string) {
  return mudarContexto(p, id, (a) => {
    const u = ultimaVersaoDoContexto(a); if (u.estado === 'DESATUALIZADO') throw new ErroQa('CONTEXT_OUTDATED', 'Contexto desatualizado não é editado: crie uma versão substituta.');
    const c = conteudoSchema.parse({ ...u.conteudo, ...(parcial as object) });
    if (hashDoConteudoDoContexto(c) === u.conteudoHash) throw new ErroQa('CONTEXT_NO_CHANGE', 'Nenhuma alteração de conteúdo.');
    return novaVersaoDoContexto('editado', 'RASCUNHO', c, por, u); // editar sempre invalida a aprovação anterior
  }, base);
}

/** Nova versão que substitui outra: o antigo vira DESATUALIZADO; o novo começa RASCUNHO e precisa de nova aprovação. */
function substituirContexto(p: Projeto, id: string, entrada: unknown, por: string, base?: string) {
  const antigo = obterContexto(p, id, base); if (antigo.estadoRegistrado === 'DESATUALIZADO') throw new ErroQa('CONTEXT_OUTDATED', 'Já está desatualizado.');
  const novoCtx = criarContexto(p, entrada, por, { substitui: id }, base);
  mudarContexto(p, id, (a) => { const u = ultimaVersaoDoContexto(a); return novaVersaoDoContexto('substituido', 'DESATUALIZADO', u.conteudo, por, u, { substituidoPor: novoCtx.id }); }, base);
  return { anterior: obterContexto(p, id, base), novo: obterContexto(p, novoCtx.id, base) }; // releitura: o estado efetivo muda quando o antigo vira DESATUALIZADO
}

export const salvarContextoDaPasta = async (raiz: string, a: { id?: string; substituir?: boolean; dados: unknown }, por: string) => {
  const p = await abrirProjetoVinculado(raiz);
  if (!a.id) return criarContexto(p, a.dados, por);
  return a.substituir ? substituirContexto(p, a.id, a.dados, por) : editarContexto(p, a.id, a.dados, por);
};
