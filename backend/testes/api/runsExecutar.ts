/** Canal runs:executar: Executar as automações associadas aos casos da run (somente capabilities declaradas). */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { servicosDoAplicativo } from '../../conexoes/regras/servicosDoAplicativo.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';
import { executarValidacao } from '../regras/executarValidacao.js';
import { obterRunLocal } from '../banco/armazenamentoDeRuns.js';
import { executarRunLocal } from '../regras/executarRunLocal.js';

export const runsExecutar: TratadorDoCanal<'runs:executar'> = async (a, j) => {
  const i = idiomaAtual(); const run = obterRunLocal(a.id); const n = new Set(run.casos.filter(c => c.capability).map(c => c.capability)).size;
  if (!(await confirmarNoWindows(j, textoNoIdioma('execRunTitulo', i), textoNoIdioma('execRunMsg', i, { n }), textoNoIdioma('execRunDet', i), textoNoIdioma('execRunBtn', i)))) return { canceled: true };
  return { canceled: false, ...(await executarRunLocal({ executor: servicosDoAplicativo }, a.id, { executar: executarValidacao, modo: 'MANUAL' })), run: obterRunLocal(a.id) };
};
