/** Lógica e contratos de inicio: operações relacionadas no mesmo módulo. */
import { listarTrabalhos } from "../agendamentos/repositorioFila.js";
import { dataEmPortugues } from "../compartilhado/texto/dataEmPortugues.js";
import { semAcentos } from "../compartilhado/texto/semAcentos.js";
import { listarContextosDaPasta } from "../agentes/regras/listarContextosDaPasta.js";
import { Fonte, Resposta, pare } from "./contratos.js";
import { metricasDasExecucoes } from "../metricas/servico.js";
import { obterEspaco } from "../projetos/repositorio.js";
import { listarRunsLocais } from "../testes/repositorioRuns.js";
import { listarPropostas } from "../tickets/repositorio.js";

/** Identifica palavras-chave no texto normalizado da pergunta sem consultar serviços externos. */
const perguntaTemPalavra = (p: string, ...palavras: string[]) => palavras.some((palavra) => p.includes(palavra));

export async function perguntarAoAssistenteLocal(espacoId: string | null, pergunta: string, base?: string): Promise<Resposta> {
  const p = semAcentos(pergunta); const fontes: Fonte[] = []; const linhas: string[] = [];
  const add = (rotulo: string, aba: string) => { if (!fontes.some(f => f.aba === aba)) fontes.push({ rotulo, aba }); };
  const e = espacoId ? obterEspaco(espacoId, base) : null;
  const trabalhos = listarTrabalhos(base).filter(t => !espacoId || t.espacoId === espacoId);
  if (perguntaTemPalavra(p, 'falh', 'erro', 'quebr', 'fail')) {
    const f = trabalhos.filter(t => t.resultado?.status === 'FAIL').sort((a, b) => (b.terminadoEm ?? '').localeCompare(a.terminadoEm ?? '')).slice(0, 3);
    linhas.push(f.length ? `Últimas falhas: ${f.map(t => `${t.capability ?? t.tipo}${t.ticket ? ' (' + t.ticket + ')' : ''} em ${dataEmPortugues(t.terminadoEm)}`).join('; ')}.` : 'Não encontrei execuções com FAIL registradas.'); add('Execuções', 'execucoes');
  }
  if (perguntaTemPalavra(p, 'proxim', 'agenda', 'rotina', 'quando roda')) {
    const m = metricasDasExecucoes(espacoId ?? undefined, base); linhas.push(m.proximaExecucao ? `A próxima rotina está agendada para ${dataEmPortugues(m.proximaExecucao)} (${m.rotinasAtivas} ativa(s)).` : 'Não há rotina ativa agendada.'); add('Agendamentos', 'agenda');
  }
  if (perguntaTemPalavra(p, 'feature', 'plano', 'run', 'execucao', 'relatorio') && espacoId) {
    const r = listarRunsLocais(espacoId, base).slice(0, 3);
    linhas.push(r.length ? `Features/execuções: ${r.map(x => `"${x.titulo}" (${x.estado})`).join('; ')}.` : 'Nenhuma execução de feature preparada.'); add('Features', 'runs');
  }
  if (perguntaTemPalavra(p, 'propost', 'rascunho', 'revis', 'caso novo', 'cenario') && espacoId) {
    const ps = listarPropostas(espacoId, base).filter(x => x.estado !== 'DESCARTADA').slice(0, 4);
    linhas.push(ps.length ? `Propostas: ${ps.map(x => `"${x.titulo}" (${x.estado}${x.origem === 'IA' ? ', sugerida por IA' : ''})`).join('; ')}.` : 'Não há propostas abertas.'); add('Testes', 'testes');
  }
  if (perguntaTemPalavra(p, 'ticket', 'jira', 'bug')) { linhas.push('Tickets são consultados ao vivo no Jira: abra a tela Tickets para buscar com filtros.'); add('Tickets', 'tickets'); }
  const termos = [...new Set(p.split(/[^a-z0-9]+/).filter(t => t.length > 3 && !pare.has(t)))].slice(0, 6);
  if (e && termos.length) {
    try {
      const achados = new Map<string, string>();
      for (const t of termos) for (const c of (await listarContextosDaPasta(e.raizContextos, { busca: t })).contextos.filter(x => x.estado === 'APROVADO').slice(0, 5)) achados.set(c.id, `${c.titulo} (${c.tipo})`);
      if (achados.size) { linhas.push(`Contextos aprovados relacionados: ${[...achados.values()].slice(0, 5).join('; ')}.`); add('Contextos', 'contextos'); }
    } catch { /* projeto sem contextos acessíveis: segue sem eles */ }
  }
  if (!linhas.length) linhas.push('Não encontrei nada sobre isso nos dados locais deste projeto. Tente perguntar sobre falhas, próxima rotina, features, propostas ou contextos.');
  return { linhas, fontes, modo: 'LOCAL' };
}

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
