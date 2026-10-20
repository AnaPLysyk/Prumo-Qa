/** Revisão Playwright e detecção de frameworks — arquivos relacionados agrupados para manutenção. */
import { hash } from "../../compartilhado/seguranca/hash.js";
import { AchadoTeste, doc, Fonte, Framework, config, conhecimento } from "../tipos/catalogoDeTestes.js";
import { Projeto } from "../../compartilhado/projeto/contratos.js";
import { revisaoSchema, AnaliseDeCobertura, Revisao } from "../tipos/catalogoDeTestes.js";
import { lerSeguro } from "../../compartilhado/seguranca/lerSeguro.js";
import { contextoParaRevisao } from "../../agentes/regras/consultasDeContextos.js";
import { caminhoSeguro } from "../../compartilhado/seguranca/caminhoSeguro.js";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";

// ── analisarPlaywright ──
/** Separa cada test(...) de um arquivo Playwright com seu título e corpo. */

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

/** Diz se um seletor de tela é frágil (XPath, nth-child, classes geradas, cadeias de div). */

const seletorFragil = (s: string) => /^\s*(\/\/|xpath=|\.\.\/)/.test(s) || /:nth-(child|of-type)\(/.test(s) || /\.(css|sc|jss|MuiBox)-[A-Za-z0-9]{4,}/.test(s) || /^(body|html)\s*>/.test(s) || /(?:^|\s)(?:div|span|ul|li|tr|td|section)\s*(?:>|\s)\s*(?:div|span|ul|li|tr|td|section)\s*(?:>|\s)\s*(?:div|span|ul|li|tr|td|section)/.test(s);

/** Apaga os comentários de um código mantendo as linhas no lugar, para analisar só o que executa. */

const codigoSemComentarios = (c: string) => c.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).split('\n').map(l => l.replace(/(^|[^:'"`])\/\/.*$/, '$1'));

/** Análise estática de um arquivo de teste Playwright. Cada regra cita a fonte oficial; falsos positivos possíveis estão descritos na orientação. */
export function analisarPlaywright(arquivo: string, conteudo: string): AchadoTeste[] {
  const out: AchadoTeste[] = [];
  const linhas = codigoSemComentarios(conteudo);
  const add = (
    regra: string,
    severidade: AchadoTeste['severidade'],
    i: number,
    orientacao: string,
    fonte: string
  ) => out.push({
    regra,
    severidade,
    arquivo: arquivo.replaceAll('\\', '/'),
    linha: i + 1,
    trecho: linhas[i]!.trim().slice(0, 140),
    orientacao,
    fonte
  });
  linhas.forEach((l, i) => {
    if (/\bwaitForTimeout\s*\(/.test(l) || /new Promise\([^)]*setTimeout/.test(l)) add('PW_ESPERA_FIXA', 'medium', i, 'Espera por tempo fixo. Ações e assertions do Playwright já aguardam a condição; troque por uma assertion que repete (await expect(...)) ou por um evento observável.', `${doc}/writing-tests`);
    for (const m of l.matchAll(/\.locator\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g)) if (seletorFragil(m[2]!)) add('PW_SELETOR_FRAGIL', 'medium', i, `Seletor preso à estrutura do DOM ("${m[2]!.slice(0, 50)}"). Prefira locators por papel, rótulo, texto ou data-testid.`, `${doc}/locators#locate-by-css-or-xpath`);
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

// ── revisaoDeCobertura ──
export async function revisarCobertura(p: Projeto, entrada: unknown) {
  const r = revisaoSchema.parse(entrada);
  const a = novaAnaliseDeCobertura(r.source);
  // As etapas seguem a ordem da revisão; cada uma anota seus achados no mesmo caderno.
  await conferirFonteDoRequisito(p, r, a);
  conferirContextoDaRevisao(p, r, a);
  for (const c of r.contradictions) a.registrar('CONTRADICTORY_REQUIREMENT', `Resolver conflito informado: ${c.statement} (${c.source}).`, undefined, 'high');
  const existentes = await conferirTestesExistentes(p, r, a);
  const selecionados = conferirCenariosCandidatos(r, a, existentes);
  if (!r.candidates.length && !existentes.size) a.registrar('COVERAGE_GAP', 'Sem cenário ou teste verificável.');
  return { kind: 'quality_review', projectId: p.manifesto.id, state: 'NOT_VERIFIED', executed: false,
    requirement: r.requirement, source: r.source, facts: a.facts, hypotheses: a.hypotheses, missing: [...new Set(a.missing)], findings: a.findings,
    candidates: r.candidates, suggestedSelection: selecionados, conclusion: 'Análise estrutural. Riscos, equivalências semânticas e suficiência final pertencem à IA hospedeira.' };
}

/** Abre o caderno vazio de uma revisão de cobertura; registrar() anota um achado com a origem do requisito. */
function novaAnaliseDeCobertura(origem: string): AnaliseDeCobertura {
  const a: AnaliseDeCobertura = { findings: [], facts: [], hypotheses: [], missing: [], registrar: () => undefined };
  a.registrar = (type, recommendation, scenario, severity = 'medium') => { a.findings.push({ type, severity, scenario, source: origem || 'origem ausente', recommendation, evidence: [] }); };
  return a;
}

/** Confere o requisito e sua origem: se há um documento indicado, lê só dentro da documentação autorizada e verifica se o texto está lá. */
async function conferirFonteDoRequisito(p: Projeto, r: Revisao, a: AnaliseDeCobertura) {
  if (!r.requirement.trim() || !r.source.trim()) { a.missing.push('Requisito e origem verificável'); a.registrar('MISSING_REQUIREMENT', 'Esclarecer comportamento esperado antes de concluir.'); }
  if (!r.sourcePath) { a.hypotheses.push({ kind: 'user_provided_requirement', requirement: r.requirement, source: r.source }); return; }
  try {
    if (!p.manifesto.context.documentation.some(d => r.sourcePath === d || r.sourcePath!.startsWith(d.replace(/[\\/]$/, '') + '/') || r.sourcePath!.startsWith(d.replace(/[\\/]$/, '') + '\\'))) throw new Error('Fora da documentação autorizada');
    const content = await lerSeguro(p.raiz, r.sourcePath);
    a.facts.push({ source: r.sourcePath, sha256: hash(content), kind: 'source_read', requirementFoundVerbatim: content.includes(r.requirement) });
    if (!content.includes(r.requirement)) { a.missing.push('Vínculo textual com requisito não confirmado'); a.registrar('UNVERIFIED_SOURCE', 'IA hospedeira deve validar o vínculo semântico.'); }
  } catch { a.missing.push('Fonte documental não acessível no escopo'); a.registrar('UNVERIFIED_SOURCE', 'Fornecer documentação autorizada.'); }
}

/** Se a revisão cita um contexto, confere se ele pode ser usado: aprovado, íntegro, atual, sem conflito, com origem e contendo o requisito. */
function conferirContextoDaRevisao(p: Projeto, r: Revisao, a: AnaliseDeCobertura) {
  if (!r.contextoId) return;
  const ctx = contextoParaRevisao(p, r.contextoId);
  if (ctx.status !== 'OK') { a.missing.push('Contexto referenciado indisponível'); a.registrar('CONTEXT_UNAVAILABLE', ctx.motivo, undefined, 'high'); return; }
  const c = ctx.resumo; const achouNoContexto = !!r.requirement.trim() && ctx.texto.includes(r.requirement.trim());
  a.facts.push({ kind: 'context_used', id: c.id, chave: c.chave, versao: c.versao, hash: c.hash, estado: c.estado, origem: c.origem, aprovadoPor: c.aprovadoPor, aprovadoEm: c.aprovadoEm, requirementFoundInContext: achouNoContexto });
  if (c.integridade === 'ADULTERADO') { a.registrar('CONTEXT_TAMPERED', 'O histórico do contexto foi alterado fora do Prumo; não use este contexto.', undefined, 'high'); return; }
  if (c.estado === 'RASCUNHO') a.registrar('CONTEXT_NOT_APPROVED', 'O contexto está em RASCUNHO: não é regra confirmada. Peça a aprovação humana antes de tratá-lo como requisito.');
  if (c.estado === 'DESATUALIZADO') a.registrar('CONTEXT_OUTDATED', 'O contexto está DESATUALIZADO; use a versão que o substituiu.', undefined, 'high');
  if (c.estado === 'CONFLITANTE') a.registrar('CONTEXT_CONFLICT', `O contexto conflita com: ${c.conflitaCom.join(', ') || 'outro contexto marcado'}. Esclareça com a pessoa responsável; o Prumo não escolhe um lado.`, undefined, 'high');
  if (!c.origem.referencia.trim()) { a.missing.push('Origem do contexto'); a.registrar('CONTEXT_SOURCE_MISSING', 'O contexto não informa origem verificável.'); }
  if (!achouNoContexto) a.registrar('CONTEXT_MISMATCH', 'O requisito informado não consta literalmente no contexto referenciado; confirme o vínculo.');
  if (c.alertaDeInstrucao) a.registrar('CONTEXT_SUSPICIOUS_INSTRUCTION', 'O texto do contexto parece instruir o agente; tratado apenas como dado.');
}

/** Lê cada teste existente informado (só dentro das pastas de teste do contrato), analisa os de Playwright e não conta como cobertura os pendentes ou ignorados. */
/** Devolve os ids dos testes que puderam ser lidos e não estão pendentes (os que contam como cobertura). */
async function conferirTestesExistentes(p: Projeto, r: Revisao, a: AnaliseDeCobertura): Promise<Set<string>> {
  const existentes = new Set<string>(); const analisados = new Set<string>();
  for (const t of r.existingTests) {
    if (!t.testPath) { a.missing.push(`Teste ${t.id} sem caminho verificável`); continue; }
    try {
      if (!p.manifesto.context.tests.some(d => t.testPath === d || t.testPath!.startsWith(d.replace(/[\\/]$/, '') + '/') || t.testPath!.startsWith(d.replace(/[\\/]$/, '') + '\\'))) throw new Error('Fora dos testes');
      await caminhoSeguro(p.raiz, t.testPath); const content = await lerSeguro(p.raiz, t.testPath);
      a.facts.push({ kind: 'test_read', id: t.id, path: t.testPath, sha256: hash(content) });
      const chave = t.testPath.replaceAll('\\', '/');
      if (ehTestePlaywright(t.testPath, content) && !analisados.has(chave)) {
        analisados.add(chave);
        for (const x of analisarPlaywright(t.testPath, content).slice(0, 40)) a.findings.push({ type: x.regra, severity: x.severidade, scenario: t.id, source: `${x.arquivo}:${x.linha}`, recommendation: x.orientacao, evidence: [{ arquivo: x.arquivo, linha: x.linha, trecho: mascarar(x.trecho), fonteOficial: x.fonte }] });
      }
      const ignoradas = content.split('\n').filter(l => /\b(?:skip|fixme|todo)\s*\(/.test(l));
      if (ignoradas.length) {
        // A detecção é por arquivo (não sabemos qual teste o cenário representa). Se o comportamento do cenário aparece numa
        // linha ignorada, a associação é direta; senão o aviso é de severidade menor e diz que não houve associação.
        // Nos dois casos o cenário não conta como cobertura comprovada (decisão conservadora).
        const associado = !!textoParaComparar(t.behavior) && ignoradas.some(l => textoParaComparar(l).includes(textoParaComparar(t.behavior)));
        a.registrar('WEAK_TEST', associado ? 'Teste pendente/ignorado associado a este cenário; não contar como cobertura.' : 'O arquivo contém teste pendente/ignorado que não foi associado a este cenário; conferir antes de contar cobertura.', t.id, associado ? 'medium' : 'low');
      } else existentes.add(t.id);
    } catch { a.registrar('UNVERIFIED_TEST', 'Teste existente não pôde ser lido; cobertura não comprovada.', t.id); }
  }
  return existentes;
}

/** Confere cada cenário proposto (risco, resultado esperado, oráculo, técnica, limite, condições) e aponta repetição com testes já existentes; devolve os sugeridos. */
function conferirCenariosCandidatos(r: Revisao, a: AnaliseDeCobertura, existentes: Set<string>): string[] {
  const n = textoParaComparar;
  const vistos = r.existingTests.filter(t => existentes.has(t.id));
  const selecionados: string[] = []; const ids = new Set<string>();
  for (const c of r.candidates) {
    if (ids.has(c.id)) a.registrar('DUPLICATE_ID', 'Identidades devem ser únicas.', c.id); ids.add(c.id);
    for (const [campo, valor] of Object.entries({ risk: c.risk, expected: c.expected, oracle: c.oracle, source: c.source }))
      if (!valor?.trim()) { a.missing.push(`${c.id}: ${campo}`); a.registrar(campo === 'oracle' || campo === 'expected' ? 'MISSING_ORACLE' : 'TRACEABILITY_GAP', `Declarar ${campo} verificável.`, c.id); }
    if (!c.behavior.trim()) a.registrar('MISSING_BEHAVIOR', 'Definir comportamento.', c.id);
    if (!c.technique) a.registrar('MISSING_TECHNIQUE', 'Justificar a técnica aplicável; nenhuma quantidade fixa.', c.id);
    if (c.technique === 'boundary' && c.boundary === undefined) a.registrar('MISSING_BOUNDARY', 'Declarar limite e lado/condição; confirmar valor na fonte.', c.id);
    if (['decision_table', 'state_transition'].includes(c.technique ?? '') && !c.conditions?.trim()) a.registrar('MISSING_CONDITIONS', 'Declarar combinação de condições ou estado/evento/destino.', c.id);
    if (c.blockedReason) a.registrar('BLOCKING_CONDITION', c.blockedReason, c.id, 'high');
    const duplicado = [c.behavior, c.expected, c.oracle, c.risk].every(v => v?.trim()) && vistos.find(t => n(t.behavior) === n(c.behavior) && n(t.expected) === n(c.expected) && n(t.conditions) === n(c.conditions) && t.boundary === c.boundary && n(t.oracle) === n(c.oracle) && n(t.risk) === n(c.risk) && (!c.partition || n(t.partition) === n(c.partition)));
    if (duplicado) { a.registrar('POTENTIAL_REDUNDANCY', `Comparar com ${duplicado.id}; mesma assinatura estrutural, decisão semântica da IA.`, c.id); a.hypotheses.push({ scenario: c.id, equivalentTo: duplicado.id }); }
    else selecionados.push(c.id);
    vistos.push(c);
  }
  return selecionados;
}

/** Deixa um texto em minúsculas e com espaços simples, para comparar cenários sem diferença de digitação. */
function textoParaComparar(s: string | undefined) {
  return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Diz se o arquivo é um teste Playwright. */

export const ehTestePlaywright = (arquivo: string, conteudo: string) => /\.(spec|test)\.[cm]?[jt]s$/.test(arquivo) && /from\s+['"]@playwright\/test['"]|require\(\s*['"]@playwright\/test['"]\s*\)/.test(conteudo);

// ── detectarFrameworks ──
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
