/** Canal assistente:perguntar: Responder uma pergunta com os dados locais do projeto (contextos aprovados, propostas, execuções, agenda). Não usa modelo de IA nem rede. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { perguntarAoAssistenteLocal } from '../regras/perguntarAoAssistenteLocal.js';

export const assistentePerguntar: TratadorDoCanal<'assistente:perguntar'> = a => perguntarAoAssistenteLocal(a.espacoId, a.pergunta);
