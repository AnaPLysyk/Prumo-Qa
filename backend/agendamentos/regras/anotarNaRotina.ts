/** Anota um acontecimento no histórico da rotina, guardando os 200 últimos. */
import { z } from 'zod';
import { Rotina, evento } from '../tipos/rotina.js';

export const anotarNaRotina = (r: Rotina, acao: z.infer<typeof evento>['acao']) => { r.historico.push({ at: new Date().toISOString(), acao }); r.historico = r.historico.slice(-200); };
