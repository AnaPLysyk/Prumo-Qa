/** Consulta milestones, ambientes e campos personalizados do projeto Qase vinculado, para preencher run e defeito. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';

const pagina = <T extends z.ZodTypeAny>(item: T) => z.object({ result: z.object({ entities: z.array(item).default([]), total: z.number().optional(), filtered: z.number().optional() }).passthrough() }).passthrough();
const pg = (p: ParametrosConsulta['p']) => `limit=${Math.min(100, p.limite)}&offset=${p.offset}`;

export async function consultarMarcosQase({ ctx, rec, p, prox }: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  if (ctx.servico !== 'qase') return null;
  const endpoint = `/v1/milestone/${codificarParaUrl(rec.chave)}`;
  const r = pagina(z.object({ id: z.number(), title: z.string(), status: z.string().nullable().optional(), due_date: z.string().nullable().optional() }).passthrough()).parse(await ctx.ler(`${endpoint}?${pg(p)}`));
  return { dados: r.result.entities.map(m => ({ id: m.id, titulo: m.title, estado: m.status ?? null, prazo: m.due_date ?? null })), proxima: prox(r.result.entities.length), endpoint };
}

export async function consultarAmbientesQase({ ctx, rec, p, prox }: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  if (ctx.servico !== 'qase') return null;
  const endpoint = `/v1/environment/${codificarParaUrl(rec.chave)}`;
  const r = pagina(z.object({ id: z.number(), title: z.string(), slug: z.string().nullable().optional(), host: z.string().nullable().optional() }).passthrough()).parse(await ctx.ler(`${endpoint}?${pg(p)}`));
  return { dados: r.result.entities.map(a => ({ id: a.id, titulo: a.title, slug: a.slug ?? null, host: a.host ?? null })), proxima: prox(r.result.entities.length), endpoint };
}

/**
 * Campos personalizados da entidade (defect, run ou case) que valem para este projeto. O Qase guarda as opções de
 * listas em `value` como texto; quando é uma lista JSON de {id, title}, elas viram opções, senão o campo é texto livre.
 */
export async function consultarCamposPersonalizadosQase({ ctx, rec, p, f, prox }: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  if (ctx.servico !== 'qase') return null;
  const entidade = f.tipo === 'run' || f.tipo === 'case' ? f.tipo : 'defect';
  const r = pagina(z.object({ id: z.number(), title: z.string(), type: z.string().nullable().optional(), is_required: z.boolean().optional(), default_value: z.string().nullable().optional(), placeholder: z.string().nullable().optional(), value: z.string().nullable().optional(), is_enabled_for_all_projects: z.boolean().optional(), projects_codes: z.array(z.string()).nullable().optional() }).passthrough()).parse(await ctx.ler(`/v1/custom_field?entity=${entidade}&${pg(p)}`));
  const doProjeto = r.result.entities.filter(c => c.is_enabled_for_all_projects || (c.projects_codes ?? []).includes(rec.chave));
  const opcoes = (v: string | null | undefined) => { try { const l = JSON.parse(v ?? ''); return Array.isArray(l) ? l.filter(o => o && (typeof o.id === 'number' || typeof o.id === 'string')).map(o => ({ id: String(o.id), titulo: String(o.title ?? o.id) })) : null; } catch { return null; } };
  return { dados: doProjeto.map(c => ({ id: c.id, titulo: c.title, tipo: c.type ?? null, obrigatorio: c.is_required === true, padrao: c.default_value ?? null, dica: c.placeholder ?? null, opcoes: opcoes(c.value), entidade })), proxima: prox(r.result.entities.length), endpoint: '/v1/custom_field' };
}
