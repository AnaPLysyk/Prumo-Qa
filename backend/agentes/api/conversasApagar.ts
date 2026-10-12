/** Canal conversas:apagar: Apagar as conversas gravadas deste projeto neste computador. */
import { dialog } from 'electron';
import { apagarConversas } from '../banco/apagarConversas.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const conversasApagar: TratadorDoCanal<'conversas:apagar'> = async (a, janela) => { const r = await dialog.showMessageBox(janela!, { type: 'warning', buttons: ['Cancelar', 'Apagar conversas'], defaultId: 0, cancelId: 0, title: 'Apagar conversas', message: 'Apagar as conversas do chat gravadas neste computador para este projeto?', detail: 'Os agentes, contextos e históricos do núcleo não são afetados.' }); return r.response === 1 ? apagarConversas(a.espacoId) : { apagado: false, canceled: true }; };
