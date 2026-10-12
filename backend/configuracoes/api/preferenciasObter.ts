/** Canal preferencias:obter: Ler as preferências de notificação e o aviso de atualização pendente. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { versao } from '../../aplicativo/tipos/aplicativo.js';
import { avisoDeVersaoPendente } from '../../atualizacoes/regras/avisoDeVersaoPendente.js';
import { lerPreferencias } from '../banco/lerPreferencias.js';

export const preferenciasObter: TratadorDoCanal<'preferencias:obter'> = () => ({ preferencias: lerPreferencias(), aviso: avisoDeVersaoPendente(versao), instalada: versao });
