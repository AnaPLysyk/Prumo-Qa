/** Ciclo de execução e preparação de operação — arquivos relacionados agrupados para manutenção. */
import { consumirPoliticaEscrita } from "../../agendamentos/autorizacoes/autorizarRotina.js";
import { OPERACOES_AGENDAVEIS } from "../../agendamentos/tipos/autorizacoes.js";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";
import { gravarRegistroDaOperacao, lerRegistroDeOperacoes } from "../banco/operacoes.js";
import { chaveDaOperacao } from "./chaveDaOperacao.js";
import { escritaHabilitada } from "./permissoes.js";
import { operacaoPorId } from "./catalogoOperacoes.js";
import { ErroServico } from "../integracoes/configuracaoDosServicos.js";
import { Remoto } from "../tipos/operacao.js";
import { Executor, OpcoesOperacao, RegistroOperacao, semAux, emCurso } from "../tipos/operacoesExternas.js";
import { obterEspaco } from "../../projetos/banco/projetos.js";
import { registrarEscritaExterna } from "../../projetos/servicoProjetos.js";

// ── executarOperacaoUmaVez ──
const codigoDaFalhaDeOperacao = (e: unknown) => e instanceof ErroServico ? (e.detalhe ? `${e.codigo}: ${e.detalhe}` : e.codigo) : (/^([A-Z][A-Z_]{2,60})\b/.exec((e as Error)?.message ?? '')?.[1] ?? 'OPERATION_FAILED');

const limparRespostaRemota = (r: Remoto): Remoto => ({ ...(r.id ? { id: r.id } : {}), ...(r.chave ? { chave: r.chave } : {}), ...(r.url ? { url: r.url } : {}), ...(r.detalhes ? { detalhes: Object.fromEntries(Object.entries(r.detalhes).filter(([, v]) => v !== undefined)) as Record<string, string | number | boolean | null> } : {}) });

/** Diz se vale tentar a operação de novo (tempo, indisponível, limite, resposta inválida). */

const operacaoPodeRepetir = (c: string) => ['SERVICE_TIMEOUT', 'SERVICE_UNAVAILABLE', 'SERVICE_RATE_LIMIT', 'SERVICE_RESPONSE_INVALID'].includes(c);

export async function executarOperacaoUmaVez(ex: Executor, espacoId: string, operacaoId: string, bruto: unknown, o: OpcoesOperacao): Promise<RegistroOperacao & { reutilizada: boolean }> {
  const b = o.base; const agora = o.agora ?? (() => new Date()); const origem = o.origem ?? 'MANUAL';
  const op = operacaoPorId(operacaoId); if (!op) throw new Error('OPERATION_UNKNOWN: operação desconhecida.');
  obterEspaco(espacoId, b); const p = op.schema.parse(bruto); const chave = chaveDaOperacao(espacoId, op.id, p); const resumo = mascarar(op.resumo(p)).slice(0, 400);
  if (!escritaHabilitada(espacoId, op.servico, b)) throw new Error(`WRITE_NOT_ENABLED: a escrita no ${op.servico} não está habilitada neste projeto. Ative em Conexões depois de revisar o que ela permite.`);
  if (origem === 'MANUAL' && !o.confirmado) throw new Error('HUMAN_CONFIRMATION_REQUIRED: operação externa exige confirmação da pessoa.');
  if (origem === 'AGENDADO') {
    if (!(OPERACOES_AGENDAVEIS as readonly string[]).includes(op.id) || o.runPolitica === undefined || !consumirPoliticaEscrita(espacoId, op.id, o.runPolitica, b, agora())) {
      const reg = gravarRegistroDaOperacao(b, agora, { chave, espacoId, servico: op.servico, operacao: op.id, resumo, origem, estado: 'BLOQUEADA', erro: 'WRITE_POLICY_MISSING' }); return { ...reg, reutilizada: false };
    }
  }
  const anterior = lerRegistroDeOperacoes(b).itens.find(i => i.chave === chave);
  // Revalidar também ao reutilizar: o mesmo projeto pode ter sido ligado a outra conta/recurso.
  // Livros antigos sem escopo são ambíguos: preservar o registro e nunca reenviar automaticamente.
  const escopo = await ex.comContexto(espacoId, op.servico, async (_ctx, _rec, info) => info);
  if (anterior && anterior.tentativas > 0 && (anterior.vinculoId !== escopo.vinculoId || anterior.conexaoId !== escopo.conexaoId))
    throw new Error('OPERATION_SCOPE_CHANGED: operação anterior pertence a outro vínculo ou seu escopo não está registrado.');
  if (anterior?.estado === 'CONFIRMADA') return { ...anterior, reutilizada: true };
  if (anterior && anterior.tentativas >= 5) throw new Error('OPERATION_RETRY_LIMIT: limite de tentativas desta operação atingido.');
  let reg = gravarRegistroDaOperacao(b, agora, { chave, espacoId, servico: op.servico, operacao: op.id, resumo, origem, estado: 'ENVIADA', tentativas: (anterior?.tentativas ?? 0) + 1, id: anterior?.id, ...escopo });
  try {
    const { remoto, info } = await ex.comContexto(espacoId, op.servico, async (ctx, rec, info) => {
      if (info.vinculoId !== escopo.vinculoId || info.conexaoId !== escopo.conexaoId) throw new Error('OPERATION_SCOPE_CHANGED: vínculo alterado durante a operação.');
      let r: Remoto | null = null; let reconciliado = false;
      // Houve tentativa anterior sem confirmação: o serviço pode já ter criado o recurso (resposta perdida). Procura antes de enviar.
      if (anterior && op.reconciliar) { r = await op.reconciliar(ctx, rec, p, chave, anterior.remoto ?? undefined); reconciliado = r !== null; }
      r ??= await op.executar(ctx, rec, p, chave, o.aux ?? semAux);
      let confirmada = true; if (op.confirmar) { try { confirmada = await op.confirmar(ctx, rec, p, r, chave); } catch { confirmada = false; } }
      return { remoto: { ...r, detalhes: { ...(r.detalhes ?? {}), ...(reconciliado ? { reconciliado: true } : {}) } }, info: { ...info, confirmada } };
    });
    reg = gravarRegistroDaOperacao(b, agora, { ...reg, vinculoId: info.vinculoId, conexaoId: info.conexaoId, remoto: limparRespostaRemota(remoto), estado: info.confirmada ? 'CONFIRMADA' : 'ENVIADA', ...(info.confirmada ? {} : { aviso: 'NOT_CONFIRMED' }) });
  } catch (e) {
    const c = codigoDaFalhaDeOperacao(e); reg = gravarRegistroDaOperacao(b, agora, { ...reg, estado: 'FALHA', erro: c.slice(0, 120) });
    if (!operacaoPodeRepetir(c) && !(e instanceof ErroServico)) throw e; // erros de regra (duplicado, parâmetro) voltam como exceção para a interface
  }
  try { registrarEscritaExterna(espacoId, op.servico, `${op.id.replace('.', '_').toUpperCase()}_${reg.estado}`, b); } catch { /* o histórico do projeto não bloqueia o resultado */ }
  return { ...reg, reutilizada: false };
}

// ── executarOperacao ──
export async function executarOperacao(ex: Executor, espacoId: string, operacaoId: string, bruto: unknown, o: OpcoesOperacao = {}): Promise<RegistroOperacao & { reutilizada: boolean }> {
  const op = operacaoPorId(operacaoId); if (!op) throw new Error('OPERATION_UNKNOWN: operação desconhecida.');
  const fila = `${o.base ?? ''}|${chaveDaOperacao(espacoId, op.id, op.schema.parse(bruto))}`;
  const atual = (emCurso.get(fila) ?? Promise.resolve()).catch(() => undefined).then(() => executarOperacaoUmaVez(ex, espacoId, operacaoId, bruto, o));
  emCurso.set(fila, atual);
  try { return await atual; } finally { if (emCurso.get(fila) === atual) emCurso.delete(fila); }
}

// ── prepararOperacao ──
/** Prévia: valida, calcula a chave e devolve o texto que a pessoa vai confirmar. Não grava nem envia nada. */
export function prepararOperacao(espacoId: string, operacaoId: string, bruto: unknown, b?: string) {
  const op = operacaoPorId(operacaoId); if (!op) throw new Error('OPERATION_UNKNOWN: operação desconhecida.'); obterEspaco(espacoId, b);
  const p = op.schema.parse(bruto);
  return { operacao: op.id, servico: op.servico, rotulo: op.rotulo, efeito: op.efeito, resumo: mascarar(op.resumo(p)).slice(0, 400), chave: chaveDaOperacao(espacoId, op.id, p), escritaHabilitada: escritaHabilitada(espacoId, op.servico, b), parametros: p };
}
