/** Lógica e contratos de metricas: operações relacionadas no mesmo módulo. */
import { consultarAtividades } from "../logs/regras/iniciarAtividade.js";
import { listarRotinas } from "../agendamentos/banco/agenda.js";
import { listarTrabalhos } from "../agendamentos/banco/fila.js";
import { proximoHorario } from "../agendamentos/regras/cicloDaRotina.js";
import { Rotina } from "../agendamentos/tipos/rotina.js";

export function calcularMetricas(h:ReturnType<typeof consultarAtividades>) {
  const a=h.activities;const finais=a.filter(e=>e.phase==='end');const soma=(campo:'findings'|'recommendations'|'gaps'|'candidateRedundancies')=>finais.reduce((n,e)=>n+e.summary[campo],0);
  const execucoes=a.filter(e=>e.tool==='executar_validacao');
  return {projectId:h.projectId,rootHash:h.rootHash,complete:h.complete,problems:h.problems,totalOperations:a.length,
    mcpCalls:a.filter(e=>e.origin==='MCP').length,contextAnalyses:finais.filter(e=>e.tool==='contexto_projeto'&&e.state==='NOT_VERIFIED').length,
    coverageReviews:finais.filter(e=>e.tool==='revisar_cobertura'&&e.state==='NOT_VERIFIED').length,findings:soma('findings'),recommendations:soma('recommendations'),gaps:soma('gaps'),candidateRedundancies:soma('candidateRedundancies'),
    executionsRequested:execucoes.length,executions:Object.fromEntries(['PASS','FAIL','BLOCKED','NOT_RUN'].map(s=>[s,execucoes.filter(e=>e.state===s).length])),
    errors:a.filter(e=>e.state==='ERROR').length,unfinished:a.filter(e=>e.phase==='start').length,
    averageDurationMs:finais.length?Math.round(finais.reduce((n,e)=>n+e.durationMs,0)/finais.length*1000)/1000:null,
    lastActivity:a.length?[...a].sort((x,y)=>x.at.localeCompare(y.at)).at(-1)!.at:null,
    tokens:null,cost:null,providerMetrics:'indisponíveis: cliente/provedor não forneceu dados verificáveis',appliedChanges:null};
}

export function metricasDasExecucoes(espacoId?: string, base?: string, agora = new Date()) {
  const trabalhos = listarTrabalhos(base).filter(t => !espacoId || t.espacoId === espacoId); const rotinas = listarRotinas(base).filter(r => !espacoId || r.espacoId === espacoId);
  const reais = trabalhos.filter(t => t.estado === 'CONCLUIDO' && t.resultado && ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'].includes(t.resultado.status));
  const n = (s: string) => reais.filter(t => t.resultado!.status === s).length;
  const ultima = [...trabalhos].filter(t => t.terminadoEm && t.estado !== 'PERDIDO').sort((a, b) => b.terminadoEm!.localeCompare(a.terminadoEm!))[0];
  const proximas = rotinas.filter((r: Rotina) => r.estado === 'ATIVA').map(r => proximoHorario(r, agora.getTime())).filter((x): x is number => x !== null);
  return {
    escopo: espacoId ?? 'todos', execucoes: reais.length, pass: n('PASS'), fail: n('FAIL'), blocked: n('BLOCKED'), notRun: n('NOT_RUN'),
    consultas: trabalhos.filter(t => t.resultado?.status === 'INFO').length,
    ultimaExecucao: ultima ? { id: ultima.id, em: ultima.terminadoEm, resultado: ultima.resultado?.status ?? ultima.estado } : null,
    proximaExecucao: proximas.length ? new Date(Math.min(...proximas)).toISOString() : null,
    rotinasAtivas: rotinas.filter(r => r.estado === 'ATIVA').length, rotinasPausadas: rotinas.filter(r => r.estado === 'PAUSADA').length,
    falhasDeAgendamento: trabalhos.filter(t => t.estado === 'ERRO' || t.estado === 'PERDIDO').length,
    comentariosPendentes: trabalhos.filter(t => t.jira.estado === 'PENDENTE' || t.jira.estado === 'FALHA' || t.jira.estado === 'PREPARADO').length,
    publicacoesConcluidas: trabalhos.filter(t => t.jira.estado === 'PUBLICADO').length,
    aviso: 'Contagens vêm das execuções registradas. Não há porcentagem de qualidade: quantidade de testes não mede qualidade.'
  };
}
