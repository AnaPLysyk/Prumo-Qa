/** Confere o id do projeto de um conhecimento. */
import { falharConhecimento } from './falharConhecimento.js';
import { uuid } from '../tipos/conhecimento.js';

export const validarProjetoDoConhecimento = (e: string | null | undefined) => { if (e != null && !uuid.test(e)) falharConhecimento('KNOWLEDGE_SCOPE_INVALID'); return e ?? null; };
