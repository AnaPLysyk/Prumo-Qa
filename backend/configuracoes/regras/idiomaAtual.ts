/** Idioma escolhido pela pessoa (pt-BR ou en). */
import { Idioma } from '../../aplicativo/tipos/textosDaBandeja.js';
import { lerPreferencias } from '../banco/lerPreferencias.js';

export const idiomaAtual = (): Idioma => lerPreferencias().idioma;
