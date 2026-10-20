/** Lógica e contratos de tickets: operações relacionadas no mesmo módulo. */
import { randomUUID } from "node:crypto";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { obterEspaco } from "../projetos/banco/projetos.js";
import { gravarPropostas, lerPropostas, alterarProposta, obterProposta } from "./banco/tickets.js";
import { MAX_IA_POR_HORA, MAX_PROPOSTAS, NovaProposta, Proposta, propostaSchema, dadosBug } from "./contratos.js";
import { executarOperacao } from "../conexoes/escrita/executarOperacao.js";
import { Executor } from "../conexoes/tipos/operacoesExternas.js";
import { associarEspaco } from "../projetos/servicoProjetos.js";
import path from "node:path";
import { Auxiliar } from "../conexoes/tipos/operacao.js";
import { esquemaCaso } from "../testes/tipos/escritaQase.js";

/** Mede de 0 a 1 o quanto dois conjuntos de palavras se parecem, para achar propostas repetidas. */

const semelhancaEntrePalavras = (primeiro: Set<string>, segundo: Set<string>): number => {
  if (!primeiro.size || !segundo.size) return 0;
  let emComum = 0;
  for (const palavra of primeiro) {
    if (segundo.has(palavra)) emComum++;
  }
  return emComum / (primeiro.size + segundo.size - emComum);
};

/** Simplifica um texto (minúsculas, sem acentos e sem pontuação) para comparar propostas. */

const textoComparavel = (texto: string): string => texto
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/** Usada somente na busca de propostas semelhantes. */
const palavrasDoTexto = (texto: string): Set<string> =>
  new Set(textoComparavel(texto).split(' ').filter(palavra => palavra.length > 2));

export function criarProposta(n: NovaProposta, b?: string, agora = new Date()): Proposta {
  obterEspaco(n.espacoId, b);

  const dados = validarDadosDaProposta(n.tipo, n.dados) as Record<string, unknown>;
  const titulo = mascarar(
    String(n.tipo === 'caso'
      ? (dados as { titulo: string }).titulo
      : (dados as { resumo: string }).resumo)
  ).slice(0, 255);

  const registro = lerPropostas(b);
  const doEspaco = registro.itens.filter(
    proposta => proposta.espacoId === n.espacoId && proposta.estado !== 'DESCARTADA'
  );

  if (doEspaco.length >= MAX_PROPOSTAS) {
    throw new Error('PROPOSAL_LIMIT');
  }

  const propostasRecentesDaIa = doEspaco.filter(
    proposta => proposta.origem === 'IA' && agora.getTime() - Date.parse(proposta.criadaEm) < 3600000
  );
  if (n.origem === 'IA' && propostasRecentesDaIa.length >= MAX_IA_POR_HORA) {
    throw new Error('PROPOSAL_RATE_LIMIT: limite de propostas por hora atingido; revise as pendentes antes de propor mais.');
  }

  const tituloComparavel = textoComparavel(titulo);
  const tituloRepetido = doEspaco.find(
    proposta => proposta.tipo === n.tipo && textoComparavel(proposta.titulo) === tituloComparavel
  );
  if (tituloRepetido) {
    throw new Error('DUPLICATE_PROPOSAL: já existe uma proposta com o mesmo título neste projeto.');
  }

  const palavras = palavrasDoTexto(titulo);
  const similares = doEspaco
    .filter(proposta =>
      proposta.tipo === n.tipo &&
      semelhancaEntrePalavras(palavras, palavrasDoTexto(proposta.titulo)) >= 0.7
    )
    .map(proposta => proposta.id)
    .slice(0, 10);

  const proposta: Proposta = propostaSchema.parse({
    id: randomUUID(),
    espacoId: n.espacoId,
    tipo: n.tipo,
    origem: n.origem,
    ...(n.cliente ? { cliente: n.cliente.slice(0, 60) } : {}),
    estado: 'RASCUNHO',
    titulo,
    dados,
    requisito: mascarar(n.requisito ?? '').slice(0, 500),
    risco: mascarar(n.risco ?? '').slice(0, 300),
    similares,
    revisao: null,
    remoto: null,
    ...(n.falhaDeOrigem ? { falhaDeOrigem: n.falhaDeOrigem } : {}),
    criadaEm: agora.toISOString(),
    atualizadaEm: agora.toISOString()
  });

  registro.itens.push(proposta);
  gravarPropostas(registro, b);
  return proposta;
}

/** Edição pela pessoa: invalida a revisão anterior (o conteúdo mudou). */
export function editarProposta(id: string, dados: unknown, extras: { requisito?: string; risco?: string }, b?: string) {
  return alterarProposta(id, p => { if (p.estado === 'PUBLICADA' || p.estado === 'VINCULADA' || p.estado === 'DESCARTADA') throw new Error('PROPOSAL_CLOSED'); const d = validarDadosDaProposta(p.tipo, dados) as Record<string, unknown>; p.dados = d; p.titulo = mascarar(String(p.tipo === 'caso' ? d.titulo : d.resumo)).slice(0, 255); if (extras.requisito !== undefined) p.requisito = mascarar(extras.requisito).slice(0, 500); if (extras.risco !== undefined) p.risco = mascarar(extras.risco).slice(0, 300); p.revisao = null; p.estado = 'RASCUNHO'; }, b);
}

export const descartarProposta = (id: string, b?: string) => alterarProposta(id, p => { if (p.estado === 'PUBLICADA' || p.estado === 'VINCULADA') throw new Error('PROPOSAL_CLOSED'); p.estado = 'DESCARTADA'; }, b);

export function revisarProposta(id: string, r: { duplicidade: boolean; requisito: boolean; risco: boolean; cobertura: boolean }, por: string, b?: string, agora = new Date()) {
  return alterarProposta(id, p => {
    if (p.estado === 'PUBLICADA' || p.estado === 'VINCULADA' || p.estado === 'DESCARTADA') throw new Error('PROPOSAL_CLOSED');
    if (![r.duplicidade, r.requisito, r.risco, r.cobertura].every(Boolean)) throw new Error('REVIEW_INCOMPLETE: confirme duplicidade, requisito, risco e cobertura.');
    if (p.origem === 'IA' && p.tipo === 'caso' && !p.requisito.trim()) throw new Error('REVIEW_REQUIREMENT_MISSING: informe o requisito que o caso cobre.');
    p.revisao = { ...r, por, em: agora.toISOString() }; p.estado = 'REVISADA';
  }, b);
}

/** Pré-condição de publicação: IA exige revisão completa; as demais origens exigem ao menos a confirmação da pessoa (feita no diálogo nativo). */
export function podePublicar(p: Proposta) { if (p.estado === 'PUBLICADA' || p.estado === 'VINCULADA' || p.estado === 'DESCARTADA') throw new Error('PROPOSAL_CLOSED'); if (p.origem === 'IA' && p.estado !== 'REVISADA') throw new Error('REVIEW_REQUIRED: proposta de IA precisa ser revisada antes de publicar.'); return true; }

const marcarPublicada = (id: string, remoto: { id?: string; chave?: string; url?: string }, b?: string) => alterarProposta(id, p => { p.estado = 'PUBLICADA'; p.remoto = remoto; }, b);

/** Parâmetros da issue no GitHub a partir do rascunho local: o mesmo objeto alimenta a prévia confirmada e o envio. */
export function parametrosDaIssueGithub(p: Proposta) {
  const descricao = typeof p.dados.descricao === 'string' ? p.dados.descricao.trim() : '';
  const falha = p.falhaDeOrigem ? `\n\nFalha de origem: caso ${p.falhaDeOrigem.casoId} na run local ${p.falhaDeOrigem.runLocalId}.` : '';
  // Rótulos padrão do GitHub (bug / enhancement) mais os do rascunho; sem permissão de push o GitHub os descarta e o registro diz isso.
  const extras = Array.isArray(p.dados.rotulos) ? p.dados.rotulos.filter((r): r is string => typeof r === 'string') : [];
  const rotulos = [...new Set([p.dados.classificacao === 'MELHORIA' ? 'enhancement' : 'bug', ...extras])].slice(0, 10);
  return { titulo: String(p.dados.resumo ?? ''), corpo: (descricao + falha).slice(0, 60000), rotulos };
}

/** Opções do defeito Qase escolhidas no rascunho: severidade (ID do campo de sistema), milestone e campos personalizados. */
type OpcoesDefeitoQase = { severidadeQase?: number; marcoQase?: number; camposQase?: Record<string, string> };

/** Parâmetros do defeito no Qase a partir do rascunho local: o mesmo objeto alimenta a prévia confirmada e o envio. */
export function parametrosDoDefeitoQase(p: Proposta, o: OpcoesDefeitoQase) {
  if (p.dados.classificacao === 'MELHORIA') throw new Error('DEFECT_TYPE_INVALID: melhoria não é defeito Qase. Escolha Jira, GitHub Issues ou mantenha o rascunho.');
  const resultadoAtual = typeof p.dados.descricao === 'string' ? p.dados.descricao.trim() : '';
  if (resultadoAtual.length < 3) throw new Error('DEFECT_RESULT_REQUIRED: descreva o resultado observado.');
  return { titulo: String(p.dados.resumo ?? ''), resultadoAtual, severidade: o.severidadeQase ?? 3, ...(o.marcoQase ? { marcoId: o.marcoQase } : {}), campos: o.camposQase ?? {} };
}

/**
 * Publicação de uma proposta (a pessoa decidiu): vira a operação externa correspondente (caso Qase, ticket Jira, defeito Qase ou issue GitHub), marca a proposta
 * como publicada com o identificador remoto e registra o vínculo como REGISTRADO_PELO_PRUMO. Idempotente: a chave da operação vem do conteúdo.
 */
export async function publicarProposta(ex: Executor, id: string, o: { confirmado: boolean; tipoId?: string; destino?: 'jira' | 'qase' | 'github'; severidadeQase?: number; marcoQase?: number; camposQase?: Record<string, string>; base?: string }) {
  const b = o.base; const p = obterProposta(id, b); podePublicar(p); const e = obterEspaco(p.espacoId, b);
  if (p.tipo === 'caso') {
    const reg = await executarOperacao(ex, p.espacoId, 'qase.criar_caso', p.dados, { base: b, confirmado: o.confirmado });
    if (reg.estado === 'CONFIRMADA' && reg.remoto?.id) {
      marcarPublicada(id, { id: reg.remoto.id, chave: reg.remoto.chave }, b);
      const ticket = typeof p.dados.ticket === 'string' ? p.dados.ticket : null; const jv = e.vinculos.find(v => v.servico === 'jira'); const qv = e.vinculos.find(v => v.servico === 'qase');
      if (ticket && jv && qv) { try { associarEspaco(p.espacoId, { de: { tipo: 'jira', id: ticket, vinculoId: jv.id, origem: jv.recurso.instancia }, para: { tipo: 'qase', id: reg.remoto.id, vinculoId: qv.id, origem: qv.recurso.chave }, justificativa: 'Caso criado pelo Prumo a partir do ticket (proposta publicada)' }, b, true); } catch (erro) { if ((erro as Error).message !== 'TRACE_DUPLICATE') throw erro; /* vínculo já existente */ } }
    }
    return reg;
  }
  if (o.destino === 'github') {
    // Issue no GitHub: rastreador do repositório. Não é GitHub Actions: criar a issue não dispara pipeline.
    const reg = await executarOperacao(ex, p.espacoId, 'github.criar_issue', parametrosDaIssueGithub(p), { base: b, confirmado: o.confirmado });
    if (reg.estado === 'CONFIRMADA' && reg.remoto?.chave) marcarPublicada(id, { id: reg.remoto.id, chave: reg.remoto.chave, url: reg.remoto.url }, b);
    return reg;
  }
  if (o.destino === 'qase') {
    const reg = await executarOperacao(ex, p.espacoId, 'qase.criar_defeito', parametrosDoDefeitoQase(p, o), { base: b, confirmado: o.confirmado });
    if (reg.estado === 'CONFIRMADA' && reg.remoto?.id) {
      marcarPublicada(id, { id: reg.remoto.id, chave: reg.remoto.chave }, b);
      const vq = e.vinculos.find(v => v.servico === 'qase');
      if (p.falhaDeOrigem && vq) { try {
        associarEspaco(p.espacoId, { de: { tipo: 'qase-defeito', id: reg.remoto.id, vinculoId: vq.id, origem: vq.recurso.chave },
          para: { tipo: 'qase', id: String(p.falhaDeOrigem.casoId), vinculoId: vq.id, origem: vq.recurso.chave },
          justificativa: 'Defeito Qase publicado a partir de uma falha de run no Prumo' }, b, true);
      } catch (erro) { if ((erro as Error).message !== 'TRACE_DUPLICATE') throw erro; } }
    }
    return reg;
  }
  const tipoId = o.tipoId ?? (typeof p.dados.tipoId === 'string' ? p.dados.tipoId : undefined); if (!tipoId) throw new Error('ISSUE_TYPE_REQUIRED: escolha o tipo do ticket (ex.: Bug) antes de publicar.');
  const reg = await executarOperacao(ex, p.espacoId, 'jira.criar_ticket', { tipoId, resumo: p.dados.resumo, descricao: p.dados.descricao ?? '', rotulos: p.dados.rotulos ?? [], ...(p.dados.origem ? { origem: p.dados.origem } : {}) }, { base: b, confirmado: o.confirmado });
  if (reg.estado === 'CONFIRMADA' && reg.remoto?.chave) {
    marcarPublicada(id, { id: reg.remoto.id, chave: reg.remoto.chave, url: reg.remoto.url }, b);
    const jv = e.vinculos.find(v => v.servico === 'jira'); const qv = e.vinculos.find(v => v.servico === 'qase');
    if (p.falhaDeOrigem && jv && qv) { try { associarEspaco(p.espacoId, { de: { tipo: 'jira-bug', id: reg.remoto.chave, vinculoId: jv.id, origem: jv.recurso.instancia }, para: { tipo: 'qase', id: String(p.falhaDeOrigem.casoId), vinculoId: qv.id, origem: qv.recurso.chave }, justificativa: 'Bug aberto pelo Prumo a partir da falha na run' }, b, true); } catch (erro) { if ((erro as Error).message !== 'TRACE_DUPLICATE') throw erro; /* vínculo já existente */ } }
  }
  return reg;
}

/** Anexos: a página só indica "evidência de uma execução" ou "escolher arquivo"; o caminho vem do projeto ou do diálogo nativo, nunca da página. */
export function resolverAnexo(espacoId: string, anexo: { tipo: 'evidencia'; jobId: string } | { tipo: 'arquivo' }, caminhoEscolhido: string | null, b?: string): { arquivo: string; aux: Auxiliar } {
  const e = obterEspaco(espacoId, b); const raizes = e.pastaLocal ? [path.join(e.pastaLocal, '.prumo', 'evidencias'), path.join(e.pastaLocal, '.prumo', 'resultados'), path.join(e.pastaLocal, '.prumo', 'artefatos')] : [];
  if (anexo.tipo === 'evidencia') { if (!e.pastaLocal) throw new Error('PROJECT_FOLDER_REQUIRED: o projeto não tem pasta de automação para localizar a evidência.'); return { arquivo: path.join(raizes[0]!, `${anexo.jobId}.json`), aux: { arquivosAutorizados: [], raizesDeEvidencia: raizes } }; }
  if (!caminhoEscolhido) throw new Error('ATTACHMENT_NOT_CHOSEN: nenhum arquivo foi escolhido.'); return { arquivo: caminhoEscolhido, aux: { arquivosAutorizados: [caminhoEscolhido], raizesDeEvidencia: raizes } };
}

export const validarDadosDaProposta = (tipo: 'caso' | 'bug', dados: unknown) => tipo === 'caso' ? esquemaCaso.parse(dados) : dadosBug.parse(dados);

/**
 * Vínculo local (a pessoa informou a chave): o Prumo não consulta nem escreve no Jira. A relação ticket ↔ caso só é registrada quando a proposta nasceu
 * de uma falha e o projeto tem Jira e Qase vinculados; sem eles o vínculo fica apenas na proposta.
 */
export function vincularPropostaATicket(id: string, chave: string, b?: string) {
  const ticket = chave.trim().toUpperCase(); if (!/^[A-Z][A-Z0-9_]*-\d+$/.test(ticket)) throw new Error('TICKET_KEY_INVALID: informe a chave do ticket, por exemplo SMART-123.');
  const p = obterProposta(id, b); if (p.tipo !== 'bug') throw new Error('PROPOSAL_NOT_BUG: só propostas de bug se vinculam a um ticket.');
  const e = obterEspaco(p.espacoId, b); const jv = e.vinculos.find(v => v.servico === 'jira'); const qv = e.vinculos.find(v => v.servico === 'qase');
  const salva = alterarProposta(id, x => { if (x.estado === 'PUBLICADA' || x.estado === 'VINCULADA' || x.estado === 'DESCARTADA') throw new Error('PROPOSAL_CLOSED'); x.estado = 'VINCULADA'; x.remoto = { chave: ticket }; }, b);
  if (p.falhaDeOrigem && jv && qv) { try { associarEspaco(p.espacoId, { de: { tipo: 'jira-bug', id: ticket, vinculoId: jv.id, origem: jv.recurso.instancia }, para: { tipo: 'qase', id: String(p.falhaDeOrigem.casoId), vinculoId: qv.id, origem: qv.recurso.chave }, justificativa: 'Falha da run vinculada a ticket existente pela pessoa' }, b, true); } catch { /* relação já existente */ } }
  return salva;
}
