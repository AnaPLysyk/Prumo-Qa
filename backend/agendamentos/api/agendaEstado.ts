/** Canal agenda:estado: Pausar, retomar ou desativar uma rotina. */
import { desativarRotina } from '../regras/operacoesDaRotina.js';
import { pausarRotina } from '../regras/operacoesDaRotina.js';
import { retomarRotina } from '../regras/operacoesDaRotina.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const agendaEstado: TratadorDoCanal<'agenda:estado'> = a => (a.acao === 'pausar' ? pausarRotina(a.id) : a.acao === 'retomar' ? retomarRotina(a.id) : desativarRotina(a.id));
