/** Confere se o agente existe. */
import { falharConhecimento } from './falharConhecimento.js';
import { idsAgentes } from '../tipos/conhecimento.js';

export const validarAgenteDoConhecimento = (a: string | null | undefined) => { if (a != null && !idsAgentes.has(a)) falharConhecimento('KNOWLEDGE_AGENT_UNKNOWN'); return a ?? null; };
