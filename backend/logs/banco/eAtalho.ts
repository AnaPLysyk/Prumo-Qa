/** Diz se um caminho é um atalho (link). */
import fs from 'node:fs';

export const eAtalho = (alvo: string) => { try { return fs.lstatSync(alvo).isSymbolicLink(); } catch { return false; } };
