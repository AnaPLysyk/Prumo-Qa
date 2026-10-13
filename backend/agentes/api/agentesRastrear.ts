/** Canal agentes:rastrear: Simular o caminho de uma pergunta no chat (agente escolhido, pontuação, orquestração, conhecimentos e trechos de Skill), sem responder nem gravar. */
import { rastrearPergunta } from '../chat/rastrearPergunta.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const agentesRastrear: TratadorDoCanal<'agentes:rastrear'> = a => rastrearPergunta(a.pergunta, a.espacoId, a.agente);
