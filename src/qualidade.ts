import { z } from 'zod';
import { caminhoSeguro, lerSeguro, hash, mascarar, type Projeto } from './projeto.js';

const texto = z.string().max(4000);
export const cenarioSchema = z.object({
  id: z.string().min(1).max(80), behavior: texto, source: texto.optional(), risk: texto.optional(),
  expected: texto.optional(), oracle: texto.optional(), technique: z.enum(['equivalence','boundary','decision_table','state_transition','white_box','experience']).optional(),
  partition: texto.optional(), conditions: texto.optional(), boundary: z.number().optional(),
  testPath: texto.optional(), blockedReason: texto.optional()
}).strict();
export const revisaoSchema = z.object({
  requirement: texto, source: texto, sourcePath: texto.optional(),
  existingTests: z.array(cenarioSchema).max(100), candidates: z.array(cenarioSchema).max(100),
  contradictions: z.array(z.object({ source: texto, statement: texto }).strict()).max(20).default([])
}).strict();
export type Revisao = z.infer<typeof revisaoSchema>;
export async function revisarCobertura(p: Projeto, entrada: unknown) {
  const r = revisaoSchema.parse(entrada);
  const findings: { type: string; severity: string; scenario?: string; source: string; recommendation: string; evidence: unknown[] }[] = [];
  const facts: unknown[] = []; const hypotheses: unknown[] = []; const missing: string[] = [];
  const registrar = (type: string, recommendation: string, scenario?: string, severity = 'medium') => findings.push({ type, severity, scenario, source: r.source || 'origem ausente', recommendation, evidence: [] });
  if (!r.requirement.trim() || !r.source.trim()) { missing.push('Requisito e origem verificável'); registrar('MISSING_REQUIREMENT','Esclarecer comportamento esperado antes de concluir.'); }
  if (r.sourcePath) {
    try {
      if (!p.manifesto.context.documentation.some(d => r.sourcePath === d || r.sourcePath!.startsWith(d.replace(/[\\/]$/, '') + '/') || r.sourcePath!.startsWith(d.replace(/[\\/]$/, '') + '\\'))) throw new Error('Fora da documentação autorizada');
      const content = await lerSeguro(p.raiz, r.sourcePath);
      facts.push({ source: r.sourcePath, sha256: hash(content), kind: 'source_read', requirementFoundVerbatim: content.includes(r.requirement) });
      if (!content.includes(r.requirement)) { missing.push('Vínculo textual com requisito não confirmado'); registrar('UNVERIFIED_SOURCE','IA hospedeira deve validar o vínculo semântico.'); }
    } catch { missing.push('Fonte documental não acessível no escopo'); registrar('UNVERIFIED_SOURCE','Fornecer documentação autorizada.'); }
  } else hypotheses.push({ kind: 'user_provided_requirement', requirement: r.requirement, source: r.source });
  for (const c of r.contradictions) registrar('CONTRADICTORY_REQUIREMENT', `Resolver conflito informado: ${c.statement} (${c.source}).`, undefined, 'high');
  const norm = (s: string | undefined) => (s ?? '').trim().toLowerCase().replace(/\s+/g,' ');
  const existentes = new Set<string>();
  for (const t of r.existingTests) {
    if (!t.testPath) { missing.push(`Teste ${t.id} sem caminho verificável`); continue; }
    try {
      if (!p.manifesto.context.tests.some(d => t.testPath === d || t.testPath!.startsWith(d.replace(/[\\/]$/, '') + '/') || t.testPath!.startsWith(d.replace(/[\\/]$/, '') + '\\'))) throw new Error('Fora dos testes');
      await caminhoSeguro(p.raiz, t.testPath); const content = await lerSeguro(p.raiz, t.testPath);
      facts.push({ kind: 'test_read', id: t.id, path: t.testPath, sha256: hash(content) });
      const ignoradas = content.split('\n').filter(l => /\b(?:skip|fixme|todo)\s*\(/.test(l));
      if (ignoradas.length) {
        // A detecção é por arquivo (não sabemos qual teste o cenário representa). Se o comportamento do cenário aparece numa
        // linha ignorada, a associação é direta; senão o aviso é de severidade menor e diz que não houve associação.
        // Nos dois casos o cenário NÃO conta como cobertura comprovada (decisão conservadora, inalterada).
        const associado = !!norm(t.behavior) && ignoradas.some(l => norm(l).includes(norm(t.behavior)));
        registrar('WEAK_TEST', associado ? 'Teste pendente/ignorado associado a este cenário; não contar como cobertura.' : 'O arquivo contém teste pendente/ignorado que não foi associado a este cenário; conferir antes de contar cobertura.', t.id, associado ? 'medium' : 'low');
      } else existentes.add(t.id);
    } catch { registrar('UNVERIFIED_TEST','Teste existente não pôde ser lido; cobertura não comprovada.',t.id); }
  }
  const vistos = r.existingTests.filter(t => existentes.has(t.id));
  const selecionados: string[] = []; const ids = new Set<string>();
  for (const c of r.candidates) {
    if (ids.has(c.id)) registrar('DUPLICATE_ID','Identidades devem ser únicas.',c.id); ids.add(c.id);
    for (const [campo, valor] of Object.entries({ risk:c.risk, expected:c.expected, oracle:c.oracle, source:c.source }))
      if (!valor?.trim()) { missing.push(`${c.id}: ${campo}`); registrar(campo === 'oracle' || campo === 'expected' ? 'MISSING_ORACLE' : 'TRACEABILITY_GAP', `Declarar ${campo} verificável.`, c.id); }
    if (!c.behavior.trim()) registrar('MISSING_BEHAVIOR','Definir comportamento.',c.id);
    if (!c.technique) registrar('MISSING_TECHNIQUE','Justificar a técnica aplicável; nenhuma quantidade fixa.',c.id);
    if (c.technique === 'boundary' && c.boundary === undefined) registrar('MISSING_BOUNDARY','Declarar limite e lado/condição; confirmar valor na fonte.',c.id);
    if (['decision_table','state_transition'].includes(c.technique ?? '') && !c.conditions?.trim()) registrar('MISSING_CONDITIONS','Declarar combinação de condições ou estado/evento/destino.',c.id);
    if (c.blockedReason) registrar('BLOCKING_CONDITION',c.blockedReason,c.id,'high');
    const duplicado = [c.behavior,c.expected,c.oracle,c.risk].every(v=>v?.trim()) && vistos.find(t => norm(t.behavior) === norm(c.behavior) && norm(t.expected) === norm(c.expected) && norm(t.conditions) === norm(c.conditions) && t.boundary === c.boundary && norm(t.oracle) === norm(c.oracle) && norm(t.risk) === norm(c.risk) && (!c.partition || norm(t.partition) === norm(c.partition)));
    if (duplicado) { registrar('POTENTIAL_REDUNDANCY', `Comparar com ${duplicado.id}; mesma assinatura estrutural, decisão semântica da IA.`,c.id); hypotheses.push({ scenario:c.id, equivalentTo:duplicado.id }); }
    else selecionados.push(c.id);
    vistos.push(c);
  }
  if (!r.candidates.length && !existentes.size) registrar('COVERAGE_GAP','Sem cenário ou teste verificável.');
  return { kind:'quality_review', projectId:p.manifesto.id, state:'NOT_VERIFIED', executed:false,
    requirement:r.requirement, source:r.source, facts, hypotheses, missing:[...new Set(missing)], findings,
    candidates:r.candidates, suggestedSelection:selecionados, conclusion:'Análise estrutural. Riscos, equivalências semânticas e suficiência final pertencem à IA hospedeira.' };
}
