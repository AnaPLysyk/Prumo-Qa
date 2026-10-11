import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { lerLocal, gravarLocal } from './armazenamentoLocal.js';
import { obterEspaco } from './espacos.js';
import { esquemaCaso } from './escritaQase.js';
import { mascarar } from './projeto.js';

/**
 * Propostas de casos de teste e de bugs (2.9): rascunhos locais revisáveis, criados pela pessoa, pelo Prumo (a partir de uma falha) ou por uma
 * IA conectada. Uma proposta NUNCA é publicada sozinha: publicar exige a revisão da pessoa (duplicidade, requisito, risco e cobertura, no caso
 * de IA) e a confirmação da operação externa. A IA só chega aqui pela ferramenta MCP propor_caso, limitada por política e por quantidade.
 */
export const MAX_PROPOSTAS = 300; export const MAX_IA_POR_HORA = 20;
const dadosBug = z.object({ resumo: z.string().trim().min(3).max(255), descricao: z.string().max(8000).default(''), origem: z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/).optional(), rotulos: z.array(z.string().regex(/^[A-Za-z0-9_.-]{1,50}$/)).max(10).default([]), tipoId: z.string().regex(/^\d{1,12}$/).optional() }).strict();
export const esquemaDadosBug = dadosBug;
const revisaoSchema = z.object({ duplicidade: z.boolean(), requisito: z.boolean(), risco: z.boolean(), cobertura: z.boolean(), por: z.string().max(200), em: z.string().datetime() }).strict();
const propostaSchema = z.object({
  id: z.string().uuid(), espacoId: z.string().uuid(), tipo: z.enum(['caso', 'bug']), origem: z.enum(['PESSOA', 'PRUMO', 'IA']), cliente: z.string().max(60).optional(),
  estado: z.enum(['RASCUNHO', 'REVISADA', 'PUBLICADA', 'DESCARTADA']), titulo: z.string().max(255), dados: z.record(z.unknown()), requisito: z.string().max(500).default(''), risco: z.string().max(300).default(''),
  similares: z.array(z.string().uuid()).max(10).default([]), revisao: revisaoSchema.nullable().default(null), remoto: z.object({ id: z.string().optional(), chave: z.string().optional(), url: z.string().optional() }).strict().nullable().default(null),
  falhaDeOrigem: z.object({ runLocalId: z.string().uuid(), casoId: z.number().int() }).strict().optional(), criadaEm: z.string().datetime(), atualizadaEm: z.string().datetime()
}).strict();
export type Proposta = z.infer<typeof propostaSchema>;
const registro = z.object({ version: z.literal(1), itens: z.array(propostaSchema).max(MAX_PROPOSTAS) }).strict();
type Registro = z.infer<typeof registro>;
const ler = (b?: string) => lerLocal<Registro>('propostas.json', registro as unknown as z.ZodType<Registro>, { version: 1, itens: [] }, b);
const gravar = (r: Registro, b?: string) => gravarLocal('propostas.json', registro.parse(r), b);
export const listarPropostas = (espacoId?: string, b?: string) => ler(b).itens.filter(p => !espacoId || p.espacoId === espacoId).sort((a, c) => c.criadaEm.localeCompare(a.criadaEm));
export function obterProposta(id: string, b?: string) { const p = ler(b).itens.find(x => x.id === id); if (!p) throw new Error('PROPOSAL_NOT_FOUND'); return p; }
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = (s: string) => new Set(norm(s).split(' ').filter(t => t.length > 2));
const jaccard = (a: Set<string>, b: Set<string>) => { if (!a.size || !b.size) return 0; let i = 0; for (const t of a) if (b.has(t)) i++; return i / (a.size + b.size - i); };
const validarDados = (tipo: 'caso' | 'bug', dados: unknown) => tipo === 'caso' ? esquemaCaso.parse(dados) : dadosBug.parse(dados);

export type NovaProposta = { espacoId: string; tipo: 'caso' | 'bug'; origem: 'PESSOA' | 'PRUMO' | 'IA'; cliente?: string; dados: unknown; requisito?: string; risco?: string; falhaDeOrigem?: Proposta['falhaDeOrigem'] };
export function criarProposta(n: NovaProposta, b?: string, agora = new Date()): Proposta {
  obterEspaco(n.espacoId, b); const dados = validarDados(n.tipo, n.dados) as Record<string, unknown>; const titulo = mascarar(String(n.tipo === 'caso' ? (dados as { titulo: string }).titulo : (dados as { resumo: string }).resumo)).slice(0, 255);
  const r = ler(b); const doEspaco = r.itens.filter(p => p.espacoId === n.espacoId && p.estado !== 'DESCARTADA');
  if (doEspaco.length >= MAX_PROPOSTAS) throw new Error('PROPOSAL_LIMIT');
  if (n.origem === 'IA' && doEspaco.filter(p => p.origem === 'IA' && agora.getTime() - Date.parse(p.criadaEm) < 3600000).length >= MAX_IA_POR_HORA) throw new Error('PROPOSAL_RATE_LIMIT: limite de propostas por hora atingido; revise as pendentes antes de propor mais.');
  const alvo = norm(titulo); const t = tokens(titulo);
  const mesmaCoisa = doEspaco.find(p => p.tipo === n.tipo && norm(p.titulo) === alvo); if (mesmaCoisa) throw new Error('DUPLICATE_PROPOSAL: já existe uma proposta com o mesmo título neste projeto.');
  const similares = doEspaco.filter(p => p.tipo === n.tipo && jaccard(t, tokens(p.titulo)) >= 0.7).map(p => p.id).slice(0, 10);
  const p: Proposta = propostaSchema.parse({ id: randomUUID(), espacoId: n.espacoId, tipo: n.tipo, origem: n.origem, ...(n.cliente ? { cliente: n.cliente.slice(0, 60) } : {}), estado: 'RASCUNHO', titulo, dados, requisito: mascarar(n.requisito ?? '').slice(0, 500), risco: mascarar(n.risco ?? '').slice(0, 300), similares, revisao: null, remoto: null, ...(n.falhaDeOrigem ? { falhaDeOrigem: n.falhaDeOrigem } : {}), criadaEm: agora.toISOString(), atualizadaEm: agora.toISOString() });
  r.itens.push(p); gravar(r, b); return p;
}
function alterar(id: string, fn: (p: Proposta) => void, b?: string, agora = new Date()) { const r = ler(b); const p = r.itens.find(x => x.id === id); if (!p) throw new Error('PROPOSAL_NOT_FOUND'); fn(p); p.atualizadaEm = agora.toISOString(); propostaSchema.parse(p); gravar(r, b); return p; }
/** Edição pela pessoa: invalida a revisão anterior (o conteúdo mudou). */
export function editarProposta(id: string, dados: unknown, extras: { requisito?: string; risco?: string }, b?: string) {
  return alterar(id, p => { if (p.estado === 'PUBLICADA' || p.estado === 'DESCARTADA') throw new Error('PROPOSAL_CLOSED'); const d = validarDados(p.tipo, dados) as Record<string, unknown>; p.dados = d; p.titulo = mascarar(String(p.tipo === 'caso' ? d.titulo : d.resumo)).slice(0, 255); if (extras.requisito !== undefined) p.requisito = mascarar(extras.requisito).slice(0, 500); if (extras.risco !== undefined) p.risco = mascarar(extras.risco).slice(0, 300); p.revisao = null; p.estado = 'RASCUNHO'; }, b);
}
export function revisarProposta(id: string, r: { duplicidade: boolean; requisito: boolean; risco: boolean; cobertura: boolean }, por: string, b?: string, agora = new Date()) {
  return alterar(id, p => {
    if (p.estado === 'PUBLICADA' || p.estado === 'DESCARTADA') throw new Error('PROPOSAL_CLOSED');
    if (![r.duplicidade, r.requisito, r.risco, r.cobertura].every(Boolean)) throw new Error('REVIEW_INCOMPLETE: confirme duplicidade, requisito, risco e cobertura.');
    if (p.origem === 'IA' && p.tipo === 'caso' && !p.requisito.trim()) throw new Error('REVIEW_REQUIREMENT_MISSING: informe o requisito que o caso cobre.');
    p.revisao = { ...r, por, em: agora.toISOString() }; p.estado = 'REVISADA';
  }, b);
}
export const descartarProposta = (id: string, b?: string) => alterar(id, p => { if (p.estado === 'PUBLICADA') throw new Error('PROPOSAL_CLOSED'); p.estado = 'DESCARTADA'; }, b);
/** Pré-condição de publicação: IA exige revisão completa; as demais origens exigem ao menos a confirmação da pessoa (feita no diálogo nativo). */
export function podePublicar(p: Proposta) { if (p.estado === 'PUBLICADA' || p.estado === 'DESCARTADA') throw new Error('PROPOSAL_CLOSED'); if (p.origem === 'IA' && p.estado !== 'REVISADA') throw new Error('REVIEW_REQUIRED: proposta de IA precisa ser revisada antes de publicar.'); return true; }
export const marcarPublicada = (id: string, remoto: { id?: string; chave?: string; url?: string }, b?: string) => alterar(id, p => { p.estado = 'PUBLICADA'; p.remoto = remoto; }, b);
