/** Atualiza o menu e a dica do ícone da bandeja com o estado do worker. */
import { workerDoAplicativo } from '../../agendamentos/worker/workerDoAplicativo.js';

import { menuDaBandeja } from './menuDaBandeja.js';
import { estadoDoAplicativo } from '../estadoDoAplicativo.js';
import { idiomaAtual } from '../../configuracoes/servico.js';
import { textoNoIdioma } from './textoNoIdioma.js';
import { EstadoWorker, Idioma } from '../tipos/textosDaBandeja.js';

const dicaDaBandeja = (e: EstadoWorker, i: Idioma) => `Prumo QA — ${!e.executando ? textoNoIdioma('dicaParado', i) : e.pausado ? textoNoIdioma('dicaPausado', i) : e.emExecucao ? textoNoIdioma('dicaExecutando', i) : textoNoIdioma('dicaAtivo', i)}`;


export function atualizarBandeja() {
  const bandeja = estadoDoAplicativo.bandeja;
  if (!bandeja) return;
  bandeja.setContextMenu(menuDaBandeja(atualizarBandeja));
  bandeja.setToolTip(dicaDaBandeja(workerDoAplicativo.estado(), idiomaAtual()));
}
