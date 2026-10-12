/** Atualiza o menu e a dica do ícone da bandeja com o estado do worker. */
import { workerDoAplicativo } from '../../agendamentos/worker/workerDoAplicativo.js';
import { dicaDaBandeja } from './dicaDaBandeja.js';
import { menuDaBandeja } from './menuDaBandeja.js';
import { estadoDoAplicativo } from '../estadoDoAplicativo.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';

export function atualizarBandeja() { if (estadoDoAplicativo.bandeja) { estadoDoAplicativo.bandeja.setContextMenu(menuDaBandeja()); estadoDoAplicativo.bandeja.setToolTip(dicaDaBandeja(workerDoAplicativo.estado(), idiomaAtual())); } }
