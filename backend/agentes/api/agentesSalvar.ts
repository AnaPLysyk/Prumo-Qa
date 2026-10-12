/** Canal agentes:salvar: Habilitar especializações e bloquear capacidades da IA conectada neste projeto. */
import { salvarConfiguracao } from '../politicas/salvarConfiguracao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { usuarioDoWindows } from '../../aplicativo/janela/usuarioDoWindows.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';

export const agentesSalvar: TratadorDoCanal<'agentes:salvar'> = async (a, j) => {
  const i = idiomaAtual(); const bloq = Object.entries(a.politicas).filter(([, v]) => v === 'BLOQUEADO').map(([k]) => k).join(', ') || '—';
  if (!(await confirmarNoWindows(j, textoNoIdioma('agTitulo', i), textoNoIdioma('agMsg', i), textoNoIdioma('agDet', i, { e: a.especializacoes.join(', ') || '—', b: bloq }), textoNoIdioma('agBtn', i)))) return { canceled: true };
  return { canceled: false, configuracao: salvarConfiguracao(a.espacoId, { especializacoes: a.especializacoes, politicas: a.politicas }, usuarioDoWindows()) };
};
