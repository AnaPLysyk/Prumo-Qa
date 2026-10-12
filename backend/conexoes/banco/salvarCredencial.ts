/** Cifra a credencial com a proteção do Windows e a guarda em credenciais.json; recusa valor vazio, grande demais ou com caracteres de controle. */
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { Protetor } from '../tipos/credenciais.js';
import { exigirProtecaoDoWindows } from './exigirProtecaoDoWindows.js';
import { lerArquivoDeCredenciais } from './lerArquivoDeCredenciais.js';
import { validarIdDaCredencial } from './validarIdDaCredencial.js';

export function salvarCredencial(protetor: Protetor, id: string, valor: string, base?: string) {
  validarIdDaCredencial(id); exigirProtecaoDoWindows(protetor);
  if (!valor || valor.length > 6000 || /[\x00-\x1f]/.test(valor)) throw new Error('CREDENTIAL_INVALID');
  const r = lerArquivoDeCredenciais(base);
  try { r.entradas[id] = protetor.proteger(valor).toString('base64'); } catch { throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE'); }
  gravarLocal('credenciais.json', r, base);
}
