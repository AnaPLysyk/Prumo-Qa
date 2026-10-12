/** Põe um aviso na fila da janela, numerado, guardando os 100 últimos. */
import { avisosDaJanela } from './avisosDaJanela.js';
import { estadoDoAplicativo } from '../estadoDoAplicativo.js';
import { Aviso } from '../tipos/aplicativo.js';

export function empilharAviso(a: Omit<Aviso, 'n' | 'at'>) { avisosDaJanela.push({ ...a, n: ++estadoDoAplicativo.contadorAviso, at: new Date().toISOString() }); if (avisosDaJanela.length > 100) avisosDaJanela.shift(); }
