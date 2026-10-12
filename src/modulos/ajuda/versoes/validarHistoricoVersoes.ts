/** Confere ordem, datas, publicações e instaladores declarados no histórico. */
import { versoesSchema, type Versao } from './definirFormatoVersao.js';
import { compararVersoes } from './compararNumerosVersao.js';
import { urlRelease } from './montarLinkRelease.js';

/** Valida o esquema e a coerência interna: ordem decrescente, sem repetição, datas e links compatíveis com o estado. */
export function validarVersoes(bruto: unknown): Versao[] {
  const { versions } = versoesSchema.parse(bruto);
  for (let i = 0; i < versions.length; i++) {
    const v = versions[i]!;
    if (i > 0 && compararVersoes(versions[i - 1]!.version, v.version) <= 0) throw new Error(`VERSIONS_ORDER: ${v.version} fora de ordem ou repetida.`);
    if (v.status === 'publicada' && (!v.date || v.releaseUrl !== urlRelease(v.version))) throw new Error(`VERSIONS_INCONSISTENT: ${v.version} publicada exige data e o link oficial da release.`);
    if (v.installer && (v.status !== 'publicada' || v.installer.file !== `Prumo-QA-Setup-${v.version}.exe`)) throw new Error(`VERSIONS_INCONSISTENT: ${v.version} só pode ter instalador se publicada e com o nome oficial.`);
    if (v.status === 'planejada' && (v.date || v.releaseUrl)) throw new Error(`VERSIONS_INCONSISTENT: ${v.version} planejada não pode ter data nem release.`);
    if (v.status === 'repositorio' && v.releaseUrl) throw new Error(`VERSIONS_INCONSISTENT: ${v.version} sem release não pode ter link de release.`);
  }
  return versions;
}
