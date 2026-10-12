/** Gera o endereço oficial de uma versão publicada no GitHub. */
import { repositorio } from './definirFormatoVersao.js';

export const urlRelease = (versao: string) => `https://github.com/${repositorio}/releases/tag/v${versao}`;

