/** Lê o id do item criado numa resposta do Qase. */
import { z } from 'zod';

export const idCriadoNoQase = (v: unknown) => z.object({ result: z.object({ id: z.union([z.number(), z.string()]).transform(String) }).passthrough() }).passthrough().parse(v).result.id;
