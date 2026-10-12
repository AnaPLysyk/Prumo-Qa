/** Canal runs:criar: Criar a run no Qase com os casos escolhidos. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { prepararOperacao } from '../../conexoes/escrita/prepararOperacao.js';
import { servicosDoAplicativo } from '../../conexoes/regras/servicosDoAplicativo.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { obterRunLocal } from '../banco/obterRunLocal.js';
import { criarRunNoQase } from '../integracoes/criarRunNoQase.js';

export const runsCriar: TratadorDoCanal<'runs:criar'> = async (a, j) => {
  const i = idiomaAtual(); const run = obterRunLocal(a.id); const prev = prepararOperacao(run.espacoId, 'qase.criar_run', { titulo: run.titulo, casos: run.casos.map(c => c.casoId), ...(run.planoId ? { planoId: run.planoId } : {}) });
  if (!(await confirmarNoWindows(j, textoNoIdioma('opTitulo', i), textoNoIdioma('opMsg', i, { s: 'Qase', r: prev.rotulo }), textoNoIdioma('opDet', i, { x: prev.resumo + '\n\n' + prev.efeito, p: obterEspaco(run.espacoId).nome }), textoNoIdioma('opBtn', i)))) return { canceled: true };
  return { canceled: false, ...(await criarRunNoQase({ executor: servicosDoAplicativo }, a.id, { confirmado: true })) };
};
