/** Cria e edita casos e suítes no Qase, mantendo validações e contratos de escrita. */
import { z } from "zod";
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { ErroServico } from "../../conexoes/integracoes/ErroServico.js";
import { DefOperacao, Remoto } from "../../conexoes/tipos/operacao.js";
import { acharCasoNoQase, listarNoQase, tituloComparavel } from "./pesquisasQase.js";
import { associarCasoAoTicket } from "./vinculosComTickets.js";
import { automacaoLida, flagsDeAutomacao } from "./automacaoNoQase.js";
import { corpoDoCasoQase, idCriadoNoQase } from "./formatosQase.js";
import { esquemaCaso, editarCaso, criarSuite } from "../tipos/escritaQase.js";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";

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
  id: 'qase.editar_caso', servico: 'qase', rotulo: 'Editar caso de teste no Qase', efeito: 'Altera título, descrição, pré-condições, passos, prioridade ou automação de um caso existente do projeto vinculado.', exigeConfirmacao: true, schema: editarCaso,
  resumo: p => `Editar caso ${p.casoId}: ${Object.keys(p).filter(k => k !== 'casoId').join(', ')}`,
  async executar(ctx, rec, p) {
    await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}`); // 404 se o caso não pertence ao projeto vinculado
    const c: Record<string, unknown> = {}; if (p.titulo !== undefined) c.title = mascarar(p.titulo); if (p.descricao !== undefined) c.description = mascarar(p.descricao); if (p.preCondicoes !== undefined) c.preconditions = mascarar(p.preCondicoes);
    if (p.passos) { c.steps = p.passos.map(s => ({ action: mascarar(s.acao), expected_result: mascarar(s.esperado), data: mascarar(s.dados) })); c.steps_type = 'classic'; } if (p.prioridade !== undefined) c.priority = p.prioridade;
    if (p.automacao) Object.assign(c, flagsDeAutomacao(p.automacao));
    await ctx.enviar('PATCH', `/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}`, JSON.stringify(c)); return { id: String(p.casoId), chave: `${rec.chave}-${p.casoId}` };
  },
  async confirmar(ctx, rec, p) {
    const c = z.object({ result: z.object({
      title: z.string().optional(), description: z.string().nullable().optional(),
      preconditions: z.string().nullable().optional(), priority: z.number().nullable().optional(),
      steps: z.array(z.object({ action: z.string(), expected_result: z.string().nullable().optional(), data: z.string().nullable().optional() }).passthrough()).optional(),
      isManual: z.union([z.boolean(), z.number()]).optional(), isToBeAutomated: z.union([z.boolean(), z.number()]).optional(), automation: z.number().nullable().optional()
    }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${p.casoId}`)).result;
    if (p.titulo !== undefined && c.title !== mascarar(p.titulo)) return false;
    if (p.descricao !== undefined && c.description !== mascarar(p.descricao)) return false;
    if (p.preCondicoes !== undefined && c.preconditions !== mascarar(p.preCondicoes)) return false;
    if (p.prioridade !== undefined && c.priority !== p.prioridade) return false;
    if (p.passos !== undefined && (c.steps?.length !== p.passos.length || p.passos.some((s, i) => c.steps?.[i]?.action !== mascarar(s.acao) || (c.steps?.[i]?.expected_result ?? '') !== mascarar(s.esperado) || (c.steps?.[i]?.data ?? '') !== mascarar(s.dados)))) return false;
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
