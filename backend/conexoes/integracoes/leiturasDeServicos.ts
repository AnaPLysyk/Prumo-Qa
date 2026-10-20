/** Consultas remotas a serviços vinculados com escopo, paginação e envelopes validados. */
import { z } from "zod";
import { Recurso } from "../../projetos/contratos.js";
import { OperacaoServico, nome, obj, ContextoServico, PartesDoAdaptador, objetos, paginaQase, ConfigServico, PlanoDaConsulta, itemQase } from "../tipos/adaptador.js";
import { ErroServico } from "./ErroServico.js";
import { cabecalhosDoServico } from "./configuracaoDosServicos.js";
import { lerComCredencial } from "./requisicoes.js";
import { limparRespostaDoServico, parametrosDaUrl, recursoDaResposta } from "../integracoesFormatos.js";
import { paginaSchema } from "../tipos/transporte.js";

export function conferirEscopoDaConsulta(r: Recurso, operacao: OperacaoServico, dados: unknown, id?: string): unknown {
  if (operacao === 'tickets') for (const issue of dados as Record<string, unknown>[]) { const f = obj.parse(issue.fields); if (String(obj.parse(f.project).id) !== r.id) throw new ErroServico('SERVICE_SCOPE_CHANGED'); }
  if ((operacao === 'caso' || operacao === 'defeito') && String(obj.parse(dados).id) !== id) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  if (operacao === 'defeitos' || operacao === 'defeito') {
    const defect = z.object({ id: z.number().int().positive().safe(), title: nome, actual_result: z.string().optional(), severity: z.string().optional(), status: z.string().optional(), milestone_id: z.number().int().nullable().optional(), author_id: z.number().int().optional(), created_at: z.string().optional(), updated_at: z.string().optional(), created: z.string().optional(), updated: z.string().optional(), resolved_at: z.string().nullable().optional(), runs: z.array(z.number().int().positive()).max(100).optional(), results: z.array(z.string()).max(100).optional(), attachments: z.array(obj).max(100).optional(), tags: z.array(obj).max(100).optional(), external_data: z.string().optional() });
    dados = Array.isArray(dados) ? dados.map(d => defect.parse(d)) : defect.parse(dados);
  }
  if (operacao === 'repositorio' && String(obj.parse(dados).id) !== r.id) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  return dados;
}

export function contextoDoAdaptador(a: PartesDoAdaptador): ContextoServico {
  const c = a.c;
  return {
    servico: c.servico, instancia: c.instancia,
    ler: p => lerComCredencial(a, p),
    enviar: async (metodo, caminho, corpo, tipoConteudo, extraHeaders) => {
      if (!c.token) throw new ErroServico('CREDENTIAL_UNAVAILABLE');
      try { return await a.escrita({ servico: c.servico, instancia: c.instancia, caminho, headers: { ...cabecalhosDoServico(c), ...(extraHeaders ?? {}) }, corpo, metodo, tipoConteudo }); }
      catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_UNAVAILABLE'); }
    },
    limpar: v => limparRespostaDoServico(c, v)
  };
}

export async function listarRecursosDoServico(a: PartesDoAdaptador, pagina: z.input<typeof paginaSchema> = {}) {
  const p = paginaSchema.parse(pagina);
  try {
    let entries: Record<string, unknown>[], total: number | undefined, next: string | number | null;
    if (a.c.servico === 'jira') { const r = z.object({ values: objetos, total: z.number().int().nonnegative(), isLast: z.boolean().optional() }).parse(await lerComCredencial(a, '/rest/api/3/project/search?' + parametrosDaUrl({ startAt: p.offset, maxResults: p.limite }))); entries = r.values; total = r.total; next = p.offset + entries.length < total ? p.offset + entries.length : null; }
    else if (a.c.servico === 'qase') { const r = paginaQase.parse(await lerComCredencial(a, '/v1/project?' + parametrosDaUrl({ offset: p.offset, limit: p.limite }))); entries = r.result.entities; total = r.result.total; next = p.offset + entries.length < total ? p.offset + entries.length : null; }
    else { const r = objetos.parse(await lerComCredencial(a, '/user/repos?' + parametrosDaUrl({ per_page: p.limite, page: Math.floor(p.offset / p.limite) + 1, sort: 'full_name' }))); entries = r; next = r.length === p.limite ? p.offset + r.length : null; }
    return { recursos: entries.map(e => recursoDaResposta(a.c, e)), total, proxima: next, consultadoEm: new Date().toISOString(), cache: false, origem: a.c.instancia };
  } catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_RESPONSE_INVALID'); }
}

export function lerEnvelopeDaConsulta(c: ConfigServico, bruto: unknown, plano: PlanoDaConsulta, operacao: OperacaoServico, p: z.output<typeof paginaSchema>): { dados: unknown; proxima: string | number | null } {
  if (plano.envelope === 'qase-page') { const b = paginaQase.parse(bruto); return { dados: b.result.entities, proxima: p.offset + b.result.entities.length < (b.result.filtered ?? b.result.total) ? p.offset + b.result.entities.length : null }; }
  if (plano.envelope === 'qase-item') return { dados: itemQase.parse(bruto).result, proxima: null };
  if (plano.envelope === 'array') { const dados = (operacao === 'campos' ? z.array(obj).max(1000) : objetos).parse(bruto); return { dados, proxima: c.servico === 'github' && dados.length === p.limite ? p.offset + p.limite : null }; }
  if (plano.envelope === 'object') return { dados: obj.parse(bruto), proxima: null };
  const b = obj.parse(bruto); const dados = objetos.parse(b[plano.colecao!]);
  if (plano.envelope === 'jira-cursor') {
    if (b.isLast === true) return { dados, proxima: null };
    if (typeof b.nextPageToken !== 'string') throw new Error();
    return { dados, proxima: b.nextPageToken };
  }
  const total = z.number().int().nonnegative().parse(b.total ?? b.total_count);
  return { dados, proxima: p.offset + dados.length < total ? p.offset + dados.length : null };
}
