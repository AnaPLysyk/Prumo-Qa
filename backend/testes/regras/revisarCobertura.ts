/** Revisa um plano de testes contra o requisito: rastreabilidade, riscos, oráculos, lacunas e cenários repetidos. Nunca diz que está aprovado. */
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { revisaoSchema, AnaliseDeCobertura, Revisao } from '../tipos/revisaoDeCobertura.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { lerSeguro } from '../../compartilhado/seguranca/lerSeguro.js';
import { contextoParaRevisao } from '../../agentes/regras/contextoParaRevisao.js';
import { caminhoSeguro } from '../../compartilhado/seguranca/caminhoSeguro.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { analisarPlaywright } from './analisarPlaywright.js';
import { ehTestePlaywright } from './ehTestePlaywright.js';

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
