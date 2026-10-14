/** Busca um contexto para a revisão de cobertura da IA, respeitando a permissão da pessoa. */
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { carregarTodosOsContextos } from '../banco/carregarTodosOsContextos.js';
import { lerPermissaoDeContextosNoMcp } from '../banco/lerPermissaoDeContextosNoMcp.js';
import { resumirContextos } from './resumirContextos.js';
import { ultimaVersaoDoContexto } from './ultimaVersaoDoContexto.js';

/** Uso em revisar_cobertura: o contexto referenciado, se a pessoa permitiu. */
export function contextoParaRevisao(p: Projeto, id: string, base?: string) {
  if (!lerPermissaoDeContextosNoMcp(p, base).disponibilizarAoMcp) return { status: 'INDISPONIVEL' as const, motivo: 'A pessoa não habilitou o envio de contextos ao agente de IA para este projeto.' };
  try { const { itens } = carregarTodosOsContextos(p, base); const r = resumirContextos(itens).find(x => x.id === id); if (!r) return { status: 'INEXISTENTE' as const, motivo: 'Contexto não encontrado neste projeto.' };
    const alvo = itens.find(i => i.arq.id === id)!; return { status: 'OK' as const, resumo: r, texto: ultimaVersaoDoContexto(alvo.arq).conteudo.texto }; }
  catch { return { status: 'INEXISTENTE' as const, motivo: 'Contexto não pôde ser lido.' }; }
}
