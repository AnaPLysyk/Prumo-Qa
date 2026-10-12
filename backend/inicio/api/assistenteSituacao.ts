/** Canal assistente:situacao: Resumir o que está acontecendo agora no projeto para o painel inicial. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { situacaoDoProjeto } from '../regras/situacaoDoProjeto.js';

export const assistenteSituacao: TratadorDoCanal<'assistente:situacao'> = a => situacaoDoProjeto(a.espacoId);
