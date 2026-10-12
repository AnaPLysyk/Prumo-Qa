/** Interrompe com um código de erro do conhecimento (ex.: KNOWLEDGE_NOT_FOUND). */

export function falharConhecimento(codigo: string): never { throw Object.assign(new Error(codigo), { codigo }); }
