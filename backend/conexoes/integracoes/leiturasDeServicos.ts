/** Leituras Jira Qase GitHub, detalhes e consultas — arquivos relacionados agrupados para manutenção. */
import { z } from "zod";
import { Recurso } from "../../projetos/contratos.js";
import { OperacaoServico, nome, obj, ContextoServico, PartesDoAdaptador, objetos, paginaQase, ConfigServico, PlanoDaConsulta, itemQase } from "../tipos/adaptador.js";
import { ErroServico } from "./ErroServico.js";
import { cabecalhosDoServico } from "./configuracaoDosServicos.js";
import { lerComCredencial } from "./requisicoes.js";
import { limparRespostaDoServico, parametrosDaUrl, recursoDaResposta, saidaDaConsulta } from "./configuracaoDosServicos.js";
import { paginaSchema } from "../tipos/transporte.js";
import { ParametrosConsulta, ResultadoConsulta } from "../tipos/adaptador.js";
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { projetoDoTicket, camposDoTipo, tiposDeCriacao, transicoesDoTicket, jqlDeTickets } from "../../tickets/integracoesJira.js";
import { Filtros, OperacaoExtra, Pg, operacoesExtras } from "../tipos/adaptador.js";
import { consultarPlanoQase, consultarCamposSistemaQase, consultarAmbientesQase, consultarCamposPersonalizadosQase, consultarMarcosQase, planoDaConsultaQase } from "./qase.js";
import { consultarArquivosGithub, consultarWorkflowsGithub, consultarJobsGithub, consultarArtefatosGithub, consultarRevisoesGithub, consultarCommitGithub, consultarIssuesGithub, planoDaConsultaGithub } from "./github.js";

// ── leiturasDeServicos ──
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

// ── consultasJira ──
export async function consultarAnexosJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec, id, ticket } = parametros;
  if (ctx.servico !== 'jira') return null; await projetoDoTicket(ctx, rec, ticket());
        const r = z.object({ fields: z.object({ attachment: z.array(z.object({ id: z.string(), filename: z.string(), size: z.number(), mimeType: z.string().optional(), created: z.string().optional() }).passthrough()).default([]) }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(id!)}?fields=attachment`));
        return { dados: r.fields.attachment.slice(0, 100).map(a => ({ id: a.id, nome: a.filename, bytes: a.size, tipo: a.mimeType ?? null, criado: a.created ?? null })), proxima: null, endpoint: '/rest/api/3/issue/{key}?fields=attachment' };
}

export async function consultarCamposTipoJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec, numero } = parametros;
  if (ctx.servico !== 'jira') return null; return { dados: await camposDoTipo(ctx, rec, numero()), proxima: null, endpoint: `/rest/api/3/issue/createmeta/${rec.chave}/issuetypes/{id}` };
}

export async function consultarHistoricoJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec, p, id, ticket } = parametros;
  if (ctx.servico !== 'jira') return null; await projetoDoTicket(ctx, rec, ticket());
        const r = z.object({ values: z.array(z.object({ id: z.string(), created: z.string(), author: z.object({ displayName: z.string().optional() }).passthrough().optional(), items: z.array(z.object({ field: z.string(), fromString: z.string().nullable().optional(), toString: z.string().nullable().optional() }).passthrough()).default([]) }).passthrough()).default([]), total: z.number().optional(), isLast: z.boolean().optional() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(id!)}/changelog?startAt=${p.offset}&maxResults=${p.limite}`));
        return { dados: r.values.map(h => ({ id: h.id, em: h.created, por: h.author?.displayName ?? null, mudancas: h.items.slice(0, 20).map(i => ({ campo: i.field, de: i.fromString ?? null, para: i.toString ?? null })) })), proxima: r.isLast === false ? p.offset + r.values.length : null, endpoint: '/rest/api/3/issue/{key}/changelog' };
}

export async function consultarMetadadosJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec } = parametros;
  if (ctx.servico !== 'jira') return null; const tipos = await tiposDeCriacao(ctx, rec); return { dados: tipos, proxima: null, endpoint: `/rest/api/3/issue/createmeta/${rec.chave}/issuetypes` };
}

export async function consultarTransicoesJira(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec, ticket } = parametros;
  if (ctx.servico !== 'jira') return null; return { dados: await transicoesDoTicket(ctx, rec, ticket()), proxima: null, endpoint: '/rest/api/3/issue/{key}/transitions' };
}

export async function planoDaConsultaJira(a: PartesDoAdaptador, r: Recurso, operacao: OperacaoServico, p: z.output<typeof paginaSchema>, id?: string, campoAceite?: string, filtros?: Filtros): Promise<PlanoDaConsulta | { pronto: ReturnType<typeof saidaDaConsulta> }> {
  const fields = 'id,key,summary,description,issuetype,status,priority,assignee,reporter,labels,created,parent,subtasks,updated,issuelinks,project' + (campoAceite ? ',' + campoAceite : '');
  if (operacao === 'tickets') return { endpoint: '/rest/api/3/search/jql?' + parametrosDaUrl({ jql: jqlDeTickets(r.id, filtros), fields, maxResults: p.limite, nextPageToken: p.cursor }), colecao: 'issues', envelope: 'jira-cursor' };
  if (operacao === 'campos') return { endpoint: '/rest/api/3/field', envelope: 'array' };
  if (operacao !== 'ticket' && operacao !== 'comentarios') throw new ErroServico('SERVICE_WRITE_BLOCKED');
  if (!id || !/^[A-Z][A-Z0-9_]*-\d+$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  const detalhe = obj.parse(await lerComCredencial(a, '/rest/api/3/issue/' + codificarParaUrl(id) + '?' + parametrosDaUrl({ fields })));
  if (String((obj.parse(detalhe.fields).project as { id?: unknown })?.id) !== r.id) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  if (operacao === 'ticket') return { pronto: saidaDaConsulta(a.c, detalhe, undefined, r, '/rest/api/3/issue/' + codificarParaUrl(id)) };
  return { endpoint: '/rest/api/3/issue/' + codificarParaUrl(id) + '/comment?' + parametrosDaUrl({ startAt: p.offset, maxResults: p.limite }), colecao: 'comments', envelope: 'jira-offset' };
}

// ── lerDetalheDoServico ──
export async function lerDetalheDoServico(ctx: ContextoServico, rec: Recurso, op: OperacaoExtra, p: Pg, id?: string, f: Filtros = {}): Promise<ResultadoConsulta> {
  const ticket = () => { if (!id || !/^[A-Z][A-Z0-9_]*-\d+$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID'); return id; };
  const numero = () => { if (!id || !/^\d{1,15}$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID'); return id; };
  const repo = `/repos/${rec.chave.split('/').map(codificarParaUrl).join('/')}`; const pg = `per_page=${p.limite}&page=${Math.floor(p.offset / p.limite) + 1}`;
  const prox = (n: number) => (n === p.limite ? p.offset + n : null);
  const parametros: ParametrosConsulta = { ctx, rec, p, id, f, repo, pg, prox, ticket, numero };
  switch (op) {
    case 'metadados': {
      const resposta = await consultarMetadadosJira(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'campos-tipo': {
      const resposta = await consultarCamposTipoJira(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'transicoes': {
      const resposta = await consultarTransicoesJira(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'anexos': {
      const resposta = await consultarAnexosJira(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'historico': {
      const resposta = await consultarHistoricoJira(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'plano': {
      const resposta = await consultarPlanoQase(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'campos-sistema': {
      const resposta = await consultarCamposSistemaQase(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'arquivos': {
      const resposta = await consultarArquivosGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'workflows': {
      const resposta = await consultarWorkflowsGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'jobs': {
      const resposta = await consultarJobsGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'artefatos': {
      const resposta = await consultarArtefatosGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'revisoes': {
      const resposta = await consultarRevisoesGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'commit': {
      const resposta = await consultarCommitGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'issues': {
      const resposta = await consultarIssuesGithub(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'marcos': {
      const resposta = await consultarMarcosQase(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'ambientes': {
      const resposta = await consultarAmbientesQase(parametros);
      if (resposta !== null) return resposta;
      break;
    }
    case 'campos-personalizados': {
      const resposta = await consultarCamposPersonalizadosQase(parametros);
      if (resposta !== null) return resposta;
      break;
    }
  }
  throw new ErroServico('SERVICE_WRITE_BLOCKED'); // operação não existe neste serviço
}

// ── consultarNoServico ──
export async function consultarNoServico(a: PartesDoAdaptador, r: Recurso, operacao: OperacaoServico, pagina: z.input<typeof paginaSchema> = {}, id?: string, campoAceite?: string, filtros?: Filtros) {
  if (r.instancia !== a.c.instancia || r.contaId !== a.c.contaId) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  const p = paginaSchema.parse(pagina);
  if ((operacoesExtras as readonly string[]).includes(operacao)) {
    try { const x = await lerDetalheDoServico(contextoDoAdaptador(a), r, operacao as OperacaoExtra, { offset: p.offset, limite: p.limite }, id, filtros); return saidaDaConsulta(a.c, x.dados, x.proxima, r, x.endpoint); }
    catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_RESPONSE_INVALID'); }
  }
  if (a.c.servico !== 'qase' && !/^\d{1,20}$/.test(r.id)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  if (campoAceite && !/^customfield_\d+$/.test(campoAceite)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  const plano = a.c.servico === 'jira' ? await planoDaConsultaJira(a, r, operacao, p, id, campoAceite, filtros) : a.c.servico === 'qase' ? planoDaConsultaQase(r, operacao, p, id, filtros) : planoDaConsultaGithub(r, operacao, p, id);
  if ('pronto' in plano) return plano.pronto;
  try {
    let endpoint = plano.endpoint; let limitacao: string | undefined; let bruto: unknown;
    try { bruto = await lerComCredencial(a, endpoint); }
    catch (e) {
      if (!(e instanceof ErroServico && e.codigo === 'SERVICE_PLAN_LIMIT' && /[?&]include=external_issues\b/.test(endpoint))) throw e;
      endpoint = endpoint.replace(/([?&])include=external_issues(&|$)/, (_m, a1, a2) => (a2 ? a1 : '')).replace(/[?&]$/, '');
      limitacao = 'O plano do Qase não libera os vínculos com o Jira (external_issues): os casos aparecem sem eles.';
      bruto = await lerComCredencial(a, endpoint);
    }
    const { dados, proxima } = lerEnvelopeDaConsulta(a.c, bruto, plano, operacao, p);
    return { ...saidaDaConsulta(a.c, conferirEscopoDaConsulta(r, operacao, dados, id), proxima, r, endpoint), ...(limitacao ? { limitacao } : {}) };
  } catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_RESPONSE_INVALID'); }
}
