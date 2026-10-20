/** Percorre as pastas de documentação, testes e código declaradas no contrato e lista os arquivos que podem ser lidos, com limites. */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ErroQa } from '../erros.js';
import { caminhoSeguro } from '../seguranca/caminhoSeguro.js';
import { hash } from '../seguranca/hash.js';
import { lerSeguro } from '../seguranca/lerSeguro.js';
import { sensivel } from '../seguranca/sensivel.js';
import { Projeto } from './contratos.js';

export async function inventariar(p: Projeto) {
  const arquivos = new Map<string, { path: string; category: string; sha256: string; content: string }>();
  const omitidos: string[] = []; let bytes = 0; let visitados = 0;
  async function visitar(rel: string, category: string, profundidade = 0) {
    if (++visitados > 2000 || profundidade > 20) throw new ErroQa('CONTEXT_LIMIT', 'Inventário excede limite; restrinja os caminhos do contrato.');
    if (sensivel(rel)) { omitidos.push(rel); return; }
    const alvo = await caminhoSeguro(p.raiz, rel);
    const st = await fs.stat(alvo);
    if (st.isDirectory()) {
      for (const nome of (await fs.readdir(alvo)).sort()) await visitar(path.join(rel, nome), category, profundidade + 1);
    } else if (st.isFile()) {
      if (arquivos.has(rel)) return;
      if (!/\.(?:md|txt|json|[cm]?js|tsx?|html|css|yml|yaml|feature|rb|py|java|cs|go|sql)$/i.test(rel)) { omitidos.push(rel); return; }
      if (st.size > 262144) { omitidos.push(rel); return; }
      const content = await lerSeguro(p.raiz, rel); bytes += Buffer.byteLength(content);
      if (bytes > 8388608) throw new ErroQa('CONTEXT_LIMIT', 'Contexto excede 8 MiB. Restrinja o manifesto.');
      arquivos.set(rel, { path: rel, category, sha256: hash(content), content });
    }
  }
  for (const [cat, caminhos] of Object.entries(p.manifesto.context)) for (const rel of caminhos) await visitar(rel, cat);
  return { fontes: [...arquivos.values()], omitidos };
}
