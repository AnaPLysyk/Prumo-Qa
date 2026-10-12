/** Canal suporte:consultar: Consultar estado e histórico público de um chamado oficial por ação explícita. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { consultarChamado } from '../integracoes/consultarChamado.js';

export const suporteConsultar: TratadorDoCanal<'suporte:consultar'> = a => consultarChamado(a.numero);
