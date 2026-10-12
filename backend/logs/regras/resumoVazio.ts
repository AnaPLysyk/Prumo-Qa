/** Resumo vazio de achados (tudo zero). */
import { z } from 'zod';
import { resumoSchema } from '../tipos/atividade.js';

export const resumoVazio = ():z.infer<typeof resumoSchema> => ({findings:0,recommendations:0,gaps:0,candidateRedundancies:0,types:[]});
