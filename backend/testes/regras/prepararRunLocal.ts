/** Prepara uma run local com os casos escolhidos, marcando quais têm automação. */
import { randomUUID } from 'node:crypto';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { gravarRunsLocais } from '../banco/gravarRunsLocais.js';
import { lerRunsLocais } from '../banco/lerRunsLocais.js';

import { RunLocal, runSchema } from '../tipos/runLocal.js';

/** Automação declarada para um caso do Qase: relação (qase:<id>) -> (automacao:<capability>[#cenário]) feita pela pessoa. */
function automacaoDoCaso(espacoId: string, casoId: number, b?: string): { capability: string; casoRunner: string | null } | null {
  const e = obterEspaco(espacoId, b); const vinculo = e.vinculos.find(v => v.servico === 'qase'); const rel = e.relacoes.find(r => r.de.tipo === 'qase' && r.de.id === String(casoId) && r.de.vinculoId === vinculo?.id && r.para.tipo === 'automacao'); if (!rel || !vinculo) return null;
  const [capability, cenario] = rel.para.id.split('#'); return capability ? { capability, casoRunner: cenario || null } : null;
}


export function prepararRunLocal(espacoId: string, d: { titulo: string; ambiente: string; casos: { casoId: number; titulo: string }[]; planoId?: number; marcoId?: number; ambienteQaseId?: number }, b?: string, agora = new Date()): RunLocal {
  obterEspaco(espacoId, b); if (!d.casos.length) throw new Error('RUN_WITHOUT_CASES');
  const t = agora.toISOString(); const vistos = new Set<number>();
  const casos = d.casos.filter(c => !vistos.has(c.casoId) && vistos.add(c.casoId)).map(c => { const a = automacaoDoCaso(espacoId, c.casoId, b); return { casoId: c.casoId, titulo: c.titulo.slice(0, 255), capability: a?.capability ?? null, casoRunner: a?.casoRunner ?? null, resultado: null, publicado: false }; });
  const run = runSchema.parse({ id: randomUUID(), espacoId, titulo: d.titulo.trim().slice(0, 255), ambiente: d.ambiente, runIdRemoto: null, planoId: d.planoId ?? null, marcoId: d.marcoId ?? null, ambienteQaseId: d.ambienteQaseId ?? null, estado: 'PREPARADA', confirmadaNoQase: false, criadaEm: t, atualizadaEm: t, casos, execucoes: [], publicacoes: [] });
  const reg = lerRunsLocais(b); reg.itens.push(run); gravarRunsLocais(reg, b); return run;
}
