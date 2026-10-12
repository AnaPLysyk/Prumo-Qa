/** Consulta a última versão no GitHub e diz se há atualização; quando não conclui, diz o motivo (sem conexão, limite, recusa...). */
import { z } from 'zod';
import { analisarVersao } from '../../ajuda/versoes/analisarVersao.js';
import { compararVersoes } from '../../ajuda/versoes/compararVersoes.js';
import { enderecoDaVersao } from '../../ajuda/versoes/enderecoDaVersao.js';
import { destinoAutorizado } from './destinoAutorizado.js';
import { limparTextoDaRelease } from './limparTextoDaRelease.js';
import { Resultado, limiteResposta, mensagemOffline, releaseSchema, urlConsulta } from '../tipos/consulta.js';

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
