/** Calcula os números reais das execuções: PASS/FAIL/BLOCKED/NOT_RUN, última e próxima execução, rotinas e falhas recentes. */
import { listarRotinas } from '../../agendamentos/banco/listarRotinas.js';
import { listarTrabalhos } from '../../agendamentos/banco/listarTrabalhos.js';
import { proximoHorario } from '../../agendamentos/regras/proximoHorario.js';
import { Rotina } from '../../agendamentos/tipos/rotina.js';

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
