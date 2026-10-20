/** cicloDosContextos: fluxo completo por responsabilidade. */
import { randomUUID } from "node:crypto";
import path from "node:path";
import { excluirContexto, gravarPermissaoDeContextosNoMcp, carregarTodosOsContextos, gravarArquivoDeContexto, pastaContextos, carregarContexto } from "../banco/contextos.js";
import { abrirProjetoVinculado } from "../../projetos/servicoProjetos.js";
import { obterContexto } from "./consultasDeContextos.js";
import { ErroQa } from "../../compartilhado/erros.js";
import { Projeto } from "../../compartilhado/projeto/contratos.js";
import { novaVersaoDoContexto, ultimaVersaoDoContexto, hashDoConteudoDoContexto } from "./validacoesDeContexto.js";
import { Arquivo, conteudoSchema, limites, Entrada } from "../tipos/contexto.js";
import { hash } from "../../compartilhado/seguranca/hash.js";

// cicloDosContextos
/** Ações da tela: recebem a pasta vinculada e só depois consultam o contexto local. */
export const excluirContextoDaPasta = async (raiz: string, id: string) =>
  excluirContexto(await abrirProjetoVinculado(raiz), id);

export const obterContextoDaPasta = async (raiz: string, id: string) =>
  obterContexto(await abrirProjetoVinculado(raiz), id);

export const permitirContextosNoMcp = async (raiz: string, habilitar: boolean) =>
  gravarPermissaoDeContextosNoMcp(await abrirProjetoVinculado(raiz), habilitar);

/** Desatualizar mantém a versão histórica, sem apagar conteúdo que já foi aprovado. */
function desatualizarContexto(projeto: Projeto, id: string, por: string, base?: string) {
  return mudarContexto(projeto, id, arquivo => {
    const ultima = ultimaVersaoDoContexto(arquivo);
    if (ultima.estado === 'DESATUALIZADO') {
      throw new ErroQa('CONTEXT_NO_CHANGE', 'Já está desatualizado.');
    }
    return novaVersaoDoContexto('desatualizado', 'DESATUALIZADO', ultima.conteudo, por, ultima);
  }, base);
}

export const desatualizarContextoDaPasta = async (raiz: string, id: string, por: string) =>
  desatualizarContexto(await abrirProjetoVinculado(raiz), id, por);

/** Marca conflitos apenas entre dois contextos distintos e existentes no mesmo projeto. */
function marcarConflito(projeto: Projeto, id: string, outroId: string, por: string, base?: string) {
  if (id === outroId) {
    throw new ErroQa('CONTEXT_CONFLICT', 'Um contexto não conflita consigo mesmo.');
  }
  obterContexto(projeto, outroId, base);

  return mudarContexto(projeto, id, arquivo => {
    const ultima = ultimaVersaoDoContexto(arquivo);
    if (ultima.estado === 'DESATUALIZADO') {
      throw new ErroQa('CONTEXT_OUTDATED', 'Contexto desatualizado não entra em conflito.');
    }
    return novaVersaoDoContexto('conflito', 'CONFLITANTE', ultima.conteudo, por, ultima, { outroId });
  }, base);
}

function resolverConflito(projeto: Projeto, id: string, por: string, base?: string) {
  return mudarContexto(projeto, id, arquivo => {
    const ultima = ultimaVersaoDoContexto(arquivo);
    return novaVersaoDoContexto('conflito_resolvido', 'RASCUNHO', ultima.conteudo, por, ultima);
  }, base);
}

export const conflitoDeContextoDaPasta = async (
  raiz: string, id: string, por: string, outroId?: string
) => outroId
  ? marcarConflito(await abrirProjetoVinculado(raiz), id, outroId, por)
  : resolverConflito(await abrirProjetoVinculado(raiz), id, por);

/** Aprovação é humana, vinculada ao conteúdo exato e exige referência de origem. */
function aprovarContexto(projeto: Projeto, id: string, por: string, base?: string) {
  const anterior = obterContexto(projeto, id, base);
  if (anterior.estadoRegistrado === 'DESATUALIZADO') {
    throw new ErroQa('CONTEXT_OUTDATED', 'Contexto desatualizado não pode ser aprovado.');
  }
  if (!anterior.origem.referencia.trim()) {
    throw new ErroQa('CONTEXT_SOURCE_REQUIRED', 'Informe a origem (documento, pessoa ou decisão) antes de aprovar.');
  }
  if (anterior.estado === 'CONFLITANTE') {
    throw new ErroQa(
      'CONTEXT_CONFLICT',
      'Há conflito com outro contexto: esclareça e marque o conteúdo superado como desatualizado antes de aprovar.'
    );
  }
  if (anterior.estadoRegistrado === 'APROVADO') {
    throw new ErroQa('CONTEXT_NO_CHANGE', 'Este conteúdo já está aprovado.');
  }

  return mudarContexto(projeto, id, arquivo =>
    novaVersaoDoContexto(
      'aprovado', 'APROVADO',
      ultimaVersaoDoContexto(arquivo).conteudo, por, ultimaVersaoDoContexto(arquivo)
    ), base);
}

export const aprovarContextoDaPasta = async (raiz: string, id: string, por: string) =>
  aprovarContexto(await abrirProjetoVinculado(raiz), id, por);

/** Contextos novos nascem rascunho e nunca herdam aprovação de outro conteúdo. */
function criarContexto(
  projeto: Projeto, entrada: unknown, por: string,
  opcoes: { substitui?: string } = {}, base?: string
) {
  const conteudo = conteudoSchema.parse(entrada);
  const dir = pastaContextos(projeto, base);
  if (carregarTodosOsContextos(projeto, base).itens.length >= limites.contextos) {
    throw new ErroQa('CONTEXT_LIMIT', 'Limite de ' + limites.contextos + ' contextos por projeto.');
  }

  const id = randomUUID();
  const arquivo: Arquivo = {
    schema: 1,
    id,
    projectId: hash(projeto.manifesto.id),
    ...(opcoes.substitui ? { substitui: opcoes.substitui } : {}),
    historico: [novaVersaoDoContexto('criado', 'RASCUNHO', conteudo, por, null)]
  };
  gravarArquivoDeContexto(path.join(dir, id + '.json'), arquivo);
  return obterContexto(projeto, id, base);
}

/** Uma edição de conteúdo invalida a aprovação anterior. */
function editarContexto(projeto: Projeto, id: string, parcial: unknown, por: string, base?: string) {
  return mudarContexto(projeto, id, arquivo => {
    const ultima = ultimaVersaoDoContexto(arquivo);
    if (ultima.estado === 'DESATUALIZADO') {
      throw new ErroQa('CONTEXT_OUTDATED', 'Contexto desatualizado não é editado: crie uma versão substituta.');
    }

    const conteudo = conteudoSchema.parse({ ...ultima.conteudo, ...(parcial as object) });
    if (hashDoConteudoDoContexto(conteudo) === ultima.conteudoHash) {
      throw new ErroQa('CONTEXT_NO_CHANGE', 'Nenhuma alteração de conteúdo.');
    }
    return novaVersaoDoContexto('editado', 'RASCUNHO', conteudo, por, ultima);
  }, base);
}

/** Substituição preserva o antigo como desatualizado; o novo precisa de nova aprovação. */
function substituirContexto(projeto: Projeto, id: string, entrada: unknown, por: string, base?: string) {
  const antigo = obterContexto(projeto, id, base);
  if (antigo.estadoRegistrado === 'DESATUALIZADO') {
    throw new ErroQa('CONTEXT_OUTDATED', 'Já está desatualizado.');
  }

  const novo = criarContexto(projeto, entrada, por, { substitui: id }, base);
  mudarContexto(projeto, id, arquivo => {
    const ultima = ultimaVersaoDoContexto(arquivo);
    return novaVersaoDoContexto('substituido', 'DESATUALIZADO', ultima.conteudo, por, ultima, {
      substituidoPor: novo.id
    });
  }, base);

  return {
    anterior: obterContexto(projeto, id, base),
    novo: obterContexto(projeto, novo.id, base)
  };
}

export const salvarContextoDaPasta = async (
  raiz: string,
  entrada: { id?: string; substituir?: boolean; dados: unknown },
  por: string
) => {
  const projeto = await abrirProjetoVinculado(raiz);
  if (!entrada.id) return criarContexto(projeto, entrada.dados, por);

  return entrada.substituir
    ? substituirContexto(projeto, entrada.id, entrada.dados, por)
    : editarContexto(projeto, entrada.id, entrada.dados, por);
};

// mudarContexto
export const mudarContexto = (p: Projeto, id: string, f: (a: Arquivo) => Entrada, base?: string) => {
  const { dir, arq, integro } = carregarContexto(p, id, base); if (!integro) throw new ErroQa('CONTEXT_TAMPERED', 'O histórico deste contexto foi alterado fora do Prumo; recuse-o ou exclua-o.');
  if (arq.historico.length >= limites.historico) throw new ErroQa('CONTEXT_LIMIT', 'Histórico do contexto atingiu o limite.');
  const e = f(arq); arq.historico.push(e); gravarArquivoDeContexto(path.join(dir, id + '.json'), arq); return obterContexto(p, id, base);
};
