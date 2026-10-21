/** Agentes criados pela própria pessoa: só o dono vê, edita e exclui; marcado como público, as outras contas veem, só para leitura. */
// Agentes criados pela própria pessoa (os fixos do núcleo continuam geridos pela Administração). Cada agente tem dono e projeto: só o dono vê, edita e exclui. Marcado como público, as outras contas deste computador também o veem, só para leitura. Ninguém mais o vê, nem a Administração. Ficam em plataforma/agentes-pessoais.json.
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { lerLocal } from '../../compartilhado/banco/persistenciaLocal.js';
import { gravarLocal } from '../../compartilhado/banco/persistenciaLocal.js';
import { lerContas } from '../../login/banco/contas.js';
import { agentesChat } from '../tipos/persona.js';
import { obterEspaco } from '../../projetos/banco/projetos.js';
import { listarRotinas } from '../../agendamentos/banco/agenda.js';
import { listarRunsLocais } from '../../testes/banco/runs.js';
import { listarPropostas } from '../../tickets/banco/tickets.js';

const ARQUIVO = 'agentes-pessoais.json';
const LIMITE_POR_PESSOA_E_PROJETO = 50;
const texto = (max: number) => z.string().max(max);
/** Ferramentas reais, todas de consulta local; agendamentos são rotinas do Prumo, não calendários externos. */
export const ferramentasPessoais = ['projeto', 'agenda', 'execucoes', 'tickets'] as const;
export const rotulosDasFerramentas = { projeto: 'Resumo do projeto', agenda: 'Agenda de rotinas do Prumo', execucoes: 'Runs de teste locais', tickets: 'Propostas e tickets locais' } as const;
export const dadosDoAgentePessoal = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,80}$/).optional(), nome: z.string().trim().min(1).max(100), descricao: texto(4000), objetivo: z.string().trim().min(1).max(4000),
  instrucoes: z.string().trim().min(1).max(4000), publico: z.boolean(), ferramenta: z.enum(ferramentasPessoais).default('projeto')
}).strict();
const agenteSchema = dadosDoAgentePessoal.required({ id: true }).extend({ donoId: z.string().uuid(), espacoId: z.string().uuid(), criadoEm: z.string().datetime(), atualizadoEm: z.string().datetime() }).strict();
export const preferenciasDoAgenteSchema = z.object({ apelido: z.string().trim().max(80), orientacao: z.string().trim().max(1000) }).strict();
const ajusteSchema = preferenciasDoAgenteSchema.extend({ usuarioId: z.string().uuid(), agenteId: z.string().min(1).max(40) }).strict();
const registroSchema = z.object({ version: z.literal(1), agentes: z.array(agenteSchema).max(5000), ajustes: z.array(ajusteSchema).max(10000).default([]) }).strict();
type Registro = z.infer<typeof registroSchema>;
type AgentePessoal = z.infer<typeof agenteSchema>;

const ler = (b?: string): Registro => lerLocal<Registro>(ARQUIVO, registroSchema, { version: 1, agentes: [], ajustes: [] }, b);
const gravar = (r: Registro, b?: string) => gravarLocal(ARQUIVO, registroSchema.parse(r), b);
const paraJanela = (a: AgentePessoal, usuarioId: string, nomes: Map<string, string>) => ({ id: a.id, nome: a.nome, descricao: a.descricao, objetivo: a.objetivo, instrucoes: a.instrucoes, publico: a.publico, ferramenta: a.ferramenta, meu: a.donoId === usuarioId, dono: a.donoId === usuarioId ? null : nomes.get(a.donoId) ?? null, atualizadoEm: a.atualizadoEm });

/* Preferências dos robôs oficiais: pertencem somente à conta, nunca ao projeto nem ao Admin. */
export function lerPreferenciasDosAgentes(usuarioId: string, b?: string) {
  return Object.fromEntries(ler(b).ajustes.filter(x => x.usuarioId === usuarioId)
    .map(({ agenteId, apelido, orientacao }) => [agenteId, { apelido, orientacao }]));
}
export function salvarPreferenciasDoAgente(id: string, dados: z.infer<typeof preferenciasDoAgenteSchema>, usuarioId: string, b?: string) {
  if (id === 'orquestrador' || !agentesChat.some(x => x.id === id)) throw new Error('AGENT_NOT_FOUND');
  const d = preferenciasDoAgenteSchema.parse(dados), r = ler(b);
  r.ajustes = r.ajustes.filter(x => !(x.agenteId === id && x.usuarioId === usuarioId));
  if (d.apelido || d.orientacao) r.ajustes.push({ agenteId: id, usuarioId, ...d });
  gravar(r, b);
  return d;
}

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
    if (a) { Object.assign(a, { nome: d.nome, descricao: d.descricao, objetivo: d.objetivo, instrucoes: d.instrucoes, publico: d.publico, ferramenta: d.ferramenta, atualizadoEm: quando }); gravar(r, b); return { id: a.id }; }
    if (r.agentes.some((x) => x.id === d.id)) throw new Error('AGENT_NOT_FOUND: agente não encontrado.');
  }
  if (r.agentes.filter((x) => x.donoId === usuarioId && x.espacoId === espacoId).length >= LIMITE_POR_PESSOA_E_PROJETO) throw new Error('AGENT_LIMIT: no máximo ' + LIMITE_POR_PESSOA_E_PROJETO + ' agentes seus por projeto.');
  const id = d.id ?? 'pessoal-' + randomUUID();
  r.agentes.push({ id, donoId: usuarioId, espacoId, nome: d.nome, descricao: d.descricao, objetivo: d.objetivo, instrucoes: d.instrucoes, publico: d.publico, ferramenta: d.ferramenta, criadoEm: quando, atualizadoEm: quando });
  gravar(r, b); return { id };
}

export function excluirAgentePessoal(id: string, usuarioId: string, b?: string) {
  const r = ler(b); const i = r.agentes.findIndex((x) => x.id === id && x.donoId === usuarioId);
  if (i < 0) throw new Error('AGENT_NOT_FOUND: agente não encontrado.');
  r.agentes.splice(i, 1); gravar(r, b); return { excluido: true };
}

/**
 * Execução real e estritamente de leitura do agente pessoal. A identidade nunca vem da janela:
 * projeto e proprietário são conferidos novamente no backend antes de acessar qualquer dado.
 * Nomes/instruções livres não são interpretados como comandos, URLs ou código.
 */
export function consultarAgentePessoal(espacoId: string, agenteId: string, usuarioId: string, b?: string) {
  const e = obterEspaco(espacoId, b);
  const a = ler(b).agentes.find(x => x.id === agenteId && x.espacoId === espacoId && x.donoId === usuarioId);
  if (!a) throw new Error('AGENT_NOT_FOUND: somente o dono pode executar esta consulta.');
  const linhas: string[] = [];
  let origem: string;
  if (a.ferramenta === 'agenda') {
    const itens = listarRotinas(b).filter(x => x.espacoId === espacoId);
    origem = 'agenda.json';
    linhas.push(itens.length ? `${itens.length} rotina(s) cadastrada(s) no Prumo.` : 'Nenhuma rotina cadastrada neste projeto.');
    linhas.push(...itens.slice(0, 8).map(x => `${x.nome.slice(0, 120)} — ${x.estado}; ${x.tipo}; frequência ${x.frequencia.tipo}.`));
    linhas.push('Esta consulta não acessa Google Calendar, Outlook ou agendas externas; não cria agendamentos.');
  } else if (a.ferramenta === 'execucoes') {
    const itens = listarRunsLocais(espacoId, b);
    origem = 'runs-qase.json';
    linhas.push(itens.length ? `${itens.length} run(s) local(is) cadastrada(s).` : 'Nenhuma run local cadastrada neste projeto.');
    linhas.push(...itens.slice(0, 8).map(x => `${x.titulo.slice(0, 120)} — estado ${x.estado}; ${x.casos.length} caso(s).`));
    linhas.push('Run cadastrada não comprova execução ou publicação.');
  } else if (a.ferramenta === 'tickets') {
    const itens = listarPropostas(espacoId, b);
    origem = 'propostas.json';
    linhas.push(itens.length ? `${itens.length} proposta(s) local(is) registrada(s).` : 'Nenhuma proposta local registrada neste projeto.');
    linhas.push(...itens.slice(0, 8).map(x => `${x.titulo.slice(0, 120)} — estado ${x.estado}.`));
    linhas.push('Esta consulta não acessa tickets remotos do Jira nem os modifica.');
  } else {
    origem = 'espacos.json';
    linhas.push(`Projeto: ${e.nome.slice(0, 180)}.`);
    linhas.push(e.pastaLocal ? 'Há uma pasta local vinculada.' : 'Nenhuma pasta local vinculada.');
    linhas.push('Consulta apenas os dados locais autorizados desta conta.');
  }
  return { agente: a.nome, ferramenta: a.ferramenta, modo: 'CONSULTA_LOCAL' as const,
    origem, em: new Date().toISOString(), linhas };
}

/** Prévias que ficavam no armazenamento da janela (até a 2.16, visíveis a todas as contas): passam a ser agentes privados de quem as importa. */
export function importarPreviasAntigas(espacoId: string, previas: Omit<z.infer<typeof dadosDoAgentePessoal>, 'publico'>[], usuarioId: string, b?: string) {
  let importados = 0;
  for (const p of previas) {
    try { salvarAgentePessoal(espacoId, { ...p, publico: false }, usuarioId, b); importados++; } catch { /* prévia inválida, de outra pessoa ou acima do limite: fica de fora */ }
  }
  return { importados };
}
