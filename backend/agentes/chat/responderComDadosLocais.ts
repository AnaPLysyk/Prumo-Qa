/** Monta a resposta do agente com os dados locais do projeto (sem IA): prepara a pergunta, chama a parte do agente certo e devolve linhas, fontes e fatos usados. */
import { listarRotinas } from '../../agendamentos/banco/listarRotinas.js';
import { listarTrabalhos } from '../../agendamentos/banco/listarTrabalhos.js';
import { Trabalho } from '../../agendamentos/tipos/fila.js';

import { Coleta, GUIA_MANUAL, guia } from '../tipos/chat.js';
import { AgenteChat } from '../tipos/persona.js';
import { dataEmPortugues } from '../../compartilhado/texto/dataEmPortugues.js';
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';
import { listarContextosDaPasta } from '../regras/listarContextosDaPasta.js';
import { listarHistoricoDoProjeto } from '../../logs/regras/listarHistoricoDoProjeto.js';
import { perguntarAoAssistenteLocal } from '../../inicio/regras/perguntarAoAssistenteLocal.js';
import { situacaoDoProjeto } from '../../inicio/regras/situacaoDoProjeto.js';
import { Fonte } from '../../inicio/tipos/assistenteLocal.js';
import { metricasDasExecucoes } from '../../metricas/regras/metricasDasExecucoes.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { Espaco } from '../../projetos/tipos/espacos.js';
import { listarRunsLocais } from '../../testes/banco/listarRunsLocais.js';
import { catalogoDeTestes } from '../../testes/regras/catalogoDeTestes.js';
import { listarPropostas } from '../../tickets/banco/listarPropostas.js';

/** Classificação inicial de uma falha pelo texto do resultado. É hipótese: confirmar reproduzindo. */
function classificarFalha(texto: string): { classe: 'automacao' | 'ambiente' | 'produto' | 'inconclusiva'; rotulo: string; motivo: string } {
  const t = semAcentos(texto);
  if (/locator|selector|seletor|strict mode|element.*not found|elemento.*nao encontrado|fixture|waitfor|getby/.test(t)) return { classe: 'automacao', rotulo: 'provável erro de automação', motivo: 'o texto cita seletor, fixture ou espera' };
  if (/econnrefused|enotfound|etimedout|socket hang|network|rede|dns|certificad|credencia|\b401\b|\b403\b|\b502\b|\b503\b|indisponivel|unavailable|permission denied|eacces|blocked/.test(t)) return { classe: 'ambiente', rotulo: 'provável bloqueio de ambiente', motivo: 'o texto cita rede, credencial ou serviço indisponível' };
  if (/expected|esperado|received|recebido|assert|toequal|tobe|diverg/.test(t)) return { classe: 'produto', rotulo: 'possível defeito do produto', motivo: 'o resultado diverge do esperado; compare com a regra antes de concluir' };
  return { classe: 'inconclusiva', rotulo: 'inconclusiva', motivo: 'o registro não traz detalhe suficiente' };
}


/** A resposta sendo montada: linhas, fontes (sem repetir aba) e fatos; generico = não achou nada específico. */
type Montagem = { linhas: string[]; fontes: Fonte[]; fatos: string[]; generico: boolean; fonte: (f: Fonte) => void; semProjeto: () => void };
/** O que cada agente recebe: a pergunta (também sem acentos), o projeto e as execuções dele. */
type Pergunta = { pergunta: string; semAcento: string; espacoId: string | null; espaco: Espaco | null; trabalhos: Trabalho[]; base?: string };

export async function responderComDadosLocais(agente: AgenteChat, pergunta: string, espacoId: string | null, base?: string): Promise<Coleta> {
  let espaco: Espaco | null = null;
  if (espacoId) { try { espaco = obterEspaco(espacoId, base); } catch { espaco = null; } }
  const trabalhos = listarTrabalhos(base).filter((t) => !espacoId || t.espacoId === espacoId);
  const q: Pergunta = { pergunta, semAcento: semAcentos(pergunta), espacoId, espaco, trabalhos, base };
  const c = novaMontagem();
  switch (agente.id) {
    case 'orquestrador': comoOrquestrador(c, q); break;
    case 'qa-geral': comoQaGeral(c, q); break;
    case 'requisitos': await comoRequisitos(c, q); break;
    case 'playwright': case 'api-rest': case 'acessibilidade': sobreTestesDaArea(c, q, agente.id); break;
    case 'investigacao-bugs': await comoInvestigacaoDeBugs(c, q); break;
    case 'regressao': comoRegressao(c, q); break;
    case 'monitoramento': await comoMonitoramento(c, q); break;
  }
  const vazio = !c.linhas.length; if (vazio) c.linhas.push('Não encontrei nada sobre isso nos dados locais deste projeto.');
  return { linhas: c.linhas, fontes: c.fontes, fatos: c.fatos, generico: c.generico, vazio };
}

/** Começa vazia; fonte() não repete aba e semProjeto() pede para escolher um projeto. */
function novaMontagem(): Montagem {
  const c: Montagem = { linhas: [], fontes: [], fatos: [], generico: false, fonte: () => undefined, semProjeto: () => undefined };
  c.fonte = (f) => { if (!c.fontes.some((x) => x.aba === f.aba)) c.fontes.push(f); };
  c.semProjeto = () => { c.linhas.push('Selecione um projeto para eu consultar os dados dele.'); c.fonte({ rotulo: 'Projetos', aba: 'projetos' }); };
  return c;
}

/** Orquestrador: responde pelo guia do sistema; sem assunto conhecido, resume o projeto e o que os agentes sabem fazer. */
function comoOrquestrador(c: Montagem, q: Pergunta) {
  const g = guia.filter(([ks]) => ks.some((k) => q.semAcento.includes(k)));
  if (g.length) { for (const [, texto, f] of g.slice(0, 2)) { c.linhas.push(texto); c.fonte(f); } return; }
  c.generico = true; c.linhas.push(...situacaoDoProjeto(q.espacoId, q.base));
  c.linhas.push('Posso consultar testes, falhas, execuções, contextos, histórico e métricas, e explicar técnicas de teste. Pergunte, ou chame um agente pelo nome.');
}

/** QA Geral: explica teste manual quando perguntado, resume o projeto e lista as propostas abertas. */
function comoQaGeral(c: Montagem, q: Pergunta) {
  if (/manua/.test(q.semAcento)) { c.linhas.push(GUIA_MANUAL); c.fonte({ rotulo: 'Testes', aba: 'testes' }); }
  c.linhas.push(...situacaoDoProjeto(q.espacoId, q.base));
  if (!q.espaco) return;
  const ps = listarPropostas(q.espaco.id, q.base).filter((x) => x.estado !== 'DESCARTADA').slice(0, 4);
  if (ps.length) { c.linhas.push(`Propostas abertas: ${ps.map((x) => `"${x.titulo}" (${x.estado})`).join('; ')}.`); c.fonte({ rotulo: 'Testes', aba: 'testes' }); }
  c.fatos.push(`propostas=${ps.length}`);
}

/** Requisitos: responde com os contextos aprovados (requisitos, regras e decisões confirmados pela pessoa). */
async function comoRequisitos(c: Montagem, q: Pergunta) {
  const e = q.espaco; if (!e) { c.semProjeto(); return; }
  const r = await perguntarAoAssistenteLocal(q.espacoId, q.pergunta, q.base); const ctx = r.linhas.filter((l) => l.startsWith('Contextos aprovados'));
  if (ctx.length) { c.linhas.push(...ctx); c.fonte({ rotulo: 'Contextos', aba: 'contextos' }); return; }
  try {
    const todos = (await listarContextosDaPasta(e.raizContextos, {})).contextos; const aprov = todos.filter((x) => x.estado === 'APROVADO');
    c.linhas.push(aprov.length ? `${aprov.length} contexto(s) aprovado(s): ${aprov.slice(0, 5).map((x) => `${x.titulo} (${x.tipo})`).join('; ')}.` : 'Ainda não há contextos aprovados neste projeto.');
    c.fatos.push(`contextosAprovados=${aprov.length}`); c.fonte({ rotulo: 'Contextos', aba: 'contextos' });
  } catch { c.linhas.push('Não consegui ler os contextos deste projeto.'); }
}

/** Playwright, API REST e Acessibilidade: contam e dão exemplos dos testes da sua área no repositório vinculado. */
function sobreTestesDaArea(c: Montagem, q: Pergunta, agenteId: string) {
  const e = q.espaco; if (!e) { c.semProjeto(); return; }
  if (!e.pastaLocal) { c.linhas.push('Vincule a pasta do repositório ao projeto para eu ler os testes.'); c.fonte({ rotulo: 'Testes', aba: 'testes' }); return; }
  const tiposPorAgente: Record<string, string[]> = { playwright: ['funcional', 'smoke', 'regressao'], 'api-rest': ['integracao'], acessibilidade: ['acessibilidade'] };
  try {
    const cat = catalogoDeTestes(e.pastaLocal); const area = tiposPorAgente[agenteId] ?? [];
    const meus = cat.features.flatMap((f) => f.testes.filter((t) => area.includes(t.tipo)).map((t) => ({ f: f.nome, t })));
    c.linhas.push(meus.length ? `${meus.length} teste(s) da minha área no repositório (de ${cat.testes} no total). Exemplos: ${meus.slice(0, 3).map((x) => `"${x.t.titulo}" (${x.f})`).join('; ')}.` : `Não encontrei testes da minha área no repositório (${cat.testes} testes no total).`);
    c.fatos.push(`testesArea=${meus.length}`, `testesTotal=${cat.testes}`); c.fonte({ rotulo: 'Testes', aba: 'testes' });
  } catch { c.linhas.push('Não consegui ler o catálogo de testes do repositório.'); }
}

/** Investigação de bugs: últimas falhas, hipóteses de causa (ainda não confirmadas) e operações com problema. */
async function comoInvestigacaoDeBugs(c: Montagem, q: Pergunta) {
  const e = q.espaco;
  const f = q.trabalhos.filter((t) => t.resultado?.status === 'FAIL').sort((a, b) => (b.terminadoEm ?? '').localeCompare(a.terminadoEm ?? '')).slice(0, 3);
  c.linhas.push(f.length ? `Últimas falhas: ${f.map((t) => `${t.capability ?? t.tipo}${t.ticket ? ' (' + t.ticket + ')' : ''} em ${dataEmPortugues(t.terminadoEm)}`).join('; ')}.` : 'Não encontrei execuções com FAIL registradas.');
  if (f.length) {
    c.fonte({ rotulo: 'Execuções', aba: 'execucoes' }); const cls = f.map((t) => ({ t, x: classificarFalha(`${t.resultado?.motivo ?? ''} ${t.resultado?.detalhes ?? ''}`) }));
    if (/classific|causa|por que|porque|motivo|hipotes/.test(q.semAcento)) for (const { t, x } of cls) c.linhas.push(`Hipótese para ${t.capability ?? t.tipo}${t.ticket ? ' (' + t.ticket + ')' : ''}: ${x.rotulo}, porque ${x.motivo}.`);
    else { const conta = new Map<string, number>(); for (const { x } of cls) conta.set(x.rotulo, (conta.get(x.rotulo) ?? 0) + 1); c.linhas.push(`Hipóteses, ainda não confirmadas: ${[...conta].map(([r, n]) => `${n} ${r}`).join('; ')}. Reproduzir antes de classificar.`); }
    c.fatos.push(...cls.map(({ x }) => `hipotese=${x.classe}`));
  }
  c.fatos.push(`falhas=${f.length}`);
  if (!e) return;
  try {
    const h = await listarHistoricoDoProjeto(e.raizContextos, { limit: 200 }); const prob = h.activities.filter((a) => ['FAIL', 'ERROR', 'BLOCKED'].includes(a.state)).slice(0, 3);
    if (prob.length) { c.linhas.push(`Operações com problema no núcleo: ${prob.map((a) => `${a.tool} ${a.state}${a.summary.code ? ' (' + a.summary.code + ')' : ''}`).join('; ')}.`); c.fonte({ rotulo: 'Logs', aba: 'logs' }); }
    c.fatos.push(`operacoesProblema=${prob.length}`);
  } catch { /* projeto sem histórico legível */ }
  const bugs = listarPropostas(e.id, q.base).filter((x) => x.estado !== 'DESCARTADA' && /bug/i.test(String((x as { tipo?: string }).tipo ?? ''))); if (bugs.length) c.linhas.push(`${bugs.length} proposta(s) de bug em aberto.`);
}

/** Regressão: números reais das execuções, última e próxima execução e as runs do projeto. */
function comoRegressao(c: Montagem, q: Pergunta) {
  const m = metricasDasExecucoes(q.espacoId ?? undefined, q.base);
  c.linhas.push(m.execucoes ? `${m.execucoes} execução(ões) registrada(s): ${m.pass} PASS, ${m.fail} FAIL, ${m.blocked} BLOCKED, ${m.notRun} NOT_RUN.` : 'Ainda não há execuções registradas.');
  if (m.ultimaExecucao) c.linhas.push(`Última execução: ${m.ultimaExecucao.resultado} em ${dataEmPortugues(m.ultimaExecucao.em)}.`);
  const rot = listarRotinas(q.base).filter((r) => !q.espacoId || r.espacoId === q.espacoId);
  c.linhas.push(m.proximaExecucao ? `Próxima rotina: ${dataEmPortugues(m.proximaExecucao)} (${m.rotinasAtivas} ativa(s)).` : rot.length ? 'Nenhuma rotina ativa agendada.' : 'Nenhuma rotina cadastrada.');
  c.fatos.push(`execucoes=${m.execucoes}`, `pass=${m.pass}`, `fail=${m.fail}`, `rotinas=${rot.length}`); c.fonte({ rotulo: 'Execuções', aba: 'execucoes' }); c.fonte({ rotulo: 'Agendamentos', aba: 'agenda' });
  if (q.espaco) { const r = listarRunsLocais(q.espaco.id, q.base).slice(0, 3); if (r.length) c.linhas.push(`Features/execuções: ${r.map((x) => `"${x.titulo}" (${x.estado})`).join('; ')}.`); }
}

/** Monitoramento: atividades recentes do projeto e a última execução registrada. */
async function comoMonitoramento(c: Montagem, q: Pergunta) {
  const e = q.espaco; if (!e) { c.semProjeto(); return; }
  try {
    const h = await listarHistoricoDoProjeto(e.raizContextos, { limit: 50 }); const rec = h.activities.slice(0, 4);
    c.linhas.push(rec.length ? `Atividades recentes: ${rec.map((a) => `${a.tool} ${a.state} em ${dataEmPortugues(a.at)}`).join('; ')}.` : 'Nenhuma atividade registrada ainda.'); c.fatos.push(`atividades=${h.activities.length}`); c.fonte({ rotulo: 'Histórico', aba: 'historico' });
  } catch { c.linhas.push('Não consegui ler o histórico deste projeto.'); }
  const m = metricasDasExecucoes(q.espacoId ?? undefined, q.base); if (m.ultimaExecucao) c.linhas.push(`Última execução registrada: ${m.ultimaExecucao.resultado} em ${dataEmPortugues(m.ultimaExecucao.em)}.`);
  c.fonte({ rotulo: 'Métricas', aba: 'metricas' });
}
