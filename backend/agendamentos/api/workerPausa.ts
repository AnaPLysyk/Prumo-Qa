/** Canal worker:pausa: Pausar ou retomar todos os agendamentos. */
import { definirPausaGlobal } from '../regras/operacoesDaRotina.js';
import { workerDoAplicativo } from '../worker/workerDoAplicativo.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { atualizarBandeja } from '../../aplicativo/bandeja/atualizarBandeja.js';

export const workerPausa: TratadorDoCanal<'worker:pausa'> = a => { definirPausaGlobal(a.pausado); atualizarBandeja(); return workerDoAplicativo.estado(); };
