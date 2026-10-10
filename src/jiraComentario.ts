import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { lerLocal, gravarLocal } from './armazenamentoLocal.js';
import { mascarar } from './projeto.js';
import { ErroServico } from './httpServicos.js';
import { consumirPublicacao, politicaCobre } from './autorizacoes.js';
import { obterTrabalho, definirJira, type Trabalho } from './fila.js';
import { obterEspaco } from './espacos.js';

/**
 * Comentário de resultado de QA no Jira (2.8). A única escrita remota do produto.
 * - Texto estruturado montado SOMENTE de dados locais da execução (contagens, motivo, referência da evidência);
 * - nunca afirma aprovação do ticket inteiro nem altera status/workflow;
 * - manual: prévia + confirmação nativa feitas pelo processo principal; agendada: política prévia (ticket+tipo+validade+limite);
 * - idempotente: registro local por (execução, ticket) + marcador pesquisável no próprio comentário.
 */
export interface PublicadorJira {
  comentarJira(espacoId: string, ticket: string, adf: unknown): Promise<{ id: string; vinculoId: string; conexaoId: string }>;
  procurarComentarioJira(espacoId: string, ticket: string, marcador: string): Promise<string | null>;
}
const rotulo: Record<string, string> = { smoke: 'Smoke', regressao: 'Regressão', 'validacao-ticket': 'Validação por ticket', k6: 'Desempenho (k6)' };
export const marcadorDe = (trabalhoId: string) => `Prumo-Execução: ${trabalhoId}`;
const linha = (t: string) => ({ type: 'paragraph', content: [{ type: 'text', text: t }] });

export type Comentario = { texto: string; adf: unknown; marcador: string };
export function montarComentario(t: Trabalho, nomeProjeto: string): Comentario {
  const res = t.resultado; if (!res || (res.status !== 'PASS' && res.status !== 'FAIL')) throw new Error('JIRA_COMMENT_NOT_APPLICABLE');
  if (!t.ticket) throw new Error('JIRA_TICKET_REQUIRED');
  const c = res.contagem ?? { pass: 0, fail: 0, blocked: 0, notRun: 0 }; const total = c.pass + c.fail + c.blocked + c.notRun;
  const marcador = marcadorDe(t.id);
  const veredito = res.status === 'FAIL'
    ? 'Validação reprovada nos cenários executados.'
    : total ? 'Cenários executados aprovados. Cobertura parcial: isto não representa aprovação do ticket inteiro.' : 'Rodada concluída com exit code 0, sem cenários individuais reportados; não há resultado por cenário.';
  const quando = t.terminadoEm ?? t.iniciadoEm ?? t.criadoEm;
  const linhas = [
    'PRUMO QA — RESULTADO DE VALIDAÇÃO', '',
    `Ticket: ${t.ticket}`, `Projeto Prumo: ${nomeProjeto}`, `Tipo: ${rotulo[t.tipo] ?? t.tipo}`, `Ambiente: ${t.ambiente}`, `Data: ${quando}`, `Execução: ${t.id}`, '',
    total ? `${total} cenário(s) executado(s): ${c.pass} PASS, ${c.fail} FAIL, ${c.blocked} BLOCKED, ${c.notRun} NOT_RUN` : 'Cenários individuais: nenhum reportado pelo runner',
  ];
  if (res.detalhes) linhas.push('', 'Falhas:', ...res.detalhes.split('\n').slice(0, 5).map(x => x.slice(0, 300)));
  linhas.push('', `Evidência: referência local da execução${res.evidenciaId ? ` ${res.evidenciaId}` : ''} (arquivo no projeto, não anexado).`, '', `Resultado: ${veredito}`, 'Este comentário não altera o status do ticket.', '', marcador);
  const texto = mascarar(linhas.join('\n')).slice(0, 8000);
  return { texto, marcador, adf: { type: 'doc', version: 1, content: texto.split('\n').map(l => l ? linha(l) : { type: 'paragraph' }) } };
}

const registroPub = z.object({
  chave: z.string().max(120), trabalhoId: z.string().uuid(), espacoId: z.string().uuid(), ticket: z.string().max(40), modo: z.enum(['MANUAL', 'AGENDADO']),
  estado: z.enum(['PREPARADO', 'PUBLICADO', 'FALHA', 'BLOQUEADO']), tentativas: z.number().int(), textoSha256: z.string().length(64), texto: z.string().max(8000),
  vinculoId: z.string().uuid().optional(), conexaoId: z.string().uuid().optional(), comentarioId: z.string().max(40).optional(), politicaId: z.string().uuid().optional(), consumida: z.boolean().default(false),
  publicadoEm: z.string().datetime().optional(), ultimaTentativa: z.string().datetime().optional(), erro: z.string().max(80).optional(), criadoEm: z.string().datetime()
}).strict();
type Pub = z.infer<typeof registroPub>;
const registro = z.object({ version: z.literal(1), itens: z.array(registroPub).max(1000) }).strict();
type Registro = z.infer<typeof registro>;
const ler = (b?: string): Registro => lerLocal<Registro>('publicacoes-jira.json', registro as unknown as z.ZodType<Registro>, { version: 1, itens: [] }, b);
const gravar = (r: Registro, b?: string) => { if (r.itens.length > 1000) r.itens = r.itens.slice(-1000); gravarLocal('publicacoes-jira.json', registro.parse(r), b); };
export const listarPublicacoes = (b?: string) => ler(b).itens;
export const publicacaoDoTrabalho = (id: string, b?: string) => ler(b).itens.find(x => x.trabalhoId === id) ?? null;

export const codigoDe = (e: unknown) => e instanceof ErroServico ? e.codigo : (e as Error)?.message?.match(/^[A-Z_]{3,60}/)?.[0] ?? 'JIRA_PUBLISH_FAILED';
const retentavel = (cod: string) => ['SERVICE_TIMEOUT', 'SERVICE_UNAVAILABLE', 'SERVICE_RATE_LIMIT'].includes(cod);

/** Prévia: nada é gravado nem enviado. */
export function prepararPublicacao(trabalhoId: string, b?: string) {
  const t = obterTrabalho(trabalhoId, b); const c = montarComentario(t, obterEspaco(t.espacoId, b).nome);
  const existente = publicacaoDoTrabalho(t.id, b);
  return { ticket: t.ticket!, texto: c.texto, estado: existente?.estado ?? 'NAO_PUBLICADO', comentarioId: existente?.comentarioId ?? null };
}

/**
 * Publica (ou confirma que já está publicado) o comentário da execução. `modo` MANUAL exige `confirmado` (a confirmação nativa
 * acontece no processo principal, nunca na página). AGENDADO exige política vigente que cubra ticket e tipo.
 */
export async function publicar(trabalhoId: string, modo: 'MANUAL' | 'AGENDADO', pub: PublicadorJira, b?: string, confirmado = false, agora = new Date()): Promise<Pub> {
  const t = obterTrabalho(trabalhoId, b); const nome = obterEspaco(t.espacoId, b).nome;
  if (modo === 'MANUAL' && !confirmado) throw new Error('HUMAN_CONFIRMATION_REQUIRED');
  const c = montarComentario(t, nome); const ticket = t.ticket!; const chave = `${t.id}:${ticket}`;
  const sha = createHash('sha256').update(c.texto).digest('hex');
  let r = ler(b); let reg = r.itens.find(x => x.chave === chave);
  if (reg?.estado === 'PUBLICADO') return reg; // idempotência: nunca publica duas vezes a mesma execução no mesmo ticket
  if (!reg) { reg = { chave, trabalhoId: t.id, espacoId: t.espacoId, ticket, modo, estado: 'PREPARADO', tentativas: 0, textoSha256: sha, texto: c.texto, consumida: false, criadoEm: agora.toISOString() }; r.itens.push(reg); }
  const salvar = (patch: Partial<Pub>) => { r = ler(b); const i = r.itens.findIndex(x => x.chave === chave); const novo = registroPub.parse({ ...(i >= 0 ? r.itens[i] : reg), ...patch }); if (i >= 0) r.itens[i] = novo; else r.itens.push(novo); gravar(r, b); reg = novo; return novo; };
  salvar({});
  if (modo === 'AGENDADO' && !reg!.consumida) {
    const p = consumirPublicacao(t.espacoId, ticket, t.tipo, b, agora);
    if (!p) { salvar({ estado: 'BLOQUEADO', erro: 'PUBLISH_POLICY_MISSING', ultimaTentativa: agora.toISOString() }); definirJira(t.id, { estado: 'BLOQUEADO', codigo: 'PUBLISH_POLICY_MISSING' }, b); return reg!; }
    salvar({ consumida: true, politicaId: p.id });
  }
  salvar({ tentativas: reg!.tentativas + 1, ultimaTentativa: agora.toISOString(), modo });
  try {
    // Falha de rede ambígua na tentativa anterior: o comentário pode já existir. Procura o marcador antes de enviar.
    const existente = reg!.tentativas > 1 || reg!.estado === 'FALHA' ? await pub.procurarComentarioJira(t.espacoId, ticket, c.marcador) : null;
    if (existente) { salvar({ estado: 'PUBLICADO', comentarioId: existente, publicadoEm: agora.toISOString(), erro: undefined }); definirJira(t.id, { estado: 'PUBLICADO', comentarioId: existente }, b); return reg!; }
    const enviado = await pub.comentarJira(t.espacoId, ticket, c.adf);
    salvar({ estado: 'PUBLICADO', comentarioId: enviado.id, vinculoId: enviado.vinculoId, conexaoId: enviado.conexaoId, publicadoEm: new Date().toISOString(), erro: undefined });
    definirJira(t.id, { estado: 'PUBLICADO', comentarioId: enviado.id }, b); return reg!;
  } catch (e) {
    const cod = codigoDe(e); salvar({ estado: 'FALHA', erro: cod.slice(0, 80) }); definirJira(t.id, { estado: retentavel(cod) ? 'PENDENTE' : 'FALHA', codigo: cod.slice(0, 80) }, b); return reg!;
  }
}
/** Trabalhos agendados concluídos com ticket e política que cubra: prepara o registro; senão marca a razão (nunca publica sem política). */
export function elegivelParaPublicar(t: Trabalho, b?: string, agora = new Date()): 'SIM' | 'NAO_APLICAVEL' | 'SEM_POLITICA' {
  if (t.estado !== 'CONCLUIDO' || !t.ticket || (t.resultado?.status !== 'PASS' && t.resultado?.status !== 'FAIL')) return 'NAO_APLICAVEL';
  if (t.jira.estado === 'PUBLICADO') return 'NAO_APLICAVEL';
  return politicaCobre(t.espacoId, t.ticket, t.tipo, b, agora) ? 'SIM' : 'SEM_POLITICA';
}
export const novoId = () => randomUUID();
export { retentavel };
