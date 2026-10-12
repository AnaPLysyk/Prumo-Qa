/** Esconde segredos num texto (tokens, senhas, chaves privadas, URLs com senha) trocando-os por [REDACTED]. */

export function mascarar(s: string, segredos: string[] = []) {
  for (const v of segredos.filter(v => v.length >= 4).sort((a,b) => b.length-a.length)) s = s.split(v).join('[REDACTED]');
  return s.replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?(?:-----END [^-]*PRIVATE KEY-----|$)/g, '[REDACTED KEY]')
    // Bearer primeiro: em "Authorization: Bearer <token>" a regra genérica abaixo consumiria só a palavra "Bearer".
    .replace(/\bBearer\s+[\w.+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(/((?:password|passwd|token|secret|api[_-]?key|authorization)\s*["']?\s*[:=]\s*["']?)([^\s,"'}]+)/gi, '$1[REDACTED]')
    .replace(/\b(?:gh[pousr]_[\w]+|sk-[\w-]{15,}|eyJ[\w-]+\.[\w-]+\.[\w-]+)\b/g, '[REDACTED]')
    .replace(/(https?:\/\/)[^/\s:@]+:[^/\s@]+@/g, '$1[REDACTED]@');
}
