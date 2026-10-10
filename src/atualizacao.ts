import { z } from 'zod';
import { repositorio, compararVersoes, analisarVersao, urlRelease } from './versoes.js';

/**
 * Verificação MANUAL de atualização. Só consulta a release oficial; nunca baixa nem executa instalador.
 * Enviado ao GitHub: uma requisição HTTPS GET sem corpo, sem cookies e com User-Agent "PrumoQA/<versão>".
 * Não enviado: logs, projetos, caminhos, identificadores, evidências, tokens. O servidor remoto vê, como em qualquer
 * conexão HTTPS, o endereço IP de origem e dados normais de rede; isto não é anonimato.
 */
export const urlConsulta = `https://api.github.com/repos/${repositorio}/releases/latest`;
export const mensagemOffline = 'Não foi possível verificar atualizações. O aplicativo continua disponível para uso local.';
const limiteResposta = 1_000_000;

export type Resultado = {
  status: 'ATUALIZACAO_DISPONIVEL' | 'ATUALIZADO' | 'INSTALADA_MAIS_NOVA' | 'SEM_RELEASE' | 'INDISPONIVEL' | 'RESPOSTA_INVALIDA';
  installed: string; latest?: string; notes?: string; url?: string; message: string;
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
  const indisponivel = (): Resultado => ({ status: 'INDISPONIVEL', installed: instalada, message: mensagemOffline });
  let resposta: Response;
  try {
    resposta = await (opcoes.buscar ?? fetch)(url, { method: 'GET', redirect: 'error', credentials: 'omit', cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': `PrumoQA/${instalada}` }, signal: AbortSignal.timeout(opcoes.timeoutMs ?? 8000) });
  } catch { return indisponivel(); }
  if (resposta.status === 404) return { status: 'SEM_RELEASE', installed: instalada, message: 'O repositório oficial ainda não publicou nenhuma release.' };
  if (!resposta.ok) return indisponivel();
  let release: z.infer<typeof releaseSchema>;
  try {
    const texto = await resposta.text();
    if (texto.length > limiteResposta) throw new Error('grande');
    release = releaseSchema.parse(JSON.parse(texto));
    if (release.draft || release.prerelease) throw new Error('nao-oficial');
  } catch { return { status: 'RESPOSTA_INVALIDA', installed: instalada, message: 'A resposta recebida não é uma release oficial válida e foi ignorada.' }; }
  const latest = release.tag_name.slice(1);
  // A página oficial é reconstruída da tag validada; html_url do servidor nunca é repassado à interface.
  const oficial = urlRelease(latest);
  const cmp = compararVersoes(latest, instalada);
  const base = { installed: instalada, latest, url: oficial, notes: limpar(release.body ?? '') };
  if (cmp > 0) return { status: 'ATUALIZACAO_DISPONIVEL', ...base, message: `A versão ${latest} está disponível. Nada será baixado ou instalado sem a sua ação.` };
  if (cmp === 0) return { status: 'ATUALIZADO', ...base, message: 'Você já usa a versão mais recente publicada.' };
  return { status: 'INSTALADA_MAIS_NOVA', ...base, message: 'A versão instalada é mais nova que a última release publicada.' };
}
