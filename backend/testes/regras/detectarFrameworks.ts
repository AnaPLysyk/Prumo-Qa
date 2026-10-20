/** Descobre, por evidência (dependência, configuração, imports), quais frameworks de teste o projeto usa. */

import { ehTestePlaywright } from './revisaoDeCobertura.js';
import { Fonte, Framework, config, conhecimento } from '../tipos/frameworks.js';

const declaraPlaywright = (f: Fonte) => { if (!/(^|[\\/])package\.json$/.test(f.path)) return false; try { const p = JSON.parse(f.content); return !!({ ...p.dependencies, ...p.devDependencies })['@playwright/test']; } catch { return false; } };

/** Estado só é CONFIRMADO com dependência + (configuração ou teste que importa o pacote). Nome de pasta nunca confirma. */
export function detectarFrameworks(fontes: Fonte[], omitidos: string[] = []): Framework[] {
  const r: Framework[] = []; const norm = (s: string) => s.replaceAll('\\', '/');
  const dep = fontes.filter(declaraPlaywright).map(f => `${norm(f.path)}: dependência @playwright/test`);
  const cfg = fontes.filter(f => config.test(f.path)).map(f => `${norm(f.path)}: arquivo de configuração`);
  const specs = fontes.filter(f => ehTestePlaywright(f.path, f.content)).map(f => `${norm(f.path)}: importa @playwright/test`);
  const nomes = [...fontes.map(f => f.path), ...omitidos].filter(p => /playwright/i.test(norm(p)) && !config.test(p)).map(norm);
  if (dep.length && (cfg.length || specs.length)) r.push({ id: 'playwright', nome: conhecimento.playwright.nome, estado: 'CONFIRMADO', evidencias: [...dep, ...cfg, ...specs.slice(0, 5)], skill: conhecimento.playwright.skill });
  else if (dep.length || cfg.length || specs.length) r.push({ id: 'playwright', nome: conhecimento.playwright.nome, estado: 'PROVAVEL', evidencias: [...dep, ...cfg, ...specs.slice(0, 5)], skill: conhecimento.playwright.skill, observacao: 'Evidência parcial: falta dependência ou configuração/teste que importe @playwright/test dentro do contexto autorizado.' });
  else if (nomes.length) r.push({ id: 'playwright', nome: conhecimento.playwright.nome, estado: 'INCERTO', evidencias: nomes.slice(0, 5).map(n => `${n}: nome de caminho (não confirma)`), skill: conhecimento.playwright.skill, observacao: 'Apenas o nome de um caminho lembra Playwright; sem dependência, configuração ou import, não há confirmação.' });
  const api = fontes.filter(f => /\.(spec|test)\.[cm]?[jt]s$/.test(f.path) && (/\b(request|apiContext|api)\.(get|post|put|patch|delete)\s*\(/.test(f.content) || /from\s+['"]supertest['"]/.test(f.content))).map(f => `${norm(f.path)}: chamadas HTTP em teste`);
  if (api.length) r.push({ id: 'api-rest', nome: conhecimento['api-rest'].nome, estado: 'PROVAVEL', evidencias: api.slice(0, 5), skill: conhecimento['api-rest'].skill, observacao: 'Inferido do uso de chamadas HTTP em arquivos de teste.' });
  return r;
}
