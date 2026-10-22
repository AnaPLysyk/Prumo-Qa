/** casosQase: operações reunidas por responsabilidade. */
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { ContextoServico } from "../../conexoes/tipos/adaptador.js";
import { Recurso } from "../../projetos/contratos.js";
import { z } from "zod";
import { DefOperacao, Remoto } from "../../conexoes/tipos/operacao.js";
import { associarTicket, esquemaCaso, editarCaso, editarSuite, apagarSuite, criarSuite, Pagina } from "../tipos/escritaQase.js";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";
import { ErroServico } from "../../conexoes/integracoes/configuracaoDosServicos.js";

// Operações de casosQase
// ── vinculosComTickets ──
export const associarCasoAoTicket = (ctx: ContextoServico, rec: Recurso, casoId: string, t: string) =>
  ctx.enviar('POST', `/v1/case/${codificarParaUrl(rec.chave)}/external-issue/attach`, JSON.stringify({ type: 'jira-cloud', links: [{ case_id: Number(casoId), external_issues: [t] }] }));

export const associarTicketAoCasoNoQase: DefOperacao<z.infer<typeof associarTicket>> = {
  id: 'qase.associar_ticket', servico: 'qase', rotulo: 'Associar caso do Qase a ticket do Jira', efeito: 'Registra no Qase o ticket Jira (jira-cloud) de origem do caso.', exigeConfirmacao: true, schema: associarTicket,
  resumo: p => `Associar caso ${p.casoId} ao ticket ${p.ticket}`,
  async executar(ctx, rec, p) { await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}`); await associarCasoAoTicket(ctx, rec, String(p.casoId), p.ticket); return { id: String(p.casoId), chave: p.ticket }; },
  async reconciliar(ctx, rec, p) {
    const c = z.object({ result: z.object({ external_issues: z.array(z.object({ type: z.string().optional(), issues: z.array(z.object({ id: z.string() }).passthrough()).default([]) }).passthrough()).default([]) }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}?include=external_issues`));
    return c.result.external_issues.some(g => g.type === 'jira-cloud' && g.issues.some(i => i.id === p.ticket)) ? { id: String(p.casoId), chave: p.ticket } : null;
  },
  async confirmar(ctx, rec, p) {
    const c = z.object({ result: z.object({
      external_issues: z.array(z.object({
        type: z.string().optional(), issues: z.array(z.object({ id: z.string() }).passthrough()).default([])
      }).passthrough()).default([])
    }).passthrough() }).passthrough().parse(
      await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}?include=external_issues`)
    );
    return c.result.external_issues.some(g => g.type === 'jira-cloud' && g.issues.some(i => i.id === p.ticket));
  }
};

// ── automacaoNoQase ──
/** Converte o tipo de automação do caso para o formato do Qase (0/1 no envio) e lê qualquer formato que o Qase devolva. */
// A documentação descreve isManual/isToBeAutomated como boolean, mas a API real (homologada em 15/10/2026) recusa true/false:
// "Allowed values: 0, 1". A leitura aceita boolean, 0/1 ou o campo antigo `automation` (0 manual, 1 a automatizar, 2 automatizado).
type Automacao = 'manual' | 'a-automatizar' | 'automatizado';

export const flagsDeAutomacao = (a: Automacao) => ({ isManual: a === 'automatizado' ? 0 : 1, isToBeAutomated: a === 'a-automatizar' ? 1 : 0 });

const comoBool = (v: unknown) => (v === true || v === 1 ? true : v === false || v === 0 ? false : undefined);

export function automacaoLida(c: { isManual?: unknown; isToBeAutomated?: unknown; automation?: unknown }): Automacao | undefined {
  const manual = comoBool(c.isManual), aAutomatizar = comoBool(c.isToBeAutomated);
  if (manual !== undefined) return !manual ? 'automatizado' : aAutomatizar ? 'a-automatizar' : 'manual';
  return c.automation === 0 ? 'manual' : c.automation === 1 ? 'a-automatizar' : c.automation === 2 ? 'automatizado' : undefined;
}

// ── formatosQase ──
/** Confere casos do plano/run releitos do Qase: IDs, não apenas quantidade. */
export const conferirIdsDoObjetoQase = (valor: unknown, esperados: number[]): boolean => {
  if (!Array.isArray(valor)) return false;
  const ids = valor.map((x: unknown): number | null => {
    const candidato = typeof x === 'number' || typeof x === 'string'
      ? x
      : x !== null && typeof x === 'object' && ('id' in x || 'case_id' in x)
        ? ('case_id' in x ? x.case_id : x.id) : null;
    if ((typeof candidato !== 'number' && typeof candidato !== 'string') || String(candidato).trim() === '') return null;
    const id = Number(candidato);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  });
  if (ids.includes(null)) return false;
  const esperadosUnicos = new Set(esperados);
  const lidosUnicos = new Set(ids);
  return ids.length === lidosUnicos.size && lidosUnicos.size === esperadosUnicos.size &&
    [...esperadosUnicos].every(id => lidosUnicos.has(id));
};

/** Passo BDD vira "Dado …" no Qase; passo normal segue como ação, dados e resultado esperado. */
const passoParaQase = (s: { acao: string; esperado: string; dados: string; formato?: string; palavra?: string }) =>
  ({ action: mascarar(s.formato === 'bdd' && s.palavra ? s.palavra + ' ' + s.acao : s.acao), expected_result: mascarar(s.esperado), data: mascarar(s.dados) });

export const corpoDoCasoQase = (p: z.infer<typeof esquemaCaso>) => ({
  title: mascarar(p.titulo), description: mascarar(p.descricao), preconditions: mascarar(p.preCondicoes), postconditions: mascarar(p.posCondicoes),
  steps: p.passos.map(passoParaQase), steps_type: 'classic',
  ...flagsDeAutomacao(p.automacao), tags: p.tags,
  ...(p.suiteId ? { suite_id: p.suiteId } : {}), ...(p.prioridade !== undefined ? { priority: p.prioridade } : {}), ...(p.severidade !== undefined ? { severity: p.severidade } : {}), ...(p.tipo !== undefined ? { type: p.tipo } : {}),
  ...(p.status !== undefined ? { status: p.status } : {}), ...(p.comportamento !== undefined ? { behavior: p.comportamento } : {}), ...(p.camada !== undefined ? { layer: p.camada } : {}), ...(p.instavel !== undefined ? { is_flaky: p.instavel ? 1 : 0 } : {})
});

export const camposDeSistema = async (ctx: ContextoServico) => z.object({ result: z.array(z.record(z.unknown())).default([]) }).passthrough().parse(await ctx.ler('/v1/system_field')).result.slice(0, 40).map(c => ctx.limpar(c));

export const idCriadoNoQase = (v: unknown) => z.object({ result: z.object({ id: z.union([z.number(), z.string()]).transform(String) }).passthrough() }).passthrough().parse(v).result.id;

// ── casosQase ──
export const criarCasoNoQase: DefOperacao<z.infer<typeof esquemaCaso>> = {
  id: 'qase.criar_caso', servico: 'qase', rotulo: 'Criar caso de teste no Qase', efeito: 'Cria um caso (com passos e resultado esperado) no projeto Qase vinculado e, se informado, o associa ao ticket Jira de origem. Casos com o mesmo título na mesma suite não são duplicados.', exigeConfirmacao: true, schema: esquemaCaso,
  resumo: p => `Criar caso "${p.titulo}" (${p.passos.length} passo(s), ${p.automacao})${p.ticket ? ` para ${p.ticket}` : ''}`,
  async executar(ctx, rec, p) {
    if (await acharCasoNoQase(ctx, rec, p)) throw new ErroServico('SERVICE_DUPLICATE'); // o mesmo título já existe na suite
    const novo = idCriadoNoQase(await ctx.enviar('POST', `/v1/case/${codificarParaUrl(rec.chave)}`, JSON.stringify(corpoDoCasoQase(p))));
    const r: Remoto = { id: novo, chave: `${rec.chave}-${novo}`, detalhes: { titulo: p.titulo } };
    if (p.ticket) { try { await associarCasoAoTicket(ctx, rec, novo, p.ticket); r.detalhes!.ticket = p.ticket; } catch (e) { r.detalhes!.ticket = 'FALHOU:' + ((e as ErroServico).codigo ?? 'ERRO'); } }
    return r;
  },
  async reconciliar(ctx, rec, p, _chave, anterior) {
    if (anterior?.id) {
      // O ID vem do registro anterior da mesma chave de operação e do mesmo vínculo/conexão.
      if (!/^\d+$/.test(anterior.id)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
      const conferir = criarCasoNoQase.confirmar;
      if (!conferir) throw new ErroServico('SERVICE_RESPONSE_INVALID');
      const comprovado = await conferir(ctx, rec, { ...p, ticket: undefined }, anterior, _chave);
      if (!comprovado) throw new ErroServico('SERVICE_RESPONSE_INVALID');
      if (p.ticket) {
        const resposta = z.object({ result: z.object({
          external_issues: z.array(z.object({
            type: z.string().optional(), issues: z.array(z.object({ id: z.string() }).passthrough()).default([])
          }).passthrough()).default([])
        }).passthrough() }).passthrough().parse(
          await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${codificarParaUrl(anterior.id)}?include=external_issues`)
        );
        const vinculado = resposta.result.external_issues.some(grupo =>
          grupo.type === 'jira-cloud' && grupo.issues.some(i => i.id === p.ticket));
        if (!vinculado) await associarCasoAoTicket(ctx, rec, anterior.id, p.ticket);
      }
      return { id: anterior.id, chave: `${rec.chave}-${anterior.id}`,
        detalhes: { titulo: p.titulo, ...(p.ticket ? { ticket: p.ticket } : {}) } };
    }
    // Sem ID anterior verificável: não anexar ticket automaticamente a um caso
    // encontrado somente por título. A confirmação completa continuará obrigatória.
    const c = await acharCasoNoQase(ctx, rec, p);
    return c ? { id: String(c.id), chave: `${rec.chave}-${c.id}`, detalhes: { titulo: p.titulo } } : null;
  },
  async confirmar(ctx, rec, p, r) {
    const c = z.object({ result: z.object({
      id: z.union([z.number(), z.string()]).transform(String),
      title: z.string().optional(), description: z.string().nullable().optional(),
      preconditions: z.string().nullable().optional(), postconditions: z.string().nullable().optional(),
      steps: z.array(z.object({ action: z.string(), expected_result: z.string().nullable().optional(),
        data: z.string().nullable().optional() }).passthrough()).optional(),
      isManual: z.union([z.boolean(), z.number()]).optional(), isToBeAutomated: z.union([z.boolean(), z.number()]).optional(), automation: z.number().nullable().optional(),
      suite_id: z.number().nullable().optional(), priority: z.number().nullable().optional(),
      severity: z.number().nullable().optional(), type: z.number().nullable().optional(),
      tags: z.array(z.union([z.string(), z.object({ title: z.string() }).passthrough()])).optional(),
      external_issues: z.array(z.object({ type: z.string().optional(), issues: z.array(z.object({ id: z.string() }).passthrough()).optional() }).passthrough()).optional()
    }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${codificarParaUrl(r.id!)}${p.ticket ? '?include=external_issues' : ''}`)).result;
    const esperado = corpoDoCasoQase(p);
    if (c.id !== r.id || c.title !== esperado.title) return false;
    if ((c.description ?? '') !== esperado.description ||
        (c.preconditions ?? '') !== esperado.preconditions ||
        (c.postconditions ?? '') !== esperado.postconditions) return false;
    if (c.steps?.length !== esperado.steps.length || esperado.steps.some((s, i) =>
      c.steps?.[i]?.action !== s.action || (c.steps?.[i]?.data ?? '') !== s.data ||
      (c.steps?.[i]?.expected_result ?? '') !== s.expected_result)) return false;
    if (automacaoLida(c) !== p.automacao) return false;
    if (p.suiteId !== undefined && c.suite_id !== p.suiteId) return false;
    if (p.prioridade !== undefined && c.priority !== p.prioridade) return false;
    if (p.severidade !== undefined && c.severity !== p.severidade) return false;
    if (p.tipo !== undefined && c.type !== p.tipo) return false;
    if (p.tags.length && (c.tags === undefined ||
      p.tags.some(t => !c.tags!.some(tag => (typeof tag === 'string' ? tag : tag.title) === t)))) return false;
    // A operação promete criar o caso e associá-lo ao Jira: um deles sem o outro não é CONFIRMADA.
    if (p.ticket && !c.external_issues?.some(grupo =>
      grupo.type === 'jira-cloud' && grupo.issues?.some(issue => issue.id === p.ticket))) return false;
    return true;
  }
};

export const editarCasoNoQase: DefOperacao<z.infer<typeof editarCaso>> = {
  id: 'qase.editar_caso', servico: 'qase', rotulo: 'Editar caso de teste no Qase', efeito: 'Altera título, descrição, pré e pós-condições, passos, severidade, prioridade, tipo, status (inclusive marcar como obsoleto), comportamento, camada, tags ou automação de um caso existente do projeto vinculado.', exigeConfirmacao: true, schema: editarCaso,
  resumo: p => `Editar caso ${p.casoId}: ${Object.keys(p).filter(k => k !== 'casoId').join(', ')}`,
  async executar(ctx, rec, p) {
    await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}`); // 404 se o caso não pertence ao projeto vinculado
    const c: Record<string, unknown> = {}; if (p.titulo !== undefined) c.title = mascarar(p.titulo); if (p.descricao !== undefined) c.description = mascarar(p.descricao); if (p.preCondicoes !== undefined) c.preconditions = mascarar(p.preCondicoes); if (p.posCondicoes !== undefined) c.postconditions = mascarar(p.posCondicoes);
    if (p.passos) { c.steps = p.passos.map(passoParaQase); c.steps_type = 'classic'; } if (p.prioridade !== undefined) c.priority = p.prioridade;
    if (p.severidade !== undefined) c.severity = p.severidade; if (p.tipo !== undefined) c.type = p.tipo; if (p.status !== undefined) c.status = p.status; if (p.comportamento !== undefined) c.behavior = p.comportamento; if (p.camada !== undefined) c.layer = p.camada; if (p.instavel !== undefined) c.is_flaky = p.instavel ? 1 : 0; if (p.tags !== undefined) c.tags = p.tags;
    if (p.automacao) Object.assign(c, flagsDeAutomacao(p.automacao));
    await ctx.enviar('PATCH', `/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}`, JSON.stringify(c)); return { id: String(p.casoId), chave: `${rec.chave}-${p.casoId}` };
  },
  async confirmar(ctx, rec, p) {
    const c = z.object({ result: z.object({
      title: z.string().optional(), description: z.string().nullable().optional(),
      preconditions: z.string().nullable().optional(), priority: z.number().nullable().optional(), severity: z.number().nullable().optional(), type: z.number().nullable().optional(), status: z.union([z.number(), z.string()]).nullable().optional(),
      postconditions: z.string().nullable().optional(), behavior: z.union([z.number(), z.string()]).nullable().optional(), layer: z.union([z.number(), z.string()]).nullable().optional(),
      tags: z.array(z.union([z.string(), z.object({ title: z.string() }).passthrough()])).optional(),
      steps: z.array(z.object({ action: z.string(), expected_result: z.string().nullable().optional(), data: z.string().nullable().optional() }).passthrough()).optional(),
      isManual: z.union([z.boolean(), z.number()]).optional(), isToBeAutomated: z.union([z.boolean(), z.number()]).optional(), automation: z.number().nullable().optional()
    }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}`)).result;
    if (p.titulo !== undefined && c.title !== mascarar(p.titulo)) return false;
    if (p.descricao !== undefined && c.description !== mascarar(p.descricao)) return false;
    if (p.preCondicoes !== undefined && c.preconditions !== mascarar(p.preCondicoes)) return false;
    if (p.prioridade !== undefined && c.priority !== p.prioridade) return false;
    if (p.severidade !== undefined && c.severity !== p.severidade) return false;
    if (p.tipo !== undefined && c.type !== p.tipo) return false;
    if (p.status !== undefined && ({ actual: 0, draft: 1, deprecated: 2 } as Record<string, number>)[String(c.status)] !== p.status && Number(c.status) !== p.status) return false;
    if (p.posCondicoes !== undefined && (c.postconditions ?? '') !== mascarar(p.posCondicoes)) return false;
    if (p.comportamento !== undefined && Number(c.behavior) !== p.comportamento) return false;
    if (p.camada !== undefined && Number(c.layer) !== p.camada) return false;
    if (p.tags !== undefined && p.tags.some(t => !c.tags?.some(tag => (typeof tag === 'string' ? tag : tag.title) === t))) return false;
    if (p.passos !== undefined && (c.steps?.length !== p.passos.length || p.passos.some((s, i) => c.steps?.[i]?.action !== passoParaQase(s).action || (c.steps?.[i]?.expected_result ?? '') !== mascarar(s.esperado) || (c.steps?.[i]?.data ?? '') !== mascarar(s.dados)))) return false;
    if (p.automacao !== undefined && automacaoLida(c) !== p.automacao) return false;
    return true;
  }
};

const mesmaSuite = (s: Record<string, unknown>, p: z.infer<typeof criarSuite>) =>
  tituloComparavel(String(s.title)) === tituloComparavel(p.titulo) &&
  (p.paiId === undefined ? (s.parent_id == null || s.parent_id === 0) : Number(s.parent_id) === p.paiId);

export const criarSuiteNoQase: DefOperacao<z.infer<typeof criarSuite>> = {
  id: 'qase.criar_suite', servico: 'qase', rotulo: 'Criar suite no Qase', efeito: 'Cria uma suite no projeto Qase vinculado.', exigeConfirmacao: true, schema: criarSuite,
  resumo: p => `Criar suite "${p.titulo}"`,
  async executar(ctx, rec, p) {
    const ja = (await listarNoQase(ctx, rec, 'suite', { search: p.titulo })).find(s => mesmaSuite(s, p));
    if (ja) throw new ErroServico('SERVICE_DUPLICATE'); // já existe: nunca duplica
    const novo = idCriadoNoQase(await ctx.enviar('POST', `/v1/suite/${codificarParaUrl(rec.chave)}`, JSON.stringify({ title: mascarar(p.titulo), description: mascarar(p.descricao), ...(p.paiId ? { parent_id: p.paiId } : {}) })));
    return { id: novo, detalhes: { titulo: p.titulo } };
  },
  async reconciliar(ctx, rec, p) {
    const s = (await listarNoQase(ctx, rec, 'suite', { search: p.titulo })).find(x => mesmaSuite(x, p));
    return s ? { id: String(s.id), detalhes: { titulo: p.titulo } } : null;
  },
  async confirmar(ctx, rec, p, remoto) {
    const suite = (await listarNoQase(ctx, rec, 'suite', { search: p.titulo }))
      .find(s => String(s.id) === remoto.id);
    return !!suite && mesmaSuite(suite, p) && (suite.description ?? '') === mascarar(p.descricao);
  }
};

export const editarSuiteNoQase: DefOperacao<z.infer<typeof editarSuite>> = {
  id: 'qase.editar_suite', servico: 'qase', rotulo: 'Editar suíte no Qase', efeito: 'Altera o título e a descrição de uma suíte existente do projeto Qase vinculado. Não move nem apaga suítes ou casos.', exigeConfirmacao: true, schema: editarSuite,
  resumo: p => `Editar suíte ${p.suiteId}: ${[p.titulo !== undefined ? 'título' : null, p.descricao !== undefined ? 'descrição' : null].filter(Boolean).join(', ')}`,
  async executar(ctx, rec, p) {
    await ctx.ler(`/v1/suite/${codificarParaUrl(rec.chave)}/${p.suiteId}`); // 404 se a suíte não pertence ao projeto vinculado
    const corpo: Record<string, unknown> = {}; if (p.titulo !== undefined) corpo.title = mascarar(p.titulo); if (p.descricao !== undefined) corpo.description = mascarar(p.descricao);
    await ctx.enviar('PATCH', `/v1/suite/${codificarParaUrl(rec.chave)}/${p.suiteId}`, JSON.stringify(corpo)); return { id: String(p.suiteId), detalhes: { suite: p.suiteId } };
  },
  async confirmar(ctx, rec, p) {
    const s = z.object({ result: z.object({ title: z.string().optional(), description: z.string().nullable().optional() }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/suite/${codificarParaUrl(rec.chave)}/${p.suiteId}`)).result;
    if (p.titulo !== undefined && s.title !== mascarar(p.titulo)) return false;
    if (p.descricao !== undefined && (s.description ?? '') !== mascarar(p.descricao)) return false;
    return true;
  }
};

export const apagarSuiteNoQase: DefOperacao<z.infer<typeof apagarSuite>> = {
  id: 'qase.apagar_suite', servico: 'qase', rotulo: 'Apagar suíte no Qase', efeito: 'Apaga do projeto Qase vinculado uma suíte que não tem casos nem suítes filhas. Se houver qualquer um, nada é apagado.', exigeConfirmacao: true, schema: apagarSuite,
  resumo: p => `Apagar a suíte ${p.suiteId} (vazia) do Qase`,
  async executar(ctx, rec, p) {
    const suite = z.object({ result: z.object({ cases_count: z.number().int().nonnegative().optional() }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/suite/${codificarParaUrl(rec.chave)}/${p.suiteId}`)).result;
    if ((suite.cases_count ?? 0) > 0) throw new ErroServico('SERVICE_WRITE_BLOCKED'); // só suíte vazia
    if ((await listarNoQase(ctx, rec, 'suite', {})).some(s => Number(s.parent_id) === p.suiteId)) throw new ErroServico('SERVICE_WRITE_BLOCKED');
    await ctx.enviar('DELETE', `/v1/suite/${codificarParaUrl(rec.chave)}/${p.suiteId}`, '');
    return { id: String(p.suiteId), detalhes: { suite: p.suiteId } };
  },
  async confirmar(ctx, rec, p) {
    try { await ctx.ler(`/v1/suite/${codificarParaUrl(rec.chave)}/${p.suiteId}`); return false; }
    catch (e) { return e instanceof ErroServico && e.codigo === 'SERVICE_NOT_FOUND'; }
  }
};

// Operações de pesquisasQase
export const acharCasoNoQase = async (ctx: ContextoServico, rec: Recurso, p: { titulo: string; suiteId?: number }) =>
  (await listarNoQase(ctx, rec, 'case', { search: p.titulo, ...(p.suiteId ? { suite_id: p.suiteId } : {}) })).find(c => tituloComparavel(String(c.title)) === tituloComparavel(p.titulo) && (p.suiteId === undefined || Number(c.suite_id) === p.suiteId));

export async function conferirCasosNoQase(ctx: ContextoServico, rec: Recurso, ids: number[]) { for (const c of [...new Set(ids)].slice(0, 500)) await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${c}`); }

/** Simplifica um título (espaços e minúsculas) para comparar casos. */

export const tituloComparavel = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

export const itensDaPaginaQase = (v: unknown): Pagina => z.object({ result: z.object({ entities: z.array(z.record(z.unknown())), total: z.number().int().nonnegative().optional(), filtered: z.number().int().nonnegative().optional() }).passthrough() }).passthrough().parse(v).result;

export async function resultadosDaRun(ctx: ContextoServico, rec: Recurso, runId: number) {
  const todos: Record<string, unknown>[] = [];
  for (let off = 0; off < 1000; off += 100) { const p = itensDaPaginaQase(await ctx.ler(`/v1/result/${codificarParaUrl(rec.chave)}?run=${runId}&limit=100&offset=${off}`)); todos.push(...p.entities); if (p.entities.length < 100) break; }
  return todos;
}

/** Limite finito: se houver mais registros, a operação de escrita não pode assumir ausência de duplicata. */
export async function listarNoQase(ctx: ContextoServico, rec: Recurso, tipo: 'case' | 'run' | 'plan' | 'suite' | 'defect', filtros: Record<string, string | number>, max = 1000) {
  const teto = Math.min(Math.max(1, Math.trunc(max)), 2000);
  const itens: Record<string, unknown>[] = [];
  let offset = 0;
  while (offset < teto) {
    const limite = Math.min(100, teto - offset);
    const q = new URLSearchParams({ limit: String(limite), offset: String(offset) });
    for (const [k, v] of Object.entries(filtros)) q.set(k, String(v));
    const pagina = itensDaPaginaQase(await ctx.ler(`/v1/${tipo}/${codificarParaUrl(rec.chave)}?${q}`));
    const informados = pagina.filtered ?? pagina.total;
    if ((informados !== undefined && informados > teto) ||
        pagina.entities.length > limite ||
        (pagina.entities.length === 0 && informados !== undefined && offset < informados)) {
      throw new ErroServico('SERVICE_RESPONSE_INVALID');
    }
    itens.push(...pagina.entities);
    offset = itens.length;
    if (informados !== undefined) {
      if (offset >= informados) return itens;
      if (pagina.entities.length !== limite) throw new ErroServico('SERVICE_RESPONSE_INVALID');
    } else if (pagina.entities.length < limite) {
      return itens;
    }
  }
  // Não liberar criação/reconciliação se o serviço não permitiu pesquisar todos os registros.
  throw new ErroServico('SERVICE_RESPONSE_INVALID');
}
