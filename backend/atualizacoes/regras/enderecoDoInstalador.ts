/** Endereço oficial do instalador de uma versão no GitHub. */
import { repositorio } from '../../ajuda/tipos/versao.js';
import { nomeDoInstalador } from './nomeDoInstalador.js';

export const enderecoDoInstalador = (v: string) => `https://github.com/${repositorio}/releases/download/v${v}/${nomeDoInstalador(v)}`;
