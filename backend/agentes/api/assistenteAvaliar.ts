/** Canal assistente:avaliar: Avaliar um atendimento (útil ou não). Ao indicar o agente certo, ensina a ele só os termos da pergunta. */
import { aprenderTermos } from '../banco/aprenderTermos.js';
import { avaliarAtendimento } from '../banco/avaliarAtendimento.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

// Avaliar uma resposta. Corrigir o agente ensina só os termos da pergunta ao agente certo (a pergunta não é gravada).
export const assistenteAvaliar: TratadorDoCanal<'assistente:avaliar'> = a => { const r = avaliarAtendimento(a.id, a.avaliacao); const termos = a.avaliacao === 'NAO_UTIL' && a.agenteCorreto && a.pergunta ? aprenderTermos(a.agenteCorreto, a.pergunta).termos : []; return { ...r, termos }; };
