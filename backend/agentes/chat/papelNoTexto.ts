/** Reconhece no texto o papel da pessoa (QA, dev, PO, analista). */
import { PAPEIS } from '../tipos/chat.js';
import { Papel } from '../tipos/persona.js';

export const papelNoTexto = (t: string): Papel | null => { for (const [re, p] of PAPEIS) if (re.test(t)) return p; return null; };
