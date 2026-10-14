/** Diz pelo caminho se um arquivo é um pipeline do GitHub Actions (.github/workflows/*.yml ou *.yaml, sem subpastas). */

export const pareceArquivoDePipeline = (rel: string) => /^\.github\/workflows\/[A-Za-z0-9._-]+\.ya?ml$/.test(rel);
