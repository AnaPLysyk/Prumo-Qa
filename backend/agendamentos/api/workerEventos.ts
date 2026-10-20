/** Canal worker:eventos: Receber avisos do worker e pedidos de navegação da bandeja desde o último número visto. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { avisosDaJanela } from '../../aplicativo/avisos/avisos.js';
import { estadoDoAplicativo } from '../../aplicativo/estadoDoAplicativo.js';

export const workerEventos: TratadorDoCanal<'worker:eventos'> = a => ({ eventos: avisosDaJanela.filter(x => x.n > a.desde), ultimo: estadoDoAplicativo.contadorAviso });
