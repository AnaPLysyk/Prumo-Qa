/** Canal runs:politica: Aprovar uma política para publicar resultados de uma run em rotinas agendadas. */
import { criarPoliticaEscrita } from '../../agendamentos/autorizacoes/criarPoliticaEscrita.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { usuarioDoWindows } from '../../aplicativo/janela/usuarioDoWindows.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';

export const runsPolitica: TratadorDoCanal<'runs:politica'> = async (a, j) => {
  const i = idiomaAtual(); const e = obterEspaco(a.espacoId);
  if (!(await confirmarNoWindows(j, textoNoIdioma('polQaseTitulo', i), textoNoIdioma('polQaseMsg', i, { r: a.runId }), textoNoIdioma('polQaseDet', i, { p: e.nome, d: a.dias, m: a.maxUsos }), textoNoIdioma('polQaseBtn', i)))) return { canceled: true };
  return { canceled: false, politica: criarPoliticaEscrita(a.espacoId, { operacao: 'qase.publicar_resultados', runs: [a.runId], dias: a.dias, maxUsos: a.maxUsos }, usuarioDoWindows()) };
};
