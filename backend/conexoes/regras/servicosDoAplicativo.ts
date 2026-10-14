/** Núcleo de serviços (Jira, Qase, GitHub) do aplicativo, com as credenciais protegidas pelo cofre do sistema (Windows, macOS ou Linux). */
import { safeStorage } from 'electron';
import { nucleoServicos } from './nucleoServicos.js';
import { protetorDoSistema } from './protetorDoSistema.js';

export const servicosDoAplicativo=nucleoServicos(protetorDoSistema(safeStorage));
