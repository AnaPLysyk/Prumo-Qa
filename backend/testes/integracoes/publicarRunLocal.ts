/** publicarRunLocal: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import path from "node:path";
import { executarOperacao } from "../../conexoes/escrita/executarOperacao.js";
import { Auxiliar } from "../../conexoes/tipos/operacao.js";
import { RegistroOperacao } from "../../conexoes/tipos/operacoesExternas.js";
import { obterEspaco } from "../../projetos/banco/projetos.js";
import { alterarRunLocal, obterRunLocal } from "../banco/runs.js";
import { Dep, paraQase, CASO_LOCAL_MIN, RunLocal } from "../tipos/runLocal.js";
import { createHash } from "node:crypto";
import { consumirPublicacao } from "../../agendamentos/autorizacoes/autorizarRotina.js";
import { definirEstadoJiraDoTrabalho, obterTrabalho } from "../../agendamentos/banco/fila.js";
import { gravarPublicacoesJira, lerPublicacoesJira } from "../banco/publicacoes.js";
import { codigoDoErroDePublicacao, publicacaoPodeRepetir } from "../servicoExecucoes.js";
import { montarComentario } from "../regras/propostasDeBugs.js";
import { Pub, PublicadorJira, registroPub } from "../tipos/escritaQase.js";

// --- publicarRunLocal ---
// ── publicarRunLocal ──
/** Publica os resultados ainda não publicados (nunca NOT_RUN) e relê a run no Qase. */
export async function publicarRunLocal(d: Dep, runLocalId: string, o: { confirmado: boolean; origem?: 'MANUAL' | 'AGENDADO'; anexarEvidencia?: boolean; aux?: Auxiliar }) {
  const run = obterRunLocal(runLocalId, d.base); if (!run.runIdRemoto) throw new Error('RUN_NOT_CREATED: crie a run no Qase antes de publicar.');
  const pendentes = run.casos.filter(c => c.resultado && c.resultado.status !== 'NOT_RUN' && !c.publicado); if (!pendentes.length) return { operacao: null as RegistroOperacao | null, publicados: 0 };
  const e = obterEspaco(run.espacoId, d.base); const raiz = e.pastaLocal ? path.join(e.pastaLocal, '.prumo', 'evidencias') : null; const aux: Auxiliar = o.aux ?? { arquivosAutorizados: [], raizesDeEvidencia: raiz ? [raiz] : [] };
  const resultados: { casoId: number; status: 'passed' | 'failed' | 'blocked'; comentario: string; anexos?: string[] }[] = [];
  for (const c of pendentes.slice(0, 200)) {
    const r = c.resultado!; const item: (typeof resultados)[number] = { casoId: c.casoId, status: paraQase[r.status as 'PASS' | 'FAIL' | 'BLOCKED'], comentario: `Prumo QA (${r.origem === 'MANUAL' ? 'declarado por ' + (r.por ?? 'pessoa') : 'execução'}${r.granularidade === 'RODADA' ? ', escopo da rodada' : ''}): ${r.comentario}`.slice(0, 1900) };
    if (o.anexarEvidencia && r.evidenciaId && r.status !== 'PASS' && raiz) {
      const anexo = await executarOperacao(d.executor, run.espacoId, 'qase.anexar', { arquivo: path.join(raiz, `${r.evidenciaId}.json`) }, { base: d.base, confirmado: o.confirmado, origem: 'MANUAL', aux, agora: d.agora });
      if (anexo.estado === 'CONFIRMADA' && anexo.remoto?.id) item.anexos = [anexo.remoto.id];
    }
    resultados.push(item);
  }
  const reg = await executarOperacao(d.executor, run.espacoId, 'qase.publicar_resultados', { runId: run.runIdRemoto, resultados }, { base: d.base, confirmado: o.confirmado, origem: o.origem ?? 'MANUAL', runPolitica: run.runIdRemoto, aux, agora: d.agora });
  if (reg.estado === 'CONFIRMADA' || (reg.estado === 'ENVIADA' && reg.aviso === 'NOT_CONFIRMED')) {
    const enviados = new Set(resultados.map(r => r.casoId));
    alterarRunLocal(runLocalId, r => { for (const c of r.casos) if (enviados.has(c.casoId)) c.publicado = true; const completos = r.casos.every(c => c.resultado && c.resultado.status !== 'NOT_RUN'); const tudoPublicado = r.casos.every(c => !c.resultado || c.resultado.status === 'NOT_RUN' || c.publicado); r.estado = completos && tudoPublicado ? 'PUBLICADA' : 'PARCIAL'; r.confirmadaNoQase = reg.estado === 'CONFIRMADA'; r.publicacoes.push({ em: (d.agora ?? (() => new Date()))().toISOString(), estado: reg.estado, enviados: enviados.size, operacaoId: reg.id }); r.publicacoes = r.publicacoes.slice(-200); }, d.base);
    return { operacao: reg, publicados: enviados.size };
  }
  return { operacao: reg, publicados: 0 };
}

// ── criarRunNoQase ──
const numeroDoId = (v?: string) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };

/** Parâmetros da operação qase.criar_run a partir da run local: os mesmos na prévia confirmada e no envio. */
export const parametrosDaRunQase = (run: RunLocal) => ({ titulo: run.titulo, casos: run.casos.map(c => c.casoId), ...(run.planoId ? { planoId: run.planoId } : {}), ...(run.marcoId ? { marcoId: run.marcoId } : {}), ...(run.ambienteQaseId ? { ambienteId: run.ambienteQaseId } : {}) });

/** Cria a run no Qase (operação externa com confirmação). Criar não executa nada nem registra resultado. */
export async function criarRunNoQase(d: Dep, runLocalId: string, o: { confirmado: boolean }): Promise<RegistroOperacao & { reutilizada: boolean }> {
  const run = obterRunLocal(runLocalId, d.base); if (run.runIdRemoto) throw new Error('RUN_ALREADY_CREATED');
  if (run.casos.some(c => c.casoId >= CASO_LOCAL_MIN)) throw new Error('RUN_HAS_LOCAL_CASES: esta run tem casos que só existem neste computador; o Qase não os conhece. Crie os casos no Qase e prepare outra run.');
  const reg = await executarOperacao(d.executor, run.espacoId, 'qase.criar_run', parametrosDaRunQase(run), { base: d.base, confirmado: o.confirmado, agora: d.agora });
  const id = reg.estado === 'CONFIRMADA' || reg.estado === 'ENVIADA' ? numeroDoId(reg.remoto?.id) : null; if (id) alterarRunLocal(runLocalId, r => { r.runIdRemoto = id; r.estado = 'CRIADA'; r.confirmadaNoQase = reg.estado === 'CONFIRMADA'; }, d.base);
  return reg;
}

// --- publicarComentarioDeResultado ---
/**
 * Publica (ou confirma que já está publicado) o comentário da execução. `modo` MANUAL exige `confirmado` (a confirmação nativa
 * acontece no processo principal, nunca na página). AGENDADO exige política vigente que cubra ticket e tipo.
 */
export async function publicarComentarioDeResultado(trabalhoId: string, modo: 'MANUAL' | 'AGENDADO', pub: PublicadorJira, b?: string, confirmado = false, agora = new Date()): Promise<Pub> {
  const t = obterTrabalho(trabalhoId, b); const nome = obterEspaco(t.espacoId, b).nome;
  if (modo === 'MANUAL' && !confirmado) throw new Error('HUMAN_CONFIRMATION_REQUIRED');
  const c = montarComentario(t, nome); const ticket = t.ticket!; const chave = `${t.id}:${ticket}`;
  const sha = createHash('sha256').update(c.texto).digest('hex');
  let r = lerPublicacoesJira(b); let reg = r.itens.find(x => x.chave === chave);
  if (reg?.estado === 'PUBLICADO') return reg; // idempotência: nunca publica duas vezes a mesma execução no mesmo ticket
  if (!reg) { reg = { chave, trabalhoId: t.id, espacoId: t.espacoId, ticket, modo, estado: 'PREPARADO', tentativas: 0, textoSha256: sha, texto: c.texto, consumida: false, criadoEm: agora.toISOString() }; r.itens.push(reg); }
  const salvar = (patch: Partial<Pub>) => { r = lerPublicacoesJira(b); const i = r.itens.findIndex(x => x.chave === chave); const novo = registroPub.parse({ ...(i >= 0 ? r.itens[i] : reg), ...patch }); if (i >= 0) r.itens[i] = novo; else r.itens.push(novo); gravarPublicacoesJira(r, b); reg = novo; return novo; };
  salvar({});
  if (modo === 'AGENDADO' && !reg!.consumida) {
    const p = consumirPublicacao(t.espacoId, ticket, t.tipo, b, agora);
    if (!p) { salvar({ estado: 'BLOQUEADO', erro: 'PUBLISH_POLICY_MISSING', ultimaTentativa: agora.toISOString() }); definirEstadoJiraDoTrabalho(t.id, { estado: 'BLOQUEADO', codigo: 'PUBLISH_POLICY_MISSING' }, b); return reg!; }
    salvar({ consumida: true, politicaId: p.id });
  }
  salvar({ tentativas: reg!.tentativas + 1, ultimaTentativa: agora.toISOString(), modo });
  try {
    // Falha de rede ambígua na tentativa anterior: o comentário pode já existir. Procura o marcador antes de enviar.
    const existente = reg!.tentativas > 1 || reg!.estado === 'FALHA' ? await pub.procurarComentarioJira(t.espacoId, ticket, c.marcador) : null;
    if (existente) { salvar({ estado: 'PUBLICADO', comentarioId: existente, publicadoEm: agora.toISOString(), erro: undefined }); definirEstadoJiraDoTrabalho(t.id, { estado: 'PUBLICADO', comentarioId: existente }, b); return reg!; }
    const enviado = await pub.comentarJira(t.espacoId, ticket, c.adf);
    salvar({ estado: 'PUBLICADO', comentarioId: enviado.id, vinculoId: enviado.vinculoId, conexaoId: enviado.conexaoId, publicadoEm: new Date().toISOString(), erro: undefined });
    definirEstadoJiraDoTrabalho(t.id, { estado: 'PUBLICADO', comentarioId: enviado.id }, b); return reg!;
  } catch (e) {
    const cod = codigoDoErroDePublicacao(e); salvar({ estado: 'FALHA', erro: cod.slice(0, 80) }); definirEstadoJiraDoTrabalho(t.id, { estado: publicacaoPodeRepetir(cod) ? 'PENDENTE' : 'FALHA', codigo: cod.slice(0, 80) }, b); return reg!;
  }
}
