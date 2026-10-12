/** Executa uma consulta e, se der erro, usa o valor padrão (a conversa não quebra por uma consulta). */

export const tentarOuPadrao = <T>(fn: () => T, padrao: T): T => { try { return fn(); } catch { return padrao; } };
