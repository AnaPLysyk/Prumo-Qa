/** Classifica um teste (unitário, integração, funcional, regressão, smoke, desempenho, acessibilidade) dizendo o motivo e a confiança. */
import { Confianca, TipoTeste, porTag } from '../tipos/catalogoDeTestes.js';

/** Classifica um teste. Ordem: tag explícita > caminho/nome > conteúdo do arquivo > padrão. */
export function classificarTeste(rel: string, conteudo: string, tags: string[]): { tipo: TipoTeste; confianca: Confianca; motivo: string } {
  for (const t of tags) if (porTag[t]) return { tipo: porTag[t]!, confianca: 'ALTA', motivo: `tag @${t}` };
  const caminho = rel.toLowerCase().replaceAll('\\', '/');
  const seg = (re: RegExp) => re.test(caminho);
  if (seg(/(^|\/)(smoke)(\/|[._-])/)) return { tipo: 'smoke', confianca: 'ALTA', motivo: 'caminho contém smoke' };
  if (seg(/(^|\/)(regress(ion|ao|ão)|regression)(\/|[._-])/)) return { tipo: 'regressao', confianca: 'ALTA', motivo: 'caminho contém regressão' };
  if (seg(/(^|\/)(perf|performance|load|stress|k6)(\/|[._-])/) || /from ['"]k6/.test(conteudo)) return { tipo: 'desempenho', confianca: /from ['"]k6/.test(conteudo) ? 'ALTA' : 'MEDIA', motivo: 'carga/desempenho (k6 ou caminho)' };
  if (seg(/(^|\/)(a11y|acessibilidade|accessibility)(\/|[._-])/) || /axe-core|@axe-core|AxeBuilder|checkA11y/.test(conteudo)) return { tipo: 'acessibilidade', confianca: 'MEDIA', motivo: 'axe ou caminho de acessibilidade' };
  if (seg(/(^|\/)(unit|unitarios?|unitario)(\/|[._-])/)) return { tipo: 'unitario', confianca: 'ALTA', motivo: 'caminho contém unit' };
  if (seg(/(^|\/)(integration|integracao|api|contract|contrato)(\/|[._-])/)) return { tipo: 'integracao', confianca: 'MEDIA', motivo: 'caminho de integração/API' };
  if (seg(/(^|\/)(e2e|functional|funcional|cypress|playwright|ui)(\/|[._-])/) || /\.feature$/.test(caminho)) return { tipo: 'funcional', confianca: 'MEDIA', motivo: 'caminho E2E/funcional ou arquivo .feature' };
  if (/@playwright\/test|from ['"]cypress|page\.goto\(|cy\.visit\(|browser\.url\(|webdriver/i.test(conteudo)) return { tipo: 'funcional', confianca: 'MEDIA', motivo: 'usa navegador (Playwright/Cypress)' };
  if (/supertest|request\(app\)|fetch\(['"`]https?:|axios\.(get|post)|APIRequestContext|requests\.(get|post)/.test(conteudo)) return { tipo: 'integracao', confianca: 'MEDIA', motivo: 'chama API/HTTP' };
  if (/\.(spec|test)\.[cm]?[jt]sx?$|\.py$/.test(caminho)) return { tipo: 'unitario', confianca: 'BAIXA', motivo: 'sem navegador nem HTTP: provável unitário' };
  return { tipo: 'indefinido', confianca: 'BAIXA', motivo: 'sem sinais suficientes' };
}
