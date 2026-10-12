/** Canal runs:resultado: Declarar o resultado de um caso manual. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { usuarioDoWindows } from '../../aplicativo/janela/usuarioDoWindows.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';
import { declararResultadoManual } from '../regras/declararResultadoManual.js';

export const runsResultado: TratadorDoCanal<'runs:resultado'> = async (a, j) => {
  const i = idiomaAtual(); if (!(await confirmarNoWindows(j, textoNoIdioma('manTitulo', i), textoNoIdioma('manMsg', i, { s: a.status, c: a.casoId }), textoNoIdioma('manDet', i), textoNoIdioma('manBtn', i)))) return { canceled: true };
  return { canceled: false, run: declararResultadoManual(a.id, a.casoId, { status: a.status, comentario: a.comentario }, usuarioDoWindows()) };
};
