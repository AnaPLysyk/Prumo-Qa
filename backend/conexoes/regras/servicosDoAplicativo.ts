/** Núcleo de serviços (Jira, Qase, GitHub) do aplicativo, com as credenciais protegidas pelo Windows. */
import { safeStorage } from 'electron';
import { nucleoServicos } from './nucleoServicos.js';

export const servicosDoAplicativo=nucleoServicos({disponivel:()=>process.platform==='win32'&&safeStorage.isEncryptionAvailable(),proteger:s=>safeStorage.encryptString(s),abrir:b=>safeStorage.decryptString(b)});
