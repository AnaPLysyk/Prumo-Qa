/** Procura o executável oficial do k6 nas pastas absolutas do PATH. */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function localizarK6(path_ = process.env.PATH ?? ''): Promise<string | null> {
  const nomes = process.platform === 'win32' ? ['k6.exe'] : ['k6'];
  for (const pasta of path_.split(path.delimiter)) {
    if (!pasta || !path.isAbsolute(pasta)) continue;
    for (const n of nomes) { const c = path.join(pasta, n); try { const st = await fs.stat(c); if (st.isFile()) return c; } catch { /* próximo */ } }
  }
  return null;
}
