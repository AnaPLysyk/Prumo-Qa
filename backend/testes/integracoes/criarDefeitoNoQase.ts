/** Publica defeito Qase autorizado, com marcador de idempotência e confirmação por GET. */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { codificarParaUrl } from '../../compartilhado/texto.js';
import { marcadorDaOperacao } from '../../conexoes/escrita/marcadorDaOperacao.js';
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { camposDeSistema } from '../integracaoFormatosQase.js';
import { idCriadoNoQase } from '../integracaoFormatosQase.js';
import { listarNoQase } from './pesquisasQase.js';
import { criarDefeito } from '../tipos/escritaQase.js';
const corpo = (p: z.infer<typeof criarDefeito>, chave: string) => ({
  title: mascarar(p.titulo),
  actual_result: `${mascarar(p.resultadoAtual)}\n[${marcadorDaOperacao(chave)}]`,
  severity: p.severidade,
  ...(p.marcoId ? { milestone_id: p.marcoId } : {}),
  ...(Object.keys(p.campos ?? {}).length ? { custom_field: Object.fromEntries(Object.entries(p.campos).map(([k, v]) => [k, mascarar(v)])) } : {})
});
const listarDefeitosConfiaveis = async (ctx: Parameters<typeof listarNoQase>[0], rec: Parameters<typeof listarNoQase>[1]) => {
  const itens = await listarNoQase(ctx, rec, 'defect', {});
  if (itens.some(x => typeof x.actual_result !== 'string')) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  return itens;
};
type Ctx = Parameters<typeof listarNoQase>[0];
/**
 * O POST /v1/defect recebe a severidade como número, mas o GET devolve texto (ex.: "major"). O texto é conferido contra a
 * opção de mesmo ID no campo de sistema "severity" do próprio Qase. Sem esse campo, a severidade não é verificável e a
 * identidade fica com título, resultado observado e marcador.
 */
const severidadeConfere = async (ctx: Ctx, remoto: unknown, id: number) => {
  if (typeof remoto === 'number' || (typeof remoto === 'string' && /^\d+$/.test(remoto))) return Number(remoto) === id;
  if (typeof remoto !== 'string' || !remoto.trim()) return false;
  const campos = (await camposDeSistema(ctx)) as Record<string, unknown>[];
  const opcoes = campos.find(c => String(c?.slug).toLowerCase() === 'severity')?.options;
  const opcao = Array.isArray(opcoes) ? (opcoes as Record<string, unknown>[]).find(o => Number(o.id) === id) : undefined;
  if (!opcao) return true;
  const r = remoto.trim().toLowerCase();
  return [opcao.slug, opcao.title].some(x => typeof x === 'string' && x.trim().toLowerCase() === r);
};
// Cada campo enviado precisa voltar com o mesmo valor em custom_fields [{id, value}].
const camposConferem = (remoto: unknown, enviados?: Record<string, string>) => !enviados || Object.entries(enviados).every(([id, v]) =>
  Array.isArray(remoto) && remoto.some(c => c && String((c as Record<string, unknown>).id) === id && String((c as Record<string, unknown>).value) === v));
const mesmo = async (ctx: Ctx, remoto: Record<string, unknown>, p: z.infer<typeof criarDefeito>, chave: string) => {
  const esperado = corpo(p, chave);
  return remoto.title === esperado.title && remoto.actual_result === esperado.actual_result &&
    remoto.severity != null && (p.marcoId === undefined || Number(remoto.milestone_id) === p.marcoId) &&
    camposConferem(remoto.custom_fields, esperado.custom_field) && await severidadeConfere(ctx, remoto.severity, esperado.severity);
};
export const criarDefeitoNoQase: DefOperacao<z.infer<typeof criarDefeito>> = {
  id: 'qase.criar_defeito', servico: 'qase', rotulo: 'Publicar defeito no Qase',
  efeito: 'Cria um defeito somente no projeto Qase vinculado, depois de confirmação nativa.',
  exigeConfirmacao: true, schema: criarDefeito,
  resumo: p => `Publicar defeito "${p.titulo}" (severidade ${p.severidade}${p.marcoId ? `, milestone ${p.marcoId}` : ""}${Object.keys(p.campos ?? {}).length ? `, ${Object.keys(p.campos).length} campo(s) personalizado(s)` : ""}) no Qase`,
  async executar(ctx, rec, p, chave) {
    const lista = await listarDefeitosConfiaveis(ctx, rec);
    let ja = false; for (const x of lista) if (await mesmo(ctx, x, p, chave)) { ja = true; break; }
    if (ja) throw new ErroServico('SERVICE_DUPLICATE');
    const id = idCriadoNoQase(await ctx.enviar('POST',
      `/v1/defect/${codificarParaUrl(rec.chave)}`, JSON.stringify(corpo(p, chave))));
    return { id, chave: `${rec.chave}-${id}` };
  },
  async reconciliar(ctx, rec, p, chave, anterior) {
    if (anterior?.id) {
      const resposta = z.object({ result: z.record(z.unknown()) }).passthrough().parse(
        await ctx.ler(`/v1/defect/${codificarParaUrl(rec.chave)}/${codificarParaUrl(anterior.id)}`));
      if (!(await mesmo(ctx, resposta.result, p, chave))) throw new ErroServico('SERVICE_RESPONSE_INVALID');
      return { id: anterior.id, chave: `${rec.chave}-${anterior.id}` };
    }
    const encontrados = (await listarDefeitosConfiaveis(ctx, rec)).filter(x =>
      x.actual_result != null && String(x.actual_result).includes(`[${marcadorDaOperacao(chave)}]`));
    if (encontrados.length > 1) throw new ErroServico('SERVICE_RESPONSE_INVALID');
    const x = encontrados[0];
    if (!x) return null;
    if (!(await mesmo(ctx, x, p, chave))) throw new ErroServico('SERVICE_RESPONSE_INVALID');
    return { id: String(x.id), chave: `${rec.chave}-${x.id}` };
  },
  async confirmar(ctx, rec, p, r, chave) {
    if (!r.id || !/^\d+$/.test(r.id)) return false;
    const resposta = z.object({ result: z.record(z.unknown()) }).passthrough().parse(
      await ctx.ler(`/v1/defect/${codificarParaUrl(rec.chave)}/${codificarParaUrl(r.id)}`));
    return String(resposta.result.id) === r.id && await mesmo(ctx, resposta.result, p, chave);
  }
};
