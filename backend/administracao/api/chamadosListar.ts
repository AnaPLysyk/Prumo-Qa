/** Canal chamados:listar: Listar todos os chamados de suporte recebidos, com filtro opcional por estado. */
import { safeStorage } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { protetorDoSistema } from '../../conexoes/regras/protetorDoSistema.js';
import { chamadosDaAdministracao } from '../../suporte/regras/chamadosDaAdministracao.js';

export const chamadosListar: TratadorDoCanal<'chamados:listar'> = (a) => chamadosDaAdministracao.listar(a.estado, { protetor: protetorDoSistema(safeStorage) });
