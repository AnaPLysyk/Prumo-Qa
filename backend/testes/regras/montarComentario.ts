/** Escreve o comentário de resultado (PASS/FAIL, contagens, duração, evidência) a partir de uma execução concluída. */
import { Trabalho } from '../../agendamentos/tipos/fila.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { marcadorDaExecucao } from '../integracoes/helpersDeComentario.js';
import { paragrafoDoComentario } from '../integracoes/helpersDeComentario.js';
import { Comentario, rotulo } from '../tipos/comentarioJira.js';

export function montarComentario(t: Trabalho, nomeProjeto: string): Comentario {
  const res = t.resultado; if (!res || (res.status !== 'PASS' && res.status !== 'FAIL')) throw new Error('JIRA_COMMENT_NOT_APPLICABLE');
  if (!t.ticket) throw new Error('JIRA_TICKET_REQUIRED');
  const c = res.contagem ?? { pass: 0, fail: 0, blocked: 0, notRun: 0 }; const total = c.pass + c.fail + c.blocked + c.notRun;
  const marcador = marcadorDaExecucao(t.id);
  const veredito = res.status === 'FAIL'
    ? 'Validação reprovada nos cenários executados.'
    : total ? 'Cenários executados aprovados. Cobertura parcial: isto não representa aprovação do ticket inteiro.' : 'Rodada concluída com exit code 0, sem cenários individuais reportados; não há resultado por cenário.';
  const quando = t.terminadoEm ?? t.iniciadoEm ?? t.criadoEm;
  const linhas = [
    'PRUMO QA — RESULTADO DE VALIDAÇÃO', '',
    `Ticket: ${t.ticket}`, `Projeto Prumo: ${nomeProjeto}`, `Tipo: ${rotulo[t.tipo] ?? t.tipo}`, `Ambiente: ${t.ambiente}`, `Data: ${quando}`, `Execução: ${t.id}`, '',
    total ? `${total} cenário(s) executado(s): ${c.pass} PASS, ${c.fail} FAIL, ${c.blocked} BLOCKED, ${c.notRun} NOT_RUN` : 'Cenários individuais: nenhum reportado pelo runner',
  ];
  if (res.detalhes) linhas.push('', 'Falhas:', ...res.detalhes.split('\n').slice(0, 5).map(x => x.slice(0, 300)));
  linhas.push('', `Evidência: referência local da execução${res.evidenciaId ? ` ${res.evidenciaId}` : ''} (arquivo no projeto, não anexado).`, '', `Resultado: ${veredito}`, 'Este comentário não altera o status do ticket.', '', marcador);
  const texto = mascarar(linhas.join('\n')).slice(0, 8000);
  return { texto, marcador, adf: { type: 'doc', version: 1, content: texto.split('\n').map(l => l ? paragrafoDoComentario(l) : { type: 'paragraph' }) } };
}
