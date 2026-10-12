/** O worker de agendamentos deste aplicativo, ligado aos serviços e aos avisos da janela. */
import { Worker } from './Worker.js';
import { publicarEventoDoWorker } from '../../aplicativo/avisos/publicarEventoDoWorker.js';
import { servicosDoAplicativo } from '../../conexoes/regras/servicosDoAplicativo.js';

export const workerDoAplicativo = new Worker({ servicos: servicosDoAplicativo as never, aoEvento: e => publicarEventoDoWorker(e) });
