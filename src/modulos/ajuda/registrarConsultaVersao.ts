/** Registra a versão consultada e decide sobre indicador, aviso e som. */
import { compararVersoes } from '../../versoes.js';
import { lerPreferencias, gravar } from '../configuracoes/armazenarPreferencias.js';

/**
 * Registra uma consulta concluída. `disponivel` é a release mais nova que a instalada (ou null se já está atualizado).
 * - indicador: há versão a reconhecer (ainda não vista);
 * - tocarSom: som ligado, não silenciado, e a versão ainda não notificada: no máximo UMA vez por versão.
 * - notificar: versão ainda não vista nem notificada (notificação visual do Windows, uma vez por versão; "silenciar" só cala o som).
 * A decisão é gravada (versaoNotificada) para não repetir o som em consultas seguintes nem ao reabrir.
 */
export function registrarConsulta(disponivel: { versao: string; notas: string } | null, base?: string) {
  const p = lerPreferencias(base); const agora = new Date().toISOString();
  if (!disponivel) { gravar({ ...p, disponivel: null, ultimaConsulta: agora }, base); return { indicador: false, tocarSom: false, notificar: false, versao: null as string | null, notas: '' }; }
  const vista = !!p.versaoVisualizada && compararVersoes(disponivel.versao, p.versaoVisualizada) <= 0;
  const jaNotificada = !!p.versaoNotificada && compararVersoes(disponivel.versao, p.versaoNotificada) <= 0;
  const indicador = !vista; const tocarSom = indicador && p.som && !p.silenciar && !jaNotificada; const notificar = indicador && !jaNotificada;
  gravar({ ...p, disponivel: { versao: disponivel.versao, notas: disponivel.notas.slice(0, 4000) }, ultimaConsulta: agora, versaoNotificada: indicador && !jaNotificada ? disponivel.versao : p.versaoNotificada }, base);
  return { indicador, tocarSom, notificar, versao: disponivel.versao, notas: disponivel.notas };
}
