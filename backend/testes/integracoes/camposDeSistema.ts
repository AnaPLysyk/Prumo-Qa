/** Lê os campos de sistema do Qase (prioridade, severidade...). */
import { z } from 'zod';
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';

export const camposDeSistema = async (ctx: ContextoServico) => z.object({ result: z.array(z.record(z.unknown())).default([]) }).passthrough().parse(await ctx.ler('/v1/system_field')).result.slice(0, 40).map(c => ctx.limpar(c));
