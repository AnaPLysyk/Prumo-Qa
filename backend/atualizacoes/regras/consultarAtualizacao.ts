/** Consulta se há versão nova (no teste, só no servidor local) e atualiza o aviso do sino. */
import { app } from 'electron';
import { estadoDoAplicativo } from '../../aplicativo/estadoDoAplicativo.js';
import { versao } from '../../aplicativo/tipos/aplicativo.js';
import { avisoDeVersaoPendente } from './avisoDeVersaoPendente.js';
import { registrarConsultaDeVersao } from './registrarConsultaDeVersao.js';
import { verificarAtualizacao } from './verificarAtualizacao.js';
import { mensagemOffline, urlConsulta } from '../tipos/consulta.js';

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
