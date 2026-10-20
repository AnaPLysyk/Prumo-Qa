/** Ajusta a apresentação da resposta do agente sem alterar os fatos. */
import { Estilo } from '../tipos/chat.js';
import { AgenteChat, personalidades } from '../tipos/persona.js';

/** Gera sempre o mesmo número para o mesmo texto (FNV-1a). */
function numeroDoTexto(texto: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** Seleciona uma saudação da personalidade do agente. */
function aberturaDoAgente(agenteId: string, assistente: string, pessoa: string | null, chave: string): string {
  const personalidade = personalidades[agenteId] ?? personalidades.orquestrador!;
  const indice = numeroDoTexto(chave) % personalidade.aberturas.length;
  const modelo = personalidade.aberturas[indice]!;
  return modelo
    .replace('{assistente}', assistente)
    .replace('{pessoa}', pessoa ? ', ' + pessoa : '');
}

export function aplicarEstilo(
  linhas: string[],
  estilo: Estilo,
  nomeAssistente: string,
  agente: AgenteChat,
  primeira: boolean,
  fatos: string[],
  pessoa: string | null = null,
  chave = ''
): string[] {
  if (estilo === 'direto') return linhas.slice(0, 3);

  if (estilo === 'tecnico') {
    const especializacao = agente.especializacao
      ? ' · skills/' + (agente.especializacao === 'qa-geral' ? 'qa' : agente.especializacao)
      : '';
    const contexto = fatos.length ? ' · ' + fatos.join(', ') : '';
    return [...linhas, `[${agente.id}${especializacao}${contexto}]`];
  }

  if (!primeira) return linhas;
  return [
    aberturaDoAgente(agente.id, nomeAssistente, pessoa, chave || linhas.join('|')),
    ...linhas
  ];
}
