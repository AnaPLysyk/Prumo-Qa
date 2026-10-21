/** responderComDadosLocais: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { listarRotinas } from "../../agendamentos/banco/agenda.js";
import { listarTrabalhos } from "../../agendamentos/banco/fila.js";
import { Trabalho } from "../../agendamentos/tipos/worker.js";
import { Coleta, GUIA_MANUAL, guia } from "../tipos/chat.js";
import { AgenteChat } from "../tipos/persona.js";
import { dataEmPortugues, semAcentos } from "../../compartilhado/texto.js";
import { listarContextosDaPasta } from "../regras/consultasDeContextos.js";
import { listarHistoricoDoProjeto } from "../../logs/regras/consultasDoDiario.js";
import { perguntarAoAssistenteLocal, situacaoDoProjeto, Fonte } from "../../inicio/servico.js";
import { metricasDasExecucoes } from "../../metricas/servico.js";
import { obterEspaco } from "../../projetos/banco/projetos.js";
import { Espaco } from "../../projetos/contratos.js";
import { listarRunsLocais } from "../../testes/banco/runs.js";
import { catalogoDeTestes } from "../../testes/servicoClassificacao.js";
import { mapaDeVinculos } from "../../testes/regras/mapaDeVinculos.js";
import { planejarDiagnosticoQa } from "./roteamento.js";
import { linhasDoMapaDeVinculos, mapaDeVinculosDoProjeto } from "../regras/vinculosDoProjeto.js";
import { listarPropostas } from "../../tickets/banco/tickets.js";

// --- responderComDadosLocais ---
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
  // Sem projeto selecionado, nunca consultar dados de outras equipes por acidente.
  const trabalhos = espacoId && espaco ? listarTrabalhos(base).filter((t) => t.espacoId === espacoId) : [];
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
    case 'ui-ux': comoUiUx(c, q); break;
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
  // "Onde este projeto está ligado?": responde pelo mapa gravado no projeto (Jira, Qase, GitHub, pasta local e Manual).
  if (/\bvincul|\brelacionad|\bligad[oa]s?\b|onde (esta|fica|foi) (o |a )?(projeto|repositorio|jira|qase|github)|em quais (ferramentas|apps|aplicativos|servicos)/.test(q.semAcento)) {
    if (!q.espaco) return c.semProjeto();
    c.linhas.push(...linhasDoMapaDeVinculos(mapaDeVinculosDoProjeto(q.espaco, q.base))); c.fonte({ rotulo: 'Projetos', aba: 'projetos' }); c.fatos.push(`vinculos=${q.espaco.vinculos.length}`); return;
  }
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

/** Requisitos: contextos aprovados, inventário estático de testes e lacunas de vínculos (não cobertura comprovada). */
async function comoRequisitos(c: Montagem, q: Pergunta) {
  const e = q.espaco; if (!e) { c.semProjeto(); return; }
  const r = await perguntarAoAssistenteLocal(q.espacoId, q.pergunta, q.base);
  const ctx = r.linhas.filter((l) => l.startsWith('Contextos aprovados'));
  if (ctx.length) { c.linhas.push(...ctx); c.fonte({ rotulo: 'Contextos', aba: 'contextos' }); }
  let aprovados: { titulo: string; tipo: string }[] = [];
  try {
    const leitura = await listarContextosDaPasta(e.raizContextos, {}, q.base);
    aprovados = leitura.contextos.filter(x => x.estado === 'APROVADO');
    if (!ctx.length) c.linhas.push(aprovados.length
      ? `${aprovados.length} contexto(s) aprovado(s): ${aprovados.slice(0, 5).map(x => `${x.titulo} (${x.tipo})`).join('; ')}.`
      : 'Ainda não há contextos aprovados neste projeto.');
    c.fatos.push(`contextosAprovados=${aprovados.length}`);
    c.fonte({ rotulo: 'Contextos', aba: 'contextos' });
    if (leitura.problemas.length) c.linhas.push('Há contextos com problemas de leitura ou integridade; revise-os antes de afirmar cobertura.');
  } catch { c.linhas.push('Não consegui conferir os contextos aprovados deste projeto.'); }

  // Só faz leitura adicional para pedidos de análise; perguntas simples não precisam varrer o repositório.
  if (!planejarDiagnosticoQa(q.pergunta, q.espacoId) && !/cobert|rastreab|lacuna/.test(q.semAcento)) return;
  conferirTestesEVinculos(c, q, aprovados);
}

/** O mapa mostra vínculos explícitos, nunca faz correspondência por nome e nunca executa testes. */
function conferirTestesEVinculos(c: Montagem, q: Pergunta, aprovados: { titulo: string; tipo: string }[]) {
  if (!q.espaco) return;
  if (!q.espaco.pastaLocal) {
    c.linhas.push('Sem pasta de repositório vinculada: não posso verificar o inventário de testes deste projeto.');
    c.fonte({ rotulo: 'Projetos', aba: 'projetos' });
  }
  try {
    const mapa = mapaDeVinculos(q.espaco.id, q.base);
    const inventarioConfiavel = !mapa.avisos.some(a => /catálogo/i.test(a));
    if (q.espaco.pastaLocal && inventarioConfiavel) {
      const testes = mapa.nos.filter(n => n.tipo === 'automacao' && n.id.startsWith('automacao:')).length;
      c.fatos.push(`testesCatalogados=${testes}`);
      c.linhas.push(`Inventário estático: ${testes} teste(s) reconhecido(s) no código. Isso não comprova execução nem cobertura dos requisitos.`);
      if (aprovados.length && testes === 0) c.linhas.push('Prioridade: revisar os requisitos aprovados e criar casos candidatos antes de afirmar que estão cobertos.');
    } else if (q.espaco.pastaLocal) c.linhas.push('Inventário de testes parcial ou indisponível: não é possível concluir que faltam testes.');
    const semAutomacao = mapa.lacunas.filter(x => x.tipo === 'CASO_SEM_AUTOMACAO');
    const semTicket = mapa.lacunas.filter(x => x.tipo === 'CASO_SEM_TICKET' || x.tipo === 'TICKET_SEM_CASO');
    c.fatos.push(`casosSemAutomacaoAssociada=${semAutomacao.length}`, `vinculosAusentes=${semTicket.length}`);
    if (semAutomacao.length) c.linhas.push(`${semAutomacao.length} caso(s) sem automação associada no Prumo (podem ser manuais). Verifique: ${semAutomacao.slice(0, 2).map(x => x.mensagem).join(' ')}`);
    if (semTicket.length) c.linhas.push(`${semTicket.length} vínculo(s) entre casos e tickets não cadastrados no Prumo. Confira o Mapa de vínculos; isso não prova falta de testes.`);
    if (aprovados.length && q.espaco.pastaLocal) {
      const requisito = aprovados.find(x => x.tipo === 'requisito') ?? aprovados[0]!;
      c.linhas.push(`Próximo teste candidato, ainda não criado: a partir de "${requisito.titulo.slice(0, 100)}", defina cenário, entrada, comportamento esperado, oráculo e casos negativos conforme os critérios aprovados. Depois vincule o caso e registre sua execução.`);
    }
    if (mapa.lacunas.length || mapa.avisos.length || q.espaco.pastaLocal) c.fonte({ rotulo: 'Testes', aba: 'testes' });
  } catch {
    c.linhas.push('Não foi possível conferir o mapa de vínculos; não concluí que existe uma lacuna de cobertura.');
  }
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

/** UI/UX: só descreve evidência disponível. Nunca confunde dados locais com inspeção visual. */
function comoUiUx(c: Montagem, q: Pergunta) {
  if (!q.espaco) { c.semProjeto(); return; }
  c.linhas.push('Posso revisar hierarquia visual, clareza das ações, acessibilidade e comportamento responsivo. Para avaliar uma tela, informe qual tela e forneça uma imagem ou o código relevante.');
  if (q.espaco.pastaLocal) {
    try {
      const cat = catalogoDeTestes(q.espaco.pastaLocal);
      c.linhas.push(`Inventário local encontrado: ${cat.testes} teste(s) catalogado(s). Isso não comprova acessibilidade nem qualidade visual.`);
      c.fatos.push(`testesCatalogados=${cat.testes}`);
      c.fonte({ rotulo: 'Testes', aba: 'testes' });
    } catch { c.linhas.push('Não consegui consultar os testes do repositório nesta tentativa.'); }
  } else c.linhas.push('O projeto ainda não tem pasta local vinculada para consultar testes de interface.');
  c.fonte({ rotulo: 'Projetos', aba: 'projetos' });
}

/** Investigação de bugs: últimas falhas, hipóteses de causa (ainda não confirmadas) e operações com problema. */
async function comoInvestigacaoDeBugs(c: Montagem, q: Pergunta) {
  const e = q.espaco; if (!e) { c.semProjeto(); return; }
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
    const h = await listarHistoricoDoProjeto(e.raizContextos, { limit: 200 }, q.base); const prob = h.activities.filter((a) => ['FAIL', 'ERROR', 'BLOCKED'].includes(a.state)).slice(0, 3);
    if (prob.length) { c.linhas.push(`Operações com problema no núcleo: ${prob.map((a) => `${a.tool} ${a.state}${a.summary.code ? ' (' + a.summary.code + ')' : ''}`).join('; ')}.`); c.fonte({ rotulo: 'Logs', aba: 'logs' }); }
    c.fatos.push(`operacoesProblema=${prob.length}`);
  } catch { /* projeto sem histórico legível */ }
  const bugs = listarPropostas(e.id, q.base).filter((x) => x.estado !== 'DESCARTADA' && /bug/i.test(String((x as { tipo?: string }).tipo ?? ''))); if (bugs.length) c.linhas.push(`${bugs.length} proposta(s) de bug em aberto.`);
}

/** Regressão: números reais das execuções, última e próxima execução e as runs do projeto. */
function comoRegressao(c: Montagem, q: Pergunta) {
  if (!q.espacoId || !q.espaco) { c.semProjeto(); return; }
  const m = metricasDasExecucoes(q.espacoId, q.base);
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
    const h = await listarHistoricoDoProjeto(e.raizContextos, { limit: 50 }, q.base); const rec = h.activities.slice(0, 4);
    c.linhas.push(rec.length ? `Atividades recentes: ${rec.map((a) => `${a.tool} ${a.state} em ${dataEmPortugues(a.at)}`).join('; ')}.` : 'Nenhuma atividade registrada ainda.'); c.fatos.push(`atividades=${h.activities.length}`); c.fonte({ rotulo: 'Histórico', aba: 'historico' });
  } catch { c.linhas.push('Não consegui ler o histórico deste projeto.'); }
  const m = metricasDasExecucoes(q.espacoId ?? undefined, q.base); if (m.ultimaExecucao) c.linhas.push(`Última execução registrada: ${m.ultimaExecucao.resultado} em ${dataEmPortugues(m.ultimaExecucao.em)}.`);
  c.fonte({ rotulo: 'Métricas', aba: 'metricas' });
}

// --- tentarOuPadrao ---
/** Executa uma consulta e, se der erro, usa o valor padrão (a conversa não quebra por uma consulta). */

export const tentarOuPadrao = <T>(fn: () => T, padrao: T): T => { try { return fn(); } catch { return padrao; } };
