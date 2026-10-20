/** Formato dos nós e ligações do mapa de rastreabilidade. */

/**
 * Mapa de vínculos do projeto: Projeto Prumo <-> Jira <-> Qase <-> repositório <-> ticket <-> caso <-> plano <-> run <-> execução <-> evidência.
 * Só mostra o que foi CADASTRADO pela pessoa, REGISTRADO por um fluxo do Prumo OBSERVADO numa execução ou OBSERVADO_NO_CODIGO por leitura estática. Relação cadastrada não prova cobertura;
 * "lacunas" listam apenas ausência de cadastro. Nada é deduzido por semelhança de nomes.
 */
type No = { id: string; tipo: string; rotulo: string; detalhe?: string; estado?: string };

type Aresta = { de: string; para: string; tipo: string; origem: 'DECLARADO_PELO_USUARIO' | 'REGISTRADO_PELO_PRUMO' | 'OBSERVADO' | 'OBSERVADO_NO_CODIGO'; nota?: string };

/** O grafo em construção: nós e ligações já anotados, e como acrescentar cada um sem repetir. */
export type GrafoDeVinculos = { nos: Map<string, No>; arestas: Aresta[]; no: (n: No) => string; ar: (a: Aresta) => void };

/** Uma lacuna de cadastro: caso sem automação, caso sem ticket ou ticket sem caso. */
export type LacunaDoMapa = { tipo: string; id: string; mensagem: string };
