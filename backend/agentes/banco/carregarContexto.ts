/** Abre um contexto deste projeto pelo id, recusando contextos de outro projeto. */
import { ErroQa } from '../../compartilhado/erros.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { lerArquivoDeContexto } from './arquivosDeContexto.js';
import { pastaContextos } from './arquivosDeContexto.js';

export const carregarContexto = (p: Projeto, id: string, base?: string) => { const dir = pastaContextos(p, base); let r; try { r = lerArquivoDeContexto(dir, id); } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new ErroQa('CONTEXT_NOT_FOUND', 'Contexto não encontrado neste projeto.'); throw e; } if (r.arq.projectId !== hash(p.manifesto.id)) throw new ErroQa('CONTEXT_NOT_FOUND', 'Contexto não encontrado neste projeto.'); return { dir, ...r }; };
