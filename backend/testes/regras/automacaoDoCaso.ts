/** Descobre se um caso do Qase tem automação associada no projeto (qual capacidade e qual cenário). */
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';

/** Automação declarada para um caso do Qase: relação (qase:<id>) -> (automacao:<capability>[#cenário]) feita pela pessoa. */
export function automacaoDoCaso(espacoId: string, casoId: number, b?: string): { capability: string; casoRunner: string | null } | null {
  const e = obterEspaco(espacoId, b); const vinculo = e.vinculos.find(v => v.servico === 'qase'); const rel = e.relacoes.find(r => r.de.tipo === 'qase' && r.de.id === String(casoId) && r.de.vinculoId === vinculo?.id && r.para.tipo === 'automacao'); if (!rel || !vinculo) return null;
  const [capability, cenario] = rel.para.id.split('#'); return capability ? { capability, casoRunner: cenario || null } : null;
}
