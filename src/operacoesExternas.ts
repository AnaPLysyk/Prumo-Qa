import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { lerLocal, gravarLocal } from './armazenamentoLocal.js';
import { ErroServico } from './httpServicos.js';
import { operacoesJira } from './escritaJira.js';
import { operacoesQase } from './escritaQase.js';
import { operacoesGithub } from './escritaGithub.js';
import { consumirPoliticaEscrita, OPERACOES_AGENDAVEIS } from './autorizacoes.js';
import { obterEspaco, registrarEscrita, servicoSchema, type Servico } from './espacos.js';
import { mascarar } from './projeto.js';
import type { ContextoServico } from './adaptadoresServicos.js';
import type { DefOperacao, Remoto, Auxiliar } from './operacoesTipos.js';
import type { Recurso } from './espacos.js';

/**
 * Camada única das escritas externas (2.9). Nenhuma escrita acontece fora dela:
 *  1. a operação precisa existir no catálogo fechado e seus parâmetros passam por esquema estrito;
 *  2. a ESCRITA precisa estar habilitada para (projeto, serviço): conectar para leitura nunca dá permissão de escrita;
 *  3. manual exige confirmação humana (feita pelo processo principal, nunca pela página); agendada só com política vigente;
 *  4. a chave de idempotência é derivada dos parâmetros: repetir a mesma operação nunca duplica; após resposta perdida
 *     o serviço é consultado (reconciliação) antes de reenviar; o efeito é relido para confirmar;
 *  5. tudo fica no livro-razão local (operacoes-externas.json), sem corpo remoto nem segredo.
 */
export const catalogoOperacoes: DefOperacao<unknown>[] = [...operacoesJira, ...operacoesQase, ...operacoesGithub];
export const operacaoPorId = (id: string) => catalogoOperacoes.find(o => o.id === id);
export const idsDeOperacao = catalogoOperacoes.map(o => o.id) as [string, ...string[]];

// ---- Habilitação de escrita por projeto e serviço ----
const permSchema = z.object({ version: z.literal(1), itens: z.array(z.object({ espacoId: z.string().uuid(), servico: servicoSchema, em: z.string().datetime(), por: z.string().max(200) }).strict()).max(600) }).strict();
type Perm = z.infer<typeof permSchema>;
const lerPerm = (b?: string) => lerLocal<Perm>('permissoes-servicos.json', permSchema, { version: 1, itens: [] }, b);
export const escritaHabilitada = (espacoId: string, servico: Servico, b?: string) => lerPerm(b).itens.some(i => i.espacoId === espacoId && i.servico === servico);
export function habilitarEscrita(espacoId: string, servico: Servico, habilitada: boolean, por: string, b?: string, agora = new Date()) {
  obterEspaco(espacoId, b); const r = lerPerm(b); r.itens = r.itens.filter(i => !(i.espacoId === espacoId && i.servico === servico));
  if (habilitada) r.itens.push({ espacoId, servico, em: agora.toISOString(), por }); gravarLocal('permissoes-servicos.json', permSchema.parse(r), b); return { espacoId, servico, habilitada };
}
export const permissoesDoEspaco = (espacoId: string, b?: string) => (['jira', 'qase', 'github'] as const).map(s => ({ servico: s, escrita: escritaHabilitada(espacoId, s, b) }));

// ---- Livro-razão ----
const estados = ['PREPARADA', 'ENVIADA', 'CONFIRMADA', 'FALHA', 'BLOQUEADA'] as const;
const remotoSchema = z.object({ id: z.string().max(200).optional(), chave: z.string().max(200).optional(), url: z.string().max(500).optional(), detalhes: z.record(z.union([z.string().max(300), z.number(), z.boolean(), z.null()]).optional()).optional() }).strict();
const itemSchema = z.object({
  id: z.string().uuid(), chave: z.string().length(64), espacoId: z.string().uuid(), servico: servicoSchema, operacao: z.string().max(60), resumo: z.string().max(400), estado: z.enum(estados),
  origem: z.enum(['MANUAL', 'AGENDADO']), tentativas: z.number().int(), vinculoId: z.string().uuid().optional(), conexaoId: z.string().uuid().optional(), remoto: remotoSchema.nullable(),
  erro: z.string().max(120).optional(), aviso: z.string().max(120).optional(), criadoEm: z.string().datetime(), atualizadoEm: z.string().datetime()
}).strict();
export type RegistroOperacao = z.infer<typeof itemSchema>;
const razaoSchema = z.object({ version: z.literal(1), itens: z.array(itemSchema).max(1500) }).strict();
type Razao = z.infer<typeof razaoSchema>;
const lerRazao = (b?: string) => lerLocal<Razao>('operacoes-externas.json', razaoSchema, { version: 1, itens: [] }, b);
const gravarRazao = (r: Razao, b?: string) => { if (r.itens.length > 1500) r.itens = r.itens.slice(-1500); gravarLocal('operacoes-externas.json', razaoSchema.parse(r), b); };
export const listarOperacoes = (espacoId?: string, limite = 100, b?: string) => lerRazao(b).itens.filter(i => !espacoId || i.espacoId === espacoId).slice(-limite).reverse();

function canonico(v: unknown): string { if (Array.isArray(v)) return '[' + v.map(canonico).join(',') + ']'; if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonico((v as Record<string, unknown>)[k])).join(',') + '}'; return JSON.stringify(v); }
export const chaveDe = (espacoId: string, operacao: string, parametros: unknown) => createHash('sha256').update(`${espacoId}|${operacao}|${canonico(parametros)}`).digest('hex');
const limparRemoto = (r: Remoto): Remoto => ({ ...(r.id ? { id: r.id } : {}), ...(r.chave ? { chave: r.chave } : {}), ...(r.url ? { url: r.url } : {}), ...(r.detalhes ? { detalhes: Object.fromEntries(Object.entries(r.detalhes).filter(([, v]) => v !== undefined)) as Record<string, string | number | boolean | null> } : {}) });

export type Executor = { comContexto<T>(espacoId: string, servico: Servico, fn: (ctx: ContextoServico, rec: Recurso, info: { vinculoId: string; conexaoId: string }) => Promise<T>): Promise<T> };
export type OpcoesOperacao = { origem?: 'MANUAL' | 'AGENDADO'; confirmado?: boolean; aux?: Auxiliar; base?: string; agora?: () => Date; runPolitica?: number };
const semAux: Auxiliar = { arquivosAutorizados: [], raizesDeEvidencia: [] };
const codigoDe = (e: unknown) => e instanceof ErroServico ? e.codigo : (/^([A-Z][A-Z_]{2,60})\b/.exec((e as Error)?.message ?? '')?.[1] ?? 'OPERATION_FAILED');
const retentavel = (c: string) => ['SERVICE_TIMEOUT', 'SERVICE_UNAVAILABLE', 'SERVICE_RATE_LIMIT', 'SERVICE_RESPONSE_INVALID'].includes(c);

/** Prévia: valida, calcula a chave e devolve o texto que a pessoa vai confirmar. Não grava nem envia nada. */
export function prepararOperacao(espacoId: string, operacaoId: string, bruto: unknown, b?: string) {
  const op = operacaoPorId(operacaoId); if (!op) throw new Error('OPERATION_UNKNOWN: operação desconhecida.'); obterEspaco(espacoId, b);
  const p = op.schema.parse(bruto);
  return { operacao: op.id, servico: op.servico, rotulo: op.rotulo, efeito: op.efeito, resumo: mascarar(op.resumo(p)).slice(0, 400), chave: chaveDe(espacoId, op.id, p), escritaHabilitada: escritaHabilitada(espacoId, op.servico, b), parametros: p };
}

export async function executarOperacao(ex: Executor, espacoId: string, operacaoId: string, bruto: unknown, o: OpcoesOperacao = {}): Promise<RegistroOperacao & { reutilizada: boolean }> {
  const b = o.base; const agora = o.agora ?? (() => new Date()); const origem = o.origem ?? 'MANUAL';
  const op = operacaoPorId(operacaoId); if (!op) throw new Error('OPERATION_UNKNOWN: operação desconhecida.');
  obterEspaco(espacoId, b); const p = op.schema.parse(bruto); const chave = chaveDe(espacoId, op.id, p); const resumo = mascarar(op.resumo(p)).slice(0, 400);
  if (!escritaHabilitada(espacoId, op.servico, b)) throw new Error(`WRITE_NOT_ENABLED: a escrita no ${op.servico} não está habilitada neste projeto. Ative em Conexões depois de revisar o que ela permite.`);
  if (origem === 'MANUAL' && !o.confirmado) throw new Error('HUMAN_CONFIRMATION_REQUIRED: operação externa exige confirmação da pessoa.');
  if (origem === 'AGENDADO') {
    if (!(OPERACOES_AGENDAVEIS as readonly string[]).includes(op.id) || o.runPolitica === undefined || !consumirPoliticaEscrita(espacoId, op.id, o.runPolitica, b, agora())) {
      const reg = gravarItem(b, agora, { chave, espacoId, servico: op.servico, operacao: op.id, resumo, origem, estado: 'BLOQUEADA', erro: 'WRITE_POLICY_MISSING' }); return { ...reg, reutilizada: false };
    }
  }
  const anterior = lerRazao(b).itens.find(i => i.chave === chave);
  if (anterior?.estado === 'CONFIRMADA') return { ...anterior, reutilizada: true };
  if (anterior && anterior.tentativas >= 5) throw new Error('OPERATION_RETRY_LIMIT: limite de tentativas desta operação atingido.');
  let reg = gravarItem(b, agora, { chave, espacoId, servico: op.servico, operacao: op.id, resumo, origem, estado: 'ENVIADA', tentativas: (anterior?.tentativas ?? 0) + 1, id: anterior?.id });
  try {
    const { remoto, info } = await ex.comContexto(espacoId, op.servico, async (ctx, rec, info) => {
      let r: Remoto | null = null; let reconciliado = false;
      // Houve tentativa anterior sem confirmação: o serviço pode já ter criado o recurso (resposta perdida). Procura antes de enviar.
      if (anterior && op.reconciliar) { r = await op.reconciliar(ctx, rec, p, chave); reconciliado = r !== null; }
      r ??= await op.executar(ctx, rec, p, chave, o.aux ?? semAux);
      let confirmada = true; if (op.confirmar) { try { confirmada = await op.confirmar(ctx, rec, p, r, chave); } catch { confirmada = false; } }
      return { remoto: { ...r, detalhes: { ...(r.detalhes ?? {}), ...(reconciliado ? { reconciliado: true } : {}) } }, info: { ...info, confirmada } };
    });
    reg = gravarItem(b, agora, { ...reg, vinculoId: info.vinculoId, conexaoId: info.conexaoId, remoto: limparRemoto(remoto), estado: info.confirmada ? 'CONFIRMADA' : 'ENVIADA', ...(info.confirmada ? {} : { aviso: 'NOT_CONFIRMED' }) });
  } catch (e) {
    const c = codigoDe(e); reg = gravarItem(b, agora, { ...reg, estado: 'FALHA', erro: c.slice(0, 120) });
    if (!retentavel(c) && !(e instanceof ErroServico)) throw e; // erros de regra (duplicado, parâmetro) voltam como exceção para a interface
  }
  try { registrarEscrita(espacoId, op.servico, `${op.id.replace('.', '_').toUpperCase()}_${reg.estado}`, b); } catch { /* o histórico do projeto não bloqueia o resultado */ }
  return { ...reg, reutilizada: false };
}

type Entrada = Partial<RegistroOperacao> & { chave: string; espacoId: string; servico: Servico; operacao: string; resumo: string; origem: 'MANUAL' | 'AGENDADO'; estado: (typeof estados)[number] };
function gravarItem(b: string | undefined, agora: () => Date, e: Entrada): RegistroOperacao {
  const r = lerRazao(b); const t = agora().toISOString(); const i = r.itens.findIndex(x => x.chave === e.chave);
  const base: RegistroOperacao = i >= 0 ? r.itens[i]! : { id: e.id ?? randomUUID(), chave: e.chave, espacoId: e.espacoId, servico: e.servico, operacao: e.operacao, resumo: e.resumo, estado: e.estado, origem: e.origem, tentativas: 0, remoto: null, criadoEm: t, atualizadoEm: t };
  const novo = itemSchema.parse({ ...base, ...e, id: base.id, remoto: e.remoto === undefined ? base.remoto : e.remoto, tentativas: e.tentativas ?? base.tentativas, criadoEm: base.criadoEm, atualizadoEm: t, erro: e.estado === 'CONFIRMADA' ? undefined : e.erro ?? base.erro });
  if (i >= 0) r.itens[i] = novo; else r.itens.push(novo); gravarRazao(r, b); return novo;
}
