/** Canal runs:publicar: Publicar no Qase os resultados ainda não publicados e reler a run. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { servicosDoAplicativo } from '../../conexoes/regras/servicosDoAplicativo.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';
import { obterRunLocal } from '../banco/armazenamentoDeRuns.js';
import { publicarRunLocal } from '../integracoes/publicarRunLocal.js';

export const runsPublicar: TratadorDoCanal<'runs:publicar'> = async (a, j) => {
  const i = idiomaAtual(); const run = obterRunLocal(a.id); const pend = run.casos.filter(c => c.resultado && c.resultado.status !== 'NOT_RUN' && !c.publicado);
  if (!run.runIdRemoto) throw new Error('RUN_NOT_CREATED: crie a run no Qase antes de publicar.'); if (!pend.length) return { canceled: false, publicados: 0, operacao: null };
  const resumo = pend.slice(0, 12).map(c => `${c.casoId} · ${c.resultado!.status}${c.resultado!.origem === 'MANUAL' ? ' (manual)' : ''} · ${c.titulo}`).join('\n') + (pend.length > 12 ? `\n… +${pend.length - 12}` : '');
  if (!(await confirmarNoWindows(j, textoNoIdioma('pubRunTitulo', i), textoNoIdioma('pubRunMsg', i, { n: pend.length, r: run.runIdRemoto }), textoNoIdioma('pubRunDet', i, { x: resumo }), textoNoIdioma('opBtn', i)))) return { canceled: true };
  return { canceled: false, ...(await publicarRunLocal({ executor: servicosDoAplicativo }, a.id, { confirmado: true, anexarEvidencia: a.anexarEvidencia })), run: obterRunLocal(a.id) };
};
