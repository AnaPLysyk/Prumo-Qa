/** Reúne identificar arquivos de teste da funcionalidade, mantendo cada operação identificável pelo nome. */


/** Diz pelo nome se um arquivo é de teste (.spec, .test, .feature, test_*.py). */

export const pareceArquivoDeTeste = (n: string) => /\.(spec|test)\.[cm]?[jt]sx?$/i.test(n) || /\.feature$/i.test(n) || /^test_.*\.py$/i.test(n) || /_test\.py$/i.test(n);

/** Diz pelo caminho se um arquivo é um pipeline do GitHub Actions (.github/workflows/*.yml ou *.yaml, sem subpastas). */

export const pareceArquivoDePipeline = (rel: string) => /^\.github\/workflows\/[A-Za-z0-9._-]+\.ya?ml$/.test(rel);

/** Lê as etiquetas @tag de um trecho de teste (ex.: @smoke). */

export const etiquetasDoTeste = (texto: string) => [...new Set([...texto.matchAll(/@([a-z][a-z0-9_-]{1,24})/gi)].map(m => m[1]!.toLowerCase()))].slice(0, 8);
