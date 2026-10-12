/** Confere se o identificador de uma credencial é um UUID válido. */
import { z } from 'zod';

export const validarIdDaCredencial=(id:string)=>z.string().uuid().parse(id);
