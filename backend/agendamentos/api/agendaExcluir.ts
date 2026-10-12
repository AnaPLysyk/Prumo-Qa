/** Canal agenda:excluir: Excluir uma rotina (histórico de execuções permanece). */
import { obterRotina } from '../banco/obterRotina.js';
import { excluirRotina } from '../regras/excluirRotina.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';

export const agendaExcluir: TratadorDoCanal<'agenda:excluir'> = async (a, j) => {
  const i = idiomaAtual(); const r = obterRotina(a.id);
  if (!(await confirmarNoWindows(j, textoNoIdioma('excluirTitulo', i), textoNoIdioma('excluirMsg', i, { n: r.nome }), textoNoIdioma('excluirDet', i), textoNoIdioma('excluirBtn', i)))) return { canceled: true };
  return { canceled: false, ...excluirRotina(a.id) };
};
