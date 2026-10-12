/** Escreve um objeto sempre na mesma ordem de campos, para gerar a mesma chave. */

export function textoCanonico(v: unknown): string { if (Array.isArray(v)) return '[' + v.map(textoCanonico).join(',') + ']'; if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + textoCanonico((v as Record<string, unknown>)[k])).join(',') + '}'; return JSON.stringify(v); }
