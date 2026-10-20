/** Consulta plano no serviço correspondente, mantendo as validações de resposta e autorização. */
import { ParametrosConsulta } from '../tipos/ParametrosConsulta.js';
import { ResultadoConsulta } from '../tipos/ResultadoConsulta.js';
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';

export async function consultarPlanoQase(parametros: ParametrosConsulta): Promise<ResultadoConsulta | null> {
  const { ctx, rec, numero } = parametros;
  if (ctx.servico !== 'qase') return null; const r = z.object({ result: z.record(z.unknown()) }).passthrough().parse(await ctx.ler(`/v1/plan/${codificarParaUrl(rec.chave)}/${numero()}`)); return { dados: ctx.limpar(r.result), proxima: null, endpoint: '/v1/plan/{code}/{id}' };
}
