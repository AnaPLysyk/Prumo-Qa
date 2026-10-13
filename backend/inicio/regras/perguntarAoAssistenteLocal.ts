/** Responde uma pergunta do Início com os dados locais do projeto (contextos, propostas, execuções, agenda), sem IA e sem internet. */
import { listarTrabalhos } from '../../agendamentos/banco/listarTrabalhos.js';
import { dataEmPortugues } from '../../compartilhado/texto/dataEmPortugues.js';
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';
import { listarContextosDaPasta } from '../../contextos/regras/listarContextosDaPasta.js';
import { Fonte, Resposta, pare } from '../tipos/assistenteLocal.js';
import { metricasDasExecucoes } from '../../metricas/regras/metricasDasExecucoes.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { listarRunsLocais } from '../../testes/banco/listarRunsLocais.js';
import { listarPropostas } from '../../tickets/banco/listarPropostas.js';

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
