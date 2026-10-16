/** Lê a lista de itens de uma resposta paginada do Qase. */
import { z } from 'zod';
import { Pagina } from '../tipos/escritaQase.js';

export const itensDaPaginaQase = (v: unknown): Pagina => z.object({ result: z.object({ entities: z.array(z.record(z.unknown())), total: z.number().int().nonnegative().optional(), filtered: z.number().int().nonnegative().optional() }).passthrough() }).passthrough().parse(v).result;
