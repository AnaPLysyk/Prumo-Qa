/** Lista as evidências de execução do projeto, com segredos mascarados, para a tela Evidências. */
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { consultarEvidencias } from '../banco/consultarEvidencias.js';
import { projetoVinculado } from '../../projetos/servicoProjetos.js';

export async function listarEvidenciasDoProjeto(raiz: string, jobId?: string) {
  const p = await projetoVinculado(raiz, diretorioDados());
  const r = await consultarEvidencias(p, jobId);
  return { status: 'status' in r ? r.status : undefined, reason: 'reason' in r ? r.reason : undefined, trust: 'trust' in r ? r.trust : undefined,
    results: r.results.map(e => ({ jobId: e.jobId, capability: e.capability, status: e.status, reason: mascarar(e.reason), startedAt: e.startedAt, endedAt: e.endedAt,
      executed: e.executed, exitCode: e.exitCode, evidenceScope: e.evidenceScope, cases: e.cases.map(c => ({ id: c.id, status: c.status })), evidencePath: e.evidencePath,
      stdout: mascarar(e.stdout).slice(0, 4000), stderr: mascarar(e.stderr).slice(0, 4000) })) };
}
