/** Cria o ícone do Prumo na bandeja do Windows e vigia o worker a cada 15 segundos. */
import { nativeImage, Tray } from 'electron';
import path from 'node:path';
import { vigiarWorker } from '../../agendamentos/worker/vigiarWorker.js';
import { atualizarBandeja } from './atualizarBandeja.js';
import { estadoDoAplicativo } from '../estadoDoAplicativo.js';
import { mostrarJanela } from '../janela/mostrarJanela.js';
import { raizDoAplicativo } from '../../compartilhado/raizDoAplicativo.js';

export function criarBandeja() {
  const icone = nativeImage.createFromPath(path.join(raizDoAplicativo, 'assets', 'prumo-icon.png')).resize({ width: 16, height: 16 });
  estadoDoAplicativo.bandeja = new Tray(icone); estadoDoAplicativo.bandeja.on('click', () => mostrarJanela()); estadoDoAplicativo.bandeja.on('double-click', () => mostrarJanela()); atualizarBandeja();
  setInterval(() => { try { vigiarWorker(); atualizarBandeja(); } catch { /* um ciclo com erro não derruba o processo */ } }, 15000).unref();
}
