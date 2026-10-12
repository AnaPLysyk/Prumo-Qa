/** Procura os arquivos de teste na pasta do projeto, pulando node_modules, builds e atalhos, com limites. */
import fs from 'node:fs';
import path from 'node:path';
import { pareceArquivoDeTeste } from './pareceArquivoDeTeste.js';
import { IGNORAR, limites } from '../tipos/catalogoDeTestes.js';

export function coletarArquivosDeTeste(raiz: string): { arquivos: string[]; truncado: boolean } {
  const achados: string[] = []; let truncado = false;
  const andar = (dir: string, nivel: number) => {
    if (truncado || nivel > limites.profundidade) return;
    let itens: fs.Dirent[]; try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const it of itens) {
      if (it.isSymbolicLink()) continue;
      const p = path.join(dir, it.name);
      if (it.isDirectory()) { if (!IGNORAR.has(it.name)) andar(p, nivel + 1); }
      else if (it.isFile() && pareceArquivoDeTeste(it.name)) { if (achados.length >= limites.arquivos) { truncado = true; return; } achados.push(p); }
    }
  };
  andar(raiz, 0); return { arquivos: achados.sort(), truncado };
}
