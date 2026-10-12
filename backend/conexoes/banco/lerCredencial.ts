/** Decifra a credencial de uma conta com a proteção do Windows; se não existe ou não abre, avisa CREDENTIAL_UNAVAILABLE. */
import { Protetor } from '../tipos/credenciais.js';
import { exigirProtecaoDoWindows } from './exigirProtecaoDoWindows.js';
import { lerArquivoDeCredenciais } from './lerArquivoDeCredenciais.js';
import { validarIdDaCredencial } from './validarIdDaCredencial.js';

export function lerCredencial(protetor: Protetor, id: string, base?: string) {
  validarIdDaCredencial(id); exigirProtecaoDoWindows(protetor);
  const r = lerArquivoDeCredenciais(base); if (!r.entradas[id]) throw new Error('CREDENTIAL_UNAVAILABLE');
  try { return protetor.abrir(Buffer.from(r.entradas[id]!, 'base64')); } catch { throw new Error('CREDENTIAL_UNAVAILABLE'); }
}
