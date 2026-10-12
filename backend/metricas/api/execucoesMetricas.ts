/** Canal execucoes:metricas: Indicadores reais das execuções registradas. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { metricasDasExecucoes } from '../regras/metricasDasExecucoes.js';

export const execucoesMetricas: TratadorDoCanal<'execucoes:metricas'> = a => metricasDasExecucoes(a.espacoId);
