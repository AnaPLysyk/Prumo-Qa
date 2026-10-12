/** Canal suporte:preparar: Montar localmente o relato (bug, melhoria ou sugestão) e revisar a privacidade antes de qualquer envio. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { prepararRelatoDaJanela } from '../regras/prepararRelatoDaJanela.js';

export const suportePreparar: TratadorDoCanal<'suporte:preparar'> = a => prepararRelatoDaJanela(a);
