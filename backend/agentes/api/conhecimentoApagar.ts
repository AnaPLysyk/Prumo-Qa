/** Canal conhecimento:apagar: Apagar de vez um conhecimento ensinado (o inicial do Prumo só pode ser descartado). */
import { dialog } from 'electron';
import { apagarConhecimento } from '../banco/apagarConhecimento.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const conhecimentoApagar: TratadorDoCanal<'conhecimento:apagar'> = async (a, janela) => { const r = await dialog.showMessageBox(janela!, { type: 'warning', buttons: ['Cancelar', 'Apagar'], defaultId: 0, cancelId: 0, title: 'Apagar conhecimento', message: 'Apagar este conhecimento do banco deste computador?', detail: 'Os agentes deixam de usá-lo. O conhecimento inicial do Prumo não pode ser apagado, só descartado.' }); return r.response === 1 ? apagarConhecimento(a.id) : { apagado: false, canceled: true }; };
