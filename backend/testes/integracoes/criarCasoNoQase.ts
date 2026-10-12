/** Operação "Criar caso de teste no Qase", ligando ao ticket de origem quando informado. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';
import { DefOperacao, Remoto } from '../../conexoes/tipos/operacao.js';
import { acharCasoNoQase } from './acharCasoNoQase.js';
import { associarCasoAoTicket } from './associarCasoAoTicket.js';
import { corpoDoCasoQase } from './corpoDoCasoQase.js';
import { idCriadoNoQase } from './idCriadoNoQase.js';
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
  async reconciliar(ctx, rec, p) { const c = await acharCasoNoQase(ctx, rec, p); return c ? { id: String(c.id), chave: `${rec.chave}-${c.id}`, detalhes: { titulo: p.titulo } } : null; },
  async confirmar(ctx, rec, _p, r) { const c = z.object({ result: z.object({ id: z.number() }).passthrough() }).passthrough().parse(await ctx.ler(`/v1/case/${codificarParaUrl(rec.chave)}/${codificarParaUrl(r.id!)}`)); return String(c.result.id) === r.id; }
};
