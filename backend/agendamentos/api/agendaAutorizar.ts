/** Canal agenda:autorizar: Autorizar previamente execuções agendadas de um escopo exato, com validade e limite de usos. */
import { autorizarRotina } from '../autorizacoes/autorizarRotina.js';
import { obterRotina } from '../banco/agenda.js';
import { permissoesDaRotina } from '../regras/permissoesDaRotina.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';
import { solicitarAprovacao } from '../../testes/aprovacao/solicitarAprovacao.js';

export const agendaAutorizar: TratadorDoCanal<'agenda:autorizar'> = async (a, j) => {
  const i = idiomaAtual(); const r = obterRotina(a.id);
  if (!(await confirmarNoWindows(j, textoNoIdioma('autTitulo', i), textoNoIdioma('autMsg', i, { n: r.nome, d: a.dias, u: a.maxUsos }), textoNoIdioma('autDet', i, { r: permissoesDaRotina(r).join('\n'), a: r.ambiente }), textoNoIdioma('continuar', i)))) return { canceled: true };
  return { canceled: false, autorizacoes: await autorizarRotina(a.id, { dias: a.dias, maxUsos: a.maxUsos }, solicitarAprovacao) };
};
