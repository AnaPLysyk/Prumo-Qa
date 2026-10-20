/** Calcula e apresenta as permissões aplicáveis às rotinas agendadas. */
import { estadoDaAutorizacao } from "../autorizacoes/estadoDaAutorizacao.js";
import { lerAutorizacoes } from "../banco/autorizacoes.js";
import { capacidadesDaRotina } from "./capacidadesDaRotina.js";
import { Rotina } from "../tipos/rotina.js";

export function listarPermissoes(espacoId?: string, base?: string, agora = new Date()) {
  const a = lerAutorizacoes(base);
  return { execucoes: a.execucoes.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoDaAutorizacao(x, agora) })), publicacoes: a.publicacoes.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoDaAutorizacao(x, agora) })),
    // Políticas de escrita agendada (resultados no Qase): visíveis para poderem ser revogadas, não só expirar.
    escritas: a.escritas.filter(x => !espacoId || x.espacoId === espacoId).map(x => ({ ...x, estado: estadoDaAutorizacao(x, agora) })) };
}

/** O que a rotina pode fazer, em palavras simples, para a pessoa conferir antes de autorizar. */
export function permissoesDaRotina(r: Rotina, base?: string) {
  const caps = capacidadesDaRotina(r, base); const p: string[] = [];
  if (r.tipo === 'consulta-jira') p.push('Lê tickets do Jira vinculado ao projeto (somente leitura).');
  else if (r.tipo === 'analise-mudancas') p.push('Lê commits do repositório GitHub vinculado (somente leitura). Não dispara execuções.');
  else if (r.tipo === 'run-qase') p.push(caps.length ? `Executa localmente ${caps.map(c => `"${c}"`).join(', ')} (automações dos casos da run) e tenta publicar os resultados na run do Qase. Só publica com uma política de publicação aprovada para essa run; sem ela, os resultados ficam locais.` : 'A run não tem automação associada: nada será executado.');
  else if (r.tipo === 'k6') p.push(`Executa o k6 oficial contra ${r.k6?.alvo} (${r.k6?.usuarios} usuário(s) virtual(is), ${r.k6?.duracaoSegundos}s) com o script ${r.k6?.script}.`);
  else if (caps.length) p.push(`Executa localmente ${caps.map(c => `"${c}"`).join(', ')}, comando já declarado no contrato do projeto. Nenhum comando novo pode ser criado pela agenda.`);
  else p.push('Não há automação associada: nada será executado.');
  if (r.ticket) p.push(`Ticket associado: ${r.ticket}. Comentário no Jira só com política de publicação aprovada.`);
  return p;
}
