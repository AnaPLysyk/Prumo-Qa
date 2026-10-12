/** Escreve numa frase o estado do worker (parado, pausado, executando, ativo). */
import { textoNoIdioma } from './textoNoIdioma.js';
import { EstadoWorker, Idioma } from '../tipos/textosDaBandeja.js';

export function resumoDoWorker(e: EstadoWorker, i: Idioma) {
  return !e.executando ? textoNoIdioma('parado', i) : e.pausado ? textoNoIdioma('pausado', i) : e.emExecucao ? textoNoIdioma('executando', i) : textoNoIdioma('ativo', i, { a: e.rotinasAtivas, p: e.pendentes });
}
