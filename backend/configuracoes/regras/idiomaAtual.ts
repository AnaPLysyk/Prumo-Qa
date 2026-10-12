/** Idioma escolhido pela pessoa (pt-BR ou en). */
import { Idioma } from '../../aplicativo/tipos/textosDaBandeja.js';
import { lerPreferencias } from '../banco/lerPreferencias.js';

// ---- 2.8: agenda, worker residente, execuções e comentário Jira. A página nunca informa comando, caminho nem aprovação. ----
export const idiomaAtual = (): Idioma => lerPreferencias().idioma;
