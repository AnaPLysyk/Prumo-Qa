/** Recusa guardar ou ler credenciais quando a proteção do Windows (DPAPI) não está disponível. */
import { Protetor } from '../tipos/credenciais.js';

export function exigirProtecaoDoWindows(protetor: Protetor) {
  if (!protetor.disponivel()) throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE');
}
