/** Tipos das leituras externas — arquivos relacionados agrupados para manutenção. */
import { z } from "zod";
import { MetodoEscrita } from "./escritaGithub.js";
import { Servico, Recurso } from "../../projetos/contratos.js";
import { TransporteEscrita, TransporteServico } from "./transporte.js";

// ── leituras ──
/**
 * Leituras adicionais dos três serviços. Todas são GET com parâmetros montados aqui (nada vem de URL livre) e conferem
 * que o recurso pertence ao projeto/repositório vinculado. Limites: logs de workflow e download de artefatos exigem redirecionamento,
 * que o Prumo bloqueia por segurança; por isso só metadados e links oficiais são apresentados.
 */
export const operacoesExtras = ['metadados', 'campos-tipo', 'transicoes', 'historico', 'anexos', 'plano', 'campos-sistema', 'arquivos', 'workflows', 'jobs', 'artefatos', 'revisoes', 'commit', 'issues', 'marcos', 'ambientes', 'campos-personalizados'] as const;

export type OperacaoExtra = typeof operacoesExtras[number];

export const filtrosSchema = z.object({
  q: z.string().trim().max(100).optional(), tipo: z.string().regex(/^[\p{L}\p{N} _.-]{1,60}$/u).optional(), status: z.string().regex(/^[\p{L}\p{N} _.-]{1,60}$/u).optional(),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), pai: z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/).optional(),
  ref: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._/-]{0,100}$/).optional(), branch: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._/-]{0,100}$/).optional()
}).strict();

export type Filtros = z.infer<typeof filtrosSchema>;

export type Pg = { offset: number; limite: number };

// ── adaptador ──
export const operacoesServico=['tickets','ticket','campos','comentarios','defeitos','defeito','suites','casos','caso','planos','runs','run','resultados','repositorio','branches','commits','prs','pr','verificacoes',...operacoesExtras] as const;

export type OperacaoServico=typeof operacoesServico[number];

export type ConfigServico={id:string;servico:Servico;instancia:string;usuario?:string;contaId:string;token:string};

export const obj=z.record(z.unknown());

export const objetos=z.array(obj).max(100);

export const sid=z.union([z.string().min(1).max(200),z.number().int().safe().nonnegative()]).transform(String);

export const nome=z.string().min(1).max(1000);

export const paginaQase=z.object({status:z.literal(true),result:z.object({total:z.number().int().nonnegative(),filtered:z.number().int().nonnegative().optional(),entities:objetos})});

export const itemQase=z.object({status:z.literal(true),result:obj});

export type ContextoServico={servico:Servico;instancia:string;ler:(caminho:string)=>Promise<unknown>;enviar:(metodo:MetodoEscrita,caminho:string,corpo:string|Buffer,tipoConteudo?:string,extraHeaders?:Record<string,string>)=>Promise<unknown>;limpar:(v:unknown)=>unknown};

/** O que cada função do adaptador recebe: a conta (com a credencial, que não sai daqui) e os transportes de leitura e escrita. */
export type PartesDoAdaptador = { readonly c: ConfigServico; readonly transporte: TransporteServico; readonly escrita: TransporteEscrita };

/** Como buscar uma consulta: o endereço, onde está a lista na resposta e o formato do envelope. */
export type PlanoDaConsulta = { endpoint: string; colecao?: string; envelope: 'jira-cursor' | 'jira-offset' | 'array' | 'object' | 'qase-page' | 'qase-item' | 'github-checks' };

// ── ParametrosConsulta ──
export type ParametrosConsulta = {
  ctx: ContextoServico;
  rec: Recurso;
  p: Pg;
  id?: string;
  f: Filtros;
  repo: string;
  pg: string;
  prox: (quantidade: number) => number | null;
  ticket: () => string;
  numero: () => string;
};

/** Estrutura padronizada do retorno da consulta. */
export type ResultadoConsulta = { dados: unknown; proxima: number | null; endpoint: string };
