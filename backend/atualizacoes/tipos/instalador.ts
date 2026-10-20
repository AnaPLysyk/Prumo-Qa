/** Endereços permitidos, limites e argumentos do instalador baixado na atualização. */

/**
 * Atualizar com um clique: só depois da confirmação da pessoa, baixa o instalador oficial da release (URL montada
 * aqui a partir da versão validada, nunca recebida da janela), baixa o .sha256 publicado pelo CI na mesma release e só
 * devolve o arquivo se o resumo conferir. Redirecionamentos só para os hosts de download do GitHub, sempre HTTPS.
 * O SHA-256 vem da mesma release: protege contra download corrompido ou trocado no caminho, não contra a conta do
 * repositório comprometida (o instalador não é assinado; ver docs/SEGURANCA.md).
 */
export const HOSTS = new Set(['github.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com']);

export const LIMITE_INSTALADOR = 512 * 1024 * 1024;

export type Opcoes = { buscar?: typeof fetch; base?: string; permitirLocal?: boolean; pasta?: string; timeoutMs?: number };

/** Argumentos do instalador NSIS do electron-builder: silencioso, mantém atalhos e reabre o aplicativo ao terminar. */
export const argumentosInstalador = ['/S', '--updated', '--force-run'] as const;
