/** servicoAjuda: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import fs from "node:fs";
import path from "node:path";
import { documentosAjuda } from "../projetos/contratos.js";
import { categorias, limitesPrivacidade, naoTransmitido, politicaRetencao, semver, Versao, repositorio, versoesSchema } from "./contratos.js";
import { diretorioDados } from "../compartilhado/banco/diretorioDados.js";
import { listarVinculos } from "../projetos/servicoProjetos.js";

// --- servicoAjuda ---
// servicoDocumentos — responsabilidade deste trecho
export function lerDocumentosDaAjuda(pasta: string, versao: string) {
  return documentosAjuda.map(arq => {
    const arquivo=arq==='SERVICOS.md'?path.resolve(pasta,'../../docs/SERVICOS.md'):path.join(pasta,arq);
    const texto = fs.readFileSync(arquivo, 'utf8').replaceAll('{{VERSAO}}', versao);
    return { id: arq.replace(/\.md$/, ''), title: /^# (.+)$/m.exec(texto)?.[1] ?? arq, body: texto };
  });
}

// servicoPrivacidade — responsabilidade deste trecho
function medirPasta(dir: string, limite = { n: 0 }): { bytes: number; arquivos: number; truncado: boolean } {
  let bytes = 0, arquivos = 0, truncado = false;
  let itens: fs.Dirent[]; try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { return { bytes, arquivos, truncado }; }
  for (const i of itens) {
    if (++limite.n > 50000) return { bytes, arquivos, truncado: true };
    const alvo = path.join(dir, i.name);
    if (i.isSymbolicLink()) continue;
    if (i.isDirectory()) { const r = medirPasta(alvo, limite); bytes += r.bytes; arquivos += r.arquivos; truncado ||= r.truncado; }
    else if (i.isFile()) { try { bytes += fs.statSync(alvo).size; arquivos++; } catch { /* arquivo sumiu: ignora */ } }
  }
  return { bytes, arquivos, truncado };
}

export async function resumirDados(base?: string) {
  const dir = diretorioDados(base); const por: Record<string, { bytes: number; files: number }> = {};
  let total = 0, truncado = false;
  let itens: fs.Dirent[] = []; try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { /* ainda sem dados */ }
  for (const i of itens) {
    if (i.isSymbolicLink()) continue;
    const alvo = path.join(dir, i.name); const cat = categorias[i.name] ?? 'outros';
    const r = i.isDirectory() ? medirPasta(alvo) : { bytes: (() => { try { return fs.statSync(alvo).size; } catch { return 0; } })(), arquivos: 1, truncado: false };
    por[cat] = { bytes: (por[cat]?.bytes ?? 0) + r.bytes, files: (por[cat]?.files ?? 0) + r.arquivos }; total += r.bytes; truncado ||= r.truncado;
  }
  return { directory: dir, linkedProjects: (await listarVinculos(base)).length, totalBytes: total, truncated: truncado, categories: por,
    evidenceNote: 'Evidências de execução ficam em <projeto>\\.prumo\\evidencias, dentro de cada projeto vinculado, e não entram neste total.',
    retention: politicaRetencao, notTransmitted: naoTransmitido, privacyLimits: limitesPrivacidade };
}

// --- servicoVersoes ---
/** [maior, menor, correção] ou null quando não é uma versão semântica estrita (sem sufixos). */
export function analisarVersao(v: string): [number, number, number] | null {
  const m = semver.exec(v.trim().replace(/^v/, ''));
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** Estado exibido: a versão em execução é "instalada"; as demais mantêm o estado da fonte. */
export const apresentarVersoes = (versoes: Versao[], instalada: string) =>
  versoes.map(v => ({ ...v, state: v.version === instalada ? 'instalada' as const : v.status }));

export function carregarVersoes(arquivo: string): Versao[] {
  return validarVersoes(JSON.parse(fs.readFileSync(arquivo, 'utf8')));
}

/** Negativo se a < b, zero se iguais, positivo se a > b. Compara números, não texto ("2.10.0" > "2.9.0"). */
export function compararVersoes(a: string, b: string): number {
  const x = analisarVersao(a), y = analisarVersao(b);
  if (!x || !y) throw new Error('INVALID_VERSION: versão semântica inválida.');
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i]! - y[i]!;
  return 0;
}

/** A versão instalada precisa existir no histórico (package.json, histórico e tag devem concordar). */
export function conferirInstalada(versoes: Versao[], instalada: string) {
  if (!versoes.some(v => v.version === instalada)) throw new Error(`VERSIONS_MISSING: ${instalada} não consta no histórico.`);
}

export const enderecoDaVersao = (versao: string) => `https://github.com/${repositorio}/releases/tag/v${versao}`;

/** Notas de release geradas da mesma fonte, para o GitHub Releases. */
export function notasDaVersao(v: Versao): string {
  const sec = (t: string, itens: string[]) => (itens.length ? `\n### ${t}\n${itens.map(i => `- ${i}`).join('\n')}\n` : '');
  return `## Prumo QA ${v.version} — ${v.title}\n\n${v.objective}\n\n**Diferencial:** ${v.differential}\n${sec('Funcionalidades', v.features)}${sec('Melhorias', v.improvements)}${sec('Correções', v.fixes)}${sec('Segurança', v.security)}${sec('Compatibilidade', v.compatibility)}${sec('Limitações conhecidas', v.limitations)}\n**Migração de dados:** ${v.migration}\n${sec('Depois de atualizar', v.afterUpdate)}`;
}

/** Valida o esquema e a coerência interna: ordem decrescente, sem repetição, datas e links compatíveis com o estado. */
export function validarVersoes(bruto: unknown): Versao[] {
  const { versions } = versoesSchema.parse(bruto);
  for (let i = 0; i < versions.length; i++) {
    const v = versions[i]!;
    if (i > 0 && compararVersoes(versions[i - 1]!.version, v.version) <= 0) throw new Error(`VERSIONS_ORDER: ${v.version} fora de ordem ou repetida.`);
    if (v.status === 'publicada' && (!v.date || v.releaseUrl !== enderecoDaVersao(v.version))) throw new Error(`VERSIONS_INCONSISTENT: ${v.version} publicada exige data e o link oficial da release.`);
    if (v.installer && (v.status !== 'publicada' || v.installer.file !== `Prumo-QA-Setup-${v.version}.exe`)) throw new Error(`VERSIONS_INCONSISTENT: ${v.version} só pode ter instalador se publicada e com o nome oficial.`);
    if (v.status === 'planejada' && (v.date || v.releaseUrl)) throw new Error(`VERSIONS_INCONSISTENT: ${v.version} planejada não pode ter data nem release.`);
    if (v.status === 'repositorio' && v.releaseUrl) throw new Error(`VERSIONS_INCONSISTENT: ${v.version} sem release não pode ter link de release.`);
  }
  return versions;
}
