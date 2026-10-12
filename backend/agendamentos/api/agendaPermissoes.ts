/** Canal agenda:permissoes: Listar autorizações de execução e políticas de publicação com seus estados. */
import { listarPermissoes } from '../regras/listarPermissoes.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const agendaPermissoes: TratadorDoCanal<'agenda:permissoes'> = a => listarPermissoes(a.espacoId);
