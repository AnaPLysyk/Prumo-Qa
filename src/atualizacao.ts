import { z } from 'zod';
import { repositorio, compararVersoes, analisarVersao, urlRelease } from './versoes.js';

/**
 * Verificação MANUAL de atualização. Só consulta a release oficial; nunca baixa nem executa instalador.
 * Enviado ao GitHub: uma requisição HTTPS GET sem corpo, sem cookies e com User-Agent "PrumoQA/<versão>".
 * Não enviado: logs, projetos, caminhos, identificadores, evidências, tokens. O servidor remoto vê, como em qualquer
 * conexão HTTPS, o endereço IP de origem e dados normais de rede; isto não é anonimato.
 */
export const urlConsulta = `https://api.github.com/repos/${repositorio}/releases/latest`;
export const mensagemOffline = 'Não foi possível verificar atualizações: a consulta não foi concluída. Isto não significa que não exista uma atualização. O aplicativo continua disponível para uso local.';
const limiteResposta = 1_000_000;

export type Resultado = {
  status: 'ATUALIZACAO_DISPONIVEL' | 'ATUALIZADO' | 'INSTALADA_MAIS_NOVA' | 'SEM_RELEASE' | 'INDISPONIVEL' | 'LIMITE_DE_TAXA' | 'RESPOSTA_INVALIDA';
  installed: string; latest?: string; notes?: string; url?: string; message: string;
  /** Só as respostas conclusivas dizem se existe ou não atualização. Falhas (rede, tempo, recusa, limite, resposta inválida) NÃO dizem nada sobre isso. */
  conclusivo: boolean;
  /** Por que a consulta não concluiu (somente quando conclusivo é falso). */
  motivo?: 'REDE' | 'TEMPO_ESGOTADO' | 'RECUSADO' | 'SERVIDOR' | 'LIMITE_DE_TAXA' | 'RESPOSTA_INVALIDA';
  /** Quando tentar de novo, se o GitHub informou (cabeçalhos x-ratelimit-reset ou retry-after). */
  tentarApos?: string;
};
const releaseSchema = z.object({
  tag_name: z.string().regex(/^v\d+\.\d+\.\d+$/), html_url: z.string().url(), body: z.string().nullable().optional(),
  draft: z.boolean().optional(), prerelease: z.boolean().optional()
}).passthrough();

/** Destino autorizado: fixo. Em desenvolvimento, testes podem usar um servidor em 127.0.0.1 (permitirLocal). */
export function destinoAutorizado(url: string, permitirLocal = false): boolean {
  let u: URL; try { u = new URL(url); } catch { return false; }
  if (u.protocol === 'https:' && u.hostname === 'api.github.com' && u.pathname === `/repos/${repositorio}/releases/latest` && !u.search && !u.username && !u.password && !u.port) return true;
  return permitirLocal && u.protocol === 'http:' && u.hostname === '127.0.0.1';
}
const limpar = (s: string) => s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, ' ').slice(0, 4000);

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
  const oficial = urlRelease(latest);
  const cmp = compararVersoes(latest, instalada);
  const base = { installed: instalada, latest, url: oficial, notes: limpar(release.body ?? ''), conclusivo: true as const };
  if (cmp > 0) return { status: 'ATUALIZACAO_DISPONIVEL', ...base, message: `A versão ${latest} está disponível. Nada será baixado ou instalado sem a sua ação.` };
  if (cmp === 0) return { status: 'ATUALIZADO', ...base, message: 'Você já usa a versão mais recente publicada.' };
  return { status: 'INSTALADA_MAIS_NOVA', ...base, message: 'A versão instalada é mais nova que a última release publicada.' };
}
