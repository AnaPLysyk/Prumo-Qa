/** Agentes criados pela própria pessoa: só o dono vê, edita e exclui; marcado como público, as outras contas veem, só para leitura. */
// Agentes criados pela própria pessoa (os fixos do núcleo continuam geridos pela Administração). Cada agente tem dono e projeto: só o dono vê, edita e exclui. Marcado como público, as outras contas deste computador também o veem, só para leitura. Ninguém mais o vê, nem a Administração. Ficam em plataforma/agentes-pessoais.json.
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { lerContas } from '../../login/banco/lerContas.js';

const ARQUIVO = 'agentes-pessoais.json';
const LIMITE_POR_PESSOA_E_PROJETO = 50;
const texto = (max: number) => z.string().max(max);
export const dadosDoAgentePessoal = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,80}$/).optional(), nome: z.string().trim().min(1).max(100), descricao: texto(4000), objetivo: z.string().trim().min(1).max(4000),
  instrucoes: z.string().trim().min(1).max(4000), publico: z.boolean()
}).strict();
const agenteSchema = dadosDoAgentePessoal.required({ id: true }).extend({ donoId: z.string().uuid(), espacoId: z.string().uuid(), criadoEm: z.string().datetime(), atualizadoEm: z.string().datetime() }).strict();
const registroSchema = z.object({ version: z.literal(1), agentes: z.array(agenteSchema).max(5000) }).strict();
type Registro = z.infer<typeof registroSchema>;
type AgentePessoal = z.infer<typeof agenteSchema>;

const ler = (b?: string): Registro => lerLocal<Registro>(ARQUIVO, registroSchema, { version: 1, agentes: [] }, b);
const gravar = (r: Registro, b?: string) => gravarLocal(ARQUIVO, registroSchema.parse(r), b);
const paraJanela = (a: AgentePessoal, usuarioId: string, nomes: Map<string, string>) => ({ id: a.id, nome: a.nome, descricao: a.descricao, objetivo: a.objetivo, instrucoes: a.instrucoes, publico: a.publico, meu: a.donoId === usuarioId, dono: a.donoId === usuarioId ? null : nomes.get(a.donoId) ?? null, atualizadoEm: a.atualizadoEm });

/** Os agentes do projeto que esta pessoa pode ver: os dela e os públicos das outras. */
export function listarAgentesPessoais(espacoId: string, usuarioId: string, b?: string) {
  const nomes = new Map(lerContas(b).usuarios.map((u) => [u.id, u.nome]));
  return ler(b).agentes.filter((a) => a.espacoId === espacoId && (a.donoId === usuarioId || a.publico)).sort((x, y) => x.criadoEm.localeCompare(y.criadoEm)).map((a) => paraJanela(a, usuarioId, nomes));
}

/** Cria ou atualiza um agente desta pessoa. Id de agente de outra pessoa responde como inexistente. */
export function salvarAgentePessoal(espacoId: string, dados: z.infer<typeof dadosDoAgentePessoal>, usuarioId: string, b?: string, agora = new Date()) {
  const d = dadosDoAgentePessoal.parse(dados); const r = ler(b); const quando = agora.toISOString();
  if (d.id) {
    const a = r.agentes.find((x) => x.id === d.id && x.espacoId === espacoId);
    if (a && a.donoId !== usuarioId) throw new Error('AGENT_NOT_FOUND: agente não encontrado.');
    if (a) { Object.assign(a, { nome: d.nome, descricao: d.descricao, objetivo: d.objetivo, instrucoes: d.instrucoes, publico: d.publico, atualizadoEm: quando }); gravar(r, b); return { id: a.id }; }
    if (r.agentes.some((x) => x.id === d.id)) throw new Error('AGENT_NOT_FOUND: agente não encontrado.');
  }
  if (r.agentes.filter((x) => x.donoId === usuarioId && x.espacoId === espacoId).length >= LIMITE_POR_PESSOA_E_PROJETO) throw new Error('AGENT_LIMIT: no máximo ' + LIMITE_POR_PESSOA_E_PROJETO + ' agentes seus por projeto.');
  const id = d.id ?? 'pessoal-' + randomUUID();
  r.agentes.push({ id, donoId: usuarioId, espacoId, nome: d.nome, descricao: d.descricao, objetivo: d.objetivo, instrucoes: d.instrucoes, publico: d.publico, criadoEm: quando, atualizadoEm: quando });
  gravar(r, b); return { id };
}

export function excluirAgentePessoal(id: string, usuarioId: string, b?: string) {
  const r = ler(b); const i = r.agentes.findIndex((x) => x.id === id && x.donoId === usuarioId);
  if (i < 0) throw new Error('AGENT_NOT_FOUND: agente não encontrado.');
  r.agentes.splice(i, 1); gravar(r, b); return { excluido: true };
}

/** Prévias que ficavam no armazenamento da janela (até a 2.16, visíveis a todas as contas): passam a ser agentes privados de quem as importa. */
export function importarPreviasAntigas(espacoId: string, previas: Omit<z.infer<typeof dadosDoAgentePessoal>, 'publico'>[], usuarioId: string, b?: string) {
  let importados = 0;
  for (const p of previas) {
    try { salvarAgentePessoal(espacoId, { ...p, publico: false }, usuarioId, b); importados++; } catch { /* prévia inválida, de outra pessoa ou acima do limite: fica de fora */ }
  }
  return { importados };
}
