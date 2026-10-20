/** Canal propostas:revisar: Registrar a revisão (duplicidade, requisito, risco e cobertura) de uma proposta. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { usuarioDoWindows } from '../../aplicativo/janela/usuarioDoWindows.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';
import { revisarProposta } from '../regras/edicaoDaProposta.js';

export const propostasRevisar: TratadorDoCanal<'propostas:revisar'> = async (a, j) => {
  const i = idiomaAtual(); if (!(await confirmarNoWindows(j, textoNoIdioma('revTitulo', i), textoNoIdioma('revMsg', i), textoNoIdioma('revDet', i), textoNoIdioma('revBtn', i)))) return { canceled: true };
  return { canceled: false, proposta: revisarProposta(a.id, { duplicidade: a.duplicidade, requisito: a.requisito, risco: a.risco, cobertura: a.cobertura }, usuarioDoWindows()) };
};
