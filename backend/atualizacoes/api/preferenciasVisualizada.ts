/** Canal preferencias:visualizada: Marcar a versão disponível como vista (o indicador some até haver versão mais nova). */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { versao } from '../../aplicativo/tipos/aplicativo.js';
import { avisoDeVersaoPendente } from '../regras/avisoDeVersaoPendente.js';
import { marcarVersaoVista } from '../regras/marcarVersaoVista.js';

export const preferenciasVisualizada: TratadorDoCanal<'preferencias:visualizada'> = a => ({ preferencias: marcarVersaoVista(a.versao), aviso: avisoDeVersaoPendente(versao) });
