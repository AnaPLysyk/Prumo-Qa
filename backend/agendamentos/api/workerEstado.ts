/** Canal worker:estado: Estado real do worker de agendamentos. */
import { workerDoAplicativo } from '../worker/workerDoAplicativo.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { estadoDoAplicativo } from '../../aplicativo/estadoDoAplicativo.js';

export const workerEstado: TratadorDoCanal<'worker:estado'> = () => ({ ...workerDoAplicativo.estado(), bandeja: estadoDoAplicativo.bandeja !== null });
