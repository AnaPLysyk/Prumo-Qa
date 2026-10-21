/** Esconde segredos num texto (tokens, senhas, chaves privadas, URLs com senha) trocando-os por [REDACTED]. */

export function mascarar(s: string, segredos: string[] = []) {
  for (const v of segredos.filter(v => v.length >= 4).sort((a,b) => b.length-a.length)) s = s.split(v).join('[REDACTED]');
  return s.replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?(?:-----END [^-]*PRIVATE KEY-----|$)/g, '[REDACTED KEY]')
    // Bearer primeiro: em "Authorization: Bearer <token>" a regra genérica abaixo consumiria só a palavra "Bearer".
    .replace(/\bBearer\s+[\w.+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(/((?:password|passwd|senha|token|secret|api[_-]?key|authorization)\s*["']?\s*[:=]\s*["']?)([^\s,"'}]+)/gi, '$1[REDACTED]')
    .replace(/\b(?:gh[pousr]_[\w]+|github_pat_\w{20,}|ATATT[\w=-]{20,}|sk-[\w-]{15,}|eyJ[\w-]+\.[\w-]+\.[\w-]+)\b/g, '[REDACTED]')
    // Chaves com prefixo próprio: AWS (AKIA/ASIA), Slack (xox?-) e Google (AIza).
    .replace(/\b(?:(?:AKIA|ASIA)[0-9A-Z]{16}|xox[abposr]-[\w-]{10,}|AIza[\w-]{35})(?![\w-])/g, '[REDACTED]')
    // Usuário e senha embutidos em URLs de qualquer esquema (https, postgres, redis...).
    .replace(/\b([a-z][a-z0-9+.-]*:\/\/)[^/\s:@]+:[^/\s@]+@/gi, '$1[REDACTED]@');
}
