import fs from 'node:fs';
import { z } from 'zod';

/**
 * Histórico de versões: uma fonte única (app/versoes.json) alimenta a tela Ajuda › Versões, as notas de release
 * (scripts/notas-versao.mjs) e a conferência com package.json/tag. Sem rede; funciona offline.
 */
export const repositorio = 'AnaPLysyk/Prumo-Qa';
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const lista = z.array(z.string().min(1).max(600)).max(30);
export const versaoSchema = z.object({
  version: z.string().regex(semver),
  // publicada: release oficial; repositorio: código no GitHub sem release; planejada: ainda não publicada.
  status: z.enum(['publicada', 'repositorio', 'planejada']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  title: z.string().min(1).max(120), objective: z.string().min(1).max(800),
  features: lista, improvements: lista, fixes: lista, differential: z.string().max(800), howItWorks: lista,
  security: lista, compatibility: lista, limitations: lista, migration: z.string().max(600), afterUpdate: lista,
  releaseUrl: z.string().url().nullable()
}).strict();
export const versoesSchema = z.object({ schemaVersion: z.literal(1), versions: z.array(versaoSchema).min(1).max(100) }).strict();
export type Versao = z.infer<typeof versaoSchema>;

/** [maior, menor, correção] ou null quando não é uma versão semântica estrita (sem sufixos). */
export function analisarVersao(v: string): [number, number, number] | null {
  const m = semver.exec(v.trim().replace(/^v/, ''));
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
/** Negativo se a < b, zero se iguais, positivo se a > b. Compara números, não texto ("2.10.0" > "2.9.0"). */
export function compararVersoes(a: string, b: string): number {
  const x = analisarVersao(a), y = analisarVersao(b);
  if (!x || !y) throw new Error('INVALID_VERSION: versão semântica inválida.');
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i]! - y[i]!;
  return 0;
}
export const urlRelease = (versao: string) => `https://github.com/${repositorio}/releases/tag/v${versao}`;

export function carregarVersoes(arquivo: string): Versao[] {
  return validarVersoes(JSON.parse(fs.readFileSync(arquivo, 'utf8')));
}
/** Valida o esquema e a coerência interna: ordem decrescente, sem repetição, datas e links compatíveis com o estado. */
export function validarVersoes(bruto: unknown): Versao[] {
  const { versions } = versoesSchema.parse(bruto);
  for (let i = 0; i < versions.length; i++) {
    const v = versions[i]!;
    if (i > 0 && compararVersoes(versions[i - 1]!.version, v.version) <= 0) throw new Error(`VERSIONS_ORDER: ${v.version} fora de ordem ou repetida.`);
    if (v.status === 'publicada' && (!v.date || v.releaseUrl !== urlRelease(v.version))) throw new Error(`VERSIONS_INCONSISTENT: ${v.version} publicada exige data e o link oficial da release.`);
    if (v.status === 'planejada' && (v.date || v.releaseUrl)) throw new Error(`VERSIONS_INCONSISTENT: ${v.version} planejada não pode ter data nem release.`);
    if (v.status === 'repositorio' && v.releaseUrl) throw new Error(`VERSIONS_INCONSISTENT: ${v.version} sem release não pode ter link de release.`);
  }
  return versions;
}
/** A versão instalada precisa existir no histórico (package.json, histórico e tag devem concordar). */
export function conferirInstalada(versoes: Versao[], instalada: string) {
  if (!versoes.some(v => v.version === instalada)) throw new Error(`VERSIONS_MISSING: ${instalada} não consta no histórico.`);
}
/** Estado exibido: a versão em execução é "instalada"; as demais mantêm o estado da fonte. */
export const apresentarVersoes = (versoes: Versao[], instalada: string) =>
  versoes.map(v => ({ ...v, state: v.version === instalada ? 'instalada' as const : v.status }));

/** Notas de release geradas da mesma fonte, para o GitHub Releases. */
export function notasDaVersao(v: Versao): string {
  const sec = (t: string, itens: string[]) => (itens.length ? `\n### ${t}\n${itens.map(i => `- ${i}`).join('\n')}\n` : '');
  return `## Prumo QA ${v.version} — ${v.title}\n\n${v.objective}\n\n**Diferencial:** ${v.differential}\n${sec('Funcionalidades', v.features)}${sec('Melhorias', v.improvements)}${sec('Correções', v.fixes)}${sec('Segurança', v.security)}${sec('Compatibilidade', v.compatibility)}${sec('Limitações conhecidas', v.limitations)}\n**Migração de dados:** ${v.migration}\n${sec('Depois de atualizar', v.afterUpdate)}`;
}
