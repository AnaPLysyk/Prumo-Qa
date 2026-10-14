/** Protetor de credenciais do sistema (Windows DPAPI, Keychain do macOS, cofre de senhas do Linux) sobre o safeStorage do Electron. */
import { Protetor } from '../tipos/credenciais.js';

export type CofreDoSistema = { isEncryptionAvailable: () => boolean; encryptString: (s: string) => Buffer; decryptString: (b: Buffer) => string; getSelectedStorageBackend?: () => string };

/**
 * No Linux, sem Secret Service ou KWallet o Electron cai em "basic_text" (chave fixa, equivale a texto aberto). Isso é
 * recusado: sem cofre real o Prumo não guarda token, e a pessoa é orientada a instalar o gnome-keyring ou o KWallet.
 */
export function protetorDoSistema(cofre: CofreDoSistema, sistema: string = process.platform): Protetor {
  const cofreReal = () => sistema !== 'linux' || !['basic_text', 'unknown'].includes(cofre.getSelectedStorageBackend?.() ?? 'unknown');
  return { disponivel: () => cofre.isEncryptionAvailable() && cofreReal(), proteger: s => cofre.encryptString(s), abrir: b => cofre.decryptString(b) };
}
