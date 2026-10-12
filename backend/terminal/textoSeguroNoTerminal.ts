/** Prepara um texto para o terminal: segredos mascarados e sem caracteres de controle. */
import { mascarar } from '../compartilhado/seguranca/mascarar.js';

export const textoSeguroNoTerminal=(s:string)=>mascarar(s).replace(/[\x00-\x1f\x7f-\x9f]/g,' ');
