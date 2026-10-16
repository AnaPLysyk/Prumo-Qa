/** Canal chamados:detalhe: Ver um chamado de suporte por inteiro: texto, quem abriu, anexos recebidos e respostas. */
import { safeStorage } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { protetorDoSistema } from '../../conexoes/regras/protetorDoSistema.js';
import { chamadosDaAdministracao } from '../../suporte/regras/chamadosDaAdministracao.js';

export const chamadosDetalhe: TratadorDoCanal<'chamados:detalhe'> = (a) => chamadosDaAdministracao.detalhe(a.numero, { protetor: protetorDoSistema(safeStorage) });
