/** Mascara segredos em qualquer objeto antes de mostrá-lo. */
import { mascarar } from './mascarar.js';

export const mascararObjeto = <T>(valor:T):T => JSON.parse(mascarar(JSON.stringify(valor)));
