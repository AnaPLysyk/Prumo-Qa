/** Pede à janela que abra uma tela (ex.: Execuções) e mostra a janela. */
import { empilharAviso } from '../avisos/empilharAviso.js';
import { mostrarJanela } from './mostrarJanela.js';

export function navegarPara(destino: string) { empilharAviso({ tipo: 'NAVEGAR', titulo: destino, detalhe: '', destino }); mostrarJanela(); }
