/** Consulta se há versão nova (no teste, só no servidor local) e atualiza o aviso do sino. */
import { app } from 'electron';
import { estadoDoAplicativo } from '../../aplicativo/estadoDoAplicativo.js';
import { versao } from '../../aplicativo/tipos/aplicativo.js';
import { avisoDeVersaoPendente } from './avisoDeVersaoPendente.js';

import { verificarAtualizacao } from './verificarAtualizacao.js';
import { mensagemOffline, urlConsulta } from '../tipos/consulta.js';
import { compararVersoes } from '../../ajuda/versoes/compararVersoes.js';
import { gravarPreferencias } from '../../configuracoes/banco/gravarPreferencias.js';
import { lerPreferencias } from '../../configuracoes/banco/lerPreferencias.js';

/**
 * Registra uma consulta concluída. `disponivel` é a release mais nova que a instalada (ou null se já está atualizado).
 * - indicador: há versão a reconhecer (ainda não vista);
 * - tocarSom: som ligado, não silenciado, e a versão ainda não notificada: no máximo uma vez por versão.
 * - notificar: versão ainda não vista nem notificada (notificação visual do Windows, uma vez por versão; "silenciar" só cala o som).
 * A decisão é gravada (versaoNotificada) para não repetir o som em consultas seguintes nem ao reabrir.
 */
function registrarConsultaDeVersao(disponivel: { versao: string; notas: string } | null, base?: string) {
  const p = lerPreferencias(base); const agora = new Date().toISOString();
  if (!disponivel) { gravarPreferencias({ ...p, disponivel: null, ultimaConsulta: agora }, base); return { indicador: false, tocarSom: false, notificar: false, versao: null as string | null, notas: '' }; }
  const vista = !!p.versaoVisualizada && compararVersoes(disponivel.versao, p.versaoVisualizada) <= 0;
  const jaNotificada = !!p.versaoNotificada && compararVersoes(disponivel.versao, p.versaoNotificada) <= 0;
  const indicador = !vista; const tocarSom = indicador && p.som && !p.silenciar && !jaNotificada; const notificar = indicador && !jaNotificada;
  gravarPreferencias({ ...p, disponivel: { versao: disponivel.versao, notas: disponivel.notas.slice(0, 4000) }, ultimaConsulta: agora, versaoNotificada: indicador && !jaNotificada ? disponivel.versao : p.versaoNotificada }, base);
  return { indicador, tocarSom, notificar, versao: disponivel.versao, notas: disponivel.notas };
}


export async function consultarAtualizacao() {
  // Servidor de teste em 127.0.0.1 só é aceito fora do pacote (desenvolvimento e testes automatizados).
  const teste = !app.isPackaged ? process.env.PRUMO_UPDATE_TEST_URL : undefined;
  let r;
  try { r = await verificarAtualizacao(versao, teste ? { url: teste, permitirLocal: true } : { url: urlConsulta }); }
  catch { r = { status: 'INDISPONIVEL' as const, installed: versao, conclusivo: false, motivo: 'REDE' as const, message: mensagemOffline }; }
  estadoDoAplicativo.ultimaRelease = r.status === 'ATUALIZACAO_DISPONIVEL' ? r.url : undefined; estadoDoAplicativo.ultimaVersao = r.status === 'ATUALIZACAO_DISPONIVEL' ? r.latest : undefined;
  // Só respostas válidas alteram o aviso persistente; falha de rede mantém o que já se sabia (o sino continua offline).
  const valido = r.status === 'ATUALIZACAO_DISPONIVEL' || r.status === 'ATUALIZADO' || r.status === 'INSTALADA_MAIS_NOVA';
  const notificacao = valido ? registrarConsultaDeVersao(r.status === 'ATUALIZACAO_DISPONIVEL' ? { versao: r.latest!, notas: r.notes ?? '' } : null) : { indicador: avisoDeVersaoPendente(versao).indicador, tocarSom: false, notificar: false, versao: null, notas: '' };
  return { ...r, notificacao };
}
