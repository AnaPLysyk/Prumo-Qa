/** Canal espacos:associar: Registra uma ligação explícita entre dois itens do projeto (ex.: ticket ↔ caso). */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { associarEspaco } from '../regras/associarEspaco.js';

export const espacosAssociar: TratadorDoCanal<'espacos:associar'> = a=>associarEspaco(a.id,a.dados);
