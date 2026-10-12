/** Apaga os comentários de um código mantendo as linhas no lugar, para analisar só o que executa. */

export const codigoSemComentarios = (c: string) => c.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).split('\n').map(l => l.replace(/(^|[^:'"`])\/\/.*$/, '$1'));
