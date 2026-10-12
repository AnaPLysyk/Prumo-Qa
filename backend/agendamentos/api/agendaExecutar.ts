/** Canal agenda:executar: Executar uma rotina agora (trabalho manual). */
import { workerDoAplicativo } from '../worker/workerDoAplicativo.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const agendaExecutar: TratadorDoCanal<'agenda:executar'> = async a => { const t = workerDoAplicativo.executarAgora(a.id); void workerDoAplicativo.tick(); return { trabalho: t.id, estado: t.estado }; };
