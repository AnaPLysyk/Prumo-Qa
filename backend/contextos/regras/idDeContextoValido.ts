/** Diz se o identificador de um contexto é um UUID válido. */
import { z } from 'zod';

export const idDeContextoValido = (id: string) => z.string().uuid().safeParse(id).success;
