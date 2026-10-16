/** Operação "Mudar status de defeito no Qase" (em andamento, resolvido ou inválido), com conferência por GET. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { Recurso } from '../../projetos/tipos/espacos.js';
import { statusDefeito } from '../tipos/escritaQase.js';

type P = z.infer<typeof statusDefeito>;

const rotulo: Record<P['status'], string> = { in_progress: 'em andamento', resolved: 'resolvido', invalid: 'inválido' };

const lerDefeito = async (ctx: ContextoServico, rec: Recurso, id: number) => z.object({ result: z.object({ id: z.union([z.number(), z.string()]), status: z.string(), updated_at: z.string().nullable().optional() }).passthrough() }).passthrough()
  .parse(await ctx.ler(`/v1/defect/${codificarParaUrl(rec.chave)}/${id}`)).result;

const remoto = (rec: Recurso, p: P, existente: boolean) => ({ id: String(p.defeitoId), chave: `${rec.chave}-${p.defeitoId}`, detalhes: { status: p.status, existente } });

export const mudarStatusDefeitoNoQase: DefOperacao<P> = {
  id: 'qase.status_defeito', servico: 'qase', rotulo: 'Mudar status de defeito no Qase',
  efeito: 'Muda somente o status do defeito no projeto Qase vinculado. Título, resultado, severidade e anexos não são alterados.',
  exigeConfirmacao: true, schema: statusDefeito,
  resumo: p => `Marcar o defeito ${p.defeitoId} como ${rotulo[p.status]} no Qase`,
  async executar(ctx, rec, p) {
    const atual = await lerDefeito(ctx, rec, p.defeitoId);
    if (atual.status === p.status) return remoto(rec, p, true);
    // Alguém mudou o defeito no Qase depois da leitura: a pessoa precisa ver o estado novo antes de decidir.
    if ((atual.updated_at ?? '') !== p.versao) throw new ErroServico('SERVICE_SCOPE_CHANGED');
    await ctx.enviar('PATCH', `/v1/defect/${codificarParaUrl(rec.chave)}/status/${p.defeitoId}`, JSON.stringify({ status: p.status }));
    return remoto(rec, p, false);
  },
  async reconciliar(ctx, rec, p) { return (await lerDefeito(ctx, rec, p.defeitoId)).status === p.status ? remoto(rec, p, true) : null; },
  async confirmar(ctx, rec, p) { const d = await lerDefeito(ctx, rec, p.defeitoId); return String(d.id) === String(p.defeitoId) && d.status === p.status; }
};
