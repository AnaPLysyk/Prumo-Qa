/** Trata um valor como objeto (ou objeto vazio se não for). */

export const comoObjeto = (v:unknown):Record<string,unknown> => v!==null && typeof v==='object' && !Array.isArray(v) ? v as Record<string,unknown> : {};
