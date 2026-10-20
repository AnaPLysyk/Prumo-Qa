/** Lógica e contratos de atualizacoes: operações relacionadas no mesmo módulo. */
import { app, Notification } from "electron";
import { empilharAviso } from "../aplicativo/avisos/avisos.js";
import { navegarPara } from "../aplicativo/janela/controleDaJanela.js";
import { lerPreferencias, gravarPreferencias } from "../configuracoes/servico.js";
import { idiomaAtual } from "../configuracoes/servico.js";
import { compararVersoes, analisarVersao, enderecoDaVersao } from "../ajuda/servicoAjuda.js";
import { estadoDoAplicativo } from "../aplicativo/estadoDoAplicativo.js";
import { versao } from "../aplicativo/tipos/aplicativo.js";
import { mensagemOffline, urlConsulta, Resultado, limiteResposta, releaseSchema } from "./contratos.js";
import { z } from "zod";
import { destinoAutorizado } from "./servicoInstalacao.js";

export async function avisoAutomaticoDeVersao() {
  if (!lerPreferencias().avisoAutomatico || process.env.PRUMO_SEM_AVISO_AUTOMATICO === '1') return;
  if (!app.isPackaged && !process.env.PRUMO_UPDATE_TEST_URL) return;
  const r = await consultarAtualizacao(); const n = r.notificacao;
  if (r.status !== 'ATUALIZACAO_DISPONIVEL' || !n.notificar || !n.versao) return;
  // A janela (se aberta) acende o sino e toca o som quando for o caso; a notificação do Windows chega mesmo só na bandeja.
  const en = idiomaAtual() === 'en';
  const titulo = en ? `Prumo QA ${n.versao} available` : `Prumo QA ${n.versao} disponível`;
  const detalhe = en ? 'See what is new and update with one click in Help › Updates.' : 'Veja as novidades e atualize com um clique em Ajuda › Atualizações.';
  empilharAviso({ tipo: 'ATUALIZACAO_DISPONIVEL', titulo, detalhe, destino: 'atualizacoes', tocarSom: n.tocarSom });
  if (Notification.isSupported()) {
    const aviso = new Notification({ title: titulo, body: detalhe + (en ? ' Nothing is downloaded or installed without your click.' : ' Nada é baixado nem instalado sem o seu clique.'), silent: true });
    aviso.on('click', () => navegarPara('atualizacoes')); aviso.show();
  }
}

/** Indicador persistente (funciona offline): há release mais nova que a instalada, ainda não reconhecida pela pessoa. */
export function avisoDeVersaoPendente(instalada: string, base?: string) {
  const p = lerPreferencias(base); const d = p.disponivel;
  if (!d || compararVersoes(d.versao, instalada) <= 0) return { indicador: false as const };
  if (p.versaoVisualizada && compararVersoes(d.versao, p.versaoVisualizada) <= 0) return { indicador: false as const };
  return { indicador: true as const, versao: d.versao, notas: d.notas };
}

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

/** A pessoa viu a versão: o indicador some até existir uma versão mais nova. Nunca regride. */
export function marcarVersaoVista(v: string, base?: string) {
  if (!analisarVersao(v)) throw new Error('INVALID_VERSION: versão inválida.');
  const p = lerPreferencias(base); if (p.versaoVisualizada && compararVersoes(v, p.versaoVisualizada) < 0) return p;
  return gravarPreferencias({ ...p, versaoVisualizada: v }, base);
}

/** Tira caracteres de controle e limita o texto vindo da release. */

const limparTextoDaRelease = (s: string) => s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, ' ').slice(0, 4000);

export async function verificarAtualizacao(instalada: string, opcoes: { buscar?: typeof fetch; url?: string; permitirLocal?: boolean; timeoutMs?: number } = {}): Promise<Resultado> {
  if (!analisarVersao(instalada)) throw new Error('INVALID_VERSION: versão instalada inválida.');
  const url = opcoes.url ?? urlConsulta;
  if (!destinoAutorizado(url, opcoes.permitirLocal)) throw new Error('UPDATE_DESTINATION_FORBIDDEN: destino de atualização não autorizado.');
  const indisponivel = (motivo: 'REDE' | 'TEMPO_ESGOTADO' | 'RECUSADO' | 'SERVIDOR', detalhe: string): Resultado => ({ status: 'INDISPONIVEL', installed: instalada, conclusivo: false, motivo, message: `${detalhe} ${mensagemOffline}` });
  let resposta: Response;
  try {
    resposta = await (opcoes.buscar ?? fetch)(url, { method: 'GET', redirect: 'error', credentials: 'omit', cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': `PrumoQA/${instalada}` }, signal: AbortSignal.timeout(opcoes.timeoutMs ?? 8000) });
  } catch (e) { const t = (e as Error)?.name === 'TimeoutError' || (e as Error)?.name === 'AbortError'; return t ? indisponivel('TEMPO_ESGOTADO', 'O GitHub não respondeu a tempo.') : indisponivel('REDE', 'Não foi possível falar com o GitHub (sem conexão ou resposta bloqueada).'); }
  if (resposta.status === 404) return { status: 'SEM_RELEASE', installed: instalada, conclusivo: true, message: 'O repositório oficial ainda não publicou nenhuma release.' };
  if (!resposta.ok) {
    const h = resposta.headers; const limite = resposta.status === 429 || (resposta.status === 403 && (h.get('x-ratelimit-remaining') === '0' || h.has('retry-after')));
    if (limite) {
      const reset = Number(h.get('x-ratelimit-reset')); const espera = Number(h.get('retry-after')); const quando = Number.isFinite(espera) && h.has('retry-after') ? Date.now() + espera * 1000 : Number.isFinite(reset) && h.has('x-ratelimit-reset') ? reset * 1000 : NaN;
      const tentarApos = Number.isFinite(quando) && quando > 0 ? new Date(quando).toISOString() : undefined;
      return { status: 'LIMITE_DE_TAXA', installed: instalada, conclusivo: false, motivo: 'LIMITE_DE_TAXA', ...(tentarApos ? { tentarApos } : {}), message: `O GitHub limitou o número de consultas (HTTP ${resposta.status}).${tentarApos ? ` Tente de novo depois de ${tentarApos}.` : ' Tente de novo mais tarde.'} Isto não significa que não exista uma atualização. O aplicativo continua disponível para uso local.` };
    }
    return resposta.status >= 500 ? indisponivel('SERVIDOR', `O GitHub está com problemas (HTTP ${resposta.status}).`) : indisponivel('RECUSADO', `O GitHub recusou a consulta (HTTP ${resposta.status}).`);
  }
  let release: z.infer<typeof releaseSchema>;
  try {
    const texto = await resposta.text();
    if (texto.length > limiteResposta) throw new Error('grande');
    release = releaseSchema.parse(JSON.parse(texto));
    if (release.draft || release.prerelease) throw new Error('nao-oficial');
  } catch { return { status: 'RESPOSTA_INVALIDA', installed: instalada, conclusivo: false, motivo: 'RESPOSTA_INVALIDA', message: 'A resposta recebida não é uma release oficial válida e foi ignorada. Isto não significa que não exista uma atualização.' }; }
  const latest = release.tag_name.slice(1);
  // A página oficial é reconstruída da tag validada; html_url do servidor nunca é repassado à interface.
  const oficial = enderecoDaVersao(latest);
  const cmp = compararVersoes(latest, instalada);
  const base = { installed: instalada, latest, url: oficial, notes: limparTextoDaRelease(release.body ?? ''), conclusivo: true as const };
  if (cmp > 0) return { status: 'ATUALIZACAO_DISPONIVEL', ...base, message: `A versão ${latest} está disponível. Nada será baixado ou instalado sem a sua ação.` };
  if (cmp === 0) return { status: 'ATUALIZADO', ...base, message: 'Você já usa a versão mais recente publicada.' };
  return { status: 'INSTALADA_MAIS_NOVA', ...base, message: 'A versão instalada é mais nova que a última release publicada.' };
}
