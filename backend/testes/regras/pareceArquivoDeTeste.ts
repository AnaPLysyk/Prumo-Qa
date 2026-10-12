/** Diz pelo nome se um arquivo é de teste (.spec, .test, .feature, test_*.py). */

export const pareceArquivoDeTeste = (n: string) => /\.(spec|test)\.[cm]?[jt]sx?$/i.test(n) || /\.feature$/i.test(n) || /^test_.*\.py$/i.test(n) || /_test\.py$/i.test(n);
