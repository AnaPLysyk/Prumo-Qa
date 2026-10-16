/** Canal chamados:estado: Mudar o estado de um chamado (Novo, Em análise, Resolvido, Fechado). */
import { safeStorage } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { protetorDoSistema } from '../../conexoes/regras/protetorDoSistema.js';
import { chamadosDaAdministracao } from '../../suporte/regras/chamadosDaAdministracao.js';

export const chamadosEstado: TratadorDoCanal<'chamados:estado'> = (a) => chamadosDaAdministracao.mudarEstado(a.numero, a.estado, { protetor: protetorDoSistema(safeStorage) });
