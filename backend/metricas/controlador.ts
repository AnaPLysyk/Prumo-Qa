/** Controlador da funcionalidade metricas: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { metricasDasExecucoes } from "./regras/metricasDasExecucoes.js";

export const execucoesMetricas: TratadorDoCanal<'execucoes:metricas'> = a => metricasDasExecucoes(a.espacoId);
