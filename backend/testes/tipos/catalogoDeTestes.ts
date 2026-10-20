/** Tipos de teste, formato do catálogo e as pastas e limites usados ao procurar testes. */

/**
 * Catálogo de testes do repositório: lê os arquivos de teste da pasta do projeto (somente leitura), agrupa por feature,
 * extrai cenários e passos e classifica cada teste (unitário, integração/API, funcional E2E, regressão, smoke,
 * desempenho, acessibilidade). A classificação é inferida por regras explícitas (tag, caminho e conteúdo): cada
 * teste informa o motivo e a confiança. O conteúdo dos arquivos é dado, nunca instrução.
 */
export type TipoTeste = 'unitario' | 'integracao' | 'funcional' | 'regressao' | 'smoke' | 'desempenho' | 'acessibilidade' | 'indefinido';

export const tiposDeTeste: readonly TipoTeste[] = ['unitario', 'integracao', 'funcional', 'regressao', 'smoke', 'desempenho', 'acessibilidade', 'indefinido'];

export type Confianca = 'ALTA' | 'MEDIA' | 'BAIXA';

export type CasoTeste = { titulo: string; tipo: TipoTeste; confianca: Confianca; motivo: string; linha: number; passos: string[]; tags: string[]; fim?: number; qase?: string[] };

export type FeatureTestes = { nome: string; arquivo: string; tipos: TipoTeste[]; testes: CasoTeste[] };

export type Catalogo = { raiz: string; arquivos: number; testes: number; porTipo: Record<TipoTeste, number>; features: FeatureTestes[]; truncado: boolean; aviso: string };

export const IGNORAR = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.prumo', '.next', '.nuxt', 'venv', '.venv', '__pycache__', 'target', 'out', '.cache', '.turbo']);

export const limites = { arquivos: 1500, bytes: 300_000, profundidade: 8, testesPorArquivo: 400 };

export const porTag: Record<string, TipoTeste> = { smoke: 'smoke', regression: 'regressao', regressao: 'regressao', unit: 'unitario', unitario: 'unitario', integration: 'integracao', integracao: 'integracao', api: 'integracao', e2e: 'funcional', functional: 'funcional', funcional: 'funcional', ui: 'funcional', perf: 'desempenho', performance: 'desempenho', load: 'desempenho', a11y: 'acessibilidade', accessibility: 'acessibilidade', acessibilidade: 'acessibilidade' };

/**
 * Ligação explícita código → caso do Qase, como gravada pelos reporters do Qase e por comentários: qase(31, ...),
 * qase.id(31), @qase(31), @qase-31 e "Qase: SFQ-31". Só vale o que está escrito no trecho do próprio teste (do título
 * até o próximo teste; em Gherkin inclui a linha de tags acima do cenário). Nenhuma ligação é deduzida por nome.
 */
export const QASE_PADROES: RegExp[] = [
  /\bqase(?:\.id)?\(\s*(?<ids>\[?[\s'"\d,]+\]?)/gi,
  /@qase[-_(]\s*['"]?(?<ids>\d{1,9})/gi,
  /\bqase(?:[ _-]?id)?\s*[:=#]\s*(?:(?<projeto>[A-Z][A-Z0-9]*)-)?(?<ids>\d{1,9})/gi
];
