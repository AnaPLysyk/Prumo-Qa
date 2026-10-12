/** Ambiente mínimo passado ao CLI do Claude/Codex. */

export const ambienteDaIa = () => Object.fromEntries(['PATH', 'SystemRoot', 'WINDIR', 'USERPROFILE', 'HOME', 'APPDATA', 'LOCALAPPDATA', 'TEMP', 'TMP', 'CODEX_HOME', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'].filter(k => process.env[k]).map(k => [k, process.env[k] as string]));
