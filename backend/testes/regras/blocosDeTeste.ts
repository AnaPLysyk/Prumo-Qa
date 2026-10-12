/** Separa cada test(...) de um arquivo Playwright com seu título e corpo. */

/** Corpo de cada test( ... ) por contagem de chaves, com linha inicial. Aproximação textual; não é um parser completo. */
export function blocosDeTeste(linhas: string[]) {
  const blocos: { titulo: string; inicio: number; corpo: string }[] = [];
  for (let i = 0; i < linhas.length; i++) {
    const m = /\b(?:test|it)(?:\.(?:only|skip|fixme))?\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/.exec(linhas[i]!); if (!m) continue;
    let prof = 0, aberto = false, corpo = '';
    for (let j = i; j < linhas.length && j < i + 400; j++) { corpo += linhas[j] + '\n'; for (const ch of linhas[j]!) { if (ch === '{') { prof++; aberto = true; } else if (ch === '}') prof--; } if (aberto && prof <= 0) break; }
    blocos.push({ titulo: m[2]!, inicio: i + 1, corpo });
  }
  return blocos;
}
