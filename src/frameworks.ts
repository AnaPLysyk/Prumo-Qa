import { hash } from './projeto.js';

/**
 * Conhecimento especializado de engenharia de testes: detecção do framework por evidências reais e análise estática
 * determinística de arquivos de teste. Não há modelo de IA aqui: a IA hospedeira usa estes achados e a Skill do framework.
 * Só lê o que o inventário autorizado do projeto já trouxe; nunca altera testes nem executa código do projeto.
 */
export type Fonte = { path: string; content: string };
export type Framework = { id: 'playwright' | 'api-rest'; nome: string; estado: 'CONFIRMADO' | 'PROVAVEL' | 'INCERTO'; evidencias: string[]; skill: string; observacao?: string };

const doc = 'https://playwright.dev/docs';
export const conhecimento = {
  playwright: { id: 'playwright', nome: 'Playwright (TypeScript/JavaScript)', skill: 'skills/playwright/SKILL.md', fontes: [`${doc}/best-practices`, `${doc}/locators`, `${doc}/test-assertions`, `${doc}/test-retries`, `${doc}/actionability`, `${doc}/writing-tests`, `${doc}/api-testing`] },
  'api-rest': { id: 'api-rest', nome: 'Fundamentos de testes de API REST', skill: 'skills/api-rest/SKILL.md', fontes: [`${doc}/api-testing`] }
} as const;

const config = /(^|[\\/])playwright\.config\.(ts|js|mjs|cjs)$/;
const dependencia = (f: Fonte) => { if (!/(^|[\\/])package\.json$/.test(f.path)) return false; try { const p = JSON.parse(f.content); return !!({ ...p.dependencies, ...p.devDependencies })['@playwright/test']; } catch { return false; } };
const importa = (f: Fonte) => /\.(spec|test)\.[cm]?[jt]s$/.test(f.path) && /from\s+['"]@playwright\/test['"]|require\(\s*['"]@playwright\/test['"]\s*\)/.test(f.content);

/** Estado só é CONFIRMADO com dependência + (configuração ou teste que importa o pacote). Nome de pasta nunca confirma. */
export function detectarFrameworks(fontes: Fonte[], omitidos: string[] = []): Framework[] {
  const r: Framework[] = []; const norm = (s: string) => s.replaceAll('\\', '/');
  const dep = fontes.filter(dependencia).map(f => `${norm(f.path)}: dependência @playwright/test`);
  const cfg = fontes.filter(f => config.test(f.path)).map(f => `${norm(f.path)}: arquivo de configuração`);
  const specs = fontes.filter(importa).map(f => `${norm(f.path)}: importa @playwright/test`);
  const nomes = [...fontes.map(f => f.path), ...omitidos].filter(p => /playwright/i.test(norm(p)) && !config.test(p)).map(norm);
  if (dep.length && (cfg.length || specs.length)) r.push({ id: 'playwright', nome: conhecimento.playwright.nome, estado: 'CONFIRMADO', evidencias: [...dep, ...cfg, ...specs.slice(0, 5)], skill: conhecimento.playwright.skill });
  else if (dep.length || cfg.length || specs.length) r.push({ id: 'playwright', nome: conhecimento.playwright.nome, estado: 'PROVAVEL', evidencias: [...dep, ...cfg, ...specs.slice(0, 5)], skill: conhecimento.playwright.skill, observacao: 'Evidência parcial: falta dependência ou configuração/teste que importe @playwright/test dentro do contexto autorizado.' });
  else if (nomes.length) r.push({ id: 'playwright', nome: conhecimento.playwright.nome, estado: 'INCERTO', evidencias: nomes.slice(0, 5).map(n => `${n}: nome de caminho (não confirma)`), skill: conhecimento.playwright.skill, observacao: 'Apenas o nome de um caminho lembra Playwright; sem dependência, configuração ou import, não há confirmação.' });
  const api = fontes.filter(f => /\.(spec|test)\.[cm]?[jt]s$/.test(f.path) && (/\b(request|apiContext|api)\.(get|post|put|patch|delete)\s*\(/.test(f.content) || /from\s+['"]supertest['"]/.test(f.content))).map(f => `${norm(f.path)}: chamadas HTTP em teste`);
  if (api.length) r.push({ id: 'api-rest', nome: conhecimento['api-rest'].nome, estado: 'PROVAVEL', evidencias: api.slice(0, 5), skill: conhecimento['api-rest'].skill, observacao: 'Inferido do uso de chamadas HTTP em arquivos de teste.' });
  return r;
}

export type AchadoTeste = { regra: string; severidade: 'high' | 'medium' | 'low'; arquivo: string; linha: number; trecho: string; orientacao: string; fonte: string };
const semComentarios = (c: string) => c.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).split('\n').map(l => l.replace(/(^|[^:'"`])\/\/.*$/, '$1'));
const recorte = (l: string) => l.trim().slice(0, 140);
/** Corpo de cada test( ... ) por contagem de chaves, com linha inicial. Aproximação textual; não é um parser completo. */
function blocosDeTeste(linhas: string[]) {
  const blocos: { titulo: string; inicio: number; corpo: string }[] = [];
  for (let i = 0; i < linhas.length; i++) {
    const m = /\b(?:test|it)(?:\.(?:only|skip|fixme))?\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/.exec(linhas[i]!); if (!m) continue;
    let prof = 0, aberto = false, corpo = '';
    for (let j = i; j < linhas.length && j < i + 400; j++) { corpo += linhas[j] + '\n'; for (const ch of linhas[j]!) { if (ch === '{') { prof++; aberto = true; } else if (ch === '}') prof--; } if (aberto && prof <= 0) break; }
    blocos.push({ titulo: m[2]!, inicio: i + 1, corpo });
  }
  return blocos;
}
const selFragil = (s: string) => /^\s*(\/\/|xpath=|\.\.\/)/.test(s) || /:nth-(child|of-type)\(/.test(s) || /\.(css|sc|jss|MuiBox)-[A-Za-z0-9]{4,}/.test(s) || /^(body|html)\s*>/.test(s) || /(?:^|\s)(?:div|span|ul|li|tr|td|section)\s*(?:>|\s)\s*(?:div|span|ul|li|tr|td|section)\s*(?:>|\s)\s*(?:div|span|ul|li|tr|td|section)/.test(s);

/** Análise estática de UM arquivo de teste Playwright. Cada regra cita a fonte oficial; falsos positivos possíveis estão descritos na orientação. */
export function analisarPlaywright(arquivo: string, conteudo: string): AchadoTeste[] {
  const out: AchadoTeste[] = []; const linhas = semComentarios(conteudo); const add = (regra: string, severidade: AchadoTeste['severidade'], i: number, orientacao: string, fonte: string) => out.push({ regra, severidade, arquivo: arquivo.replaceAll('\\', '/'), linha: i + 1, trecho: recorte(linhas[i]!), orientacao, fonte });
  linhas.forEach((l, i) => {
    if (/\bwaitForTimeout\s*\(/.test(l) || /new Promise\([^)]*setTimeout/.test(l)) add('PW_ESPERA_FIXA', 'medium', i, 'Espera por tempo fixo. Ações e assertions do Playwright já aguardam a condição; troque por uma assertion que repete (await expect(...)) ou por um evento observável.', `${doc}/writing-tests`);
    for (const m of l.matchAll(/\.locator\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g)) if (selFragil(m[2]!)) add('PW_SELETOR_FRAGIL', 'medium', i, `Seletor preso à estrutura do DOM ("${m[2]!.slice(0, 50)}"). Prefira locators por papel, rótulo, texto ou data-testid.`, `${doc}/locators#locate-by-css-or-xpath`);
    if (/\.(nth\(\s*\d+\s*\)|first\(\)|last\(\))/.test(l) && /locator|getBy/.test(l)) add('PW_SELETOR_FRAGIL', 'low', i, 'first()/last()/nth() desligam a verificação de unicidade do locator e dependem da ordem; filtre ou encadeie para identificar o elemento.', `${doc}/locators#strictness`);
    if (/\bexpect\(\s*true\s*\)|expect\(\s*(\d+)\s*\)\.toBe\(\s*\1\s*\)/.test(l) || /\)\.(toBeTruthy|toBeDefined)\(\)/.test(l) && !/\.(ok|status)\(\)/.test(l)) add('PW_ASSERTION_FRACA', 'medium', i, 'Assertion que aceita quase qualquer valor e não prova o comportamento esperado. Compare com o resultado esperado (texto, contagem, estado).', `${doc}/test-assertions`);
    if (/^\s*expect\(/.test(l) && !/\bawait\b/.test(l) && /\)\.(not\.)?(toBeVisible|toBeHidden|toHaveText|toContainText|toHaveValue|toHaveCount|toBeEnabled|toBeDisabled|toBeChecked|toHaveURL|toHaveTitle|toHaveAttribute|toBeAttached)\(/.test(l)) add('PW_ASSERTION_SEM_AWAIT', 'high', i, 'Assertion que repete sem await: o teste pode terminar antes da verificação e passar sem validar nada.', `${doc}/best-practices#use-web-first-assertions`);
    if (/expect\(\s*await\s+.*?\.(isVisible|isHidden|isChecked|isEnabled|textContent|innerText|count)\(\)\s*\)\.(toBe|toEqual|toBeTruthy|toBeFalsy)/.test(l)) add('PW_ASSERTION_NAO_REPETE', 'medium', i, 'Verificação manual: o valor é lido uma vez e não espera a página. Use a assertion que repete (toBeVisible, toHaveText, toHaveCount).', `${doc}/best-practices#dont-use-manual-assertions`);
    if (/\btest\.(skip|fixme)\s*\(|\b(?:describe|test)\.(skip|fixme)\b/.test(l) || /\bt(est)?\.skip\b/.test(l)) add('PW_TESTE_IGNORADO', 'medium', i, 'Teste ignorado: não conta como cobertura e pode esconder uma falha. Corrija, remova com justificativa ou registre o motivo e o prazo.', `${doc}/test-retries`);
    if (/\b(?:test|it|describe)\.only\s*\(/.test(l)) add('PW_TEST_ONLY', 'high', i, 'test.only faz os demais testes não rodarem. Remova antes de integrar (ou use forbidOnly no CI).', `${doc}/test-retries`);
    if (/\bforce\s*:\s*true\b/.test(l)) add('PW_FORCE', 'medium', i, 'force: true desliga verificações de actionability e pode "passar" mesmo com o elemento coberto ou inativo. Investigue o motivo em vez de forçar.', `${doc}/actionability#forcing-actions`);
    if (/\bpage\.\$\$?(eval)?\(/.test(l)) add('PW_API_LEGADA', 'low', i, 'ElementHandle ($, $$) não tem a espera e a repetição dos locators. Use page.locator()/getBy*.', `${doc}/locators`);
    if (/\btest\.describe\.serial\b|mode\s*:\s*['"]serial['"]/.test(l)) add('PW_DEPENDENCIA_ENTRE_TESTES', 'medium', i, 'Modo serial: se um teste falha, os seguintes são pulados e a retentativa roda o grupo todo. Prefira testes isolados.', `${doc}/test-retries#serial-mode`);
    if (/\bretries\s*:\s*[1-9]/.test(l)) add('PW_RETRY_ESCONDE_FALHA', 'low', i, 'Retentativas podem mascarar instabilidade. Mantenha o relatório de "flaky" visível, ative trace na primeira retentativa e investigue a causa.', `${doc}/test-retries`);
  });
  const blocos = blocosDeTeste(linhas); const corpos = new Map<string, { titulo: string; inicio: number }>();
  for (const b of blocos) {
    if (/\b(?:test|it)\.(skip|fixme)\b/.test(b.corpo.split('\n')[0]!)) continue;
    const temAssertion = /\bexpect(?:\.soft|\.poll)?\s*\(|\btoPass\b|\b(?:assert|verify|check|should|validar|verificar|conferir)\w*\s*\(/i.test(b.corpo);
    if (!temAssertion) add('PW_SEM_ASSERTION', 'medium', b.inicio - 1, `O teste "${b.titulo.slice(0, 60)}" não contém assertion nem chamada de verificação: ele só prova que nada lançou erro. Se a verificação está em função auxiliar, confirme.`, `${doc}/writing-tests`);
    if (/\b(?:request|apiContext|api)\.(get|post|put|patch|delete)\s*\(/.test(b.corpo) && !/\.(json|text|body)\(\)|toHaveProperty|toMatchObject|toEqual|toContainEqual|toStrictEqual/.test(b.corpo)) add('PW_API_SO_STATUS', 'low', b.inicio - 1, `O teste de API "${b.titulo.slice(0, 50)}" confere só o sucesso da resposta. Valide também o corpo e, quando houver gravação, o estado no servidor (consulta posterior).`, `${doc}/api-testing`);
    const norm = hash(b.corpo.replace(/^[^{]*\{/, '').replace(/\s+/g, ' ').trim()); const igual = corpos.get(norm);
    if (igual && b.corpo.replace(/\s+/g, '').length > 60) add('PW_TESTE_DUPLICADO', 'medium', b.inicio - 1, `O teste "${b.titulo.slice(0, 50)}" tem corpo idêntico ao de "${igual.titulo.slice(0, 50)}" (linha ${igual.inicio}). Consolide ou diferencie o cenário.`, `${doc}/best-practices#make-tests-as-isolated-as-possible`);
    else corpos.set(norm, { titulo: b.titulo, inicio: b.inicio });
  }
  return out.sort((a, b) => a.linha - b.linha || a.regra.localeCompare(b.regra));
}
export const ehTestePlaywright = (arquivo: string, conteudo: string) => /\.(spec|test)\.[cm]?[jt]s$/.test(arquivo) && /from\s+['"]@playwright\/test['"]|require\(\s*['"]@playwright\/test['"]\s*\)/.test(conteudo);
