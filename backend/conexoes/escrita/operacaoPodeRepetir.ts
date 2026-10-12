/** Diz se vale tentar a operação de novo (tempo, indisponível, limite, resposta inválida). */

export const operacaoPodeRepetir = (c: string) => ['SERVICE_TIMEOUT', 'SERVICE_UNAVAILABLE', 'SERVICE_RATE_LIMIT', 'SERVICE_RESPONSE_INVALID'].includes(c);
