/** Canal chamados:responder: Responder a um chamado; a pessoa vê a resposta em Suporte › Meus chamados. */
import { safeStorage } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { protetorDoSistema } from '../../conexoes/regras/protetorDoSistema.js';
import { chamadosDaAdministracao } from '../../suporte/regras/chamadosDaAdministracao.js';

export const chamadosResponder: TratadorDoCanal<'chamados:responder'> = (a) => chamadosDaAdministracao.responder(a.numero, a.texto, { protetor: protetorDoSistema(safeStorage) });
