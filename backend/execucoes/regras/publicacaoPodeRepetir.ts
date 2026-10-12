/** Diz se vale tentar publicar de novo (tempo esgotado, serviço fora ou limite de consultas). */

export const publicacaoPodeRepetir = (cod: string) => ['SERVICE_TIMEOUT', 'SERVICE_UNAVAILABLE', 'SERVICE_RATE_LIMIT'].includes(cod);
