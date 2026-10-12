/** Operação "Encerrar run no Qase". */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { completarRun } from '../tipos/escritaQase.js';

export const encerrarRunNoQase: DefOperacao<z.infer<typeof completarRun>> = {
  id: 'qase.completar_run', servico: 'qase', rotulo: 'Encerrar run no Qase', efeito: 'Marca a run como concluída no Qase. Casos sem resultado continuam sem resultado.', exigeConfirmacao: true, schema: completarRun,
  resumo: p => `Encerrar a run ${p.runId}`,
  async executar(ctx, rec, p) { await ctx.ler(`/v1/run/${codificarParaUrl(rec.chave)}/${p.runId}`); await ctx.enviar('POST', `/v1/run/${codificarParaUrl(rec.chave)}/${p.runId}/complete`, '{}'); return { id: String(p.runId) }; }
};
