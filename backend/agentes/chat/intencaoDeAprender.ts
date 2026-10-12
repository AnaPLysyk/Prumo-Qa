/** Reconhece pedidos como "lembre que..." e registra um conhecimento. */
import { registrarConhecimento } from '../banco/registrarConhecimento.js';
import { escolherAgente } from './escolherAgente.js';
import { Meta } from '../tipos/chat.js';
import { TipoConhecimento } from '../tipos/conhecimento.js';
import { agentesChat } from '../tipos/persona.js';
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';

export function intencaoDeAprender(pergunta: string, espacoId: string | null, forcado: string | null | undefined, base?: string): Meta | null {
  const m = pergunta.match(/^\s*(?:por favor,?\s*)?(?:lembr[ae](?:-se)?|anot[ae]|guard[ae]|aprend[ae]|memoriz[ae])\s*(?:que|isso|:)?\s*:?\s+(.{4,})$/i); if (!m) return null;
  const texto = m[1]!.trim(); const alvo = forcado ?? escolherAgente(texto).agente.id; const agente = alvo === 'orquestrador' ? null : alvo; const n = semAcentos(texto);
  const tipo: TipoConhecimento = / significa | quer dizer | e o nome de /.test(' ' + n + ' ') ? 'glossario' : /^(eu )?(prefiro|gosto|quero que)/.test(n) ? 'preferencia' : /^(sempre|nunca|antes de|depois de|para )/.test(n) ? 'procedimento' : 'fato';
  try {
    const { item, duplicado } = registrarConhecimento({ espacoId, agente, tipo, titulo: texto.slice(0, 80), texto, origem: 'CONVERSA' }, base);
    const quem = agente ? agentesChat.find((a) => a.id === agente)!.nome : 'todos os agentes';
    if (duplicado) return { linhas: [`Eu já tinha isso anotado para ${quem} (${item.estado === 'APROVADO' ? 'aprovado' : 'em rascunho'}).`], agente: agente ?? 'orquestrador', fontes: [{ rotulo: 'Agentes', aba: 'agentes' }] };
    return { linhas: [`Anotei como rascunho para ${quem}: "${item.texto}".`, 'Só passo a usar depois que você confirmar.'], agente: agente ?? 'orquestrador', fontes: [{ rotulo: 'Agentes', aba: 'agentes' }],
      acoes: [{ tipo: 'aprovar_conhecimento', id: item.id, rotulo: 'Confirmar aprendizado' }, { tipo: 'descartar_conhecimento', id: item.id, rotulo: 'Descartar' }] };
  } catch (e) { return { linhas: [`Não consegui anotar: ${(e as Error).message === 'KNOWLEDGE_LIMIT' ? 'o banco de conhecimento chegou ao limite' : 'o banco de conhecimento não está disponível'}.`] }; }
}
