/** Leitura de contextos locais com validação de integridade e vínculo ao projeto. */
import fs from 'node:fs';
import { ErroQa } from '../../compartilhado/erros.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { Projeto } from '../../compartilhado/projeto/contratos.js';
import { lerArquivoDeContexto, pastaContextos } from './arquivosDeContexto.js';
import { Arquivo, limites } from '../tipos/contexto.js';

/** Um contexto só pertence ao projeto quando o hash do seu identificador corresponde. */
export function carregarContexto(projeto: Projeto, id: string, base?: string) {
  const dir = pastaContextos(projeto, base);
  let resultado: ReturnType<typeof lerArquivoDeContexto>;

  try {
    resultado = lerArquivoDeContexto(dir, id);
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ErroQa('CONTEXT_NOT_FOUND', 'Contexto não encontrado neste projeto.');
    }
    throw erro;
  }

  if (resultado.arq.projectId !== hash(projeto.manifesto.id)) {
    throw new ErroQa('CONTEXT_NOT_FOUND', 'Contexto não encontrado neste projeto.');
  }
  return { dir, ...resultado };
}

/** Lista os contextos íntegros; arquivos inválidos entram em problemas, não no resultado. */
export function carregarTodosOsContextos(projeto: Projeto, base?: string) {
  const dir = pastaContextos(projeto, base);
  const itens: { arq: Arquivo; integro: boolean }[] = [];
  const problemas: { id: string; code: string }[] = [];

  let nomes: string[] = [];
  try {
    nomes = fs.readdirSync(dir).filter(nome => /^[0-9a-f-]{36}\.json$/.test(nome));
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code !== 'ENOENT') throw erro;
  }

  if (nomes.length > limites.contextos) {
    throw new ErroQa('CONTEXT_LIMIT', 'Mais de ' + limites.contextos + ' contextos no projeto.');
  }

  for (const nome of nomes) {
    const id = nome.slice(0, -5);
    try {
      const resultado = lerArquivoDeContexto(dir, id);
      if (resultado.arq.projectId !== hash(projeto.manifesto.id)) {
        throw new Error('outro projeto');
      }
      itens.push(resultado);
    } catch {
      problemas.push({ id, code: 'CONTEXT_FILE_INVALID' });
    }
  }

  return { dir, itens, problemas };
}
