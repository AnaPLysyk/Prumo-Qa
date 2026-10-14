/** Canal jira:previa: Mostrar o comentário de resultado que seria publicado no Jira. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { prepararPublicacao } from '../regras/prepararPublicacao.js';

export const jiraPrevia: TratadorDoCanal<'jira:previa'> = a => prepararPublicacao(a.trabalhoId);
