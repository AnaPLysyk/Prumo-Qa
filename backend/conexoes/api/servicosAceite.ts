/** Canal servicos:aceite: Escolhe o campo do Jira que guarda os critérios de aceite. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';

export const servicosAceite: TratadorDoCanal<'servicos:aceite'> = a=>servicosDoAplicativo.campoAceite(a.espacoId,a.campo);
