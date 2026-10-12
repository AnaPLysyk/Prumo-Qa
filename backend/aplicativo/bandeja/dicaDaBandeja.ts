/** Texto que aparece ao passar o mouse no ícone da bandeja. */
import { textoNoIdioma } from './textoNoIdioma.js';
import { EstadoWorker, Idioma } from '../tipos/textosDaBandeja.js';

export const dicaDaBandeja = (e: EstadoWorker, i: Idioma) => `Prumo QA — ${!e.executando ? textoNoIdioma('dicaParado', i) : e.pausado ? textoNoIdioma('dicaPausado', i) : e.emExecucao ? textoNoIdioma('dicaExecutando', i) : textoNoIdioma('dicaAtivo', i)}`;
