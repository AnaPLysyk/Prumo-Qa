/** Consulta as issues do repositório GitHub vinculado (abertas por padrão), sem os Pull Requests que a mesma rota devolve. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { z } from 'zod';

export async function consultarIssuesGithub(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, f, repo, pg, prox } = parametros;
  if (ctx.servico !== 'github') return null;
  // Só os estados da API: "open" (padrão), "closed" ou "all". Qualquer outro filtro de status continua listando as abertas.
  const estado = f.status === 'closed' || f.status === 'all' ? f.status : 'open';
  const l = z.array(z.object({ number: z.number(), title: z.string(), state: z.string(), html_url: z.string().optional(), body: z.string().nullable().optional(), user: z.object({ login: z.string() }).passthrough().nullable().optional(), labels: z.array(z.union([z.string(), z.object({ name: z.string() }).passthrough()])).optional(), comments: z.number().optional(), created_at: z.string().optional(), updated_at: z.string().optional(), pull_request: z.unknown().optional() }).passthrough()).parse(await ctx.ler(`${repo}/issues?state=${estado}&sort=updated&direction=desc&${pg}`));
  // A próxima página conta os itens brutos: PRs filtrados não podem encerrar a paginação antes do fim.
  return { dados: l.filter(i => i.pull_request === undefined).map(i => ({ numero: i.number, titulo: i.title, estado: i.state, url: i.html_url ?? null, corpo: i.body ?? null, autor: i.user?.login ?? null, rotulos: (i.labels ?? []).map(x => (typeof x === 'string' ? x : x.name)), comentarios: i.comments ?? 0, criado: i.created_at ?? null, atualizado: i.updated_at ?? null })), proxima: prox(l.length), endpoint: `${repo}/issues` };
}
