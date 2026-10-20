/** Lê todos os contextos do projeto e anota os arquivos com problema. */
import fs from 'node:fs';
import { ErroQa } from '../../compartilhado/erros.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { lerArquivoDeContexto } from './arquivosDeContexto.js';
import { pastaContextos } from './arquivosDeContexto.js';
import { Arquivo, limites } from '../tipos/contexto.js';

export function carregarTodosOsContextos(p: Projeto, base?: string) {
  const dir = pastaContextos(p, base); const itens: { arq: Arquivo; integro: boolean }[] = []; const problemas: { id: string; code: string }[] = [];
  let nomes: string[] = []; try { nomes = fs.readdirSync(dir).filter(n => /^[0-9a-f-]{36}\.json$/.test(n)); } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
  if (nomes.length > limites.contextos) throw new ErroQa('CONTEXT_LIMIT', `Mais de ${limites.contextos} contextos no projeto.`);
  for (const n of nomes) { try { const r = lerArquivoDeContexto(dir, n.slice(0, -5)); if (r.arq.projectId !== hash(p.manifesto.id)) throw new Error('outro projeto'); itens.push(r); } catch { problemas.push({ id: n.slice(0, -5), code: 'CONTEXT_FILE_INVALID' }); } }
  return { dir, itens, problemas };
}
