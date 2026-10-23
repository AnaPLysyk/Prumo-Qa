/** Conversação e rastreamento do agente — arquivos relacionados agrupados para manutenção. */
import { salvarPerfil, lerPerfil } from "../banco/perfil.js";
import { palavrasDaPergunta, escolherAgente, planejarOrquestracao, planejarDiagnosticoQa, termoCasaComPergunta } from "./roteamento.js";
import { proximosPassosSugeridos } from "./roteamento.js";
import { normalizarNome, raizDaPalavra, termosDaFrase } from "../regras/normalizacaoDoConhecimento.js";
import { Meta, Turno, PAPEIS, Coleta, ContextoChat, Estilo, Opcoes, Resposta, agentePorTipo } from "../tipos/chat.js";
import { Perfil, Conhecimento, TipoConhecimento } from "../tipos/conhecimento.js";
import { rotuloPapel, Papel, AgenteChat, agentesChat } from "../tipos/persona.js";
import { semAcentos } from "../../compartilhado/texto.js";
import { randomUUID } from "node:crypto";
import { responderComDadosLocais } from "./responderComDadosLocais.js";
import { EtapaDaOrquestracao, Orquestracao } from "../tipos/chat.js";
import { Fonte } from "../../inicio/servico.js";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";
import { nomeParaChamar, aplicarEstilo } from "../servicoEstiloDoChat.js";
import { pesosAprendidos } from "../banco/atendimentos.js";
import { registrarOrquestracao } from "../banco/orquestracao.js";
import { consultarIaExterna, nomesDosProvedores, responderComIaAutomatica } from "./consultarIaExterna.js";
import { responderComFundamentosDeQa } from "./responderComFundamentosDeQa.js";
import { conduzirMesaDeIas } from "./mesaDeIas.js";
import { tentarOuPadrao } from "./responderComDadosLocais.js";
import { regrasDosAgentes } from "../../administracao/servico.js";
import { conhecimentosRelevantes, listarConhecimentos, registrarConhecimento } from "../banco/conhecimento.js";
import { obterEspaco } from "../../projetos/banco/projetos.js";
import { catalogoDeTestes } from "../../testes/servicoClassificacao.js";
import { listarTrechosDeSkill } from "../banco/skills.js";
import { sementeDasSkills } from "../banco/lerPastaDeSkill.js";
import { escolherTrechosDaSkill } from "../regras/regrasDasSkills.js";

// ── conversar ──
// ── intencaoDePerfil ──
const papelNoTexto = (t: string): Papel | null => { for (const [re, p] of PAPEIS) if (re.test(t)) return p; return null; };

export function intencaoDePerfil(pergunta: string, historico: Turno[], perfil: Perfil | null, base?: string): Meta | null {
  const t = semAcentos(pergunta); const pend = historico.at(-1)?.pendente ?? null; const palavras = palavrasDaPergunta(pergunta);
  const explicito = pergunta.match(/(?:pode me chamar de|me chame de|me chama de|meu nome [ée]|prefiro ser chamad[oa] de|quero ser chamad[oa] de)\s+([^,.!?;]+)/i);
  const papelExpl = /\b(sou|trabalho com|trabalho como|atuo como|meu papel e)\b/.test(t) ? papelNoTexto(t.replace(/.*\b(sou|trabalho com|trabalho como|atuo como|meu papel e)\b/, '')) : null;
  let nome: string | null = explicito ? normalizarNome(explicito[1]!.trim()) : null;
  if (!nome && pend === 'nome' && !pergunta.includes('?') && palavras.length <= 4 && !papelExpl) {
    if (/^(prefiro nao|tanto faz|nao precisa|pula|depois)/.test(t)) return { linhas: ['Sem problema. Se mudar de ideia, diga "pode me chamar de…".'] };
    nome = normalizarNome(pergunta.replace(/^\s*(pode ser|[ée]|eu sou|sou( o| a)?|me chama de)\s+/i, '').trim());
  }
  let papel = papelExpl; if (!papel && pend === 'papel' && palavras.length <= 5) papel = papelNoTexto(t) ?? (/\b(desenvolv|program)/.test(t) ? 'dev' : /\b(teste|qualidade)/.test(t) ? 'qa' : /\b(negocio|requisit|analis)/.test(t) ? 'analista' : null);
  if (!nome && !papel) return null;
  const linhas: string[] = []; let salvo = perfil;
  try { salvo = salvarPerfil({ ...(nome ? { comoChamar: nome } : {}), ...(papel ? { papel } : {}) }, base); } catch { return { linhas: ['Não consegui guardar isso agora no banco de conhecimento. Tente de novo em Ajustes › Assistente.'] }; }
  if (nome) linhas.push(`Combinado, ${nome}. Vou te chamar assim daqui pra frente.`);
  if (papel) linhas.push(`Anotado: você trabalha com ${rotuloPapel[papel]}. Vou ajustar a forma de explicar.`);
  if (!salvo?.papel) return { linhas: [...linhas, 'E qual é o seu papel no time: QA, desenvolvimento, produto (PO) ou análise?'], pendente: 'papel' };
  return { linhas: [...linhas, 'Por onde começamos?'], proximos: proximosPassosSugeridos('orquestrador', [], salvo.papel, '') };
}

// ── orquestrar ──
type Responder = typeof responderComDadosLocais;

/**
 * Cada etapa roda mesmo que a anterior falhe: a falha fica registrada (FALHOU, com o motivo mascarado) e entra na resposta.
 * O registro guarda só metadados; a pergunta e as respostas não são gravadas.
 */
export async function orquestrar(agentes: AgenteChat[], motivo: { agente: string; pontos: number }[], pergunta: string, espacoId: string | null, base?: string, responder: Responder = responderComDadosLocais, agora: () => Date = () => new Date(), progresso?: (registro: Orquestracao) => void): Promise<{ coleta: Coleta; registro: Orquestracao }> {
  const inicio = agora(); const etapas: EtapaDaOrquestracao[] = []; const partes: string[] = []; const fontes: Fonte[] = []; const fatos: string[] = [];
  const diagnosticoCompleto = !!planejarDiagnosticoQa(pergunta, espacoId);
  const id = randomUUID();
  const registrarProgresso = (emExecucao: string | undefined) => {
    if (!progresso) return;
    const registro: Orquestracao = { id, em: inicio.toISOString(), espacoId, responsavel: 'orquestrador', modo: 'LOCAL',
      motivo: motivo.slice(0, 6), agentes: agentes.map(a => a.id), dependencias: 'INDEPENDENTES',
      etapas: etapas.map(et => ({ ...et })), estado: 'EXECUTANDO', duracaoMs: Math.max(0, agora().getTime() - inicio.getTime()),
      ...(emExecucao ? { emExecucao } : {}) };
    try { progresso(registro); } catch { /* O registro observável não pode impedir as consultas. */ }
  };
  registrarProgresso(agentes[0]?.id);
  for (const [i, agente] of agentes.entries()) {
    const t0 = agora();
    try {
      const r = await responder(agente, pergunta, espacoId, base);
      const fim = agora(); const vazio = !!r.vazio;
      etapas.push({ ordem: i + 1, agente: agente.id, inicio: t0.toISOString(), fim: fim.toISOString(), duracaoMs: fim.getTime() - t0.getTime(), estado: vazio ? 'SEM_DADOS' : 'CONCLUIDA', fontes: r.fontes.map((f) => f.rotulo).slice(0, 10), fatos: r.fatos.slice(0, 20), linhas: r.linhas.length });
      partes.push(`${agente.nome}: ${vazio ? 'não encontrou dados sobre isso neste projeto.' : r.linhas.slice(0, diagnosticoCompleto ? 5 : 2).join(' ')}`);
      for (const f of r.fontes) if (!fontes.some((x) => x.aba === f.aba)) fontes.push(f);
      fatos.push(...r.fatos.map((f) => `${agente.id}:${f}`));
    } catch (e) {
      const fim = agora(); const erro = mascarar(String((e as Error)?.message ?? e)).slice(0, 200);
      etapas.push({ ordem: i + 1, agente: agente.id, inicio: t0.toISOString(), fim: fim.toISOString(), duracaoMs: fim.getTime() - t0.getTime(), estado: 'FALHOU', fontes: [], fatos: [], linhas: 0, erro });
      partes.push(`${agente.nome}: não consegui consultar agora (${erro}).`);
    }
    registrarProgresso(agentes[i + 1]?.id);
  }
  const concluidas = etapas.filter((e) => e.estado === 'CONCLUIDA').length; const fim = agora();
  const registro: Orquestracao = {
    id, em: inicio.toISOString(), espacoId, responsavel: 'orquestrador', modo: 'LOCAL', motivo: motivo.slice(0, 6), agentes: agentes.map((a) => a.id),
    dependencias: 'INDEPENDENTES', etapas, estado: concluidas === etapas.length ? 'CONCLUIDA' : concluidas ? 'PARCIAL' : 'FALHOU', duracaoMs: fim.getTime() - inicio.getTime()
  };
  const coleta: Coleta = { linhas: [`Consultei ${agentes.length} especialistas, um de cada vez:`, ...partes], fontes, fatos, generico: false, vazio: concluidas === 0 };
  return { coleta, registro };
}

/** Conclusão priorizada a partir dos números que os especialistas realmente consultaram.
 * Sem dado, não chama o projeto de saudável nem alega uma execução não realizada.
 */
export function sinteseDiagnosticoQa(coleta: Coleta): string[] {
  const contar = (agente: string, chave: string): number | null => {
    const valor = coleta.fatos.find(f => f.startsWith(agente + ':' + chave + '='))?.split('=').at(-1);
    if (valor === undefined) return null;
    const numero = Number(valor);
    return Number.isFinite(numero) && numero >= 0 ? numero : null;
  };
  const execucoes = contar('regressao', 'execucoes');
  const falhas = contar('regressao', 'fail');
  const recentes = contar('investigacao-bugs', 'falhas');
  const contextos = contar('requisitos', 'contextosAprovados');
  const testes = contar('requisitos', 'testesCatalogados');
  const semAutomacao = contar('requisitos', 'casosSemAutomacaoAssociada');
  const vinculos = contar('requisitos', 'vinculosAusentes');
  const linhas = ['Diagnóstico de QA com evidências locais (não executei novos testes):'];
  if (falhas !== null && falhas > 0) linhas.push(`Prioridade alta: ${falhas} execução(ões) com FAIL. Confira os resultados em Execuções e reproduza antes de atribuir a causa.`);
  else if (execucoes === 0) linhas.push('Sem execuções registradas para este projeto: ainda não há evidência suficiente para avaliar a qualidade.');
  else if (execucoes !== null && falhas === 0) linhas.push(`${execucoes} execução(ões) registrada(s), sem FAIL nesses registros. Isso não comprova ausência de defeitos.`);
  if (recentes !== null && recentes > 0 && falhas === null) linhas.push(`Investigue as ${recentes} falha(s) recentes no Histórico ou em Execuções; as causas apontadas são hipóteses.`);
  if (contextos === 0) linhas.push('Rastreabilidade: nenhum contexto aprovado encontrado. Confira critérios de aceite e vínculo entre requisitos e testes.');
  if (contextos !== null && contextos > 0) linhas.push(`${contextos} contexto(s) aprovado(s) encontrado(s). Confira sua cobertura pelos testes antes de concluir que estão atendidos.`);
  if (testes === 0 && contextos !== null && contextos > 0) linhas.push('Prioridade de cobertura: há requisitos aprovados, mas nenhum teste foi reconhecido no código. Proponha casos e revise o inventário antes de concluir que não existem testes.');
  else if (testes !== null && testes > 0) linhas.push(`${testes} teste(s) localizado(s) por leitura estática. Compare cada requisito com seus casos e evidências; a quantidade não mede cobertura.`);
  if (semAutomacao !== null && semAutomacao > 0) linhas.push(`${semAutomacao} caso(s) sem automação associada; confirme se são casos manuais antes de propor automatização.`);
  if (vinculos !== null && vinculos > 0) linhas.push(`${vinculos} relação(ões) entre tickets e casos ainda sem cadastro no mapa de vínculos. Isso é lacuna de rastreabilidade, não defeito comprovado.`);
  if (linhas.length === 1) linhas.push('Diagnóstico inconclusivo: não foi possível obter indicadores suficientes. Confira o projeto e as consultas dos especialistas abaixo.');
  return linhas;
}

// ── responderSomenteLeitura ──
/**
 * Caminho do Orquestrador para o MCP: mesmo roteamento do chat (escolherAgente, planejarOrquestracao, orquestrar,
 * responderComDadosLocais), sem IA externa e sem gravar nada (nem conversa, perfil, aprendizado, atendimento ou orquestração).
 * O projeto é obrigatório: sem ele as consultas locais não teriam escopo.
 */
export async function responderSomenteLeitura(pergunta: string, espacoId: string, agenteId?: string | null, base?: string) {
  const plataforma = regrasDosAgentes(base);
  if (agenteId && !agentesChat.some((a) => a.id === agenteId)) throw new Error('AGENT_UNKNOWN: agente desconhecido: ' + agenteId + '.');
  if (agenteId && plataforma.desligados.includes(agenteId)) throw new Error('AGENT_DISABLED: a Administração desligou este agente.');
  const r = escolherAgente(pergunta, agenteId, { desligados: plataforma.desligados });
  const diagnostico = !agenteId && plataforma.orquestracao ? planejarDiagnosticoQa(pergunta, espacoId, plataforma.desligados) : null;
  const plano = !agenteId && plataforma.orquestracao ? diagnostico ?? planejarOrquestracao(r.rota) : null;
  const orquestrador = agentesChat.find((a) => a.id === 'orquestrador')!;
  const agente = plano ? orquestrador : r.agente;
  const coleta = plano ? (await orquestrar(plano.map((id) => agentesChat.find((a) => a.id === id)!), r.rota, pergunta, espacoId, base)).coleta : await responderComDadosLocais(agente, pergunta, espacoId, base);
  if (diagnostico) coleta.linhas.unshift(...sinteseDiagnosticoQa(coleta));
  return { linhas: coleta.linhas.slice(0, 20).map((l) => mascarar(l).slice(0, 2000)), fontes: coleta.fontes, agente: { id: agente.id, nome: agente.nome }, consultados: plano ?? [agente.id] };
}

// ── conversar ──
function intencaoDeAprender(pergunta: string, espacoId: string | null, forcado: string | null | undefined, base?: string): Meta | null {
  const m = pergunta.match(/^\s*(?:por favor,?\s*)?(?:lembr[ae](?:-se)?|anot[ae]|guard[ae]|aprend[ae]|memoriz[ae])\s*(?:que|isso|:)?\s*:?\s+(.{4,})$/i); if (!m) return null;
  const texto = m[1]!.trim(); const alvo = forcado ?? escolherAgente(texto).agente.id; const agente = alvo === 'orquestrador' ? null : alvo; const n = semAcentos(texto);
  const tipo: TipoConhecimento = / significa | quer dizer | e o nome de /.test(' ' + n + ' ') ? 'glossario' : /^(eu )?(prefiro|gosto|quero que)/.test(n) ? 'preferencia' : /^(sempre|nunca|antes de|depois de|para )/.test(n) ? 'procedimento' : 'fato';
  try {
    const { item, duplicado } = registrarConhecimento({ espacoId, agente, tipo, titulo: texto.slice(0, 80), texto, origem: 'CONVERSA' }, base);
    const quem = agente ? agentesChat.find((a) => a.id === agente)!.nome : 'todos os agentes';
    if (duplicado) return { linhas: [`Eu já tinha isso anotado para ${quem} (${item.estado === 'APROVADO' ? 'aprovado' : 'em rascunho'}).`], agente: agente ?? 'orquestrador', fontes: [{ rotulo: 'Agentes', aba: 'agentes' }] };
    return { linhas: [`Anotei como rascunho para ${quem}: "${item.texto}".`, 'Só passo a usar depois que você confirmar.'], agente: agente ?? 'orquestrador', fontes: [{ rotulo: 'Agentes', aba: 'agentes' }],
      acoes: [{ tipo: 'aprovar_conhecimento', id: item.id, rotulo: 'Confirmar aprendizado' }, { tipo: 'descartar_conhecimento', id: item.id, rotulo: 'Descartar' }] };
  } catch (e) { return { linhas: [`Não consegui anotar: ${(e as Error).message === 'KNOWLEDGE_LIMIT' ? 'o banco de conhecimento chegou ao limite' : 'o banco de conhecimento não está disponível'}.`] }; }
}

function montarResposta(agente: AgenteChat, c: Coleta, modo: Resposta['modo'], estilo: Estilo, pessoa: string | null, extra: Partial<Resposta> & { rota?: Resposta['rota'] } = {}): Resposta {
  return ({ agente: { id: agente.id, nome: agente.nome, especializacao: agente.especializacao },
    linhas: c.linhas.map((l) => mascarar(l)), fontes: c.fontes, modo, estilo, rota: extra.rota ?? [], fatos: c.fatos, proximos: extra.proximos ?? [], acoes: extra.acoes ?? [], pendente: extra.pendente ?? null, pessoa: extra.pessoa !== undefined ? extra.pessoa : pessoa, continuou: extra.continuou ?? false, ...(extra.aviso ? { aviso: extra.aviso } : {}), ...(extra.orquestracao ? { orquestracao: extra.orquestracao } : {}), ...(extra.mesa ? { mesa: extra.mesa } : {}), ...(extra.mcp ? { mcp: extra.mcp } : {}) });
}

/** Explica um teste aberto na visão de código: só o que a leitura do arquivo mostra (inferência declarada). */
function responderSobreTeste(ctx: ContextoChat, espacoId: string | null, base?: string): Coleta {
  const fontes: Fonte[] = [{ rotulo: 'Testes', aba: 'testes' }]; const agenteDe = (id: string) => agentesChat.find((a) => a.id === id)!;
  const e = espacoId ? tentarOuPadrao(() => obterEspaco(espacoId, base), null) : null;
  if (!e?.pastaLocal) return { linhas: ['Vincule a pasta do repositório ao projeto para eu ler este teste.'], fontes, fatos: [], agente: agenteDe('qa-geral') };
  const cat = tentarOuPadrao(() => catalogoDeTestes(e.pastaLocal!), null); const f = cat?.features.find((x) => x.arquivo === ctx.arquivo);
  if (!f || !f.testes.length) return { linhas: [`Não encontrei testes reconhecíveis em ${ctx.arquivo}.`], fontes, fatos: [], agente: agenteDe('qa-geral') };
  const antes = f.testes.filter((t) => !ctx.linha || t.linha <= ctx.linha); const t = antes.length ? antes.reduce((a, b) => (b.linha > a.linha ? b : a)) : f.testes[0]!;
  const linhas = [`"${t.titulo}" fica em ${f.arquivo}:${t.linha}, na feature ${f.nome}.`, `Tipo provável: ${t.tipo} (${t.motivo}; confiança ${t.confianca.toLowerCase()}). É inferência pela leitura do código.`,
    t.passos.length ? `Passos que encontrei no código: ${t.passos.slice(0, 6).map((s, i) => `${i + 1}) ${s}`).join(' ')}${t.passos.length > 6 ? ' …' : ''}.` : 'Não encontrei passos nomeados neste teste; leia o corpo no editor.',
    [t.tags.length ? `Tags: ${t.tags.join(', ')}.` : '', t.qase?.length ? `Ligado aos casos do Qase: ${t.qase.join(', ')}.` : 'Nenhum caso do Qase marcado neste teste.'].filter(Boolean).join(' '),
    'Se ele passa hoje, só uma execução real responde: rode pela capability do projeto e confira em Execuções.'];
  return { linhas, fontes, fatos: [`teste=${t.tipo}`, `passos=${t.passos.length}`], agente: agenteDe(agentePorTipo[t.tipo] ?? 'qa-geral') };
}

function intencaoDeSaber(pergunta: string, espacoId: string | null, forcado: string | null | undefined, base?: string): Meta | null {
  const t = semAcentos(pergunta); if (!/o que (voce|vc) (sabe|aprendeu|conhece|lembra)|seus conhecimentos|o que (eu )?te ensinei|o que voce anotou/.test(t)) return null;
  const alvo = forcado ?? escolherAgente(t.replace(/o que (voce|vc) (sabe|aprendeu|conhece|lembra)( sobre)?/, '')).agente.id; const agente = alvo === 'orquestrador' ? null : alvo;
  const itens = tentarOuPadrao(() => listarConhecimentos({ espacoId, agente, estados: ['APROVADO', 'RASCUNHO'] }, base), [] as Conhecimento[]);
  const aprov = itens.filter((c) => c.estado === 'APROVADO'), rasc = itens.filter((c) => c.estado === 'RASCUNHO'); const meus = aprov.filter((c) => c.origem !== 'PRUMO');
  return { agente: alvo, fontes: [{ rotulo: 'Agentes', aba: 'agentes' }], linhas: [
    `Sei ${aprov.length} coisa(s) aprovada(s)${agente ? ' nesta especialidade' : ''}: ${aprov.length - meus.length} do conhecimento inicial do Prumo e ${meus.length} que você me ensinou${rasc.length ? `; ${rasc.length} rascunho(s) esperando sua decisão` : ''}.`,
    ...(meus.length ? [`Do que você me ensinou: ${meus.slice(0, 4).map((c) => c.titulo).join('; ')}.`] : []),
    'Tudo isso está no Cérebro de cada agente e no arquivo conhecimento.db.'] };
}

function juntarConhecimentos(o: Opcoes, agente: AgenteChat, pergunta: string, historico: NonNullable<Opcoes['historico']>, continuou: boolean, local: Coleta): void {
  // Seguimento ("e mais?"): busca pela pergunta anterior e mostra o que ainda não foi dito (do 2º item em diante).
  const anterior = continuou ? historico.at(-1)?.pergunta ?? '' : '';
  const rel = tentarOuPadrao(() => anterior ? conhecimentosRelevantes(o.espacoId, agente.id === 'orquestrador' ? null : agente.id, anterior, 4, o.base).slice(1, 3) : conhecimentosRelevantes(o.espacoId, agente.id === 'orquestrador' ? null : agente.id, pergunta, 2, o.base), [] as Conhecimento[]);
  if (rel.length) {
    const sabidas = rel.map((c) => `${c.origem === 'PRUMO' ? 'Do que eu sei' : 'Do que você me ensinou'} — ${semAcentos(c.texto).startsWith(semAcentos(c.titulo)) ? '' : c.titulo + ': '}${c.texto.length > 420 ? c.texto.slice(0, 420) + '…' : c.texto}`);
    if (local.generico || local.vazio) local.linhas = sabidas; else local.linhas.push(...sabidas);
    if (!local.fontes.some((f) => f.aba === 'agentes')) local.fontes.push({ rotulo: 'Cérebro', aba: 'agentes' }); local.fatos.push(`conhecimentos=${rel.length}`);
  }
  if (continuou && !rel.length) local.linhas.push('Sobre isso não tenho mais nada registrado. Posso chamar outro agente, ou você me ensina com "lembra que…".');
}

/**
 * Pergunta de conhecimento (conceito, técnica, pedido de exemplo, boa prática, TI em geral): vai para a IA, que sabe QA e TI.
 * Ficam locais só os assuntos que a IA não sabe: dados do projeto (execuções, falhas, métricas, logs...), ajuda do próprio Prumo e conversa sobre a relação (nome, papel).
 */
export function perguntaDeConhecimento(pergunta: string, comProjeto = false): boolean {
  const t = semAcentos(pergunta).trim();
  if (t.split(/\s+/).length < 2 || /^(oi|ola|opa|e ai|bom dia|boa tarde|boa noite|obrigad[oa]|valeu|ok|certo|tchau)\b[\s!.,?]*$/.test(t)) return false;
  const emGeral = /\b(em geral|geralmente|normalmente|costuma|costumam|boas praticas|na teoria|conceito)\b/.test(t);
  // Ajuda do próprio aplicativo: o guia local conhece as telas, e a IA não.
  if (/\b(prumo|neste (app|aplicativo|sistema)|nesta tela|aqui no|orquestrador|nesta aba|neste botao)\b/.test(t)) return false;
  const guiaDoApp = /\b(vincular|conectar|agendar|exportar|tema|idioma|cerebro|beekeeper|cadastrar projeto|criar projeto|novo projeto)\b/.test(t) && /\b(como (eu )?(faco|posso|consigo)|onde (fica|vejo|acho|esta|fica)|para que serve|onde eu)\b/.test(t) && !emGeral;
  if (guiaDoApp) return false;
  // Dados do projeto: a IA não os tem, só o Prumo.
  if (!emGeral && (/\b(meu|minha|meus|minhas|nosso|nossa|neste|nesse|deste|desse|desta|dessa)\b.*\b(projeto|execuc|teste|falh|suite|run|ticket|bug|rotina|agenda|caso)/.test(t) || /\b(ultim[oa]s?|hoje|ontem|esta semana|agora)\b.*\b(execuc|falh|run|teste)/.test(t))) return false;
  if (/\b(como (esta|estao|anda|andam)|situacao|status|resumo|falhou|falharam|diagnostico|quantos? (testes|execucoes|runs|bugs|casos|projetos))\b/.test(t)) return false;
  if (comProjeto && !emGeral && /\b(falha|falhas|falharam|erro|erros|execucao|execucoes|logs?|metricas?|historico|agendamentos?|rotinas?|cobertura|vinculos?|propostas?|runs?|resultados?|projeto|projetos)\b/.test(t)) return false;
  return true;
}

export async function conversar(o: Opcoes): Promise<Resposta> {
  const pergunta = o.pergunta.trim(); const estilo = o.estilo ?? 'amigavel'; const nome = (o.nome || 'Prumo').slice(0, 40); const historico = (o.historico ?? []).slice(-6);
  const perfil = tentarOuPadrao(() => lerPerfil(o.base), null); const pessoa = nomeParaChamar(perfil, o.base);
  const montar = (agente: AgenteChat, c: Coleta, modo: Resposta['modo'], extra: Partial<Resposta> & { rota?: Resposta['rota'] } = {}): Resposta => montarResposta(agente, c, modo, estilo, pessoa, extra);

  // 1) Conversas sobre a própria relação (como chamar, papel, ensinar, o que sabe): respondidas localmente, sempre.
  const meta = intencaoDePerfil(pergunta, historico, perfil, o.base) ?? intencaoDeAprender(pergunta, o.espacoId, o.agente, o.base) ?? intencaoDeSaber(pergunta, o.espacoId, o.agente, o.base);
  if (meta) {
    const a = agentesChat.find((x) => x.id === (meta.agente ?? 'orquestrador'))!; const novo = tentarOuPadrao(() => lerPerfil(o.base), perfil);
    return montar(a, { linhas: aplicarEstilo(meta.linhas, estilo === 'direto' ? 'amigavel' : estilo, nome, a, false, []), fontes: meta.fontes ?? [], fatos: [] }, 'LOCAL', { proximos: meta.proximos ?? [], acoes: meta.acoes ?? [], pendente: meta.pendente ?? null, pessoa: novo?.comoChamar ?? null });
  }

  // 2) Roteamento (com memória da sessão e vocabulário aprendido) e resposta local com dados reais.
  const aprendidos = tentarOuPadrao(() => pesosAprendidos(pergunta, o.base), {});
  // Administração: agentes desligados não respondem, a orquestração pode ser desligada e a IA externa também.
  const plataforma = regrasDosAgentes(o.base);
  const teste = o.contexto?.tipo === 'teste' ? responderSobreTeste(o.contexto, o.espacoId, o.base) : null;
  const r = teste ? { agente: teste.agente!, rota: [], continuou: false } : escolherAgente(pergunta, o.agente, { historico, aprendidos, desligados: plataforma.desligados });
  // 3) Orquestração: sem agente escolhido pela pessoa e com dois ou mais especialistas fortes, cada um responde uma etapa.
  const diagnostico = !teste && !o.agente && !r.continuou && plataforma.orquestracao ? planejarDiagnosticoQa(pergunta, o.espacoId, plataforma.desligados) : null;
  const plano = !teste && !o.agente && !r.continuou && plataforma.orquestracao ? diagnostico ?? planejarOrquestracao(r.rota) : null;
  let orquestracao: Orquestracao | undefined; let avisoOrquestracao: string | undefined;
  let agente = r.agente; let local: Coleta;
  if (plano) {
    const feito = await orquestrar(plano.map((id) => agentesChat.find((a) => a.id === id)!), r.rota, pergunta, o.espacoId, o.base,
      responderComDadosLocais, () => new Date(), parcial => registrarOrquestracao(parcial, o.base));
    agente = agentesChat.find((a) => a.id === 'orquestrador')!; local = feito.coleta; orquestracao = feito.registro;
    if (diagnostico) local.linhas.unshift(...sinteseDiagnosticoQa(local));
    try { registrarOrquestracao(orquestracao, o.base); } catch { avisoOrquestracao = 'Não foi possível registrar a orquestração no Painel de atividades; a resposta foi preservada.'; }
  } else local = teste ?? await responderComDadosLocais(agente, pergunta, o.espacoId, o.base);
  juntarConhecimentos(o, agente, pergunta, historico, r.continuou, local);
  const proximos = proximosPassosSugeridos(agente.id, local.fatos, perfil?.papel ?? null, pergunta);
  const externaDesligada = (o.provedor ?? 'local') !== 'local' && !plataforma.iaExterna;
  const aviso = [avisoOrquestracao, externaDesligada ? `A Administração desligou o uso de ${Object.values(nomesDosProvedores).join(', ')} nesta instalação; a resposta usou só os dados deste computador.` : null].filter(Boolean).join(' ');
  const comum = { rota: r.rota, continuou: r.continuou, proximos, ...(orquestracao ? { orquestracao } : {}), ...(aviso ? { aviso } : {}) };
  const provedor = externaDesligada ? 'local' : o.provedor ?? 'local'; const chave = pergunta + '|' + historico.length;
  const vestido = () => aplicarEstilo(local.linhas, estilo, nome, agente, !!o.primeira, local.fatos, pessoa, chave);

  // 3b) Conhecimento de QA e TI: a IA externa autorizada responde como engenheiro de qualidade (com pesquisa na web quando tem); sem nenhuma, a base offline do Prumo.
  const seguimentoGeral = r.continuou && !!historico.at(-1)?.resposta && (local.generico || local.vazio);
  // Só no modo automático (ninguém escolheu uma IA): quem escolheu Claude, Codex, Copilot, Gemini ou a Mesa fala com ela, com o MCP do Prumo.
  if (!teste && !o.agente && (o.provedor ?? 'local') === 'local' && (perguntaDeConhecimento(pergunta, !!o.espacoId) || seguimentoGeral)) {
    const base = { o, agente, pergunta, estilo, nome, perfil, historico, comum, montar };
    const automatica = plataforma.iaExterna ? await responderComIaAutomatica(base) : { avisos: [] as string[] };
    if ('resposta' in automatica) return automatica.resposta;
    const fundamentos = responderComFundamentosDeQa(pergunta);
    const falhas = automatica.avisos.length ? `${automatica.avisos.join('; ')}.` : '';
    if (fundamentos) return montar(agente, { linhas: fundamentos, fontes: [], fatos: ['fundamentos=' + fundamentos.length] }, 'LOCAL', { ...comum, aviso: [falhas, 'Resposta da base offline do Prumo; com uma IA conectada e autorizada a resposta é completa e pesquisa na web.'].filter(Boolean).join(' ') });
    return montar(agente, { linhas: ['Não tenho essa resposta na base offline do Prumo. Conecte e autorize o Claude Code, o GitHub Copilot, o Codex ou o Gemini (Ajustes › Assistente, e entre na conta dele) e eu respondo como engenheiro de qualidade, com pesquisa na web.'], fontes: [{ rotulo: 'Conexões', aba: 'conexoes' }], fatos: [] }, 'LOCAL', { ...comum, ...(falhas ? { aviso: falhas } : {}) });
  }
  if (provedor === 'local') return montar(agente, { ...local, linhas: vestido() }, 'LOCAL', comum);

  if (provedor === 'mesa') return conduzirMesaDeIas({ o, agente, pergunta, local, estilo, nome, perfil, historico, comum, montar, vestido });
  return consultarIaExterna({ o, agente, pergunta, local, estilo, nome, perfil, historico, comum, provedor, montar, vestido });
}

// ── rastrearPergunta ──
type Rastro = {
  pergunta: string; palavras: string[]; termos: string[];
  escolhido: { id: string; nome: string; porPadrao: boolean };
  rota: { agente: string; nome: string; pontos: number; casou: { termo: string; pontos: number }[]; mencao: boolean; aprendidos: number }[];
  orquestracao: string[] | null;
  foco: { agente: string; responderia: boolean; conhecimentos: { id: string; titulo: string }[]; skill: { usados: string[]; omitidos: number; origem: 'BANCO' | 'ARQUIVOS' } } | null;
};

/**
 * Usa as mesmas funções do chat (escolherAgente, planejarOrquestracao, conhecimentosRelevantes, escolherTrechosDaSkill),
 * então o rastro mostra o que o chat faria agora. Não chama IA, não grava conversa, atendimento nem aprendizado.
 * Fora do rastro: histórico da sessão e pedidos sobre a própria relação (nome, papel, "lembre que", "o que você sabe").
 */
export function rastrearPergunta(pergunta: string, espacoId: string | null, foco: string | null, base?: string): Rastro {
  const texto = pergunta.trim(); const palavras = palavrasDaPergunta(texto); const frase = palavras.join(' '); const p = semAcentos(texto);
  const aprendidos = tentarOuPadrao(() => pesosAprendidos(texto, base), {} as Record<string, number>);
  const r = escolherAgente(texto, null, { aprendidos });
  const ordem = (id: string) => { const i = r.rota.findIndex((x) => x.agente === id); return i < 0 ? Infinity : i; };
  const rota = agentesChat.map((a) => {
    const casou = a.palavras.map((k) => { const forte = k.startsWith('!'), w = forte ? k.slice(1) : k; return termoCasaComPergunta(w, palavras, frase) ? { termo: w.replace('~', ''), pontos: forte ? 3 : w.replace('~', '').length > 5 ? 2 : 1 } : null; })
      .filter((x): x is { termo: string; pontos: number } => !!x);
    const mencao = p.includes('@' + a.id) || p.includes('agente ' + semAcentos(a.nome)) || (a.nome.includes(' ') && p.includes(semAcentos(a.nome)));
    const extra = Math.min(6, aprendidos[a.id] ?? 0);
    return { agente: a.id, nome: a.nome, pontos: casou.reduce((n, c) => n + c.pontos, 0) + (mencao ? 10 : 0) + extra, casou, mencao, aprendidos: extra };
  }).filter((x) => x.pontos > 0).sort((a, b) => b.pontos - a.pontos || ordem(a.agente) - ordem(b.agente));
  const agenteFoco = foco ? agentesChat.find((a) => a.id === foco) : undefined;
  let focoRastro: Rastro['foco'] = null;
  if (agenteFoco) {
    const esp = agenteFoco.especializacao ?? 'qa-geral';
    const conhecimentos = tentarOuPadrao(() => conhecimentosRelevantes(espacoId, agenteFoco.id, texto, 5, base), []).map((c) => ({ id: c.id, titulo: c.titulo }));
    let skill: NonNullable<Rastro['foco']>['skill'];
    try { const e = escolherTrechosDaSkill(listarTrechosDeSkill({ especializacao: esp, estados: ['APROVADO'] }, base), texto); skill = { usados: e.usados, omitidos: e.omitidos, origem: 'BANCO' }; }
    catch { const e = escolherTrechosDaSkill(sementeDasSkills().filter((t) => t.especializacao === esp), texto); skill = { usados: e.usados, omitidos: e.omitidos, origem: 'ARQUIVOS' }; }
    focoRastro = { agente: agenteFoco.id, responderia: r.agente.id === agenteFoco.id, conhecimentos, skill };
  }
  const plano = planejarDiagnosticoQa(texto, espacoId, regrasDosAgentes(base).desligados) ?? planejarOrquestracao(r.rota);
  return { pergunta: texto, palavras, termos: termosDaFrase(texto).map(raizDaPalavra), escolhido: { id: r.agente.id, nome: r.agente.nome, porPadrao: !r.rota.length }, rota, orquestracao: plano, foco: focoRastro };
}
