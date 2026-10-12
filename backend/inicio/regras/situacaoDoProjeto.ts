/** Escreve até cinco linhas sobre o que está acontecendo no projeto agora (propostas, runs, execuções, agenda) para o painel do Início. */
import { dataEmPortugues } from '../../compartilhado/texto/dataEmPortugues.js';
import { metricasDasExecucoes } from '../../metricas/regras/metricasDasExecucoes.js';
import { listarRunsLocais } from '../../testes/banco/listarRunsLocais.js';
import { listarPropostas } from '../../tickets/banco/listarPropostas.js';

/** Resumo curto do que está acontecendo agora no projeto; alimenta a abertura do painel inicial. */
export function situacaoDoProjeto(espacoId: string | null, base?: string): string[] {
  const m = metricasDasExecucoes(espacoId ?? undefined, base); const linhas: string[] = [];
  if (!espacoId) { linhas.push('Selecione um projeto para eu acompanhar o que acontece nele.'); }
  const props = espacoId ? listarPropostas(espacoId, base).filter(p => p.estado === 'RASCUNHO' || p.estado === 'REVISADA') : [];
  const runs = espacoId ? listarRunsLocais(espacoId, base).filter(r => r.estado !== 'PUBLICADA') : [];
  if (m.execucoes) linhas.push(`${m.execucoes} ${m.execucoes === 1 ? 'execução registrada' : 'execuções registradas'}: ${m.pass} PASS, ${m.fail} FAIL, ${m.blocked} BLOCKED.`);
  else if (espacoId) linhas.push('Ainda não há execuções registradas neste projeto.');
  if (m.fail) linhas.push('Há falhas recentes. Pergunte "o que falhou?" para ver.');
  if (m.proximaExecucao) linhas.push(`Próxima rotina agendada: ${dataEmPortugues(m.proximaExecucao)}.`); else if (espacoId) linhas.push('Nenhuma rotina agendada.');
  if (props.length) linhas.push(`${props.length} ${props.length === 1 ? 'proposta aguardando revisão' : 'propostas aguardando revisão'}.`);
  if (runs.length) linhas.push(`${runs.length} ${runs.length === 1 ? 'execução de feature em andamento' : 'execuções de feature em andamento'}.`);
  if (m.comentariosPendentes) linhas.push(`${m.comentariosPendentes} ${m.comentariosPendentes === 1 ? 'comentário do Jira pendente' : 'comentários do Jira pendentes'}.`);
  return linhas.slice(0, 5);
}
