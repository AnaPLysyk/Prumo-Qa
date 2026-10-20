/** Registra o resultado de um caso manual dito pela pessoa, sem apagar resultado de execução. */
import { alterarRunLocal } from '../banco/runs.js';

/** Resultado declarado pela pessoa (caso manual). Marcado MANUAL e com o nome de quem declarou; nunca sobrescreve resultado de execução. */
export function declararResultadoManual(runLocalId: string, casoId: number, r: { status: 'PASS' | 'FAIL' | 'BLOCKED'; comentario: string }, por: string, b?: string, agora = new Date()) {
  return alterarRunLocal(runLocalId, run => {
    const c = run.casos.find(k => k.casoId === casoId); if (!c) throw new Error('RUN_CASE_NOT_FOUND'); if (c.resultado?.origem === 'EXECUCAO' && c.resultado.status !== 'NOT_RUN') throw new Error('RESULT_FROM_EXECUTION: já existe resultado de execução.');
    c.resultado = { status: r.status, origem: 'MANUAL', granularidade: 'DECLARADO', comentario: r.comentario.slice(0, 2000), por, em: agora.toISOString() }; c.publicado = false;
  }, b, agora);
}
