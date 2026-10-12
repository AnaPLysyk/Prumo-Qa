/** Canal agenda:politica: Aprovar uma política de publicação de comentários no Jira restrita a tickets, tipos, validade e limite. */
import { criarPoliticaPublicacao } from '../autorizacoes/criarPoliticaPublicacao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { usuarioDoWindows } from '../../aplicativo/janela/usuarioDoWindows.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';

export const agendaPolitica: TratadorDoCanal<'agenda:politica'> = async (a, j) => {
  const i = idiomaAtual(); const e = obterEspaco(a.espacoId);
  if (!(await confirmarNoWindows(j, textoNoIdioma('polTitulo', i), textoNoIdioma('polMsg', i, { t: a.tickets.join(', ') }), textoNoIdioma('polDet', i, { p: e.nome, i: a.tipos.join(', '), d: a.dias, m: a.maxPublicacoes }), textoNoIdioma('polBtn', i)))) return { canceled: true };
  return { canceled: false, politica: criarPoliticaPublicacao(a.espacoId, { tickets: a.tickets, tipos: a.tipos, dias: a.dias, maxPublicacoes: a.maxPublicacoes }, usuarioDoWindows()) };
};
