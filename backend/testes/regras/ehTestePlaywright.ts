/** Diz se o arquivo é um teste Playwright. */

export const ehTestePlaywright = (arquivo: string, conteudo: string) => /\.(spec|test)\.[cm]?[jt]s$/.test(arquivo) && /from\s+['"]@playwright\/test['"]|require\(\s*['"]@playwright\/test['"]\s*\)/.test(conteudo);
