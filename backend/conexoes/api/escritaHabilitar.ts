/** Canal escrita:habilitar: Habilitar ou desabilitar a escrita externa de um serviço no projeto. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { usuarioDoWindows } from '../../aplicativo/janela/usuarioDoWindows.js';
import { nomeServico } from '../../aplicativo/tipos/aplicativo.js';
import { habilitarEscrita } from '../escrita/habilitarEscrita.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';

export const escritaHabilitar: TratadorDoCanal<'escrita:habilitar'> = async (a, j) => {
  const i = idiomaAtual();
  if (a.habilitada && !(await confirmarNoWindows(j, textoNoIdioma('habTitulo', i), textoNoIdioma('habMsg', i, { s: nomeServico[a.servico] }), textoNoIdioma('habDet', i), textoNoIdioma('habBtn', i)))) return { canceled: true };
  return { canceled: false, ...habilitarEscrita(a.espacoId, a.servico, a.habilitada, usuarioDoWindows()) };
};
