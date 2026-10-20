/** Consultas, histórico e resumos de contextos da pasta vinculada de um projeto. */
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { carregarTodosOsContextos } from '../banco/consultarContextos.js';
import { lerPermissaoDeContextosNoMcp } from '../banco/permissoesDeContexto.js';
import { ultimaVersaoDoContexto } from './validacoesDeContexto.js';
import { Filtro, Arquivo, Estado, Resumo, ehInstrucao } from '../tipos/contexto.js';
import { abrirProjetoVinculado } from '../../projetos/servicoProjetos.js';
import { ErroQa } from '../../compartilhado/erros.js';

/** Contexto disponível na ferramenta de revisão somente com permissão da pessoa. */
export function contextoParaRevisao(projeto: Projeto, id: string, base?: string) {
  if (!lerPermissaoDeContextosNoMcp(projeto, base).disponibilizarAoMcp) {
    return {
      status: 'INDISPONIVEL' as const,
      motivo: 'A pessoa não habilitou o envio de contextos ao agente de IA para este projeto.'
    };
  }

  try {
    const { itens } = carregarTodosOsContextos(projeto, base);
    const resumo = resumirContextos(itens).find(item => item.id === id);
    if (!resumo) {
      return { status: 'INEXISTENTE' as const, motivo: 'Contexto não encontrado neste projeto.' };
    }
    const encontrado = itens.find(item => item.arq.id === id)!;
    return {
      status: 'OK' as const,
      resumo,
      texto: ultimaVersaoDoContexto(encontrado.arq).conteudo.texto
    };
  } catch {
    return { status: 'INEXISTENTE' as const, motivo: 'Contexto não pôde ser lido.' };
  }
}

/** Lista com filtros de tipo, chave, estado e busca textual, sem expor arquivos brutos. */
function listarContextos(projeto: Projeto, filtro: Filtro = {}, base?: string) {
  const { itens, problemas } = carregarTodosOsContextos(projeto, base);
  const termo = filtro.busca?.trim().toLowerCase();
  const textos = new Map(itens.map(item => {
    const conteudo = ultimaVersaoDoContexto(item.arq).conteudo;
    return [
      item.arq.id,
      [conteudo.titulo, conteudo.texto, conteudo.chave ?? ''].join('\n').toLowerCase()
    ];
  }));

  const contextos = resumirContextos(itens)
    .filter(item =>
      (!filtro.tipo || item.tipo === filtro.tipo) &&
      (!filtro.estado || item.estado === filtro.estado) &&
      (!filtro.chave || item.chave === filtro.chave) &&
      (!termo || textos.get(item.id)!.includes(termo))
    )
    .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));

  return {
    contextos,
    total: itens.length,
    problemas,
    disponibilizarAoMcp: lerPermissaoDeContextosNoMcp(projeto, base).disponibilizarAoMcp
  };
}

/** Consulta de contexto da tela, com projeto previamente vinculado e validado. */
export const listarContextosDaPasta = async (raiz: string, filtro: Filtro = {}) =>
  listarContextos(await abrirProjetoVinculado(raiz), filtro);

/** Obtém somente o contexto solicitado, com versões e trilha de alterações. */
export function obterContexto(projeto: Projeto, id: string, base?: string) {
  const { itens } = carregarTodosOsContextos(projeto, base);
  const encontrado = itens.find(item => item.arq.id === id);
  if (!encontrado) throw new ErroQa('CONTEXT_NOT_FOUND', 'Contexto não encontrado neste projeto.');

  const resumo = resumirContextos(itens).find(item => item.id === id)!;
  const ultima = ultimaVersaoDoContexto(encontrado.arq);

  return {
    ...resumo,
    texto: ultima.conteudo.texto,
    historico: encontrado.arq.historico.map(item => ({
      versao: item.versao,
      em: item.em,
      acao: item.acao,
      estado: item.estado,
      por: item.por,
      conteudoHash: item.conteudoHash,
      titulo: item.conteudo.titulo,
      texto: item.conteudo.texto,
      outroId: item.detalhe?.outroId ?? null,
      substituidoPor: item.detalhe?.substituidoPor ?? null
    }))
  };
}

const suspeitaDeInstrucao = (texto: string) => ehInstrucao.test(texto);

/** Resume contextos detectando conflitos por chave e conflitos marcados manualmente. */
export function resumirContextos(itens: { arq: Arquivo; integro: boolean }[]): Resumo[] {
  const vivos = itens.filter(item => ultimaVersaoDoContexto(item.arq).estado !== 'DESATUALIZADO');
  const porChave = new Map<string, string[]>();

  for (const item of vivos) {
    const chave = ultimaVersaoDoContexto(item.arq).conteudo.chave;
    if (chave) porChave.set(chave, [...(porChave.get(chave) ?? []), item.arq.id]);
  }

  const manuais = new Map<string, Set<string>>();
  for (const item of vivos) {
    for (const evento of item.arq.historico) {
      if (evento.acao !== 'conflito' || !evento.detalhe?.outroId) continue;
      const outroId = evento.detalhe.outroId;
      if (!manuais.has(item.arq.id)) manuais.set(item.arq.id, new Set());
      if (!manuais.has(outroId)) manuais.set(outroId, new Set());
      manuais.get(item.arq.id)!.add(outroId);
      manuais.get(outroId)!.add(item.arq.id);
    }
  }

  const resolvidos = new Set(
    vivos.filter(item => ultimaVersaoDoContexto(item.arq).acao === 'conflito_resolvido')
      .map(item => item.arq.id)
  );
  const aprovadoEm = (arquivo: Arquivo) =>
    [...arquivo.historico].reverse().find(item =>
      item.acao === 'aprovado' &&
      item.conteudoHash === ultimaVersaoDoContexto(arquivo).conteudoHash
    );

  return itens.map(({ arq, integro }) => {
    const ultima = ultimaVersaoDoContexto(arq);
    const conteudo = ultima.conteudo;
    const vivo = ultima.estado !== 'DESATUALIZADO';
    const derivados = vivo && conteudo.chave
      ? (porChave.get(conteudo.chave) ?? []).filter(id => id !== arq.id)
      : [];
    const marcados = vivo && !resolvidos.has(arq.id)
      ? [...(manuais.get(arq.id) ?? [])].filter(id => vivos.some(item => item.arq.id === id))
      : [];
    const conflitaCom = [...new Set([...derivados, ...marcados])];

    const estado: Estado = !vivo
      ? 'DESATUALIZADO'
      : conflitaCom.length
        ? 'CONFLITANTE'
        : ultima.estado === 'CONFLITANTE'
          ? 'RASCUNHO'
          : ultima.estado;

    const aprovacao = ultima.estado === 'APROVADO' ? aprovadoEm(arq) : undefined;
    return {
      id: arq.id,
      tipo: conteudo.tipo,
      titulo: conteudo.titulo,
      chave: conteudo.chave ?? null,
      estado,
      estadoRegistrado: ultima.estado,
      versao: ultima.versao,
      atualizadoEm: ultima.em,
      origem: conteudo.origem,
      hash: ultima.conteudoHash,
      conflitaCom,
      integridade: integro ? 'OK' : 'ADULTERADO',
      aprovadoPor: aprovacao?.por ?? null,
      aprovadoEm: aprovacao?.em ?? null,
      substitui: arq.substitui ?? null,
      alertaDeInstrucao: suspeitaDeInstrucao(conteudo.texto)
    };
  });
}
