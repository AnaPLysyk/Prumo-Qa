/** Executa as automações dos casos da run (só capacidades declaradas) e anota os resultados. */
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { alterarRunLocal } from '../banco/armazenamentoDeRuns.js';
import { obterRunLocal } from '../banco/armazenamentoDeRuns.js';

import { Dep, Execucao } from '../tipos/runLocal.js';
import { Evidencia } from '../tipos/evidencia.js';
import { RunLocal } from '../tipos/runLocal.js';

function aplicarEvidencia(run: RunLocal, capability: string, ev: Evidencia, agora: string) {
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


/** Executa uma vez cada automação associada (somente as autorizadas) e distribui os resultados. Casos manuais ficam como estão. */
export async function executarRunLocal(d: Dep, runLocalId: string, x: Execucao) {
  const run = obterRunLocal(runLocalId, d.base); const e = obterEspaco(run.espacoId, d.base); const agora = d.agora ?? (() => new Date());
  const caps = [...new Set(run.casos.filter(c => c.capability && c.resultado?.origem !== 'MANUAL').map(c => c.capability!))];
  if (!caps.length) return { executadas: [] as { capability: string; status: string; evidenciaId: string }[], semAutomacao: run.casos.length };
  if (!e.pastaLocal) throw new Error('PROJECT_FOLDER_REQUIRED: vincule a pasta de automação para executar.');
  const projeto = await carregarProjeto(e.pastaLocal); const executadas: { capability: string; status: string; evidenciaId: string }[] = [];
  for (const cap of caps) {
    if (x.signal?.aborted) break;
    const ev = await x.executar(projeto, cap, x.modo === 'MANUAL', x.modo === 'AGENDADO' ? x.delegada?.(run.espacoId, run.ambiente) : undefined, x.signal);
    alterarRunLocal(runLocalId, r => { aplicarEvidencia(r, cap, ev, agora().toISOString()); r.execucoes.push({ capability: cap, evidenciaId: ev.jobId, status: ev.status, em: agora().toISOString() }); r.execucoes = r.execucoes.slice(-200); if (r.estado === 'CRIADA' || r.estado === 'PREPARADA' || r.estado === 'PUBLICADA') r.estado = r.estado === 'PREPARADA' ? 'PREPARADA' : 'EXECUTADA'; }, d.base);
    executadas.push({ capability: cap, status: ev.status, evidenciaId: ev.jobId });
  }
  return { executadas, semAutomacao: run.casos.filter(c => !c.capability).length };
}
