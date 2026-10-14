/** Copia o resultado de uma execução para os casos da run que usam a mesma automação. */
import { Evidencia } from '../tipos/evidencia.js';
import { RunLocal } from '../tipos/runLocal.js';

export function aplicarEvidencia(run: RunLocal, capability: string, ev: Evidencia, agora: string) {
  const mesmos = run.casos.filter(c => c.capability === capability && c.resultado?.origem !== 'MANUAL'); const semCenario = mesmos.filter(c => !c.casoRunner);
  for (const c of mesmos) {
    const base = { origem: 'EXECUCAO' as const, evidenciaId: ev.jobId, em: agora };
    if (c.casoRunner) {
      const x = ev.cases.find(k => k.id === c.casoRunner);
      c.resultado = x ? { ...base, status: x.status, granularidade: 'CENARIO', comentario: x.evidence.slice(0, 1500) } : { ...base, status: ev.status === 'BLOCKED' ? 'BLOCKED' : 'NOT_RUN', granularidade: 'RODADA', comentario: ev.status === 'BLOCKED' ? ev.reason.slice(0, 500) : `Cenário "${c.casoRunner}" não foi reportado pelo runner.` };
    } else if (ev.status === 'BLOCKED') c.resultado = { ...base, status: 'BLOCKED', granularidade: 'RODADA', comentario: ev.reason.slice(0, 500) };
    else if (semCenario.length === 1 && (ev.status === 'PASS' || ev.status === 'FAIL')) c.resultado = { ...base, status: ev.status, granularidade: 'RODADA', comentario: `Rodada da automação "${capability}" terminou como ${ev.status}; o runner não reportou cenários individuais.` };
    else c.resultado = { ...base, status: 'NOT_RUN', granularidade: 'RODADA', comentario: `MAPEAMENTO_AUSENTE: a automação "${capability}" cobre ${semCenario.length} casos sem mapeamento por cenário; nenhum resultado individual foi inferido.` };
    c.publicado = false;
  }
}
