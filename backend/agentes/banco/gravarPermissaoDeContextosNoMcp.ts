/** Grava se a pessoa permitiu enviar os contextos à IA. */
import path from 'node:path';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { gravarArquivoDeContexto } from './gravarArquivoDeContexto.js';
import { pastaContextos } from './pastaContextos.js';

export function gravarPermissaoDeContextosNoMcp(p: Projeto, disponibilizarAoMcp: boolean, base?: string) { gravarArquivoDeContexto(path.join(pastaContextos(p, base), 'config.json'), { version: 1, disponibilizarAoMcp }); return { disponibilizarAoMcp }; }
