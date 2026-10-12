/** Escreve as notas de uma versão em Markdown (usadas na release do GitHub). */
import { Versao } from '../tipos/versoes.js';

/** Notas de release geradas da mesma fonte, para o GitHub Releases. */
export function notasDaVersao(v: Versao): string {
  const sec = (t: string, itens: string[]) => (itens.length ? `\n### ${t}\n${itens.map(i => `- ${i}`).join('\n')}\n` : '');
  return `## Prumo QA ${v.version} — ${v.title}\n\n${v.objective}\n\n**Diferencial:** ${v.differential}\n${sec('Funcionalidades', v.features)}${sec('Melhorias', v.improvements)}${sec('Correções', v.fixes)}${sec('Segurança', v.security)}${sec('Compatibilidade', v.compatibility)}${sec('Limitações conhecidas', v.limitations)}\n**Migração de dados:** ${v.migration}\n${sec('Depois de atualizar', v.afterUpdate)}`;
}
