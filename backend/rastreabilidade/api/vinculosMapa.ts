/** Canal vinculos:mapa: Mapa de vínculos entre projeto, Jira, Qase, repositório, tickets, casos, runs, execuções e evidências, com lacunas de cadastro. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { mapaDeVinculos } from '../regras/mapaDeVinculos.js';

export const vinculosMapa: TratadorDoCanal<'vinculos:mapa'> = a => mapaDeVinculos(a.espacoId);
