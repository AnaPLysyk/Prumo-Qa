/** Diz se uma autorização ainda vale (não revogada e não vencida). */

export const autorizacaoVigente = (validaAte: string, revogada: string | null, agora: Date) => !revogada && Date.parse(validaAte) > agora.getTime();
