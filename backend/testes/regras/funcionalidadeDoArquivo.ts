/** Deduz o nome da funcionalidade a partir do caminho do arquivo de teste. */

export const funcionalidadeDoArquivo = (rel: string) => { const p = rel.replaceAll('\\', '/').split('/'); const arq = p.at(-1)!.replace(/\.(spec|test)\.[cm]?[jt]sx?$|\.feature$|\.py$/i, '').replace(/^test_|_test$/g, ''); const pai = p.length > 1 ? p.at(-2)! : ''; return (['tests', 'test', 'e2e', 'spec', 'specs', '__tests__'].includes(pai.toLowerCase()) || !pai ? arq : pai + ' / ' + arq).replace(/[-_.]+/g, ' ').slice(0, 120); };
