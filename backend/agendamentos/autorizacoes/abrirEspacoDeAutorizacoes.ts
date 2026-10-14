/** Libera espaço no limite de autorizações descartando apenas registros que já não autorizam ações, dos mais antigos aos mais novos. */
export function abrirEspacoDeAutorizacoes<T extends { criadaEm: string }>(lista: T[], vigente: (item: T) => boolean): T[] {
  if (lista.length < 300) return lista;
  const descartados = new Set(lista.filter(item => !vigente(item)).sort((a, b) => a.criadaEm.localeCompare(b.criadaEm)).slice(0, lista.length - 299));
  return lista.filter(item => !descartados.has(item));
}
