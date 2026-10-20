/** Reúne validacoes do conhecimento da funcionalidade, mantendo cada operação identificável pelo nome. */
import { idsAgentes, uuid } from "../tipos/conhecimento.js";

/** Interrompe com um código de erro do conhecimento (ex.: KNOWLEDGE_NOT_FOUND). */

export function falharConhecimento(codigo: string): never { throw Object.assign(new Error(codigo), { codigo }); }

export const validarAgenteDoConhecimento = (a: string | null | undefined) => { if (a != null && !idsAgentes.has(a)) falharConhecimento('KNOWLEDGE_AGENT_UNKNOWN'); return a ?? null; };

export const validarProjetoDoConhecimento = (e: string | null | undefined) => { if (e != null && !uuid.test(e)) falharConhecimento('KNOWLEDGE_SCOPE_INVALID'); return e ?? null; };
