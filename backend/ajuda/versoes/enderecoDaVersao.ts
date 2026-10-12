/** Endereço da página da versão no GitHub. */
import { repositorio } from '../tipos/versao.js';

export const enderecoDaVersao = (versao: string) => `https://github.com/${repositorio}/releases/tag/v${versao}`;
