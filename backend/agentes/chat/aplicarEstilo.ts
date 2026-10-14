/** Ajusta a resposta ao estilo escolhido (amigável, direto ou técnico). */
import { aberturaDoAgente } from './aberturaDoAgente.js';
import { Estilo } from '../tipos/chat.js';
import { AgenteChat } from '../tipos/persona.js';

/** Aplica o estilo e a personalidade sem alterar os fatos: só a forma de dizer. */
export function aplicarEstilo(linhas: string[], estilo: Estilo, nomeAssistente: string, agente: AgenteChat, primeira: boolean, fatos: string[], pessoa: string | null = null, chave = '') {
  if (estilo === 'direto') return linhas.slice(0, 3);
  if (estilo === 'tecnico') return [...linhas, `[${agente.id}${agente.especializacao ? ' · backend/agentes/skills/' + (agente.especializacao === 'qa-geral' ? 'qa' : agente.especializacao) : ''}${fatos.length ? ' · ' + fatos.join(', ') : ''}]`];
  return primeira ? [aberturaDoAgente(agente.id, nomeAssistente, pessoa, chave || linhas.join('|')), ...linhas] : linhas;
}
