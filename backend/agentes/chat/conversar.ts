/** Conversação e rastreamento do agente — arquivos relacionados agrupados para manutenção. */
import { salvarPerfil, lerPerfil } from "../banco/perfil.js";
import { palavrasDaPergunta, escolherAgente, planejarOrquestracao, termoCasaComPergunta } from "./roteamento.js";
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
import { consultarIaExterna } from "./consultarIaExterna.js";
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
export async function orquestrar(agentes: AgenteChat[], motivo: { agente: string; pontos: number }[], pergunta: string, espacoId: string | null, base?: string, responder: Responder = responderComDadosLocais, agora: () => Date = () => new Date()): Promise<{ coleta: Coleta; registro: Orquestracao }> {
  const inicio = agora(); const etapas: EtapaDaOrquestracao[] = []; const partes: string[] = []; const fontes: Fonte[] = []; const fatos: string[] = [];
  for (const [i, agente] of agentes.entries()) {
    const t0 = agora();
    try {
      const r = await responder(agente, pergunta, espacoId, base);
      const fim = agora(); const vazio = !!r.vazio;
      etapas.push({ ordem: i + 1, agente: agente.id, inicio: t0.toISOString(), fim: fim.toISOString(), duracaoMs: fim.getTime() - t0.getTime(), estado: vazio ? 'SEM_DADOS' : 'CONCLUIDA', fontes: r.fontes.map((f) => f.rotulo).slice(0, 10), fatos: r.fatos.slice(0, 20), linhas: r.linhas.length });
      partes.push(`${agente.nome}: ${vazio ? 'não encontrou dados sobre isso neste projeto.' : r.linhas.slice(0, 2).join(' ')}`);
      for (const f of r.fontes) if (!fontes.some((x) => x.aba === f.aba)) fontes.push(f);
      fatos.push(...r.fatos.map((f) => `${agente.id}:${f}`));
    } catch (e) {
      const fim = agora(); const erro = mascarar(String((e as Error)?.message ?? e)).slice(0, 200);
      etapas.push({ ordem: i + 1, agente: agente.id, inicio: t0.toISOString(), fim: fim.toISOString(), duracaoMs: fim.getTime() - t0.getTime(), estado: 'FALHOU', fontes: [], fatos: [], linhas: 0, erro });
      partes.push(`${agente.nome}: não consegui consultar agora (${erro}).`);
    }
  }
  const concluidas = etapas.filter((e) => e.estado === 'CONCLUIDA').length; const fim = agora();
  const registro: Orquestracao = {
    id: randomUUID(), em: inicio.toISOString(), espacoId, responsavel: 'orquestrador', modo: 'LOCAL', motivo: motivo.slice(0, 6), agentes: agentes.map((a) => a.id),
    dependencias: 'INDEPENDENTES', etapas, estado: concluidas === etapas.length ? 'CONCLUIDA' : concluidas ? 'PARCIAL' : 'FALHOU', duracaoMs: fim.getTime() - inicio.getTime()
  };
  const coleta: Coleta = { linhas: [`Consultei ${agentes.length} especialistas, um de cada vez:`, ...partes], fontes, fatos, generico: false, vazio: concluidas === 0 };
  return { coleta, registro };
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
    linhas: c.linhas.map((l) => mascarar(l)), fontes: c.fontes, modo, estilo, rota: extra.rota ?? [], fatos: c.fatos, proximos: extra.proximos ?? [], acoes: extra.acoes ?? [], pendente: extra.pendente ?? null, pessoa: extra.pessoa !== undefined ? extra.pessoa : pessoa, continuou: extra.continuou ?? false, ...(extra.aviso ? { aviso: extra.aviso } : {}), ...(extra.orquestracao ? { orquestracao: extra.orquestracao } : {}) });
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
  const plano = !teste && !o.agente && !r.continuou && plataforma.orquestracao ? planejarOrquestracao(r.rota) : null;
  let orquestracao: Orquestracao | undefined; let avisoOrquestracao: string | undefined;
  let agente = r.agente; let local: Coleta;
  if (plano) {
    const feito = await orquestrar(plano.map((id) => agentesChat.find((a) => a.id === id)!), r.rota, pergunta, o.espacoId, o.base);
    agente = agentesChat.find((a) => a.id === 'orquestrador')!; local = feito.coleta; orquestracao = feito.registro;
    try { registrarOrquestracao(orquestracao, o.base); } catch { avisoOrquestracao = 'Não foi possível registrar a orquestração no Painel de atividades; a resposta foi preservada.'; }
  } else local = teste ?? await responderComDadosLocais(agente, pergunta, o.espacoId, o.base);
  juntarConhecimentos(o, agente, pergunta, historico, r.continuou, local);
  const proximos = proximosPassosSugeridos(agente.id, local.fatos, perfil?.papel ?? null, pergunta);
  const externaDesligada = (o.provedor ?? 'local') !== 'local' && !plataforma.iaExterna;
  const aviso = [avisoOrquestracao, externaDesligada ? 'A Administração desligou o uso de Claude Code e Codex nesta instalação; a resposta usou só os dados deste computador.' : null].filter(Boolean).join(' ');
  const comum = { rota: r.rota, continuou: r.continuou, proximos, ...(orquestracao ? { orquestracao } : {}), ...(aviso ? { aviso } : {}) };
  const provedor = externaDesligada ? 'local' : o.provedor ?? 'local'; const chave = pergunta + '|' + historico.length;
  const vestido = () => aplicarEstilo(local.linhas, estilo, nome, agente, !!o.primeira, local.fatos, pessoa, chave);
  if (provedor === 'local') return montar(agente, { ...local, linhas: vestido() }, 'LOCAL', comum);

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
  const rota = agentesChat.map((a) => {
    const casou = a.palavras.map((k) => { const forte = k.startsWith('!'), w = forte ? k.slice(1) : k; return termoCasaComPergunta(w, palavras, frase) ? { termo: w.replace('~', ''), pontos: forte ? 3 : w.replace('~', '').length > 5 ? 2 : 1 } : null; })
      .filter((x): x is { termo: string; pontos: number } => !!x);
    const mencao = p.includes('@' + a.id) || p.includes('agente ' + semAcentos(a.nome)) || (a.nome.includes(' ') && p.includes(semAcentos(a.nome)));
    const extra = Math.min(6, aprendidos[a.id] ?? 0);
    return { agente: a.id, nome: a.nome, pontos: casou.reduce((n, c) => n + c.pontos, 0) + (mencao ? 10 : 0) + extra, casou, mencao, aprendidos: extra };
  }).filter((x) => x.pontos > 0).sort((a, b) => b.pontos - a.pontos);
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
  return { pergunta: texto, palavras, termos: termosDaFrase(texto).map(raizDaPalavra), escolhido: { id: r.agente.id, nome: r.agente.nome, porPadrao: !r.rota.length }, rota, orquestracao: planejarOrquestracao(r.rota), foco: focoRastro };
}
