/** Texto livre curto do foco de trabalho: sem caracteres de controle, espaços normalizados e no máximo LIMITE_FOCO caracteres. */
import { falharConhecimento } from '../banco/validacoesDoConhecimento.js';

export const LIMITE_FOCO = 160;

export function normalizarFoco(texto: string): string | null {
  const t = texto.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return null; if (t.length > LIMITE_FOCO) falharConhecimento('PROFILE_FOCUS_INVALID'); return t;
}
