/** Operação "Criar caso de teste no Qase", ligando ao ticket de origem quando informado. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto.js';
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';
import { DefOperacao, Remoto } from '../../conexoes/tipos/operacao.js';
import { acharCasoNoQase } from './pesquisasQase.js';
import { associarCasoAoTicket } from './vinculosComTickets.js';
import { automacaoLida } from './automacaoNoQase.js';
import { corpoDoCasoQase } from '../integracaoFormatosQase.js';
import { idCriadoNoQase } from '../integracaoFormatosQase.js';
import { esquemaCaso } from '../tipos/escritaQase.js';

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
