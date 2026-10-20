/** Controlador da funcionalidade agendamentos: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { workerDoAplicativo } from "./worker/workerDoAplicativo.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { estadoDoAplicativo } from "../aplicativo/estadoDoAplicativo.js";
import { avisosDaJanela } from "../aplicativo/avisos/avisos.js";
import { definirPausaGlobal } from "./regras/operacoesDaRotina.js";
import { atualizarBandeja } from "../aplicativo/bandeja/cicloDaBandeja.js";

export const workerEstado: TratadorDoCanal<'worker:estado'> = () => ({ ...workerDoAplicativo.estado(), bandeja: estadoDoAplicativo.bandeja !== null });

export const workerEventos: TratadorDoCanal<'worker:eventos'> = a => ({ eventos: avisosDaJanela.filter(x => x.n > a.desde), ultimo: estadoDoAplicativo.contadorAviso });

export const workerPausa: TratadorDoCanal<'worker:pausa'> = a => { definirPausaGlobal(a.pausado); atualizarBandeja(); return workerDoAplicativo.estado(); };
